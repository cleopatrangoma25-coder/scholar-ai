import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Check if we're in development mode and Firebase config is missing
const isDevelopment = import.meta.env.MODE === 'development';
const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                         import.meta.env.VITE_FIREBASE_API_KEY !== 'your-api-key-here';

let app: FirebaseApp;
let auth: Auth;

if (isDevelopment && !hasFirebaseConfig) {
  console.warn('⚠️ Firebase configuration missing for local development.');
  console.warn('📝 To fix this, update env.development with your Firebase credentials.');
  console.warn('🔧 For now, using mock authentication mode.');
  
  // Create a mock Firebase app for development
  const mockFirebaseConfig = {
    apiKey: 'mock-api-key',
    authDomain: 'mock-project.firebaseapp.com',
    projectId: 'mock-project-id',
    storageBucket: 'mock-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'mock-app-id',
  };
  
  app = initializeApp(mockFirebaseConfig);
  auth = getAuth(app);
} else {
  // Debug: Log environment variables (remove in production)
  console.log('=== FIREBASE DEBUG INFO ===');
  console.log('Environment Mode:', import.meta.env.MODE);
  console.log('VITE_ENV:', import.meta.env.VITE_ENV);
  console.log('API Key Length:', import.meta.env.VITE_FIREBASE_API_KEY?.length || 0);
  console.log('API Key (first 10 chars):', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...');
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  console.log('=== END FIREBASE DEBUG ===');

  // Use environment variables for Firebase configuration
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAG_gfnls_1p2VZUx1nRLahwOnXTOJkQH4",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scholar-ai-1-prod.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scholar-ai-1-prod",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scholar-ai-1-prod.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "717822405917",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:717822405917:web:5c5cf84b9a41737f5385f4",
  };

  console.log('=== FIREBASE CONFIG ===');
  console.log('Using API Key:', firebaseConfig.apiKey?.substring(0, 10) + '...');
  console.log('Using Project ID:', firebaseConfig.projectId);
  console.log('Using Auth Domain:', firebaseConfig.authDomain);
  console.log('=== END FIREBASE CONFIG ===');

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };
export default app; 