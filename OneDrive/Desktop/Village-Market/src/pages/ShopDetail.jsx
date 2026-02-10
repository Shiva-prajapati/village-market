import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, ArrowLeft, Star, Award, ShoppingCart, Navigation } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { SkeletonCard } from '../components/Skeleton';

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShopDetail, getUserLocation, calculateDistance } = useData();
  const { addToCart, getCartCount } = useCart();

  const [shop, setShop] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Try getting cached, if not found or old, it fetches
      const data = await getShopDetail(id);
      setShop(data);

      try {
        const loc = await getUserLocation();
        setUserLocation(loc);
      } catch (e) {
        console.log('Could not get user location:', e.message);
      }

      setLoading(false);
    };
    load();
  }, [id, getShopDetail, getUserLocation]);

  // Calculate distance when both shop and user location are available
  useEffect(() => {
    if (shop && userLocation && !distance) {
      const calcDistance = async () => {
        setDistanceLoading(true);
        try {
          const result = await calculateDistance(shop.id, userLocation.latitude, userLocation.longitude);
          if (result) {
            setDistance(result);
          }
        } catch (err) {
          console.error('Error calculating distance:', err);
        }
        setDistanceLoading(false);
      };
      calcDistance();
    }
  }, [shop, userLocation, distance, calculateDistance]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Please login to rate this shop.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          user_id: user.id,
          rating,
          comment
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Review submitted!');
        const updated = await getShopDetail(id, true); // Force Refresh
        setShop(updated);
        setComment('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header"><ArrowLeft /> <span>Loading...</span></div>
        <div className="content" style={{ padding: '20px' }}>
          <SkeletonCard />
          <br />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!shop) return <div className="container"><div className="content">Shop not found.</div></div>;

  return (
    <div className="container">
      <div className="header">
        <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span>{shop.shop_name}</span>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/cart')}>
          <ShoppingCart size={24} />
          {getCartCount() > 0 && <span style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>{getCartCount()}</span>}
        </div>
      </div>
      <div className="content">

        {/* Top Section: Shop & Owner Images */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '1.5rem',
          height: '180px'
        }}>
          {/* Shop Image */}
          <div style={{
            flex: 1,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            background: '#f1f5f9'
          }}>
            {shop.shop_photo ? (
              <img
                src={shop.shop_photo}
                alt="Shop"
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No Image</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.8rem', textAlign: 'center' }}>Shop</div>
          </div>

          {/* Owner Image */}
          <div style={{
            flex: 1,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            background: '#f1f5f9'
          }}>
            {shop.owner_photo ? (
              <img
                src={shop.owner_photo}
                alt="Owner"
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No Image</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.8rem', textAlign: 'center' }}>Owner</div>
          </div>
        </div>

        <div className="card">
          <div className="shop-header">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1E293B' }}>{shop.shop_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', marginTop: '4px' }}>
                <MapPin size={16} />
                <p style={{ margin: 0 }}>{shop.village}, {shop.city}</p>
              </div>

              {/* Distance Display */}
              {distance && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: '#2563EB', 
                  marginTop: '4px',
                  background: '#EFF6FF',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  width: 'fit-content'
                }}>
                  <Navigation size={14} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>{distance.formattedDistance} away</p>
                </div>
              )}
              {distanceLoading && (
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94A3B8' }}>📍 Calculating distance...</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${shop.is_open ? 'badge-open' : 'badge-closed'}`}>
                    {shop.is_open ? 'Open' : 'Closed'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#F59E0B', background: '#FFF7ED', padding: '4px 8px', borderRadius: '12px' }}>
                    <Star size={14} fill="#F59E0B" />
                    <span style={{ marginLeft: '4px', fontWeight: '700', color: '#B45309', fontSize: '0.9rem' }}>{shop.avgRating} ({shop.totalRatings})</span>
                  </div>
                </div>

                {/* Timings Display */}
                {shop.opening_time && shop.closing_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#555', background: '#F8FAFC', padding: '8px', borderRadius: '8px' }}>
                    {(() => {
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();

                      const [openH, openM] = shop.opening_time.split(':').map(Number);
                      const [closeH, closeM] = shop.closing_time.split(':').map(Number);

                      const openMinutes = openH * 60 + openM;
                      const closeMinutes = closeH * 60 + closeM;

                      // Simple check assuming open and close are on same day
                      const isOpenNow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

                      const formatTime = (timeStr) => {
                        const [h, m] = timeStr.split(':');
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const formattedH = hour % 12 || 12;
                        return `${formattedH}:${m} ${ampm}`;
                      };

                      return (
                        <>
                          <span style={{
                            color: isOpenNow ? '#16A34A' : '#DC2626',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isOpenNow ? '• Open Now' : '• Closed Now'}
                          </span>
                          <span style={{ color: '#94A3B8' }}>| {formatTime(shop.opening_time)} - {formatTime(shop.closing_time)}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/chat/shop/${shop.id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <MessageCircle size={20} /> Chat with Shop
            </button>
          </div>
        </div>

        <h3>Products</h3>
        <div className="products-list">
          {shop.products && shop.products.map(product => (
            <div key={product.id} className="card">
              {product.image && (
                <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <h4 style={{ margin: 0 }}>{product.name}</h4>
                    {product.is_best_seller === 1 && <Award size={16} color="gold" fill="gold" />}
                  </div>
                  <p style={{ color: 'var(--accent-color)', fontWeight: 'bold', margin: '5px 0' }}>₹{product.price}</p>
                </div>
                {product.in_stock === 0 ? (
                  <span className="badge badge-closed">Out of Stock</span>
                ) : (
                  <button
                    className="btn-add-to-cart"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingCart size={18} strokeWidth={2.5} />
                    Add to Cart
                  </button>
                )}
              </div>
              {product.is_best_seller === 1 && <span style={{ fontSize: '0.7rem', color: 'gold', fontWeight: 'bold', background: '#FFF8E1', padding: '2px 6px', borderRadius: '4px' }}>Best Seller</span>}
            </div>
          ))}
          {shop.products && shop.products.length === 0 && <p>No products added yet.</p>}
        </div>

        <h3>Rate & Review</h3>
        <div className="card">
          <form onSubmit={submitReview}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={24}
                  fill={star <= rating ? '#FFB300' : 'none'}
                  color={star <= rating ? '#FFB300' : '#ccc'}
                  onClick={() => setRating(star)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
            <textarea
              className="input-group"
              placeholder="Write a review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', minHeight: '60px', padding: '10px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting}>Submit Review</button>
          </form>
        </div>

        <div className="reviews-list">
          {shop.reviews && shop.reviews.map(review => (
            <div key={review.id} className="card" style={{ background: '#f9f9f9', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{review.user_name}</strong>
                <div style={{ display: 'flex', alignItems: 'center', color: '#FFB300' }}>
                  <Star size={14} fill="#FFB300" /> {review.rating}
                </div>
              </div>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{review.comment}</p>
              <small style={{ color: '#888' }}>{new Date(review.timestamp).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}