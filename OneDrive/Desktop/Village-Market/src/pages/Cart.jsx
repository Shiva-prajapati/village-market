import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
    const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (cart.length === 0) return;
        const confirm = window.confirm(`Place order for ₹${getCartTotal()}?`);
        if (confirm) {
            alert('Order placed successfully! (This is a demo)');
            clearCart();
            navigate('/home');
        }
    };

    return (
        <div className="container">
            <div className="header">
                <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <span>My Cart</span>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="content">
                {cart.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '70vh',
                        background: 'linear-gradient(180deg, var(--background-color) 0%, #EFF6FF 100%)',
                        margin: '-1rem', // Negate content padding for full width
                        padding: '2rem'
                    }}>
                        {/* Illustration */}
                        <div style={{
                            width: '140px',
                            height: '140px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.15)',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                border: '1px solid rgba(37, 99, 235, 0.1)',
                                animation: 'pulse 3s infinite'
                            }} />
                            <ShoppingCart size={64} color="#3B82F6" strokeWidth={1.5} style={{ marginLeft: '-5px' }} />
                        </div>

                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: '800',
                            color: '#1E293B',
                            marginBottom: '0.75rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Your cart is empty 🛒
                        </h2>

                        <p style={{
                            color: '#64748B',
                            fontSize: '1.05rem',
                            maxWidth: '280px',
                            marginBottom: '2.5rem',
                            lineHeight: '1.6',
                            textAlign: 'center'
                        }}>
                            Looks like you haven't added anything yet.
                        </p>

                        <button
                            onClick={() => {
                                const user = JSON.parse(localStorage.getItem('user'));
                                if (user) {
                                    navigate('/user/dashboard');
                                } else {
                                    navigate('/home');
                                }
                            }}
                            style={{
                                padding: '16px 40px',
                                borderRadius: '50px',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.3)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                letterSpacing: '0.01em'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 12px 25px -4px rgba(37, 99, 235, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(37, 99, 235, 0.3)';
                            }}
                        >
                            Back to Shopping
                        </button>

                        <style>{`
                            @keyframes pulse {
                                0% { transform: scale(1); opacity: 1; }
                                50% { transform: scale(1.05); opacity: 0.5; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                    </div>
                ) : (
                    <>
                        <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.id} className="card" style={{ display: 'flex', gap: '1rem', padding: '10px' }}>
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{item.name}</h4>
                                        <p style={{ color: 'var(--accent-color)', fontWeight: 'bold', margin: 0 }}>₹{item.price * item.quantity}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: '#f0f0f0', borderRadius: '4px' }}>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    style={{ border: 'none', background: 'transparent', padding: '5px 10px', fontSize: '1.2rem', cursor: 'pointer' }}
                                                >-</button>
                                                <span style={{ padding: '0 10px', fontWeight: 'bold' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    style={{ border: 'none', background: 'transparent', padding: '5px 10px', fontSize: '1.2rem', cursor: 'pointer' }}
                                                >+</button>
                                            </div>
                                            <Trash2
                                                size={20}
                                                color="#ff4444"
                                                style={{ cursor: 'pointer', marginLeft: 'auto' }}
                                                onClick={() => removeFromCart(item.id)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary" style={{
                            marginTop: 'auto',
                            padding: '20px',
                            background: 'white',
                            borderTop: '1px solid #eee',
                            position: 'sticky',
                            bottom: 0
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Total</span>
                                <span>₹{getCartTotal()}</span>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleCheckout}
                                style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
                            >
                                Checkout
                            </button>
                        </div>
                    </>
                )
                }
            </div>
        </div>
    );
}
