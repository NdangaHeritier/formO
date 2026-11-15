"use client";

import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { Auth } from './firebase';
const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(Auth));
    
    const signup = (email, password) => {
        if (!Auth) return Promise.reject(new Error('Firebase Auth is not configured.'));
        return createUserWithEmailAndPassword(Auth, email, password);
    }

    const signin = (email, password) => {
        if (!Auth) return Promise.reject(new Error('Firebase Auth is not configured.'));
        return signInWithEmailAndPassword(Auth, email, password);
    }
    const signout = () => {
        if (!Auth) return Promise.resolve();
        return signOut(Auth);
    }

    const updateUser = (user, data) => {
        return updateProfile(user, data);
    }

    useEffect(() => {
        if (!Auth) return;
        const unsubscribe = onAuthStateChanged(Auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value ={
        currentUser,
        signup,
        signin,
        signout,
        updateUser,
        authLoading: loading,
    }
     return (
        <AuthContext.Provider value={ value }>
            { children }
        </AuthContext.Provider>
     );
}