"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./authContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Log auth state changes
    console.log("Auth state:", { user, loading, error });
    
    if (user) {
      console.log("User authenticated, redirecting to home");
      router.push("/");
    }
  }, [user, loading, error, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting login with email:", email);
    
    try {
      await login(email, password);
      console.log("Login successful");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Log component render
  console.log("Login component rendering", { loading, error });

  return (
    <div className="w-full max-w-md space-y-4 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-gray-600">Entre para acessar sua conta</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && (
          <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
