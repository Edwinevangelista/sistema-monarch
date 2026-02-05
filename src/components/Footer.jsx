import React, { useState } from 'react';
import { Shield, FileText, Mail, Github, ExternalLink } from 'lucide-react';
// Asegúrate de que estos modales existan en tu proyecto
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

// Clases de utilidad para el estilo (si no usas tailwind config global)
const linkClass = "text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2";

function Footer({ className = "" }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div>
      {/* Footer Principal */}
      <footer className={`bg-gray-900/80 backdrop-blur-md border-t border-white/5 py-10 mt-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Columna: Marca */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                FinGuide
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tu asistente financiero personal. Gestiona tu dinero con inteligencia artificial, simplicidad y control total.
              </p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-gray-500 text-xs">
                  Versión 2.0.0 • 2024
                </p>
                <p className="text-gray-600 text-xs">
                  Hecho con 💙 por Edwin Evangelista
                </p>
              </div>
            </div>

            {/* Columna: Legal */}
            <div>
              <h3 className="text-white font-bold text-base mb-4 uppercase tracking-wider text-gray-500">
                Legal
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button 
                    onClick={() => setShowPrivacy(true)}
                    className={linkClass}
                  >
                    <Shield className="w-4 h-4" />
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowTerms(true)}
                    className={linkClass}
                  >
                    <FileText className="w-4 h-4" />
                    Términos de Servicio
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna: Soporte y Social */}
            <div>
              <h3 className="text-white font-bold text-base mb-4 uppercase tracking-wider text-gray-500">
                Soporte
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="mailto:edwin_evangelista@hotmail.com"
                    className={`${linkClass} hover:text-blue-400`}
                  >
                    <Mail className="w-4 h-4" />
                    Contacto
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Edwinevangelista/sistema-monarch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass} hover:text-white`}
                  >
                    <Github className="w-4 h-4" />
                    Código Fuente
                    <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} FinGuide. Todos los derechos reservados.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Windsor, Connecticut, USA
            </p>
          </div>
        </div>
      </footer>

      {/* Modales Overlay (Renderizados fuera del footer para no afectar layout) */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
             <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
          </div>
        </div>
      )}

      {showTerms && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
             <TermsOfService onClose={() => setShowTerms(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Footer;