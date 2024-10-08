import { Metadata } from "next"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Finanças do Casal",
  description: "Gerenciamento financeiro para casais",
}

export default function Home() {
  return (
    <>
      <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
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
            Finanças do Casal2
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Gerencie suas finanças juntos e alcance seus objetivos financeiros como casal."
              </p>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Bem-vindos ao Finanças do Casal
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas finanças juntos e alcance seus objetivos
              </p>
            </div>
            <div className="grid gap-2">
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }))}>
                Acessar Dashboard
              </Link>
              <Link href="/upload" className={cn(buttonVariants({ variant: "outline" }))}>
                Carregar Extrato Bancário
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}