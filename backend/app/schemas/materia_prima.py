from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MateriaPrimaBase(BaseModel):
    nome:           str
    quantidade:     float = 0.0
    estoque_minimo: float = 10.0
    preco_compra:   float
    unidade:        str = "g"
    fornecedor:     Optional[str] = None

class MateriaPrimaCreate(MateriaPrimaBase):
    pass

class MateriaPrimaUpdate(BaseModel):
    nome:           Optional[str] = None
    quantidade:     Optional[float] = None
    estoque_minimo: Optional[float] = None
    preco_compra:   Optional[float] = None
    fornecedor:     Optional[str] = None

class MateriaPrimaOut(MateriaPrimaBase):
    id:            int
    criado_em:     datetime
    status_alerta: str = "ok"  # "ok" | "baixo" | "critico" — calculado no router

    model_config = {"from_attributes": True}
