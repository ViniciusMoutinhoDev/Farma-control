import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { MateriaPrima, PayloadAfericao } from "../types";
import { useToast } from "../components/shared/Toast";

export default function Afericao() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [busca, setBusca] = useState("");
  const [materiaSelecionada, setMateriaSelecionada] = useState<MateriaPrima | null>(null);
  const [pesoBalanca, setPesoBalanca] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  const { data: materias = [], isLoading } = useQuery<MateriaPrima[]>({
    queryKey: ["materias", busca],
    queryFn: async () => {
      const qs = busca ? `?busca=${encodeURIComponent(busca)}` : "";
      const res = await api.get(`/materias/${qs}`);
      return res.data;
    },
    enabled: busca.length > 2 || materiaSelecionada === null, 
  });

  const aferirEstoque = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: PayloadAfericao }) => {
      const res = await api.post(`/materias/${id}/aferir`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["materias"] });
      showToast(`Aferição salva! Estoque ajustado para ${data.quantidade}g`, "success");
      
      // Reseta a tela
      setMateriaSelecionada(null);
      setPesoBalanca("");
      setMotivo("");
      setBusca("");
    },
    onError: () => showToast("Erro ao registrar pesagem da balança.", "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaSelecionada) return;

    const peso = parseFloat(pesoBalanca);
    if (isNaN(peso) || peso < 0) {
      showToast("Insira um peso válido.", "error");
      return;
    }

    const diff = peso - materiaSelecionada.quantidade;
    
    // Se a divergência for negativa além de 5% exige motivo? Por enquanto vamos deixar livre
    // Mas é um "open question" do plano. 
    // Vamos exigir motivo se a perda for maior que 10g para exemplificar controle.
    if (diff < -10 && !motivo) {
       showToast("Uma divergência maior que 10g exige o preenchimento de um motivo.", "error");
       return;
    }

    aferirEstoque.mutate({
      id: materiaSelecionada.id,
      payload: {
        peso_balanca: peso,
        motivo: motivo || undefined,
      },
    });
  };

  const diferencaDisplay = () => {
    if (!materiaSelecionada || pesoBalanca === "") return null;
    const peso = parseFloat(pesoBalanca);
    if (isNaN(peso)) return null;

    const diferenca = peso - materiaSelecionada.quantidade;
    const isPerda = diferenca < 0;

    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 8,
          background: isPerda ? "#fff5f5" : diferenca > 0 ? "#f0faf5" : "#f4f5f7",
          border: `1px solid ${isPerda ? 'rgba(226, 75, 74, 0.2)' : diferenca > 0 ? 'rgba(29, 158, 117, 0.2)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <div style={{ fontSize: 13, color: isPerda ? "#e24b4a" : diferenca > 0 ? "#1D9E75" : "#6b7280", fontWeight: 500, marginBottom: 4 }}>
          {isPerda ? "⚠️ Divergência Encontrada: Perda" : diferenca > 0 ? "⚠️ Divergência Encontrada: Sobra" : "✅ Estoque Confere"}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: isPerda ? "#e24b4a" : diferenca > 0 ? "#1D9E75" : "#1a1a1a" }}>
          {diferenca > 0 ? "+" : ""}{diferenca.toFixed(1)}g
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: 8 }}>
          Aferição por Balança
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
          Confronte o estoque teórico do sistema com o registro físico pesado na balança. Efetue as validações para monitoramento de perdas.
        </p>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        
        {/* Lado esquerdo: Seleção e Resultado */}
        <div style={{ flex: 3 }}>
          {/* Busca de matéria */}
          {!materiaSelecionada && (
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                1. Selecione a Matéria-Prima
              </label>
              <input
                type="text"
                placeholder="Ex: Ibuprofeno..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />

              {/* Lista */}
              <div style={{ marginTop: 12, maxHeight: 300, overflowY: "auto" }}>
                {isLoading ? (
                  <div style={{ padding: 12, fontSize: 13, color: "#6b7280" }}>Buscando...</div>
                ) : materias.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setMateriaSelecionada(m)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f0fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{m.nome}</span>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{m.quantidade.toFixed(1)}g no sistema</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Após selecionar */}
          {materiaSelecionada && (
            <form
              onSubmit={handleSubmit}
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "24px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                 <div>
                   <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: 4 }}>{materiaSelecionada.nome}</h2>
                   <span style={{ fontSize: 13, color: "#6b7280" }}>Lote interno #{materiaSelecionada.id}</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => setMateriaSelecionada(null)}
                   style={{ fontSize: 12, color: "#378ADD", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif" }}
                 >
                   Mudar produto
                 </button>
              </div>

              <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                <div style={{ flex: 1, background: "#f4f5f7", borderRadius: 8, padding: 16, textAlign: "center" }}>
                   <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Estoque Teórico</div>
                   <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a1a" }}>{materiaSelecionada.quantidade.toFixed(1)}g</div>
                </div>
                
                <div style={{ flex: 1 }}>
                   <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#1a3a5c", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                     Peso na Balança (g)
                   </label>
                   <input
                     type="number"
                     step="0.01"
                     required
                     value={pesoBalanca}
                     onChange={(e) => setPesoBalanca(e.target.value)}
                     placeholder="0.0g"
                     style={{
                       width: "100%",
                       padding: "14px",
                       borderRadius: 8,
                       border: "2px solid #378ADD",
                       fontSize: 20,
                       fontWeight: 600,
                       color: "#1a1a1a",
                       fontFamily: "'DM Sans', sans-serif",
                       textAlign: "center",
                     }}
                   />
                </div>
              </div>

              {pesoBalanca !== "" && diferencaDisplay()}

              {pesoBalanca !== "" && parseFloat(pesoBalanca) - materiaSelecionada.quantidade !== 0 && (
                <div style={{ marginTop: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 8 }}>
                    Motivo da Divergência (opcional)
                  </label>
                  <textarea
                     value={motivo}
                     onChange={(e) => setMotivo(e.target.value)}
                     placeholder="Ex: Caiu pó na bancada, umidade, tara de frasco diferente..."
                     rows={2}
                     style={{
                       width: "100%",
                       padding: 12,
                       borderRadius: 6,
                       border: "1px solid rgba(0,0,0,0.15)",
                       fontSize: 13,
                       fontFamily: "'DM Sans', sans-serif",
                       resize: "vertical"
                     }}
                  />
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    Obrigatório para perdas maiores que 10g.
                  </div>
                </div>
              )}

              <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.06)", margin: "32px 0 24px" }} />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={aferirEstoque.isPending || pesoBalanca === ""}
                  style={{
                    background: pesoBalanca !== "" && !aferirEstoque.isPending ? "#1a3a5c" : "#e5e7eb",
                    color: pesoBalanca !== "" && !aferirEstoque.isPending ? "#fff" : "#9ca3af",
                    border: "none",
                    borderRadius: 6,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: pesoBalanca !== "" && !aferirEstoque.isPending ? "pointer" : "not-allowed",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {aferirEstoque.isPending ? "Salvando..." : "Salvar Aferição"}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Lado direito: Info / Hardware */}
        <div style={{ flex: 1.5 }}>
           <div style={{ background: "linear-gradient(145deg, #1a3a5c 0%, #2563a8 100%)", borderRadius: 12, padding: 24, color: "#fff", boxShadow: "0 4px 12px rgba(26, 58, 92, 0.2)"}}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
             </svg>
             <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0, marginBottom: 8 }}>Módulo de Conferência</h3>
             <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5, marginBottom: 16 }}>
               Este módulo rastreia o destino dos insumos garantindo o compliance e apurando desperdícios invisíveis na pesagem da bancada.
             </p>
             <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.2)" }}>
               <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Status Hardware</div>
               <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                 <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e24b4a" }} />
                 <span style={{ fontSize: 13, fontWeight: 500 }}>Balança desconectada</span>
               </div>
               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                 Input manual habilitado. Integrador COM em desenvolvimento.
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
