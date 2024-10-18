import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const WeatherPieChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const initializeChart = () => {
      if (chartRef.current) {
        chartInstance.current = echarts.init(chartRef.current);

        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)',
            backgroundColor: '#091057',
            textStyle: { color: '#F2F2F2' },
            borderColor: '#737373',
            borderWidth: 1,
          },
          legend: {
            bottom: 10,
            left: 'center',
            data: data.map(item => item.name),
            textStyle: { color: '#F2F2F2' }
          },
          series: [
            {
              name: 'Tipos de Tareas',
              type: 'pie',
              radius: '65%',
              center: ['50%', '50%'],
              data: data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2,
              },
              label: {
                color: '#F2F2F2',
                fontSize: 12
              }
            }
          ]
        };

        chartInstance.current.setOption(option);

        // Manejar redimensionamiento
        const resizeChart = () => {
          chartInstance.current && chartInstance.current.resize();
        };
        window.addEventListener('resize', resizeChart);

        return () => {
          window.removeEventListener('resize', resizeChart);
          chartInstance.current && chartInstance.current.dispose();
        };
      }
    };

    initializeChart();
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'rgba(0, 23, 95, 0.8)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      }}
    ></div>
  );
};

export default WeatherPieChart;
