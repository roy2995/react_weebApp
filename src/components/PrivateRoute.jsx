import React from 'react';
import { Navigate } from 'react-router-dom';

// Componente para proteger las rutas privadas
const PrivateRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Si no hay token o el rol no está permitido, redirigir al login o a una página no autorizada
    if (!token || !allowedRoles.includes(role)) {
        return <Navigate to="/" />;
    }

    // Si el rol está permitido, mostrar el componente hijo (es decir, la página protegida)
    return children;
};

export default PrivateRoute;
