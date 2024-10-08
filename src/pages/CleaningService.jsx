import React, { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';

const CleaningReport = () => {
  const [area, setArea] = useState(JSON.parse(localStorage.getItem('area')) || {});
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem('tasks')) || []);
  const [contingencies, setContingencies] = useState(JSON.parse(localStorage.getItem('contingencies')) || []);
  const [selectedTasks, setSelectedTasks] = useState(JSON.parse(localStorage.getItem('selectedTasks')) || []);
  const [selectedContingencies, setSelectedContingencies] = useState(JSON.parse(localStorage.getItem('selectedContingencies')) || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [beforePhotoSaved, setBeforePhotoSaved] = useState(!!localStorage.getItem('beforePhotoUrl'));
  const [afterPhotoSaved, setAfterPhotoSaved] = useState(!!localStorage.getItem('afterPhotoUrl'));

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
        const bucketId = userBucketData.body[0].bucket_id;

        // Verifica si el bucketId es diferente al almacenado
        const storedBucketId = localStorage.getItem('bucketId');
        if (storedBucketId !== bucketId.toString()) {
          console.log('Assigned bucket has changed. Clearing localStorage.');
          localStorage.clear();
          localStorage.setItem('userId', userId);
          localStorage.setItem('bucketId', bucketId);
        } else {
          console.log('Bucket ID is the same, loading cached data.');
        }

        console.log('Fetching bucket details...');
        const bucketResponse = await fetch(`http://localhost:4000/api/buckets/${bucketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bucketData = await bucketResponse.json();
        const bucket = bucketData.body[0];
        setArea(bucket);
        localStorage.setItem('area', JSON.stringify(bucket));

        console.log('Fetching tasks...');
        const tasksResponse = await fetch(`http://localhost:4000/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allTasksData = await tasksResponse.json();
        const filteredTasks = allTasksData.body.filter((task) => task.Type.toString() === bucket.Tipo.toString());
        setTasks(filteredTasks);
        localStorage.setItem('tasks', JSON.stringify(filteredTasks));

        // Carga y mantiene el progreso de bucket solo si no existe en el cache actual
        const progressBucketId = localStorage.getItem('progressBucketId');
        if (!progressBucketId) {
          console.log('No cached bucket progress found. Creating new progress bucket...');
          const createBucketResponse = await fetch(`http://localhost:4000/api/progress_buckets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              bucket_id: bucketId,
              status: 0,
              user_id: userId,
              date: new Date().toISOString().slice(0, 10),
            }),
          });

          if (!createBucketResponse.ok) {
            throw new Error(`Error creating progress bucket: ${createBucketResponse.statusText}`);
          }

          const createBucketData = await createBucketResponse.json();
          localStorage.setItem('progressBucketId', createBucketData.body.id);
          console.log('Progress bucket created with ID:', createBucketData.body.id);
        } else {
          console.log('Cached progress bucket found with ID:', progressBucketId);
        }

        // Carga y mantiene el progreso de tareas solo si no existe en el cache actual
        const cachedSelectedTasks = JSON.parse(localStorage.getItem('selectedTasks')) || [];
        if (cachedSelectedTasks.length === 0) {
          console.log('No cached task progress found. Creating new progress for tasks...');
          const taskProgressIds = await Promise.all(filteredTasks.map(async (task) => {
            const response = await fetch(`http://localhost:4000/api/progress_tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                task_id: task.ID,
                status: 0,
                user_id: userId,
                date: new Date().toISOString().slice(0, 10),
              }),
            });
            const data = await response.json();
            return { taskId: task.ID, progressId: data.body.id, status: 0 };
          }));
          setSelectedTasks(taskProgressIds);
          localStorage.setItem('selectedTasks', JSON.stringify(taskProgressIds));
        } else {
          setSelectedTasks(cachedSelectedTasks);
        }

        console.log('Fetching contingencies...');
        const contingenciesResponse = await fetch(`http://localhost:4000/api/contingencies`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allContingenciesData = await contingenciesResponse.json();
        const filteredContingencies = allContingenciesData.body.filter((contingency) => contingency.Type.toString() === bucket.Tipo.toString());
        setContingencies(filteredContingencies);
        localStorage.setItem('contingencies', JSON.stringify(filteredContingencies));

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
    const updatedTasks = selectedTasks.map((task) =>
      task.taskId === taskId ? { ...task, status: task.status === 0 ? 1 : 0 } : task
    );
    setSelectedTasks(updatedTasks);
    localStorage.setItem('selectedTasks', JSON.stringify(updatedTasks));
    console.log('Updated task progress in cache:', updatedTasks);
  };

  const handleContingencyChange = (contingencyId) => {
    const updatedContingencies = selectedContingencies.includes(contingencyId)
      ? selectedContingencies.filter((id) => id !== contingencyId)
      : [...selectedContingencies, contingencyId];

    setSelectedContingencies(updatedContingencies);
    localStorage.setItem('selectedContingencies', JSON.stringify(updatedContingencies));
  };

  const handleSubmit = async () => {
    console.log('Submitting report...');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("No authorization token found");
      }

      // Actualiza el progreso de todas las tareas en el backend
      await Promise.all(selectedTasks.map(async (task) => {
        const response = await fetch(`http://localhost:4000/api/progress_tasks/${task.progressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_id: task.taskId,
            status: task.status,
            user_id: localStorage.getItem('userId'),
            date: new Date().toISOString().slice(0, 10),
          }),
        });
        if (!response.ok) {
          console.error(`Failed to update task ${task.taskId}, status code: ${response.status}`);
          throw new Error(`Error updating task ${task.taskId}`);
        }
        console.log(`Updated task ${task.taskId} status to ${task.status}`);
      }));

      const progressBucketId = localStorage.getItem('progressBucketId');
      if (!progressBucketId) throw new Error('No progress bucket ID found in cache');

      const response = await fetch(`http://localhost:4000/api/progress_buckets/${progressBucketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bucket_id: area.ID,
          status: 1,
          user_id: localStorage.getItem('userId'),
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      if (!response.ok) {
        console.error(`Failed to update bucket, status code: ${response.status}`);
        throw new Error('Error actualizando el bucket');
      }

      console.log('Bucket progress updated successfully.');
      localStorage.clear(); 
      setLoading(false);
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
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
                  checked={selectedTasks.some((t) => t.taskId === task.ID && t.status === 1)}
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
