import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function ScatterChart({ data }) {
  return <Scatter data={data} />;
}

export default ScatterChart;
