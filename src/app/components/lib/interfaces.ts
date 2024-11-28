import { Timestamp } from "firebase/firestore";
import categorias from './categorias.json'

// Tipos comuns
export type CategoriaKeys = keyof typeof categorias;

// Interfaces base
interface BaseEntity {
  id: string;
  accountId: string;
}

interface BaseTransaction extends BaseEntity {
  data: Timestamp;
  descricao: string;
  valor: number;
  mesReferencia: number;
  anoReferencia: number;
  categoria: string;
  subcategoria: string;
}

// Transações
export interface Transaction extends BaseTransaction {
  parcela: string | null;
  pais: string;
  origem: string;
  anotacao: string | null;
}

export interface SavedBankTransaction extends Omit<Transaction, 'pais' | 'parcela'> {
  tipoLancamento: string;
  numeroDocumento: string;
  origem: 'bank-statement';
}

export interface BankTransaction {
  Data: string;
  Lancamento: string;
  Detalhes: string;
  "N° documento": string;
  Valor: string;
  "Tipo Lancamento": string;
}

// Investimentos
export interface Investment extends BaseEntity {
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
}

// Categorias
export interface CategoryMapping {
  categoria: CategoriaKeys;
  subcategoria: string;
  count: number;
}

export interface Transacao {
  id: number;
  data: string;
  descricao: string;
  cidade?: string | null;
  parcela?: string | null;
  pais?: string | null;
  valor: number;
  categoria: CategoriaKeys | null;
  subcategoria: string | null;
  origem: string;
  anoReferencia?: number;
  mesReferencia?: number;
  mesFatura?: number;
  anoFatura?: number;
  accountId?: string;
  createdAt?: Timestamp;
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
