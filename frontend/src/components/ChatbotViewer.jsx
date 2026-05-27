import React, { useState, useEffect, useRef } from 'react';

const ChatbotViewer = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your Campus Nav-AI Assistant. How can I help you find classrooms, labs, or faculties around Graphic Era Hill University today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestionQueries = [
    "Where is LT 201?",
    "How to reach Lab 8?",
    "Tell me about CR 101",
    "Where is the Library?"
  ];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Check chatbot API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/chatbot/health');
        const data = await res.json();
        setIsOnline(data.status === 'healthy');
      } catch (err) {
        setIsOnline(false);
      }
    };
    checkHealth();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message to list
    const userMsg = {
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: text })
      });

      const data = await response.json();
      
      const botMsg = {
        sender: 'bot',
        text: data.response || "I couldn't process your request. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error('Error contacting chatbot API:', error);
      const botErrorMsg = {
        sender: 'bot',
        text: "Sorry, I am having trouble connecting to the chatbot server. Please ensure the chatbot service is running.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botErrorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div id="chatbot-viewer" className="chatbot-section">
      <div className="section-header" style={{ textAlign: 'center' }}>
        <h2>Virtual Assistant</h2>
      </div>

      <div className="chatbot-card">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-title">
            <i className="fas fa-robot"></i>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>CampusNav Bot</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NLP Powered Facility Search</p>
            </div>
          </div>
          <div className="chatbot-status" style={{ color: isOnline ? '#22c55e' : '#ef4444' }}>
            <div className="status-dot" style={{ backgroundColor: isOnline ? '#22c55e' : '#ef4444' }}></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Messages list */}
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender}`}>
              <span>{msg.text}</span>
              <span className="message-time">{msg.time}</span>
            </div>
          ))}

          {loading && (
            <div className="message-bubble bot" style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1s infinite 0s' }}></div>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="chatbot-chips">
          {suggestionQueries.map((query) => (
            <button 
              key={query} 
              className="chip-btn" 
              onClick={() => handleSendMessage(query)}
              disabled={loading}
            >
              {query}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <input 
            type="text" 
            placeholder="Type your campus query here..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button 
            className="chatbot-send-btn" 
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotViewer;
