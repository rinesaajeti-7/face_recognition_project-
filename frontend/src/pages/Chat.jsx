import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      text: "👋 Përshëndetje Oficer! Unë jam asistenti inteligjent i Policisë. Si mund t'ju ndihmoj sot?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(() => [
    "🔍 Kërko një person",
    "📊 Statistikat", 
    "🚨 Krijo alarm",
    "📋 Raporte",
    "👥 Listo përdoruesit"
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  let messageId = useRef(2);

  const getNextId = useCallback(() => {
    messageId.current += 1;
    return messageId.current;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: getNextId(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat/police', {
        message: messageText
      });
      
      const botMessage = {
        id: getNextId(),
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setSuggestions(response.data.suggestions || [
        "🔍 Kërko një person",
        "📊 Statistikat", 
        "🚨 Krijo alarm",
        "📋 Raporte"
      ]);
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: getNextId(),
        text: "😔 Më vjen keq, pati një gabim. Ju lutemi provoni përsëri.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, getNextId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div className="chat-page-title">
          <div className="ai-icon">🤖</div>
          <div>
            <h1>Asistenti Inteligjent i Policisë</h1>
            <p>Ndihmë e fuqizuar nga AI për menaxhimin e rasteve</p>
          </div>
        </div>
      </div>

      <div className="chat-page-container">
        <div className="chat-messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? '🤖' : '👮'}
              </div>
              <div className="message-content">
                <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message bot">
              <div className="message-avatar">🤖</div>
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-suggestions-area">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Shkruani pyetjen tuaj këtu... Mund të pyesni çdo gjë për sistemin, personat e zhdukur, procedurat policore, etj."
            rows={1}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}>
            📤 Dërgo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;