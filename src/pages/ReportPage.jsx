import React, { useState, useEffect } from 'react';
import Header from '../components/General/Header';

const ReportPage = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [filterType, setFilterType] = useState('date');
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [isPreviewUpdated, setIsPreviewUpdated] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [dataIndex, setDataIndex] = useState({});

  useEffect(() => {
    console.log('Clearing localStorage on mount...');
    localStorage.removeItem('filteredReports');
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const token = localStorage.getItem('token');
    const [reportsData, progressTasksData, bucketsData, tasksData, progressContingenciesData, contingenciesData] = await Promise.all([
      fetchData('reports', token),
      fetchData('progress_tasks', token),
      fetchData('buckets', token),
      fetchData('tasks', token),
      fetchData('progress_contingencies', token),
      fetchData('contingencies', token)
    ]);

    if (reportsData && progressTasksData && tasksData) {
      setReports(reportsData);
      setFilteredReports(reportsData);
      initializeDataIndex(reportsData, progressTasksData, bucketsData, tasksData, progressContingenciesData, contingenciesData);
    }
  };

  const initializeDataIndex = (reportsData, progressTasksData, bucketsData, tasksData, progressContingenciesData, contingenciesData) => {
    const index = reportsData.reduce((acc, report) => {
      const content = JSON.parse(report.content);
      const bucketInfo = bucketsData.find(bucket => bucket.ID === report.bucket_id) || {};

      const taskList = (content.tasks || []).map((task) => {
        const progressTask = progressTasksData.find(pt => pt.task_id === task.ID);
        const taskInfo = tasksData.find(t => t.ID === task.ID);

        console.log(`Task Info for report ${report.id}:`, taskInfo || 'No se encontró información de la tarea');
        
        return { 
          info: taskInfo ? taskInfo.info : 'Información no disponible', 
          status: progressTask ? progressTask.status : null 
        };
      });

      const contingencyList = (content.contingencies || []).map((cont) => {
        const progressContingency = progressContingenciesData.find(pc => pc.contingency_id === cont.ID && pc.report_id === report.id);
        const contInfo = contingenciesData.find(c => c.ID === cont.ID);

        console.log(`Contingency Info for report ${report.id}:`, contInfo || 'No se encontró información de la contingencia');
        
        return { 
          Name: contInfo ? contInfo.Name : 'Nombre no disponible', 
          status: progressContingency ? progressContingency.status : null 
        };
      });

      acc[report.id] = {
        ...report,
        tasks: taskList,
        bucket: bucketInfo,
        contingencies: contingencyList,
        photos: content.photos || {}
      };
      console.log(`Data index entry for report ${report.id}:`, acc[report.id]);
      return acc;
    }, {});

    console.log('Final Data Index:', index);
    setDataIndex(index);
  };

  const fetchData = async (endpoint, token) => {
    try {
      const response = await fetch(`http://localhost:4000/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`${endpoint} fetched successfully:`, data.body);
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

  const handleCheckboxChange = (report) => {
    const isSelected = selectedReports.some(r => r.id === report.id);
    if (isSelected) {
      setSelectedReports(prevSelected => prevSelected.filter(r => r.id !== report.id));
    } else {
      setSelectedReports(prevSelected => [...prevSelected, report]);
    }
    setIsPreviewUpdated(!isPreviewUpdated);
    setPreviewKey(prevKey => prevKey + 1);
    console.log('Selected reports for preview:', JSON.stringify(selectedReports));
  };

  const updateFilterOptions = () => {
    console.log(`Filter type changed to: ${filterType}`);
    if (filterType === 'date') {
      const availableDates = [...new Set(reports.map(report => report.created_at.split('T')[0]))];
      setFilterOptions(availableDates);
    } else if (filterType === 'bucket') {
      const bucketOptions = Object.values(dataIndex).map(bucket => ({ id: bucket.ID, name: bucket.Area }));
      setFilterOptions(bucketOptions);
    } else if (filterType === 'contingency') {
      setFilterOptions(['Contingency']);
    }
  };

  const updateCheckboxes = (filter) => {
    let newFilteredReports = [];
    if (filterType === 'bucket') {
      newFilteredReports = reports.filter(report => report.bucket_id === parseInt(filter));
    } else if (filterType === 'contingency') {
      newFilteredReports = reports.filter(report => report.contingencies_id !== null);
    }
    setFilteredReports(newFilteredReports);
    localStorage.setItem('filteredReports', JSON.stringify(newFilteredReports.map(r => r.id)));
    console.log('Updated filtered reports:', newFilteredReports);
  };

  const renderPreview = () => {
    const jsonForPDF = selectedReports.map((report) => {
      const reportData = dataIndex[report.id];
      if (!reportData) return null;

      const { bucket, tasks, contingencies, photos } = reportData;
      const reportDate = new Date(reportData.created_at).toLocaleDateString();

      console.log(`Rendering preview for report ${report.id} with data:`, reportData);

      return {
        reportDate,
        bucketArea: bucket.Area || 'Desconocida',
        bucketTerminal: bucket.Terminal || 'Desconocida',
        bucketLevel: bucket.Nivel || 'Desconocido',
        tasks: tasks.map(task => `${task.info || 'Información no disponible'} ${task.status ? '✓' : '✘'}`),
        contingencies: contingencies.map(cont => `${cont.Name || 'Nombre no disponible'} ${cont.status ? '✓' : '✘'}`),
        photos
      };
    });

    console.log('JSON structure for pdfMake:', JSON.stringify(jsonForPDF, null, 2));

    return jsonForPDF.map((report, idx) => (
      <div key={`${report.id}-${previewKey}`} className="mb-6 p-4 bg-white rounded-lg shadow text-gray-700">
        <p><strong>Reporte del {report.reportDate}</strong> en el área {report.bucketArea} de la {report.bucketTerminal} nivel {report.bucketLevel}</p>
        <p><strong>Tareas Realizadas:</strong></p>
        <ul className="list-disc ml-4">
          {report.tasks.map((task, i) => (
            <li key={i}>{task}</li>
          ))}
        </ul>
        <p><strong>Contingencias Encontradas:</strong></p>
        <ul className="list-disc ml-4">
          {report.contingencies.map((cont, i) => (
            <li key={i}>{cont}</li>
          ))}
        </ul>
        <div className="flex space-x-4 mt-4">
          {report.photos.before && <img src={report.photos.before} alt="Before" className="w-24 h-24 rounded-lg shadow" />}
          {report.photos.during && <img src={report.photos.during} alt="During" className="w-24 h-24 rounded-lg shadow" />}
          {report.photos.after && <img src={report.photos.after} alt="After" className="w-24 h-24 rounded-lg shadow" />}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <Header />
      <div className="flex h-screen pt-20 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
        <div className="w-1/3 bg-white bg-opacity-30 p-6 border-r backdrop-blur-lg rounded-r-2xl shadow-lg transition-transform duration-300 border border-white/30">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Filtrar Por:</h2>
          <select
            className="w-full mb-4 p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-gray-100 bg-opacity-20 backdrop-blur-sm text-gray-700"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              updateFilterOptions();
            }}
          >
            <option value="date">Fecha</option>
            <option value="bucket">Área</option>
            <option value="contingency">Contingencia</option>
          </select>
          {(filterType !== 'date') && (
            <select
              className="w-full mb-4 p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-gray-100 bg-opacity-20 backdrop-blur-sm text-gray-700"
              value={selectedFilter}
              onChange={(e) => {
                setSelectedFilter(e.target.value);
                updateCheckboxes(e.target.value);
              }}
            >
              <option value="">Selecciona una opción</option>
              {filterOptions.map((option, index) => (
                <option key={index} value={option.id || option}>
                  {option.name || option}
                </option>
              ))}
            </select>
          )}
          <div className="overflow-y-auto h-48 border p-4 rounded-lg bg-white bg-opacity-20 shadow-lg backdrop-blur-md">
            {filteredReports.map((report) => (
              <label key={report.id} className="block mb-2 text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-blue-500"
                  onChange={() => handleCheckboxChange(report)}
                  checked={selectedReports.some(r => r.id === report.id)}
                />
                {report.contingencies_id ? 'Contingencia' : 'Reporte'} ID: {report.id}, Fecha: {new Date(report.created_at).toLocaleDateString()}
              </label>
            ))}
          </div>
          <button onClick={() => setPreviewKey(prev => prev + 1)} className="mt-4 w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-purple-600 hover:scale-105 transition transform">
            Actualizar Vista Previa
          </button>
        </div>
        <div className="w-2/3 p-6 flex flex-col items-center bg-white bg-opacity-20 backdrop-blur-lg shadow-lg rounded-l-2xl">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Vista Previa del PDF</h2>
          <div className="overflow-y-auto w-full p-4 rounded-lg bg-gray-50 shadow-md">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
