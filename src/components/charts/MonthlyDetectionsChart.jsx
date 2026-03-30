// MonthlyDetectionsChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyDetectionsChart = ({ data, title }) => {
  // Summing up all diseases for a total monthly count
  const monthlyTotals = data.map(monthData => {
    const total = monthData.leafBlight + monthData.powderyMildew + monthData.bacterialSpot + monthData.rust + monthData.mosaic;
    return { month: monthData.month, totalDetections: total };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyTotals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Bar dataKey="totalDetections" fill="#3b82f6" name="Total Cases" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyDetectionsChart;