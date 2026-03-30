// TestConstantsApp.jsx
import React from 'react';
import { PROJECT_INFO } from './constants';

const TestConstantsApp = () => {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Testing Constants Import
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Project Name: {PROJECT_INFO?.name || 'Failed to load'}
          </h2>
          <p className="text-gray-600 mb-4">
            Language: {PROJECT_INFO?.language || 'Failed to load'}
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Diseases:</h3>
            <ul className="list-disc list-inside mt-2">
              {PROJECT_INFO?.diseases?.map((disease, index) => (
                <li key={index} className="text-gray-600">{disease}</li>
              )) || <li>Failed to load diseases</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConstantsApp;