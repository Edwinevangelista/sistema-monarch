import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage
    const storedUser = localStorage.getItem('supabase_user');
    const storedToken = localStorage.getItem('supabase_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error loading user:', e);
        localStorage.removeItem('supabase_user');
        localStorage.removeItem('supabase_token');
      }
    }
    
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('supabase_user');
    localStorage.removeItem('supabase_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
