from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id = Column(Integer, primary_key=True, index=True)
    materia_id = Column(Integer, ForeignKey("materias_primas.id"), nullable=False)
    tipo = Column(String, nullable=False) # 'entrada', 'saida_pedido', 'ajuste_balanca'
    quantidade_anterior = Column(Float, nullable=False)
    quantidade_nova = Column(Float, nullable=False)
    diferenca = Column(Float, nullable=False)
    motivo = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    materia = relationship("MateriaPrima")
