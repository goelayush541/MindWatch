import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('mindwatch_token'));
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch {
            localStorage.removeItem('mindwatch_token');
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('mindwatch_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('mindwatch_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('mindwatch_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
