// App.jsx
import React, { useState, useRef, useEffect } from 'react';

// Data and Constants
import { PROJECT_INFO, diseaseData, regionData, texts, diseaseDatabase } from './constants';

// Services
import { translateObject } from './services/translationApi';

// Child Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import HomeTab from './components/HomeTab';
import DetectionTab from './components/DetectionTab';
import ChatbotTab from './components/ChatbotTab';
import AnalyticsTab from './components/AnalyticsTab';
import Footer from './components/Footer';
import FloatingAssistant from './components/FloatingAssistant';
import AuthPanel from './components/AuthPanel';
import { queryFreeChatbot } from './services/chatApi';
import {
  fetchMyAnalysisRecords,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  saveAnalysisRecord,
  setStoredToken,
} from './services/authAnalysisApi';

const AZURE_API_BASE_URL =
  import.meta.env.VITE_AZURE_API_BASE_URL ||
  'https://plant-analyzer-api.jollyocean-54e948a5.southeastasia.azurecontainerapps.io';

const USE_AZURE_PROXY = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== 'false';
const FRONTEND_API_BASE_URL = USE_AZURE_PROXY ? '/azure-api' : AZURE_API_BASE_URL;

const DETECTION_API_URL =
  import.meta.env.VITE_DETECTION_API_URL ||
  `${FRONTEND_API_BASE_URL}/predict`;

