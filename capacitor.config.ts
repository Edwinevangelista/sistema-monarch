import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finguide.financeapp',
  appName: 'FinGuide',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    // Remove this block before App Store submission
    // Only for local dev testing on device:
    // url: 'http://192.168.1.153:3000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#00000000',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#00000000',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#00000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'large',
      spinnerColor: '#3B82F6',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
