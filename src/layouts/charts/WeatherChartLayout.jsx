// src/layouts/charts/WeatherChartLayout.jsx
import React, { useEffect, useState } from 'react';
import WeatherChart from '../../components/charts/WeatherChart';

const WeatherChartLayout = ({ filter }) => {
  const [taskData, setTaskData] = useState({});
  const [dailyCounts, setDailyCounts] = useState({ dailyTotals: [] });
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

  const fetchTaskData = async () => {
    const token = localStorage.getItem('token');
    try {
      const taskResponse = await fetch('http://localhost:4000/api/progress_buckets', {
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

      const bucketResponse = await fetch('http://localhost:4000/api/buckets', {
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
        if (bucket.Tipo !== '7') {
          map[bucket.ID] = typeMapping[bucket.Tipo] || 'Otro';
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
  }, [filter]); // Actualiza cuando el filtro cambia

  return (
    <div 
      className="weather-chart-layout"
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
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#333' }}>Gráfico de Tareas por Tipo de Bucket y Total Diario</h2>

      {loading && <p>Cargando datos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div style={{ flexGrow: 1 }}>
          <WeatherChart data={taskData} dailyCounts={dailyCounts} />
        </div>
      )}
    </div>
  );
};

export default WeatherChartLayout;
