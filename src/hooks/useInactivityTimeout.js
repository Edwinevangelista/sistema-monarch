import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useInactivityTimeout(timeoutMinutes = 15) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const token = localStorage.getItem("supabase_token");

      if (token) {
        // Cerrar sesión por inactividad
        localStorage.removeItem("supabase_token");
        localStorage.removeItem("supabase_user");

        Object.keys(localStorage).forEach((key) => {
          if (key.endsWith("_cache")) {
            localStorage.removeItem(key);
          }
        });

        alert("Sesión cerrada por inactividad");
        navigate("/login", { replace: true });
      }
    }, timeoutMinutes * 60 * 1000);
  }, [navigate, timeoutMinutes]);

  useEffect(() => {
    const token = localStorage.getItem("supabase_token");
    if (!token) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    events.forEach((event) => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);
}
