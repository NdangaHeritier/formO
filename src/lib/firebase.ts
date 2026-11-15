// firebase.ts
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth as FirebaseAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const App = (
  hasFirebaseConfig
    ? getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig)
    : null
) as FirebaseApp;

const Auth = (App ? getAuth(App) : null) as FirebaseAuth;
const db = (App ? getFirestore(App) : null) as Firestore;

// Analytics only runs on the client when Firebase is configured
let analytics: Analytics | null = null;

if (typeof window !== "undefined" && App && firebaseConfig.measurementId) {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(App);
    }
  });
}

export { App, Auth, analytics, db };
