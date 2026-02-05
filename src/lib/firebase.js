// firebase.js - Configuración Firebase COMPLETA para FinGuide
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// 🔥 CONFIGURACIÓN FIREBASE REAL
const firebaseConfig = {
  apiKey: "AIzaSyAoZBfEwYI3JMqfWvxifLigL9bSat4e-0",
  authDomain: "finguide-push.firebaseapp.com",
  projectId: "finguide-push",
  storageBucket: "finguide-push.firebasestorage.app",
  messagingSenderId: "101077654783",
  appId: "1:101077654783:web:ac287c980418fb760840ca",
  measurementId: "G-BRR1CYFPJ0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar FCM
const messaging = getMessaging(app);

export { messaging };

// 🎯 FCM Token Management
export const getFCMToken = async () => {
  try {
    console.log('🔥 Solicitando token FCM...');
    
    const currentToken = await getToken(messaging, {
      vapidKey: 'BEFxbMnyGOu8kqKSVJE_tyl-H2R8adGwUiJOzxVWplTzZ0rqE3JJF4E78zysqgFpoRcGZZMzrXOuinlKZEAgK_Xltaks'
    });
    
    if (currentToken) {
      console.log('✅ Token FCM obtenido:', currentToken.substring(0, 20) + '...');
      return currentToken;
    } else {
      console.log('❌ No hay token disponible');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    throw error;
  }
};

// 🔔 Listener para mensajes en foreground
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📨 Mensaje recibido en foreground:', payload);
      resolve(payload);
    });
  });