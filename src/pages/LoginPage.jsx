import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import logo from '../assets/logo.jpg';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Función para verificar si el usuario ya registró asistencia hoy
    const checkAttendance = async (userId) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:4000/api/attendance/today/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al verificar la asistencia');
            }

            const attendanceData = await response.json();
            return attendanceData; // Retorna los datos de asistencia
        } catch (error) {
            console.error('Error en la verificación de asistencia:', error);
            setError('No se pudo verificar la asistencia.');
            return null; // Retorna null en caso de error
        }
    };

    // Función para registrar la asistencia (check-in)
    const registerAttendance = async (userId) => {
        const token = localStorage.getItem('token');

        // Obtener la fecha y hora actual en formato ISO
        const checkInTime = new Date().toISOString();

        // Establecer una ubicación estática o dinámica
        const location = {
            lat: 9.067326498950038, // Reemplaza con valores dinámicos si es necesario
            lng: -79.38772760260268,
        };

        try {
            const responseAttendance = await fetch(`http://localhost:4000/api/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: userId,
                    check_in: checkInTime,
                    location: location,
                }),
            });

            if (!responseAttendance.ok) {
                throw new Error('Error al registrar la asistencia');
            }

            console.log('Asistencia registrada:', await responseAttendance.json());
        } catch (error) {
            console.error('Error en el registro de asistencia:', error);
            setError('No se pudo registrar la asistencia.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:4000/api/Users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.ok && data.accessToken) {
                // Guardar tokens en localStorage
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('role', data.user.role);

                // Verificar si ya registró asistencia hoy
                const attendanceData = await checkAttendance(data.user.id);

                if (attendanceData && !attendanceData.attendanceExists) {
                    // Si no hay registro, registrar asistencia
                    await registerAttendance(data.user.id);
                    console.log('Asistencia registrada después del inicio de sesión.');
                } else if (attendanceData && attendanceData.attendanceExists) {
                    console.log('El usuario ya tiene registro de asistencia hoy:', attendanceData);
                }

                // Redirigir según el rol del usuario
                if (data.user.role === 'user') {
                    navigate('/attendance');
                } else {
                    setError('No tienes los permisos necesarios para acceder.');
                }
            } else {
                setError(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            setLoading(false);
            setError('Error de conexión. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="Logo" className="w-24 h-24" />
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 flex items-center">
                        <User className="text-gray-700 mr-2" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6 flex items-center">
                        <Lock className="text-gray-700 mr-2" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic">{error}</p>}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;