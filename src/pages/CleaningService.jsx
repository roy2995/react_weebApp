import React, { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { useNavigate } from 'react-router-dom';
import Header from "../components/General/Header";

const CleaningReport = () => {
  const navigate = useNavigate();
  const [area, setArea] = useState(JSON.parse(localStorage.getItem('area')) || {});
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem('tasks')) || []);
  const [contingencies, setContingencies] = useState(JSON.parse(localStorage.getItem('contingencies')) || []);
  const [selectedTasks, setSelectedTasks] = useState(JSON.parse(localStorage.getItem('selectedTasks')) || []);
  const [selectedContingencies, setSelectedContingencies] = useState(JSON.parse(localStorage.getItem('selectedContingencies')) || []);
  const [contingencyProgressData, setContingencyProgressData] = useState(JSON.parse(localStorage.getItem('contingencyProgressData')) || []);
  const [TaskProgressData, setTaskProgressData] = useState(JSON.parse(localStorage.getItem('TaskProgressData')) || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [beforePhotoSaved, setBeforePhotoSaved] = useState(!!localStorage.getItem('beforePhotoUrl'));
  const [duringPhotoSaved, setDuringPhotoSaved] = useState(!!localStorage.getItem('duringPhotoUrl'));
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
      } else if (type === 'during') {
        localStorage.setItem('duringPhotoUrl', imageUrl);
        setDuringPhotoSaved(true);
        console.log('During photo uploaded:', imageUrl);
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
          console.error("Token or User ID not found. Redirecting to login...");
          window.location.replace('http://localhost:5173');
          return;
        }

        console.log('Fetching user bucket...');
        const userBucketResponse = await fetch(`https://webapi-f01g.onrender.com/api/user_buckets?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userBucketResponse.ok) {
          throw new Error(`Error fetching user bucket: ${userBucketResponse.statusText}`);
        }
        const userBucketData = await userBucketResponse.json();
        const bucketId = userBucketData.body[0].bucket_id;

        const storedBucketId = localStorage.getItem('bucketId');
        
        if (storedBucketId !== bucketId.toString()) {
          console.log('Assigned bucket has changed. Clearing localStorage and reloading data.');
          localStorage.clear();
          localStorage.setItem('userId', userId);
          localStorage.setItem('bucketId', bucketId);
        } else {
          console.log('Bucket ID is the same as cached. Using cached data.');
        }

        if (storedBucketId !== bucketId.toString() || !localStorage.getItem('area') || !localStorage.getItem('tasks')) {
          console.log('Fetching bucket details...');
          const bucketResponse = await fetch(`https://webapi-f01g.onrender.com/api/buckets/${bucketId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const bucketData = await bucketResponse.json();
          const bucket = bucketData.body[0];
          setArea(bucket);
          localStorage.setItem('area', JSON.stringify(bucket));

          console.log('Fetching tasks...');
          const tasksResponse = await fetch(`https://webapi-f01g.onrender.com/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allTasksData = await tasksResponse.json();
          const filteredTasks = allTasksData.body.filter((task) => task.Type.toString() === bucket.Tipo.toString());
          setTasks(filteredTasks);
          localStorage.setItem('tasks', JSON.stringify(filteredTasks));

          const progressBucketId = localStorage.getItem('progressBucketId');
          if (!progressBucketId) {
            console.log('No cached bucket progress found. Creating new progress bucket...');
            const createBucketResponse = await fetch(`https://webapi-f01g.onrender.com/api/progress_buckets`, {
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
          
          console.log('Fetching contingencies...');
          const contingenciesResponse = await fetch(`https://webapi-f01g.onrender.com/api/contingencies`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allContingenciesData = await contingenciesResponse.json();
          const filteredContingencies = allContingenciesData.body.filter((contingency) => contingency.Type.toString() === bucket.Tipo.toString());
          setContingencies(filteredContingencies);
          localStorage.setItem('contingencies', JSON.stringify(filteredContingencies));
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const updatedTasks = selectedTasks.includes(taskId)
      ? selectedTasks.filter((id) => id !== taskId)
      : [...selectedTasks, taskId];

    const updatedProgressData = updatedTasks.map((id) => ({
      taskId: id,
      status: updatedTasks.includes(id) ? 1 : 0,
    }));

  setSelectedTasks(updatedTasks);
    setTaskProgressData(updatedProgressData);
    localStorage.setItem('selectedTasks', JSON.stringify(updatedTasks));
    localStorage.setItem('TaskProgressData', JSON.stringify(updatedProgressData));

    console.log('Task updated:', updatedProgressData);
  };

  const handleContingencyChange = (contingencyId) => {
    const updatedContingencies = selectedContingencies.includes(contingencyId)
      ? selectedContingencies.filter((id) => id !== contingencyId)
      : [...selectedContingencies, contingencyId];

    const updatedProgressData = updatedContingencies.map((id) => ({
      contingencyId: id,
      status: updatedContingencies.includes(id) ? 1 : 0,
    }));

    setSelectedContingencies(updatedContingencies);
    setContingencyProgressData(updatedProgressData);
    localStorage.setItem('selectedContingencies', JSON.stringify(updatedContingencies));
    localStorage.setItem('contingencyProgressData', JSON.stringify(updatedProgressData));

    console.log('Contingency updated:', updatedProgressData);
  };

  const handleSubmit = async () => {
    console.log('Submitting report...');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Para depuración

      const userId = localStorage.getItem('userId');
      const bucketId = localStorage.getItem('bucketId');

      if (!token) {
        throw new Error("No authorization token found");
      }

      const progressContingenciesToPost = contingencyProgressData.filter(contingency => contingency.status === 1);
      const progressContingencyIds = await Promise.all(progressContingenciesToPost.map(async (contingency) => {
        const response = await fetch(`https://webapi-f01g.onrender.com/api/progress_contingencies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contingency_id: contingency.contingencyId,
            status: "1",
            user_id: userId,
            date: new Date().toISOString().slice(0, 10)
          })
        });
        
        

        if (!response.ok) {
          throw new Error(`Error posting progress contingency ${contingency.contingencyId}`);
        }

        const data = await response.json();
        return { contingencyId: contingency.contingencyId, progressId: data.body.id };
      }));
      const progressTasksToPost = taskProgressData.filter(task => task.status === 1);
      const progressTaskIds = await Promise.all(progressTasksToPost.map(async (task) => {
        const response = await fetch(`https://webapi-f01g.onrender.com/api/progress_tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            task_id: task.taskId,
            status: "1",
            user_id: userId,
            date: new Date().toISOString().slice(0, 10)
          })
        });
        

        if (!response.ok) {
          throw new Error(`Error posting progress task: ${task.taskId}`);
        }

        const data = await response.json();
        return { taskId: task.taskId, progressId: data.body.id };
      }));

      const reportContent = {
        dummyData: "default value",
        tasks: progressTaskIds.map(c => ({ ID: c.progressId, Type: "2", Name: "Task Progress" })),
        contingencies: progressContingencyIds.map(c => ({ ID: c.progressId, Type: "2", Name: "Contingency Progress" })),
        photos: {
          before: localStorage.getItem('beforePhotoUrl'),
          during: localStorage.getItem('duringPhotoUrl'),
          after: localStorage.getItem('afterPhotoUrl')
        }
      };
      
      console.log('Generated report content:', JSON.stringify(reportContent));

      const firstContingencyId = selectedContingencies.length > 0 ? selectedContingencies[0] : null;
      const reportResponse = await fetch(`https://webapi-f01g.onrender.com/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: reportContent,
          user_id: userId,
          bucket_id: bucketId,
          contingencies_id: firstContingencyId || null
        })
      });

      if (!reportResponse.ok) {
        throw new Error(`Error posting report: ${reportResponse.statusText}`);
      }

      console.log('Report successfully posted.');
      localStorage.clear(); 
      setLoading(false);
      window.location.reload();

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 pt-20" style={{ marginTop: '2rem' }}>
      <Header />
      <div className="max-w-4xl w-full bg-white bg-opacity-30 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/30">
        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Área Asignada:</strong>
          </label>
          <p className="text-gray-700 bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
            {area.Area} ({area.Tipo}), Terminal: {area.Terminal}, Nivel: {area.Nivel}
          </p>
        </div>

        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Tareas a realizar:</strong>
          </label>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
                <input
                  type="checkbox"
                  checked={selectedTasks.some((t) => t.taskId === task.ID && t.status === 1)}
                  onChange={() => handleTaskChange(task.ID)}
                  className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-800 text-sm md:text-base">{task.info}</span>
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
              <li key={contingency.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
                <input
                  type="checkbox"
                  checked={selectedContingencies.includes(contingency.ID)}
                  onChange={() => handleContingencyChange(contingency.ID)}
                  className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-red-500"
                />
                <span className="text-gray-800 text-sm md:text-base">{contingency.Name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex flex-col space-y-2">
          <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
            ${beforePhotoSaved ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
            <input
              type="file"
              id="before-photo"
              className="hidden"
              onChange={(e) => uploadPhoto(e, 'before')}
            />
            {beforePhotoSaved ? '¡Foto Guardada!' : 'Foto Antes'}
          </label>
          <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
            ${duringPhotoSaved ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
            <input
              type="file"
              id="during-photo"
              className="hidden"
              onChange={(e) => uploadPhoto(e, 'during')}
            />
            {duringPhotoSaved ? '¡Foto Guardada!' : 'Foto Durante'}
          </label>
          <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
            ${afterPhotoSaved ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
            <input
              type="file"
              id="after-photo"
              className="hidden"
              onChange={(e) => uploadPhoto(e, 'after')}
            />
            {afterPhotoSaved ? '¡La foto se guardo!' : 'Foto Después'}
          </label>
        </div>

        <button 
          onClick={handleSubmit} 
          className="w-full glass bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out disabled:bg-gray-400 mt-8"
        >
          Enviar Reporte
        </button>
      </div>
    </div>
  );  
 };

export default CleaningReport;
