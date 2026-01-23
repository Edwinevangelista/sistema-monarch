import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export default function LogoutButton() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario_finguide"));
    setUser(userData);
  }, []);

  const handleLogout = () => {
    if (!window.confirm("¿Estás seguro de que quieres cerrar sesión?")) return;

    // Limpiar sesión y caches
    localStorage.removeItem("usuario_finguide");
    localStorage.removeItem("preferenciasUsuario");
    localStorage.removeItem("configNotificaciones");
    
    // Limpiar caches financieros
    Object.keys(localStorage).forEach((key) => {
      if (key.endsWith("_cache_v2")) {
        localStorage.removeItem(key);
      }
    });

    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
      {/* Usuario Info */}
      <div className="hidden md:flex flex-col items-start gap-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
          <User className="w-3 h-3" /> Conectado como
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {user?.nombre ? user.nombre.split(' ')[0] : 'Usuario'}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block mx-2" />

      {/* Botón Logout */}
      <button
        onClick={handleLogout}
        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600 hover:to-pink-600 border border-rose-500/30 text-rose-200 hover:text-white rounded-xl font-semibold transition-all duration-300 active:scale-95"
      >
        <LogOut className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  );
}