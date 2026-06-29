import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { showConfirm } from "../utils/confirm";

export default function LogoutButton() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario_finguide"));
    setUser(userData);
  }, []);

  const handleLogout = async () => {
    const ok = await showConfirm({
      titulo: "Sign out?",
      mensaje: "You'll need to sign in again to access your financial data.",
      textoConfirmar: "Sign Out",
      textoCancel: "Stay",
    });
    if (!ok) return;

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
    <div className="flex items-center gap-4 p-3 bg-canvas-surface border border-canvas-border rounded-2xl shadow-sm hover:bg-canvas-elevated transition-colors">
      {/* Usuario Info */}
      <div className="hidden md:flex flex-col items-start gap-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-muted font-semibold uppercase tracking-wider">
          <User className="w-3 h-3" /> Conectado como
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-positive" />
          <span className="text-ink text-sm font-bold truncate max-w-[200px]">
            {user?.nombre ? user.nombre.split(' ')[0] : 'Usuario'}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-canvas-border hidden md:block mx-1" />

      {/* Botón Logout */}
      <button
        onClick={handleLogout}
        className="group flex items-center gap-2 px-4 py-2 bg-accent-negative/10 hover:bg-accent-negative border border-accent-negative/25 text-accent-negative hover:text-canvas rounded-xl font-bold transition-all duration-300 active:scale-95"
      >
        <LogOut className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  );
}
