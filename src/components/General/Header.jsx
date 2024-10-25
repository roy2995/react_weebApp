import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg'; // Asegúrate de que esta ruta sea correcta
import { useEffect, useState } from 'react';

const Header = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Obtiene el rol del usuario desde localStorage
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 shadow-lg py-4 w-full rounded-b-2xl fixed top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-8">
        
        {/* Logo con borde redondeado */}
        <Link to="/">
          <div className="w-16 h-16 rounded-lg overflow-hidden">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Navegación condicional según el rol */}
        <nav className="flex space-x-6">
          {role === 'admin' && (
            <>
              <Link 
                to="/asignaciones"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Asignaciones
              </Link>
              <Link 
                to="/dashboard"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Dashboard
              </Link>
              <Link 
                to="/ReportPage"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Report Page
              </Link>
              <Link 
                to="/ContingencyReports"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Contingency Report
              </Link>
            </>
          )}
          {role === 'user' && (
            <>
              <Link 
                to="/cleaningservice"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Cleaning Service
              </Link>
              <Link 
                to="/ContingencyReports"
                className="btn btn-ghost text-white hover:bg-blue-700 focus:bg-blue-700 text-lg font-semibold rounded-lg"
              >
                Contingency Report
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
