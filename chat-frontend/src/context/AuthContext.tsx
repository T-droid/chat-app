import React, { createContext, useState, useEffect } from "react";
import axios from 'axios';

export const AuthContext = createContext({});
export interface User {
    id: string;
    username: string;
    email: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios
                .get('http://localhost:3000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then(res => {
                    setUser(res.data.user)
                })
                .catch((err) => {
                    console.log(err);
                    localStorage.removeItem('token')
                });
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await axios.post('http://localhost:3000/api/auth/login', { email, password })
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    }

    const register = async (username: string, email: string, password: string) => {
        const res = await axios.post('http://localhost:3000/api/auth/register', { username, email, password })
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}