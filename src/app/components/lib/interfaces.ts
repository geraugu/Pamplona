import { Timestamp } from "firebase/firestore";
import categorias from './categorias.json'

export interface Transaction {
  id: string;
  data: Timestamp;
  descricao: string;
  valor: number;
  mesReferencia: number;
  anoReferencia:number;
  categoria: string;
  subcategoria: string;
  parcela: string | null;
  pais: string;
  origem: string;
  accountId: string;
}

export interface Investment {
  id: string;
  Mercado: string;
  Ativo: string;
  QTD: number;
  "PU Custo": number;
  "Fin. Custo": number;
  "PU Atual": number;
  "Fin. Mercado": number;
  Rendimentos: number;
  "Fin. Total": number;
  "% Var": number;
  "L/P a Realizar": number;
  "% Carteira": number;
  "% L/P": number;
  dataReferencia: Timestamp;
  accountId: string;
}

export interface BankTransaction {
  Data: string;
  Lancamento: string;
  Detalhes: string;
  "N° documento": string;
  Valor: string;
  "Tipo Lancamento": string;
}

export interface SavedBankTransaction extends Omit<Transaction, 'pais' | 'parcela'> {
  tipoLancamento: string;
  numeroDocumento: string;
  origem: 'bank-statement';
}

export type CategoriaKeys = keyof typeof categorias

export interface Transacao {
  id: number;
  data: string;
  descricao: string;
  cidade: string;
  parcela?: string | null;
  pais: string;
  valor: number;
  categoria: CategoriaKeys | null;
  subcategoria: string | null;
  origem: string;
  anoReferencia?: number;
  mesReferencia?: number;
  accountId?: string;
  createdAt?: Timestamp;
}

export interface CategoryMapping {
  [key: string]: {
    categoria: CategoriaKeys;
    subcategoria: string;
    count: number;
  };
}

export interface Investimento {
  Mercado: string;
  Ativo: string;
  QTD: number;
  "PU Custo": number;
  "Fin. Custo": number;
  "PU Atual": number;
  "Fin. Mercado": number;
  Rendimentos: number;
  "Fin. Total": number;
  "% Var": number;
  "L/P a Realizar": number;
  "% Carteira": number;
  "L/P": string;
  dataReferencia?: Date;
  accountId?: string;
  createdAt?: Timestamp;
}
