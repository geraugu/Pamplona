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
  origem: 'cartao_credito' | 'conta_bancaria';
  anoReferencia?: number;
  mesReferencia?: number;
}

export type CategoriaKeys = keyof typeof import('@/lib/categorias.json');

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
  [key: string]: any;
}
