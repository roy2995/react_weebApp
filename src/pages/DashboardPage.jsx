// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import WeatherChartLayout from '../layouts/charts/WeatherChartLayout';
import WeatherPieChartLayout from '../layouts/charts/WeatherPieChartLayout';
import CalendarHeatmapChartLayout from '../layouts/charts/CalendarHeatmapChartLayout';
import AreaChartLayout from '../layouts/charts/AreaChartLayout';

const DashboardPage = () => {
  const [filter, setFilter] = useState('day');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl w-full">
  
        {/* Filtro Global */}
        <div className="lg:col-span-3 flex justify-center mb-10">
          <label className="mr-4 text-white font-semibold">
            Filtrar por:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select select-bordered select-secondary w-full max-w-xs p-3 rounded-full shadow-md bg-white/30 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>
  
        {/* Gráficos en Tarjetas */}
        <div className="card bg-[#091057]/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 h-96 transition-transform duration-300">
          <WeatherChartLayout filter={filter} />
        </div>
        
        <div className="card bg-[#091057]/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 h-96 transition-transform duration-300">
          <WeatherPieChartLayout filter={filter} />
        </div>
        
        <div className="card bg-[#091057]/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 h-96 transition-transform duration-300">
          <CalendarHeatmapChartLayout filter={filter} />
        </div>
  
        {/* Gráfico de Área ocupa toda la fila */}
        <div className="lg:col-span-3 card bg-[#091057]/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 h-96 transition-transform duration-300">
          <AreaChartLayout />
        </div>
      </div>
    </div>
  );
  
  
};

export default DashboardPage;
