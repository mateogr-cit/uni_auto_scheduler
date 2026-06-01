"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "@/lib/constants";

export interface AuthUser {
    u_id: number;
    fname: string;
    lname: string;
    email: string;
    username: string;
    u_role: "student" | "professor" | "admin";
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("kronos_token");
        if (!stored) {
            setIsLoading(false);
            return;
        }
        fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error("Token invalid");
                return r.json();
            })
            .then((data) => {
                setToken(stored);
                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem("kronos_token");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("kronos_token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("kronos_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