// CORS proxy services to try in order
const CORS_PROXIES = [
  (url) => url, // Try direct first
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const tryDetectionWithProxies = async (formData, url) => {
  let lastError = null;
  const shouldUseExternalProxies = /^https?:\/\//i.test(url);
  const strategies = shouldUseExternalProxies ? CORS_PROXIES : [CORS_PROXIES[0]];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const proxyURL = strategies[i](url);
      console.log(`🔄 Attempt ${i + 1}/${strategies.length}: ${proxyURL.substring(0, 50)}...`);
      
      const response = await Promise.race([
        fetch(proxyURL, {
          method: 'POST',
          body: formData,
          mode: 'cors'
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
      ]);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Success with proxy ${i + 1}!`);
      return result;
      
    } catch (error) {
      console.warn(`❌ Proxy ${i + 1} failed:`, error.message);
      lastError = error;
      
      // Don't retry if it's a network/CORS error on direct call
      if (i === 0 && error.message.includes('Failed to fetch') && shouldUseExternalProxies) {
        console.log('📌 Direct call blocked by CORS. Trying proxies...');
      }
    }
  }
  
  throw lastError || new Error('All proxy attempts failed');
};

const BACKEND_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  FRONTEND_API_BASE_URL;

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('english');
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [translatedTexts, setTranslatedTexts] = useState(texts['english']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'नमस्ते! मैं आपकी फसल की बीमारियों की पहचान में मदद कर सकता हूं। / Hello! I can help you identify crop diseases.', timestamp: new Date() }
  ]);

  // Log API URLs on startup
  useEffect(() => {
    console.log('🔗 Detection API URL:', DETECTION_API_URL);
    console.log('🔗 Backend API URL:', BACKEND_API_BASE_URL);
  }, []);
    const [chatInput, setChatInput] = useState('');
  const [chatLocation, setChatLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [cropName, setCropName] = useState('');
  const [backendConnectionStatus, setBackendConnectionStatus] = useState('unknown');
  const [accessToken, setAccessToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);

  const loadMyAnalysisHistory = async (token) => {
    if (!token) {
      setAnalysisHistory([]);
      return;
    }
    try {
      const data = await fetchMyAnalysisRecords(token);
      setAnalysisHistory(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error('Failed to load analysis history', error);
      setAnalysisHistory([]);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      let token = null;
      try {
        token = getStoredToken();
      } catch (error) {
        console.warn('Unable to read stored session token.', error);
      }

      if (!token) {
        return;
      }

      try {
        const me = await getCurrentUser(token);
        setAccessToken(token);
        setCurrentUser(me);
        await loadMyAnalysisHistory(token);
      } catch (error) {
        console.warn('Stored session is invalid, logging out.', error);
        setStoredToken(null);
        setAccessToken(null);
        setCurrentUser(null);
        setAnalysisHistory([]);
      }
    };

    bootstrapAuth();
  }, []);

  const handleLogin = async ({ email, password }) => {
    const data = await loginUser({ email, password });
    const token = data?.access_token;
    if (!token) {
      throw new Error('No access token returned by server.');
    }

    setStoredToken(token);
    setAccessToken(token);
    const me = await getCurrentUser(token);
    setCurrentUser(me);
    await loadMyAnalysisHistory(token);
  };

  const handleRegister = async ({ name, email, password }) => {
    const data = await registerUser({ name, email, password });
    const token = data?.access_token;
    if (!token) {
      throw new Error('No access token returned by server.');
    }

    setStoredToken(token);
    setAccessToken(token);
    setCurrentUser(data?.user || (await getCurrentUser(token)));
    await loadMyAnalysisHistory(token);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setAccessToken(null);
    setCurrentUser(null);
    setAnalysisHistory([]);
    setSelectedImage(null);
    setDetectionResult(null);
    setActiveTab('home');
  };

  const persistAnalysisForCurrentUser = async (resultPayload, imageName) => {
    if (!accessToken || !currentUser || !resultPayload) {
      return;
    }

    try {
      await saveAnalysisRecord(accessToken, {
        crop_name: resultPayload.cropName || null,
        disease: resultPayload.disease,
        confidence: resultPayload.confidence,
        severity: resultPayload.severity,
        recommendations: resultPayload.recommendations,
        result_source: resultPayload.resultSource || 'backend',
        is_disease_detected: Boolean(resultPayload.isDiseaseDetected),
        top_predictions: Array.isArray(resultPayload.topPredictions) ? resultPayload.topPredictions : [],
        image_name: imageName || null,
      });
      await loadMyAnalysisHistory(accessToken);
    } catch (error) {
      console.error('Failed to save analysis for user', error);
    }
  };

  const detectDisease = async (imageFile, cropNameInput = '') => {
    try {
      setBackendConnectionStatus('checking');
      const formData = new FormData();
      formData.append('file', imageFile);
      const normalizedCropName = cropNameInput.trim();
      if (normalizedCropName) {
        formData.append('cropName', normalizedCropName);
      }

      console.log('📤 Starting disease detection with multi-proxy strategy...');
      const result = await tryDetectionWithProxies(formData, DETECTION_API_URL);

      const analysis = Array.isArray(result?.analysis) ? result.analysis : [];
      const sortedAnalysis = [...analysis]
        .filter((item) => item && typeof item.label === 'string' && typeof item.score === 'number')
        .sort((a, b) => b.score - a.score);

      if (!sortedAnalysis.length) {
        throw new Error('Prediction response is empty.');
      }

      const topPrediction = sortedAnalysis[0];
      const confidence = Math.round((topPrediction.score || 0) * 100);
      const labelLower = topPrediction.label.toLowerCase();
      const noDiseaseKeywords = ['healthy', 'no disease', 'normal', 'safe'];
      const isDiseaseDetected = !noDiseaseKeywords.some((keyword) => labelLower.includes(keyword));

      const severity = isDiseaseDetected
        ? (confidence >= 85 ? 'High' : confidence >= 60 ? 'Medium' : 'Low')
        : 'None';

      const recommendations = isDiseaseDetected
        ? `Possible disease detected${normalizedCropName ? ` in ${normalizedCropName}` : ''}: ${topPrediction.label}. Start treatment early, isolate affected leaves, and monitor crop spread in the next 48 hours.`
        : `No obvious disease pattern detected${normalizedCropName ? ` for ${normalizedCropName}` : ''}. Continue regular crop care and monitor for any new symptoms.`;

      setBackendConnectionStatus('connected');
      const resolvedResult = {
        disease: topPrediction.label,
        confidence,
        severity,
        recommendations,
        isDiseaseDetected,
        cropName: normalizedCropName,
        resultSource: 'backend',
        topPredictions: sortedAnalysis.slice(0, 5).map((item) => ({
          label: item.label,
          confidence: Math.round((item.score || 0) * 100)
        }))
      };

      setDetectionResult(resolvedResult);
      await persistAnalysisForCurrentUser(resolvedResult, imageFile?.name);
      return;
    } catch (error) {
      console.error('❌ All detection attempts failed:', error.message);
      
      setBackendConnectionStatus('disconnected');
      
      console.warn('⚠️ Possible causes:');
      console.warn('  1. Azure endpoint is offline or wrong URL');
      console.warn('  2. CORS proxies are temporarily unavailable');
      console.warn('  3. Network connection issue');
      console.warn('💡 Solutions:');
      console.warn('  - Start local backend server (recommended)');
      console.warn('  - Ask friend to enable CORS on Azure endpoint');
      console.warn('  - Use a different Azure endpoint URL');
      
      console.log('📌 Using demo/fallback detection...');
      
      // Fallback to simulated detection
      setTimeout(async () => {
        const diseases = ['Leaf Blight', 'Powdery Mildew', 'Healthy', 'Bacterial Spot', 'Rust'];
        const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
        const confidence = Math.floor(Math.random() * 30) + 70;

        const resolvedResult = {
          disease: randomDisease,
          confidence: confidence,
          severity: randomDisease === 'Healthy' ? 'None' : ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          recommendations: randomDisease === 'Healthy' 
            ? `Your ${cropNameInput.trim() || 'plant'} looks healthy! Continue current care routine.`
            : `Treatment needed for ${randomDisease}${cropNameInput.trim() ? ` in ${cropNameInput.trim()}` : ''}. Apply appropriate fungicide and monitor closely.`,
          isDiseaseDetected: randomDisease !== 'Healthy',
          cropName: cropNameInput.trim(),
          resultSource: 'fallback'
        };

        setDetectionResult(resolvedResult);
        await persistAnalysisForCurrentUser(resolvedResult, imageFile?.name);
      }, 1000);
    }
  };

  const handleImageUpload = (eventOrFile, cropNameInput = '') => {
    // Accept either a native input change event or a File object (for drag-drop)
    const file = eventOrFile?.target?.files?.[0] ?? (eventOrFile instanceof File ? eventOrFile : null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setDetectionResult(null); // Clear previous results
        detectDisease(file, cropNameInput);
      };
      reader.readAsDataURL(file);
    }
  };

  const requestChatLocationAccess = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setChatLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
          captured_at: new Date().toISOString(),
        });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userInput = chatInput.trim();

    const userMessage = { type: 'user', text: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);

    // add a placeholder bot message while waiting for response
    const botPlaceholder = { type: 'bot', text: 'Typing...', timestamp: new Date(), pending: true };
    setChatMessages(prev => [...prev, botPlaceholder]);

    try {
      const { reply, provider } = await queryFreeChatbot(userInput, 'en', chatLocation);
      const aiText = reply || 'Sorry, no response from assistant.';

      setChatMessages(prev => {
        const withoutPlaceholder = prev.filter(m => !(m.type === 'bot' && m.pending));
        return [...withoutPlaceholder, { type: 'bot', text: aiText, provider, timestamp: new Date() }];
      });
    } catch (err) {
      console.error('Chat request failed', err);
      const errorText = typeof err?.message === 'string' && err.message.trim()
        ? err.message
        : 'Error contacting AI assistant.';
      setChatMessages(prev => {
        const withoutPlaceholder = prev.filter(m => !(m.type === 'bot' && m.pending));
        return [...withoutPlaceholder, { type: 'bot', text: `Error: ${errorText}`, timestamp: new Date() }];
      });
    } finally {
      setChatInput('');
    }
  };

  // Handle language change with LibreTranslate
  useEffect(() => {
    const handleLanguageChange = async () => {
      if (language === 'english') {
        setTranslatedTexts(texts['english']);
        setIsTranslating(false);
        console.log('🎯 Switched to English');
        return;
      }

      setIsTranslating(true);
      console.log(`🌍 Translating UI to ${language}...`);
      
      try {
        const baseTexts = texts['english'];
        const translated = await translateObject(baseTexts, language);
        setTranslatedTexts(translated);
        console.log(`✅ Translation complete for ${language}`);
      } catch (error) {
        console.error('Translation failed, using English as fallback:', error);
        setTranslatedTexts(texts['english']);
      } finally {
        setIsTranslating(false);
      }
    };

    handleLanguageChange();
  }, [language]);

  const currentTexts = translatedTexts;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', JSON.stringify(true));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', JSON.stringify(false));
    }
  }, [isDark]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detection':
        return <DetectionTab 
          currentTexts={currentTexts}
          language={language}
          selectedImage={selectedImage}
          detectionResult={detectionResult}
          analysisHistory={analysisHistory}
          cropName={cropName}
          setCropName={setCropName}
          backendConnectionStatus={backendConnectionStatus}
          handleImageUpload={handleImageUpload}
          fileInputRef={fileInputRef}
        />;
      case 'chatbot':
        return <ChatbotTab 
          currentTexts={currentTexts}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSubmit={handleChatSubmit}
          chatLocation={chatLocation}
          locationStatus={locationStatus}
          requestLocationAccess={requestChatLocationAccess}
        />;
      case 'analytics':
        return <AnalyticsTab 
          currentTexts={currentTexts}
          language={language}
          diseaseData={diseaseData}
          regionData={regionData}
        />;
      case 'home':
      default:
        return <HomeTab 
          currentTexts={currentTexts} 
          projectInfo={PROJECT_INFO} 
          language={language} 
          setActiveTab={setActiveTab} 
        />;
    }
  };

  return (
    !currentUser ? (
      <AuthPanel language={language} onLogin={handleLogin} onRegister={handleRegister} />
    ) : (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <Header 
        currentTexts={currentTexts}
        language={language}
        setLanguage={setLanguage}
        isDark={isDark}
        toggleTheme={() => setIsDark((d) => !d)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <Navigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTexts={currentTexts}
      />
      <main className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </main>
      {activeTab === 'home' && (
        <FloatingAssistant
          language={language}
          setActiveTab={setActiveTab}
          setChatInput={setChatInput}
        />
      )}
      <Footer currentTexts={currentTexts} />
    </div>
    )
  );
};

export default App;
