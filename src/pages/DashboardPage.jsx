import React, { useState, useEffect } from 'react';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';

const typeMapping = {
  1: 'Baños',
  2: 'Oficinas',
  3: 'Exterior',
  4: 'Foodcourt',
  5: 'Estacionamiento'
};

function Dashboard() {
  const [allBucketData, setAllBucketData] = useState([]); // Datos para Bar Chart
  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null); // Datos para Pie Chart
  const [fetchError, setFetchError] = useState(null);
  const [selectedBucketId, setSelectedBucketId] = useState(""); // Filtro por bucket_id
  const [selectedUserId, setSelectedUserId] = useState(""); // Filtro por user_id
  const [selectedType, setSelectedType] = useState(""); // Filtro por tipo

  useEffect(() => {
    // Fetch de `progress_buckets` para el Bar Chart
    const fetchBucketsData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No se encontró el token. Por favor, inicia sesión.');
        }

        const response = await fetch('http://localhost:4000/api/progress_buckets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAllBucketData(data.body);
      } catch (error) {
        setFetchError(error.message);
      }
    };

    // Fetch de `reports` para el Pie Chart
    const fetchReportsData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No se encontró el token. Por favor, inicia sesión.');
        }

        const response = await fetch('http://localhost:4000/api/reports', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Agrupar los datos de reports por tipo de bucket
        const groupedData = data.body.reduce((acc, report) => {
          const typeName = typeMapping[report.bucket_id];
          if (!acc[typeName]) {
            acc[typeName] = 0;
          }
          acc[typeName] += 1;
          return acc;
        }, {});

        const labels = Object.keys(groupedData);
        const dataValues = Object.values(groupedData);

        setPieChartData({
          labels,
          datasets: [
            {
              label: 'Cantidad de Reportes',
              data: dataValues,
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
              ],
              borderWidth: 1,
            }
          ],
        });
      } catch (error) {
        setFetchError(error.message);
      }
    };

    fetchBucketsData();
    fetchReportsData();
  }, []);

  useEffect(() => {
    // Filtrar y procesar los datos de `progress_buckets` para el Bar Chart
    const filteredData = allBucketData.filter((bucket) => {
      const matchesBucketId = selectedBucketId ? bucket.bucket_id.toString() === selectedBucketId : true;
      const matchesUserId = selectedUserId ? bucket.user_id.toString() === selectedUserId : true;
      const matchesType = selectedType ? typeMapping[bucket.bucket_id] === selectedType : true;
      return matchesBucketId && matchesUserId && matchesType;
    });

    const groupedData = filteredData.reduce((acc, bucket) => {
      const typeName = typeMapping[bucket.bucket_id];
      if (!acc[typeName]) {
        acc[typeName] = { completed: 0, notCompleted: 0 };
      }
      if (bucket.status === 1) {
        acc[typeName].completed += 1;
      } else {
        acc[typeName].notCompleted += 1;
      }
      return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const completedData = labels.map((type) => groupedData[type].completed);
    const notCompletedData = labels.map((type) => groupedData[type].notCompleted);

    setBarChartData({
      labels,
      datasets: [
        {
          label: 'Tareas Completadas',
          data: completedData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Tareas No Completadas',
          data: notCompletedData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ],
    });
  }, [allBucketData, selectedBucketId, selectedUserId, selectedType]);

  if (fetchError) {
    return <p>Error: {fetchError}</p>;
  }

  if (!barChartData || !pieChartData) {
    return <p>Cargando datos...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 p-6">
      <div className="mb-4">
        <h2 className="text-center text-xl mb-2">Filtros</h2>
        
        <div className="flex justify-center space-x-4 mb-4">
          <input
            type="text"
            placeholder="Filtrar por bucket_id"
            value={selectedBucketId}
            onChange={(e) => setSelectedBucketId(e.target.value)}
            className="p-2 border rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            placeholder="Filtrar por user_id"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="p-2 border rounded bg-gray-700 text-white"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2 border rounded bg-gray-700 text-white"
          >
            <option value="">Seleccionar Tipo</option>
            {Object.values(typeMapping).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-center">Bar Chart</h2>
          <BarChart data={barChartData} />
        </div>
        <div>
          <h2 className="text-center">Pie Chart</h2>
          <PieChart data={pieChartData} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
