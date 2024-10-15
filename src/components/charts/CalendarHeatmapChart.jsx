// src/components/charts/CalendarHeatmapChart.jsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const CalendarHeatmapChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = echarts.init(chartRef.current);

    const option = {
      title: {
        top: 30,
        left: 'center',
        text: 'Contingencias Diarias'
      },
      tooltip: {},
      visualMap: {
        min: 0,
        max: data.length ? Math.max(...data.map(item => item[1])) : 10,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        top: 65
      },
      calendar: {
        top: 120,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: '2016', // Año fijo, se puede ajustar según necesidad
        itemStyle: {
          borderWidth: 0.5
        },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data // Los datos son recibidos como una propiedad
      }
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
        height: '300px',
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

export default CalendarHeatmapChart;
