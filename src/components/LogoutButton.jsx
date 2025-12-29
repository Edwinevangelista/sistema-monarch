import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4">
      {user && (
        <span className="text-gray-300 text-sm">
          {user.email}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}
