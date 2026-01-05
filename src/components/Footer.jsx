// src/components/Footer.jsx
import React, { useState } from 'react';
import { Shield, FileText, Mail, Github, ExternalLink } from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div>
      <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Acerca de */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Sistema Monarch</h3>
              <p className="text-gray-400 text-sm mb-4">
                Tu asistente personal de finanzas. Toma el control de tu dinero con inteligencia y simplicidad.
              </p>
              <p className="text-gray-500 text-xs">
                Versión 1.0.0 • Enero 2026
              </p>
            </div>

            {/* Enlaces legales */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTerms(true)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Términos de Servicio
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacto y soporte */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Soporte</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:edwin_evangelista@hotmail.com"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
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
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    Código Fuente
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 Sistema Monarch. Desarrollado por{' '}
              <span className="text-white font-semibold">Edwin Evangelista</span>. 
              Todos los derechos reservados.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Windsor, Connecticut, USA
            </p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default Footer;