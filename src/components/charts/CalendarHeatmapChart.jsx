import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const CalendarHeatmapChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const initializeChart = () => {
      if (chartRef.current) {
        if (chartInstance.current) {
          chartInstance.current.dispose(); // Elimina la instancia anterior
        }

        chartInstance.current = echarts.init(chartRef.current);

        const option = {
          tooltip: {
            formatter: '{b}: {c}',
            backgroundColor: '#091057',
            textStyle: { color: '#FFFFFF' },
            borderColor: '#737373',
            borderWidth: 1,
          },
          visualMap: {
            min: 0,
            max: Math.max(...data.map(item => item[1])),
            type: 'piecewise',
            orient: 'horizontal',
            left: 'center',
            top: -1,
            inRange: { color: ['#f5e8c8', '#d94e5d'] },
            textStyle: { color: '#FFFFFF' }
          },
          calendar: {
            top: 40,
            left: 10,
            right: 10,
            bottom: 10,
            cellSize: ['auto', 25],
            range: new Date().getFullYear().toString(),
            itemStyle: {
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(200, 200, 200, 0.2)'
            },
            dayLabel: { color: '#FFFFFF' },
            monthLabel: { color: '#FFFFFF' }
          },
          series: {
            name: 'Contingencias',
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: data
          }
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

export default CalendarHeatmapChart;
