// src/components/Footer.jsx
import React, { useState } from 'react';
import { Shield, FileText, Mail, Github, ExternalLink } from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

// 1. Recibimos 'className' en los props (con valor por defecto vacío)
function Footer({ className = "" }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div>
      {/* 2. Inyectamos el className en el footer usando template literals */}
      {/* Las clases originales se mantienen y se suma la nueva clase condicional */}
      <footer className={`bg-white border-t border-slate-200 py-8 mt-16 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Acerca de */}
            <div>
              <h3 className="text-slate-950 font-bold text-lg mb-4">FinGuide</h3>
              <p className="text-slate-600 text-sm mb-4">
                Your personal finance assistant. Take control of your money with intelligence and simplicity.
              </p>
              <p className="text-slate-500 text-xs">
                Version 1.0.0 • Jan 2026
              </p>
            </div>

            {/* Enlaces legales */}
            <div>
              <h3 className="text-slate-950 font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTerms(true)}
                    className="text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Términos de Servicio
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacto y soporte */}
            <div>
              <h3 className="text-slate-950 font-bold text-lg mb-4">Soporte</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:edwin_evangelista@hotmail.com"
                    className="text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
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
                    className="text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
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
          <div className="mt-8 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-500 text-sm">
              © 2026 FinGuide. Built by{' '}
              <span className="text-slate-900 font-semibold">Edwin Evangelista</span>.
              All rights reserved.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Windsor, Connecticut, USA
            </p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      {/* Al mantener estos fuera del tag <footer>, se aseguran de que puedan renderizarse 
          aunque el footer esté oculto por CSS en móvil */}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default Footer;
