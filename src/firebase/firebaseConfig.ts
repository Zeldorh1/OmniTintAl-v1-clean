// src/firebase/firebaseConfig.ts
// FINAL · PRODUCTION · OMNITINTAI

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDIZEPhBVnpNMnNMYmPm23QHKHlyOfQxgw",
  authDomain: "omnitintal.firebaseapp.com",
  projectId: "omnitintaI",
  storageBucket: "omnitintal.firebasestorage.app",
  messagingSenderId: "775539236260",
  appId: "1:775539236260:web:7e4a472ff838dbe8fe531f",
  measurementId: "G-LPNWLNRTD"
};

// --- Initialize Firebase App ---
export const firebaseApp = initializeApp(firebaseConfig);

// --- Initialize Auth (React Native compatible persistence) ---
export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
