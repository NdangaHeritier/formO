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
    const [loading, setLoading] = useState(true);
    
    const signup = (email, password) => {
        return createUserWithEmailAndPassword(Auth, email, password);
    }

    const signin = (email, password) => {
        return signInWithEmailAndPassword(Auth, email, password);
    }
    const signout = () => {
        return signOut(Auth);
    }

    const updateUser = (user, data) => {
        return updateProfile(user, data);
    }

    useEffect(() => {
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