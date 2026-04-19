from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.materia_prima import MateriaPrima
from app.models.movimentacao import MovimentacaoEstoque
from app.schemas.materia_prima import MateriaPrimaCreate, MateriaPrimaUpdate, MateriaPrimaOut, MateriaPrimaAferir
from typing import List, Optional
import csv
import codecs

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

@router.post("/{id}/aferir", response_model=MateriaPrimaOut)
def aferir_materia(id: int, payload: MateriaPrimaAferir, db: Session = Depends(get_db)):
    m = db.query(MateriaPrima).filter(MateriaPrima.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Matéria-prima não encontrada")
    
    qtd_anterior = m.quantidade
    diferenca = payload.peso_balanca - qtd_anterior
    
    # Gravar histórico de movimentação
    mov = MovimentacaoEstoque(
        materia_id=id,
        tipo="ajuste_balanca",
        quantidade_anterior=qtd_anterior,
        quantidade_nova=payload.peso_balanca,
        diferenca=diferenca,
        motivo=payload.motivo
    )
    db.add(mov)
    
    # Atualizar estoque atual
    m.quantidade = payload.peso_balanca
    
    db.commit()
    db.refresh(m)
    return to_out(m)

@router.post("/importar-csv")
def importar_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser um CSV")

    try:
        csv_reader = csv.DictReader(codecs.iterdecode(file.file, 'utf-8-sig')) # utf-8-sig lida com BOM do excel
    except Exception as e:
        raise HTTPException(status_code=400, detail="Erro ao ler o arquivo. Certifique-se de que é um CSV válido UTF-8.")

    materias_existentes = db.query(MateriaPrima).all()
    # Mapeamento para busca O(1) ignorando cases e espaços
    map_existentes = {m.nome.strip().lower(): m for m in materias_existentes}

    inseridas = 0
    atualizadas = 0

    for row in csv_reader:
        # Pega as chaves ignorando case e espaços para flexibilidade
        row_keys = {k.strip().lower() if k else "": k for k in row.keys()}
        
        # Colunas esperadas
        key_nome = row_keys.get("nome", row_keys.get("nome da materia", "nome"))
        key_qtd = row_keys.get("quantidade", row_keys.get("qtd", "quantidade"))
        key_min = row_keys.get("estoque minimo", row_keys.get("estoque_minimo", "estoque minimo"))
        key_preco = row_keys.get("preco compra", row_keys.get("preco", row_keys.get("preco_compra", "preco compra")))
        key_forn = row_keys.get("fornecedor", "fornecedor")

        nome_raw = row.get(row.get(key_nome, "Nome"), "")
        if not nome_raw:
            continue
            
        nome = nome_raw.strip()
        nome_lower = nome.lower()
        
        try:
            quantidade = float(row.get(row.get(key_qtd, "Quantidade"), 0))
        except (ValueError, TypeError):
            quantidade = 0.0

        try:
            estoque_minimo = float(row.get(row.get(key_min, "Estoque Minimo"), 10.0))
        except (ValueError, TypeError):
            estoque_minimo = 10.0

        try:
            preco_str = row.get(row.get(key_preco, "Preco Compra"), "0").replace(",", ".")
            preco_compra = float(preco_str)
        except (ValueError, TypeError):
            preco_compra = 0.0
            
        fornecedor = row.get(row.get(key_forn, "Fornecedor"), "").strip() or None

        if nome_lower in map_existentes:
            m = map_existentes[nome_lower]
            m.quantidade = quantidade
            m.estoque_minimo = estoque_minimo
            m.preco_compra = preco_compra
            m.fornecedor = fornecedor
            atualizadas += 1
        else:
            nova = MateriaPrima(
                nome=nome,
                quantidade=quantidade,
                estoque_minimo=estoque_minimo,
                preco_compra=preco_compra,
                fornecedor=fornecedor,
                unidade="g"
            )
            db.add(nova)
            map_existentes[nome_lower] = nova
            inseridas += 1

    db.commit()
    
    return {
        "message": "Importação concluída",
        "inseridas": inseridas,
        "atualizadas": atualizadas
    }
