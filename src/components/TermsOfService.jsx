import React from 'react';
import { X, FileText, AlertTriangle, CheckCircle, XCircle, Shield, Gavel, Zap } from 'lucide-react';

export default function TermsOfService({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-t-3xl border-b border-white/5 z-10 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-white/20 p-2 rounded-xl border border-white/30">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Términos de Servicio</h2>
                  <p className="text-indigo-100 text-sm">finguide App - Edición Enero 2026</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
          
          {/* 1. ACEPTACIÓN */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-400" /> Aceptación de los Términos
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Al acceder y usar <strong className="text-white">finguide App</strong>, aceptas estar sujeto a estos Términos de Servicio y a nuestra Política de Privacidad.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-200 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">Importante:</span> Si no estás de acuerdo con alguno de estos términos, no uses la aplicación. Tu uso continuado constituye la aceptación de los mismos.
              </p>
            </div>
          </section>

          {/* 2. DESCRIPCIÓN DEL SERVICIO */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" /> Servicios de finguide
            </h3>
            <p className="text-gray-400 mb-3">
              finguide App es una plataforma web de gestión financiera personal que te permite:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none">
              <li className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Registrar y rastrear tus ingresos y gastos diarios.
              </li>
              <li className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm flex items-center gap-3">
                <span className="text-2xl">💳</span>
                Gestionar tus deudas y tarjetas de crédito.
              </li>
              <li className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm flex items-center gap-3">
                <span className="text-2xl">🔄</span>
                Controlar tus suscripciones activas y gastos recurrentes.
              </li>
              <li className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                Crear y seguir planes de ahorro personalizados.
              </li>
              <li className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-gray-300 text-sm flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                Recibir análisis financieros y recomendaciones automáticas.
              </li>
            </ul>
          </section>

          {/* 3. RESPONSABILIDADES DEL USUARIO */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" /> Tus Responsabilidades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5">
                <h4 className="text-emerald-300 font-bold mb-3 text-sm uppercase tracking-wider">Lo que SÍ debes hacer</h4>
                <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside ml-4">
                  <li>Proporcionar información precisa y verídica.</li>
                  <li>Mantener la seguridad de tu cuenta y contraseña.</li>
                  <li>Utilizar la aplicación solo para fines legales y éticos.</li>
                  <li>Respetar los derechos de propiedad intelectual de terceros.</li>
                </ul>
              </div>
              <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-5">
                <h4 className="text-rose-300 font-bold mb-3 text-sm uppercase tracking-wider">Lo que NO está permitido</h4>
                <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside ml-4">
                  <li>Usar la app para actividades ilegales o fraudulentas.</li>
                  <li>Intentar acceder a cuentas ajenas o vulnerabilidades.</li>
                  <li>Subir virus, malware o código malicioso.</li>
                  <li>Interferir con el funcionamiento del servicio (DoS, flooding).</li>
                  <li>Revender o sublicenciar tu acceso sin autorización.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. LIMITACIÓN DE RESPONSABILIDAD */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" /> Limitación de Responsabilidad
            </h3>
            <div className="bg-yellow-900/10 border border-yellow-500/30 rounded-2xl p-6">
              <p className="text-yellow-200 mb-4 leading-relaxed">
                <strong className="text-white">ADVERTENCIA:</strong> finguide App es una herramienta de gestión financiera y <strong>NO</strong> proporciona asesoría financiera profesional certificada (asesor de inversiones, contador público, etc.).
              </p>
              <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside ml-6">
                <li>No nos hacemos responsables de decisiones financieras que tomes basándote en el uso de la App.</li>
                <li>Los análisis y recomendaciones son meramente estadísticos y orientativos.</li>
                <li>No garantizamos ganancias ni resultados financieros específicos.</li>
                <li>Eres el único responsable de verificar la exactitud de tus datos financieros antes de tomar decisiones.</li>
              </ul>
            </div>
          </section>

          {/* 5. PROPIEDAD INTELECTUAL */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Propiedad Intelectual</h3>
            <p className="text-gray-300 mb-3">
              Todo el contenido, diseño, código fuente, lógica y funcionalidades de finguide App son propiedad exclusiva de <strong className="text-white">Edwin Evangelista</strong> (el Desarrollador) y están protegidos por leyes de derechos de autor internacionales.
            </p>
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-purple-200 text-sm">
                <Zap className="w-4 h-4" />
                <span className="font-semibold text-white">Derechos Reservados:</span>
              </div>
              <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside ml-7">
                <li>No tienes derecho a copiar, modificar o distribuir el código de la aplicación.</li>
                <li>Los logotipos, marcas comerciales y nombres de producto son propiedad de Edwin Evangelista.</li>
                <li>Los datos financieros que tú introduces son de tu exclusiva propiedad.</li>
              </ul>
            </div>
          </section>

          {/* 6. CANCELACIÓN Y TERMINACIÓN */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-400" /> Cancelación y Terminación
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2">Tu cuenta</h4>
                <p className="text-gray-300 text-sm">
                  Puedes eliminar tu cuenta y datos en cualquier momento desde la configuración de tu perfil. Los datos se eliminarán de nuestros servidores de forma permanente en un plazo de 30 días.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2">Terminación por el Desarrollador</h4>
                <p className="text-gray-300 text-sm">
                  Nos reservamos el derecho de suspender o cerrar tu cuenta de forma inmediata si:
                </p>
                <ul className="mt-2 space-y-1 text-gray-400 text-xs list-disc list-inside ml-4">
                  <li>Violas estos términos repetidamente.</li>
                  <li>Utilizas la cuenta para actividades fraudulentas.</li>
                  <li>Incumples las leyes locales y federales aplicables.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. MODIFICACIONES */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Modificaciones al Servicio</h3>
            <p className="text-gray-400 mb-3 text-sm">
              Nos reservamos el derecho de modificar, suspender o descontinuar cualquier parte del servicio en cualquier momento y sin previo aviso. Te notificaremos de cambios importantes en estos términos con al menos 30 días de antelación.
            </p>
          </section>

          {/* 8. GARANTÍAS */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Ausencia de Garantías</h3>
            <p className="text-gray-400 mb-3 text-sm">
              El servicio se proporciona "tal cual", sin garantía de disponibilidad ininterrumpida, ni exención de fallos o errores técnicos.
            </p>
          </section>

          {/* 9. LEY APLICABLE Y RESOLUCIÓN DE DISPUTAS */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-gray-400" /> Jurisdicción
            </h3>
            <div className="bg-gray-800/50 rounded-xl p-5">
              <p className="text-gray-300 text-sm">
                Estos términos se regirán e interpretarán de acuerdo con las leyes del estado de <strong className="text-white">Connecticut, Estados Unidos</strong>. Cualquier disputa, controversia o reclamación que surja de estos términos se resolverá exclusivamente en los tribunales estatales o federales ubicados en Hartford County, CT.
              </p>
            </div>
          </section>
          
          {/* 10. CONTACTO */}
          <section className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
             <h3 className="text-white font-bold mb-3">¿Tienes preguntas?</h3>
             <div className="text-indigo-200 text-sm space-y-2">
               <p><strong>Email:</strong> <a href="mailto:edwin_evangelista@hotmail.com" className="text-blue-400 hover:underline">edwin_evangelista@hotmail.com</a></p>
               <p><strong>Ubicación:</strong> Windsor, Connecticut, USA</p>
               <p><strong>Fecha:</strong> Enero 2026</p>
             </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm border-t border-white/5 rounded-b-3xl shrink-0 z-10">
          <p className="text-center text-gray-400 text-sm">
            Al continuar usando finguide App, aceptas los Términos de Servicio mencionados anteriormente.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}