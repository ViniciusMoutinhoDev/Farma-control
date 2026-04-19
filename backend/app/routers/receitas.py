from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database.database import get_db
from app.models.receita import Receita, ItemReceita
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────
class ItemReceitaIn(BaseModel):
    materia_id:     int
    quantidade:     float
    preco_unitario: float

class ReceitaCreate(BaseModel):
    nome:      str
    descricao: Optional[str] = None
    itens:     List[ItemReceitaIn]

class ItemReceitaOut(BaseModel):
    id:             int
    materia_id:     int
    nome_materia:   str = "—"   # nome real da matéria-prima
    quantidade:     float
    preco_unitario: float
    model_config = {"from_attributes": True}

class ReceitaOut(BaseModel):
    id:          int
    nome:        str
    descricao:   Optional[str] = None
    custo_total: float
    peso_total:  float
    criado_em:   datetime
    itens:       List[ItemReceitaOut] = []
    model_config = {"from_attributes": True}

# ── Helpers ───────────────────────────────────────────────────────
def _load_receita(db: Session, receita_id: int) -> Receita:
    return (
        db.query(Receita)
        .options(selectinload(Receita.itens).selectinload(ItemReceita.materia))
        .filter(Receita.id == receita_id)
        .first()
    )

def _to_out(receita: Receita) -> ReceitaOut:
    itens_out = [
        ItemReceitaOut(
            id=i.id,
            materia_id=i.materia_id,
            nome_materia=i.materia.nome if i.materia else f"#{i.materia_id}",
            quantidade=i.quantidade,
            preco_unitario=i.preco_unitario,
        )
        for i in receita.itens
    ]
    return ReceitaOut(
        id=receita.id,
        nome=receita.nome,
        descricao=receita.descricao,
        custo_total=receita.custo_total,
        peso_total=receita.peso_total,
        criado_em=receita.criado_em,
        itens=itens_out,
    )

# ── Endpoints ─────────────────────────────────────────────────────
@router.get("/", response_model=List[ReceitaOut])
def listar_receitas(db: Session = Depends(get_db)):
    receitas = (
        db.query(Receita)
        .options(selectinload(Receita.itens).selectinload(ItemReceita.materia))
        .order_by(Receita.id.desc())
        .all()
    )
    return [_to_out(r) for r in receitas]

@router.get("/{id}", response_model=ReceitaOut)
def obter_receita(id: int, db: Session = Depends(get_db)):
    r = _load_receita(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return _to_out(r)

@router.post("/", response_model=ReceitaOut, status_code=201)
def criar_receita(payload: ReceitaCreate, db: Session = Depends(get_db)):
    custo_total = sum(i.quantidade * i.preco_unitario for i in payload.itens)
    peso_total  = sum(i.quantidade for i in payload.itens)

    receita = Receita(
        nome=payload.nome,
        descricao=payload.descricao,
        custo_total=custo_total,
        peso_total=peso_total,
    )
    db.add(receita)
    db.flush()  # gera receita.id sem commit

    for item in payload.itens:
        db.add(ItemReceita(
            receita_id=receita.id,
            materia_id=item.materia_id,
            quantidade=item.quantidade,
            preco_unitario=item.preco_unitario,
        ))

    db.commit()

    r = _load_receita(db, receita.id)
    return _to_out(r)

@router.delete("/{id}", status_code=204)
def deletar_receita(id: int, db: Session = Depends(get_db)):
    r = db.query(Receita).filter(Receita.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    db.delete(r)
    db.commit()
