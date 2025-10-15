import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinematch.app',
  appName: 'CineMatch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      android: {
        enableStorage: true
      }
    }
  }
};

export default config;