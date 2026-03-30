// HomeTab.jsx
import React, { useEffect, useState } from 'react';
import { Camera, MessageCircle, BarChart3, Shield, CloudSun, Newspaper, RefreshCw } from 'lucide-react';

const BACKEND_API_BASE_URL =
  import.meta.env.VITE_CORE_API_BASE_URL ||
  'http://localhost:8000';

const FeatureCard = ({ icon, title, description, language }) => (
  <div className="feature-card">
    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2 tracking-tight">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

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
  80: 'Rain showers',
  95: 'Thunderstorm'
};

const getWeatherEmoji = (condition = '') => {
  const value = condition.toLowerCase();
  if (value.includes('thunder')) return '⛈️';
  if (value.includes('rain') || value.includes('drizzle')) return '🌧️';
  if (value.includes('fog')) return '🌫️';
  if (value.includes('cloud')) return '⛅';
  return '☀️';
};

const getRainOutlook = (chance) => {
  if (typeof chance !== 'number') return 'Unknown';
  if (chance >= 70) return 'High rain chance';
  if (chance >= 40) return 'Moderate rain chance';
  return 'Low rain chance';
};

const formatDayShort = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
};

const HomeTab = ({ currentTexts, projectInfo, language, setActiveTab }) => {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const [weatherSource, setWeatherSource] = useState('');
  const [cityQuery, setCityQuery] = useState('Sehore');

  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState('');

  const fetchRainPrediction = async (targetCity) => {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    const location = geoData?.results?.[0];
    if (!location) throw new Error('City not found');

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=precipitation_probability_max&timezone=auto&forecast_days=3`
    );
    if (!forecastRes.ok) throw new Error('Rain prediction unavailable');

    const forecastData = await forecastRes.json();
    const dates = Array.isArray(forecastData?.daily?.time) ? forecastData.daily.time : [];
    const chances = Array.isArray(forecastData?.daily?.precipitation_probability_max)
      ? forecastData.daily.precipitation_probability_max
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

  const fetchWeather = async (targetCity = cityQuery) => {
    setWeatherLoading(true);
    setWeatherError('');

    try {
      const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/v1/weather/current-weather/${encodeURIComponent(targetCity)}`);
      if (!backendRes.ok) throw new Error('Backend weather unavailable');

      const data = await backendRes.json();
      let rainChance = null;
      try {
        const rainInfo = await fetchRainPrediction(data.city || targetCity);
        rainChance = rainInfo.chance;
      } catch (_) {
        // Keep weather response usable even if rain prediction fails.
      }

      setWeather({
        city: data.city || targetCity,
        temperature: data.temperature,
        humidity: data.humidity,
        windSpeed: data.wind_speed,
        condition: 'Live weather',
        rainChance,
        rainForecast: rainInfo.nextDays || []
      });
      setWeatherSource('backend');
      setWeatherLoading(false);
      return;
    } catch (_) {
      // Fallback to live public weather if backend is unavailable.
    }

    try {
      const rainInfo = await fetchRainPrediction(targetCity);
      const location = rainInfo.location;
      if (!location) throw new Error('City not found');

      const openMeteoRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );
      if (!openMeteoRes.ok) throw new Error('Weather provider unavailable');

      const openMeteoData = await openMeteoRes.json();
      const current = openMeteoData?.current;

      setWeather({
        city: location.name || 'Sehore',
        temperature: current?.temperature_2m,
        humidity: current?.relative_humidity_2m,
        windSpeed: current?.wind_speed_10m,
        condition: weatherCodeMap[current?.weather_code] || 'Current weather',
        rainChance: rainInfo.chance,
        rainForecast: rainInfo.nextDays || []
      });
      setWeatherSource('open-meteo');
    } catch (error) {
      setWeather(null);
      setWeatherError(language === 'hindi' ? 'मौसम डेटा उपलब्ध नहीं है।' : 'Weather data is unavailable right now.');
      setWeatherSource('');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError('');

    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/api/news/latest?limit=4`);
      if (!response.ok) throw new Error('News provider unavailable');

      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items.slice(0, 4) : [];
      if (!items.length) throw new Error('No news found');

      setNewsItems(items);
    } catch (error) {
      setNewsItems([]);
      setNewsError(language === 'hindi' ? 'अभी समाचार लोड नहीं हो पाए।' : 'Unable to load latest news right now.');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    fetchNews();
  }, []);

  const handleWeatherSearch = () => {
    const value = cityQuery.trim();
    if (!value) return;
    fetchWeather(value);
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white p-6 md:p-12 shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_25%),radial-gradient(circle_at_80%_30%,white,transparent_25%),radial-gradient(circle_at_40%_80%,white,transparent_25%)]" />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm">{language === 'hindi' ? 'AI आधारित कृषि सहायता' : 'AI-powered Farming Assistant'}</span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{currentTexts.title}</h1>
          <p className="mt-3 md:mt-4 text-white/90 text-base md:text-lg">{currentTexts.subtitle}</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setActiveTab && setActiveTab('detection')} className="btn-primary w-full sm:w-auto">
              <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" /> {language === 'hindi' ? 'डिटेक्शन शुरू करें' : 'Start Detection'}</span>
            </button>
            <button onClick={() => setActiveTab && setActiveTab('chatbot')} className="btn-secondary w-full sm:w-auto">
              <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {language === 'hindi' ? 'सहायक से पूछें' : 'Ask Assistant'}</span>
            </button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/15 rounded-lg p-3">
              <div className="font-semibold">99.5%</div>
              <div className="text-white/85">{language === 'hindi' ? 'संतुष्टि' : 'Satisfaction'}</div>
            </div>
            <div className="bg-white/15 rounded-lg p-3">
              <div className="font-semibold">10k+</div>
              <div className="text-white/85">{language === 'hindi' ? 'छवियाँ विश्लेषित' : 'Images Analyzed'}</div>
            </div>
            <div className="bg-white/15 rounded-lg p-3">
              <div className="font-semibold">24/7</div>
              <div className="text-white/85">{language === 'hindi' ? 'सहायता' : 'Support'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-blue-100 shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-sky-500" />
                {language === 'hindi' ? 'मौसम अपडेट' : 'Weather Update'}
              </h3>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWeatherSearch();
                }}
                placeholder={language === 'hindi' ? 'शहर खोजें...' : 'Search city...'}
                className="input h-9 text-sm"
              />
              <button
                type="button"
                onClick={handleWeatherSearch}
                className="inline-flex h-9 items-center gap-1 rounded-md bg-sky-50 text-sky-700 px-3 text-xs font-medium hover:bg-sky-100"
              >
                {language === 'hindi' ? 'खोजें' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => fetchWeather(cityQuery)}
                className="inline-flex h-9 items-center gap-1 rounded-md bg-sky-50 text-sky-700 px-2 text-xs font-medium hover:bg-sky-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {weatherLoading ? (
              <p className="text-sm text-gray-500">{language === 'hindi' ? 'मौसम लोड हो रहा है...' : 'Loading weather...'}</p>
            ) : weatherError ? (
              <p className="text-sm text-red-600">{weatherError}</p>
            ) : weather ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
                  <div className="text-xs text-gray-600">{weather.city}</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {getWeatherEmoji(weather.condition)} {Math.round(weather.temperature)}°C
                  </div>
                  <div className="text-xs text-gray-600">{weather.condition}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-gray-100 p-2">💧 {language === 'hindi' ? 'नमी' : 'Humidity'}: <span className="font-semibold">{weather.humidity}%</span></div>
                  <div className="rounded-md border border-gray-100 p-2">🍃 {language === 'hindi' ? 'हवा' : 'Wind'}: <span className="font-semibold">{weather.windSpeed} km/h</span></div>
                </div>
                <div className="rounded-md border border-sky-100 bg-sky-50 p-2 text-xs text-gray-700">
                  🌦️ {language === 'hindi' ? 'बारिश संभावना' : 'Rain prediction'}:{' '}
                  <span className="font-semibold">
                    {typeof weather.rainChance === 'number' ? `${weather.rainChance}%` : 'N/A'}
                  </span>{' '}
                  <span className="text-gray-500">({getRainOutlook(weather.rainChance)})</span>
                </div>
                {Array.isArray(weather.rainForecast) && weather.rainForecast.length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-gray-600">
                      {language === 'hindi' ? 'अगले 3 दिन की बारिश' : 'Next 3 days rain'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {weather.rainForecast.slice(0, 3).map((day, index) => (
                        <div key={`${day.date}-${index}`} className="rounded-md border border-sky-100 bg-white p-2 text-center">
                          <div className="text-gray-500">{formatDayShort(day.date)}</div>
                          <div className="mt-1 font-semibold text-sky-700">{typeof day.chance === 'number' ? `${day.chance}%` : 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-[11px] text-gray-500">
                  {language === 'hindi' ? 'स्रोत:' : 'Source:'} {weatherSource === 'backend' ? (language === 'hindi' ? 'आपका बैकएंड' : 'Your backend') : 'Open-Meteo'}
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-emerald-600" />
                {language === 'hindi' ? 'ताज़ा कृषि समाचार' : 'Latest Agri News'}
              </h3>
              <button
                type="button"
                onClick={fetchNews}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 px-2 py-1 text-xs font-medium hover:bg-emerald-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {language === 'hindi' ? 'रिफ्रेश' : 'Refresh'}
              </button>
            </div>

            {newsLoading ? (
              <p className="text-sm text-gray-500">{language === 'hindi' ? 'समाचार लोड हो रहे हैं...' : 'Loading news...'}</p>
            ) : newsError ? (
              <p className="text-sm text-red-600">{newsError}</p>
            ) : (
              <div className="space-y-2">
                {newsItems.map((item, index) => (
                  <a
                    key={`${item.url || item.title}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-emerald-100 p-2 hover:bg-emerald-50"
                  >
                    <p className="text-sm text-gray-800 line-clamp-2">{item.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}
                      {item.source ? ` • ${item.source}` : ''}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<Camera className="h-6 w-6 text-blue-600" />}
          title={currentTexts.features.detection}
          description={language === 'hindi' ? 'उन्नत AI तकनीक से तत्काल बीमारी पहचान' : 'Instant disease identification using advanced AI technology'}
          language={language}
        />
        <FeatureCard
          icon={<MessageCircle className="h-6 w-6 text-green-600" />}
          title={currentTexts.features.chat}
          description={language === 'hindi' ? '24/7 उपलब्ध स्मार्ट सहायक' : '24/7 available smart assistant'}
          language={language}
        />
        <FeatureCard
          icon={<BarChart3 className="h-6 w-6 text-teal-600" />}
          title={currentTexts.features.analytics}
          description={language === 'hindi' ? 'विस्तृत डेटा विश्लेषण और रिपोर्ट्स' : 'Detailed data analysis and reports'}
          language={language}
        />
        <FeatureCard
          icon={<Shield className="h-6 w-6 text-purple-600" />}
          title={language === 'hindi' ? 'फसल सुरक्षा' : 'Crop Protection'}
          description={language === 'hindi' ? 'निवारक उपायों की सिफारिश' : 'Preventive measures recommendations'}
          language={language}
        />
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl shadow-xl p-6 md:p-10 border border-blue-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center tracking-tight">
          {language === 'hindi' ? 'सहायक विशेषताएं' : 'Assistant Highlights'} ✨
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">🌾</div>
            <h4 className="font-semibold text-gray-800 mb-1">
              {language === 'hindi' ? 'विशेषज्ञ फसल देखभाल' : 'Expert Crop Care'}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {language === 'hindi' 
                ? 'आपकी फसलों की स्वास्थ्य स्थिति का विश्लेषण करें'
                : 'Analyze your crops health status with precision'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">🤖</div>
            <h4 className="font-semibold text-gray-800 mb-1">
              {language === 'hindi' ? 'एआई सहायता' : 'AI Assistance'}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {language === 'hindi'
                ? '24/7 स्मार्ट कृषि सलाह और समर्थन'
                : '24/7 smart farming advice and support'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-800 mb-1">
              {language === 'hindi' ? 'स्मार्ट विश्लेषण' : 'Smart Analytics'}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {language === 'hindi'
                ? 'डेटा-संचालित खेती अंतर्दृष्टि'
                : 'Data-driven farming insights'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
