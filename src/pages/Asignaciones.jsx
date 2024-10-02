import React, { useState, useEffect } from 'react';


const Assignments = () => {
  const [users, setUsers] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [userBucket, setUserBucket] = useState({ user_id: '', bucket_id: '' });
  // Assuming you're using separate API endpoints
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage

      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Error fetching users: Unauthorized');
      }

      setUsers(data.body); // Assuming users are in the "body" property
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBuckets = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage

      const response = await fetch('http://localhost:4000/api/buckets', {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Error fetching buckets: Unauthorized');
      }

      setBuckets(data.body); // Assuming buckets are in the "body" property
    } catch (error) {
      console.error('Error fetching buckets:', error);
    }
  };

  const handleSelectionChange = (e) => {
    const { name, value } = e.target; // Destructure name and value from event target
    setUserBucket({ ...userBucket, [name]: value }); // Update specific property based on name
  };
  // If you're using direct database access, replace API calls with DB functions
  // const fetchUsers = async () => {
  //   try {
  //     const fetchedUsers = await getAllUsers(); // Assuming getAllUsers is in DB/mysql/users
  //     setUsers(fetchedUsers);
  //   } catch (error) {
  //     console.error('Error fetching users:', error);
  //   }
  // };

  // const fetchBuckets = async () => {
  //   try {
  //     const fetchedBuckets = await getAllBuckets(); // Assuming getAllBuckets is in DB/mysql/buckets
  //     setBuckets(fetchedBuckets);
  //   } catch (error) {
  //     console.error('Error fetching buckets:', error);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedUser || !selectedBucket) {
      alert('Please select a user and a bucket');
      return;
    }
  
    try {
      const token = localStorage.getItem('token'); // Get the token
  
      const response = await fetch(`http://localhost:4000/api/user_buckets/${selectedUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the token in the header
        },
        body: JSON.stringify({ bucketId: selectedBucket }),
      });
  
      if (!response.ok) {
        // Handle errors (get error message from response if available)
        const errorData = await response.json(); // Try to parse JSON for error details
        const errorMessage = errorData && errorData.message ? errorData.message : response.statusText;
        throw new Error(`HTTP error! status: ${response.status} ${errorMessage}`);
      }
  
      const data = await response.json();
      console.log('Update successful:', data);
  
      setSelectedUser('');
      setSelectedBucket('');
      alert('User assigned to bucket successfully');
  
    } catch (error) {
      console.error('Error assigning user to bucket:', error);
      alert(`An error occurred while assigning the user: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBuckets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <select onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Select a user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>

      <select onChange={(e) => setSelectedBucket(e.target.value)}>
        <option value="">Select a bucket</option>
        {buckets.map((bucket) => (
          <option key={bucket.id} value={bucket.id}>
            {bucket.name} (Area: {bucket.Area || 'N/A'}, Terminal: {bucket.Terminal || 'N/A'}, Nivel: {bucket.Nivel || 'N/A'})
          </option>
        ))}
      </select>

      <button onClick={handleSubmit}>Assign User</button>
    </div>
  );
};

export default Assignments;