// src/utils/confirm.js
// Drop-in replacement for window.confirm — funciona en Capacitor nativo, iOS, Android
// Renderiza ModalConfirmacion en un portal al body sin necesitar Context

import React from 'react';
import { createRoot } from 'react-dom/client';
import ModalConfirmacion from '../components/ModalConfirmacion';

/**
 * showConfirm({ titulo, mensaje, textoConfirmar, textoCancel })
 * → Promise<boolean>
 *
 * Reemplaza window.confirm().
 * Uso:
 *   const ok = await showConfirm({ titulo: 'Delete?', mensaje: 'This cannot be undone.' })
 *   if (!ok) return
 */
export const showConfirm = ({
  titulo = 'Are you sure?',
  mensaje = 'This action cannot be undone.',
  textoConfirmar = 'Delete',
  textoCancel = 'Cancel',
}) => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.setAttribute('id', 'confirm-portal');
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = (result) => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      resolve(result);
    };

    root.render(
      <ModalConfirmacion
        isOpen={true}
        onClose={() => cleanup(false)}
        onConfirm={() => cleanup(true)}
        titulo={titulo}
        mensaje={mensaje}
        textoConfirmar={textoConfirmar}
        textoCancel={textoCancel}
      />
    );
  });
};
