import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const WeatherChart = ({ data, dailyCounts }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const initializeChart = () => {
      if (chartRef.current) {
        if (chartInstance.current) {
          chartInstance.current.dispose(); // Elimina la instancia anterior
        }

        chartInstance.current = echarts.init(chartRef.current);

        const types = Object.keys(data);
        const completedData = types.map(type => data[type].completed);
        const notCompletedData = types.map(type => data[type].notCompleted);

        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#091057',
            textStyle: { color: '#F2F2F2' },
            borderColor: '#737373',
            borderWidth: 1,
          },
          legend: {
            data: ['Completadas', 'No Completadas', 'Total Diario'],
            textStyle: { color: '#F2F2F2' }
          },
          xAxis: {
            type: 'category',
            data: types,
            axisLabel: { rotate: 45, color: '#F2F2F2', fontSize: 12 },
            axisLine: { lineStyle: { color: '#F2F2F2' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#F2F2F2', fontSize: 12 },
            axisLine: { lineStyle: { color: '#F2F2F2' } },
            splitLine: { lineStyle: { color: '#737373' } }
          },
          series: [
            {
              name: 'Completadas',
              type: 'bar',
              data: completedData,
              barWidth: 25,
              itemStyle: { color: '#36CFC9', borderRadius: [5, 5, 0, 0] }
            },
            {
              name: 'No Completadas',
              type: 'bar',
              data: notCompletedData,
              barWidth: 25,
              itemStyle: { color: '#FF6D6D', borderRadius: [5, 5, 0, 0] }
            },
            {
              name: 'Total Diario',
              type: 'line',
              data: dailyCounts.dailyTotals,
              smooth: true,
              itemStyle: { color: '#F2F2F2' },
              lineStyle: { width: 2, color: '#F2F2F2' }
            }
          ]
        };

        chartInstance.current.setOption(option);

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
  }, [data, dailyCounts]);

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

export default WeatherChart;
