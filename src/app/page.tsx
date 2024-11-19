"use client";

import Link from "next/link"
import { useAuth } from "./components/auth/authContext"

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-secondary p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-neutral-800" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Finanças Familiar
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                Gerencie suas finanças juntos e alcance seus objetivos financeiros como casal.
              </p>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8 bg-neutral-100">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Bem-vindos ao Finanças Familiar
              </h1>
              <p className="text-sm text-neutral-700">
                Gerencie suas finanças juntos e alcance seus objetivos
              </p>
              {user ? (
                <>
                  <p className="text-sm text-neutral-600 mt-2">
                    Logado como: {user.email}
                  </p>
                  <div className="grid gap-4">
                    <Link 
                      href="/dashboard" 
                      className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors text-center font-semibold"
                    >
                      Acessar Dashboard
                    </Link>
                    <Link 
                      href="/uploadinfo" 
                      className="w-full px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-600 transition-colors text-center font-semibold"
                    >
                      Carregar Arquivos
                    </Link>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 mt-4">
                  <Link 
                    href="/login" 
                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors text-center font-semibold"
                  >
                    Fazer Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
