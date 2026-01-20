import React from 'react';
import { X, Shield, Database, Lock, Eye, Mail, Globe, CreditCard, User, Server, AlertCircle } from 'lucide-react';

export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl relative">
        
        {/* --- HEADER --- */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md p-6 md:p-8 border-b border-white/5 z-20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Política de Privacidad</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Globe className="w-4 h-4" />
                    <span>Última actualización: Enero 2026</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 max-w-xl text-sm md:text-base mt-2">
                Tu privacidad es nuestra prioridad absoluta. Esta política detalla cómo finguide App protege, almacena y gestiona tus datos financieros.
              </p>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Introducción */}
          <section className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600/20 p-2 rounded-lg mt-1">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Compromiso de Seguridad</h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  En <strong className="text-white">finguide App</strong>, entendemos que gestionar tu dinero es sensible. Nos comprometemos a mantener la confidencialidad de tus datos financieros utilizando los más altos estándares de seguridad en la nube.
                </p>
              </div>
            </div>
          </section>

          {/* Información que Recopilamos */}
          <section>
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" /> Datos que Recopilamos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" /> Cuenta
                </h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Correo electrónico</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Nombre de usuario</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Perfil público</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" /> Financieros
                </h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Ingresos y gastos</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Suscripciones</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Saldo total (agregado)</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-400" /> Uso
                </h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Tiempo de uso</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Dispositivo y navegador</li>
                </ul>
              </div>

            </div>
            <div className="mt-4 bg-rose-900/20 border border-rose-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 mt-1" />
                <div>
                  <p className="text-white font-bold text-sm">Información Bancaria</p>
                  <p className="text-gray-300 text-xs mt-1">
                    ⚠️ Nunca solicitamos números de tarjeta de crédito completos, CVC, ni contraseñas de banca en línea. Solo usamos identificadores abstractos para tus cuentas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cómo la usamos */}
          <section>
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" /> Uso de la Información
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Analizar tus hábitos de gasto",
                "Generar reportes personalizados",
                "Detectar anomalías financieras",
                "Calcular progreso hacia tus metas",
                "Enviar alertas de pagos (si está habilitado)"
              ].map((item, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <p className="text-gray-300 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" /> Seguridad de Datos
            </h4>
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Encriptación", desc: "AES-256 bits" },
                  { title: "Contraseñas", desc: "Hash con Bcrypt" },
                  { title: "Conexión", desc: "SSL/TLS Certificado" },
                  { title: "Copias", desc: "Automatizadas (24h)" },
                  { title: "Acceso", desc: "Auth 2FA (Opcional)" },
                  { title: "Auditoría", desc: "Cumplimiento SOC 2" }
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="bg-emerald-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h5 className="text-white font-bold text-sm mb-1">{item.title}</h5>
                    <p className="text-emerald-200 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Compartir Información */}
          <section>
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-lg">No vendemos tus datos</h4>
                  <p className="text-gray-400 text-sm">Tu información financiera nunca es compartida con terceros con fines comerciales.</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" /> Contáctanos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
              <div className="flex items-center gap-3 text-gray-300">
                <span className="font-semibold text-white">Email:</span>
                <a href="mailto:edwin_evangelista@hotmail.com" className="text-blue-400 hover:underline">edwin_evangelista@hotmail.com</a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="font-semibold text-white">Empresa:</span>
                <span>finguide App LLC</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <span className="font-semibold text-white">Sede:</span>
                <span>Windsor, Connecticut, USA</span>
              </div>
            </div>
          </section>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-6 border-t border-white/5 bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            Entendido y Acepto
          </button>
        </div>
      </div>
    </div>
  );
}