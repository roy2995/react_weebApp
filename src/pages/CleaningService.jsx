import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../components/General/Header";
import jsPDF from "jspdf";

// Constantes y configuración
const API_BASE_URL = 'https://webapi-f01g.onrender.com/api';
const CLOUDINARY_PRESET = 'Reportes de Limpieza';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dbl7m4sha/image/upload';

// Tipos de errores
const ERROR_TYPES = {
  AUTH: 'auth_error',
  UPLOAD: 'upload_error',
  SUBMIT: 'submit_error',
  NETWORK: 'network_error',
  VALIDATION: 'validation_error'
};

// Estados de progreso
const PROGRESS_STATUS = {
  PENDING: 0,
  COMPLETED: 1,
  FAILED: 2
};

// Constantes para logging
const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

// Sistema de logging mejorado
const logSystem = {
  logs: [],
  maxLogs: 100,

  log(level, message, data = null) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      sessionId: localStorage.getItem('sessionId')
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](message, data);
    }

    // Podríamos enviar logs críticos al servidor
    if (level === LOG_LEVELS.ERROR) {
      this.sendErrorToServer(logEntry);
    }
  },

  async sendErrorToServer(logEntry) {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        console.error('Failed to send log to server');
      }
    } catch (error) {
      console.error('Error sending log:', error);
    }
  }
};

const LoadingOverlay = ({ isVisible, message, timeout = 30000 }) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setShowTimeout(true);
      }, timeout);
    }
    return () => clearTimeout(timeoutId);
  }, [isVisible, timeout]);

  // ... resto del componente ...
};

// Cache manager
const cacheManager = {
  set(key, data, ttl = 3600000) { // 1 hora por defecto
    const item = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      logSystem.log(LOG_LEVELS.ERROR, 'Cache write error', error);
      return false;
    }
  },

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (!item) return null;

      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      logSystem.log(LOG_LEVELS.ERROR, 'Cache read error', error);
      return null;
    }
  },

  clear(pattern = null) {
    if (pattern) {
      Object.keys(localStorage)
        .filter(key => key.match(pattern))
        .forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
    }
  }
};

// Circuit Breaker implementation
class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailure = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF-OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
}

// Retry mechanism
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};

