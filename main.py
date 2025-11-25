# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models, schemas
from database import engine, get_db, Base

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Materials ABM - FastAPI (tutorial)")

# montar archivos estáticos y plantillas
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ------ RUTAS UI (HTML) ------

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@app.get("/ui/tecnicos", response_class=HTMLResponse)
def ui_tecnicos(request: Request):
    # la página pedirá los datos vía fetch a /tecnicos/
    return templates.TemplateResponse("tecnicos.html", {"request": request})

@app.get("/ui/assign-ot", response_class=HTMLResponse)
def ui_assign_ot(request: Request):
    # la página pedirá materiales y técnicos con fetch
    return templates.TemplateResponse("assign_ot.html", {"request": request})

# (Opcional) redirect para /docs, si quieres
@app.get("/docs-ui")
def redirect_docs():
    return RedirectResponse("/docs")

# ------ API Endpoints existentes (resumo/uso) ------
# Incluye los endpoints de materials, tecnicos y ots que ya tenías.
# Pega aquí tus endpoints CRUD tal cual estaban; por ejemplo:

# Materials endpoints (ejemplo resumido; copia lo que ya tenías)
@app.post("/materials/", response_model=schemas.MaterialOut, status_code=status.HTTP_201_CREATED)
def create_material(material_in: schemas.MaterialCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Material).filter(models.Material.sap == material_in.sap).first()
    if existing:
        raise HTTPException(status_code=400, detail="Material con ese SAP ya existe")
    m = models.Material(**material_in.dict())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@app.get("/materials/", response_model=List[schemas.MaterialOut])
def list_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Material).offset(skip).limit(limit).all()

@app.get("/materials/{material_id}", response_model=schemas.MaterialOut)
def get_material(material_id: int, db: Session = Depends(get_db)):
    m = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return m

# Tecnicos endpoints (asegurate de tenerlos tal como en tu código)
@app.post("/tecnicos/", response_model=schemas.TecnicoOut, status_code=status.HTTP_201_CREATED)
def create_tecnico(tecnico_in: schemas.TecnicoCreate, db: Session = Depends(get_db)):
    exist = db.query(models.Tecnico).filter(models.Tecnico.nombre == tecnico_in.nombre).first()
    if exist:
        raise HTTPException(status_code=400, detail="Técnico ya existe")
    t = models.Tecnico(nombre=tecnico_in.nombre)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@app.get("/tecnicos/", response_model=List[schemas.TecnicoOut])
def list_tecnicos(db: Session = Depends(get_db)):
    return db.query(models.Tecnico).all()

@app.get("/tecnicos/{tecnico_id}", response_model=schemas.TecnicoOut)
def get_tecnico(tecnico_id: int, db: Session = Depends(get_db)):
    t = db.query(models.Tecnico).filter(models.Tecnico.id == tecnico_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    return t

@app.put("/tecnicos/{tecnico_id}", response_model=schemas.TecnicoOut)
def update_tecnico(tecnico_id: int, tecnico_in: schemas.TecnicoCreate, db: Session = Depends(get_db)):
    t = db.query(models.Tecnico).filter(models.Tecnico.id == tecnico_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    t.nombre = tecnico_in.nombre
    db.commit()
    db.refresh(t)
    return t

@app.delete("/tecnicos/{tecnico_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tecnico(tecnico_id: int, db: Session = Depends(get_db)):
    t = db.query(models.Tecnico).filter(models.Tecnico.id == tecnico_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    db.delete(t)
    db.commit()
    return

# OT endpoints (simplificado)
@app.post("/ots/", response_model=schemas.OTOut, status_code=status.HTTP_201_CREATED)
def create_ot(ot_in: schemas.OTCreate, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.sap == ot_in.sap_id).first()
    if not material:
        raise HTTPException(status_code=400, detail="Material (sap_id) no existe")
    if ot_in.id_tecnico:
        tech = db.query(models.Tecnico).filter(models.Tecnico.id == ot_in.id_tecnico).first()
        if not tech:
            raise HTTPException(status_code=400, detail="Tecnico indicado no existe")
    if db.query(models.OT).filter(models.OT.id_ot == ot_in.id_ot).first():
        raise HTTPException(status_code=400, detail="OT con ese id_ot ya existe")
    data = ot_in.dict()
    if not data.get("inicio"):
        data["inicio"] = datetime.utcnow()
    ot = models.OT(**data)
    db.add(ot)
    db.commit()
    db.refresh(ot)
    return ot

@app.get("/ots/", response_model=List[schemas.OTOut])
def list_ots(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.OT).offset(skip).limit(limit).all()

# health
@app.get("/health")
def health():
    return {"status": "ok"}
