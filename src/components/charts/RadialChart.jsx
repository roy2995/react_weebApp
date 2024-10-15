import React from 'react';
import Chart from 'react-apexcharts';

const RadialChart = ({ series, labels }) => {
  const options = {
    chart: {
      type: 'radialBar',
    },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: {
            fontSize: '22px',
          },
          value: {
            fontSize: '16px',
          }
        }
      }
    },
    labels: labels
  };

  return <Chart options={options} series={series} type="radialBar" height={350} />;
};

export default RadialChart;
