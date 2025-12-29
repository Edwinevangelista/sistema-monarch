import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="text-blue-100 text-sm hidden md:block">
          {user.email}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  );
}
