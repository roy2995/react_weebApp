import React from 'react';
import Chart from 'react-apexcharts';

const LineChart = ({ series, categories }) => {
  const options = {
    chart: {
      type: 'line',
    },
    xaxis: {
      categories: categories
    }
  };

  return <Chart options={options} series={series} type="line" height={350} />;
};

export default LineChart;
