// TestHeaderApp.jsx
import React, { useState } from 'react';
import { PROJECT_INFO, texts } from './constants';
import Header from './components/Header';

const TestHeaderApp = () => {
  const [language, setLanguage] = useState('english');
  const [isDark, setIsDark] = useState(false);
  const currentTexts = texts[language];

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <Header 
          currentTexts={currentTexts}
          language={language}
          setLanguage={setLanguage}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
        <div className="container mx-auto p-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Testing Header Component
          </h1>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Header Test Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you can see the header above, then the Header component is working.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Toggle Theme
              </button>
              <button 
                onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Switch Language
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestHeaderApp;