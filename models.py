# models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    sap = Column(String, unique=True, nullable=False, index=True)
    breve_descripcion = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)
    marca = Column(String, nullable=True)
    tipo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relaciones
    ots = relationship("OT", back_populates="material")

class Tecnico(Base):
    __tablename__ = "tecnicos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, unique=True, index=True)

    ots = relationship("OT", back_populates="tecnico")

class OT(Base):
    __tablename__ = "ots"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)       # id interno autoincremental
    id_ot = Column(String, unique=True, nullable=True)      # ahora nullable para insert inicial
    sap_id = Column(String, ForeignKey("materials.sap"), nullable=False)
    id_tecnico = Column(Integer, ForeignKey("tecnicos.id"), nullable=True)
    cantidad = Column(Integer, default=1)
    inicio = Column(DateTime, default=datetime.utcnow)
    fin = Column(DateTime, nullable=True)
    pendiente = Column(Boolean, default=False)
    procesoIntermedio = Column(Boolean, default=False)
    observaciones = Column(String, nullable=True)


    # relaciones
    material = relationship("Material", back_populates="ots", foreign_keys=[sap_id])
    tecnico = relationship("Tecnico", back_populates="ots")
