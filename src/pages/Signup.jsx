import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Intentando registrar:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      console.log('Resultado:', { data, error });

      if (error) throw error;

      // Si no requiere confirmación, ir al dashboard
      if (data?.user && !data?.user?.identities?.length) {
        alert('Email ya registrado. Intenta iniciar sesión.');
        navigate('/login');
      } else if (data?.session) {
        // Login automático si no requiere confirmación
        navigate('/');
      } else {
        // Requiere confirmación por email
        alert('¡Cuenta creada! Revisa tu email para confirmar (o prueba hacer login directamente si está desactivada la confirmación).');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">💰 Sistema Monarch</h1>
        <p className="text-gray-400 mb-6">Crea tu cuenta</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Contraseña (mínimo 6 caracteres)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}