import { Timestamp } from "firebase/firestore";

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
