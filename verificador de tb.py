from database import engine
from sqlalchemy import inspect
insp = inspect(engine)
print(insp.get_table_names())
# Verifica las tablas existentes en la base de datos
