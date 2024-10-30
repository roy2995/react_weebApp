import React, { useEffect, useState } from 'react';
import WeatherChart from '../../components/charts/WeatherChart';

const WeatherChartLayout = ({ filter }) => {
  const [taskData, setTaskData] = useState({});
  const [dailyCounts, setDailyCounts] = useState({ dates: [], dailyTotals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const typeMapping = {
    7: 'Baños',
    8: 'Food Court',
    9: 'Pasillos'
  };

  const fetchTaskData = async () => {
    const token = localStorage.getItem('token');
    try {
      const taskResponse = await fetch('https://webapi-f01g.onrender.com/api/progress_buckets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const taskData = await taskResponse.json();

      if (taskData.error) {
        throw new Error('Error al obtener los datos de tareas');
      }

      const bucketResponse = await fetch('https://webapi-f01g.onrender.com/api/buckets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const bucketData = await bucketResponse.json();

      if (bucketData.error) {
        throw new Error('Error al obtener los datos de buckets');
      }

      const bucketMap = bucketData.body.reduce((map, bucket) => {
        if ([7, 8, 9].includes(bucket.Tipo)) {  // Cambiado para los nuevos tipos
          map[bucket.ID] = typeMapping[bucket.Tipo];
        }
        return map;
      }, {});

      const tasksWithTypes = taskData.body
        .map(task => ({
          ...task,
          tipo: bucketMap[task.bucket_id],
        }))
        .filter(task => task.tipo);

      const groupedTasks = tasksWithTypes.reduce(
        (acc, task) => {
          const groupKey = task.tipo;
          if (!acc[groupKey]) {
            acc[groupKey] = { completed: 0, notCompleted: 0 };
          }
          if (task.status === 1) {
            acc[groupKey].completed += 1;
          } else {
            acc[groupKey].notCompleted += 1;
          }
          return acc;
        },
        {}
      );

      const dailyTaskCounts = tasksWithTypes.reduce((acc, task) => {
        let dateKey;
        const taskDate = new Date(task.date);
        
        if (filter === 'day') {
          dateKey = taskDate.toISOString().slice(0, 10);
        } else if (filter === 'week') {
          const weekStart = new Date(taskDate.setDate(taskDate.getDate() - taskDate.getDay()));
          dateKey = weekStart.toISOString().slice(0, 10);
        } else if (filter === 'month') {
          dateKey = `${taskDate.getFullYear()}-${taskDate.getMonth() + 1}`;
        }

        if (!acc[dateKey]) {
          acc[dateKey] = 0;
        }
        acc[dateKey] += 1;
        return acc;
      }, {});

      const dates = Object.keys(dailyTaskCounts).sort();
      const dailyTotals = dates.map(date => dailyTaskCounts[date]);

      setTaskData(groupedTasks);
      setDailyCounts({ dates, dailyTotals });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [filter]);

  return (
    <div className="w-full h-full">
      {loading ? (
        <p className="text-gray-300">Cargando datos...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : Object.keys(taskData).length === 0 || dailyCounts.dailyTotals.length === 0 ? (
        <p className="text-gray-300">
          En estos momentos no hay datos para mostrarle en forma gráfica
        </p>
      ) : (
        <WeatherChart data={taskData} dailyCounts={dailyCounts} />
      )}
    </div>
  );
};

export default WeatherChartLayout;
