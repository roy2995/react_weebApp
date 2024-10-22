import React from 'react';
import Chart from 'react-apexcharts';

const ScatterChart = ({ series }) => {
  const options = {
    chart: {
      type: 'scatter',
      zoom: {
        enabled: true,
        type: 'xy'
      }
    },
    xaxis: {
      tickAmount: 10,
    },
    yaxis: {
      tickAmount: 7,
    }
  };

  return <Chart options={options} series={series} type="scatter" height={350} />;
};

export default ScatterChart;
