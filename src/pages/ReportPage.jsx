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

    console.log("Report Content:", content);

    try {
      if (content.Report_Type === "Contingency") {
        console.log("Processing Contingency Report");
        // Handle contingency reports as before
        const contingencyPromises = (content.contingencies || []).map(async (contingency) => {
          const contingencyData = await fetchDataById(`contingencies/${contingency.id}`, token);
          return {
            ID: contingencyData.ID || contingency.id,
            Name: contingencyData.Name || 'Nombre no disponible',
            Type: contingencyData.Type || 'Tipo no disponible',
          };
        });

        const contingenciesData = await Promise.all(contingencyPromises);
        
        const details = { 
          report, 
          contingencies: contingenciesData,
          bucket: null,
          tasks: []
        };
        
        setDataIndex(prev => ({ ...prev, [report.id]: details }));
        setSelectedReport(details);

      } else {
        console.log("Processing Standard Report");
        
        const details = {
          report,
          content: content
        };

        setDataIndex(prev => ({ ...prev, [report.id]: details }));
        setSelectedReport(details);
      }
    } catch (error) {
      console.error("Error in fetchDetailsById:", error);
      setSelectedReport({
        report,
        content: {}
      });
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

    const { report } = selectedReport;
    const content = typeof selectedReport.content === 'string' 
      ? JSON.parse(selectedReport.content) 
      : selectedReport.content;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function for wrapping text
    const addWrappedText = (text, x, y) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 7); // Return the new Y position
    };

    doc.setFontSize(18);
    doc.text('Reporte de Actividades', margin, margin);
    doc.setFontSize(12);
    let yPos = margin + 15;

    if (content.Report_Type === "Contingency") {
      yPos = addWrappedText('Reporte de Contingencias', margin, yPos);
      yPos += 10;
      yPos = addWrappedText(`Fecha: ${new Date(report.created_at).toLocaleDateString()}`, margin, yPos);
      yPos += 10;
      yPos = addWrappedText('Contingencias Reportadas:', margin, yPos);
      yPos += 5;
      
      if (selectedReport.contingencies) {
        for (const contingency of selectedReport.contingencies) {
          yPos = addWrappedText(`- ${contingency.Name} - Tipo: ${contingency.Type}`, margin, yPos);
          yPos += 5;
        }
      }
    } else {
      yPos = addWrappedText('Este es un reporte generado automáticamente de las actividades realizadas.', margin, yPos);
      yPos += 10;
      
      yPos = addWrappedText(`Fecha: ${new Date(report.created_at).toLocaleDateString()}`, margin, yPos);
      yPos += 10;

      if (content.area) {
        yPos = addWrappedText(`Área: ${content.area?.name || 'No especificada'}`, margin, yPos);
        yPos += 7;
        yPos = addWrappedText(`Terminal: ${content.area?.terminal || 'No especificada'}`, margin, yPos);
        yPos += 7;
        yPos = addWrappedText(`Nivel: ${content.area?.nivel || 'No especificado'}`, margin, yPos);
        yPos += 10;
      }

      // Tasks section
      if (content.tasks && content.tasks.length > 0) {
        yPos = addWrappedText('Tareas Realizadas:', margin, yPos);
        yPos += 7;
        for (const task of content.tasks) {
          const taskText = `- ${task.info} - Estado: ${task.status === "1" ? 'Completada' : 'Pendiente'}`;
          yPos = addWrappedText(taskText, margin, yPos);
          yPos += 7;
        }
        yPos += 5;
      }

      // Contingencies section
      if (content.contingencies && content.contingencies.length > 0) {
        yPos = addWrappedText('Contingencias Encontradas:', margin, yPos);
        yPos += 7;
        for (const cont of content.contingencies) {
          const contText = `- ${cont.Name || 'Sin nombre'} - Estado: ${cont.status === "1" ? 'Resuelta' : 'Pendiente'}`;
          yPos = addWrappedText(contText, margin, yPos);
          yPos += 7;
        }
      }

      // Photos section
      if (content.photos) {
        yPos += 10;
        yPos = addWrappedText('Fotos del Reporte:', margin, yPos);
        yPos += 10;

        try {
          // Add photos if they exist
          const photoTypes = ['before', 'during', 'after'];
          for (const type of photoTypes) {
            if (content.photos[type]) {
              // Add a new page if we're running out of space
              if (yPos > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                yPos = margin;
              }

              const imgData = await getBase64ImageFromURL(content.photos[type]);
              const imgProps = doc.getImageProperties(imgData);
              const imgWidth = 170; // Fixed width
              const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
              
              doc.text(`Foto ${type}:`, margin, yPos);
              yPos += 7;
              doc.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
              yPos += imgHeight + 10;
            }
          }
        } catch (error) {
          console.error('Error adding images to PDF:', error);
          yPos = addWrappedText('Error al cargar las imágenes', margin, yPos);
        }
      }
    }

    doc.save(`reporte_${report.id}.pdf`);
  };

  const renderPreview = () => {
    if (!selectedReport) return null;
    
    const { report } = selectedReport;
    // Parse the content here since it's stored as a string
    const content = JSON.parse(selectedReport.content);
    
    console.log("Selected Report:", selectedReport);
    console.log("Parsed Content:", content);

    return (
      <div key={`${report.id}-${previewKey}`} className="mb-6 p-4 bg-white rounded-lg shadow text-gray-700">
        <p><strong>Reporte del {new Date(report.created_at).toLocaleDateString()}</strong> 
          {content.Report_Type === "Contingency" ? 
            " de Contingencias" : 
            ` en el área ${content.area.name} de la ${content.area.terminal} nivel ${content.area.nivel}`}
        </p>

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
              {content.tasks && content.tasks.length > 0 ? content.tasks.map((task, i) => (
                <li key={i}>
                  {task.info} {task.status === "1" ? '✓' : '✘'}
                </li>
              )) : <li>No se encontraron tareas.</li>}
            </ul>

            <p><strong>Contingencias Encontradas:</strong></p>
            <ul className="list-disc ml-4">
              {content.contingencies && content.contingencies.length > 0 ? content.contingencies.map((cont, i) => (
                <li key={i}>{cont.Name || 'Nombre no disponible'} {cont.status === "1" ? '✓' : '✘'}</li>
              )) : (
                <li>No se encontraron contingencias.</li>
              )}
            </ul>

            {content.photos && Object.keys(content.photos).length > 0 && (
              <div className="mt-4">
                <p><strong>Fotos del Reporte:</strong></p>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {Object.entries(content.photos).map(([key, url]) => (
                    url && (
                      <div key={key}>
                        <p className="text-sm font-semibold mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}:</p>
                        <img 
                          src={url} 
                          alt={`Foto ${key}`} 
                          className="w-full h-40 object-cover rounded-lg shadow"
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
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
