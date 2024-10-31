// src/layouts/charts/WeatherPieChartLayout.jsx
import React, { useState, useEffect } from 'react';
import WeatherPieChart from '../../components/charts/WeatherPieChart';

const WeatherPieChartLayout = ({ filter }) => {
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const typeMapping = {
    7: 'Baños',
    8: 'Food Court',
    9: 'Pasillos'
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [progressTaskResponse, tasksResponse] = await Promise.all([
        fetch(`https://webapi-f01g.onrender.com/api/progress_tasks?filter=${filter}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('https://webapi-f01g.onrender.com/api/tasks', {
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
        if ([7, 8, 9].includes(task.Type)) {
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
  }, [filter]);

  return (
    <div className="w-full h-full">
      {loading ? (
        <p className="text-gray-300">Cargando datos...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : taskData.length === 0 ? (
        <p className="text-gray-300">
          En estos momentos no hay datos para mostrarle en forma gráfica
        </p>
      ) : (
        <WeatherPieChart data={taskData} />
      )}
    </div>
  );
};

export default WeatherPieChartLayout;
