import React from 'react';
import Chart from 'react-apexcharts';

const PieChart = ({ series = [], options = {} }) => {
  // Verifica si los datos necesarios están disponibles
  if (!series.length || !options) {
    return <p className="text-gray-500">Cargando datos del PieChart...</p>;
  }

  return (
    <div>
      <Chart options={options} series={series} type="pie" height={350} />
    </div>
  );
};

export default PieChart;
