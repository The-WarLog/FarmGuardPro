// WeatherSection.jsx
import React, { useEffect, useState } from 'react';
import { RefreshCw, Droplets, Wind, Globe2 } from 'lucide-react';
import { WEATHER_ENDPOINT } from '../constants/apiConfig';

const weatherCodeMap = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm'
};

const formatDayShort = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
};

const getRainOutlook = (chance) => {
  if (typeof chance !== 'number') return 'Unknown';
  if (chance >= 70) return 'High rain chance';
  if (chance >= 40) return 'Moderate rain chance';
  return 'Low rain chance';
};

const WeatherSection = ({ language }) => {
  const [city, setCity] = useState('Sehore');
  const [cityQuery, setCityQuery] = useState('Sehore');
  const [weather, setWeather] = useState(null);
  const [weatherState, setWeatherState] = useState({ loading: true, error: '', source: '' });

  const fetchRainPrediction = async (targetCity) => {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&language=en&format=json`);
    const geoJson = await geoRes.json();
    const location = geoJson?.results?.[0];
    if (!location) throw new Error('City not found for weather lookup.');

    const rainRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=precipitation_probability_max&timezone=auto&forecast_days=3`
    );
    if (!rainRes.ok) throw new Error(`Rain forecast failed (${rainRes.status})`);

    const rainJson = await rainRes.json();
    const dates = Array.isArray(rainJson?.daily?.time) ? rainJson.daily.time : [];
    const chances = Array.isArray(rainJson?.daily?.precipitation_probability_max)
      ? rainJson.daily.precipitation_probability_max
      : [];

    const nextDays = dates.slice(0, 3).map((date, index) => ({
      date,
      chance: typeof chances[index] === 'number' ? chances[index] : null
    }));

    return {
      location,
      chance: typeof nextDays?.[0]?.chance === 'number' ? nextDays[0].chance : null,
      nextDays
    };
  };

  const fetchWeather = async (targetCity) => {
    setWeatherState({ loading: true, error: '', source: '' });

    try {
      const backendRes = await fetch(`${WEATHER_ENDPOINT}/${encodeURIComponent(targetCity)}`);
      if (!backendRes.ok) throw new Error(`Backend weather failed (${backendRes.status})`);
      const backendData = await backendRes.json();

      let rainChance = null;
      let rainForecast = [];
      try {
        const rain = await fetchRainPrediction(backendData.city || targetCity);
        rainChance = rain.chance;
        rainForecast = rain.nextDays || [];
      } catch (_) {
        // Keep backend weather if rain forecast fails.
      }

      setWeather({
        city: backendData.city || targetCity,
        temperature: backendData.temperature,
        humidity: backendData.humidity,
        windSpeed: backendData.wind_speed,
        condition: 'Live weather',
        rainChance,
        rainForecast
      });
      setWeatherState({ loading: false, error: '', source: 'backend' });
      return;
    } catch (err) {
      // Fallback to Open-Meteo
    }

    try {
      const rain = await fetchRainPrediction(targetCity);
      const location = rain.location;

      if (!location) {
        throw new Error('City not found for weather lookup.');
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );
      if (!weatherRes.ok) {
        throw new Error(`Open-Meteo failed (${weatherRes.status})`);
      }

      const weatherJson = await weatherRes.json();
      const current = weatherJson?.current;

      setWeather({
        city: `${location.name}${location.country ? `, ${location.country}` : ''}`,
        temperature: current?.temperature_2m,
        humidity: current?.relative_humidity_2m,
        windSpeed: current?.wind_speed_10m,
        condition: weatherCodeMap[current?.weather_code] || 'Current weather',
        rainChance: rain.chance,
        rainForecast: rain.nextDays || []
      });
      setWeatherState({ loading: false });
    } catch (error) {
      setWeather(null);
      setWeatherState({ loading: false, error: error.message || 'Unable to load weather.', source: '' });
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleCitySearch = () => {
    const value = cityQuery.trim();
    if (!value) return;
    setCity(value);
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-800 tracking-tight">
          {language === 'hindi' ? 'लाइव मौसम अपडेट' : 'Live Weather Update'}
        </h3>
        <button
          type="button"
          onClick={() => fetchWeather(city)}
          className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          <RefreshCw className="h-4 w-4" />
          {language === 'hindi' ? 'रिफ्रेश' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['Sehore', 'Bhopal', 'Delhi'].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCity(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${city === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCitySearch();
          }}
          placeholder={language === 'hindi' ? 'शहर खोजें...' : 'Search city...'}
          className="input h-10 text-sm"
        />
        <button
          type="button"
          onClick={handleCitySearch}
          className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
        >
          {language === 'hindi' ? 'खोजें' : 'Search'}
        </button>
      </div>

      {weatherState.loading ? (
        <p className="text-sm text-gray-500">{language === 'hindi' ? 'मौसम डेटा लोड हो रहा है...' : 'Loading weather data...'}</p>
      ) : weatherState.error ? (
        <p className="text-sm text-red-600">{weatherState.error}</p>
      ) : weather ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50 p-4">
            <p className="text-sm text-gray-600">{weather.city}</p>
            <p className="mt-1 text-3xl font-bold text-blue-700">{Math.round(weather.temperature)}°C</p>
            <p className="text-sm text-gray-700">{weather.condition}</p>
            <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${weatherState.source === 'backend' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {weatherState.source === 'backend'
                ? (language === 'hindi' ? 'सोर्स: आपका बैकएंड' : 'Source: your backend')
                : (language === 'hindi' ? 'सोर्स: लाइव Open-Meteo' : 'Source: live Open-Meteo')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs text-gray-500">{language === 'hindi' ? 'नमी' : 'Humidity'}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-gray-800"><Droplets className="h-4 w-4 text-blue-500" /> {weather.humidity}%</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs text-gray-500">{language === 'hindi' ? 'हवा की गति' : 'Wind Speed'}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-gray-800"><Wind className="h-4 w-4 text-teal-500" /> {weather.windSpeed} km/h</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-gray-500">{language === 'hindi' ? 'बारिश पूर्वानुमान' : 'Rain prediction'}</p>
            <p className="mt-1 text-lg font-semibold text-blue-700">🌦️ {typeof weather.rainChance === 'number' ? `${weather.rainChance}%` : 'N/A'}</p>
            <p className="text-xs text-gray-600">{getRainOutlook(weather.rainChance)}</p>
          </div>

          {Array.isArray(weather.rainForecast) && weather.rainForecast.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-gray-600">{language === 'hindi' ? 'अगले 3 दिन' : 'Next 3 days'}</p>
              <div className="grid grid-cols-3 gap-2">
                {weather.rainForecast.slice(0, 3).map((day, index) => (
                  <div key={`${day.date}-${index}`} className="rounded-lg border border-blue-100 bg-white p-2 text-center">
                    <p className="text-[11px] text-gray-500">{formatDayShort(day.date)}</p>
                    <p className="mt-1 text-sm font-semibold text-blue-700">{typeof day.chance === 'number' ? `${day.chance}%` : 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default WeatherSection;
