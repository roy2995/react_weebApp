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

      const aggregatedData = allData.reduce((acc, item) => {
        const dateKey = item.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { completed: 0, notCompleted: 0 };
        }
        if (item.status === 1) {
          acc[dateKey].completed += 1;
        } else {
          acc[dateKey].notCompleted += 1;
        }
        return acc;
      }, {});

      const dateKeys = Object.keys(aggregatedData).sort();
      const completedValues = dateKeys.map(date => aggregatedData[date].completed);
      const notCompletedValues = dateKeys.map(date => -aggregatedData[date].notCompleted);

      setDateData(dateKeys);
      setCompletedValues(completedValues);
      setNotCompletedValues(notCompletedValues);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-full h-full">
      {loading ? (
        <p className="text-gray-300">Cargando datos...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <AreaChart
          dateData={dateData}
          completedValues={completedValues}
          notCompletedValues={notCompletedValues}
        />
      )}
    </div>
  );
};

export default AreaChartLayout;
