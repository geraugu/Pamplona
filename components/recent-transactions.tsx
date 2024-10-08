"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>SU</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Supermercado</p>
          <p className="text-sm text-muted-foreground">
            Compras da semana
          </p>
        </div>
        <div className="ml-auto font-medium">-R$250,00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src="/avatars/02.png" alt="Avatar" />
          <AvatarFallback>SA</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Salário</p>
          <p className="text-sm text-muted-foreground">Depósito mensal</p>
        </div>
        <div className="ml-auto font-medium">+R$5.000,00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/03.png" alt="Avatar" />
          <AvatarFallback>RE</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Restaurante</p>
          <p className="text-sm text-muted-foreground">
            Jantar de aniversário
          </p>
        </div>
        <div className="ml-auto font-medium">-R$150,00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/04.png" alt="Avatar" />
          <AvatarFallback>IN</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Investimento</p>
          <p className="text-sm text-muted-foreground">
            Aplicação mensal
          </p>
        </div>
        <div className="ml-auto font-medium">-R$1.000,00</div>
      </div>
    </div>
  )
}