import { Investment, Transaction } from "./interfaces";
import { Timestamp } from "firebase/firestore";

// Constantes para categorias de transação
export const TRANSACTION_CATEGORIES = {
  INVESTMENT: {
    category: "Reserva",
    subcategory: "Investimento"
  },
  REDEMPTION: {
    category: "Receitas",
    subcategory: "Resgate investimentos"
  }
} as const;

// Funções auxiliares para cálculos de investimentos
export const calculateTotalInvestments = (investments: Investment[], field: keyof Investment): number => {
  return investments.reduce((total, inv) => {
    const value = inv[field];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
};

export const calculateInvestmentVariation = (currentValue: number, initialValue: number): {
  value: number;
  percentage: number;
} => {
  const value = currentValue - initialValue;
  const percentage = initialValue !== 0 ? (value / initialValue) * 100 : 0;
  return { value, percentage };
};

export const filterInvestmentsByDate = (investments: Investment[], date: string): Investment[] => {
  return investments.filter(inv => {
    const invDate = inv.dataReferencia.toDate();
    return invDate.toISOString().split('T')[0] === date;
  });
};

export const getFirstDateInvestments = (investments: Investment[]): Investment[] => {
  if (investments.length === 0) return [];
  
  // Ordena os investimentos por data e pega a primeira data
  const sortedInvestments = [...investments].sort((a, b) => 
    a.dataReferencia.toDate().getTime() - b.dataReferencia.toDate().getTime()
  );
  
  const firstDate = sortedInvestments[0].dataReferencia.toDate();
  
  // Retorna todos os investimentos da primeira data
  return investments.filter(inv => {
    const invDate = inv.dataReferencia.toDate();
    return invDate.getTime() === firstDate.getTime();
  });
};

export const calculateTransactionsTotal = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => total + Math.abs(transaction.valor), 0);
};

// Tipos para os dados de investimentos
export interface InvestmentSummary {
  totalFinMercado: number;
  totalFinCusto: number;
  totalRendimentos: number;
  totalLPRealizar: number;
  variation: {
    value: number;
    percentage: number;
  };
}

// Funções para formatar dados de investimentos
export const calculateInvestmentSummary = (investments: Investment[]): InvestmentSummary => {
  const totalFinMercado = calculateTotalInvestments(investments, "Fin. Mercado");
  const totalFinCusto = calculateTotalInvestments(investments, "Fin. Custo");
  const totalRendimentos = calculateTotalInvestments(investments, "Rendimentos");
  const totalLPRealizar = calculateTotalInvestments(investments, "L/P a Realizar");

  return {
    totalFinMercado,
    totalFinCusto,
    totalRendimentos,
    totalLPRealizar,
    variation: calculateInvestmentVariation(totalFinMercado, totalFinCusto)
  };
};
