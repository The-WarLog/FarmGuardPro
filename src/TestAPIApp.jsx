// TestAPIApp.jsx
import React, { useState } from 'react';
import { PROJECT_INFO, texts } from './constants';
import { uploadImage, sendChatMessage } from './services/api';

const TestAPIApp = () => {
  const [language, setLanguage] = useState('english');
  const [testResult, setTestResult] = useState('');
  const currentTexts = texts[language];

  const testAPI = async () => {
    setTestResult('Testing API imports...');
    
    try {
      // Just test if the functions exist, don't actually call them
      if (typeof uploadImage === 'function' && typeof sendChatMessage === 'function') {
        setTestResult('✅ API services imported successfully!');
      } else {
        setTestResult('❌ API functions not found');
      }
    } catch (error) {
      setTestResult(`❌ API import error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-purple-800 mb-4">
          Testing API Services Import
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            API Import Test
          </h2>
          <p className="text-gray-600 mb-4">
            Project: {PROJECT_INFO?.name || 'Failed to load'}
          </p>
          <button 
            onClick={testAPI}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mb-4"
          >
            Test API Imports
          </button>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <strong>Result:</strong> {testResult || 'Click button to test'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAPIApp;