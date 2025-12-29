import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useInactivityTimeout(timeoutMinutes = 15) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (user) {
        signOut();
        alert('Sesión cerrada por inactividad');
        navigate('/login');
      }
    }, timeoutMinutes * 60 * 1000);
  }, [user, signOut, navigate, timeoutMinutes]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [user, resetTimeout]);
}
