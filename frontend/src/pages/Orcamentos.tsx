import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Receita } from "../types";
import { useToast } from "../components/shared/Toast";
import Modal from "../components/shared/Modal";

export default function Orcamentos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<Receita | null>(null);
  const [deleteModal, setDeleteModal] = useState<Receita | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: receitas = [], isLoading, isError, refetch } = useQuery<Receita[]>({
    queryKey: ["receitas"],
    queryFn: async () => {
      const res = await api.get("/receitas/");
      return res.data;
    },
  });

  const { data: pedidos = [] } = useQuery<{ receita_id: number }[]>({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const res = await api.get("/pedidos/");
      return res.data;
    },
  });

  // IDs de receitas que já viraram pedido
  const pedidosReceitaIds = new Set(pedidos.map((p) => p.receita_id));

  const emAberto = receitas.filter((r) => !pedidosReceitaIds.has(r.id));
  const convertidos = receitas.filter((r) => pedidosReceitaIds.has(r.id));

  const confirmarPedido = useMutation({
    mutationFn: async (receita: Receita) => {
      // Criar pedido a partir da receita
      await api.post("/pedidos/", { receita_id: receita.id });
      // Descontar estoque para cada item
      for (const item of receita.itens) {
        const mpRes = await api.get(`/materias/${item.materia_id}`);
        const qtdAtual = mpRes.data.quantidade;
        await api.put(`/materias/${item.materia_id}`, {
          quantidade: Math.max(0, qtdAtual - item.quantidade),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receitas"] });
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      qc.invalidateQueries({ queryKey: ["materias"] });
      setConfirmModal(null);
      showToast("Pedido criado! Estoque atualizado.", "success");
      navigate("/pedidos");
    },
    onError: () => showToast("Erro ao criar pedido.", "error"),
  });

  const deletarOrcamento = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/receitas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receitas"] });
      setDeleteModal(null);
      showToast("Orçamento removido.", "success");
    },
    onError: () => showToast("Erro ao remover orçamento.", "error"),
  });

  const ReceitaRow = ({ receita, isConverted }: { receita: Receita; isConverted: boolean }) => {
    const isExpanded = expandedId === receita.id;
    return (
      <>
        <tr
          onClick={() => setExpandedId(isExpanded ? null : receita.id)}
          style={{
            borderBottom: "0.5px solid rgba(0,0,0,0.06)",
            background: isConverted ? "#f0faf5" : "#fff",
            opacity: isConverted ? 0.75 : 1,
            cursor: "pointer",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLTableRowElement).style.filter = "brightness(0.97)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLTableRowElement).style.filter = "none";
          }}
        >
          <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
            #{receita.id}
          </td>
          <td style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{receita.nome}</div>
            {receita.descricao && (
              <div style={{ fontSize: 11, color: "#6b7280" }}>{receita.descricao}</div>
            )}
          </td>
          <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>
            {receita.itens?.length ?? 0} ingredientes
          </td>
          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
            {receita.peso_total.toFixed(1)}g
          </td>
          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
            R$ {receita.custo_total.toFixed(2).replace(".", ",")}
          </td>
          <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>
            {new Date(receita.criado_em).toLocaleDateString("pt-BR")}
          </td>
          <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
            {isConverted ? (
              <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 500 }}>
                ✓ Pedido gerado
              </span>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setConfirmModal(receita)}
                  style={{
                    border: "0.5px solid #1D9E75",
                    color: "#1D9E75",
                    background: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ Aprovar → Pedido
                </button>
                <button
                  onClick={() => setDeleteModal(receita)}
                  style={{
                    border: "0.5px solid #e24b4a",
                    color: "#e24b4a",
                    background: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Remover
                </button>
              </div>
            )}
          </td>
        </tr>

        {/* Linha expansível: ingredientes */}
        {isExpanded && receita.itens && receita.itens.length > 0 && (
          <tr style={{ background: "#f9fafb", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <td colSpan={7} style={{ padding: "0 14px 14px 38px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: 8,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginTop: 12,
                }}
              >
                Ingredientes da receita
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {receita.itens.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      border: "0.5px solid rgba(0,0,0,0.10)",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: "#1a1a1a" }}>
                      {item.nome_materia}
                    </span>
                    <span style={{ color: "#6b7280", marginLeft: 8 }}>
                      {item.quantidade.toFixed(1)}g —{" "}
                      R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  const TableSection = ({
    label,
    count,
    color,
    rows,
    isConverted,
  }: {
    label: string;
    count: number;
    color: string;
    rows: Receita[];
    isConverted: boolean;
  }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.07em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>
          ({count} {count === 1 ? "item" : "itens"})
        </span>
      </div>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.10)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f5f7" }}>
              {["#", "Nome", "Ingredientes", "Peso", "Custo", "Data", "Ações"].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    fontWeight: 500,
                    padding: "10px 14px",
                    textAlign: "left",
                    letterSpacing: "0.03em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ReceitaRow key={r.id} receita={r} isConverted={isConverted} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", margin: 0, marginBottom: 4 }}>
            Orçamentos
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Orçamentos salvos aguardando aprovação do cliente
          </p>
        </div>
        <button
          onClick={() => navigate("/receita")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#1a3a5c",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Novo Orçamento
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, fontSize: 13, color: "#6b7280" }}>
          Carregando...
        </div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: 60, fontSize: 13, color: "#e24b4a" }}>
          Erro ao carregar orçamentos.{" "}
          <button
            onClick={() => refetch()}
            style={{
              background: "none",
              border: "none",
              color: "#378ADD",
              cursor: "pointer",
              fontSize: 13,
              textDecoration: "underline",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : receitas.length === 0 ? (
        /* Estado vazio */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: 16,
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
              Nenhum orçamento salvo
            </div>
            <div style={{ fontSize: 12, color: "#b8bcc4", marginBottom: 16 }}>
              Crie um novo orçamento na página de receita
            </div>
            <button
              onClick={() => navigate("/receita")}
              style={{
                background: "#1a3a5c",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Criar primeiro orçamento
            </button>
          </div>
        </div>
      ) : (
        <>
          {emAberto.length > 0 && (
            <TableSection
              label="Em aberto"
              count={emAberto.length}
              color="#378ADD"
              rows={emAberto}
              isConverted={false}
            />
          )}
          {convertidos.length > 0 && (
            <TableSection
              label="Convertidos em pedido"
              count={convertidos.length}
              color="#1D9E75"
              rows={convertidos}
              isConverted={true}
            />
          )}
        </>
      )}

      {/* Modal: Confirmar aprovação */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Aprovar orçamento"
        footer={
          <>
            <button
              onClick={() => setConfirmModal(null)}
              style={{
                border: "0.5px solid rgba(0,0,0,0.15)",
                background: "none",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                color: "#6b7280",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmModal && confirmarPedido.mutate(confirmModal)}
              disabled={confirmarPedido.isPending}
              style={{
                background: "#1D9E75",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: confirmarPedido.isPending ? 0.7 : 1,
              }}
            >
              {confirmarPedido.isPending ? "Criando pedido..." : "Sim, criar pedido"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "#1a1a1a", margin: 0 }}>
          Deseja aprovar o orçamento{" "}
          <strong>"{confirmModal?.nome}"</strong> e criar o pedido na fila de manipulação?
        </p>
        {confirmModal && (
          <div
            style={{
              marginTop: 14,
              background: "#f4f5f7",
              borderRadius: 8,
              padding: "10px 14px",
              display: "flex",
              gap: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Ingredientes</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                {confirmModal.itens?.length ?? 0}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Peso total</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                {confirmModal.peso_total.toFixed(1)}g
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Custo</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1D9E75" }}>
                R$ {confirmModal.custo_total.toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Remover orçamento"
        footer={
          <>
            <button
              onClick={() => setDeleteModal(null)}
              style={{
                border: "0.5px solid rgba(0,0,0,0.15)",
                background: "none",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                color: "#6b7280",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteModal && deletarOrcamento.mutate(deleteModal.id)}
              disabled={deletarOrcamento.isPending}
              style={{
                background: "#e24b4a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {deletarOrcamento.isPending ? "Removendo..." : "Sim, remover"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "#1a1a1a", margin: 0 }}>
          Tem certeza que deseja remover o orçamento{" "}
          <strong>"{deleteModal?.nome}"</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
