// src/layouts/charts/CalendarHeatmapChartLayout.jsx
import React, { useState, useEffect } from 'react';
import CalendarHeatmapChart from '../../components/charts/CalendarHeatmapChart';

const CalendarHeatmapChartLayout = ({ filter }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://webapi-f01g.onrender.com/api/progress_contingencies?filter=${filter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.error) {
        throw new Error('Error al obtener datos de contingencias');
      }

      const aggregatedData = result.body.reduce((acc, entry) => {
        if (entry.status === "1") {
          const date = new Date(entry.date);
          let dateKey;

          if (filter === 'day') {
            dateKey = date.toISOString().slice(0, 10);
          } else if (filter === 'week') {
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            dateKey = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 1) / 7)).padStart(2, '0')}`;
          } else if (filter === 'month') {
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }

          if (!acc[dateKey]) {
            acc[dateKey] = 0;
          }
          acc[dateKey] += 1;
        }
        return acc;
      }, {});

      const formattedData = Object.entries(aggregatedData).map(([key, value]) => [key, value]);
      
      setData(formattedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  return (
    <div className="w-full h-full">
      {loading ? (
        <p className="text-gray-300">Cargando datos...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <CalendarHeatmapChart data={data} />
      )}
    </div>
  );
};

export default CalendarHeatmapChartLayout;
