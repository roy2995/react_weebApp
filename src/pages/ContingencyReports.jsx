import React, { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import Header from "../components/General/Header";

const ContingencyReport = () => {
  const [area, setArea] = useState(JSON.parse(localStorage.getItem('area')) || {});
  const [allAreas, setAllAreas] = useState([]);
  const [contingencies, setContingencies] = useState(JSON.parse(localStorage.getItem('contingencies')) || []);
  const [selectedContingencies, setSelectedContingencies] = useState(JSON.parse(localStorage.getItem('selectedContingencies')) || []);
  const [photoUrls, setPhotoUrls] = useState(JSON.parse(localStorage.getItem('photoUrls')) || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cloudinaryInstance = new Cloudinary({
    cloud: { cloudName: 'dbl7m4sha' },
  });

  const uploadPhoto = async (event, index) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Reportes de Contingencias');

    console.log(`Uploading contingency photo ${index + 1}...`);
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dbl7m4sha/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const updatedPhotoUrls = [...photoUrls];
      updatedPhotoUrls[index] = data.secure_url;
      setPhotoUrls(updatedPhotoUrls);
      localStorage.setItem('photoUrls', JSON.stringify(updatedPhotoUrls));
      console.log(`Photo ${index + 1} uploaded:`, data.secure_url);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('Fetching area data...');
        const areaResponse = await fetch('http://localhost:4000/api/buckets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!areaResponse.ok) {
          throw new Error(`Error fetching area: ${areaResponse.statusText}`);
        }

        const areaData = await areaResponse.json();
        setAllAreas(areaData.body);
        setArea(areaData.body[0]);
        localStorage.setItem('area', JSON.stringify(areaData.body[0]));
        console.log('Area data:', areaData);

        console.log('Fetching contingencies...');
        const contingenciesResponse = await fetch('http://localhost:4000/api/contingencies', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!contingenciesResponse.ok) {
          throw new Error(`Error fetching contingencies: ${contingenciesResponse.statusText}`);
        }

        const contingenciesData = await contingenciesResponse.json();
        setContingencies(contingenciesData.body);
        localStorage.setItem('contingencies', JSON.stringify(contingenciesData.body));
        console.log('Contingencies data:', contingenciesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAreaChange = (event) => {
    const selectedArea = allAreas.find(area => area.ID === parseInt(event.target.value));
    setArea(selectedArea);
    localStorage.setItem('area', JSON.stringify(selectedArea));
    console.log('Selected area:', selectedArea);
  };

  const handleContingencyChange = (id) => {
    const updatedSelectedContingencies = selectedContingencies.includes(id)
      ? selectedContingencies.filter((contingencyId) => contingencyId !== id)
      : [...selectedContingencies, id];
    setSelectedContingencies(updatedSelectedContingencies);
    localStorage.setItem('selectedContingencies', JSON.stringify(updatedSelectedContingencies));
    console.log('Updated selected contingencies:', updatedSelectedContingencies);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const bucketId = area.ID;

      if (!token) {
        throw new Error("No authorization token found");
      }

      // Generar el contenido del reporte con la estructura correcta y Report_Type
      const reportContent = {
        Report_Type: "Contingency",
        dummyData: "default value",
        contingencies: selectedContingencies.map(id => ({ ID: id, Type: "2", Name: "Contingency Name" })),
        photos: {
          before: photoUrls[0] || null,
          during: photoUrls[1] || null,
          after: photoUrls[2] || null
        }
      };

      console.log('Generated report content:', JSON.stringify(reportContent));

      const reportResponse = await fetch('http://localhost:4000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: reportContent,
          user_id: userId,
          bucket_id: bucketId,
          contingencies_id: selectedContingencies[0] || null
        })
      });

      if (!reportResponse.ok) {
        throw new Error(`Error posting report: ${reportResponse.statusText}`);
      }

      console.log('Report successfully posted.');
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <Header /> {/* Header Importado */}
      {loading ? <p>Cargando...</p> : (
        <div className="max-w-lg w-full bg-white bg-opacity-30 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/30">
          
          {/* Selector de Área */}
          <div className="mb-6">
            <label className="font-semibold block mb-2 text-gray-700">
              <strong>Área Asignada:</strong>
            </label>
            <select 
              className="w-full p-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 bg-opacity-20 backdrop-blur-sm"
              value={area.ID} 
              onChange={handleAreaChange}
            >
              {allAreas.map((area) => (
                <option key={area.ID} value={area.ID}>
                  {area.Area} ({area.Terminal}, Nivel: {area.Nivel})
                </option>
              ))}
            </select>
          </div>

          {/* Sección de Contingencias */}
          <div className="mb-6">
            <label className="font-semibold block mb-2 text-red-700"><strong>Contingencias:</strong></label>
            <div className="space-y-4 overflow-y-auto h-48 p-4 rounded-lg bg-gray-100 bg-opacity-20 border border-gray-200 backdrop-blur-sm">
              {contingencies.map((contingency) => (
                <label key={contingency.ID} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedContingencies.includes(contingency.ID)}
                    onChange={() => handleContingencyChange(contingency.ID)}
                    className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-gray-800">{contingency.Name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subida de Fotos */}
          <div className="mb-6 flex flex-col space-y-2">
            <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
              ${photoUrls[0] ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
              <input
                type="file"
                id="before-photo"
                className="hidden"
                onChange={(e) => uploadPhoto(e, 0)}
              />
              {photoUrls[0] ? '¡Foto Guardada!' : 'Foto Antes'}
            </label>
            <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
              ${photoUrls[1] ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
              <input
                type="file"
                id="during-photo"
                className="hidden"
                onChange={(e) => uploadPhoto(e, 1)}
              />
              {photoUrls[1] ? '¡Foto Guardada!' : 'Foto Durante'}
            </label>
            <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
              ${photoUrls[2] ? 'bg-primary hover:bg-secondary' : 'bg-error hover:bg-red-700'}`}>
              <input
                type="file"
                id="after-photo"
                className="hidden"
                onChange={(e) => uploadPhoto(e, 2)}
              />
              {photoUrls[2] ? '¡Foto Guardada!' : 'Foto Después'}
            </label>
          </div>

          {/* Botón de Enviar */}
          <button 
            onClick={handleSubmit} 
            className="w-full glass bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          >
            Subir Reporte
          </button>
        </div>
      )}
      {error && <p className="text-red-600 mt-4">Error: {error.message}</p>}
    </div>
  );
};

export default ContingencyReport;
