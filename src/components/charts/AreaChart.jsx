// src/components/charts/AreaChart.jsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const AreaChart = ({ dateData, completedValues, notCompletedValues }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        }
      },
      title: {
        left: 'center',
        text: 'Gráfico de Área Combinado'
      },
      legend: {
        top: 20,
        data: ['Completadas', 'No Completadas']
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dateData
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '100%']
      },
      series: [
        {
          name: 'Completadas',
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          itemStyle: {
            color: 'rgb(0, 200, 255)'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgb(0, 200, 255)'
              },
              {
                offset: 1,
                color: 'rgb(0, 150, 200)'
              }
            ])
          },
          data: completedValues
        },
        {
          name: 'No Completadas',
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          itemStyle: {
            color: 'rgb(255, 70, 131)'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgb(255, 158, 68)'
              },
              {
                offset: 1,
                color: 'rgb(255, 70, 131)'
              }
            ])
          },
          data: notCompletedValues
        }
      ]
    };

    chartInstance.setOption(option);

    return () => {
      chartInstance.dispose();
    };
  }, [dateData, completedValues, notCompletedValues]);

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

export default AreaChart;
