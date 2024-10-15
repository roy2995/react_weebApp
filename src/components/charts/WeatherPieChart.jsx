// src/components/charts/WeatherPieChart.jsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const WeatherPieChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = echarts.init(chartRef.current);

    const option = {
      title: {
        text: 'Weather Statistics',
        subtext: 'Data Summary',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        bottom: 10,
        left: 'center',
        data: data.map(item => item.name)  // Ajusta los nombres en la leyenda
      },
      series: [
        {
          name: 'Tipos de Tareas',
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          selectedMode: 'single',
          data: data, // Asegúrate de pasar el array directamente aquí
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    chartInstance.setOption(option);

    return () => {
      chartInstance.dispose();
    };
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    ></div>
  );
};

export default WeatherPieChart;
