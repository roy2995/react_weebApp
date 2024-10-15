// src/layouts/charts/CalendarHeatmapChartLayout.jsx
import React, { useState, useEffect } from 'react';
import CalendarHeatmapChart from '../../components/charts/CalendarHeatmapChart';

const CalendarHeatmapChartLayout = ({ filter }) => { // Recibe el filtro como prop
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:4000/api/progress_contingencies?filter=${filter}`, {
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

      // Procesar datos de acuerdo al filtro seleccionado
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
  }, [filter]); // Actualiza los datos cada vez que el filtro cambia

  return (
    <div 
      className="calendar-heatmap-chart-layout"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: '100%',
        color: '#333',
      }}
    >
      <h2 className="text-xl font-semibold mb-4">Contingencias Diarias</h2>
      {loading && <p>Cargando datos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <CalendarHeatmapChart data={data} />}
    </div>
  );
};

export default CalendarHeatmapChartLayout;
