import React from 'react';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import PolarAreaChart from '../components/charts/PolarAreaChart';
import RadarChart from '../components/charts/RadarChart';
import ScatterChart from '../components/charts/ScatterChart';

function Dashboard() {
  const barChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Limpiezas por dia',
        data: [2400, 1398, 9800, 3908, 4800, 3800, 4300],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Limpiezas por Semana',
        data: [4000, 3000, 2000, 2780],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const pieChartData = {
    labels: ['Limpiezas con Contingencias', 'Limpiezas completadas'],
    datasets: [
      {
        data: [2400, 4567],
        backgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  const polarAreaChartData = {
    labels: ['Contingencia 1', 'Contingencia 2', 'Contingencia 3', 'Contingencia 4', 'Contingencia 5'],
    datasets: [
      {
        data: [300, 600, 100, 500, 400],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FFA07A'],
      },
    ],
  };

  const radarChartData = {
    labels: ['Baños', 'Oficinas', 'Estacionamientos', 'Food Court', 'Exterior'],
    datasets: [
      {
        label: 'Quantity',
        data: [20, 30, 40, 50],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };

  const scatterChartData = {
    datasets: [
      {
        label: 'Area/Tiempo',
        data: [{ x: 6, y: 15 }, { x: 10, y: 20 },{x:5, y: 18},{x:7.5, y:17}],
        backgroundColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <h2 className="text-center">Bar Chart</h2>
          <BarChart data={barChartData} />
        </div>
        <div>
          <h2 className="text-center">Line Chart</h2>
          <LineChart data={lineChartData} />
        </div>
        <div>
          <h2 className="text-center">Pie Chart</h2>
          <PieChart data={pieChartData} />
        </div>
        <div>
          <h2 className="text-center">Polar Area Chart</h2>
          <PolarAreaChart data={polarAreaChartData} />
        </div>
        <div>
          <h2 className="text-center">Radar Chart</h2>
          <RadarChart data={radarChartData} />
        </div>
        <div>
          <h2 className="text-center">Scatter Chart</h2>
          <ScatterChart data={scatterChartData} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
