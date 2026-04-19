from app.database.database import SessionLocal, engine, Base
from app.models.materia_prima import MateriaPrima

Base.metadata.create_all(bind=engine)

SEED_DATA = [
    {"nome":"Ibuprofeno",              "quantidade":10.0,  "estoque_minimo":5.0,   "preco_compra":2.40},
    {"nome":"Paracetamol",             "quantidade":200.0, "estoque_minimo":50.0,  "preco_compra":0.80},
    {"nome":"Acido Ascorbico",         "quantidade":3.0,   "estoque_minimo":10.0,  "preco_compra":1.20},
    {"nome":"Cafeina Anidra",          "quantidade":80.0,  "estoque_minimo":20.0,  "preco_compra":3.50},
    {"nome":"Zinco Quelato",           "quantidade":1.5,   "estoque_minimo":15.0,  "preco_compra":4.80},
    {"nome":"Magnesio Bisglicinato",   "quantidade":45.0,  "estoque_minimo":30.0,  "preco_compra":2.90},
    {"nome":"Vitamina D3",             "quantidade":8.0,   "estoque_minimo":20.0,  "preco_compra":6.50},
    {"nome":"Vitamina B12",            "quantidade":0.8,   "estoque_minimo":5.0,   "preco_compra":12.00},
    {"nome":"Omega 3",                 "quantidade":120.0, "estoque_minimo":40.0,  "preco_compra":1.80},
    {"nome":"Curcuma",                 "quantidade":60.0,  "estoque_minimo":25.0,  "preco_compra":0.90},
    {"nome":"Resveratrol",             "quantidade":5.0,   "estoque_minimo":10.0,  "preco_compra":18.00},
    {"nome":"Colageno Hidrolisado",    "quantidade":300.0, "estoque_minimo":80.0,  "preco_compra":0.45},
    {"nome":"Biotina",                 "quantidade":2.0,   "estoque_minimo":8.0,   "preco_compra":22.00},
    {"nome":"Acido Folico",            "quantidade":15.0,  "estoque_minimo":10.0,  "preco_compra":5.20},
    {"nome":"Ferro Bisglicinato",      "quantidade":28.0,  "estoque_minimo":20.0,  "preco_compra":3.80},
    {"nome":"Coenzima Q10",            "quantidade":4.0,   "estoque_minimo":10.0,  "preco_compra":35.00},
    {"nome":"Melatonina",              "quantidade":6.0,   "estoque_minimo":15.0,  "preco_compra":8.90},
    {"nome":"L-Triptofano",            "quantidade":22.0,  "estoque_minimo":15.0,  "preco_compra":7.40},
    {"nome":"Piridoxina HCl B6",       "quantidade":90.0,  "estoque_minimo":20.0,  "preco_compra":1.60},
    {"nome":"Tiamina B1",              "quantidade":75.0,  "estoque_minimo":20.0,  "preco_compra":1.40},
    {"nome":"Riboflavina B2",          "quantidade":55.0,  "estoque_minimo":20.0,  "preco_compra":1.70},
    {"nome":"Niacinamida B3",          "quantidade":110.0, "estoque_minimo":30.0,  "preco_compra":1.30},
    {"nome":"Acido Pantotenico B5",    "quantidade":40.0,  "estoque_minimo":20.0,  "preco_compra":2.10},
    {"nome":"Cobre Bisglicinato",      "quantidade":9.0,   "estoque_minimo":10.0,  "preco_compra":6.80},
    {"nome":"Selenio Quelato",         "quantidade":3.5,   "estoque_minimo":8.0,   "preco_compra":14.00},
    {"nome":"Iodo KI",                 "quantidade":12.0,  "estoque_minimo":5.0,   "preco_compra":3.20},
    {"nome":"Cromo Quelato",           "quantidade":7.0,   "estoque_minimo":10.0,  "preco_compra":9.50},
    {"nome":"Manganes",                "quantidade":18.0,  "estoque_minimo":10.0,  "preco_compra":2.60},
    {"nome":"Silicio Organico",        "quantidade":25.0,  "estoque_minimo":15.0,  "preco_compra":5.00},
    {"nome":"Acido Hialuronico",       "quantidade":6.0,   "estoque_minimo":10.0,  "preco_compra":28.00},
    {"nome":"Glucosamina",             "quantidade":150.0, "estoque_minimo":50.0,  "preco_compra":1.10},
    {"nome":"Condroitina",             "quantidade":130.0, "estoque_minimo":50.0,  "preco_compra":1.30},
    {"nome":"Espirulina",              "quantidade":80.0,  "estoque_minimo":30.0,  "preco_compra":1.90},
    {"nome":"Chlorella",               "quantidade":70.0,  "estoque_minimo":30.0,  "preco_compra":2.20},
    {"nome":"Extrato de Alho",         "quantidade":40.0,  "estoque_minimo":20.0,  "preco_compra":0.70},
    {"nome":"Ginkgo Biloba",           "quantidade":20.0,  "estoque_minimo":15.0,  "preco_compra":4.50},
    {"nome":"Ginseng Panax",           "quantidade":15.0,  "estoque_minimo":12.0,  "preco_compra":8.00},
    {"nome":"Valeriana",               "quantidade":35.0,  "estoque_minimo":20.0,  "preco_compra":2.40},
    {"nome":"Passiflora",              "quantidade":28.0,  "estoque_minimo":20.0,  "preco_compra":1.80},
    {"nome":"Ashwagandha",             "quantidade":12.0,  "estoque_minimo":15.0,  "preco_compra":6.20},
    {"nome":"Maca Peruana",            "quantidade":65.0,  "estoque_minimo":25.0,  "preco_compra":2.80},
    {"nome":"Berberina",               "quantidade":8.0,   "estoque_minimo":12.0,  "preco_compra":16.00},
    {"nome":"EGCG Cha Verde",          "quantidade":18.0,  "estoque_minimo":10.0,  "preco_compra":11.00},
    {"nome":"L-Carnitina",             "quantidade":35.0,  "estoque_minimo":20.0,  "preco_compra":5.60},
    {"nome":"Glutamina",               "quantidade":200.0, "estoque_minimo":60.0,  "preco_compra":0.75},
    {"nome":"Creatina",                "quantidade":250.0, "estoque_minimo":80.0,  "preco_compra":0.65},
    {"nome":"BCAA",                    "quantidade":180.0, "estoque_minimo":60.0,  "preco_compra":0.90},
    {"nome":"Proteina de Soja",        "quantidade":400.0, "estoque_minimo":100.0, "preco_compra":0.40},
    {"nome":"Inulina",                 "quantidade":90.0,  "estoque_minimo":30.0,  "preco_compra":1.50},
    {"nome":"Lactobacillus acidophilus","quantidade":4.0,  "estoque_minimo":8.0,   "preco_compra":45.00},
]

db = SessionLocal()
count = 0
for d in SEED_DATA:
    existe = db.query(MateriaPrima).filter(MateriaPrima.nome == d["nome"]).first()
    if not existe:
        db.add(MateriaPrima(**d))
        count += 1
db.commit()
db.close()
print(f"Seed concluido: {count} materias-primas inseridas.")
