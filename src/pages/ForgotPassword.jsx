import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Recuperar Contraseña</h1>
        <p className="text-gray-400 mb-6">Próximamente...</p>
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Volver al login
        </Link>
      </div>
    </div>
  );
}
