import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

export default function Chat() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    const userId = user.type === 'user' ? user.id : id;
    const shopId = user.type === 'shopkeeper' ? user.id : id;

    fetchMessages(userId, shopId);
    const interval = setInterval(() => fetchMessages(userId, shopId), 3000);
    return () => clearInterval(interval);
  }, [id, type]);

  const fetchMessages = async (userId, shopId) => {
    try {
      const res = await fetch(`/api/messages?user_id=${userId}&shop_id=${shopId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const user = JSON.parse(localStorage.getItem('user'));

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_type: user.type,
        sender_id: user.id,
        receiver_id: id,
        content: input
      })
    });

    setInput('');
    const userId = user.type === 'user' ? user.id : id;
    const shopId = user.type === 'shopkeeper' ? user.id : id;
    fetchMessages(userId, shopId);
  };

  return (
    <div className="container" style={{ background: '#F8FAFC' }}>
      <div className="header" style={{ padding: '1rem', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', background: '#F1F5F9' }}>
            <ArrowLeft size={20} color="#475569" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>Chat</span>
        </div>
      </div>

      <div className="content chat-container" style={{ padding: '1rem' }}>
        <div className="messages-area" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.map((msg, index) => {
            const isMe = (msg.sender_type === currentUser?.type) && (msg.sender_id === currentUser?.id);
            return (
              <div key={index} className={`chat-bubble ${isMe ? 'me' : 'them'}`} style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: '16px',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                background: isMe ? '#2563EB' : 'white',
                color: isMe ? 'white' : '#1E293B',
                boxShadow: isMe ? '0 4px 6px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                borderBottomLeftRadius: isMe ? '16px' : '4px',
                border: isMe ? 'none' : '1px solid #E2E8F0'
              }}>
                {msg.content}
                <div style={{
                  fontSize: '0.7rem',
                  marginTop: '4px',
                  color: isMe ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                  textAlign: 'right'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="nav-bar" style={{
        padding: '1rem',
        background: 'white',
        borderTop: '1px solid #E2E8F0',
        position: 'sticky',
        bottom: 0
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.95rem'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}