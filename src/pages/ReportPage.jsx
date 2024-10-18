import React, { useState, useEffect } from 'react';
import Header from '../components/General/Header';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Función para convertir una imagen desde una URL a Base64
const getBase64ImageFromURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL();
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
  });
};

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

    const bucketData = await fetchDataById(`buckets/${report.bucket_id}`, token);
    console.log('Buckets Data:', bucketData);

    const content = JSON.parse(report.content);
    const progressTaskIDs = content.tasks.map(task => task.ID);

    const progressContingencyIDs = content.progress_contingencies ? content.progress_contingencies.map(prog => prog.ID) : [];

    const taskPromises = progressTaskIDs.map(async (progressTaskId) => {
      const progressTask = await fetchDataById(`progress_tasks/${progressTaskId}`, token);
      console.log(`Progress Task ID ${progressTaskId}:`, progressTask);

      const taskId = progressTask[0]?.task_id;
      if (taskId) {
        const task = await fetchDataById(`tasks/${taskId}`, token);
        console.log(`Task Details for Task ID ${taskId}:`, task);
        return { info: task[0]?.info || 'Información no disponible', status: progressTask[0].status };
      } else {
        return { info: 'Información no disponible', status: null };
      }
    });

    const tasksData = await Promise.all(taskPromises);

    const progressContingencyPromises = progressContingencyIDs.map(async (progressContingencyId) => {
      const progressContingency = await fetchDataById(`progress_contingencies/${progressContingencyId}`, token);
      console.log(`Progress Contingency ID ${progressContingencyId}:`, progressContingency);

      const contingencyId = progressContingency[0]?.contingency_id;
      if (contingencyId) {
        const contingency = await fetchDataById(`contingencies/${contingencyId}`, token);
        console.log(`Contingency ID ${contingencyId}:`, contingency);

        return { 
          Name: contingency[0]?.Name || 'Nombre no disponible',  
          status: progressContingency[0]?.status || null  
        };
      } else {
        return { 
          Name: 'Nombre no disponible', 
          status: null 
        };
      }
    });

    const contingenciesData = await Promise.all(progressContingencyPromises);

    const details = {
      report: report,
      bucket: bucketData[0] || {},  
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

  // Función para exportar el reporte a PDF usando pdfmake con imágenes y texto debajo
  const exportToPdf = async () => {
    if (!selectedReport) return;

    const { report, bucket, tasks, contingencies } = selectedReport;
    const content = JSON.parse(report.content);
    const photos = content.photos || {};

    // Convertir las imágenes a Base64
    const beforeImage = photos.before ? await getBase64ImageFromURL(photos.before) : null;
    const duringImage = photos.during ? await getBase64ImageFromURL(photos.during) : null;
    const afterImage = photos.after ? await getBase64ImageFromURL(photos.after) : null;

    // Definimos el contenido del PDF, incluyendo las imágenes alineadas en columnas con el texto debajo
    const docDefinition = {
      content: [
        { text: 'Reporte de Actividades', style: 'header' },
        { text: 'Este es un reporte generado automáticamente de las actividades realizadas.', margin: [0, 0, 0, 10] },
        { text: 'Detalles del reporte:', style: 'subheader' },
        { text: `Fecha: ${new Date(report.created_at).toLocaleDateString()}`, margin: [0, 10, 0, 10] },
        { text: `Área: ${bucket?.Area || 'Desconocida'}`, margin: [0, 0, 0, 10] },
        { text: `Terminal: ${bucket?.Terminal || 'Desconocida'}`, margin: [0, 0, 0, 10] },
        { text: `Nivel: ${bucket?.Nivel || 'Desconocido'}`, margin: [0, 0, 0, 10] },
        
        { text: 'Tareas Realizadas:', style: 'subheader', margin: [0, 10, 0, 10] },
        {
          ul: tasks.map(task => `${task.info} - Estado: ${task.status ? 'Completada' : 'Pendiente'}`),
        },

        { text: 'Contingencias Encontradas:', style: 'subheader', margin: [0, 10, 0, 10] },
        contingencies.length > 0
          ? {
              ul: contingencies.map(cont => `${cont.Name} - Estado: ${cont.status ? 'Resuelta' : 'Pendiente'}`),
            }
          : { text: 'No se encontraron contingencias.', margin: [0, 0, 0, 10] },

        { text: 'Fotos:', style: 'subheader', margin: [0, 10, 0, 10] },

        {
          columns: [
            {
              stack: [
                beforeImage ? { image: beforeImage, width: 150, height: 150 } : '',
                { text: 'Antes', alignment: 'center' }
              ]
            },
            {
              stack: [
                duringImage ? { image: duringImage, width: 150, height: 150 } : '',
                { text: 'Durante', alignment: 'center' }
              ]
            },
            {
              stack: [
                afterImage ? { image: afterImage, width: 150, height: 150 } : '',
                { text: 'Después', alignment: 'center' }
              ]
            }
          ],
          columnGap: 10  // Espacio entre las columnas
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true },
      },
    };

    // Exportamos el documento PDF
    pdfMake.createPdf(docDefinition).download(`reporte_${report.id}.pdf`);
  };

  const renderPreview = () => {
    if (!selectedReport) return null;

    const { report, bucket, tasks, contingencies } = selectedReport;

    const content = JSON.parse(report.content);
    const photos = content.photos || {};

    return (
      <div key={`${report.id}-${previewKey}`} className="mb-6 p-4 bg-white rounded-lg shadow text-gray-700">
        <p><strong>Reporte del {new Date(report.created_at).toLocaleDateString()}</strong> en el área {bucket?.Area || 'Desconocida'} de la {bucket?.Terminal || 'Desconocida'} nivel {bucket?.Nivel || 'Desconocido'}</p>
        
        <p><strong>Tareas Realizadas:</strong></p>
        <ul className="list-disc ml-4">
          {tasks.map((task, i) => (
            <li key={i}>{task.info || 'Información no disponible'} {task.status ? '✓' : '✘'}</li>
          ))}
        </ul>

        <p><strong>Contingencias Encontradas:</strong></p>
        <ul className="list-disc ml-4">
          {contingencies.length > 0 ? contingencies.map((cont, i) => (
            <li key={i}>{cont.Name || 'Nombre no disponible'} {cont.status ? '✓' : '✘'}</li>
          )) : (
            <li>No se encontraron contingencias.</li>
          )}
        </ul>

        <div className="flex flex-wrap space-x-4 mt-4">
          {photos.before && (
            <div className="flex flex-col items-center">
              <img src={photos.before} alt="Before" className="w-32 h-32 object-cover rounded-lg shadow" />
              <span className="mt-2 text-sm text-gray-600">Antes</span>
            </div>
          )}
          {photos.during && (
            <div className="flex flex-col items-center">
              <img src={photos.during} alt="During" className="w-32 h-32 object-cover rounded-lg shadow" />
              <span className="mt-2 text-sm text-gray-600">Durante</span>
            </div>
          )}
          {photos.after && (
            <div className="flex flex-col items-center">
              <img src={photos.after} alt="After" className="w-32 h-32 object-cover rounded-lg shadow" />
              <span className="mt-2 text-sm text-gray-600">Después</span>
            </div>
          )}
        </div>

        {/* Botón para exportar el reporte a PDF */}
        <button
          onClick={exportToPdf}
          className="mt-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-green-600 transition duration-200"
        >
          Exportar a PDF
        </button>
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
