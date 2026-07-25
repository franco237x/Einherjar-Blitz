import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// getReactNativePersistence is exported from the React Native bundle entry of
// @firebase/auth (resolved by Metro at runtime), but not from the browser
// typings that TypeScript sees. Suppress the missing-export type error.
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fail fast if Firebase env vars are missing. Using placeholder strings
// silently initializes a broken app that errors later with confusing messages.
// Expo only inlines EXPO_PUBLIC_* variables when they are referenced statically
// with dot notation. Keep every process.env access explicit; dynamic access such
// as process.env[key] remains undefined in a production bundle.
const firebaseEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} as const;

const missingEnv = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  const msg =
    `[firebase config] Faltan variables de entorno requeridas: ${missingEnv.join(', ')}.` +
    ` Define estas claves EXPO_PUBLIC_* en mobile/.env (ver .env.example).`;
  console.error(msg);
  throw new Error(msg);
}

const firebaseConfig = {
  apiKey: firebaseEnv.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: firebaseEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: firebaseEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: firebaseEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: firebaseEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: firebaseEnv.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh can evaluate this module after Auth was already initialized.
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
