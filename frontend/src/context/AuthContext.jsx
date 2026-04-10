import { createContext, useContext, useState } from 'react';
import apiClient, { setToken, removeToken, TOKEN_KEY } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Check URL for OAuth token before first render
    const [accessToken, setAccessToken] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const oauthToken = params.get('token');
        if (oauthToken) {
            setToken(oauthToken);
            window.history.replaceState({}, '', window.location.pathname);
            return oauthToken;
        }
        return localStorage.getItem(TOKEN_KEY);
    });

    const isAuthenticated = Boolean(accessToken);

    const persistToken = (token) => {
        setToken(token);
        setAccessToken(token);
    };

    const login = async (email, password) => {
        const data = await apiClient('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        persistToken(data.accessToken);
        return data;
    };

    const register = async (email, password) => {
        const data = await apiClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        persistToken(data.accessToken);
        return data;
    };

    const loginWithToken = (token) => {
        persistToken(token);
    };

    const logout = async () => {
        try {
            // Tell the server to clear the httpOnly refresh token cookie
            await apiClient('/auth/logout', { method: 'POST' });
        } catch {
            // Ignore errors — we still clear locally
        } finally {
            removeToken();
            setAccessToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, loginWithToken, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
