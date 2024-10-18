import React, { useState, useEffect } from 'react';
import Header from '../components/General/Header';

const ReportPage = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dataIndex, setDataIndex] = useState({});
  const [isPreviewUpdated, setIsPreviewUpdated] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    console.log('Clearing localStorage on mount...');
    localStorage.removeItem('filteredReports');
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    const reportsData = await fetchData('reports', token);
    setReports(reportsData);
    setFilteredReports(reportsData);
  };

  const fetchData = async (endpoint, token) => {
    try {
      const response = await fetch(`http://localhost:4000/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        return data.body || [];
      } else {
        console.error(`Error fetching ${endpoint}:`, response.statusText);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  };

  const fetchDetailsById = async (report) => {
    const token = localStorage.getItem('token');

    // === BUCKETS ===
    const bucketData = await fetchDataById(`buckets/${report.bucket_id}`, token);
    console.log('Buckets Data:', bucketData);

    // Extrae IDs de las tareas y contingencias del contenido del reporte
    const content = JSON.parse(report.content);
    const progressTaskIDs = content.tasks.map(task => task.ID);
    const contingencyIDs = content.contingencies.map(cont => cont.ID);

    // Obtiene datos de cada progress_task y luego sus detalles en tasks
    const taskPromises = progressTaskIDs.map(async (progressTaskId) => {
      const progressTask = await fetchDataById(`progress_tasks/${progressTaskId}`, token);
      console.log(`Progress Task ID ${progressTaskId}:`, progressTask);

      // Ahora usa `task_id` del objeto `progressTask` para obtener la información detallada de la tarea
      const taskId = progressTask[0]?.task_id;  // Usa el primer elemento del array
      if (taskId) {
        const task = await fetchDataById(`tasks/${taskId}`, token);
        console.log(`Task Details for Task ID ${taskId}:`, task);
        return { info: task[0]?.info || 'Información no disponible', status: progressTask[0].status };
      } else {
        return { info: 'Información no disponible', status: null };
      }
    });
    const tasksData = await Promise.all(taskPromises);

    // Obtiene datos de cada contingencia
    const contingencyPromises = contingencyIDs.map(async (contingencyId) => {
      const contingency = await fetchDataById(`contingencies/${contingencyId}`, token);
      console.log(`Contingency ID ${contingencyId}:`, contingency);

      const progressContingency = await fetchDataById(`progress_contingencies/${contingencyId}`, token);
      console.log(`Progress Contingency ID ${contingencyId}:`, progressContingency);

      return { Name: contingency[0]?.Name || 'Nombre no disponible', status: progressContingency[0]?.status };
    });
    const contingenciesData = await Promise.all(contingencyPromises);

    const details = {
      report: report,
      bucket: bucketData,
      tasks: tasksData,
      contingencies: contingenciesData,
    };

    setDataIndex(prevState => ({
      ...prevState,
      [report.id]: details
    }));
    setSelectedReport(details);
  };

  const fetchDataById = async (url, token) => {
    try {
      const response = await fetch(`http://localhost:4000/api/${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        return data.body || [];
      } else {
        console.error(`Error fetching ${url}:`, response.statusText);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return [];
    }
  };

  const handleCheckboxChange = (report) => {
    if (selectedReport && selectedReport.report.id === report.id) {
      setSelectedReport(null);
    } else {
      fetchDetailsById(report);
    }
    setIsPreviewUpdated(!isPreviewUpdated);
    setPreviewKey(prevKey => prevKey + 1);
  };

  const renderPreview = () => {
    if (!selectedReport) return null;
    
    const { report, bucket, tasks, contingencies } = selectedReport;

    return (
      <div key={`${report.id}-${previewKey}`} className="mb-6 p-4 bg-white rounded-lg shadow text-gray-700">
        <p><strong>Reporte del {new Date(report.created_at).toLocaleDateString()}</strong> en el área {bucket.Area || 'Desconocida'} de la {bucket.Terminal || 'Desconocida'} nivel {bucket.Nivel || 'Desconocido'}</p>
        <p><strong>Tareas Realizadas:</strong></p>
        <ul className="list-disc ml-4">
          {tasks.map((task, i) => (
            <li key={i}>{task.info || 'Información no disponible'} {task.status ? '✓' : '✘'}</li>
          ))}
        </ul>
        <p><strong>Contingencias Encontradas:</strong></p>
        <ul className="list-disc ml-4">
          {contingencies.map((cont, i) => (
            <li key={i}>{cont.Name || 'Nombre no disponible'} {cont.status ? '✓' : '✘'}</li>
          ))}
        </ul>
        <div className="flex space-x-4 mt-4">
          {report.photos?.before && <img src={report.photos.before} alt="Before" className="w-24 h-24 rounded-lg shadow" />}
          {report.photos?.during && <img src={report.photos.during} alt="During" className="w-24 h-24 rounded-lg shadow" />}
          {report.photos?.after && <img src={report.photos.after} alt="After" className="w-24 h-24 rounded-lg shadow" />}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <div className="flex h-screen pt-20 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
        <div className="w-1/3 bg-white bg-opacity-30 p-6 border-r backdrop-blur-lg rounded-r-2xl shadow-lg transition-transform duration-300 border border-white/30">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Reportes:</h2>
          <div className="overflow-y-auto h-48 border p-4 rounded-lg bg-white bg-opacity-20 shadow-lg backdrop-blur-md">
            {filteredReports.map((report) => (
              <label key={report.id} className="block mb-2 text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-blue-500"
                  onChange={() => handleCheckboxChange(report)}
                  checked={selectedReport ? selectedReport.report.id === report.id : false}
                />
                Reporte ID: {report.id}, Fecha: {new Date(report.created_at).toLocaleDateString()}
              </label>
            ))}
          </div>
          <button onClick={() => setPreviewKey(prev => prev + 1)} className="mt-4 w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-purple-600 hover:scale-105 transition transform">
            Actualizar Vista Previa
          </button>
        </div>
        <div className="w-2/3 p-6 flex flex-col items-center bg-white bg-opacity-20 backdrop-blur-lg shadow-lg rounded-l-2xl">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Vista Previa del Reporte</h2>
          <div className="overflow-y-auto w-full p-4 rounded-lg bg-gray-50 shadow-md">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
