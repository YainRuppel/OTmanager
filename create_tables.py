# create_tables.py
from .database import engine, Base
from . import models

# Esto crea SOLO las tablas que no existan aún, sin tocar datos existentes.
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("create_all ejecutado: tablas creadas si antes no existían.")
