from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Receita(Base):
    __tablename__ = "receitas"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String, nullable=False)
    descricao   = Column(String, nullable=True)
    custo_total = Column(Float, default=0.0)
    peso_total  = Column(Float, default=0.0)
    criado_em   = Column(DateTime(timezone=True), server_default=func.now())

    itens = relationship("ItemReceita", back_populates="receita", cascade="all, delete", lazy="selectin")

class ItemReceita(Base):
    __tablename__ = "itens_receita"

    id              = Column(Integer, primary_key=True, index=True)
    receita_id      = Column(Integer, ForeignKey("receitas.id"))
    materia_id      = Column(Integer, ForeignKey("materias_primas.id"))
    quantidade      = Column(Float, nullable=False)   # gramas usadas
    preco_unitario  = Column(Float, nullable=False)   # preco/g no momento

    receita = relationship("Receita", back_populates="itens")
    materia = relationship("MateriaPrima", lazy="select")  # para acessar .nome
