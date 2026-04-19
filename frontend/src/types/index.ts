export type StatusAlerta = "ok" | "baixo" | "critico";
export type StatusPedido = "aguardando" | "em_preparo" | "concluido" | "cancelado";

export interface MateriaPrima {
  id: number;
  nome: string;
  quantidade: number;
  estoque_minimo: number;
  preco_compra: number;
  unidade: string;
  fornecedor: string | null;
  status_alerta: StatusAlerta;
}

export interface ItemCarrinho {
  materia: MateriaPrima;
  gramas: number;
}

export interface ItemReceita {
  id: number;
  materia_id: number;
  nome_materia: string;  // nome real retornado pelo backend
  quantidade: number;
  preco_unitario: number;
}

export interface Receita {
  id: number;
  nome: string;
  descricao: string | null;
  custo_total: number;
  peso_total: number;
  criado_em: string;
  itens: ItemReceita[];
}

export interface Pedido {
  id: number;
  receita_id: number;
  receita?: Receita;
  status: StatusPedido;
  custo_total: number;
  observacao: string | null;
  criado_em: string;
  atualizado_em: string | null;
}
