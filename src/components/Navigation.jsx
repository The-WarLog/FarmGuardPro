// Navigation.jsx
import React from 'react';
import { Home, Camera, MessageCircle, BarChart3 } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, currentTexts }) => {
  return (
    <nav className="bg-white/85 backdrop-blur sticky top-0 z-40 shadow-md border-b border-blue-100 dark:bg-slate-800/80 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 md:gap-4 overflow-x-auto py-2 items-center">
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
      </div>
    </nav>
  );
};

export default Navigation;
