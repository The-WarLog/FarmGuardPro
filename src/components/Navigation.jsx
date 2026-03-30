// Navigation.jsx
import React, { useState } from 'react';
import { Home, Camera, MessageCircle, BarChart3 } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, currentTexts, language }) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <nav className="bg-white/85 backdrop-blur sticky top-0 z-40 shadow-md border-b border-blue-100 dark:bg-slate-800/80 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="flex gap-2 md:gap-4 overflow-x-auto items-center">
            {[
              { key: 'home', icon: <Home className="h-4 w-4" /> },
              { key: 'detection', icon: <Camera className="h-4 w-4" /> },
              { key: 'chatbot', icon: <MessageCircle className="h-4 w-4" /> },
              { key: 'analytics', icon: <BarChart3 className="h-4 w-4" /> },
            ].map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tab-btn ${activeTab === key ? 'tab-btn-active' : ''}`}
              >
                <span className="inline-flex items-center gap-2">
                  {icon}
                  <span>{currentTexts.tabs[key]}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setIsAboutOpen((prev) => !prev)}
              className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100"
            >
              {language === 'hindi' ? 'हमारे बारे में' : 'About'}
            </button>

            {isAboutOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-900 shadow-lg">
                <p className="leading-relaxed">
                  {language === 'hindi'
                    ? 'यह कॉलेज का एक ग्रुप प्रोजेक्ट है, जो किसानों की मदद के लिए बनाया गया है। इमेज प्रोसेसिंग और चैटबॉट के माध्यम से हम रोग पहचान और उपयोगी सलाह देते हैं।'
                    : 'This is a college group project built to help farmers. Using image processing and a chatbot, we provide disease detection and practical guidance.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
