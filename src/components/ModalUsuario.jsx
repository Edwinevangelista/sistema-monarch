import React, { useState, useEffect, useMemo } from 'react'
import { 
  X, Brain, Shield, DollarSign, Target, AlertTriangle, Bell, 
  Smartphone, CreditCard, Repeat, User, Mail, Phone, Globe,
  Edit2, Save, Camera, Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const ModalUsuario = ({ 
  onClose, 
  onLogout,
  onChangePreferencias,
  // ✅ PROPS DE NOTIFICACIONES
  permission,
  showLocalNotification
}) => {
  // ============================================
  // ESTADOS
  // ============================================
  
  // Estado de usuario completo
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estado de edición
  const [modoEdicion, setModoEdicion] = useState(false)
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    pais: '',
  })

  // Estado de preferencias
  const [preferencias, setPreferencias] = useState(() => {
    const guardadas = localStorage.getItem("preferenciasUsuario")
    return guardadas ? JSON.parse(guardadas) : {
      moneda: "USD",
      inicioMes: 1,
      objetivo: "Reducir deudas",
      riesgo: "Conservador",
      iaActiva: true,
      notificaciones: {
        gastos: true,
        deudas: true,
        suscripciones: true,
        alertasPush: false
      }
    }
  })

  // ============================================
  // CARGAR DATOS DEL USUARIO
  // ============================================
  
  useEffect(() => {
    cargarDatosUsuario()
  }, [])

  const cargarDatosUsuario = async () => {
    try {
      setLoading(true)
      
      // 1. Obtener usuario de auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Error obteniendo usuario:', authError)
        // Si no hay usuario, usar datos de localStorage como fallback
        const usuarioLocal = localStorage.getItem('usuario_fintrack')
        if (usuarioLocal) {
          setUsuario(JSON.parse(usuarioLocal))
        }
        setLoading(false)
        return
      }

      console.log('✅ Usuario obtenido de auth:', user)

      // 2. Intentar obtener perfil de la tabla perfiles
      let perfilCompleto = null
      try {
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!perfilError && perfil) {
          console.log('✅ Perfil obtenido de BD:', perfil)
          perfilCompleto = perfil
        }
      } catch (e) {
        console.warn('Tabla perfiles no existe o error:', e)
      }

      // 3. Combinar datos de auth.user con perfil (si existe)
      const datosUsuario = {
        id: user.id,
        email: user.email,
        nombre: perfilCompleto?.nombre || user.user_metadata?.nombre || 'Usuario',
        apellido: perfilCompleto?.apellido || user.user_metadata?.apellido || '',
        telefono: perfilCompleto?.telefono || user.user_metadata?.telefono || '',
        pais: perfilCompleto?.pais || user.user_metadata?.pais || 'Mexico',
        moneda: perfilCompleto?.moneda_preferencia || user.user_metadata?.moneda || 'USD',
        avatar_url: perfilCompleto?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`,
        created_at: user.created_at || perfilCompleto?.created_at
      }

      console.log('📦 Datos finales del usuario:', datosUsuario)

      setUsuario(datosUsuario)
      
      // Actualizar datos de edición
      setDatosEdicion({
        nombre: datosUsuario.nombre,
        apellido: datosUsuario.apellido,
        telefono: datosUsuario.telefono,
        pais: datosUsuario.pais,
      })

      // Actualizar localStorage
      localStorage.setItem('usuario_fintrack', JSON.stringify(datosUsuario))

      // Actualizar preferencias si hay moneda del usuario
      if (datosUsuario.moneda) {
        setPreferencias(prev => ({
          ...prev,
          moneda: datosUsuario.moneda
        }))
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FUNCIONES DE ACTUALIZACIÓN
  // ============================================

  const handleGuardarPerfil = async () => {
    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      // 1. Actualizar user_metadata en auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          nombre: datosEdicion.nombre,
          apellido: datosEdicion.apellido,
          telefono: datosEdicion.telefono,
          pais: datosEdicion.pais
        }
      })

      if (updateError) throw updateError

      // 2. Intentar actualizar tabla perfiles
      try {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .update({
            nombre: datosEdicion.nombre,
            apellido: datosEdicion.apellido,
            telefono: datosEdicion.telefono,
            pais: datosEdicion.pais,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (perfilError) console.warn('No se pudo actualizar perfil:', perfilError)
      } catch (e) {
        console.warn('Tabla perfiles no disponible')
      }

      // 3. Actualizar estado local
      setUsuario(prev => ({
        ...prev,
        ...datosEdicion
      }))

      // 4. Actualizar localStorage
      const usuarioActualizado = {
        ...usuario,
        ...datosEdicion
      }
      localStorage.setItem('usuario_fintrack', JSON.stringify(usuarioActualizado))

      alert('✅ Perfil actualizado correctamente')
      setModoEdicion(false)
      
      // Recargar datos para confirmar
      await cargarDatosUsuario()

    } catch (error) {
      console.error('❌ Error guardando perfil:', error)
      alert('Error al guardar el perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarPreferencias = () => {
    // 1. Guardar en localStorage
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias))
    
    // 2. Notificar al padre si existe el callback
    if (onChangePreferencias) {
      onChangePreferencias(preferencias)
    }
    
    alert("✅ Preferencias guardadas correctamente")
  }

  const handleLogout = () => {
    if(window.confirm("¿Estás seguro de cerrar sesión?")) {
      // Limpiar datos
      localStorage.removeItem('usuario_fintrack')
      localStorage.removeItem('preferenciasUsuario')
      localStorage.clear()
      
      // Cerrar sesión en Supabase
      supabase.auth.signOut()
      
      // Llamar callback
      if (onLogout) onLogout()
    }
  }

  // ============================================
  // FUNCIONES DE NOTIFICACIONES
  // ============================================

  const solicitarPermisoNotificacion = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones nativas.")
      return
    }
    if (Notification.permission === "granted") {
      alert("Ya tienes los permisos activados.")
      return
    }

    const permiso = await Notification.requestPermission()
    if (permiso === "granted") {
      alert("✅ Notificaciones activadas correctamente.")
      setPreferencias(prev => ({
        ...prev,
        notificaciones: {
          ...prev.notificaciones,
          alertasPush: true
        }
      }))
    } else {
      alert("❌ Permiso denegado. Activa las notificaciones en la configuración de tu navegador.")
    }
  }

  const toggleNotificacion = (tipo) => {
    setPreferencias(prev => ({
      ...prev,
      notificaciones: {
        ...prev.notificaciones,
        [tipo]: !prev.notificaciones[tipo]
      }
    }))
  }

  // ============================================
  // PREFS NOTIFICACIONES CON MEMO
  // ============================================

  const prefsNotificaciones = useMemo(() => {
    return preferencias?.notificaciones || {
      gastos: true,
      deudas: true,
      suscripciones: true,
      alertasPush: false
    }
  }, [preferencias?.notificaciones])

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">No se pudo cargar el perfil</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Mi Perfil
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5 space-y-6">

          {/* 1. AVATAR Y DATOS BÁSICOS */}
          <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <img 
                  src={usuario.avatar_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full border-4 border-blue-500/50 object-cover"
                />
                <button 
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Cambiar foto (próximamente)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">
                  {usuario.nombre} {usuario.apellido}
                </h3>
                <p className="text-gray-300 flex items-center gap-2 justify-center md:justify-start mt-1">
                  <Mail className="w-4 h-4" />
                  {usuario.email}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Miembro desde {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* Botón Editar */}
              {!modoEdicion && (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Perfil
                </button>
              )}
            </div>
          </section>

          {/* 2. INFORMACIÓN PERSONAL - MODO VISTA/EDICIÓN */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Información Personal
              </h3>
              {modoEdicion && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setModoEdicion(false)
                      setDatosEdicion({
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        telefono: usuario.telefono,
                        pais: usuario.pais,
                      })
                    }}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarPerfil}
                    disabled={saving}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {modoEdicion ? (
              // MODO EDICIÓN
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Nombre</label>
                    <input
                      type="text"
                      value={datosEdicion.nombre}
                      onChange={(e) => setDatosEdicion(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Apellido</label>
                    <input
                      type="text"
                      value={datosEdicion.apellido}
                      onChange={(e) => setDatosEdicion(prev => ({ ...prev, apellido: e.target.value }))}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={datosEdicion.telefono}
                      onChange={(e) => setDatosEdicion(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">País</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={datosEdicion.pais}
                      onChange={(e) => setDatosEdicion(prev => ({ ...prev, pais: e.target.value }))}
                      className="w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Mexico">🇲🇽 México</option>
                      <option value="USA">🇺🇸 Estados Unidos</option>
                      <option value="Spain">🇪🇸 España</option>
                      <option value="Argentina">🇦🇷 Argentina</option>
                      <option value="Colombia">🇨🇴 Colombia</option>
                      <option value="Chile">🇨🇱 Chile</option>
                      <option value="Peru">🇵🇪 Perú</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              // MODO VISTA
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Nombre completo</span>
                  <span className="text-white font-medium">{usuario.nombre} {usuario.apellido}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Teléfono
                  </span>
                  <span className="text-white font-medium">{usuario.telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> País
                  </span>
                  <span className="text-white font-medium">{usuario.pais}</span>
                </div>
              </div>
            )}
          </section>

          {/* 3. PREFERENCIAS FINANCIERAS */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Preferencias Financieras
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-500" /> Moneda
              </span>
              <select
                value={preferencias.moneda}
                onChange={(e) => setPreferencias(prev => ({ ...prev, moneda: e.target.value }))}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="MXN">MXN ($)</option>
                <option value="COP">COP ($)</option>
                <option value="ARS">ARS ($)</option>
                <option value="CLP">CLP ($)</option>
                <option value="PEN">PEN (S/.)</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Inicio del mes</span>
              <select
                value={preferencias.inicioMes}
                onChange={(e) => setPreferencias(prev => ({ ...prev, inicioMes: Number(e.target.value) }))}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i+1} value={i+1}>Día {i+1}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center text-sm gap-3">
              <span className="text-gray-300 flex-shrink-0">Objetivo principal</span>
              <select
                value={preferencias.objetivo}
                onChange={(e) => setPreferencias(prev => ({ ...prev, objetivo: e.target.value }))}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
              >
                <option>Reducir deudas</option>
                <option>Ahorrar</option>
                <option>Invertir</option>
                <option>Controlar gastos</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Perfil de riesgo</span>
              <select
                value={preferencias.riesgo}
                onChange={(e) => setPreferencias(prev => ({ ...prev, riesgo: e.target.value }))}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Conservador</option>
                <option>Moderado</option>
                <option>Agresivo</option>
              </select>
            </div>
          </section>

          {/* 4. NOTIFICACIONES */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-4 border border-blue-500/20">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Notificaciones
            </h3>

            {/* Estado del Permiso */}
            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-600">
              <div className="flex flex-col">
                <span className="text-gray-300 text-xs font-semibold">Estado del Navegador</span>
                <span className="text-gray-500 text-[10px] mt-0.5">Se requiere permiso para recibir alertas push</span>
              </div>
              <div className="flex items-center gap-2">
                {permission === 'granted' && (
                  <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 text-xs font-semibold flex items-center gap-1">
                    <Bell className="w-3 h-3" /> ACTIVO
                  </div>
                )}
                {permission === 'denied' && (
                  <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30 text-xs font-semibold">
                    BLOQUEADO
                  </div>
                )}
                {permission === 'default' && (
                  <div className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full border border-gray-600/30 text-xs font-semibold">
                    INACTIVO
                  </div>
                )}
                
                <button
                  onClick={solicitarPermisoNotificacion}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  {permission === 'granted' ? 'Configurar' : 'Activar'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-600 my-3"></div>

            {/* Preferencias de Alertas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500/10 p-1.5 rounded-md"><Target className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Deudas</p>
                    <p className="text-gray-400 text-xs">Cuando venza una cuota</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('deudas')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.deudas 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.deudas ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-500/10 p-1.5 rounded-md"><CreditCard className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Gastos</p>
                    <p className="text-gray-400 text-xs">Límite mensual o grandes compras</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('gastos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.gastos 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.gastos ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-500/10 p-1.5 rounded-md"><Repeat className="w-4 h-4 text-purple-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">Alertas de Suscripciones</p>
                    <p className="text-gray-400 text-xs">Renovaciones o cortes de servicio</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotificacion('suscripciones')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    prefsNotificaciones.suscripciones 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {prefsNotificaciones.suscripciones ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>
            </div>
          </section>

          {/* 5. INTELIGENCIA ARTIFICIAL */}
          <section className="bg-gray-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Inteligencia Artificial
            </h3>

            <div className="flex items-center justify-between text-sm gap-3">
              <span className="text-gray-300">IA financiera activa</span>
              <button
                onClick={() => setPreferencias(prev => ({
                  ...prev,
                  iaActiva: !prev.iaActiva
                }))}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  preferencias.iaActiva
                    ? "bg-green-600/20 text-green-400 border border-green-500/30"
                    : "bg-red-600/20 text-red-400 border border-red-500/30"
                }`}
              >
                {preferencias.iaActiva ? "ACTIVADA" : "DESACTIVADA"}
              </button>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              La IA analiza tus hábitos, detecta riesgos de gastos y sugiere acciones para llegar a tu objetivo ({preferencias.objetivo}).
            </p>
          </section>

          {/* 6. SEGURIDAD */}
          <section className="bg-red-600/5 border border-red-600/20 rounded-xl p-4 space-y-3">
            <h3 className="text-red-400 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad y Cuenta
            </h3>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/50"
            >
              <AlertTriangle className="w-5 h-5" />
              Cerrar Sesión y Salir
            </button>
          </section>
        </div>

        {/* FOOTER: BOTÓN GUARDAR PREFERENCIAS */}
        <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-md p-4 border-t border-gray-700">
          <button 
            onClick={handleGuardarPreferencias}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 border-b-4 border-blue-400"
          >
            <Save className="w-5 h-5" />
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalUsuario