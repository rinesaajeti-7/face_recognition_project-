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
  
cd backend
python3 -m venv venv
source venv/bin/activate       
node -v   
npm -v
cd frontend
npm install



cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
cd frontend
npm run dev
