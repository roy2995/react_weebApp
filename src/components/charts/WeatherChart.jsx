// src/components/charts/WeatherChart.jsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const WeatherChart = ({ data, dailyCounts }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = echarts.init(chartRef.current);

    // Extraer tipos y series de datos
    const types = Object.keys(data);
    const completedData = types.map(type => data[type].completed);
    const notCompletedData = types.map(type => data[type].notCompleted);

    const option = {
      backgroundColor: 'transparent', // Fondo transparente para el efecto glass
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#091057',
        textStyle: {
          color: '#F2F2F2'
        },
        borderColor: '#737373',
        borderWidth: 1,
      },
      legend: {
        data: ['Completadas', 'No Completadas', 'Total Diario'],
        textStyle: {
          color: '#F2F2F2'
        }
      },
      xAxis: {
        type: 'category',
        data: types,
        axisLabel: {
          rotate: 45,
          color: '#F2F2F2'
        },
        axisLine: {
          lineStyle: {
            color: '#F2F2F2'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Cantidad de Tareas',
        axisLabel: {
          color: '#F2F2F2'
        },
        axisLine: {
          lineStyle: {
            color: '#F2F2F2'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#737373'
          }
        }
      },
      series: [
        {
          name: 'Completadas',
          type: 'bar',
          data: completedData,
          barWidth: 25,
          itemStyle: {
            color: '#00e6df',
            borderRadius: [5, 5, 0, 0],
            decal: {
              symbol: 'line',
              symbolSize: 1,
              dashArrayX: [1, 0],
              dashArrayY: [4, 3],
              color: '#F2F2F2'
            }
          }
        },
        {
          name: 'No Completadas',
          type: 'bar',
          data: notCompletedData,
          barWidth: 25,
          itemStyle: {
            color: '#00a9ff',
            borderRadius: [5, 5, 0, 0],
            decal: {
              symbol: 'circle',
              symbolSize: 1,
              dashArrayX: [1, 1],
              dashArrayY: [2, 2],
              color: '#F2F2F2'
            }
          }
        },
        {
          name: 'Total Diario',
          type: 'line',
          data: dailyCounts.dailyTotals,
          smooth: true,
          itemStyle: {
            color: '#F2F2F2'
          },
          lineStyle: {
            width: 2,
            color: '#F2F2F2'
          }
        }
      ]
    };

    chartInstance.setOption(option);

    return () => {
      chartInstance.dispose();
    };
  }, [data, dailyCounts]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.2)', // Fondo blanco semi-transparente
        borderRadius: '15px', // Bordes redondeados
        backdropFilter: 'blur(10px)', // Efecto de desenfoque
        WebkitBackdropFilter: 'blur(10px)', // Compatibilidad con Safari
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)', // Sombra para darle un poco de profundidad
        border: '1px solid rgba(255, 255, 255, 0.3)', // Borde semi-transparente
      }}
    ></div>
  );
};

export default WeatherChart;
