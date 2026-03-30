// DiseaseTrendChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DiseaseTrendChart = ({ data, title }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 h-full">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="leafBlight" stroke="#ef4444" strokeWidth={3} name="Leaf Blight" />
            <Line type="monotone" dataKey="powderyMildew" stroke="#f59e0b" strokeWidth={3} name="Powdery Mildew" />
            <Line type="monotone" dataKey="bacterialSpot" stroke="#10b981" strokeWidth={3} name="Bacterial Spot" />
            <Line type="monotone" dataKey="rust" stroke="#8b5cf6" strokeWidth={3} name="Rust" />
            <Line type="monotone" dataKey="mosaic" stroke="#06b6d4" strokeWidth={3} name="Mosaic Virus" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DiseaseTrendChart;