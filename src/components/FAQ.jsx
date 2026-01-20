import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Mail, Lock, Shield, Download, AlertTriangle } from 'lucide-react';

export default function FAQ({ onClose }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      icon: Lock,
      question: "¿Cómo cambio mi contraseña?",
      answer: "Ve a la pestaña 'Seguridad' en tu perfil y haz clic en el botón 'Cambiar' junto a la sección de Contraseña. Deberás ingresar tu nueva contraseña y confirmarla.",
      color: "text-yellow-400"
    },
    {
      icon: Shield,
      question: "¿Mis datos están seguros?",
      answer: "Absolutamente. Utilizamos encriptación de extremo a extremo y servidores seguros. Nunca compartimos tus datos financieros con terceros sin tu consentimiento.",
      color: "text-green-400"
    },
    {
      icon: Download,
      question: "¿Puedo descargar mis datos?",
      answer: "Sí. En la pestaña 'Privacidad' encontrarás la opción 'Exportar mis datos'. Esto generará un archivo JSON con toda tu información financiera.",
      color: "text-blue-400"
    },
    {
      icon: AlertTriangle,
      question: "¿Cómo elimino mi cuenta?",
      answer: "Ve a 'Privacidad' > 'Zona de peligro' y haz clic en 'Eliminar mi cuenta'. Deberás escribir la palabra ELIMINAR para confirmar. Esta acción es irreversible.",
      color: "text-red-400"
    },
    {
      icon: HelpCircle,
      question: "¿Qué hace la IA Financiera?",
      answer: "La IA analiza tus patrones de gasto para ofrecerte consejos personalizados, detectar gastos recurrentes inusuales y sugerir presupuestos.",
      color: "text-purple-400"
    },
    {
      icon: Mail,
      question: "¿No encuentro la respuesta?",
      answer: "Si tienes más dudas, usa el botón 'Contactar soporte' para enviarnos un correo directamente.",
      color: "text-gray-400"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gray-900/95 backdrop-blur-md p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                <HelpCircle className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Preguntas Frecuentes</h2>
                <p className="text-gray-400 text-sm">Resuelve tus dudas rápidamente</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <faq.icon className={`w-5 h-5 ${faq.color}`} />
                  <h3 className="text-white font-medium text-sm md:text-base">{faq.question}</h3>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-4 pb-4 pt-0">
                  <div className="h-px bg-white/10 mb-3"></div>
                  <p className="text-gray-300 text-sm leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 bg-gray-900/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}