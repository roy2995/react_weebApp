import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function ScatterChart({ data }) {
  return (
    <Scatter
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Analisis de Tiempo de Limpieza',
          },
        },
      }}
    />
  );
}

export default ScatterChart;
