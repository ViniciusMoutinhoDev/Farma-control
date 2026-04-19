from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.materia_prima import MateriaPrima
from app.schemas.materia_prima import MateriaPrimaCreate, MateriaPrimaUpdate, MateriaPrimaOut
from typing import List, Optional

router = APIRouter()

def calcular_status(m: MateriaPrima) -> str:
    if m.quantidade <= m.estoque_minimo * 0.3:
        return "critico"
    if m.quantidade <= m.estoque_minimo:
        return "baixo"
    return "ok"

def to_out(m: MateriaPrima) -> MateriaPrimaOut:
    """Converte model SQLAlchemy → schema Pydantic, calculando status_alerta."""
    return MateriaPrimaOut(
        id=m.id,
        nome=m.nome,
        quantidade=m.quantidade,
        estoque_minimo=m.estoque_minimo,
        preco_compra=m.preco_compra,
        unidade=m.unidade,
        fornecedor=m.fornecedor,
        criado_em=m.criado_em,
        status_alerta=calcular_status(m),
    )

@router.get("/", response_model=List[MateriaPrimaOut])
def listar_materias(
    busca:  Optional[str]  = Query(None),
    alerta: Optional[bool] = Query(None),
    db:     Session        = Depends(get_db),
):
    q = db.query(MateriaPrima)
    if busca:
        q = q.filter(MateriaPrima.nome.ilike(f"%{busca}%"))
    materias = q.all()
    result = []
    for m in materias:
        status = calcular_status(m)
        if alerta and status == "ok":
            continue
        result.append(to_out(m))
    return result

@router.get("/{id}", response_model=MateriaPrimaOut)
def obter_materia(id: int, db: Session = Depends(get_db)):
    m = db.query(MateriaPrima).filter(MateriaPrima.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return to_out(m)

@router.post("/", response_model=MateriaPrimaOut, status_code=201)
def criar_materia(payload: MateriaPrimaCreate, db: Session = Depends(get_db)):
    existe = db.query(MateriaPrima).filter(MateriaPrima.nome == payload.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Matéria-prima já cadastrada")
    m = MateriaPrima(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return to_out(m)

@router.put("/{id}", response_model=MateriaPrimaOut)
def atualizar_materia(id: int, payload: MateriaPrimaUpdate, db: Session = Depends(get_db)):
    m = db.query(MateriaPrima).filter(MateriaPrima.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return to_out(m)

@router.delete("/{id}", status_code=204)
def deletar_materia(id: int, db: Session = Depends(get_db)):
    m = db.query(MateriaPrima).filter(MateriaPrima.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Não encontrado")
    db.delete(m)
    db.commit()
