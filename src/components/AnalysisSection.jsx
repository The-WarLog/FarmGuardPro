// AnalysisSection.jsx
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { PREDICT_ENDPOINT, PREDICT_ENDPOINT_V1 } from '../constants/apiConfig';

const getLastTwoWords = (text) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  return words.slice(-2).join(' ');
};

const INDIAN_CROP_PRICES = [
  { key: 'rice', nameEn: 'Rice', nameHi: 'चावल', price: 42 },
  { key: 'wheat', nameEn: 'Wheat', nameHi: 'गेहूं', price: 31 },
  { key: 'soybean', nameEn: 'Soybean', nameHi: 'सोयाबीन', price: 48 },
  { key: 'potato', nameEn: 'Potato', nameHi: 'आलू', price: 24 },
  { key: 'tomato', nameEn: 'Tomato', nameHi: 'टमाटर', price: 36 }
];

const AnalysisSection = ({ language }) => {
  const [analysisImage, setAnalysisImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [cropName, setCropName] = useState('');

  const parseTopPrediction = (data) => {
    if (!Array.isArray(data?.analysis) || !data.analysis.length) {
      return null;
    }

    const sorted = [...data.analysis]
      .filter((item) => item && typeof item.label === 'string' && typeof item.score === 'number')
      .sort((a, b) => b.score - a.score);

    return sorted[0] || null;
  };

  const requestPrediction = async (formData) => {
    const endpoints = [PREDICT_ENDPOINT, PREDICT_ENDPOINT_V1];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          mode: 'cors'
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const top = parseTopPrediction(data);

        if (!top) {
          throw new Error('Invalid response format');
        }

        return top;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Prediction request failed');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setAnalysisError(language === 'hindi' ? 'कृपया एक छवि फ़ाइल चुनें' : 'Please select an image file');
      return;
    }

    // Show image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAnalysisImage(event.target.result);
    };
    reader.readAsDataURL(file);

    // Send to backend for analysis
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const normalizedCropName = cropName.trim();
      if (normalizedCropName) {
        formData.append('cropName', normalizedCropName);
      }

      const topResult = await requestPrediction(formData);
      setAnalysisResult({
        label: topResult.label,
        score: (topResult.score * 100).toFixed(1),
        lastTwoWords: getLastTwoWords(topResult.label),
        cropName: normalizedCropName
      });
    } catch (error) {
      const fallbackError = language === 'hindi'
        ? 'विश्लेषण विफल रहा. Azure endpoint/CORS जांचें।'
        : 'Analysis failed. Check Azure endpoint/CORS settings.';
      setAnalysisError(error.message || fallbackError);
      setAnalysisResult(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const clearImageAnalysis = () => {
    setAnalysisImage(null);
    setAnalysisResult(null);
    setAnalysisError('');
  };

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center gap-3">
        <Upload className="h-6 w-6 text-green-600" />
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
          {language === 'hindi' ? 'तुरंत विश्लेषण' : 'Quick Analysis'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {language === 'hindi' ? 'फसल/सब्जी का नाम' : 'Crop / Vegetable Name'}
          </label>
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder={language === 'hindi' ? 'उदाहरण: टमाटर, आलू, मिर्च' : 'Example: Tomato, Potato, Chili'}
            className="w-full rounded-lg border border-green-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 mb-4"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {language === 'hindi' ? 'पत्ती की तस्वीर अपलोड करें' : 'Upload Leaf Image'}
          </label>
          {!analysisImage ? (
            <div className="relative border-2 border-dashed border-green-300 rounded-lg p-6 text-center bg-green-50 hover:bg-green-100 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {language === 'hindi' ? 'यहाँ क्लिक करें या छवि खींचकर छोड़ें' : 'Click or drag image here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF</p>
            </div>
          ) : (
            <div className="relative">
              <img src={analysisImage} alt="Uploaded" className="w-full h-48 object-cover rounded-lg border-2 border-green-300" />
              <button
                onClick={clearImageAnalysis}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {language === 'hindi' ? 'विश्लेषण परिणाम' : 'Analysis Result'}
          </label>
          {analysisLoading ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">{language === 'hindi' ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}</p>
              </div>
            </div>
          ) : analysisError ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 h-48 flex items-center justify-center">
              <p className="text-sm text-red-700 text-center">{analysisError}</p>
            </div>
          ) : analysisResult ? (
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-lg p-4 h-48 flex flex-col justify-center">
              <p className="text-xs text-gray-600 mb-2 uppercase font-semibold">{language === 'hindi' ? 'शीर्ष परिणाम' : 'Top Result'}</p>
              <p className="text-2xl font-bold text-green-700 mb-3">{analysisResult.lastTwoWords}</p>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">{language === 'hindi' ? 'आत्मविश्वास स्कोर' : 'Confidence Score'}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-teal-500" style={{ width: `${analysisResult.score}%` }}></div>
                  </div>
                  <p className="text-lg font-bold text-green-700">{analysisResult.score}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">{language === 'hindi' ? 'पूर्ण नाम: ' : 'Full name: '}{analysisResult.label}</p>
              <p className="text-xs text-gray-600 mt-1">{language === 'hindi' ? 'फसल/सब्जी: ' : 'Crop / Vegetable: '}{analysisResult.cropName || (language === 'hindi' ? 'निर्दिष्ट नहीं' : 'Not specified')}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <p className="text-sm text-gray-500">{language === 'hindi' ? 'परिणाम के लिए छवि अपलोड करें' : 'Upload an image to see results'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-bold text-emerald-800">
            {language === 'hindi' ? 'भारतीय फसल बाजार मूल्य (अनुमानित)' : 'Indian Crop Market Prices (Approx.)'}
          </h4>
          <span className="text-xs font-medium text-emerald-700">
            {language === 'hindi' ? 'दर: INR/किलो' : 'Rate: INR/kg'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {INDIAN_CROP_PRICES.map((crop) => (
            <div key={crop.key} className="rounded-lg border border-emerald-200 bg-white p-3 text-center shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                {language === 'hindi' ? crop.nameHi : crop.nameEn}
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-700">INR {crop.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
