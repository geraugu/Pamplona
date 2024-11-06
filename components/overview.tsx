"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Timestamp } from "firebase/firestore"

// Define Transaction interface
interface Transaction {
  id: string;
  data: Timestamp;
  mesReferencia: number;
  anoReferencia: number;
  valor: number;
  descricao: string;
  origem: string;
  categoria?: string | null;
  subcategoria?: string | null;
}

// Define monthNames
const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

interface OverviewProps {
  transactions: Transaction[];
}

export function Overview({ transactions }: OverviewProps) {
  const currentYear = new Date().getFullYear();

  // Generate data for all 12 months
  const monthlyData = monthNames.map((monthName: string, index: number) => {
    const month = index + 1; // months are 1-indexed
    
    // Find transactions for this specific month and year
    const monthTransactions = transactions.filter(
      t => t.mesReferencia === month && t.anoReferencia === currentYear
    );

    // Separate income and expenses
    const income = monthTransactions
      .filter(t => t.valor > 0)
      .reduce((sum, t) => sum + t.valor, 0);

    const expenses = monthTransactions
      .filter(t => t.valor < 0 && t.categoria !== "Reserva")
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);

    return {
      name: `${monthName}/${currentYear}`,
      income: income,
      expenses: -expenses, // Negative to show below x-axis
      month: monthName
    };
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `R$${Math.abs(value).toFixed(2)}`}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            `R$${Math.abs(Number(value)).toFixed(2)}`, 
            name === 'income' ? 'Receita' : 'Despesa'
          ]}
        />
        <Legend 
          formatter={(value) => value === 'income' ? 'Receita' : 'Despesa'}
        />
        <Bar 
          dataKey="income" 
          fill="#10b981" // Green for income
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="expenses" 
          fill="#ef4444" // Red for expenses
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
