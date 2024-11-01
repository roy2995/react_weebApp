import React, { useState, useEffect } from 'react';
import Header from "../components/General/Header";

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
        // Filtrar solo los buckets con Tipo 8, 9 o 10
        const filteredBuckets = data.body.filter(bucket => 
          bucket.Tipo === "8" || bucket.Tipo === "9" || bucket.Tipo === "10"
        );
        setBuckets(filteredBuckets);
        console.log("Buckets fetched:", filteredBuckets);
      }
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
      const updatedAssignments = [...userBuckets, { user_id: user.id, bucket_id: bucket.ID }];
      setUserBuckets(updatedAssignments);
      setSelectedUser('');
      setSelectedBucket('');
      console.log("Updated assignments:", updatedAssignments);
    } else {
      console.log("User or Bucket not found.");
    }
  };

  // Enviar la tabla actualizada al backend
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const updatePromises = userBuckets.map(async (assignment) => {
        const { user_id, bucket_id } = assignment;

        const response = await fetch(`https://webapi-f01g.onrender.com/api/user_buckets/${user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bucket_id }),
        });

        if (!response.ok) {
          console.error(`Error updating assignment for user ${user_id}:`, response.status);
          throw new Error(`Error updating assignment for user ${user_id}`);
        }
      });

      await Promise.all(updatePromises);
      alert('Assignments updated successfully');
    } catch (error) {
      console.error('Error updating assignments:', error);
      alert('Error updating assignments');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-10">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="max-w-xl w-full bg-white bg-opacity-40 backdrop-blur-lg p-6 rounded-2xl shadow-xl transition-transform duration-300 border border-white/30">
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
              {users.map((user) => (
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
                  {bucket.Area} {/* Solo muestra el nombre del área */}
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
    
          {/* Lista de asignaciones actuales */}
          <h3 className="font-semibold text-center text-gray-900 mb-4">Asignaciones</h3>
          <ul className="list-disc list-inside text-center mb-8 text-gray-900">
            {userBuckets.map((assignment, index) => {
              const user = users.find((u) => u.id === assignment.user_id);
              const bucket = buckets.find((b) => b.ID === assignment.bucket_id);
              return (
                <li key={index} className="text-gray-900 bg-gray-200 bg-opacity-40 p-4 rounded-lg border border-gray-300 backdrop-blur-sm my-3">
                  {user?.username} → {bucket?.Area}
                </li>
              );
            })}
          </ul>
    
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
    </div>
  );
};

export default Assignments;
