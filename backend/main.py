from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.routers import materias, receitas, pedidos, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FarmaControl API",
    description="Sistema de controle de estoque para farmacia de manipulacao",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(materias.router, prefix="/api/materias", tags=["materias-primas"])
app.include_router(receitas.router, prefix="/api/receitas", tags=["receitas"])
app.include_router(pedidos.router,  prefix="/api/pedidos",  tags=["pedidos"])

@app.get("/")
def root():
    return {"message": "FarmaControl API rodando"}
