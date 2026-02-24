import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Wallet,
  Mail,
  Lock,
  ArrowLeft,
  User,
  Phone,
  Globe
} from 'lucide-react'
import Footer from '../components/Footer'

function Auth() {
  // MODO DE AUTENTICACIÓN: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login')
  const navigate = useNavigate()

  // ESTADOS DEL FORMULARIO
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // NUEVOS ESTADOS PARA DATOS DEL CLIENTE
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [moneda, setMoneda] = useState('DOP')
  const [pais, setPais] = useState('RepublicaDominicana')

  // ESTADOS DE UI
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // FUNCIONES DE VALIDACIÓN (Sin cambios, lógica correcta)
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getPasswordStrength = (password) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    }

    if (checks.length) strength++
    if (checks.uppercase) strength++
    if (checks.lowercase) strength++
    if (checks.number) strength++
    if (checks.special) strength++

    return { strength, checks }
  }

  const passwordStrength = getPasswordStrength(password)

  const getStrengthColor = () => {
    if (passwordStrength.strength <= 2) return 'bg-red-500'
    if (passwordStrength.strength <= 3) return 'bg-yellow-500'
    if (passwordStrength.strength <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (passwordStrength.strength <= 2) return 'Débil'
    if (passwordStrength.strength <= 3) return 'Regular'
    if (passwordStrength.strength <= 4) return 'Fuerte'
    return 'Muy Fuerte'
  }

  // MANEJADORES DE AUTENTICACIÓN

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: '❌ Por favor ingresa un email válido' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: '❌ La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)

    try {
      console.log("🔍 Intentando login con:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log("✅ Login correcto. Mostrando mensaje de éxito.")
      setMessage({ type: 'success', text: '✅ Inicio de sesión exitoso' })
      
      setTimeout(() => {
        console.log("🚀 Navegando a /loading...")
        navigate('/loading')
      }, 1000)

    } catch (error) {
      console.error("❌ Error en login:", error)
      let errorMessage = 'Error en el inicio de sesión'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor verifica tu email antes de iniciar sesión'
      }
      
      setMessage({ type: 'error', text: `❌ ${errorMessage}` })
    } finally {
      console.log("🏁 Fin del proceso de login (Finally)")
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!nombre.trim()) {
      setMessage({ type: 'error', text: '❌ El nombre es obligatorio' })
      return
    }
    if (!apellido.trim()) {
      setMessage({ type: 'error', text: '❌ El apellido es obligatorio' })
      return
    }
    if (!telefono.trim()) {
      setMessage({ type: 'error', text: '❌ El teléfono es obligatorio' })
      return
    }

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: '❌ Por favor ingresa un email válido' })
      return
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: '❌ La contraseña debe tener al menos 8 caracteres' })
      return
    }

    if (passwordStrength.strength < 3) {
      setMessage({ 
        type: 'error', 
        text: '❌ La contraseña es muy débil. Incluye mayúsculas, minúsculas, números y símbolos.' 
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '❌ Las contraseñas no coinciden' })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nombre,
            apellido,
            telefono,
            moneda,
            pais,
            rol: 'cliente'
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('perfiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            nombre: nombre,
            apellido: apellido,
            telefono: telefono,
            moneda_preferencia: moneda,
            pais: pais,
            avatar_url: `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=random`
          })
        
        if (profileError) console.warn('No se pudo guardar perfil:', profileError)
      }

      setMessage({ 
        type: 'success', 
        text: '✅ ¡Cuenta creada exitosamente! Bienvenido.' 
      })
      
      setTimeout(() => {
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setMessage({ type: '', text: '' })
      }, 3000)

    } catch (error) {
      console.error('Error signup:', error)
      let errorMessage = 'Error al crear la cuenta'
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.'
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'La contraseña no cumple con los requisitos mínimos'
      }
      
      setMessage({ type: 'error', text: `❌ ${errorMessage}` })
    } finally {
      setLoading(false)
    }
  }

  // ✅ MANEJADOR DE OLVIDÉ MI CONTRASEÑA CORREGIDO
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: '❌ Por favor ingresa un email válido' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // ✅ IMPORTANTE: Aquí apuntamos a la página de reset, NO a /auth
        redirectTo: `${window.location.origin}/reset`
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '✅ Te hemos enviado un email con instrucciones para restablecer tu contraseña.' 
      })

      setTimeout(() => {
        setMode('login')
        setEmail('')
        setMessage({ type: '', text: '' })
      }, 5000)

    } catch (error) {
      console.error('Error reset:', error)
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message || 'Error al enviar el email de recuperación'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    // Este handler solo se usa si la página de reset está dentro de este componente
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (password.length < 8) {
      setMessage({ type: 'error', text: '❌ La contraseña debe tener al menos 8 caracteres' })
      return
    }

    if (passwordStrength.strength < 3) {
      setMessage({ 
        type: 'error', 
        text: '❌ La contraseña es muy débil. Incluye mayúsculas, números y símbolos.' 
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '❌ Las contraseñas no coinciden' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '✅ Contraseña actualizada exitosamente. Redirigiendo...' 
      })

      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error update password:', error)
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message || 'Error al actualizar la contraseña'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  // ── LOGIN CON GOOGLE ──────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/loading`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      // Supabase redirige al usuario — no necesitamos hacer nada más
    } catch (error) {
      console.error('Error Google OAuth:', error)
      setMessage({ type: 'error', text: `❌ ${error.message || 'Error al iniciar sesión con Google'}` })
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    switch(mode) {
      case 'login':
        handleLogin(e)
        break
      case 'signup':
        handleSignup(e)
        break
      case 'forgot':
        handleForgotPassword(e)
        break
      case 'reset':
        handleResetPassword(e)
        break
      default:
        break
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setMessage({ type: '', text: '' })
    setPassword('')
    setConfirmPassword('')
    setNombre('')
    setApellido('')
    setTelefono('')
    setPais('RepublicaDominicana')
    setMoneda('DOP')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      <div className="w-full py-6 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          <Wallet className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">finguide App</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg border border-gray-700 shadow-2xl">
          
          <div className="mb-6">
            {mode !== 'login' && (
              <button
                onClick={() => switchMode('login')}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            )}
            
            <h2 className="text-2xl font-bold text-white text-center">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'signup' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            
            {mode === 'forgot' && (
              <p className="text-gray-400 text-sm text-center mt-2">
                Te enviaremos un enlace para restablecer tu contraseña
              </p>
            )}
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success' 
                ? 'bg-green-900/30 border border-green-500/30 text-green-300' 
                : message.type === 'info'
                ? 'bg-blue-900/30 border border-blue-500/30 text-blue-300'
                : 'bg-red-900/30 border border-red-500/30 text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* ── GOOGLE OAUTH (solo login y signup) ── */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {/* Google SVG icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                {loading ? 'Conectando...' : `${mode === 'login' ? 'Continuar' : 'Registrarse'} con Google`}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3 mt-5 mb-1">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 font-medium">o continúa con email</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL INPUT */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    email && !validateEmail(email) 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {email && !validateEmail(email) && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Formato de email inválido
                </p>
              )}
              {email && validateEmail(email) && (
                <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Email válido
                </p>
              )}
            </div>

            {/* PASSWORD INPUT */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder={mode === 'login' ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {(mode === 'signup' || mode === 'reset') && password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStrengthColor()} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.strength <= 2 ? 'text-red-400' :
                        passwordStrength.strength <= 3 ? 'text-yellow-400' :
                        passwordStrength.strength <= 4 ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-2 ${passwordStrength.checks.length ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.checks.length ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Al menos 8 caracteres
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.checks.uppercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Una letra mayúscula
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.checks.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.checks.lowercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Una letra minúscula
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.checks.number ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.checks.number ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Un número
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.checks.special ? 'text-green-400' : 'text-gray-500'}`}>
                        {passwordStrength.checks.special ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Un símbolo (!@#$%^&*)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DATOS PERSONALES (Solo Signup) */}
            {mode === 'signup' && (
              <div className="space-y-4 pb-6 border-b border-gray-700 mb-6">
                <h3 className="text-sm font-bold text-blue-300 mb-3 uppercase tracking-wider">
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" /> Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Juan"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" /> Apellido
                    </label>
                    <input
                      type="text"
                      placeholder="Pérez"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-3"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-yellow-400" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="55 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400" /> País
                    </label>
                    <select
                      value={pais}
                      onChange={(e) => {
                        const p = e.target.value
                        setPais(p)
                        // Auto-sync moneda al cambiar país
                        const mapa = {
                          'RepublicaDominicana': 'DOP',
                          'Mexico': 'MXN',
                          'Colombia': 'COP',
                          'Argentina': 'ARS',
                          'Chile': 'CLP',
                          'Guatemala': 'GTQ',
                          'Peru': 'PEN',
                          'Bolivia': 'BOB',
                          'Paraguay': 'PYG',
                          'Uruguay': 'UYU',
                          'Honduras': 'HNL',
                          'CostaRica': 'CRC',
                          'Venezuela': 'VES',
                          'Brasil': 'BRL',
                          'Panama': 'PAB',
                          'ElSalvador': 'USD',
                          'Nicaragua': 'NIO',
                          'Ecuador': 'USD',
                          'USA': 'USD',
                          'Spain': 'EUR',
                          'Canada': 'CAD',
                          'UK': 'GBP',
                        }
                        if (mapa[p]) setMoneda(mapa[p])
                      }}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-3"
                    >
                      <optgroup label="🌎 América Central y El Caribe">
                        <option value="RepublicaDominicana">🇩🇴 República Dominicana</option>
                        <option value="Mexico">🇲🇽 México</option>
                        <option value="Guatemala">🇬🇹 Guatemala</option>
                        <option value="Honduras">🇭🇳 Honduras</option>
                        <option value="ElSalvador">🇸🇻 El Salvador</option>
                        <option value="Nicaragua">🇳🇮 Nicaragua</option>
                        <option value="CostaRica">🇨🇷 Costa Rica</option>
                        <option value="Panama">🇵🇦 Panamá</option>
                      </optgroup>
                      <optgroup label="🌎 América del Sur">
                        <option value="Colombia">🇨🇴 Colombia</option>
                        <option value="Venezuela">🇻🇪 Venezuela</option>
                        <option value="Ecuador">🇪🇨 Ecuador</option>
                        <option value="Peru">🇵🇪 Perú</option>
                        <option value="Bolivia">🇧🇴 Bolivia</option>
                        <option value="Brasil">🇧🇷 Brasil</option>
                        <option value="Paraguay">🇵🇾 Paraguay</option>
                        <option value="Uruguay">🇺🇾 Uruguay</option>
                        <option value="Argentina">🇦🇷 Argentina</option>
                        <option value="Chile">🇨🇱 Chile</option>
                      </optgroup>
                      <optgroup label="🌍 Resto del mundo">
                        <option value="USA">🇺🇸 Estados Unidos</option>
                        <option value="Spain">🇪🇸 España</option>
                        <option value="Canada">🇨🇦 Canadá</option>
                        <option value="UK">🇬🇧 Reino Unido</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      💵 Divisa
                    </label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-3"
                    >
                      <optgroup label="🌎 Latinoamérica">
                        <option value="DOP">DOP — Peso Dominicano (RD$)</option>
                        <option value="MXN">MXN — Peso Mexicano ($)</option>
                        <option value="COP">COP — Peso Colombiano ($)</option>
                        <option value="ARS">ARS — Peso Argentino ($)</option>
                        <option value="CLP">CLP — Peso Chileno ($)</option>
                        <option value="GTQ">GTQ — Quetzal (Q)</option>
                        <option value="PEN">PEN — Sol Peruano (S/.)</option>
                        <option value="BOB">BOB — Boliviano (Bs.)</option>
                        <option value="PYG">PYG — Guaraní (₲)</option>
                        <option value="UYU">UYU — Peso Uruguayo ($U)</option>
                        <option value="HNL">HNL — Lempira (L)</option>
                        <option value="CRC">CRC — Colón Costarricense (₡)</option>
                        <option value="NIO">NIO — Córdoba (C$)</option>
                        <option value="VES">VES — Bolívar (Bs.S)</option>
                        <option value="BRL">BRL — Real Brasileño (R$)</option>
                        <option value="PAB">PAB — Balboa (B/.)</option>
                      </optgroup>
                      <optgroup label="🌍 Internacionales">
                        <option value="USD">USD — Dólar Americano ($)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="GBP">GBP — Libra Esterlina (£)</option>
                        <option value="CAD">CAD — Dólar Canadiense (C$)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM PASSWORD */}
            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-600 focus:ring-blue-500'
                    }`}
                    placeholder="Confirma tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || ((mode === 'signup' || mode === 'reset') && passwordStrength.strength < 3)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' && 'Iniciando sesión...'}
                  {mode === 'signup' && 'Creando cuenta...'}
                  {mode === 'forgot' && 'Enviando email...'}
                  {mode === 'reset' && 'Actualizando...'}
                </div>
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'signup' && 'Crear Cuenta'}
                  {mode === 'forgot' && 'Enviar Instrucciones'}
                  {mode === 'reset' && 'Actualizar Contraseña'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {mode === 'login' && (
              <>
                <div className="text-center">
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-semibold"
                  >
                    ¿No tienes cuenta? <span className="text-white">Regístrate aquí</span>
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => switchMode('forgot')}
                    className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center">
                <button
                  onClick={() => switchMode('login')}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-semibold"
                >
                  ¿Ya tienes cuenta? <span className="text-white">Inicia sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Auth