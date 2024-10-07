import React, { useState, useEffect } from 'react';

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
      const response = await fetch('http://localhost:4000/api/users', {
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
      const response = await fetch('http://localhost:4000/api/buckets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setBuckets(data.body);
      console.log("Buckets fetched:", data.body);
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
    console.log("Selected Bucket ID:", selectedBucket); // Aquí debe ser el ID del bucket

    // Validación: asegurarse de que el usuario y el bucket han sido seleccionados
    if (!selectedUser || !selectedBucket) {
      console.log("Debe seleccionar tanto un usuario como una tarea.");
      alert("Debe seleccionar tanto un usuario como una tarea.");
      return;
    }

    const user = users.find((user) => user.id === parseInt(selectedUser));
    const bucket = buckets.find((bucket) => bucket.ID === parseInt(selectedBucket)); // Cambié bucket.id a bucket.ID, basado en la estructura de tu base de datos

    if (user && bucket) {
      console.log(`Asignando usuario ${user.username} al bucket ${bucket.ID}`);
      const updatedAssignments = [...userBuckets, { user_id: user.id, bucket_id: bucket.ID }];
      setUserBuckets(updatedAssignments);
      console.log("Updated assignments:", updatedAssignments);
    } else {
      console.log("User or Bucket not found.");
    }
  };

  // Enviar la tabla actualizada al backend
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      // Hacer un forEach sobre las asignaciones de userBuckets
      userBuckets.forEach(async (assignment) => {
        const { user_id, bucket_id } = assignment;

        const response = await fetch(`http://localhost:4000/api/user_buckets/${user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bucket_id }), // Solo enviar bucket_id en el cuerpo
        });

        if (!response.ok) {
          console.error(`Error updating assignment for user ${user_id}:`, response.status);
        } else {
          console.log(`Assignment updated successfully for user ${user_id}`);
        }
      });

      alert('Assignments updated successfully');
    } catch (error) {
      console.error('Error updating assignments:', error);
      alert('Error updating assignments');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-xl font-bold mb-4">Asignación de Tareas</h2>
      <div className="flex space-x-4">
        {/* Dropdown para seleccionar usuario */}
        <div>
          <h3 className="font-semibold">Usuario</h3>
          <select
            className="p-2 border"
            value={selectedUser}
            onChange={(e) => {
              console.log("User selected:", e.target.value); // Asegúrate de que el usuario está siendo seleccionado correctamente
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
        <div>
          <h3 className="font-semibold">Tarea</h3>
          <select
            className="p-2 border"
            value={selectedBucket}
            onChange={(e) => {
              console.log("Bucket ID selected:", e.target.value); // Selecciona el ID del bucket, no el texto
              setSelectedBucket(e.target.value); // Aquí seleccionamos el ID del bucket
            }}
          >
            <option value="">Seleccionar Tarea</option>
            {buckets.map((bucket) => (
              <option key={bucket.ID} value={bucket.ID}> {/* Aquí usamos bucket.ID */}
                {`(Area: ${bucket.Area}, Terminal: ${bucket.Terminal})`} {/* Muestra Area y Terminal */}
              </option>
            ))}
          </select>
        </div>

        {/* Botón para asignar */}
        <div>
          <button
            onClick={handleAssign}
            className="mt-6 bg-blue-500 text-white p-2 rounded"
          >
            Asignar
          </button>
        </div>
      </div>

      {/* Lista de asignaciones actuales */}
      <h3 className="font-semibold mt-4">Asignaciones</h3>
      <ul>
        {userBuckets.map((assignment, index) => {
          const user = users.find((u) => u.id === assignment.user_id);
          const bucket = buckets.find((b) => b.ID === assignment.bucket_id); // Usamos bucket.ID
          return (
            <li key={index}>
              {user?.username} → {bucket?.Area} ({bucket?.Terminal})
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-green-500 text-white p-2 rounded"
      >
        Enviar Asignaciones
      </button>
    </div>
  );
};

export default Assignments;
