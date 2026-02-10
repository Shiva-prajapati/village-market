import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    if (e.target.name === 'mobile') {
      const val = e.target.value;
      if (!/^\d*$/.test(val)) return; // Only allow digits
      if (val.length > 10) return; // Max 10 digits
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError('Please enter a valid active mobile number.');
      return;
    }
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        if (data.type === 'user') {
          navigate('/user/dashboard');
        } else {
          navigate('/shop/dashboard');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server. Ensure backend is running.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'white',
      overflow: 'hidden'
    }}>

      {/* Top Half: Branding */}
      <div style={{
        flex: '0.8',
        background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <img
            src="/logo.svg"
            alt="logo"
            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
        </div>

        <h1 style={{ margin: '0', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>
          Village Market
        </h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', opacity: 0.9, color: '#DBEAFE' }}>
          Your trusted local marketplace
        </p>
      </div>

      {/* Bottom Half: Login Form */}
      <div style={{
        flex: '1.2',
        background: 'white',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        marginTop: '-32px', // Overlap
        position: 'relative',
        zIndex: 10,
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.05)'
      }}>

        <h2 style={{ margin: '0 0 2rem 0', color: '#1E293B', fontSize: '1.5rem', fontWeight: '700' }}>
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '340px' }}>

          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ marginLeft: '4px' }}>Mobile Number</label>
            <div style={{ display: 'flex', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: '600',
                color: '#64748B',
                zIndex: 1
              }}>+91</span>
              <input
                type="tel"
                name="mobile"
                placeholder="9876543210"
                required
                maxLength="10"
                value={formData.mobile}
                onChange={handleChange}
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginLeft: '4px' }}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#EF4444',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '50px' }}>
            Login / Continue
          </button>

        </form>

        <div style={{ margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '280px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ padding: '0 12px', color: '#94A3B8', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}>
          Skip to Home
        </button>

      </div>
    </div>
  );
}