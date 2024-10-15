import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import PrivateRoute from './components/PrivateRoute';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationMap from './components/General/LocationMap';
import GeolocationCheck from './components/General/GeolocationCheck';
import CleaningService from './pages/CleaningService';
import Assignments from './pages/Asignaciones';
import Dashboard from './pages/DashboardPage'; // Asegúrate de que esta ruta sea correcta
import ContingencyReports from './pages/ContingencyReports'; // Asegúrate de que esta ruta sea correcta

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Ruta Protegida para el Servicio de Limpieza */}
        <Route
          path="/CleaningService"
          element={
            <PrivateRoute allowedRoles={['user']}>
              <CleaningService />
            </PrivateRoute>
          }
        />

        {/* Ruta para el componente de Asignaciones */}
        <Route 
          path="/assignments" 
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <Assignments />
            </PrivateRoute>
          } 
        />

        {/* Ruta para el Dashboard */}
        <Route 
          path="/Dashboard" 
          element={
            <PrivateRoute allowedRoles={['admin', 'enterprise']}> {/* Ajusta los roles permitidos según sea necesario */}
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Ruta para el Reporte de Contingencias */}
        <Route 
          path="/ContingencyReports" 
          element={
            <PrivateRoute allowedRoles={['admin', 'user']}>
              <ContingencyReports />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
