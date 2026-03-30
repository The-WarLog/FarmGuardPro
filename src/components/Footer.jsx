// Footer.jsx
import React from 'react';
import { Leaf } from 'lucide-react';

const Footer = ({ currentTexts, language }) => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-10 mt-12 border-t border-gray-700/60">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <Leaf className="h-8 w-8 text-green-400 mr-2 drop-shadow" />
          <span className="text-xl font-bold tracking-tight">FarmGuard Pro</span>
        </div>
        <p className="text-gray-400 mb-4">
          {language === 'hindi' ? 'आधुनिक तकनीक से किसानों की सेवा में' : 'Serving farmers with modern technology'}
        </p>
        <p className="text-sm text-gray-400">
          © 2024 FarmGuard Pro. {language === 'hindi' ? 'सभी अधिकार सुरक्षित।' : 'All rights reserved.'}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Made by <span className="font-semibold text-blue-300">Varun Tiwari</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
