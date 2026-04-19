# FarmaControl

Sistema de controle de estoque para farmacia de manipulacao.

## Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (migravel para PostgreSQL)
- **Frontend**: React + Vite + TypeScript + TanStack Query + Zustand

## Estrutura

`
farmacontrol/
  backend/
    main.py          <- entrada da API
    seed.py          <- popula 50 materias-primas de teste
    app/
      routers/       <- endpoints REST
      models/        <- tabelas SQLAlchemy
      schemas/       <- validacao Pydantic
      database/      <- conexao e sessao DB
  frontend/
    src/
      pages/         <- telas principais
      components/    <- componentes reutilizaveis
      services/      <- chamadas de API
      store/         <- estado global (Zustand)
`

## Rodando o projeto

### Backend
`ash
cd farmacontrol/backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python seed.py                 # popula dados de teste
uvicorn main:app --reload
`
API disponivel em: http://localhost:8000
Docs interativas: http://localhost:8000/docs

### Frontend
`ash
cd farmacontrol/frontend
npm install
npm run dev
`
App disponivel em: http://localhost:5173

## Proximos passos

- [ ] Autenticacao JWT
- [ ] Modulo de fornecedores
- [ ] Relatorios de consumo por periodo
- [ ] Alertas por WhatsApp/Email
- [ ] Integracao com balanca (pesagem via serial/USB)
- [ ] App desktop com Tauri ou Electron
