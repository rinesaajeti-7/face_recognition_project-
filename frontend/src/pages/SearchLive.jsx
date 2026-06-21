// frontend/src/pages/SearchLive.jsx (VERSIONI I PËRDITËSUAR)
import { useRef, useState, useEffect } from 'react';
import { searchImage } from '../services/searchService';
import { useNavigate } from 'react-router-dom';

export default function LiveSearch() {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [results, setResults] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState(null);
  const [useDenoising, setUseDenoising] = useState(false);
  const [alertShown, setAlertShown] = useState({});
  const intervalRef = useRef(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setSnapshotResult(null);
    setResults([]);
    setAlertShown({});
  };

  // Kap kornizën aktuale nga kamera dhe kthen FormData
  const captureFrame = () => {
    return new Promise((resolve) => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      if (canvas.width === 0 || canvas.height === 0) {
        resolve(null);
        return;
      }
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        // Shto parametrin use_denoising nëse është aktiv
        if (useDenoising) {
          formData.append('use_denoising', 'true');
        }
        resolve(formData);
      }, 'image/jpeg');
    });
  };

  // Analizon FormData dhe kthen matches
  const analyzeFormData = async (formData) => {
    if (!formData) return [];
    try {
      const res = await searchImage(formData);
      return res.data.matches || [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  };

  // Analiza automatike (çdo 2 sekonda)
  const autoCaptureAndSearch = async () => {
    if (!isActive) return;
    const formData = await captureFrame();
    if (formData) {
      const matches = await analyzeFormData(formData);
      setResults(matches);
      
      // Kontrollo për ngjashmëri të lartë dhe shfaq alert
      const highMatch = matches.find(m => m.similarity > 0.65);
      if (highMatch && !alertShown[highMatch.person_id]) {
        setAlertShown(prev => ({ ...prev, [highMatch.person_id]: true }));
        
        // Shfaq njoftim
        if (Notification.permission === 'granted') {
          new Notification(`🚨 ALERT: ${highMatch.name} detected!`, {
            body: `Similarity: ${(highMatch.similarity * 100).toFixed(2)}%`,
            icon: '/vite.svg'
          });
        }
        
        console.log(`🔔 ALERT: ${highMatch.name} detected!`);
      }
    }
  };

  // Foto manuale + analizë
  const takeManualPhoto = async () => {
    if (!isActive) return;
    setIsAnalyzing(true);
    setSnapshotResult(null);
    const formData = await captureFrame();
    if (formData) {
      const matches = await analyzeFormData(formData);
      setSnapshotResult(matches);
    } else {
      setSnapshotResult([]);
    }
    setIsAnalyzing(false);
  };

  const startCamera = async () => {
    try {
      // Kërko leje për njoftime
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsActive(true);
      // Fillon analizën automatike
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(autoCaptureAndSearch, 3000); // Çdo 3 sekonda
    } catch (err) {
      console.error('Camera error:', err);
      alert('Nuk mund të aksesohet kamera. Ju lutem kontrolloni lejet.');
    }
  };

  const goToGallery = (personId) => {
    navigate('/gallery', { state: { highlightPersonId: personId } });
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="mb-4 flex gap-4 flex-wrap items-center">
        {!isActive ? (
          <button onClick={startCamera} className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700 transition">
            ▶️ Fillo kamerën live
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700 transition">
              ⏹️ Ndalo kamerën
            </button>
            <button
              onClick={takeManualPhoto}
              disabled={isAnalyzing}
              className="bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {isAnalyzing ? '🔄 Duke analizuar...' : '📸 Bëj foto dhe analizo'}
            </button>
            
            {/* Toggle për Denoising */}
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={useDenoising}
                onChange={(e) => setUseDenoising(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">🔧 Përmirëso cilësinë (Denoising)</span>
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full rounded-lg border border-gray-600 bg-black"
          />
          {isActive && isAnalyzing && (
            <p className="text-blue-400 mt-2 text-sm animate-pulse">🔄 Duke analizuar foton...</p>
          )}
          {isActive && useDenoising && (
            <p className="text-green-400 mt-2 text-sm">✅ Denoising aktiv - cilësia e fotove është e përmirësuar</p>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-3">🔄 Identifikime automatike</h3>
          {!isActive && <p className="text-gray-400">Kamera nuk është aktive.</p>}
          {isActive && results.length === 0 && (
            <p className="text-gray-400">Pritjet për fytyra...</p>
          )}
          {results.map((match, idx) => (
            <div 
              key={idx} 
              className="bg-gray-700 p-3 rounded mb-2 cursor-pointer hover:bg-gray-600 transition"
              onClick={() => goToGallery(match.person_id)}
            >
              <p className="text-white font-semibold">{match.name}</p>
              <p className="text-gray-300 text-sm">
                Ngjashmëria: {(match.similarity * 100).toFixed(2)}%
              </p>
              {match.similarity > 0.65 && (
                <p className="text-yellow-400 text-xs mt-1">⚠️ Ngjashmëri e lartë!</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rezultati i fotos manuale */}
      {snapshotResult !== null && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-white font-semibold mb-2">📸 Rezultati i fotos suaj:</h4>
          {snapshotResult.length === 0 ? (
            <p className="text-gray-300">Nuk u gjet asnjë fytyrë e njohur.</p>
          ) : (
            snapshotResult.map((match, idx) => (
              <div 
                key={idx} 
                className="bg-gray-800 p-2 rounded mt-1 cursor-pointer hover:bg-gray-700 transition"
                onClick={() => goToGallery(match.person_id)}
              >
                <p className="text-white">{match.name} - {(match.similarity * 100).toFixed(2)}%</p>
                {match.id_number && <p className="text-gray-400 text-xs">ID: {match.id_number}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
