import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatBot.css';

const PoliceChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasWelcome, setHasWelcome] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdCounter = useRef(0);

  const getNextId = () => {
    messageIdCounter.current += 1;
    return messageIdCounter.current;
  };

  useEffect(() => {
    if (isOpen && !hasWelcome) {
      const welcomeMessage = "👋 Përshëndetje Oficer! Unë jam asistenti AI i Policisë. Si mund t'ju ndihmoj?";
      
      setMessages([{
        id: getNextId(),
        text: welcomeMessage,
        sender: 'bot',
        timestamp: new Date()
      }]);
      
      setSuggestions([
        "🔍 Kërko një person",
        "📊 Statistikat", 
        "🚨 Krijo alarm",
        "📋 Raporte"
      ]);
      
      setHasWelcome(true);
    }
  }, [isOpen, hasWelcome]);

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
      setSuggestions(response.data.suggestions || []);
      
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
  }, [input]);

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
    <>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <div className="chat-toggle-icon">💬</div>
          <div className="chat-toggle-text">
            <span>Asistenti AI</span>
            <small>Ndihmë e shpejtë për Policinë</small>
          </div>
          <div className="chat-pulse"></div>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <h3>Asistenti AI i Policisë</h3>
                <p>Online • Gati për t'ju ndihmuar</p>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-avatar">{msg.sender === 'bot' ? '🤖' : '👮'}</div>
                <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="chat-suggestions">
              {suggestions.map((suggestion, idx) => (
                <button key={idx} className="suggestion-btn" onClick={() => sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Shkruani pyetjen tuaj këtu..."
              rows={1}
              className="chat-input"
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="chat-send-btn">
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PoliceChatBot;