// SimpleApp.jsx
import React, { useState } from 'react';

// Try importing constants first
import { PROJECT_INFO, texts } from './constants';

const SimpleApp = () => {
  const [language, setLanguage] = useState('english');
  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          {PROJECT_INFO.name}
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {currentTexts.header.title}
          </h2>
          <p className="text-gray-600 mb-4">
            Testing basic functionality...
          </p>
          <button 
            onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Switch Language: {language}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;