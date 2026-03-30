// MinimalApp.jsx
import React, { useState } from 'react';

const MinimalApp = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          FarmGuard Pro - Minimal Test
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Component Test
          </h2>
          <p className="text-gray-600 mb-4">
            Count: {count}
          </p>
          <button 
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
          >
            Increment
          </button>
          <button 
            onClick={() => setCount(0)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalApp;