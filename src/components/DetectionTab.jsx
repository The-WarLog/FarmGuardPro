// DetectionTab.jsx
import React, { useState } from 'react';
import { Upload, Server } from 'lucide-react';

const getLastWords = (text, count = 3) => {
  if (!text || typeof text !== 'string') return '';
  const words = text.trim().split(/\s+/);
  return words.slice(-count).join(' ');
};

const DetectionTab = ({ currentTexts, language, selectedImage, detectionResult, analysisHistory, cropName, setCropName, backendConnectionStatus, handleImageUpload, fileInputRef }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // forward File object to the handler (App.jsx accepts File or input event)
      handleImageUpload(file, cropName);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center tracking-tight">
          {language === 'hindi' ? 'बीमारी पहचान सिस्टम' : 'Disease Detection System'}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {language === 'hindi' ? 'पत्ती की फोटो अपलोड करें या यहां खींचकर छोड़ें' : 'Upload a leaf photo or drag & drop it here'}
        </p>

        <div className={`mb-6 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          backendConnectionStatus === 'connected'
            ? 'border-green-200 bg-green-50 text-green-700'
            : backendConnectionStatus === 'checking'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : backendConnectionStatus === 'disconnected'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          <Server className="h-4 w-4" />
          <span className="font-medium">
            {language === 'hindi' ? 'बैकएंड स्थिति:' : 'Backend status:'}
          </span>
          <span>
            {backendConnectionStatus === 'connected'
              ? (language === 'hindi' ? 'कनेक्टेड (Live API)' : 'Connected (Live API)')
              : backendConnectionStatus === 'checking'
                ? (language === 'hindi' ? 'जांच हो रही है...' : 'Checking...')
                : backendConnectionStatus === 'disconnected'
                  ? (language === 'hindi' ? 'डिस्कनेक्टेड (Fallback चल रहा है)' : 'Disconnected (Using fallback)')
                  : (language === 'hindi' ? 'अभी परीक्षण नहीं हुआ' : 'Not tested yet')}
          </span>
        </div>
        
        <div
          className={`dropzone mb-6 ${isDragging ? 'dropzone-active' : ''}`}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="mb-4 text-left">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {language === 'hindi' ? 'फसल/सब्जी का नाम' : 'Crop / Vegetable Name'}
            </label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder={language === 'hindi' ? 'उदाहरण: टमाटर, आलू, मिर्च' : 'Example: Tomato, Potato, Chili'}
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleImageUpload(e, cropName)}
            accept="image/*"
            className="hidden"
          />
          <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {language === 'hindi' ? 'पौधे की पत्ती की तस्वीर अपलोड करें' : 'Upload an image of the plant leaf'}
          </p>
          <p className="text-xs text-gray-400 mb-4">JPG, PNG • {language === 'hindi' ? 'अच्छी रोशनी में साफ तस्वीर' : 'Clear photo in good lighting'}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            {language === 'hindi' ? 'अपलोड करें' : 'Upload'}
          </button>
        </div>

        {!selectedImage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div className="chip">
              <div className="font-medium">{language === 'hindi' ? 'स्पष्ट तस्वीर' : 'Clear Image'}</div>
              <div className="text-xs text-gray-600">{language === 'hindi' ? 'धुंधली तस्वीरों से बचें' : 'Avoid blurry photos'}</div>
            </div>
            <div className="chip">
              <div className="font-medium">{language === 'hindi' ? 'पर्याप्त रोशनी' : 'Good Lighting'}</div>
              <div className="text-xs text-gray-600">{language === 'हिंदी' ? 'प्राकृतिक रोशनी बेहतर' : 'Natural light works best'}</div>
            </div>
            <div className="chip">
              <div className="font-medium">{language === 'hindi' ? 'पत्ती पर फोकस' : 'Focus on Leaf'}</div>
              <div className="text-xs text-gray-600">{language === 'hindi' ? 'क्षतिग्रस्त क्षेत्र दिखाएँ' : 'Show affected areas'}</div>
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-tight">{language === 'hindi' ? 'अपलोड की गई तस्वीर' : 'Uploaded Image'}</h3>
              <div className="rounded-xl border-2 border-blue-200 shadow overflow-hidden">
                <img src={selectedImage} alt="Uploaded plant" className="w-full h-64 object-cover" />
              </div>
              <div className="mt-2 text-xs text-gray-500">{language === 'hindi' ? 'यदि परिणाम गलत हों तो दूसरी तस्वीर आज़माएं' : 'If results seem off, try another angle or image.'}</div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-tight">{language === 'hindi' ? 'पहचान परिणाम' : 'Detection Results'}</h3>
              {detectionResult ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{language === 'hindi' ? 'निदान:' : 'Diagnosis:'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${detectionResult.isDiseaseDetected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {getLastWords(detectionResult.disease, 3)}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{language === 'hindi' ? 'फसल/सब्जी:' : 'Crop / Vegetable:'}</span>
                      <span className="font-semibold text-blue-700">{detectionResult.cropName || (language === 'hindi' ? 'निर्दिष्ट नहीं' : 'Not specified')}</span>
                    </div>
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{language === 'hindi' ? 'स्थिति:' : 'Status:'}</span>
                      <span className={`font-semibold ${detectionResult.isDiseaseDetected ? 'text-red-600' : 'text-green-700'}`}>
                        {detectionResult.isDiseaseDetected
                          ? (language === 'hindi' ? 'बीमारी का संकेत मिला' : 'Disease detected')
                          : (language === 'hindi' ? 'बीमारी नहीं मिली' : 'No disease detected')}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{language === 'hindi' ? 'परिणाम स्रोत:' : 'Result source:'}</span>
                      <span className={`font-semibold ${detectionResult.resultSource === 'backend' ? 'text-green-700' : 'text-amber-700'}`}>
                        {detectionResult.resultSource === 'backend'
                          ? (language === 'hindi' ? 'लाइव बैकएंड' : 'Live backend')
                          : (language === 'hindi' ? 'फॉलबैक/डेमो' : 'Fallback / demo')}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{language === 'hindi' ? 'विश्वास:' : 'Confidence:'}</span>
                        <span className="font-bold text-blue-700">{detectionResult.confidence}%</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500" style={{ width: `${detectionResult.confidence}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <span className="font-medium">{language === 'hindi' ? 'गंभीरता:' : 'Severity:'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${detectionResult.severity === 'High' ? 'bg-red-100 text-red-700' : detectionResult.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{detectionResult.severity}</span>
                    </div>
                    <div className="card p-3 rounded border border-blue-100">
                      <h4 className="font-medium mb-2">{language === 'hindi' ? 'सिफारिशें:' : 'Recommendations:'}</h4>
                      <p className="text-sm text-gray-700">{detectionResult.recommendations}</p>
                    </div>
                    {Array.isArray(detectionResult.topPredictions) && detectionResult.topPredictions.length > 0 && (
                      <div className="card p-3 rounded border border-blue-100">
                        <h4 className="font-medium mb-2">{language === 'hindi' ? 'शीर्ष मिलान' : 'Best Matching Predictions'}</h4>
                        <div className="space-y-2">
                          {detectionResult.topPredictions.map((item, index) => (
                            <div key={`${item.label}-${index}`} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{index + 1}. {getLastWords(item.label, 3)}</span>
                              <span className="font-semibold text-blue-700">{item.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
                  <span className="ml-3 text-gray-600 text-sm">{language === 'hindi' ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-blue-100 pt-6">
          <h3 className="text-lg font-semibold mb-3 tracking-tight">
            {language === 'hindi' ? 'आपका विश्लेषण इतिहास' : 'Your Analysis History'}
          </h3>

          {!Array.isArray(analysisHistory) || analysisHistory.length === 0 ? (
            <p className="text-sm text-gray-500">
              {language === 'hindi' ? 'अभी तक कोई विश्लेषण सेव नहीं हुआ।' : 'No saved analyses yet.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {analysisHistory.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-lg border border-blue-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{getLastWords(item.disease, 4)}</span>
                    <span className="text-xs text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                    <span>{language === 'hindi' ? 'फसल:' : 'Crop:'} <span className="font-medium text-gray-700">{item.crop_name || (language === 'hindi' ? 'निर्दिष्ट नहीं' : 'Not specified')}</span></span>
                    <span>{language === 'hindi' ? 'विश्वास:' : 'Confidence:'} <span className="font-medium text-blue-700">{item.confidence}%</span></span>
                    <span>{language === 'hindi' ? 'स्रोत:' : 'Source:'} <span className="font-medium text-gray-700">{item.result_source || 'backend'}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectionTab;
