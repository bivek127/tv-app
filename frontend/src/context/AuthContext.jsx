import { createContext, useContext, useState } from 'react';
import apiClient from '../lib/apiClient';

const TOKEN_KEY = 'tv_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

    const isAuthenticated = Boolean(token);

    const persistToken = (newToken) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
    };

    const clearToken = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    };

    const login = async (email, password) => {
        const data = await apiClient('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        persistToken(data.token);
        return data;
    };

    const register = async (email, password) => {
        const data = await apiClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        persistToken(data.token);
        return data;
    };

    const logout = () => {
        clearToken();
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
