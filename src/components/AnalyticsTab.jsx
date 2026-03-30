// AnalyticsTab.jsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, Leaf, AlertTriangle, Trophy, Target, Zap, Award, Globe2, RefreshCw } from 'lucide-react';
import WeatherSection from './WeatherSection';
import { fetchMarketCommodities, fetchMarketPrices } from '../services/marketApi';
import { fetchMyAnalytics, getStoredToken } from '../services/authAnalysisApi';

const FALLBACK_STATE_WISE_CROP_PRICES = [
  {
    state: 'Punjab',
    prices: { Rice: 44, Wheat: 32, Soyabean: null, Potato: 23, Tomato: 34 }
  },
  {
    state: 'Madhya Pradesh',
    prices: { Rice: 40, Wheat: 31, Soyabean: 49, Potato: 24, Tomato: 35 }
  },
  {
    state: 'Maharashtra',
    prices: { Rice: 43, Wheat: 33, Soyabean: 48, Potato: 26, Tomato: 37 }
  },
  {
    state: 'Uttar Pradesh',
    prices: { Rice: 41, Wheat: 30, Soyabean: null, Potato: 22, Tomato: 33 }
  },
  {
    state: 'Karnataka',
    prices: { Rice: 45, Wheat: 34, Soyabean: 47, Potato: 25, Tomato: 36 }
  }
];

const DEFAULT_COMMODITIES = ['Rice', 'Wheat', 'Soyabean', 'Potato', 'Tomato'];

const parsePrice = (record) => {
  const modal = Number(record?.modal_price);
  if (!Number.isNaN(modal) && modal > 0) return modal;

  const max = Number(record?.max_price);
  if (!Number.isNaN(max) && max > 0) return max;

  const min = Number(record?.min_price);
  if (!Number.isNaN(min) && min > 0) return min;

  return null;
};

const parseDateValue = (record) => {
  const raw = record?.arrival_date;
  const time = raw ? new Date(raw).getTime() : Number.NaN;
  return Number.isNaN(time) ? -1 : time;
};

