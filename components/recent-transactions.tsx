"use client"

import { Avatar } from "components/ui/avatar"

interface Transaction {
  data: {
    toDate: () => Date;
  };
  descricao: string;
  valor: number;
  categoria?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-8">
      {transactions.map((transaction, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <div className="font-semibold">
              {transaction.categoria?.[0] || transaction.descricao[0]}
            </div>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.descricao}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(transaction.data.toDate())}
            </p>
          </div>
          <div className="ml-auto font-medium">
            R$ {transaction.valor.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}
