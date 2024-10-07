import React, { useEffect, useState } from 'react';
//Hasta la fecha no entiendo muy bien por que este modulo sigue aqui, pero tendrian que preguntarle a roderick si se esta usando para algo,
//Por mi lado pues la ultima vez que revise no se esta utilizando en ningun modulo, pero deberias de revisar si en el de login se implementa
const AttendancePage = () => {
    const [error, setError] = useState('');
    const [attendanceData, setAttendanceData] = useState(null);
    const [secondData, setSecondData] = useState(null);
    const [thirdData, setThirdData] = useState(null);

    useEffect(() => {
        checkRequests();
    }, []);

    const checkRequests = async () => {
        const userId = localStorage.getItem('user_id');
        const token = localStorage.getItem('token');

        try {
            // Petición 1: Verificación de asistencia
            console.log("Enviando solicitud de asistencia para el usuario:", userId);
            const responseAttendance = await fetch(`/api/attendance/today/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Respuesta de asistencia recibida con estado:", responseAttendance.status);

            if (responseAttendance.status !== 200) {
                console.error("Error en la solicitud de asistencia:", responseAttendance.status);
                setError('Error en la solicitud de asistencia');
                return;
            }

            const attendance = await responseAttendance.json();
            console.log('Asistencia de hoy:', attendance);
            setAttendanceData(attendance);

            // Petición 2: Segunda solicitud
            console.log("Enviando segunda solicitud...");
            const responseSecondRequest = await fetch(`/api/second/request/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Respuesta de segunda solicitud recibida con estado:", responseSecondRequest.status);

            if (responseSecondRequest.status !== 200) {
                console.error("Error en la segunda solicitud:", responseSecondRequest.status);
                setError('Error en la segunda solicitud');
                return;
            }

            const second = await responseSecondRequest.json();
            console.log('Datos de la segunda solicitud:', second);
            setSecondData(second);

            // Petición 3: Tercera solicitud
            console.log("Enviando tercera solicitud...");
            const responseThirdRequest = await fetch(`/api/third/request/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Respuesta de tercera solicitud recibida con estado:", responseThirdRequest.status);

            if (responseThirdRequest.status !== 200) {
                console.error("Error en la tercera solicitud:", responseThirdRequest.status);
                setError('Error en la tercera solicitud');
                return;
            }

            const third = await responseThirdRequest.json();
            console.log('Datos de la tercera solicitud:', third);
            setThirdData(third);

        } catch (error) {
            console.error('Error en la verificación de la asistencia o en alguna de las solicitudes:', error);
            setError('No se pudo completar la verificación.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <h1 className="text-3xl font-bold">Bienvenido a la Página de Asistencia</h1>
            {error && <p className="text-red-500">{error}</p>}
            {attendanceData && <p className="text-green-500">Asistencia verificada con éxito</p>}
            {secondData && <p className="text-green-500">Segunda solicitud verificada con éxito</p>}
            {thirdData && <p className="text-green-500">Tercera solicitud verificada con éxito</p>}
        </div>
    );
};

export default AttendancePage;
