// RegionalDistributionChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const RegionalDistributionChart = ({ data, title }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={(entry) => `${entry.name}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegionalDistributionChart;
