import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("supabase_user"));

  const handleLogout = () => {
    // Limpiar sesión
    localStorage.removeItem("supabase_token");
    localStorage.removeItem("supabase_user");

    // (opcional) limpiar caches por usuario
    Object.keys(localStorage).forEach((key) => {
      if (key.endsWith("_cache")) {
        localStorage.removeItem(key);
      }
    });

    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-3">
      {user?.email && (
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
