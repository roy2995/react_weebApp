import React, { useState, useEffect } from 'react';
import Header from '../components/General/Header';
import jsPDF from 'jspdf';

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
    img.onerror = (error) => reject(error);
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
      const response = await fetch(`https://webapi-f01g.onrender.com/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return response.ok ? data.body || [] : [];
    } catch (error) {
      console.error("Error en fetchData:", error);
      return [];
    }
  };

  const fetchDetailsById = async (report) => {
    const token = localStorage.getItem('token');
    const content = JSON.parse(report.content);

    console.log("Tipo de reporte:", content.Report_Type); // Verifica el tipo de reporte

    if (content.Report_Type === "Contingency") {
      console.log("Iniciando búsqueda de contingencias...");

      // Realizamos solicitudes a la API para obtener el nombre de cada contingencia
      const contingencyPromises = content.contingencies.map(async (contingency) => {
        const contingencyData = await fetchDataById(`contingencies/${contingency.ID}`, token);
        console.log("Datos de contingencia obtenidos:", contingencyData);
        
        return {
          ID: contingencyData.ID,
          Name: contingencyData.Name || 'Nombre no disponible',
          Type: contingencyData.Type || 'Tipo no disponible',
        };
      });

      const contingenciesData = await Promise.all(contingencyPromises);
      console.log("Datos de todas las contingencias:", contingenciesData);

      const details = { report, contingencies: contingenciesData };
      setDataIndex((prevState) => ({
        ...prevState,
        [report.id]: details,
      }));
      setSelectedReport(details);

    } else {
      console.log("Iniciando búsqueda para el reporte estándar...");

      const bucketData = await fetchDataById(`buckets/${report.bucket_id}`, token);
      console.log("Datos del bucket obtenidos:", bucketData);

      const progressTaskIDs = content.tasks.map((task) => task.ID);
      console.log("IDs de tareas de progreso:", progressTaskIDs);

      const taskPromises = progressTaskIDs.map(async (progressTaskId) => {
        console.log(`Buscando detalles para la tarea de progreso ID: ${progressTaskId}`);
        
        const progressTask = await fetchDataById(`progress_tasks/${progressTaskId}`, token);
        console.log("Datos de tarea de progreso obtenidos:", progressTask);
        
        const taskId = progressTask[0]?.task_id;
        if (taskId) {
          const task = await fetchDataById(`tasks/${taskId}`, token);
          console.log("Datos de tarea obtenidos:", task);
          
          return { info: task[0]?.info || 'Información no disponible', status: progressTask[0]?.status || 'Pendiente' };
        } else {
          return { info: 'Información no disponible', status: 'Pendiente' };
        }
      });

      const tasksData = await Promise.all(taskPromises);
      console.log("Datos de todas las tareas:", tasksData);

      const details = {
        report: report,
        bucket: bucketData[0] || {},
        tasks: tasksData,
        contingencies: [],
      };

      setDataIndex((prevState) => ({
        ...prevState,
        [report.id]: details,
      }));
      setSelectedReport(details);
    }
  };

  const fetchDataById = async (url, token) => {
    try {
      const response = await fetch(`https://webapi-f01g.onrender.com/api/${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      return response.ok ? data.body || [] : {};
    } catch (error) {
      console.error(`Error en fetchDataById para la URL: ${url}`, error);
      return {};
    }
  };

  const handleCheckboxChange = (report) => {
    if (selectedReport && selectedReport.report.id === report.id) {
      setSelectedReport(null);
    } else {
      fetchDetailsById(report);
    }
    setIsPreviewUpdated(!isPreviewUpdated);
    setPreviewKey((prevKey) => prevKey + 1);
  };

  const exportToPdf = async () => {
    if (!selectedReport) return;

    const { report, bucket, tasks, contingencies } = selectedReport;
    const content = JSON.parse(report.content);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Actividades', 20, 20);
    doc.setFontSize(12);

    if (content.Report_Type === "Contingency") {
      // Formato para el reporte de contingencias
      doc.text('Reporte de Contingencias', 20, 30);
      doc.text(`Fecha: ${new Date(report.created_at).toLocaleDateString()}`, 20, 40);
      doc.text('Contingencias Reportadas:', 20, 50);
      contingencies.forEach((contingency, index) => {
        doc.text(`- ${contingency.Name} - Tipo: ${contingency.Type}`, 20, 60 + index * 10);
      });
    } else {
      // Formato para el reporte normal
      doc.text('Este es un reporte generado automáticamente de las actividades realizadas.', 20, 30);
      doc.text(`Fecha: ${new Date(report.created_at).toLocaleDateString()}`, 20, 40);
      doc.text(`Área: ${bucket?.Area || 'Desconocida'}`, 20, 50);
      doc.text(`Terminal: ${bucket?.Terminal || 'Desconocida'}`, 20, 60);
      doc.text(`Nivel: ${bucket?.Nivel || 'Desconocido'}`, 20, 70);

      doc.text('Tareas Realizadas:', 20, 80);
      tasks.forEach((task, index) => {
        doc.text(`- ${task.info} - Estado: ${task.status ? 'Completada' : 'Pendiente'}`, 20, 90 + index * 10);
      });

      doc.text('Contingencias Encontradas:', 20, 100 + tasks.length * 10);
      contingencies.forEach((cont, index) => {
        doc.text(`- ${cont.Name} - Estado: ${cont.status === '1' ? 'Resuelta' : 'Pendiente'}`, 20, 110 + tasks.length * 10 + index * 10);
      });
    }

    doc.save(`reporte_${report.id}.pdf`);
  };

  const renderPreview = () => {
    if (!selectedReport) return null;
    const { report, bucket, tasks, contingencies } = selectedReport;
    const content = JSON.parse(report.content);

    return (
      <div key={`${report.id}-${previewKey}`} className="mb-6 p-4 bg-white rounded-lg shadow text-gray-700">
        <p><strong>Reporte del {new Date(report.created_at).toLocaleDateString()}</strong> {content.Report_Type === "Contingency" ? "de Contingencias" : `en el área ${bucket?.Area || 'Desconocida'} de la ${bucket?.Terminal || 'Desconocida'} nivel ${bucket?.Nivel || 'Desconocido'}`}</p>

        {content.Report_Type === "Contingency" ? (
          <>
            <p><strong>Contingencias Reportadas:</strong></p>
            <ul className="list-disc ml-4">
              {contingencies.map((contingency, i) => (
                <li key={i}>{contingency.Name} - Tipo: {contingency.Type}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p><strong>Tareas Realizadas:</strong></p>
            <ul className="list-disc ml-4">
              {tasks.length > 0 ? tasks.map((task, i) => (
                <li key={i}>{task.info || 'Información no disponible'} {task.status ? '✓' : '✘'}</li>
              )) : <li>No se encontraron tareas.</li>}
            </ul>

            <p><strong>Contingencias Encontradas:</strong></p>
            <ul className="list-disc ml-4">
              {contingencies.length > 0 ? contingencies.map((cont, i) => (
                <li key={i}>{cont.Name || 'Nombre no disponible'} {cont.status === '1' ? '✓' : '✘'}</li>
              )) : (
                <li>No se encontraron contingencias.</li>
              )}
            </ul>
          </>
        )}

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
          <button onClick={() => setPreviewKey((prev) => prev + 1)} className="mt-4 w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-purple-600 hover:scale-105 transition transform">
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
