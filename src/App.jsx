import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import PrivateRoute from './components/PrivateRoute';
import 'mapbox-gl/dist/mapbox-gl.css';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Ruta protegida para la página de asistencia */}
                <Route 
                    path="/attendance" 
                    element={
                        <PrivateRoute allowedRoles={['user']}>
                            {/* <AttendancePage /> */}
                        </PrivateRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;
