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

from typing import Optional
from sqlalchemy import or_

@app.get("/materials/", response_model=List[schemas.MaterialOut])
def list_materials(skip: int = 0, limit: int = 100, sap: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Listar materiales. Filtros:
      - sap: buscar por código SAP (prefijo/contains)
      - q: búsqueda por texto en breve_descripcion o descripcion
    Ejemplo: /materials/?sap=40600&q=transmisor
    """
    qdb = db.query(models.Material)
    if sap:
        #  (búsqueda por prefijo -)
       qdb = qdb.filter(models.Material.sap.ilike(f"{sap}%"))
        
    if q:
        term = f"%{q}%"
        qdb = qdb.filter(or_(models.Material.breve_descripcion.ilike(term),
                             models.Material.descripcion.ilike(term)))
    return qdb.offset(skip).limit(limit).all()


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



# ---------- OT endpoints ----------
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone

@app.post("/ots/", response_model=schemas.OTOut, status_code=201)
def create_ot(ot_in: schemas.OTCreate, db: Session = Depends(get_db)):

    # validaciones previas
    material = db.query(models.Material).filter(models.Material.sap == ot_in.sap_id).first()
    if not material:
        raise HTTPException(status_code=400, detail="Material (sap_id) no existe")

    if ot_in.id_tecnico:
        tech = db.query(models.Tecnico).filter(models.Tecnico.id == ot_in.id_tecnico).first()
        if not tech:
            raise HTTPException(status_code=400, detail="Tecnico indicado no existe")

    # 1) Insert inicial — usamos un id_ot temporal (timestamp) para cumplir constraints si existen
    temp_id_ot = ot_in.id_ot or f"OT-{int(datetime.now().timestamp())}"

    ot = models.OT(
        id_ot=temp_id_ot,
        sap_id=ot_in.sap_id,
        id_tecnico=ot_in.id_tecnico,
        cantidad=ot_in.cantidad,
        observaciones=ot_in.observaciones,
        inicio=ot_in.inicio or datetime.now(timezone.utc),
        pendiente=True,  # aseguramos que pendiente sea True al crear   
        procesoIntermedio=ot_in.procesoIntermedio
    )

    db.add(ot)
    try:
        db.commit()
        db.refresh(ot)   # ahora ot.id contiene la PK real
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al insertar OT (constraint)")

    # 2) Generar id_ot definitivo basado en la PK autoincremental
    generated_id_ot = f"OT-{ot.id:04d}"

    # Si ya coincide con el temporal no hace falta actualizar
    if ot.id_ot != generated_id_ot:
        ot.id_ot = generated_id_ot
        try:
            db.commit()
            db.refresh(ot)
        except IntegrityError:
            # Si falla el update por unique (raro), hacemos rollback y dejamos el id temporal
            db.rollback()
            # opcional: loggear el problema en consola
            print("Warning: no se pudo actualizar id_ot a formato secuencial; se mantiene temporal.", generated_id_ot)

    return ot



from typing import List, Optional

@app.get("/ots/", response_model=List[schemas.OTOut])
def list_ots(skip: int = 0, limit: int = 100, proceso_intermedio: Optional[bool] = None, db: Session = Depends(get_db)):
    """
    Lista OTs. Opcionalmente filtra por procesoIntermedio (True/False).
    Ejemplo: /ots/?proceso_intermedio=true
    """
    q = db.query(models.OT)
    if proceso_intermedio is not None:
        q = q.filter(models.OT.procesoIntermedio == proceso_intermedio)
    return q.offset(skip).limit(limit).all()
