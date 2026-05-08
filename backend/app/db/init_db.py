from app.db.database import engine, Base
from app.models.user import User
from app.models.gallery import Gallery
from app.models.search import Search
from app.models.alert import Alert
from app.models.log import Log

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully (or already exist)")

if __name__ == "__main__":
    init_db()