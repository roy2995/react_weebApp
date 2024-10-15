// src/layouts/charts/WeatherPieChartLayout.jsx
import React, { useState, useEffect } from 'react';
import WeatherPieChart from '../../components/charts/WeatherPieChart';

const WeatherPieChartLayout = ({ filter }) => { // Recibe el filtro como prop
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const typeMapping = {
    1: 'Baños',
    2: 'Oficinas',
    3: 'Exteriores',
    4: 'Food Courts',
    5: 'Estacionamientos',
    6: 'Sin Resolver'
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [progressTaskResponse, tasksResponse] = await Promise.all([
        fetch(`http://localhost:4000/api/progress_tasks?filter=${filter}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('http://localhost:4000/api/tasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const [progressTasksData, tasksData] = await Promise.all([
        progressTaskResponse.json(),
        tasksResponse.json()
      ]);

      if (progressTasksData.error || tasksData.error) {
        throw new Error('Error al obtener datos de tareas o progreso de tareas');
      }

      const taskMap = tasksData.body.reduce((acc, task) => {
        if (task.Type !== 7) { // Omitimos el tipo 7
          acc[task.ID] = typeMapping[task.Type];
        }
        return acc;
      }, {});

      const taskCountsByType = progressTasksData.body.reduce((acc, task) => {
        const taskType = taskMap[task.task_id];
        if (taskType) {
          if (!acc[taskType]) {
            acc[taskType] = 0;
          }
          acc[taskType] += 1;
        }
        return acc;
      }, {});

      const chartData = Object.entries(taskCountsByType).map(([type, count]) => ({
        value: count,
        name: type
      }));

      setTaskData(chartData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]); // Actualiza los datos cada vez que el filtro cambia

  return (
    <div 
      className="weather-pie-chart-layout"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: '100%',
        color: '#333',
      }}
    >
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#333' }}>Gráfico de Tipos de Tareas</h2>
      {loading && <p>Cargando datos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <WeatherPieChart data={taskData} />}
    </div>
  );
};

export default WeatherPieChartLayout;
