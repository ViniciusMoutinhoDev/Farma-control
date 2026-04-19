from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class MateriaPrima(Base):
    __tablename__ = "materias_primas"

    id              = Column(Integer, primary_key=True, index=True)
    nome            = Column(String, unique=True, index=True, nullable=False)
    quantidade      = Column(Float, default=0.0)   # em gramas
    estoque_minimo  = Column(Float, default=10.0)  # alerta abaixo deste valor
    preco_compra    = Column(Float, nullable=False) # R$ por grama
    unidade         = Column(String, default="g")
    fornecedor      = Column(String, nullable=True)
    criado_em       = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em   = Column(DateTime(timezone=True), onupdate=func.now())
