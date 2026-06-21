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

https://github.com/rinesaajeti-7/face_recognition_project-.git

# Në dosjen kryesore të projektit
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# ose për Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements_no_dlib.txt
Libraritë kryesore të backend-it (përmbajtja e requirements.txt)
Libraria	Versioni	Përshkrimi
fastapi	0.115.11+	Web framework për API
uvicorn	0.34.0+	Server ASGI
sqlalchemy	2.0.38+	ORM për databazë
psycopg2-binary	2.9.10+	Për PostgreSQL (ose sqlite për zhvillim)
python-multipart	0.0.20+	Për trajtimin e form-data
python-jose[cryptography]	3.3.0+	Për JWT (autentifikim)
passlib[bcrypt]	1.7.4+	Për hashing të fjalëkalimeve
python-dotenv	1.0.1+	Për variablat e mjedisit .env
opencv-python	4.10.0+	Për përpunim të imazheve
numpy	1.26.4+	Për llogaritje numerike
pillow	10.4.0+	Për manipulim imazhesh
scikit-learn	1.6.1+	Për algoritme ML (matching, etj.)
torch & torchvision	2.5.1+	Për modelet e deep learning (nëse përdorni)
face-recognition	1.3.0+	Libraria për njohjen e fytyrave (kërkon dlib)
dlib	19.24.6+	Varësi për face-recognition (mund të jetë e vështirë për t'u instaluar)
cohere	5.13.4+	Nëse përdorni chatbot me Cohere
websockets	14.1+	Për WebSocket (live search, etj.)
python-magic	0.4.27+	Për identifikimin e llojit të skedarit
qrcode	7.4.2+	Për gjenerimin e QR kodeve
reportlab	4.2.5+	Për gjenerim PDF (raporte)

node -v   # duhet >= 18.x
npm -v
cd frontend
npm install
# ose nëse përdorni yarn: yarn install
Libraritë kryesore të frontend-it (nga package.json)
Libraria	Versioni	Përshkrimi
react	19.0.0+	Framework-i kryesor
react-dom	19.0.0+	Renderim në DOM
react-router-dom	7.4.0+	Routing
axios	1.7.9+	Për thirrje HTTP te backend-i
socket.io-client	4.8.1+	Për WebSocket (njoftime live)
react-hot-toast	2.4.1+	Notifikime të bukura
react-icons	5.5.0+	Ikonat
tailwindcss	3.4.17+	CSS framework
@vitejs/plugin-react	4.3.4+	Për Vite (build tool)
eslint	9.21.0+	Linting i kodit


cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
cd frontend
npm run dev
