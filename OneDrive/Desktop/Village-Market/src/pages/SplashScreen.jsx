import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            navigate('/home');
        }, 2200);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', // Premium Blue Gradient
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* Background Glow Effect */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0
            }} />

            {/* Logo Container */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'white',
                borderRadius: '32px', // Softer corners
                padding: '30px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 8px rgba(255,255,255,0.1)', // Layered shadow
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '130px',
                height: '130px',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <img
                    src="/logo.svg"
                    alt="Village Market"
                    style={{ width: '75px', height: '75px', objectFit: 'contain' }}
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
                <div style={{ display: 'none' }}>
                    <svg width="75" height="75" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" fill="#2563EB" />
                        <circle cx="12" cy="9" r="2.5" fill="#2563EB" />
                    </svg>
                </div>
            </div>

            {/* App Name */}
            <h1 style={{
                color: 'white',
                marginTop: '2.5rem',
                fontSize: '2.2rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.2s', // Delayed
                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 1
            }}>
                Village Market
            </h1>

            <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '0.75rem',
                fontSize: '1.1rem',
                fontWeight: '500',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.4s', // More delayed
                position: 'relative',
                zIndex: 1
            }}>
                Fresh from your village 💛
            </p>
        </div>
    );
}
