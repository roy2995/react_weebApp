import React from 'react';
import Chart from 'react-apexcharts';

const DonutChart = ({ series = [0, 0], options = {} }) => {
  const chartOptions = {
    chart: { type: 'donut' },
    labels: ['Completadas', 'No Completadas'],
    colors: ['#4CAF50', '#FFC107'],
    legend: { position: 'bottom' },
    ...options // This allows you to override options if provided
  };

  return (
    <Chart options={chartOptions} series={series} type="donut" width="100%" />
  );
};

export default DonutChart;
