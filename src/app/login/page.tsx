"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Login from "../components/auth/Login";
import { useAuth } from "../components/auth/authContext";

function LoginPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLogoutError(null);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError(error instanceof Error ? error.message : "Erro ao fazer logout");
    }
  };

  if (user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 space-y-4">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Usuário Logado</h2>
          <p className="mb-2">Email: {user.email}</p>
          <p className="mb-4">UID: {user.uid}</p>
          
          {logoutError && (
            <p className="text-red-500 mb-4">{logoutError}</p>
          )}
          
          <div className="flex justify-center space-x-4">
            <Link 
              href="/" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Ir para Página Principal
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Login />
    </main>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
