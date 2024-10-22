// src/components/charts/AreaChart.jsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const AreaChart = ({ dateData, completedValues, notCompletedValues }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const initializeChart = () => {
      if (chartRef.current) {
        chartInstance.current = echarts.init(chartRef.current);

        const option = {
          tooltip: { trigger: 'axis' },
          legend: {
            data: ['Completadas', 'No Completadas'],
            textStyle: { color: '#fff' }
          },
          xAxis: {
            type: 'category',
            data: dateData,
            axisLabel: { color: '#ddd', fontSize: 12 }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#ddd', fontSize: 12 }
          },
          series: [
            {
              name: 'Completadas',
              type: 'line',
              data: completedValues,
              areaStyle: { color: 'rgba(0, 200, 255, 0.6)' },
              itemStyle: { color: '#00C8FF' }
            },
            {
              name: 'No Completadas',
              type: 'line',
              data: notCompletedValues,
              areaStyle: { color: 'rgba(255, 70, 131, 0.6)' },
              itemStyle: { color: '#FF4683' }
            }
          ]
        };

        chartInstance.current.setOption(option);

        // Ajustar el gráfico al redimensionar la ventana
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
  }, [dateData, completedValues, notCompletedValues]);

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

export default AreaChart;
