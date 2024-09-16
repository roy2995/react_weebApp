import { PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

function PolarAreaChart({ data }) {
  return <PolarArea data={data} />;
}

export default PolarAreaChart;
