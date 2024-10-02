import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';   

import AttendancePage from './pages/AttendancePage';
import PrivateRoute from './components/PrivateRoute';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationMap from './components/General/LocationMap';
import GeolocationCheck from './components/General/GeolocationCheck';
import CleaningService from './pages/CleaningService';
import Assignments from './pages/Asignaciones'; // Import the Assignments component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Ruta Protegida para el Servicio de Limpieza*/}
        <Route
          path="/CleaningService"
          element={
            <PrivateRoute allowedRoles={['user']}>
              <CleaningService />
            </PrivateRoute>
          }
        />

        {/* Ruta para el componente de Asignaciones */}
        <Route path="/assignments" element={
           <PrivateRoute allowedRoles={['admin']}>
              <Assignments />
           </PrivateRoute>
      } />
      </Routes>
    </Router>
  );
}

export default App;