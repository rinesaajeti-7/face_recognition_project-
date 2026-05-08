# face_recognition_project-
# Face Recognition System - Sistemi i Njohjes së Fytyrave

Një sistem i avancuar për njohjen e fytyrave, kërkimin e personave të zhdukur ose në kërkim, me aftësi për analizimin e moshës dhe gjinisë, denoising të imazheve, dhe gjenerimin e alarmeve.

## 🚀 Features

### Backend
- **Njohja e fytyrave** duke përdorur `face_recognition` dhe `DeepFace`
- **Analiza e moshës dhe gjinisë** nga fotot
- **Denoising i imazheve** për përmirësimin e cilësisë
- **Kërkim inteligjent** me ngjashmëri
- **Sistem autentifikimi** JWT me role (admin/operator/user)
- **Galeri personash** me të dhëna të plota (ID, telefoni, vendbanimi, datëlindja)
- **Sistem alarmesh** për personat e kërkuar
- **API RESTful** me FastAPI
- **Google Maps integrim** automatik për vendbanimet

### Frontend
- **Galeria** e personave me të gjitha të dhënat
- **Kërkim** me foto ose kamera live
- **Google Maps link** për vendbanimin dhe lokacionin e fotos
- **Pulti admin** për menaxhimin e përdoruesve
- **Historia e kërkimeve**
- **Alarmet** për personat e kërkuar
- **Profili i përdoruesit**
- **Responsive design** me React

---

## 🛠️ Teknologjitë

| Backend | Frontend |
|---------|----------|
| Python 3.11 | React 18 |
| FastAPI | Vite |
| SQLAlchemy | React Router DOM |
| PostgreSQL / SQLite | Axios |
| face_recognition / dlib | CSS3 |
| DeepFace / TensorFlow | |
| OpenCV | |
| JWT për autentifikim | |
| Passlib për hashing | |

---

## 📋 Kërkesat Para Instalimit

### Harduer i rekomanduar:
- **RAM**: 8GB minimum (16GB rekomandohet)
- **CPU**: Intel i5/i7 ose AMD Ryzen 5/7
- **Storage**: 5GB hapësirë të lirë
- **Kamera** (për live search)

### Softuer i nevojshëm:
| Softuer | Version | Komanda verifikimi |
|---------|---------|-------------------|
| Python | 3.11.x | `python --version` |
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | latest | `git --version` |
| CMake | 3.x | `cmake --version` |

### Instalimi i softuerit para projektit:

#### Python 3.11:
```bash
# Windows: Shkarko nga https://www.python.org/downloads/release/python-3119/
# Mac:
brew install python@3.11
# Linux:
sudo apt install python3.11 python3.11-venv python3.11-dev

# Shkarko nga: https://nodejs.org/ (versioni 18 LTS)
# Ose me Homebrew (Mac):
brew install node@18

# Mac:
brew install cmake
# Linux:
sudo apt install cmake
# Windows: Shkarko nga https://cmake.org/download/

cd Desktop
git clone https://github.com/rinesaajeti-7/face_recognition_project-.git
cd face_recognition_project-

cd backend
python3.11 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows
pip install --upgrade pip

# Pakot bazë
pip install fastapi uvicorn[standard] sqlalchemy python-jose[cryptography]
pip install passlib[bcrypt] python-multipart python-dotenv email-validator bcrypt psycopg2-binary

# NumPy 1.x (important - jo 2.x)
pip install "numpy<2.0"

# OpenCV
pip install opencv-python==4.9.0.80 opencv-python-headless==4.9.0.80

# Pakot shkencore
pip install pillow pandas scikit-learn scikit-image matplotlib seaborn

# TensorFlow
pip install tensorflow==2.15.0

# PyTorch (CPU version)
pip install torch==2.2.2 torchvision==0.17.2 torchaudio==2.2.2 --index-url https://download.pytorch.org/whl/cpu

# Face recognition
pip install dlib face_recognition insightface==0.7.3 facenet-pytorch==2.6.0 ultralytics deepface==0.0.95

nano .env

DATABASE_URL=sqlite:///./face_recognition.db
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

python -c "from app.db.database import engine, Base; from app.models import user, gallery, alert, search; Base.metadata.create_all(engine)"

python -c "
from app.db.database import SessionLocal
from app.models.user import User
from app.routers.auth import get_password_hash
db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@example.com').first()
if not admin:
    admin = User(email='admin@example.com', full_name='Administrator', 
                 hashed_password=get_password_hash('admin123'), role='admin', is_active=True)
    db.add(admin)
    db.commit()
    print('✅ Admin: admin@example.com / admin123')
"

mkdir -p models/dncnn
cd models/dncnn
curl -L -o dncnn_color_25.pth https://github.com/cszn/DnCNN/releases/download/v1.0/dncnn_color_25.pth
curl -L -o dncnn_gray_25.pth https://github.com/cszn/DnCNN/releases/download/v1.0/dncnn_gray_25.pth
cd ../..

cd ../frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

cd backend
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd frontend
npm run dev

Backend API: http://localhost:8000
Swagger Docs: http://localhost:8000/docs
Frontend: http://localhost:5173

# TESTO
curl http://localhost:8000/docs
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=admin123"

  cd backend
python ablation_study.py


# Zgjidhja e Problemeve
# Problem 1: ModuleNotFoundError: No module named 'jose'
pip install python-jose[cryptography]

# Problem 2: ValueError: password cannot be longer than 72 bytes
# Në backend/app/routers/auth.py, ndrysho:
def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')[:72]
    plain_truncated = plain_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_truncated, hashed)

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password_truncated)

# Problem 3: NumPy version conflict
pip uninstall numpy -y
pip install "numpy<2.0"

# Problem 4: dlib nuk instalohet në Mac
brew install cmake
pip install dlib-bin

# Problem 5: Port 8000 ose 5173 në përdorim
# Mac/Linux:
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID [PID] /F

# Problem 6: Frontend nuk lidhet me backend
# Verifiko që backend po punon
curl http://localhost:8000/docs

# Ndrysho URL-në në frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Problem 7: bcrypt version error
pip uninstall bcrypt passlib -y
pip install bcrypt==4.0.1 passlib==1.7.4

# Problem 8: TensorFlow në Mac M1/M2
pip uninstall tensorflow -y
pip install tensorflow-macos
