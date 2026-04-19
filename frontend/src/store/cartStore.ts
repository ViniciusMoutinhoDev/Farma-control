import { create } from "zustand";
import { MateriaPrima, ItemCarrinho } from "../types";

interface CartStore {
  items: ItemCarrinho[];
  nomeReceita: string;
  addItem: (materia: MateriaPrima) => void;
  removeItem: (materiaId: number) => void;
  updateGramas: (materiaId: number, gramas: number) => void;
  setNomeReceita: (nome: string) => void;
  clear: () => void;
  totalPeso: () => number;
  totalCusto: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  nomeReceita: "",
  addItem: (materia) => {
    const exists = get().items.find((i) => i.materia.id === materia.id);
    if (!exists) set((s) => ({ items: [...s.items, { materia, gramas: 1 }] }));
  },
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.materia.id !== id) })),
  updateGramas: (id, gramas) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.materia.id === id ? { ...i, gramas: Math.max(0.5, gramas) } : i
      ),
    })),
  setNomeReceita: (nome) => set({ nomeReceita: nome }),
  clear: () => set({ items: [], nomeReceita: "" }),
  totalPeso: () => get().items.reduce((s, i) => s + i.gramas, 0),
  totalCusto: () =>
    get().items.reduce((s, i) => s + i.gramas * i.materia.preco_compra, 0),
}));
