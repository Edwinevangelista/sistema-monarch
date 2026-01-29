import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Brain, Shield, DollarSign, Target, AlertTriangle, Bell, 
  Smartphone, CreditCard, Repeat, User, Mail, Phone, Globe,
  Edit2, Save, Camera, Loader2, Lock, Key, Trash2, Download,
  FileText, HelpCircle, MessageSquare, Star, ChevronRight,
  Eye, EyeOff, CheckCircle2, XCircle, Info,
  ShieldCheck, History, Fingerprint, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import FAQ from './FAQ';

import { subscribeToPushFCM, unsubscribeFromPushFCM, sendTestNotification } from '../lib/subscribeToPushFCM';

export default function ModalUsuario({ 
  onClose, 
  onLogout,
  onChangePreferencias,
  permission,
  showLocalNotification
}) {
  // =========================
  // ESTADOS
  // =========================
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil'); // perfil, seguridad, preferencias, privacidad, ayuda
  
  // Estados para Push (LIMPIO)
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  // Estado de edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    pais: '',
  });

  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

  // Estados para eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Estado para exportar datos
  const [exportingData, setExportingData] = useState(false);

  // Estados para Modales
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);

  // Estado de preferencias
  const [preferencias, setPreferencias] = useState(() => {
    const guardadas = localStorage.getItem("preferenciasUsuario");
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
      },
      privacidad: {
        compartirEstadisticas: false,
        mostrarEnRanking: false
      },
      seguridad: {
        autobloqueo: true,
        tiempoBloqueo: 5, // minutos
        biometrico: false
      }
    };
  });

  // =========================
  // CARGAR DATOS DEL USUARIO
  // =========================
  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  // Detectar estado real de Push al montar
  useEffect(() => {
    const checkPushStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Verificar en BD si las notificaciones están activadas
        const { data: subscription } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subscription && Notification.permission === 'granted') {
          setPushEnabled(true);
        }
      } catch (error) {
        // Silencioso
      }
    };

    checkPushStatus();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Error obteniendo usuario:', authError);
        const usuarioLocal = localStorage.getItem('usuario_fintrack');
        if (usuarioLocal) {
          setUsuario(JSON.parse(usuarioLocal));
        }
        setLoading(false);
        return;
      }

      let perfilCompleto = null;
      try {
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!perfilError && perfil) {
          perfilCompleto = perfil;
        }
      } catch (e) {
        console.warn('Tabla perfiles no existe o error:', e);
      }

      const datosUsuario = {
        id: user.id,
        email: user.email,
        nombre: perfilCompleto?.nombre || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
        apellido: perfilCompleto?.apellido || user.user_metadata?.apellido || '',
        telefono: perfilCompleto?.telefono || user.user_metadata?.telefono || '',
        pais: perfilCompleto?.pais || user.user_metadata?.pais || 'Mexico',
        moneda: perfilCompleto?.moneda_preferencia || user.user_metadata?.moneda || 'USD',
        avatar_url: perfilCompleto?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=6366f1&color=fff&bold=true`,
        created_at: user.created_at || perfilCompleto?.created_at,
        last_sign_in: user.last_sign_in_at,
        email_confirmed: user.email_confirmed_at ? true : false,
        provider: user.app_metadata?.provider || 'email'
      };

      setUsuario(datosUsuario);
      setDatosEdicion({
        nombre: datosUsuario.nombre,
        apellido: datosUsuario.apellido,
        telefono: datosUsuario.telefono,
        pais: datosUsuario.pais,
      });
      
      localStorage.setItem('usuario_fintrack', JSON.stringify(datosUsuario));

      if (datosUsuario.moneda) {
        setPreferencias(prev => ({ ...prev, moneda: datosUsuario.moneda }));
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FUNCIONES DE ACTUALIZACIÓN
  // =========================
  const handleGuardarPerfil = async () => {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Actualizar metadatos de auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          nombre: datosEdicion.nombre, 
          apellido: datosEdicion.apellido, 
          telefono: datosEdicion.telefono, 
          pais: datosEdicion.pais 
        }
      });

      if (updateError) throw updateError;

      // Intentar actualizar tabla de perfiles
      try {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .upsert({ 
            user_id: user.id, 
            ...datosEdicion, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'user_id' });

        if (perfilError) console.warn('No se pudo actualizar perfil:', perfilError);
      } catch (e) {
        console.warn('Tabla perfiles no disponible');
      }

      setUsuario(prev => ({ ...prev, ...datosEdicion }));
      localStorage.setItem('usuario_fintrack', JSON.stringify({ ...usuario, ...datosEdicion }));

      alert('✅ Perfil actualizado correctamente');
      setModoEdicion(false);
      await cargarDatosUsuario();

    } catch (error) {
      console.error('Error guardando perfil:', error);
      alert('Error al guardar el perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarPreferencias = () => {
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias));
    if (onChangePreferencias) {
      onChangePreferencias(preferencias);
    }
    alert("✅ Preferencias guardadas correctamente");
  };

  // =========================
  // CAMBIO DE CONTRASEÑA
  // =========================
  const calcularFortalezaPassword = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  useEffect(() => {
    setPasswordStrength(calcularFortalezaPassword(passwordData.newPassword));
  }, [passwordData.newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Muy débil';
    if (passwordStrength < 60) return 'Débil';
    if (passwordStrength < 80) return 'Buena';
    return 'Excelente';
  };

  const handleCambiarPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('❌ La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwordStrength < 50) {
      alert('❌ La contraseña es muy débil. Usa mayúsculas, números y símbolos.');
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      alert('✅ Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      alert('❌ Error al cambiar la contraseña: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================
  // ELIMINAR CUENTA
  // =========================
  const handleEliminarCuenta = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      alert('❌ Escribe ELIMINAR para confirmar');
      return;
    }

    try {
      setDeletingAccount(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const tablasAEliminar = [
          'ingresos', 'gastos', 'gastos_fijos', 'suscripciones', 'deudas', 
          'pagos_tarjeta', 'planes_guardados', 'cuentas_bancarias', 
          'movimientos_bancarios', 'perfiles', 'push_subscriptions'
        ];
        
        for (const tabla of tablasAEliminar) {
          try {
            await supabase.from(tabla).delete().eq('user_id', user.id);
          } catch (e) {
            console.warn(`No se pudo eliminar de ${tabla}:`, e);
          }
        }
      }

      localStorage.clear();
      alert('✅ Tu cuenta ha sido eliminada. Serás redirigido al inicio.');
      
      await supabase.auth.signOut();
      if (onLogout) onLogout();

    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      alert('❌ Error al eliminar la cuenta: ' + error.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  // =========================
  // EXPORTAR DATOS
  // =========================
  const handleExportarDatos = async () => {
    try {
      setExportingData(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const datosExportados = {
        meta: {
          app: 'FinGuide',
          version: '2.0.0',
          fecha: new Date().toISOString(),
          email: usuario.email
        },
        perfil: usuario,
        preferencias: preferencias
      };

      const tablas = ['ingresos', 'gastos', 'gastos_fijos', 'suscripciones', 'deudas', 'pagos_tarjeta', 'planes_guardados', 'cuentas_bancarias'];
      
      for (const tabla of tablas) {
        try {
          const { data } = await supabase.from(tabla).select('*').eq('user_id', user.id);
          if (data) datosExportados[tabla] = data;
        } catch (e) {
          console.warn(`No se pudo exportar ${tabla}`);
          datosExportados[tabla] = [];
        }
      }

      const blob = new Blob([JSON.stringify(datosExportados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finguide_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Datos exportados correctamente');

    } catch (error) {
      console.error('Error exportando datos:', error);
      alert('❌ Error al exportar los datos: ' + error.message);
    } finally {
      setExportingData(false);
    }
  };

  // =========================
  // NOTIFICACIONES (LIMPIO - SIN DEBUG)
  // =========================
  const handleActivarPush = async () => {
    try {
      setLoadingPush(true);
      
      await subscribeToPushFCM();
      
      setPushEnabled(true);
      setPreferencias(prev => ({
        ...prev,
        notificaciones: {
          ...prev.notificaciones,
          alertasPush: true
        }
      }));

      // Mostrar notificación de prueba
      setTimeout(() => {
        sendTestNotification(
          '🎉 Notificaciones Activadas',
          'FinGuide te enviará alertas importantes sobre tus finanzas'
        );
      }, 1000);
      
    } catch (error) {
      console.error('Error activando notificaciones:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoadingPush(false);
    }
  };

  const handleDesactivarPush = async () => {
    try {
      setLoadingPush(true);
      
      await unsubscribeFromPushFCM();
      
      setPushEnabled(false);
      setPreferencias(prev => ({
        ...prev,
        notificaciones: {
          ...prev.notificaciones,
          alertasPush: false
        }
      }));
      
      alert('🔕 Notificaciones desactivadas correctamente');
      
    } catch (error) {
      console.error('Error desactivando push:', error);
      alert('Error al desactivar las notificaciones');
    } finally {
      setLoadingPush(false);
    }
  };

  const toggleNotificacion = (tipo) => {
    setPreferencias(prev => ({
      ...prev,
      notificaciones: {
        ...prev.notificaciones,
        [tipo]: !prev.notificaciones[tipo]
      }
    }));
  };

  const handleLogout = async () => {
    if(window.confirm("¿Estás seguro de cerrar sesión?")) {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('usuario_fintrack');
        localStorage.removeItem('preferenciasUsuario');
        if (onLogout) onLogout();
      } catch (e) {
        localStorage.clear();
        if (onLogout) onLogout();
      }
    }
  };

  const handleCerrarTodasSesiones = async () => {
    if (window.confirm("¿Cerrar todas las sesiones en otros dispositivos?")) {
      try {
        await supabase.auth.signOut({ scope: 'global' });
        localStorage.clear();
        alert('✅ Sesiones cerradas correctamente.');
        if (onLogout) onLogout();
      } catch (e) {
        console.error(e);
        alert('❌ Error: ' + e.message);
      }
    }
  };

  const handleContactarSoporte = () => {
    const asunto = encodeURIComponent('Soporte FinGuide');
    const cuerpo = encodeURIComponent(`Hola,\n\n[Describe tu problema aquí]\n\n---\nUsuario: ${usuario?.email}\nVersión: 2.0.0`);
    window.open(`mailto:edwin_evangelista@hotmail.com?subject=${asunto}&body=${cuerpo}`, '_blank');
  };

  // =========================
  // MEMOS
  // =========================
  const prefsNotificaciones = useMemo(() => {
    return preferencias?.notificaciones || {
      gastos: true,
      deudas: true,
      suscripciones: true,
      alertasPush: false
    };
  }, [preferencias?.notificaciones]);

  // =========================
  // TABS DE NAVEGACIÓN
  // =========================
  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'preferencias', label: 'Preferencias', icon: DollarSign },
    { id: 'privacidad', label: 'Privacidad', icon: Lock },
    { id: 'ayuda', label: 'Ayuda', icon: HelpCircle },
  ];

  // =========================
  // RENDER LOADING
  // =========================
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-3xl p-8 flex flex-col items-center gap-4 border border-white/10">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-3xl p-8 text-center border border-white/10">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">No se pudo cargar el perfil</p>
          <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER PRINCIPAL
  // =========================
  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
        <div className="bg-gray-900 w-full h-full md:rounded-3xl md:w-full md:max-w-3xl md:h-auto md:max-h-[90vh] overflow-hidden border-0 md:border border-white/10 shadow-2xl flex flex-col relative">
          
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-gray-900 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-indigo-500/20 rounded-xl md:rounded-2xl border border-indigo-500/30 text-indigo-400">
                <User className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Mi Cuenta</h2>
                <p className="text-xs text-gray-500 hidden md:block">{usuario.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <div className="flex overflow-x-auto border-b border-white/5 bg-gray-900/50 px-2 md:px-4 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-3 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32 md:pb-6">
            
            {/* ==================== TAB: PERFIL ==================== */}
            {activeTab === 'perfil' && (
              <>
                {/* Avatar y datos básicos */}
                <section className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl p-4 md:p-6 border border-blue-500/30">
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div className="relative group">
                      <img 
                        src={usuario.avatar_url} 
                        alt="Avatar" 
                        className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-4 border-white/20 object-cover"
                      />
                      <button 
                        className="absolute bottom-1 right-1 md:bottom-2 md:right-2 p-2 md:p-3 bg-blue-600/80 hover:bg-blue-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Cambiar foto (próximamente)"
                      >
                        <Camera className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl md:text-3xl font-bold text-white">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
                        <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                        <span className="text-gray-300 text-sm md:text-lg">{usuario.email}</span>
                        {usuario.email_confirmed && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" title="Email verificado" />
                        )}
                      </div>
                      <div className="text-gray-500 text-xs md:text-sm mt-1">
                        Miembro desde {new Date(usuario.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                      </div>
                    </div>

                    {!modoEdicion && (
                      <button
                        onClick={() => setModoEdicion(true)}
                        className="mt-2 md:mt-0 px-4 md:px-6 py-2 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit2 className="w-4 h-4 md:w-5 md:h-5" /> Editar
                      </button>
                    )}
                  </div>
                </section>

                {/* Información personal */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Información Personal
                    </h3>
                    {modoEdicion && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(false);
                            setDatosEdicion({ nombre: usuario.nombre, apellido: usuario.apellido, telefono: usuario.telefono, pais: usuario.pais });
                          }}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs md:text-sm rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleGuardarPerfil}
                          disabled={saving}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                        </button>
                      </div>
                    )}
                  </div>

                  {modoEdicion ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 mb-1 text-xs md:text-sm">Nombre</label>
                          <input
                            type="text"
                            value={datosEdicion.nombre}
                            onChange={(e) => setDatosEdicion(prev => ({ ...prev, nombre: e.target.value }))}
                            className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 text-sm"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-xs md:text-sm">Apellido</label>
                          <input
                            type="text"
                            value={datosEdicion.apellido}
                            onChange={(e) => setDatosEdicion(prev => ({ ...prev, apellido: e.target.value }))}
                            className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 text-sm"
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 text-xs md:text-sm">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500 pointer-events-none" />
                          <input
                            type="tel"
                            value={datosEdicion.telefono}
                            onChange={(e) => setDatosEdicion(prev => ({ ...prev, telefono: e.target.value }))}
                            className="w-full bg-gray-800 text-white pl-12 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 text-sm"
                            placeholder="+1 555-123-4567"
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 text-xs md:text-sm">País</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500 pointer-events-none" />
                          <select
                            value={datosEdicion.pais}
                            onChange={(e) => setDatosEdicion(prev => ({ ...prev, pais: e.target.value }))}
                            className="w-full bg-gray-800 text-white pl-12 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 text-sm"
                            disabled={saving}
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
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-gray-500">Nombre completo</span>
                        <span className="text-white font-medium">{usuario.nombre} {usuario.apellido}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="w-4 h-4" /> Teléfono
                        </div>
                        <span className="text-white font-medium">{usuario.telefono || 'No especificado'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe className="w-4 h-4" /> País
                        </div>
                        <span className="text-white font-medium">{usuario.pais}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <History className="w-4 h-4" /> Último acceso
                        </div>
                        <span className="text-white font-medium">
                          {usuario.last_sign_in ? new Date(usuario.last_sign_in).toLocaleDateString('es-ES') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ==================== TAB: SEGURIDAD ==================== */}
            {activeTab === 'seguridad' && (
              <>
                {/* Estado de seguridad */}
                <section className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-4 md:p-6 border border-green-500/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <ShieldCheck className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Tu cuenta está protegida</h3>
                      <p className="text-sm text-gray-400">Mantén tus datos seguros con estas opciones</p>
                    </div>
                  </div>
                </section>

                {/* Cambiar contraseña */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-yellow-400" /> Contraseña
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Última actualización: Desconocida</p>
                      <p className="text-gray-500 text-xs mt-1">Se recomienda cambiarla cada 90 días</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-yellow-500/30"
                    >
                      <Key className="w-4 h-4" /> Cambiar
                    </button>
                  </div>
                </section>

                {/* Autenticación de dos factores */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Fingerprint className="w-5 h-5 text-purple-400" /> Autenticación de Dos Factores
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Añade una capa extra de seguridad</p>
                      <p className="text-gray-500 text-xs mt-1">Usa tu teléfono para verificar tu identidad</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-purple-500/30 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      Próximamente
                    </button>
                  </div>
                </section>

                {/* Sesiones activas */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5 text-blue-400" /> Sesiones Activas
                  </h3>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Smartphone className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Sesión actual</p>
                          <p className="text-gray-500 text-xs">{navigator.userAgent.includes('Mobile') ? 'Dispositivo móvil' : 'Navegador web'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Activa</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCerrarTodasSesiones}
                    className="w-full mt-4 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar todas las sesiones
                  </button>
                </section>
              </>
            )}

            {/* ==================== TAB: PREFERENCIAS ==================== */}
            {activeTab === 'preferencias' && (
              <>
                {/* Preferencias financieras */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-emerald-400" /> Preferencias Financieras
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-500 mb-2 text-xs">Moneda</label>
                      <select
                        value={preferencias.moneda}
                        onChange={(e) => setPreferencias(prev => ({ ...prev, moneda: e.target.value }))}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700 text-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="MXN">MXN ($)</option>
                        <option value="COP">COP ($)</option>
                        <option value="ARS">ARS ($)</option>
                        <option value="CLP">CLP ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-2 text-xs">Objetivo principal</label>
                      <select
                        value={preferencias.objetivo}
                        onChange={(e) => setPreferencias(prev => ({ ...prev, objetivo: e.target.value }))}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700 text-sm"
                      >
                        <option>Reducir deudas</option>
                        <option>Ahorrar</option>
                        <option>Invertir</option>
                        <option>Controlar gastos</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Notificaciones */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-blue-500/20">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-blue-400" /> Notificaciones
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Bell className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Notificaciones Push</p>
                          <p className="text-gray-500 text-xs">{pushEnabled ? 'Activadas - Se reactivarán automáticamente' : 'Desactivadas'}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={pushEnabled ? handleDesactivarPush : handleActivarPush}
                        disabled={loadingPush}
                        className="text-blue-400 text-sm font-bold hover:underline disabled:opacity-50"
                      >
                        {loadingPush 
                          ? 'Procesando...' 
                          : pushEnabled 
                            ? 'Desactivar' 
                            : 'Activar'}
                      </button>
                    </div>

                    {[
                      { key: 'gastos', label: 'Alertas de gastos', desc: 'Límite mensual', color: 'red', icon: Target },
                      { key: 'deudas', label: 'Alertas de deudas', desc: 'Fechas de corte', color: 'purple', icon: CreditCard },
                      { key: 'suscripciones', label: 'Renovaciones', desc: 'Suscripciones', color: 'blue', icon: Repeat },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => toggleNotificacion(item.key)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          prefsNotificaciones[item.key] 
                            ? `bg-${item.color}-500/10 border-${item.color}-500/30 text-${item.color}-300` 
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-${item.color}-500/20 rounded-lg`}>
                            <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-[10px] opacity-80">{item.desc}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${prefsNotificaciones[item.key] ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                          {prefsNotificaciones[item.key] ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* IA */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" /> Inteligencia Artificial
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">IA financiera activa</p>
                      <p className="text-gray-500 text-xs mt-1">Análisis y recomendaciones personalizadas</p>
                    </div>
                    <button
                      onClick={() => setPreferencias(prev => ({ ...prev, iaActiva: !prev.iaActiva }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        preferencias.iaActiva ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferencias.iaActiva ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </section>

                {/* Botón guardar */}
                <button 
                  onClick={handleGuardarPreferencias}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
                >
                  <Save className="w-5 h-5" />
                  Guardar Preferencias
                </button>
              </>
            )}

            {/* ==================== TAB: PRIVACIDAD ==================== */}
            {activeTab === 'privacidad' && (
              <>
                {/* Exportar datos */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Download className="w-5 h-5 text-blue-400" /> Exportar mis datos
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Descarga una copia de todos tus datos almacenados en la aplicación en formato JSON.
                  </p>
                  <button
                    onClick={handleExportarDatos}
                    disabled={exportingData}
                    className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-blue-500/30 disabled:opacity-50"
                  >
                    {exportingData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {exportingData ? 'Exportando...' : 'Descargar mis datos'}
                  </button>
                </section>

                {/* Privacidad de datos */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-green-400" /> Privacidad de datos
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 text-sm">Compartir estadísticas anónimas</p>
                        <p className="text-gray-500 text-xs">Ayuda a mejorar la app</p>
                      </div>
                      <button
                        onClick={() => setPreferencias(prev => ({ 
                          ...prev, 
                          privacidad: { ...prev.privacidad, compartirEstadisticas: !prev.privacidad?.compartirEstadisticas } 
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferencias.privacidad?.compartirEstadisticas ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferencias.privacidad?.compartirEstadisticas ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Términos y políticas */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-400" /> Legal
                  </h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowTermsModal(true)}
                      className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-gray-300 text-sm">Términos de servicio</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setShowPrivacyModal(true)}
                      className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-gray-300 text-sm">Política de privacidad</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </section>

                {/* Eliminar cuenta */}
                <section className="bg-red-500/5 rounded-2xl p-4 md:p-6 border border-red-500/20">
                  <h3 className="text-red-400 text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Trash2 className="w-5 h-5" /> Zona de peligro
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Una vez que elimines tu cuenta, no hay vuelta atrás. Se borrarán todos tus datos permanentemente.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar mi cuenta
                  </button>
                </section>
              </>
            )}

            {/* ==================== TAB: AYUDA ==================== */}
            {activeTab === 'ayuda' && (
              <>
                {/* Centro de ayuda */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-blue-400" /> Centro de Ayuda
                  </h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowFAQModal(true)}
                      className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <HelpCircle className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Preguntas frecuentes</p>
                          <p className="text-gray-500 text-xs">Respuestas a dudas comunes</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>

                    <button
                      onClick={handleContactarSoporte}
                      className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Contactar soporte</p>
                          <p className="text-gray-500 text-xs">Envía un mensaje</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </section>

                {/* Calificar app */}
                <section className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl p-4 md:p-6 border border-yellow-500/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">¿Te gusta FinGuide?</h3>
                      <p className="text-sm text-gray-400">Déjanos una reseña en la tienda</p>
                    </div>
                    <button 
                      onClick={() => alert('🌟 ¡Gracias por tu apoyo!')}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl text-sm font-bold transition-all"
                    >
                      Calificar
                    </button>
                  </div>
                </section>

                {/* Información de la app */}
                <section className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                  <h3 className="text-white text-base md:text-lg font-bold flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-gray-400" /> Información de la App
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Versión</span>
                      <span className="text-white font-medium">2.0.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Última actualización</span>
                      <span className="text-white font-medium">Enero 2026</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Desarrollado por</span>
                      <span className="text-white font-medium">FinGuide Team</span>
                    </div>
                  </div>
                </section>
              </>
            )}

          </div>

          {/* FOOTER - CERRAR SESIÓN */}
          <div className="sticky bottom-0 p-4 md:p-6 border-t border-white/5 bg-gray-900/95 backdrop-blur-sm shrink-0">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 rounded-xl font-semibold transition-all border border-red-500/30 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MODAL: CAMBIAR CONTRASEÑA ==================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" /> Cambiar Contraseña
              </h3>
              <button 
                onClick={() => {
                    setShowPasswordModal(false); 
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }} 
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nueva contraseña */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-700 pr-12"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Barra de fortaleza */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${
                      passwordStrength < 30 ? 'text-red-400' :
                      passwordStrength < 60 ? 'text-yellow-400' :
                      passwordStrength < 80 ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      Fortaleza: {getPasswordStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 border pr-12 ${
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:ring-yellow-500'
                    }`}
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Las contraseñas no coinciden
                  </p>
                )}
                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 8 && (
                   <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Coinciden
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-400 text-xs font-medium mb-2">💡 Tips para una contraseña segura:</p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li className={passwordData.newPassword.length >= 8 ? 'text-green-400' : ''}>• Mínimo 8 caracteres</li>
                  <li className={/[a-z]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) ? 'text-green-400' : ''}>• Combina mayúsculas y minúsculas</li>
                  <li className={/\d/.test(passwordData.newPassword) ? 'text-green-400' : ''}>• Incluye números</li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-green-400' : ''}>• Incluye símbolos (!@#$%)</li>
                </ul>
              </div>

              <button
                onClick={handleCambiarPassword}
                disabled={changingPassword || passwordStrength < 50 || passwordData.newPassword !== passwordData.confirmPassword}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Key className="w-5 h-5" />
                )}
                {changingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ELIMINAR CUENTA ==================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-red-500/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">¿Eliminar tu cuenta?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, incluyendo:
              </p>
            </div>

            <ul className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 space-y-2">
              <li className="text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Todos tus ingresos y gastos
              </li>
              <li className="text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Historial de deudas y pagos
              </li>
              <li className="text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Suscripciones y planes guardados
              </li>
              <li className="text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Preferencias y configuraciones
              </li>
            </ul>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2 text-sm">
                Escribe <span className="text-red-400 font-bold">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-700"
                placeholder="ELIMINAR"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarCuenta}
                disabled={deletingAccount || deleteConfirmText !== 'ELIMINAR'}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {deletingAccount ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                {deletingAccount ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALES LEGALES Y FAQ ==================== */}
      {showFAQModal && <FAQ onClose={() => setShowFAQModal(false)} />}
      {showTermsModal && <TermsOfService onClose={() => setShowTermsModal(false)} />}
      {showPrivacyModal && <PrivacyPolicy onClose={() => setShowPrivacyModal(false)} />}

      {/* Estilos adicionales para ocultar scrollbar */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}