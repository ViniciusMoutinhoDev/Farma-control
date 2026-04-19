import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { MateriaPrima } from "../types";
import StockBar from "../components/shared/StockBar";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";
import { useToast } from "../components/shared/Toast";

interface FormData {
  nome: string;
  quantidade: string;
  estoque_minimo: string;
  preco_compra: string;
  unidade: string;
  fornecedor: string;
}

const emptyForm: FormData = {
  nome: "",
  quantidade: "",
  estoque_minimo: "",
  preco_compra: "",
  unidade: "g",
  fornecedor: "",
};

export default function Estoque() {
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<MateriaPrima | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<MateriaPrima | null>(null);

  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: materias = [], isLoading, isError, refetch } = useQuery<MateriaPrima[]>({
    queryKey: ["materias", busca],
    queryFn: async () => {
      const res = await api.get("/materias/", { params: busca ? { busca } : {} });
      return res.data;
    },
  });

  const filtered = materias.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function openNova() {
    setEditando(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditar(m: MateriaPrima) {
    setEditando(m);
    setForm({
      nome: m.nome,
      quantidade: String(m.quantidade),
      estoque_minimo: String(m.estoque_minimo),
      preco_compra: String(m.preco_compra),
      unidade: m.unidade,
      fornecedor: m.fornecedor ?? "",
    });
    setModalOpen(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        quantidade: parseFloat(form.quantidade),
        estoque_minimo: parseFloat(form.estoque_minimo),
        preco_compra: parseFloat(form.preco_compra),
        unidade: form.unidade,
        fornecedor: form.fornecedor || null,
      };
      if (editando) {
        await api.put(`/materias/${editando.id}`, payload);
      } else {
        await api.post("/materias/", payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materias"] });
      setModalOpen(false);
      showToast(
        editando ? "Matéria-prima atualizada!" : "Matéria-prima cadastrada!",
        "success"
      );
    },
    onError: () => showToast("Erro ao salvar.", "error"),
  });

  const deletar = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/materias/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materias"] });
      setConfirmDelete(null);
      showToast("Matéria-prima removida.", "success");
    },
    onError: () => showToast("Erro ao remover.", "error"),
  });

  const inputStyle = {
    width: "100%",
    border: "0.5px solid rgba(0,0,0,0.15)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#fff",
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: 11,
    fontWeight: 500 as const,
    color: "#6b7280",
    marginBottom: 5,
    letterSpacing: "0.03em",
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#1a1a1a",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Estoque de Matérias-Primas
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            {materias.length} item{materias.length !== 1 ? "s" : ""} cadastrado
            {materias.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openNova}
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
          Nova Matéria-Prima
        </button>
      </div>

      {/* Busca */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.15)",
          borderRadius: 8,
          padding: "8px 12px",
          marginBottom: 16,
          maxWidth: 360,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar matéria-prima..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 13,
            background: "transparent",
            color: "#1a1a1a",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* Tabela */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.10)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Carregando...
          </div>
        ) : isError ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontSize: 13,
              color: "#e24b4a",
            }}
          >
            Erro ao carregar estoque.{" "}
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
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f4f5f7" }}>
                {[
                  "Nome",
                  "Nível de estoque",
                  "Preço/g",
                  "Fornecedor",
                  "Status",
                  "Ações",
                ].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    {busca
                      ? "Nenhum resultado para a busca"
                      : "Nenhuma matéria-prima cadastrada"}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "#e8f0fb";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "transparent";
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#1a1a1a",
                        }}
                      >
                        {m.nome}
                      </div>
                      {m.fornecedor && (
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {m.fornecedor}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", minWidth: 200 }}>
                      <StockBar qty={m.quantidade} min={m.estoque_minimo} />
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        color: "#1a1a1a",
                      }}
                    >
                      R$ {m.preco_compra.toFixed(2).replace(".", ",")}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {m.fornecedor ?? "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={m.status_alerta} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openEditar(m)}
                          style={{
                            border: "0.5px solid #378ADD",
                            color: "#378ADD",
                            background: "none",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(m)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Adicionar / Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
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
              onClick={() => salvar.mutate()}
              disabled={salvar.isPending || !form.nome || !form.quantidade || !form.preco_compra}
              style={{
                background: "#1a3a5c",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: salvar.isPending ? 0.7 : 1,
              }}
            >
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Cafeína Anidra"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Quantidade (g) *</label>
              <input
                type="number"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                placeholder="0"
                style={inputStyle}
                min="0"
                step="0.1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Estoque mínimo (g) *</label>
              <input
                type="number"
                value={form.estoque_minimo}
                onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                placeholder="0"
                style={inputStyle}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Preço por g (R$) *</label>
              <input
                type="number"
                value={form.preco_compra}
                onChange={(e) => setForm({ ...form, preco_compra: e.target.value })}
                placeholder="0,00"
                style={inputStyle}
                min="0"
                step="0.01"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Unidade</label>
              <select
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="g">g (gramas)</option>
                <option value="ml">ml (mililitros)</option>
                <option value="un">un (unidade)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Fornecedor</label>
            <input
              value={form.fornecedor}
              onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              placeholder="Ex: Pharma Insumos Ltda"
              style={inputStyle}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover matéria-prima"
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
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
              onClick={() => confirmDelete && deletar.mutate(confirmDelete.id)}
              disabled={deletar.isPending}
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
              {deletar.isPending ? "Removendo..." : "Sim, remover"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "#1a1a1a", margin: 0 }}>
          Tem certeza que deseja remover{" "}
          <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
