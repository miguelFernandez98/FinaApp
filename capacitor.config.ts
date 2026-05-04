import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finaapp.app",
  appName: "FinanzApp",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0a0a0f",
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0f",
  },
};

export default config;
