import React, { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';

const CleaningReport = () => {
  const [area, setArea] = useState({});
  const [tasks, setTasks] = useState([]);
  const [contingencies, setContingencies] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedContingencies, setSelectedContingencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [beforePhotoSaved, setBeforePhotoSaved] = useState(false);
  const [afterPhotoSaved, setAfterPhotoSaved] = useState(false);

  const cloudinaryInstance = new Cloudinary({
    cloud: {
      cloudName: 'dbl7m4sha',
    }
  });

  const uploadPhoto = async (event, type) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Reportes de Limpieza');

    console.log(`Uploading ${type} photo...`);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dbl7m4sha/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      const imageUrl = data.secure_url;

      if (type === 'before') {
        localStorage.setItem('beforePhotoUrl', imageUrl);
        setBeforePhotoSaved(true);
        console.log('Before photo uploaded:', imageUrl);
      } else if (type === 'after') {
        localStorage.setItem('afterPhotoUrl', imageUrl);
        setAfterPhotoSaved(true);
        console.log('After photo uploaded:', imageUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true); 
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          throw new Error("Token or User ID not found");
        }

        console.log('Fetching user bucket...');
        const userBucketResponse = await fetch(`http://localhost:4000/api/user_buckets?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userBucketResponse.ok) {
          throw new Error(`Error fetching user bucket: ${userBucketResponse.statusText}`);
        }
        const userBucketData = await userBucketResponse.json();
        console.log('User Bucket Data:', userBucketData);

        if (!userBucketData.body || userBucketData.body.length === 0 || !userBucketData.body[0].bucket_id) {
          throw new Error("No se encontró ningún bucket asignado para este usuario.");
        }
        const bucketId = userBucketData.body[0].bucket_id;
        console.log('Bucket ID:', bucketId);

        console.log('Fetching bucket details...');
        const bucketResponse = await fetch(`http://localhost:4000/api/buckets/${bucketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!bucketResponse.ok) {
          throw new Error(`Error fetching bucket details: ${bucketResponse.statusText}`);
        }
        const bucketData = await bucketResponse.json();
        const bucket = bucketData.body[0];
        setArea(bucket);
        console.log('Bucket Details:', bucket);

        console.log('Fetching tasks...');
        const tasksResponse = await fetch(`http://localhost:4000/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tasksResponse.ok) {
          throw new Error(`Error fetching tasks: ${tasksResponse.statusText}`);
        }
        const allTasksData = await tasksResponse.json();
        const filteredTasks = allTasksData.body.filter((task) => task.Type.toString() === bucket.Tipo.toString());
        setTasks(filteredTasks);
        console.log('Filtered Tasks:', filteredTasks);

        console.log('Fetching contingencies...');
        const contingenciesResponse = await fetch(`http://localhost:4000/api/contingencies`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!contingenciesResponse.ok) {
          throw new Error(`Error fetching contingencies: ${contingenciesResponse.statusText}`);
        }
        const allContingenciesData = await contingenciesResponse.json();
        const filteredContingencies = allContingenciesData.body.filter((contingency) => contingency.Type.toString() === bucket.Tipo.toString());
        setContingencies(filteredContingencies);
        console.log('Filtered Contingencies:', filteredContingencies);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTaskChange = (taskId) => {
    console.log('Task selected:', taskId);
    setSelectedTasks((prevTasks) =>
      prevTasks.includes(taskId)
        ? prevTasks.filter((id) => id !== taskId)
        : [...prevTasks, taskId]
    );
  };

  const handleContingencyChange = (contingencyId) => {
    console.log('Contingency selected:', contingencyId);
    setSelectedContingencies((prevContingencies) =>
      prevContingencies.includes(contingencyId)
        ? prevContingencies.filter((id) => id !== contingencyId)
        : [...prevContingencies, contingencyId]
    );
  };

  const handleSubmit = async () => {
    console.log('Submitting report...');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const newProgressBucketData = {
        bucket_id: area.ID,
        status: 'completed',
        user_id: localStorage.getItem('userId'),
        date: new Date(),
      };

      const createProgressBucketResponse = await fetch('http://localhost:4000/api/progress_buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProgressBucketData),
      });

      if (!createProgressBucketResponse.ok) {
        const errorData = await createProgressBucketResponse.json();
        throw new Error(`Error creating progress bucket: ${errorData.message}`);
      }

      const createdProgressBucket = await createProgressBucketResponse.json();
      console.log('Progress bucket created:', createdProgressBucket);

      setLoading(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-lg transition-transform duration-300">
        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Área Asignada:</strong>
          </label>
          <p className="text-gray-700 bg-gray-100 p-3 rounded-lg border border-gray-200">
            {area.Area} ({area.Tipo}), Terminal: {area.Terminal}, Nivel: {area.Nivel}
          </p>
        </div>

        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Tareas a realizar:</strong>
          </label>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.ID)}
                  onChange={() => handleTaskChange(task.ID)}
                  className="mr-2 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-800">{task.info}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <label className="font-semibold block mb-2 text-red-700">
            <strong>Contingencias:</strong>
          </label>
          <ul className="space-y-4">
            {contingencies.map((contingency) => (
              <li key={contingency.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedContingencies.includes(contingency.ID)}
                  onChange={() => handleContingencyChange(contingency.ID)}
                  className="mr-2 w-5 h-5 rounded focus:ring-2 focus:ring-red-500"
                />
                <span className="text-gray-800">{contingency.Name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex flex-col space-y-2">
          <label className={`w-full text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
            ${beforePhotoSaved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
            <input
              type="file"
              id="before-photo"
              className="hidden"
              onChange={(e) => uploadPhoto(e, 'before')}
            />
            {beforePhotoSaved ? '¡Foto Guardada!' : 'Foto Antes'}
          </label>
          <label className={`w-full text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
            ${afterPhotoSaved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
            <input
              type="file"
              id="after-photo"
              className="hidden"
              onChange={(e) => uploadPhoto(e, 'after')}
            />
            {afterPhotoSaved ? '¡Foto Guardada!' : 'Foto Después'}
          </label>
        </div>

        <button onClick={handleSubmit} 
                className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-800 active:scale-95 transition-all duration-300 ease-in-out disabled:bg-gray-400">
          Enviar Reporte
        </button>
      </div>
    </div>
  );
};

export default CleaningReport;
