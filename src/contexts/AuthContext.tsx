import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAbzMQk1DFKSevHv-LHAm6GumQzCDIbVRY",
  authDomain: "food-waste-reduction-platform.firebaseapp.com",
  projectId: "food-waste-reduction-platform",
  storageBucket: "food-waste-reduction-platform.firebasestorage.app",
  messagingSenderId: "95055110272",
  appId: "1:95055110272:web:5b6afd9047dc6f1f318665",
  measurementId: "G-6WE0DPBM0R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DonationFormData {
  foodType: string;
  quantity: number;
  description: string;
  pickupTime: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  donationFormData: DonationFormData | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  saveDonationFormData: (data: DonationFormData) => void;
  clearDonationFormData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [donationFormData, setDonationFormData] = useState<DonationFormData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          role: 'user' // Default role
        });
        const token = await firebaseUser.getIdToken();
        setToken(token);
      } else {
        setUser(null);
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const saveDonationFormData = (data: DonationFormData) => {
    setDonationFormData(data);
    localStorage.setItem('donationFormData', JSON.stringify(data));
  };

  const clearDonationFormData = () => {
    setDonationFormData(null);
    localStorage.removeItem('donationFormData');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        donationFormData,
        login,
        loginWithGoogle,
        logout,
        register,
        saveDonationFormData,
        clearDonationFormData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 