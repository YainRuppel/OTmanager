# schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Material
class MaterialBase(BaseModel):
    sap: str
    breve_descripcion: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    tipo: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    breve_descripcion: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    tipo: Optional[str] = None

class MaterialOut(MaterialBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

# Tecnico
class TecnicoBase(BaseModel):
    nombre: str

class TecnicoCreate(TecnicoBase):
    pass

class TecnicoOut(TecnicoBase):
    id: int
    class Config:
        orm_mode = True

# OT
# OT
class OTBase(BaseModel):
    id_ot: str
    sap_id: str
    id_tecnico: Optional[int] = None
    cantidad: int = 1
    inicio: Optional[datetime] = None
    fin: Optional[datetime] = None
    pendiente: bool = False
    procesoIntermedio: bool = False
    observaciones: Optional[str] = None  # ✔️ NUEVO CAMPO

class OTCreate(OTBase):
    pass

class OTUpdate(BaseModel):
    cantidad: Optional[int] = None
    fin: Optional[datetime] = None
    pendiente: Optional[bool] = None
    procesoIntermedio: Optional[bool] = None
    id_tecnico: Optional[int] = None
    observaciones: Optional[str] = None   # ✔️ NUEVO CAMPO

class OTOut(OTBase):
    id: int
    class Config:
        orm_mode = True

