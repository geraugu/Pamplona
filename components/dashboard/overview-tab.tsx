"use client"

import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card"
import { Overview } from "components/overview"
import { Transaction } from "lib/interfaces"
import { formatCurrency } from "lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "components/ui/table"

interface OverviewTabProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  selectedMonthName: string;
  filteredTransactions: Transaction[];
}

export function OverviewTab({ 
  transactions, 
  totalIncome, 
  totalExpenses, 
  selectedMonthName,
  filteredTransactions 
}: OverviewTabProps) {
  const currentYear = new Date().getFullYear();

  // Filter transactions for the current year
  const currentYearTransactions = transactions.filter(transaction => 
    transaction.anoReferencia === currentYear
  );

  // Calculate totals for the current year
  const totalIncomeFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.valor > 0 ? transaction.valor : 0), 0);
  const totalExpensesFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.valor < 0 && transaction.categoria !== "Reserva" ? Math.abs(transaction.valor) : 0), 0);
  
  // Calculate total invested amount
  const totalInvestedFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.categoria === "Reserva" && transaction.subcategoria === "Investimento" ? Math.abs(transaction.valor) : 0), 0);

  // Find the last available month and year
  const lastAvailableMonth = Math.max(...transactions.map(t => t.mesReferencia))
  const lastAvailableYear = Math.max(...transactions.map(t => t.anoReferencia))

  // Find installment transactions from the last available month
  const installmentTransactions = transactions.filter(transaction => {
    // Check if transaction is from the last available month and year
    const isLastMonth = transaction.mesReferencia === lastAvailableMonth && 
                        transaction.anoReferencia === lastAvailableYear

    // Check if transaction has parcela information and is not fully paid
    if (!isLastMonth || !transaction.parcela) return false;

    // Split parcela to check if it's not fully paid
    const [parcelaAtual, parcelas] = transaction.parcela.split('/')
    
    // Parse installment numbers
    const currentInstallment = parseInt(parcelaAtual)
    const totalInstallments = parseInt(parcelas)

    // Keep only transactions that are not fully paid
    return currentInstallment < totalInstallments
  });

  // Calculate total value of installment transactions
  const totalInstallmentValue = installmentTransactions.reduce((acc, transaction) => 
    acc + Math.abs(transaction.valor), 0);

  // Calculate total value of penultimate installment transactions
  const penultimateInstallmentTransactions = installmentTransactions.filter(transaction => {
    const [parcelaAtual, parcelas] = transaction.parcela.split('/')
    return parseInt(parcelaAtual) === parseInt(parcelas) - 1
  });

  const totalPenultimateInstallmentValue = penultimateInstallmentTransactions.reduce((acc, transaction) => 
    acc + Math.abs(transaction.valor), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpensesFiltered - totalIncomeFiltered)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas ({selectedMonthName})
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpensesFiltered)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas ({selectedMonthName})</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncomeFiltered)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestedFiltered)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview transactions={currentYearTransactions} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transações Parceladas</CardTitle>
          </CardHeader>
          <CardContent>
            {installmentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Parcelas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentTransactions.map((transaction, index) => {
                    // Check if this is the penultimate installment
                    const [parcelaAtual, parcelas] = transaction.parcela.split('/')
                    const isPenultimateParcela = 
                      parseInt(parcelaAtual) === parseInt(parcelas) - 1

                    return (
                      <TableRow 
                        key={index} 
                        className={isPenultimateParcela ? 'bg-green-100 hover:bg-green-200' : ''}
                      >
                        <TableCell>{transaction.descricao}</TableCell>
                        <TableCell>{formatCurrency(Math.abs(transaction.valor))}</TableCell>
                        <TableCell>{transaction.parcela}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  {penultimateInstallmentTransactions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={1} className="font-bold">Total Penúltimas Parcelas</TableCell>
                      <TableCell className="font-bold">{formatCurrency(totalPenultimateInstallmentValue)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={1} className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(totalInstallmentValue)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma transação parcelada encontrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
