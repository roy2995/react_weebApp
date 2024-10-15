// src/layouts/charts/AreaChartLayout.jsx
import React, { useState, useEffect } from 'react';
import AreaChart from '../../components/charts/AreaChart';

const AreaChartLayout = () => {
  const [dateData, setDateData] = useState([]);
  const [completedValues, setCompletedValues] = useState([]);
  const [notCompletedValues, setNotCompletedValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [taskResponse, bucketResponse, contingencyResponse] = await Promise.all([
        fetch('http://localhost:4000/api/progress_tasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('http://localhost:4000/api/progress_buckets', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('http://localhost:4000/api/progress_contingencies', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const [taskData, bucketData, contingencyData] = await Promise.all([
        taskResponse.json(),
        bucketResponse.json(),
        contingencyResponse.json()
      ]);

      if (taskData.error || bucketData.error || contingencyData.error) {
        throw new Error('Error al obtener datos');
      }

      const allData = [
        ...taskData.body.map(item => ({ date: item.date.slice(0, 10), status: item.status })),
        ...bucketData.body.map(item => ({ date: item.date.slice(0, 10), status: item.status })),
        ...contingencyData.body.map(item => ({ date: item.date.slice(0, 10), status: item.status }))
      ];

      // Agrupa los datos por fecha
      const aggregatedData = allData.reduce((acc, item) => {
        const dateKey = item.date;

        if (!acc[dateKey]) {
          acc[dateKey] = { completed: 0, notCompleted: 0 };
        }

        if (item.status === 1) {  // Completado
          acc[dateKey].completed += 1;
        } else {  // No completado
          acc[dateKey].notCompleted += 1;
        }

        return acc;
      }, {});

      const dateKeys = Object.keys(aggregatedData).sort();
      const completedValues = dateKeys.map(date => aggregatedData[date].completed);
      const notCompletedValues = dateKeys.map(date => -aggregatedData[date].notCompleted); // Negativo para mostrar hacia abajo

      setDateData(dateKeys);
      setCompletedValues(completedValues);
      setNotCompletedValues(notCompletedValues);
      setLoading(false);

      console.log("Date Keys:", dateKeys); // Verificar fechas
      console.log("Completed Values:", completedValues); // Verificar valores completados
      console.log("Not Completed Values:", notCompletedValues); // Verificar valores no completados
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div 
      className="area-chart-layout"
      style={{
        background: 'rgba(31, 76, 232, 0.85)',
        borderRadius: '15px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.1)', 
        padding: '1.5rem',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#333' }}>Progreso Combinado de Tareas Completadas y No Completadas</h2>

      {loading ? <p>Cargando datos...</p> : error ? <p className="text-red-500">{error}</p> : 
        <div style={{ flexGrow: 1 }}>
          <AreaChart dateData={dateData} completedValues={completedValues} notCompletedValues={notCompletedValues} />
        </div>
      }
    </div>
  );
};

export default AreaChartLayout;
