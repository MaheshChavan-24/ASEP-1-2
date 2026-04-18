import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "gen-lang-client-0239226939",
  "appId": "1:841663640908:web:4edb50424e8eac3ba6cbe9",
  "apiKey": "AIzaSyBu6cjdY30jkfeXedk5rQ4Hsi3QQUNBbv8",
  "authDomain": "gen-lang-client-0239226939.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-baba5d91-52b1-4200-a47d-43e15deb2667",
  "storageBucket": "gen-lang-client-0239226939.firebasestorage.app",
  "messagingSenderId": "841663640908",
  "measurementId": ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
