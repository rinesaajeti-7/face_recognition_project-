# migrate_to_postgres.py
import sqlite3
from sqlalchemy import create_engine, inspect, MetaData, Table
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.database import Base, engine as pg_engine
from app.models.user import User
# Importo modelet e tjera këtu (Gallery, Search, Alert, Log)

def migrate_data():
    # Lidhu me SQLite (ekzistuese)
    sqlite_conn = sqlite3.connect('database/app.db')
    sqlite_conn.row_factory = sqlite3.Row
    
    # Krijo tabelat në PostgreSQL (nëse nuk ekzistojnë)
    Base.metadata.create_all(bind=pg_engine)
    
    # Krijo sesion për PostgreSQL
    Session = sessionmaker(bind=pg_engine)
    pg_session = Session()
    
    # Migro të dhënat për çdo tabelë
    tables = ['users']  # Shto të gjitha tabelat e tua
    
    # Shembull për tabelën 'users'
    print("Migro të dhënat nga SQLite në PostgreSQL...")
    
    cursor = sqlite_conn.cursor()
    
    # Lexo të dhënat nga SQLite
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    
    # Fut të dhënat në PostgreSQL
    for row in rows:
        # Krijo një objekt User nga modeli SQLAlchemy
        user = User(
            id=row['id'],
            email=row['email'],
            hashed_password=row['hashed_password'],
            full_name=row['full_name'],
            role=row['role'],
            is_active=row['is_active'],
            created_at=row['created_at']
        )
        pg_session.add(user)
    
    pg_session.commit()
    print(f"Migruar {len(rows)} rreshta në tabelën 'users'")
    
    pg_session.close()
    sqlite_conn.close()
    
    print("Migrimi përfundoi me sukses!")

if __name__ == "__main__":
    migrate_data()