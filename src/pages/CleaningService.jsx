import React from 'react';

const CleaningReport = () => {
  // Datos simulados para mostrar en el layout, pero sin funciones reales
  const dummyArea = "(tipo),";
  const dummyTasks = [
    { id: 1, name: "Limpiar pisos", completed: false },
    { id: 2, name: "Desinfectar superficies", completed: false },
    { id: 3, name: "Eliminar residuos", completed: false },
    { id: 4, name: "limpiar pupu", completed: false}
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-lg transition-transform duration-300">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 tracking-wide">
          Reporte de Limpieza
        </h2>

        {/* Sección de área asignada */}
        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Área Asignada:</strong>
          </label>
          <p className="text-gray-700 bg-gray-100 p-3 rounded-lg border border-gray-200">{dummyArea}</p> {/* Área simulada */}
        </div>

        {/* Lista de tareas */}
        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Tareas a realizar:</strong>
          </label>
          <ul className="space-y-4">
            {dummyTasks.map((task) => (
              <li key={task.id} className="flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                <input type="checkbox" disabled className="mr-2 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500" /> {/* Checkbox con estilo */}
                <span className="text-gray-800">{task.name}</span> {/* Nombre de la tarea */}
              </li>
            ))}
          </ul>
        </div>

        {/* Fotos antes y después */}
        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Subir foto antes de la limpieza</strong>
          </label>
          <input type="file" disabled className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200" />
        </div>

        <div className="mb-6">
          <label className="font-semibold block mb-2 text-gray-700">
            <strong>Subir foto después de la limpieza</strong>
          </label>
          <input type="file" disabled className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200" />
        </div>

        {/* Botón de submit */}
        <button className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-800 active:scale-95 transition-all duration-300 ease-in-out disabled:bg-gray-400">
          Enviar Reporte
        </button>
      </div>
    </div>
  );
};

export default CleaningReport;
