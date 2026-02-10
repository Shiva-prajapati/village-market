import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'var(--background-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Unique App Icon */}
      <div style={{
        marginBottom: '2.5rem',
        background: 'white',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid var(--border-color)',
        zIndex: 1
      }}>
        <img
          src="/logo.svg"
          alt="Village Market Logo"
          style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <div style={{ display: 'none' }}>
          {/* Fallback Icon - Primary Blue */}
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" fill="#2563EB" />
            <circle cx="12" cy="9" r="2.5" fill="#2563EB" />
          </svg>
        </div>
      </div>

      {/* App Name & Tagline */}
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <h1 style={{
          color: 'var(--text-color)',
          margin: '0 0 12px 0',
          fontSize: '2.25rem',
          fontWeight: '700',
          letterSpacing: '-0.02em'
        }}>
          Village Market
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          margin: '0 0 3.5rem 0',
          fontSize: '1.1rem',
          fontWeight: '400',
          maxWidth: '320px',
          lineHeight: '1.6'
        }}>
          One app for local shops, groceries & more.
          Fresh from your village.
        </p>
      </div>

      {/* Main Action Buttons */}
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1 }}>

        {/* Continue / Login Button (Primary) */}
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
          style={{
            padding: '16px',
            fontSize: '1.1rem',
            marginBottom: '0.5rem'
          }}
        >
          Login / Continue
        </button>

        {/* Create Account Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/register/user')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              fontSize: '0.95rem',
              margin: 0
            }}
          >
            New User
          </button>
          <button
            onClick={() => navigate('/register/shop')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              fontSize: '0.95rem',
              margin: 0
            }}
          >
            New Shop
          </button>
        </div>

      </div>

      <p style={{
        position: 'absolute',
        bottom: '24px',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
      }}>
        Connecting Communities
      </p>

    </div>
  );
}