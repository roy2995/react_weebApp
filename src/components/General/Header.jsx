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
      <div className="container mx-auto flex justify-between items-center px-4 md:px-8">
        
        {/* Logo con borde redondeado */}
        <Link to="/" className="flex-shrink-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Navegación condicional según el rol */}
        <div className="md:hidden">
          {/* Menú desplegable para pantallas pequeñas */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-box w-52 mt-4">
              {role === 'admin' && (
                <>
                  <li>
                    <Link to="/Assignments" className="text-white text-lg font-semibold">Asignaciones</Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-white text-lg font-semibold">Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/ReportPage" className="text-white text-lg font-semibold">Report Page</Link>
                  </li>
                  <li>
                    <Link to="/ContingencyReports" className="text-white text-lg font-semibold">Contingency Report</Link>
                  </li>
                </>
              )}
              {role === 'user' && (
                <>
                  <li>
                    <Link to="/cleaningservice" className="text-white text-lg font-semibold">Cleaning Service</Link>
                  </li>
                  <li>
                    <Link to="/ContingencyReports" className="text-white text-lg font-semibold">Contingency Report</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Menú para pantallas medianas y grandes */}
        <nav className="hidden md:flex space-x-6">
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
