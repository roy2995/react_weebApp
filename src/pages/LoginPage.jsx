import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import logo from '../assets/logo.jpg';
import GeolocationCheck from '../components/General/GeolocationCheck';
import LocationMap from '../components/General/LocationMap';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLocationChecked, setIsLocationChecked] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [locationFailure, setLocationFailure] = useState(false);
    const [geolocationAttempts, setGeolocationAttempts] = useState(0);
    const navigate = useNavigate();

    const checkAttendance = async (userId) => {
        const token = localStorage.getItem('token');
        console.log(`Verificando asistencia para el usuario con ID: ${userId}`);

        try {
            const response = await fetch(`https://webapi-f01g.onrender.com/api/attendance/today/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al verificar la asistencia');
            }

            const attendanceData = await response.json();
            console.log('Resultado de verificación de asistencia:', attendanceData);
            return attendanceData;
        } catch (error) {
            console.error('Error en la verificación de asistencia:', error);
            setError('No se pudo verificar la asistencia.');
            return null;
        }
    };

    const registerAttendance = async (userId) => {
        const token = localStorage.getItem('token');
        const checkInTime = new Date().toISOString();

        console.log('Intentando registrar asistencia para el usuario:', userId);
        console.log('Posición del usuario:', userPosition);

        if (!userPosition || !userPosition.lat || !userPosition.lng) {
            console.error('Ubicación no disponible o fuera del área designada.');
            setError('Ubicación no disponible o fuera del área designada.');
            return;
        }

        try {
            const responseAttendance = await fetch(`https://webapi-f01g.onrender.com/api/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: userId,
                    check_in: checkInTime,
                    location: {
                        lat: userPosition.lat,
                        lng: userPosition.lng,
                    },
                }),
            });

            if (!responseAttendance.ok) {
                const errorDetails = await responseAttendance.text();
                throw new Error(`Error al registrar la asistencia: ${errorDetails}`);
            }

            const result = await responseAttendance.json();
            console.log('Asistencia registrada correctamente:', result);
        } catch (error) {
            console.error('Error en el registro de asistencia:', error.message);
            setError('No se pudo registrar la asistencia. Detalles: ' + error.message);
        }
    };

    const handleLocationSuccess = (position) => {
        console.log('Ubicación verificada correctamente:', position);
        setIsLocationChecked(true);
        setUserPosition(position);
        setLocationFailure(false);
    };

    const handleLocationFailure = async () => {
        setGeolocationAttempts(prev => prev + 1);
        console.error(`Fallo en la geolocalización: fuera del área designada. Intento número ${geolocationAttempts}`);

        if (geolocationAttempts < 3) {
            console.log(`Reintentando verificación de geolocalización... (Intento ${geolocationAttempts + 1})`);
        } else {
            console.error('No se pudo verificar la ubicación después de 3 intentos.');
            setError('No estás dentro del área designada para iniciar turno.');
            setLocationFailure(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setGeolocationAttempts(0);

        console.log(`Intentando autenticar al usuario: ${username}`);

        try {
            // Autenticar primero
            const response = await fetch('https://webapi-f01g.onrender.com/api/Users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Resultado de autenticación:', data);
            setLoading(false);

            if (response.ok && data.accessToken) {
                console.log('Autenticación exitosa, guardando tokens en localStorage');
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);

                setUserRole(data.user.role);

                if (data.user.role === 'user') {
                    console.log('Usuario es "user". Verificando geolocalización...');

                    if (!isLocationChecked || locationFailure) {
                        console.log('Esperando verificación de geolocalización...');
                        return; // Detener si no se ha verificado la ubicación
                    }

                    // Si la ubicación es correcta, continuar con el proceso de registro de asistencia y redirección
                    console.log('Verificando asistencia del usuario...');
                    const attendanceData = await checkAttendance(data.user.id);

                    if (attendanceData && !attendanceData.attendanceExists) {
                        console.log('Asistencia no registrada hoy. Registrando ahora...');
                        await registerAttendance(data.user.id);
                    } else if (attendanceData && attendanceData.attendanceExists) {
                        console.log('Asistencia ya registrada para hoy.');
                    }

                    console.log('Redirigiendo al usuario a la página de servicios de limpieza.');
                    navigate('/CleaningService');
                } else if (data.user.role === 'admin') {
                    console.log('Usuario es "admin". Redirigiendo...');
                    navigate('/assignments');
                } else {
                    setError('No tienes los permisos necesarios para acceder.');
                }
            } else {
                console.error('Error en la autenticación:', data.message);
                setError(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            setLoading(false);
            console.error('Error en el proceso de autenticación:', error);
            setError('Error de conexión. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-12">
            {error && (
                <div className="absolute top-8 w-full max-w-sm bg-white bg-opacity-40 backdrop-blur-lg text-red-600 font-bold text-center py-3 px-6 rounded-lg shadow-lg border border-red-600/30">
                    <p>{error}</p>
                </div>
            )}

            <div className="max-w-lg w-full bg-white bg-opacity-40 backdrop-blur-lg p-14 rounded-2xl shadow-2xl transition-transform duration-300 border border-white/30">
                <div className="avatar flex justify-center mb-8">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                </div>

                {userRole === 'user' && !isLocationChecked ? (
                    <GeolocationCheck
                        desiredArea={{
                            minLat: 8.967785707528074,
                            maxLat: 8.976632818766214,
                            minLon: -79.549044455311,
                            maxLon: -79.55468726479876,
                        }}
                        onSuccess={handleLocationSuccess}
                        onFailure={handleLocationFailure}
                    />
                ) : (
                    <>
                        {userPosition && (
                            <div className="my-6 h-72 w-full rounded-xl overflow-hidden shadow-lg">
                                <LocationMap position={userPosition} />
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <div className="flex items-center border border-gray-300 rounded-lg px-5 py-4 mb-4 bg-gray-200 bg-opacity-40 backdrop-blur-sm text-gray-900 shadow-inner">
                                    <User className="text-gray-700 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-gray-900 text-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center border border-gray-300 rounded-lg px-5 py-4 bg-gray-200 bg-opacity-40 backdrop-blur-sm text-gray-900 shadow-inner">
                                    <Lock className="text-gray-700 mr-3" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-gray-900 text-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-xl hover:shadow-blue-500/50 transition-all duration-300 ease-in-out text-lg"
                                disabled={loading}
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default Login;
