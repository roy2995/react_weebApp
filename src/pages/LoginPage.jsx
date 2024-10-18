import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react'; // Iconos para los campos de entrada (usuario y contraseña)
import logo from '../assets/logo.jpg'; // Importa el logo de la aplicación
import GeolocationCheck from '../Components/General/GeolocationCheck'; // Componente para verificar la ubicación del usuario
import LocationMap from '../Components/General/LocationMap'; // Componente para mostrar un mapa con la ubicación del usuario

function Login() {
    // Estados locales para manejar el formulario de inicio de sesión y la geolocalización
    const [username, setUsername] = useState(''); // Almacena el nombre de usuario
    const [password, setPassword] = useState(''); // Almacena la contraseña
    const [loading, setLoading] = useState(false); // Maneja el estado de carga del botón (cuando se envía el formulario)
    const [error, setError] = useState(''); // Maneja los mensajes de error
    const [isLocationChecked, setIsLocationChecked] = useState(false); // Indica si la geolocalización ha sido verificada
    const [userPosition, setUserPosition] = useState(null); // Almacena la posición geográfica del usuario (latitud y longitud)
    const [userRole, setUserRole] = useState(''); // Almacena el rol del usuario
    const [locationFailure, setLocationFailure] = useState(false); // Nuevo estado para bloquear el reintento después de fallo
    const navigate = useNavigate(); // Hook de React Router para redirigir al usuario después del inicio de sesión

    // Función para verificar si el usuario ya registró asistencia hoy
    const checkAttendance = async (userId) => {
        const token = localStorage.getItem('token'); // Obtiene el token de autenticación almacenado en localStorage

        try {
            // Realiza una petición GET para verificar si el usuario ya registró su asistencia hoy
            const response = await fetch(`http://localhost:4000/api/attendance/today/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Incluye el token en el encabezado de la solicitud
                },
            });

            if (!response.ok) {
                throw new Error('Error al verificar la asistencia'); // Si la respuesta no es OK, lanza un error
            }

            const attendanceData = await response.json(); // Convierte la respuesta en JSON
            return attendanceData; // Retorna los datos de asistencia
        } catch (error) {
            console.error('Error en la verificación de asistencia:', error);
            setError('No se pudo verificar la asistencia.'); // Establece el mensaje de error en el estado
            return null; // Retorna null si hay un error
        }
    };

    // Función para registrar la asistencia (check-in)
    const registerAttendance = async (userId) => {
        const token = localStorage.getItem('token'); // Obtiene el token de autenticación
        const checkInTime = new Date().toISOString(); // Genera la fecha y hora actual en formato ISO

        // Verifica que `userPosition` contenga las coordenadas correctas
        if (!userPosition || !userPosition.lat || !userPosition.lng) {
            console.error('Ubicación no disponible o fuera del área designada.');
            setError('Ubicación no disponible o fuera del área designada.');
            return; // Si no hay coordenadas válidas, no continúa
        }

        try {
            // Realiza una petición POST para registrar la asistencia del usuario
            const responseAttendance = await fetch(`http://localhost:4000/api/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Incluye el token de autenticación
                },
                body: JSON.stringify({
                    user_id: userId, // ID del usuario
                    check_in: checkInTime, // Hora de check-in
                    location: {
                        lat: userPosition.lat, // Latitud del usuario
                        lng: userPosition.lng, // Longitud del usuario
                    },
                }),
            });

            if (!responseAttendance.ok) {
                const errorDetails = await responseAttendance.text(); // Obtiene los detalles del error
                throw new Error(`Error al registrar la asistencia: ${errorDetails}`); // Lanza el error
            }

            console.log('Asistencia registrada:', await responseAttendance.json()); // Muestra los detalles de la asistencia registrada
        } catch (error) {
            console.error('Error en el registro de asistencia:', error.message);
            setError('No se pudo registrar la asistencia. Detalles: ' + error.message); // Establece el mensaje de error
        }
    };

    // Función que maneja el output positivo de GeolocationCheck
    const handleLocationSuccess = (position) => {
        console.log('Ubicación verificada correctamente:', position);
        setIsLocationChecked(true); // Marca la geolocalización como exitosa
        setUserPosition(position);  // Establece la posición del usuario en el estado
        setLocationFailure(false);  // Restablece el estado de fallo de ubicación
    };

    // Función que maneja el fallo en la geolocalización
    const handleLocationFailure = () => {
        console.error('Fallo en la geolocalización: fuera del área designada.');
        setError('No estás dentro del área designada para iniciar turno.'); // Establece un mensaje de error
        setIsLocationChecked(false); // Reinicia el estado de verificación de ubicación
        setLocationFailure(true);  // Activa el bloqueo para evitar otro intento sin nueva verificación
    };

    // Maneja el envío del formulario de inicio de sesión
    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        setLoading(true); // Activa el estado de carga
        setError(''); // Resetea los errores previos

        try {
            // Realiza una petición POST para autenticar al usuario
            const response = await fetch('http://localhost:4000/api/Users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }), // Envía el nombre de usuario y contraseña
            });

            const data = await response.json(); // Convierte la respuesta en JSON
            setLoading(false); // Desactiva el estado de carga

            if (response.ok && data.accessToken) {
                // Si la autenticación es exitosa, guarda los tokens y datos del usuario en localStorage
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);

                setUserRole(data.user.role); // Guardar el rol del usuario

                // Si el usuario es 'user', verificar geolocalización y bloquear si no está dentro del área
                if (data.user.role === 'user') {
                    if (!isLocationChecked || locationFailure) {
                        setError('Debes estar dentro del área designada para iniciar sesión.');
                        return;
                    }

                    const attendanceData = await checkAttendance(data.user.id);

                    if (attendanceData && !attendanceData.attendanceExists) {
                        await registerAttendance(data.user.id);
                        console.log('Asistencia registrada después del inicio de sesión.');
                    } else if (attendanceData && attendanceData.attendanceExists) {
                        console.log('El usuario ya tiene registro de asistencia hoy:', attendanceData);
                    }
                }

                // Redirige al usuario según su rol
                if (data.user.role === 'user') {
                    navigate('/CleaningService');
                } else if (data.user.role === 'admin') {
                    navigate('/assignments');
                } else {
                    setError('No tienes los permisos necesarios para acceder.');
                }
            } else {
                setError(data.message || 'Credenciales incorrectas'); // Muestra un mensaje de error si las credenciales son incorrectas
            }
        } catch (error) {
            setLoading(false); // Desactiva el estado de carga
            setError('Error de conexión. Inténtalo de nuevo.'); // Establece un mensaje de error por problemas de conexión
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-12">
            {/* Contenedor de errores */}
            {error && (
                <div className="absolute top-8 w-full max-w-sm bg-white bg-opacity-40 backdrop-blur-lg text-red-600 font-bold text-center py-3 px-6 rounded-lg shadow-lg border border-red-600/30">
                    <p>{error}</p>
                </div>
            )}

            {/* Contenedor del Login */}
            <div className="max-w-lg w-full bg-white bg-opacity-40 backdrop-blur-lg p-14 rounded-2xl shadow-2xl transition-transform duration-300 border border-white/30">
                {/* Logo con bordes redondeados */}
                <div className="avatar flex justify-center mb-8">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Comprobación de la geolocalización solo para 'user' */}
                {userRole === 'user' && !isLocationChecked ? (
                    <GeolocationCheck
                        desiredArea={{
                            minLat: 9.061274114226507,
                            maxLat: 9.068140872874764,
                            minLon: -79.39165233216502,
                            maxLon: -79.38659580540434,
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

                        {/* Formulario de inicio de sesión */}
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

                            {/* Botón de inicio de sesión */}
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