// Componente para mostrar tareas al usuario
const TaskDisplay = ({ tasks, selectedTasks, handleTaskChange, userRole }) => {
  const [taskFilter, setTaskFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => 
        task.info.toLowerCase().includes(taskFilter.toLowerCase())
      )
      .sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.info.localeCompare(b.info)
          : b.info.localeCompare(a.info);
      });
  }, [tasks, taskFilter, sortOrder]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Tareas a realizar</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar tarea..."
            className="px-3 py-1 border rounded"
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
          />
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            {sortOrder === 'asc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div 
            key={task.ID} 
            className={`flex items-center space-x-3 bg-white bg-opacity-50 p-3 rounded-lg
              ${selectedTasks.includes(task.ID) ? 'border-l-4 border-green-500' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedTasks.includes(task.ID)}
              onChange={() => handleTaskChange(task.ID)}
              className="w-5 h-5 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{task.info}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para mostrar fotos en reportes (Admin)
const ReportPhotoViewer = ({ photos, reportId }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(selectedPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${selectedPhoto.type}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Fotos del Reporte</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        {['before', 'during', 'after'].map((type) => (
          photos[type] && (
            <div 
              key={type}
              className="relative cursor-pointer"
              onClick={() => handlePhotoClick({ url: photos[type], type })}
            >
              <img
                src={photos[type]}
                alt={`Foto ${type}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <span className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {type === 'before' ? 'Antes' : type === 'during' ? 'Durante' : 'Después'}
              </span>
            </div>
          )
        ))}
      </div>

      {/* Modal para vista detallada */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">
                Foto {selectedPhoto.type === 'before' ? 'Antes' : 
                      selectedPhoto.type === 'during' ? 'Durante' : 'Después'}
              </h4>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <img
              src={selectedPhoto.url}
              alt={`Foto ${selectedPhoto.type}`}
              className="w-full max-h-[70vh] object-contain mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Descargando...' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook personalizado para manejar permisos
const usePermissions = () => {
  const userRole = localStorage.getItem('role');
  
  return {
    canViewTasks: true, // Todos pueden ver tareas
    canEditTasks: userRole === 'admin',
    canViewPhotos: userRole === 'admin',
    canDownloadPhotos: userRole === 'admin',
    canDeleteReports: userRole === 'admin',
    isAdmin: userRole === 'admin'
  };
};

const CleaningService = () => {
  const navigate = useNavigate();
  
  // Estados de carga
  const [mainLoading, setMainLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState({
    before: false,
    during: false,
    after: false
  });

  // Estados de datos
  const [area, setArea] = useState({});
  const [tasks, setTasks] = useState([]);
  const [contingencies, setContingencies] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedContingencies, setSelectedContingencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [beforePhotoSaved, setBeforePhotoSaved] = useState(false);
  const [duringPhotoSaved, setDuringPhotoSaved] = useState(false);
  const [afterPhotoSaved, setAfterPhotoSaved] = useState(false);
  const [TaskProgressData, setTaskProgressData] = useState([]);
  const [contingencyProgressData, setContingencyProgressData] = useState([]);

  // Agregar estados para mejor control de fotos
  const [photoStates, setPhotoStates] = useState({
    before: {
      url: localStorage.getItem('beforePhotoUrl') || null,
      loading: false,
      error: null
    },
    during: {
      url: localStorage.getItem('duringPhotoUrl') || null,
      loading: false,
      error: null
    },
    after: {
      url: localStorage.getItem('afterPhotoUrl') || null,
      loading: false,
      error: null
    }
  });

  // Estado para mensajes de error/éxito
  const [feedback, setFeedback] = useState({
    type: null, // 'error' | 'success' | 'warning'
    message: null,
    details: null
  });

  // Constantes de errores y validaciones
  const VALIDATION_RULES = {
    PHOTO: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
      REQUIRED: ['before', 'after'] // fotos obligatorias
    },
    TASKS: {
      MIN_SELECTED: 1
    }
  };

  // Funciones de utilidad para validación
  const validatePhoto = (file, type) => {
    if (VALIDATION_RULES.PHOTO.REQUIRED.includes(type) && !file) {
      return { isValid: false, error: `La foto ${type} es obligatoria` };
    }

    if (file) {
      if (!VALIDATION_RULES.PHOTO.ALLOWED_TYPES.includes(file.type)) {
        return { 
          isValid: false, 
          error: 'Formato de imagen no válido. Use JPG o PNG' 
        };
      }

      if (file.size > VALIDATION_RULES.PHOTO.MAX_SIZE) {
        return { 
          isValid: false, 
          error: 'La imagen es demasiado grande (máximo 5MB)' 
        };
      }
    }

    return { isValid: true };
  };

  // Función mejorada para validar el estado del reporte
  const validateReportState = () => {
    const errors = [];
    
    // Validar fotos requeridas
    if (!localStorage.getItem('beforePhotoUrl')) {
      errors.push('Falta la foto "Antes"');
    }
    if (!localStorage.getItem('afterPhotoUrl')) {
      errors.push('Falta la foto "Después"');
    }

    // Validar selección de tareas
    if (!selectedTasks || selectedTasks.length === 0) {
      errors.push('Debe seleccionar al menos una tarea');
    }

    return errors;
  };

  // Función para manejar errores de red
  const handleNetworkError = async (promise) => {
    try {
      return await promise;
    } catch (error) {
      console.error('Error de red:', error);
      if (!navigator.onLine) {
        throw new Error('No hay conexión a internet');
      }
      throw error;
    }
  };

  // Mantener las constantes existentes y agregar validación
  const CLOUDINARY_CONFIG = {
    PRESET: 'Reportes de Limpieza',
    URL: 'https://api.cloudinary.com/v1_1/dbl7m4sha/image/upload',
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg']
  };

  // Mejorar la función uploadPhoto existente
  const uploadPhoto = async (event, type) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('No se seleccionó archivo');
      return;
    }

    // Validar tipo y tamaño
    if (!CLOUDINARY_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      console.error('Tipo de archivo no permitido');
      setError('Por favor seleccione una imagen JPG o PNG');
      return;
    }

    if (file.size > CLOUDINARY_CONFIG.MAX_SIZE) {
      console.error('Archivo demasiado grande');
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.PRESET);

    try {
      console.log(`Iniciando carga de foto ${type}...`);
      
      const response = await fetch(CLOUDINARY_CONFIG.URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error en la carga: ${response.statusText}`);
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Guardar URL y actualizar estado
      localStorage.setItem(`${type}PhotoUrl`, imageUrl);
      console.log(`URL de foto ${type} guardada:`, imageUrl);

      // Actualizar estados
      switch(type) {
        case 'before':
          setBeforePhotoSaved(true);
          break;
        case 'during':
          setDuringPhotoSaved(true);
          break;
        case 'after':
          setAfterPhotoSaved(true);
          break;
      }

    } catch (error) {
      console.error('Error en uploadPhoto:', error);
      setError(`Error al subir la foto: ${error.message}`);
    }
  };

  // Mejorar la estructura del reporte para incluir fotos correctamente
  const prepareReportContent = () => {
    // Verificar y obtener URLs de fotos
    const photoUrls = {
      before: localStorage.getItem('beforePhotoUrl'),
      during: localStorage.getItem('duringPhotoUrl'),
      after: localStorage.getItem('afterPhotoUrl')
    };

    console.log('URLs de fotos para el reporte:', photoUrls);

    // Validar fotos obligatorias
    if (!photoUrls.before || !photoUrls.after) {
      throw new Error('Faltan fotos obligatorias (antes/después)');
    }

    return {
      area: JSON.parse(localStorage.getItem('area') || '{}'),
      tasks: selectedTasks.map(taskId => {
        const task = tasks.find(t => t.ID === taskId);
        return {
          id: taskId,
          info: task?.info || '',
          status: 1
        };
      }),
      contingencies: selectedContingencies.map(contId => {
        const cont = contingencies.find(c => c.ID === contId);
        return {
          id: contId,
          name: cont?.Name || '',
          status: 1
        };
      }),
      photos: photoUrls,
      timestamp: new Date().toISOString()
    };
  };

  // Modificar handleSubmit para usar la nueva estructura
  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('Iniciando envío de reporte...');

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const bucketId = area.ID;

      // Validate required photos
      if (!localStorage.getItem('beforePhotoUrl') || !localStorage.getItem('afterPhotoUrl')) {
        throw new Error('Se requieren fotos de antes y después');
      }

      if (selectedTasks.length === 0) {
        throw new Error('Debe seleccionar al menos una tarea');
      }

      // Create task progress records
      const taskProgressPromises = selectedTasks.map(taskId =>
        fetch(`${API_BASE_URL}/progress_tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            task_id: taskId,
            status: "1",
            user_id: parseInt(userId),
            date: new Date().toISOString().slice(0, 10)
          })
        }).then(res => res.json())
      );

      const taskProgressResults = await Promise.all(taskProgressPromises);
      console.log('Task progress results:', taskProgressResults);

      // Create report content matching ReportPage structure
      const reportContent = {
        area: {
          id: area.ID,
          name: area.Area,
          terminal: area.Terminal,
          nivel: area.Nivel
        },
        tasks: selectedTasks.map(taskId => {
          const task = tasks.find(t => t.ID === taskId);
          return {
            id: taskId,
            info: task?.info || '',
            status: "1"
          };
        }),
        contingencies: selectedContingencies.map(contId => {
          const cont = contingencies.find(c => c.ID === contId);
          return {
            id: contId,
            name: cont?.Name || '',
            status: "1"
          };
        }),
        photos: {
          before: localStorage.getItem('beforePhotoUrl'),
          during: localStorage.getItem('duringPhotoUrl'),
          after: localStorage.getItem('afterPhotoUrl')
        },
        date: new Date().toISOString(),
        Report_Type: "Standard"
      };

      console.log('Contenido del reporte a enviar:', reportContent);

      // Send report
      const reportResponse = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: JSON.stringify(reportContent),
          user_id: parseInt(userId),
          bucket_id: parseInt(bucketId),
          created_at: new Date().toISOString()
        })
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(`Error al enviar el reporte: ${errorData.message}`);
      }

      const reportResult = await reportResponse.json();
      console.log('Reporte enviado exitosamente:', reportResult);

      alert('¡Reporte enviado exitosamente!');
      
      // Clear localStorage
      localStorage.removeItem('selectedTasks');
      localStorage.removeItem('beforePhotoUrl');
      localStorage.removeItem('duringPhotoUrl');
      localStorage.removeItem('afterPhotoUrl');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para limpiar localStorage
  const clearLocalStorageExceptAuth = () => {
    const keysToKeep = ['token', 'userId', 'role'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  };

  // Componente para mostrar feedback
  const FeedbackMessage = () => {
    if (!feedback.message) return null;

    const bgColor = {
      error: 'bg-red-100 border-red-400 text-red-700',
      success: 'bg-green-100 border-green-400 text-green-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
    }[feedback.type];

    return (
      <div className={`p-4 mb-4 rounded border ${bgColor}`}>
        <p className="font-bold">{feedback.message}</p>
        {feedback.details && (
          <ul className="mt-2 list-disc list-inside">
            {Array.isArray(feedback.details) 
              ? feedback.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))
              : <p>{feedback.details}</p>
            }
          </ul>
        )}
      </div>
    );
  };

  // Mejorar el manejo de tareas
  const handleTaskChange = (taskId) => {
    const updatedTasks = selectedTasks.includes(taskId)
      ? selectedTasks.filter((id) => id !== taskId)
      : [...selectedTasks, taskId];

    const updatedProgressData = updatedTasks.map((id) => ({
      taskId: id,
      status: 1,
    }));

    setSelectedTasks(updatedTasks);
    setTaskProgressData(updatedProgressData);
    localStorage.setItem('selectedTasks', JSON.stringify(updatedTasks));
    localStorage.setItem('TaskProgressData', JSON.stringify(updatedProgressData));

    console.log('Task updated:', updatedProgressData);
  };

  // Corregir la verificación del checkbox en las tareas
  const isTaskSelected = (taskId) => {
    return selectedTasks.includes(taskId);
  };

  // Mejorar el manejo de contingencias
  const handleContingencyChange = (contingencyId) => {
    console.log('Actualizando contingencia:', contingencyId);
    
    try {
      const updatedContingencies = selectedContingencies.includes(contingencyId)
        ? selectedContingencies.filter((id) => id !== contingencyId)
        : [...selectedContingencies, contingencyId];

      const updatedProgressData = updatedContingencies.map((id) => ({
        contingencyId: id,
        status: updatedContingencies.includes(id) ? 1 : 0,
      }));

      // Actualizar estados y localStorage
      setSelectedContingencies(updatedContingencies);
      setContingencyProgressData(updatedProgressData);
      localStorage.setItem('selectedContingencies', JSON.stringify(updatedContingencies));
      localStorage.setItem('contingencyProgressData', JSON.stringify(updatedProgressData));

      console.log('Contingencia actualizada:', {
        selectedContingencies: updatedContingencies,
        progressData: updatedProgressData
      });

    } catch (error) {
      console.error('Error al actualizar contingencia:', error);
      setError('Error al actualizar la contingencia');
    }
  };

  const verifyPhotosBeforeSubmit = () => {
    const beforeUrl = localStorage.getItem('beforePhotoUrl');
    const afterUrl = localStorage.getItem('afterPhotoUrl');
    const duringUrl = localStorage.getItem('duringPhotoUrl');

    console.log('Verificando fotos antes del envío:', {
      before: !!beforeUrl,
      during: !!duringUrl,
      after: !!afterUrl
    });

    if (!beforeUrl || !afterUrl) {
      throw new Error('Debe subir las fotos de antes y después');
    }

    return {
      beforeUrl,
      duringUrl,
      afterUrl
    };
  };

  // Mejorar el renderizado de tareas
  const renderTasks = () => {
    if (!tasks || tasks.length === 0) {
      console.log('No hay tareas disponibles');
      return <p>No hay tareas disponibles</p>;
    }

    return (
      <div className="mb-6">
        <label className="font-semibold block mb-2 text-gray-700">
          <strong>Tareas a realizar:</strong>
        </label>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
              <input
                type="checkbox"
                checked={isTaskSelected(task.ID)}
                onChange={() => handleTaskChange(task.ID)}
                className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-800 text-sm md:text-base">{task.info}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Función para cargar imágenes de forma nativa
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';  // Importante para Cloudinary
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error('Error al cargar imagen:', e);
        reject(new Error('Error al cargar la imagen'));
      };
      img.src = url;
    });
  };

  // Función mejorada para generar PDF
  const generatePDF = async (reportData) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Título y encabezado
    doc.setFontSize(16);
    doc.text('Reporte de Limpieza', margin, yPos);
    yPos += 15;

    // Información del área
    doc.setFontSize(12);
    doc.text(`Área: ${reportData.area.Area}`, margin, yPos);
    yPos += 10;
    doc.text(`Terminal: ${reportData.area.Terminal}`, margin, yPos);
    yPos += 10;
    doc.text(`Nivel: ${reportData.area.Nivel}`, margin, yPos);
    yPos += 15;

    // Tareas
    doc.setFontSize(14);
    doc.text('Tareas Realizadas:', margin, yPos);
    yPos += 10;
    doc.setFontSize(12);

    // Función helper para texto con salto de línea
    const addWrappedText = (text, y) => {
      const splitText = doc.splitTextToSize(text, contentWidth - margin);
      doc.text(splitText, margin, y);
      return y + (splitText.length * 7);
    };

    // Agregar tareas
    reportData.tasks.forEach(task => {
      yPos = addWrappedText(`• ${task.info}`, yPos);
      yPos += 7;
    });

    // Contingencias
    if (reportData.contingencies.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.text('Contingencias:', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      reportData.contingencies.forEach(cont => {
        yPos = addWrappedText(`• ${cont.name}`, yPos);
        yPos += 7;
      });
    }

    // Fotos
    try {
      // Función para agregar imagen
      const addImageToPDF = async (url, label) => {
        if (!url) return yPos;

        try {
          const img = await loadImage(url);
          
          // Calcular dimensiones de la imagen
          const imgWidth = 160;
          const imgHeight = (img.height * imgWidth) / img.width;

          // Verificar si necesitamos nueva página
          if (yPos + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            yPos = 20;
          }

          // Agregar etiqueta
          doc.setFontSize(12);
          doc.text(label, margin, yPos);
          yPos += 10;

          // Agregar imagen
          doc.addImage(img, 'JPEG', margin, yPos, imgWidth, imgHeight, undefined, 'FAST');
          return yPos + imgHeight + 15;
        } catch (error) {
          console.error(`Error al agregar imagen ${label}:`, error);
          doc.text(`Error al cargar imagen ${label}`, margin, yPos);
          return yPos + 10;
        }
      };

      // Agregar cada imagen
      yPos += 10;
      doc.setFontSize(14);
      doc.text('Evidencia Fotográfica:', margin, yPos);
      yPos += 15;

      if (reportData.photos.before) {
        yPos = await addImageToPDF(reportData.photos.before, 'Foto Antes:');
      }
      if (reportData.photos.during) {
        yPos = await addImageToPDF(reportData.photos.during, 'Foto Durante:');
      }
      if (reportData.photos.after) {
        yPos = await addImageToPDF(reportData.photos.after, 'Foto Después:');
      }

    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      doc.text('Error al procesar imágenes', margin, yPos);
    }

    return doc;
  };

  // Agregar log para debugging
  useEffect(() => {
    console.log('Estado actual:', {
      area,
      tasks,
      selectedTasks,
      contingencies,
      selectedContingencies,
      loading,
      error,
      beforePhotoSaved,
      duringPhotoSaved,
      afterPhotoSaved
    });
  }, [area, tasks, selectedTasks, contingencies, selectedContingencies, loading, error, beforePhotoSaved, duringPhotoSaved, afterPhotoSaved]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          navigate('/');
          return;
        }

        // First get all buckets
        const bucketsResponse = await fetch(
          `${API_BASE_URL}/buckets`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const bucketsData = await bucketsResponse.json();
        console.log('All buckets:', bucketsData.body);

        // Get all progress_buckets for this user
        const progressResponse = await fetch(
          `${API_BASE_URL}/progress_buckets?user_id=${userId}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        const progressData = await progressResponse.json();
        console.log('All progress buckets:', progressData.body);

        if (!progressData.body || progressData.body.length === 0) {
          throw new Error('No hay registros de asignaciones');
        }

        // Get the latest assignment by sorting all assignments by date and ID
        const sortedAssignments = progressData.body.sort((a, b) => {
          // First compare dates
          const dateComparison = new Date(b.date) - new Date(a.date);
          if (dateComparison !== 0) return dateComparison;
          // If dates are equal, compare IDs
          return b.id - a.id;
        });

        const latestAssignment = sortedAssignments[0];
        console.log('Latest assignment:', latestAssignment);

        // Get bucket data for the latest assignment
        const currentBucket = bucketsData.body.find(b => b.ID === latestAssignment.bucket_id);
        console.log('Current bucket:', currentBucket);

        if (!currentBucket) {
          throw new Error('No se encontró información del área asignada');
        }

        setArea(currentBucket);
        localStorage.setItem('area', JSON.stringify(currentBucket));

        // Load and filter tasks based on the area type
        const tasksResponse = await fetch(
          `${API_BASE_URL}/tasks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const tasksData = await tasksResponse.json();
        console.log('All tasks:', tasksData.body);
        
        // Filter tasks matching the current bucket type
        const filteredTasks = tasksData.body.filter(task => 
          task.Type.toString() === currentBucket.Tipo.toString()
        );
        
        console.log('Filtered tasks:', filteredTasks);
        setTasks(filteredTasks);
        localStorage.setItem('tasks', JSON.stringify(filteredTasks));

        setLoading(false);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 pt-20" style={{ marginTop: '2rem' }}>
      <Header />
      <div className="max-w-4xl w-full bg-white bg-opacity-30 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/30">
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        ) : (
          <>
            {/* Área Asignada - agregar validación */}
            <div className="mb-6">
              <label className="font-semibold block mb-2 text-gray-700">
                <strong>Área Asignada:</strong>
              </label>
              {area && Object.keys(area).length > 0 ? (
                <p className="text-gray-700 bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
                  {area.Area} ({area.Tipo}), Terminal: {area.Terminal}, Nivel: {area.Nivel}
                </p>
              ) : (
                <p className="text-yellow-600">No hay área asignada</p>
              )}
            </div>

            {/* Tareas - agregar validación */}
            <div className="mb-6">
              <label className="font-semibold block mb-2 text-gray-700">
                <strong>Tareas a realizar: {tasks.length > 0 && `(${tasks.length})`}</strong>
              </label>
              {tasks && tasks.length > 0 ? (
                <ul className="space-y-4">
                  {tasks.map((task) => (
                    <li key={task.ID} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200 bg-opacity-20 backdrop-blur-sm">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.ID)}
                        onChange={() => handleTaskChange(task.ID)}
                        className="mr-2 w-5 h-5 rounded-full focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-800 text-sm md:text-base">{task.info}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-yellow-600 bg-yellow-100 p-3 rounded-lg">
                  No hay tareas disponibles para esta área
                </p>
              )}
            </div>

            {/* Contingencias - agregar validación */}
            <div className="mb-6">
              <label className="font-semibold block mb-2 text-red-700">
                <strong>Contingencias: {contingencies.length > 0 && `(${contingencies.length})`}</strong>
              </label>
              {contingencies && contingencies.length > 0 ? (
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
              ) : (
                <p className="text-gray-600 bg-gray-100 p-3 rounded-lg">
                  No hay contingencias registradas para esta área
                </p>
              )}
            </div>

            {/* Fotos */}
            <div className="mb-6 flex flex-col space-y-2">
              <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
                ${beforePhotoSaved ? 'bg-green-500' : 'bg-blue-500'}`}>
                <input
                  type="file"
                  id="before-photo"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e, 'before')}
                />
                {beforePhotoSaved ? '✓ Foto Antes Guardada' : 'Subir Foto Antes'}
              </label>

              <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
                ${duringPhotoSaved ? 'bg-green-500' : 'bg-blue-500'}`}>
                <input
                  type="file"
                  id="during-photo"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e, 'during')}
                />
                {duringPhotoSaved ? '✓ Foto Durante Guardada' : 'Subir Foto Durante'}
              </label>

              <label className={`w-full glass text-white font-bold py-2 px-4 rounded-lg shadow-lg cursor-pointer text-center 
                ${afterPhotoSaved ? 'bg-green-500' : 'bg-blue-500'}`}>
                <input
                  type="file"
                  id="after-photo"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e, 'after')}
                />
                {afterPhotoSaved ? '✓ Foto Después Guardada' : 'Subir Foto Después'}
              </label>
            </div>

            {/* Agregar validación al botón de envío */}
            <button 
              onClick={handleSubmit}
              disabled={loading || selectedTasks.length === 0 || !beforePhotoSaved || !afterPhotoSaved}
              className={`w-full glass text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out
                ${loading || selectedTasks.length === 0 || !beforePhotoSaved || !afterPhotoSaved
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-accent hover:scale-105 active:scale-95'
                }`}
            >
              {loading ? 'Enviando...' : 'Enviar Reporte'}
            </button>
            
            {/* Agregar mensaje de validación */}
            {(selectedTasks.length === 0 || !beforePhotoSaved || !afterPhotoSaved) && (
              <p className="text-yellow-600 text-sm mt-2">
                {selectedTasks.length === 0 && "Seleccione al menos una tarea. "}
                {!beforePhotoSaved && "Falta foto 'Antes'. "}
                {!afterPhotoSaved && "Falta foto 'Después'."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CleaningService; 
