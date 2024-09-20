import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import PrivateRoute from './components/PrivateRoute';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationMap from './components/General/LocationMap';
import GeolocationCheck from './components/General/GeolocationCheck'


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

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
