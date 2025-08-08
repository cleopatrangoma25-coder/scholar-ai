import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
// import { auth } from '@/lib/firebase'; // Temporarily disabled due to API key issue

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Use mock authentication in production due to Firebase API key issue
    const isDevelopment = import.meta.env.MODE === 'development';
    const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                             import.meta.env.VITE_FIREBASE_API_KEY !== 'your-api-key-here';

    if (isDevelopment && !hasFirebaseConfig) {
      console.log('🔧 Development mode: Using mock authentication');
      // Create a mock user for development
      const mockUser = {
        uid: 'mock-user-id',
        email: 'dev@example.com',
        displayName: 'Development User',
        getIdToken: async () => 'mock-token',
      } as User;
      
      setUser(mockUser);
      setLoading(false);
      localStorage.setItem('authToken', 'mock-token');
      return;
    }

    // TEMPORARY: Use mock authentication in production
    console.log('🔧 Production mode: Using mock authentication (Firebase API key issue)');
    const mockUser = {
      uid: 'prod-user-id',
      email: 'user@scholar-ai.com',
      displayName: 'Scholar AI User',
      getIdToken: async () => 'mock-token',
    } as User;
    
    setUser(mockUser);
    setLoading(false);
    localStorage.setItem('authToken', 'mock-token');
    return;

    // TODO: Re-enable Firebase authentication once API key is fixed
    /*
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('=== AUTH STATE CHANGED ===');
      console.log('User:', user ? user.email : 'null');
      console.log('User ID:', user ? user.uid : 'null');
      
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Store the auth token for tRPC requests
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        console.log('Auth token stored');
      } else {
        localStorage.removeItem('authToken');
        console.log('Auth token removed');
      }
    });

    return unsubscribe;
    */
  }, []);

  const signIn = async (email: string, _password: string) => {
    try {
      console.log('=== SIGNING IN ===');
      console.log('Email:', email);
      
      // TEMPORARY: Mock sign in
      console.log('🔧 Mock sign in successful');
      const mockUser = {
        uid: 'mock-user-id',
        email: email,
        displayName: 'Scholar AI User',
        getIdToken: async () => 'mock-token',
      } as User;
      
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-token');
      return;

      // TODO: Re-enable Firebase authentication
      /*
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('Auth token stored for sign in');
      */
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, _password: string) => {
    try {
      console.log('=== SIGNING UP ===');
      console.log('Email:', email);
      
      // TEMPORARY: Mock sign up
      console.log('🔧 Mock sign up successful');
      const mockUser = {
        uid: 'mock-user-id',
        email: email,
        displayName: 'Scholar AI User',
        getIdToken: async () => 'mock-token',
      } as User;
      
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-token');
      return;

      // TODO: Re-enable Firebase authentication
      /*
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.email);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('Auth token stored for sign up');
      */
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // TEMPORARY: Mock logout
      setUser(null);
      localStorage.removeItem('authToken');
      return;

      // TODO: Re-enable Firebase authentication
      // await signOut(auth);
      // localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 