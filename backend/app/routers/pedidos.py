from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database.database import get_db
from app.models.pedido import Pedido, StatusPedido
from app.models.receita import Receita, ItemReceita
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────
class PedidoCreate(BaseModel):
    receita_id: int
    observacao: Optional[str] = None

class PedidoUpdate(BaseModel):
    status: str

class ItemReceitaOut(BaseModel):
    id:             int
    materia_id:     int
    nome_materia:   str = "—"
    quantidade:     float
    preco_unitario: float
    model_config = {"from_attributes": True}

class ReceitaEmbed(BaseModel):
    id:          int
    nome:        str
    custo_total: float
    peso_total:  float
    criado_em:   datetime
    itens:       List[ItemReceitaOut] = []
    model_config = {"from_attributes": True}

class PedidoOut(BaseModel):
    id:            int
    receita_id:    int
    receita:       Optional[ReceitaEmbed] = None
    status:        str
    custo_total:   float
    observacao:    Optional[str] = None
    criado_em:     datetime
    atualizado_em: Optional[datetime] = None
    model_config = {"from_attributes": True}

# ── Helper: load pedido com todos os relacionamentos ──────────────
def _query_pedido(db: Session):
    return (
        db.query(Pedido)
        .options(
            selectinload(Pedido.receita)
            .selectinload(Receita.itens)
            .selectinload(ItemReceita.materia)
        )
    )

def _to_out(p: Pedido) -> PedidoOut:
    receita_out = None
    if p.receita:
        itens_out = [
            ItemReceitaOut(
                id=i.id,
                materia_id=i.materia_id,
                nome_materia=i.materia.nome if i.materia else f"#{i.materia_id}",
                quantidade=i.quantidade,
                preco_unitario=i.preco_unitario,
            )
            for i in p.receita.itens
        ]
        receita_out = ReceitaEmbed(
            id=p.receita.id,
            nome=p.receita.nome,
            custo_total=p.receita.custo_total,
            peso_total=p.receita.peso_total,
            criado_em=p.receita.criado_em,
            itens=itens_out,
        )

    return PedidoOut(
        id=p.id,
        receita_id=p.receita_id,
        receita=receita_out,
        status=p.status.value if hasattr(p.status, "value") else str(p.status),
        custo_total=p.custo_total,
        observacao=p.observacao,
        criado_em=p.criado_em,
        atualizado_em=p.atualizado_em,
    )

# ── Endpoints ──────────────────────────────────────────────────────
@router.get("/", response_model=List[PedidoOut])
def listar_pedidos(db: Session = Depends(get_db)):
    pedidos = _query_pedido(db).order_by(Pedido.id.desc()).all()
    return [_to_out(p) for p in pedidos]

@router.get("/{id}", response_model=PedidoOut)
def obter_pedido(id: int, db: Session = Depends(get_db)):
    p = _query_pedido(db).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return _to_out(p)

@router.post("/", response_model=PedidoOut, status_code=201)
def criar_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    receita = db.query(Receita).filter(Receita.id == payload.receita_id).first()
    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    pedido = Pedido(
        receita_id=payload.receita_id,
        observacao=payload.observacao,
        custo_total=receita.custo_total,
        status=StatusPedido.aguardando,
    )
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    p = _query_pedido(db).filter(Pedido.id == pedido.id).first()
    return _to_out(p)

@router.put("/{id}", response_model=PedidoOut)
def atualizar_pedido(id: int, payload: PedidoUpdate, db: Session = Depends(get_db)):
    p = db.query(Pedido).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    try:
        p.status = StatusPedido(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Status inválido: {payload.status}")

    db.commit()

    p = _query_pedido(db).filter(Pedido.id == id).first()
    return _to_out(p)

@router.delete("/{id}", status_code=204)
def deletar_pedido(id: int, db: Session = Depends(get_db)):
    p = db.query(Pedido).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    db.delete(p)
    db.commit()