const formatInr = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `INR ${Math.round(value)}`;
};

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${colorClass} tracking-tight`}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const getLatestIndicatorPoint = (records) => {
  if (!Array.isArray(records)) return null;
  return records.find((item) => item && item.value !== null && item.value !== undefined);
};

const formatPercent = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return `${value.toFixed(1)}%`;
};

const AnalyticsTab = ({ language }) => {
  const [agriIndicators, setAgriIndicators] = useState(null);
  const [indicatorState, setIndicatorState] = useState({ loading: true, error: '' });
  const [cropPrices, setCropPrices] = useState(FALLBACK_STATE_WISE_CROP_PRICES);
  const [selectedCommodities, setSelectedCommodities] = useState(DEFAULT_COMMODITIES);
  const [commodityQuery, setCommodityQuery] = useState('');
  const [commoditySuggestions, setCommoditySuggestions] = useState(DEFAULT_COMMODITIES);
  const [priceState, setPriceState] = useState({
    loading: true,
    error: '',
    source: 'fallback',
    updatedAt: null
  });
  const [personalAnalytics, setPersonalAnalytics] = useState({ total_scans: 0, healthy_plants: 0, diseased_plants: 0 });
  const [personalAnalyticsState, setPersonalAnalyticsState] = useState({ loading: true, error: '' });

  const fetchIndicators = async () => {
    setIndicatorState({ loading: true, error: '' });

    try {
      const [agriGdpRes, agriLandRes, ruralRes] = await Promise.all([
        fetch('https://api.worldbank.org/v2/country/IN/indicator/NV.AGR.TOTL.ZS?format=json&per_page=80'),
        fetch('https://api.worldbank.org/v2/country/IN/indicator/AG.LND.AGRI.ZS?format=json&per_page=80'),
        fetch('https://api.worldbank.org/v2/country/IN/indicator/SP.RUR.TOTL.ZS?format=json&per_page=80')
      ]);

      if (!agriGdpRes.ok || !agriLandRes.ok || !ruralRes.ok) {
        throw new Error('Failed to fetch live indicators.');
      }

      const [agriGdpJson, agriLandJson, ruralJson] = await Promise.all([
        agriGdpRes.json(),
        agriLandRes.json(),
        ruralRes.json()
      ]);

      setAgriIndicators({
        agriGdp: getLatestIndicatorPoint(agriGdpJson?.[1]),
        agriLand: getLatestIndicatorPoint(agriLandJson?.[1]),
        ruralPopulation: getLatestIndicatorPoint(ruralJson?.[1])
      });
      setIndicatorState({ loading: false, error: '' });
    } catch (error) {
      setAgriIndicators(null);
      setIndicatorState({ loading: false, error: error.message || 'Unable to load live data.' });
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchPersonalStatsData = async () => {
    setPersonalAnalyticsState({ loading: true, error: '' });
    try {
      const token = getStoredToken();
      if (!token) {
        setPersonalAnalyticsState({
          loading: false,
          error: 'Not authenticated. Please log in.'
        });
        return;
      }
      
      const data = await fetchMyAnalytics(token);
      setPersonalAnalytics(data);
      setPersonalAnalyticsState({ loading: false, error: '' });
    } catch (error) {
      setPersonalAnalyticsState({
        loading: false,
        error: error?.message || 'Unable to load your analytics.'
      });
    }
  };

  useEffect(() => {
    fetchPersonalStatsData();
    
    // Auto-refresh personal stats every 15 seconds
    const intervalId = setInterval(fetchPersonalStatsData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadCommoditySuggestions = async () => {
      try {
        const data = await fetchMarketCommodities('', 40);
        const items = Array.isArray(data?.items) ? data.items : [];
        if (items.length) {
          setCommoditySuggestions(items);
        }
      } catch (_) {
        setCommoditySuggestions(DEFAULT_COMMODITIES);
      }
    };

    loadCommoditySuggestions();
  }, []);

  useEffect(() => {
    const query = commodityQuery.trim();
    if (!query) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchMarketCommodities(query, 20);
        setCommoditySuggestions(Array.isArray(data?.items) ? data.items : []);
      } catch (_) {
        setCommoditySuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [commodityQuery]);

  useEffect(() => {
    const fetchLiveCropPrices = async () => {
      setPriceState((prev) => ({ ...prev, loading: true, error: '' }));

      try {
        const data = await fetchMarketPrices({ commodities: selectedCommodities });
        const livePrices = Array.isArray(data?.items) ? data.items : [];
        const hasLiveValue = livePrices.some((row) =>
          selectedCommodities.some((commodity) => typeof row?.prices?.[commodity] === 'number')
        );

        if (!hasLiveValue) {
          throw new Error('Live mandi data returned no usable prices for selected commodities.');
        }

        setCropPrices(livePrices);
        setPriceState({ loading: false, error: '', source: 'live', updatedAt: new Date() });
      } catch (error) {
        setCropPrices(FALLBACK_STATE_WISE_CROP_PRICES);
        setPriceState({
          loading: false,
          error: error?.message || 'Unable to load live mandi prices.',
          source: 'fallback',
          updatedAt: null
        });
      }
    };

    fetchLiveCropPrices();
  }, [selectedCommodities]);

  const addCommodity = (commodityName) => {
    const value = String(commodityName || '').trim();
    if (!value) return;
    if (selectedCommodities.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setCommodityQuery('');
      return;
    }

    setSelectedCommodities((prev) => [...prev, value]);
    setCommodityQuery('');
  };

  const removeCommodity = (commodityName) => {
    setSelectedCommodities((prev) => {
      const next = prev.filter((item) => item.toLowerCase() !== commodityName.toLowerCase());
      return next.length ? next : DEFAULT_COMMODITIES;
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="section-title text-center">
        {language === 'hindi' ? 'डेटा विश्लेषण डैशबोर्ड' : 'Data Analytics Dashboard'}
      </h2>

      {/* Personal Analytics Summary Card */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">
              {language === 'hindi' ? 'आपका विश्लेषण' : 'Your Analytics'}
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchPersonalStatsData}
            disabled={personalAnalyticsState.loading}
            className="rounded-lg bg-indigo-100 p-2 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Refresh personal analytics"
          >
            <RefreshCw className={`h-5 w-5 ${personalAnalyticsState.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {personalAnalyticsState.error && (
          <p className="mb-3 text-xs text-red-700">{personalAnalyticsState.error}</p>
        )}

        {personalAnalyticsState.loading ? (
          <p className="text-center text-gray-600">{language === 'hindi' ? 'लोड हो रहा है...' : 'Loading...'}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 text-center">
              <p className="text-xs font-semibold text-gray-600 mb-2">{language === 'hindi' ? 'कुल स्कैन' : 'Total Scans'}</p>
              <p className="text-3xl font-bold text-blue-600">{personalAnalytics.total_scans}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 border border-green-100 text-center">
              <p className="text-xs font-semibold text-gray-600 mb-2">{language === 'hindi' ? 'स्वस्थ' : 'Healthy'}</p>
              <p className="text-3xl font-bold text-green-600">{personalAnalytics.healthy_plants}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 border border-red-100 text-center">
              <p className="text-xs font-semibold text-gray-600 mb-2">{language === 'hindi' ? 'बीमार' : 'Diseased'}</p>
              <p className="text-3xl font-bold text-red-600">{personalAnalytics.diseased_plants}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            {language === 'hindi' ? 'राज्यवार फसल मूल्य (अनुमानित)' : 'State-wise Crop Prices (Approx.)'}
          </h3>
          <span className="text-xs font-medium text-emerald-700">
            {language === 'hindi' ? 'दर: INR/किलो' : 'Rate: INR/100kg'}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${priceState.source === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {priceState.loading
              ? (language === 'hindi' ? 'लोड हो रहा है...' : 'Loading...')
              : priceState.source === 'live'
                ? (language === 'hindi' ? 'Live Mandi API' : 'Live Mandi API')
                : (language === 'hindi' ? 'Fallback Data' : 'Fallback Data')}
          </span>
          {priceState.updatedAt && (
            <span className="text-gray-500">
              {language === 'hindi' ? 'अपडेट:' : 'Updated:'} {priceState.updatedAt.toLocaleString()}
            </span>
          )}
        </div>

        {priceState.error && (
          <p className="mb-3 text-xs text-amber-700">{priceState.error}</p>
        )}

        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {language === 'hindi' ? 'कमोडिटी सर्च' : 'Commodity Search'}
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={commodityQuery}
              onChange={(event) => setCommodityQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCommodity(commodityQuery);
                }
              }}
              placeholder={language === 'hindi' ? 'कमोडिटी नाम लिखें (जैसे Rice)' : 'Type commodity name (e.g. Rice)'}
              className="input h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => addCommodity(commodityQuery)}
              className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {language === 'hindi' ? 'जोड़ें' : 'Add'}
            </button>
          </div>

          {commoditySuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {commoditySuggestions.slice(0, 12).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addCommodity(item)}
                  className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCommodities.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {item}
                <button
                  type="button"
                  onClick={() => removeCommodity(item)}
                  className="rounded-full bg-emerald-200 px-1 text-[10px] leading-4 text-emerald-900 hover:bg-emerald-300"
                  aria-label={`Remove ${item}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-white">
          <div className="max-h-[520px] overflow-auto overscroll-contain">
            <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-emerald-800">
                <th className="sticky left-0 top-0 z-30 bg-emerald-50 px-3 py-2">{language === 'hindi' ? 'राज्य' : 'State'}</th>
                {selectedCommodities.map((commodity) => (
                  <th key={commodity} className="sticky top-0 z-20 bg-emerald-50 px-3 py-2">{commodity}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cropPrices.map((item) => (
                <tr key={item.state} className="border-t border-emerald-100 text-sm text-gray-700 odd:bg-white even:bg-emerald-50/30">
                  <td className="sticky left-0 z-10 border-r border-emerald-100 bg-inherit px-3 py-2 font-semibold text-gray-800">{item.state}</td>
                  {selectedCommodities.map((commodity) => (
                    <td key={`${item.state}-${commodity}`} className="px-3 py-2">
                      {formatInr(item?.prices?.[commodity])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
              {language === 'hindi' ? 'प्रगति रिपोर्ट' : 'Progress Report'}
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{language === 'hindi' ? 'इस महीने की प्रगति' : 'This Month Progress'}</p>
                <span className="text-xs font-semibold text-blue-600">75%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{language === 'hindi' ? 'बीमारी की पहचान दर' : 'Disease Detection Rate'}</p>
                <span className="text-xs font-semibold text-green-600">92%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{language === 'hindi' ? 'पौधों का स्वास्थ्य सुधार' : 'Plant Health Improvement'}</p>
                <span className="text-xs font-semibold text-amber-600">68%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs text-gray-500 mb-3 uppercase font-semibold">{language === 'hindi' ? 'मुख्य मेट्रिक्स' : 'Key Metrics'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                  <p className="text-xs text-gray-600">{language === 'hindi' ? 'औसत सटीकता' : 'Avg Accuracy'}</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">94.2%</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 border border-green-100">
                  <p className="text-xs text-gray-600">{language === 'hindi' ? 'निर्भरता दर' : 'Reliability'}</p>
                  <p className="text-lg font-bold text-green-700 mt-1">89.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-600" />
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{language === 'hindi' ? 'उपलब्धियाँ' : 'Achievements'}</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
              <div className="mb-2 flex items-start gap-3">
                <Award className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{language === 'hindi' ? 'रोग विशेषज्ञ स्तर 1' : 'Plant Expert Level 1'}</p>
                  <p className="text-xs text-gray-600 mt-1">{language === 'hindi' ? '50 पौधों को सफलतापूर्वक स्कैन किया' : 'Successfully scanned 50 plants'}</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
              <div className="mb-2 flex items-start gap-3">
                <Zap className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{language === 'hindi' ? 'सप्ताह का धारक' : 'Weekly Streak'}</p>
                  <p className="text-xs text-gray-600 mt-1">{language === 'hindi' ? '4 सप्ताह पूर्ण - गतिविधि जारी रखें' : '4 weeks complete - keep the momentum'}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-teal-700 mt-3">🔥 Week 4/12</p>
            </div>

            <div className="rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <div className="mb-2 flex items-start gap-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{language === 'hindi' ? 'बचाव विशेषज्ञ' : 'Disease Savior'}</p>
                  <p className="text-xs text-gray-600 mt-1">{language === 'hindi' ? '12 पौधों को बीमारी से बचाया' : 'Recovered 12 infected plants'}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-green-700 mt-3">{language === 'hindi' ? 'अगला लक्ष्य: 25 पौधे' : 'Next Target: 25 plants'}</p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-4">
              <div className="mb-2 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{language === 'hindi' ? 'सर्वश्रेष्ठ प्रदर्शन' : 'Top Performer'}</p>
                  <p className="text-xs text-gray-600 mt-1">{language === 'hindi' ? 'पिछले 30 दिनों में शीर्ष 5% में' : 'Top 5% in last 30 days'}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-blue-700 mt-3">⭐ Rank: #547</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <WeatherSection language={language} />

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-teal-600" />
            <h3 className="text-xl font-semibold text-gray-800 tracking-tight">{language === 'hindi' ? 'लाइव कृषि डेटा (भारत)' : 'Live Agriculture Data (India)'}</h3>
          </div>

          {indicatorState.loading ? (
            <p className="text-sm text-gray-500">{language === 'hindi' ? 'लाइव डेटा लोड हो रहा है...' : 'Loading live data...'}</p>
          ) : indicatorState.error ? (
            <p className="text-sm text-red-600">{indicatorState.error}</p>
          ) : agriIndicators ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <p className="text-xs text-gray-600">{language === 'hindi' ? 'कृषि का GDP में योगदान' : 'Agriculture value added (% of GDP)'}</p>
                <p className="mt-1 text-lg font-semibold text-green-700">{formatPercent(agriIndicators.agriGdp?.value)}</p>
                <p className="text-xs text-gray-500">{language === 'hindi' ? 'वर्ष' : 'Year'}: {agriIndicators.agriGdp?.date || 'N/A'} (World Bank)</p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-gray-600">{language === 'hindi' ? 'कुल भूमि में कृषि भूमि' : 'Agricultural land (% of land area)'}</p>
                <p className="mt-1 text-lg font-semibold text-blue-700">{formatPercent(agriIndicators.agriLand?.value)}</p>
                <p className="text-xs text-gray-500">{language === 'hindi' ? 'वर्ष' : 'Year'}: {agriIndicators.agriLand?.date || 'N/A'} (World Bank)</p>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs text-gray-600">{language === 'hindi' ? 'ग्रामीण आबादी' : 'Rural population (% of total)'}</p>
                <p className="mt-1 text-lg font-semibold text-amber-700">{formatPercent(agriIndicators.ruralPopulation?.value)}</p>
                <p className="text-xs text-gray-500">{language === 'hindi' ? 'वर्ष' : 'Year'}: {agriIndicators.ruralPopulation?.date || 'N/A'} (World Bank)</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
