import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ie.athbheochan.focloir',
  appName: 'Foclóir Póca',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    url: process.env.CAPACITOR_DEV_URL,
    cleartext: false,
  },
};

export default config;
