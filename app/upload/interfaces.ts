import { Timestamp } from 'firebase/firestore'
import categorias from 'lib/categorias.json'

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
  [key: string]: any;
}
