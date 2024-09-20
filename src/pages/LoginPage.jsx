import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import logo from '../assets/logo.jpg';
import GeolocationCheck from '../Components/General/GeolocationCheck'; //Se importo el componente de GeolocationCheck -Andy
import LocationMap from '../Components/General/LocationMap'; // Se importo el componente de LocationMap -Andy

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLocationChecked, setIsLocationChecked] = useState(false);
    const [userPosition, setUserPosition] = useState(null); // To store user's position
    const navigate = useNavigate();

    // Función para verificar si el usuario ya registró asistencia hoy
const checkAttendance = async (userId) => {
    const token = localStorage.getItem('token');

    try {
        // Cambiamos las comillas por backticks para la interpolación de variables
        const response = await fetch(`http://localhost:4000/api/attendance/today/${userId}`, {
            headers: {
                // También aquí corregimos la interpolación
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
    const checkInTime = new Date().toISOString();

    // Verifica que userPosition tiene las coordenadas correctas
    if (!userPosition || !userPosition.lat || !userPosition.lng) {
        console.error('Ubicación no disponible o fuera del área designada.');
        setError('Ubicación no disponible o fuera del área designada.');
        return; // No continúa si no hay coordenadas válidas
    }

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

        console.log('Asistencia registrada:', await responseAttendance.json());
    } catch (error) {
        console.error('Error en el registro de asistencia:', error.message);
        setError('No se pudo registrar la asistencia. Detalles: ' + error.message);
    }
};



    // Funcion que maneja el output positivo de GeolocationCheck -Andy
    const handleLocationSuccess = (position) => {
        setIsLocationChecked(true); // Mark geolocation as successful
        setUserPosition(position);  // Directly use the position object with lat and lng
    };

    // Funcion que maneja el geolocation fallido -Andy
    const handleLocationFailure = () => {
        setError('No estás dentro del área designada para iniciar turno.');
        setIsLocationChecked(false); // Reinicia el location Check State
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
                // Guarda los tokens el LocalStorage
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('role', data.user.role);

                // Verificar si ya se registro asistencia hoy
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
        <div className="min-h-screen flex items-center justify-center bg-blue-300">
            {/* Contenedor de errores */}
            {error && (
                <div className="absolute top-8 w-full max-w-sm bg-white text-red-600 font-bold text-center py-2 px-4 rounded-md shadow-lg">
                    <p>{error}</p>
                </div>
            )}
    
            {/* Contenedor del Login con sombra más pronunciada hacia afuera */}
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md"> 
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="Logo" className="w-24 h-24" />
                </div>
    
                {/* Comprobación de la geolocalización */}
                {!isLocationChecked ? (
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
                             <div className="my-4 h-64 w-full rounded-md overflow-hidden">
                                <LocationMap position={userPosition} />
                            </div>        
                        )}
    
                        {/* Formulario de inicio de sesión */}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <div className="flex items-center border rounded-md px-3 py-2 mb-3 bg-gray-100 shadow-lg">
                                    <User className="text-gray-600 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-gray-700"
                                        required
                                    />
                                </div>
                            </div>
    
                            <div className="mb-6">
                                <div className="flex items-center border rounded-md px-3 py-2 bg-gray-100 shadow-lg">
                                    <Lock className="text-gray-600 mr-2" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-gray-700"
                                        required
                                    />
                                </div>
                            </div>
    
                            {/* Sombra hacia adentro con hover que cambia la sombra a azul */}
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline w-full transition-all shadow-inner hover:shadow-blue-500/50"
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