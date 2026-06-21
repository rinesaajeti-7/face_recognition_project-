import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css';

const ChatBot = ({ citizenId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
const idRef = useRef(0);



const generateId = () => {
  idRef.current += 1;
  return idRef.current;
};
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ OPEN CHAT (fix për ESLint + clean logic)
  const openChat = () => {
    setIsOpen(true);

    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          text: "👋 Përshëndetje! Unë jam asistenti virtual. Si mund t'ju ndihmoj sot?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);

      setSuggestions([
        "🔍 Kontrollo një person",
        "📝 Raporto të dyshuar",
        "ℹ️ Si të ndihmoj?"
      ]);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
     id: generateId(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat/', {
        message: messageText,
        citizen_id: citizenId || null
      });

      const botMessage = {
       id: generateId(),
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setSuggestions(response.data.suggestions || []);

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage = {
       id: generateId(),
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
  };

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
      {/* Chat Button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={openChat}>
          <div className="chat-toggle-icon">💬</div>
          <div className="chat-toggle-text">
            <span>Asistenti AI</span>
            <small>Pyetni për personat e zhdukur</small>
          </div>
          <div className="chat-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <h3>Asistenti Virtual</h3>
                <p>Online • Gati për t'ju ndihmuar</p>
              </div>
            </div>

            <button className="chat-close" onClick={closeChat}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-avatar">
                  {msg.sender === 'bot' ? '🤖' : '👤'}
                </div>

                <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                  </div>
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

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="chat-suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="suggestion-btn"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Shkruani pyetjen tuaj këtu..."
              rows={1}
              className="chat-input"
              disabled={loading}
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="chat-send-btn"
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;