// Header.jsx
import React from 'react';
import { Leaf, Sun, Moon, LogOut } from 'lucide-react';

const Header = ({ currentTexts, language, setLanguage, isDark, toggleTheme, currentUser, onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white shadow-lg/70 backdrop-blur-[2px] rounded-b-lg dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <div className="container mx-auto px-4 py-5 md:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Leaf className="h-10 w-10 text-green-200 drop-shadow" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{currentTexts.title}</h1>
              <p className="text-blue-100/90 text-sm md:text-base">{currentTexts.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm border border-white/20">
                <span className="font-medium">{currentUser.name || currentUser.email}</span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 rounded-md bg-red-500/80 px-2 py-1 text-xs font-semibold hover:bg-red-500"
                >
                  <LogOut className="h-3 w-3" />
                  {language === 'hindi' ? 'लॉगआउट' : 'Logout'}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/30 dark:bg-slate-700/60 dark:hover:bg-slate-700"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-blue-800/70 text-white px-3 py-2 rounded-lg border border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-300/70 shadow-sm hover:bg-blue-800 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-700 text-sm"
            >
              <option value="english">English</option>
              <option value="hindi">हिंदी (Hindi)</option>
              <option value="bengali">বাংলা (Bengali)</option>
              <option value="telugu">తెలుగు (Telugu)</option>
              <option value="marathi">मराठी (Marathi)</option>
              <option value="tamil">தமிழ் (Tamil)</option>
              <option value="gujarati">ગુજરાતી (Gujarati)</option>
              <option value="urdu">اردو (Urdu)</option>
              <option value="kannada">ಕನ್ನಡ (Kannada)</option>
              <option value="odia">ଓଡିଆ (Odia)</option>
              <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="assamese">অসমীয়া (Assamese)</option>
              <option value="malayalam">മലയാളം (Malayalam)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
