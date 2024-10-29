import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import 'mapbox-gl/dist/mapbox-gl.css';
import CleaningService from './pages/CleaningService';
import Assignments from './pages/Asignaciones';
import Dashboard from './pages/DashboardPage';
import ContingencyReports from './pages/ContingencyReports';
import ReportsPage from './pages/ReportPage'; // Importa la nueva página

function App() {
  const routes = [
    { path: "/", element: <Login /> },
    { path: "/CleaningService", element: <CleaningService />, roles: ['user'] },
    { path: "/assignments", element: <Assignments />, roles: ['admin'] },
    { path: "/Dashboard", element: <Dashboard />, roles: ['admin', 'enterprise'] },
    { path: "/ContingencyReports", element: <ContingencyReports />, roles: ['admin', 'user'] }, // Aquí envolvemos en PrivateRoute
    { path: "/ReportsPage", element: <ReportsPage />, roles: ['admin', 'enterprise'] },
  ];

  return (
    <Router>
      <Routes>
        {routes.map(({ path, element, roles }) => (
          <Route
            key={path}
            path={path}
            element={roles ? (
              <PrivateRoute allowedRoles={roles}>
                {element}
              </PrivateRoute>
            ) : (
              element
            )}
          />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
