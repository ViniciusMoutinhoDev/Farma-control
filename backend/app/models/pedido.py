from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class StatusPedido(str, enum.Enum):
    aguardando  = "aguardando"
    em_preparo  = "em_preparo"
    concluido   = "concluido"
    cancelado   = "cancelado"

class Pedido(Base):
    __tablename__ = "pedidos"

    id            = Column(Integer, primary_key=True, index=True)
    receita_id    = Column(Integer, ForeignKey("receitas.id"))
    status        = Column(Enum(StatusPedido), default=StatusPedido.aguardando)
    custo_total   = Column(Float, default=0.0)
    observacao    = Column(String, nullable=True)
    criado_em     = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    receita = relationship("Receita", lazy="select")
