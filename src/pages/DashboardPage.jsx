// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import WeatherChartLayout from '../layouts/charts/WeatherChartLayout';
import WeatherPieChartLayout from '../layouts/charts/WeatherPieChartLayout';
import CalendarHeatmapChartLayout from '../layouts/charts/CalendarHeatmapChartLayout';
import AreaChartLayout from '../layouts/charts/AreaChartLayout';

const DashboardPage = () => {
  // Estado global para el filtro
  const [filter, setFilter] = useState('day');

  return (
    <div className="dashboard-layout min-h-screen p-12 bg-gray-100 flex justify-center items-center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl w-full">
        {/* Filtro Global */}
        <div className="lg:col-span-3 flex justify-center mb-4">
          <label className="mr-2 text-gray-600 font-semibold">Filtrar por:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded bg-gray-200"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>

        {/* Gráficos controlados por el filtro global */}
        <WeatherChartLayout filter={filter} />   {/* Gráfico de Barras */}
        <WeatherPieChartLayout filter={filter} /> {/* Gráfico de Pie */}
        <CalendarHeatmapChartLayout filter={filter} /> {/* Gráfico de Heatmap */}

        {/* Gráfico de Área ocupa toda la fila */}
        <div className="lg:col-span-3">
          <AreaChartLayout /> {/* Gráfico de Área */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
