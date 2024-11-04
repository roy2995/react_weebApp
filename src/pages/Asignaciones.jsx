import React, { useState, useEffect } from 'react';
import Header from "../components/General/Header";
import logo from '../assets/logo.jpg';

const Assignments = () => {
  const [users, setUsers] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [userBuckets, setUserBuckets] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');

  // Obtener usuarios desde la API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://webapi-f01g.onrender.com/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setUsers(data.body);
      console.log("Users fetched:", data.body);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Obtener buckets (tareas) desde la API
  const fetchBuckets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://webapi-f01g.onrender.com/api/buckets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        // Filter buckets to only include those with Terminal "Albrook Mall"
        const filteredBuckets = data.body.filter(bucket => bucket.Terminal === "Albrook Mall");
        setBuckets(filteredBuckets);
      }
      console.log("Filtered Buckets fetched:", filteredBuckets);
    } catch (error) {
      console.error('Error fetching buckets:', error);
    }
  };

  // Actualizar el estado inicial
  useEffect(() => {
    fetchUsers();
    fetchBuckets();
  }, []);

  const handleAssign = () => {
    console.log("Assign button clicked");
    console.log("Selected User ID:", selectedUser);
    console.log("Selected Bucket ID:", selectedBucket);

    if (!selectedUser || !selectedBucket) {
      console.log("Debe seleccionar tanto un usuario como una tarea.");
      alert("Debe seleccionar tanto un usuario como una tarea.");
      return;
    }

    const user = users.find((user) => user.id === parseInt(selectedUser));
    const bucket = buckets.find((bucket) => bucket.ID === parseInt(selectedBucket));

    if (user && bucket) {
      console.log(`Asignando usuario ${user.username} al bucket ${bucket.ID}`);
      const updatedAssignments = [...userBuckets, { user_id: user.id, username: user.username, bucket_id: bucket.ID }];
      setUserBuckets(updatedAssignments);
      console.log("Updated assignments:", updatedAssignments);

      setSelectedUser(''); // Limpiar selección de usuario
    } else {
      console.log("User or Bucket not found.");
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().slice(0, 10);

      // Create progress_buckets entries for each assignment
      for (const assignment of userBuckets) {
        const { user_id, bucket_id } = assignment;
        
        const response = await fetch('https://webapi-f01g.onrender.com/api/progress_buckets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bucket_id: parseInt(bucket_id),
            status: "0",
            user_id: parseInt(user_id),
            date: today
          }),
        });

        if (!response.ok) {
          throw new Error(`Error creating assignment for user ${user_id}`);
        }
        
        console.log(`Assignment created successfully for user ${user_id} with bucket ${bucket_id}`);
      }

      alert('Assignments created successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error creating assignments:', error);
      alert('Error creating assignments');
    }
  };

  const handleDeleteAssignment = (index) => {
    const updatedAssignments = userBuckets.filter((_, i) => i !== index);
    setUserBuckets(updatedAssignments);
    console.log("Assignment removed:", updatedAssignments);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4 pt-[5rem]"> {/* Margen superior para el espacio del header */}
      <Header /> {/* Header Importado */}
      
      <div className="w-full max-w-3xl bg-white bg-opacity-40 backdrop-blur-lg p-6 rounded-2xl shadow-xl transition-transform duration-300 border border-white/30 mx-4 flex flex-col justify-between overflow-y-auto"
           style={{ height: "calc(100vh - 8rem)", marginTop: "5rem" }}> {/* Ajuste dinámico para ocupar toda la ventana menos el header y margen */}
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Asignación de Tareas</h2>
        
        {/* Dropdown para seleccionar usuario */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 text-center">Usuario</h3>
          <select
            className="select select-bordered w-full mt-4 bg-gray-200 bg-opacity-40 backdrop-blur-sm rounded-lg border border-gray-300 text-gray-900 text-lg py-3 px-4 leading-tight text-center"
            value={selectedUser}
            onChange={(e) => {
              console.log("User selected:", e.target.value);
              setSelectedUser(e.target.value);
            }}
          >
            <option value="">Seleccionar Usuario</option>
            {users
              .filter(user => !userBuckets.some(assignment => assignment.user_id === user.id))
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
          </select>
        </div>
  
        {/* Dropdown para seleccionar bucket */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 text-center">Tarea</h3>
          <select
            className="select select-bordered w-full mt-4 bg-gray-200 bg-opacity-40 backdrop-blur-sm rounded-lg border border-gray-300 text-gray-900 text-lg py-3 px-4 leading-tight text-center overflow-hidden whitespace-nowrap overflow-ellipsis"
            style={{ minWidth: "300px" }}
            value={selectedBucket}
            onChange={(e) => {
              console.log("Bucket ID selected:", e.target.value);
              setSelectedBucket(e.target.value);
            }}
          >
            <option value="">Seleccionar Tarea</option>
            {buckets.map((bucket) => (
              <option key={bucket.ID} value={bucket.ID}>
                {`(Area: ${bucket.Area}, Terminal: ${bucket.Terminal}, Nivel: ${bucket.Nivel})`}
              </option>
            ))}
          </select>
        </div>
  
        {/* Botón para asignar */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAssign}
            className="w-full bg-primary text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          >
            Asignar
          </button>
        </div>
  
        {/* Lista de asignaciones actuales con botón para eliminar */}
        <h3 className="font-semibold text-center text-gray-900 mb-4">Asignaciones</h3>
        <div className="overflow-y-auto max-h-40 mb-8">
          <ul className="list-disc list-inside text-center text-gray-900">
            {userBuckets.map((assignment, index) => {
              const bucket = buckets.find((b) => b.ID === assignment.bucket_id);
              return (
                <li key={index} className="text-gray-900 bg-gray-200 bg-opacity-40 p-4 rounded-lg border border-gray-300 backdrop-blur-sm my-3 flex justify-between items-center">
                  {assignment.username} → {bucket?.Area} ({bucket?.Terminal}, Nivel: {bucket?.Nivel})
                  <button
                    onClick={() => handleDeleteAssignment(index)}
                    className="ml-4 text-red-600 font-semibold hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
  
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className="w-full bg-success text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          >
            Enviar Asignaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
