import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Endpoints disponíveis:
// GET    /materias/           → lista todas (query: busca, alerta)
// POST   /materias/           → criar nova
// PUT    /materias/{id}       → atualizar (quantidade, preco, etc)
// DELETE /materias/{id}       → deletar
// GET    /receitas/           → listar receitas
// POST   /receitas/           → criar receita + itens
// GET    /pedidos/            → listar pedidos
// POST   /pedidos/            → criar pedido a partir de receita_id
// PUT    /pedidos/{id}        → atualizar status do pedido
