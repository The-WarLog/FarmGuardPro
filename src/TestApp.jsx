import React from 'react';

const TestApp = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <h1 className="text-4xl font-bold text-blue-900">FarmGuard Pro Test</h1>
      <p className="text-lg mt-4">If you can see this, React is working!</p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold">Component Test</h2>
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestApp;