import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Search, MapPin, Mic, Tag, X, ShoppingBag, Gift, ArrowDown } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { SkeletonCard } from '../components/Skeleton';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { getShops, loading: dataLoading, preloadShop, getProducts, getOffers, getUserLocation } = useData();

  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState('shops'); // 'shops', 'products', 'offers'
  const [undoResponse, setUndoResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Initial Data Fetch
    const loadData = async () => {
      setLoading(true);
      const shopsData = await getShops();
      setShops(shopsData);

      try {
        const loc = await getUserLocation();
        setUserLocation(loc);
      } catch (e) {
        console.log("Loc error", e);
      }

      fetchResponses();
      setLoading(false);
    };
    loadData();
  }, [getShops, getUserLocation]);

  // Handle Search & Views
  useEffect(() => {
    if (search.trim() !== '') {
      setShopSearch('');
      setView('products');
      setPage(1);
      setHasMore(true);
      setLoading(true);
      getProducts(search, 1).then(data => {
        setProducts(data);
        setLoading(false);
        setHasMore(data.length === 20); // If fetch returns limit, likely more
      });
    } else if (shopSearch.trim() !== '') {
      setView('shops');
    } else {
      // Default view logic or restore
    }
  }, [search, shopSearch, getProducts]);

  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const data = await getProducts(search, nextPage);
    setProducts(prev => [...prev, ...data]);
    setPage(nextPage);
    if (data.length < 20) setHasMore(false);
    setLoadingMore(false);
  };

  const handleFetchOffers = async () => {
    setView('offers');
    setLoading(true);
    const data = await getOffers();
    setProducts(data);
    setLoading(false);
    setHasMore(false); // Offers endpoint is static limit for now
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hindi + Local support
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearch(transcript);
      };

      recognition.start();
    } else {
      alert('Voice search is not supported in this browser.');
    }
  };

  const fetchResponses = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    try {
      const res = await fetch(`/api/user/responses?user_id=${user.id}`);
      const data = await res.json();
      setResponses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'products' && products.length === 0 && search.trim().length > 2) {
        sendProductRequest(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [search, products, view]);

  const sendProductRequest = async (auto = false) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      if (!auto) {
        alert('Please login to send a request.');
        navigate('/login');
      }
      return;
    }
    if (!search.trim()) return;

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_name: search,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude
        })
      });
      if (res.ok && !auto) {
        alert('Request sent to shopkeepers! You will be notified when they respond.');
      }
    } catch (err) {
      console.error(err);
      if (!auto) alert('Failed to send request.');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Parse inputs to ensure they are numbers
    const l1 = parseFloat(lat1);
    const ln1 = parseFloat(lon1);
    const l2 = parseFloat(lat2);
    const ln2 = parseFloat(lon2);

    // Check for valid coordinates (reject null, NaN, or 0,0 if irrelevant)
    if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) return null;
    if (l1 === 0 && ln1 === 0) return null; // Assume 0,0 is invalid/default

    const R = 6371; // Radius of the earth in km
    const dLat = (l2 - l1) * (Math.PI / 180);
    const dLon = (ln2 - ln1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(l1 * (Math.PI / 180)) * Math.cos(l2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1);
  };

  const filteredShops = shops.filter(shop =>
    shop.shop_name.toLowerCase().includes(shopSearch.toLowerCase()) ||
    shop.category.toLowerCase().includes(shopSearch.toLowerCase())
  );

  const handleDismiss = async (e, response) => {
    e.stopPropagation();
    setResponses(responses.filter(r => r.id !== response.id));
    setUndoResponse(response);

    try {
      await fetch(`/api/responses/${response.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: 1 })
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setUndoResponse(current => current && current.id === response.id ? null : current);
    }, 5000);
  };

  const handleUndo = async () => {
    if (!undoResponse) return;
    const responseToRestore = undoResponse;
    setUndoResponse(null);

    setResponses(prev => [responseToRestore, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

    try {
      await fetch(`/api/responses/${responseToRestore.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: 0 })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'inherit', justifyContent: 'space-between', width: '100%', alignItems: 'center', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Village Market</h1>
      </div>

      <div className="nav-links hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2rem', width: '100%' }}>
        <button
          onClick={() => { setView('shops'); setSearch(''); setShopSearch(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', width: '100%', border: 'none', background: view === 'shops' ? '#ffe0b2' : 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
          <ShoppingBag size={20} /> All Shops
        </button>
        <button
          onClick={handleFetchOffers}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', width: '100%', border: 'none', background: view === 'offers' ? '#ffe0b2' : 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
          <Gift size={20} /> Best Offers
        </button>
        <button
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', width: '100%', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
          <User size={20} /> My Profile
        </button>
      </div>

      <div className="show-mobile-only" style={{ display: 'none' }}>
        <User onClick={() => navigate('/profile')} size={24} />
      </div>

      <style>{`
          @media (max-width: 768px) {
             .hide-mobile { display: none !important; }
             .show-mobile-only { display: block !important; }
          }
       `}</style>
    </div>
  );

  return (
    <DashboardLayout sidebar={sidebarContent}>
      {/* New Header Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '800',
          color: '#0F172A',
          marginBottom: '0.25rem'
        }}>
          Apne gaon ka digital bazaar 🛒
        </h2>
        <p style={{ color: '#64748B', fontSize: '1rem' }}>Find shops and products near you</p>
      </div>

      {/* Improved Search Bar */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: '1.5rem',
        border: '1px solid #F1F5F9'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <div className="input-group" style={{ position: 'relative', margin: 0 }}>
            <input
              type="text"
              placeholder="Search for products (e.g. Rice, Cement)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: '48px',
                paddingRight: '48px',
                height: '52px',
                fontSize: '1rem',
                borderRadius: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                boxShadow: 'none'
              }}
            />
            <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#94A3B8' }} size={20} />
            <div
              onClick={startVoiceSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isListening ? '#FEE2E2' : 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
            >
              <Mic size={18} color={isListening ? '#EF4444' : '#64748B'} />
            </div>
          </div>

          <div className="input-group" style={{ position: 'relative', margin: 0 }}>
            <input
              type="text"
              placeholder="Filter by Shop Name..."
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              style={{
                paddingLeft: '48px',
                height: '48px',
                fontSize: '0.95rem',
                borderRadius: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                boxShadow: 'none'
              }}
            />
            <Search style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} size={18} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {view === 'shops' && (
          <button className="btn btn-primary" onClick={handleFetchOffers} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <Tag size={16} /> Best Offers
          </button>
        )}
        {view !== 'shops' && (
          <button className="btn btn-secondary" onClick={() => { setView('shops'); setSearch(''); }} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <ArrowLeft size={16} /> Back to Shops
          </button>
        )}
      </div>

      {view === 'shops' ? (
        <>
          {responses.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Shopkeeper Replies</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {responses.map(response => (
                  <div key={response.id} className="card" style={{ borderLeft: '4px solid var(--primary-color)', position: 'relative' }} onClick={() => navigate(`/shop/${response.shop_id}`)}>
                    <div style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', padding: 5, zIndex: 10 }} onClick={(e) => handleDismiss(e, response)}>
                      <X size={18} color="#666" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {response.image && <img src={response.image} alt={response.product_name} loading="lazy" decoding="async" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{response.product_name}</h4>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>₹{response.price}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#666' }}>{response.shop_name} replied</p>
                        {response.note && <p style={{ margin: '2px 0', fontSize: '0.8rem', fontStyle: 'italic' }}>"{response.note}"</p>}
                      </div>
                      <button className="btn btn-sm btn-primary" style={{ height: 'fit-content', width: 'auto', padding: '5px 10px' }}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="shops-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {loading ? (
              // Skeleton Loader
              Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredShops.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', gridColumn: '1/-1' }}>No shops found.</p>
            ) : (
              filteredShops.map(shop => {
                const distance = userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude) : null;
                return (
                  <div key={shop.id} className="card"
                    onClick={() => navigate(`/shop/${shop.id}`)}
                    onMouseEnter={() => preloadShop(shop.id)} // Preload on Hover
                    style={{ cursor: 'pointer', height: '100%' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                        {shop.shop_photo ? (
                          <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                            <img src={shop.shop_photo} alt={shop.shop_name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.8rem', fontWeight: '500', border: '1px solid #E2E8F0' }}>No Img</div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)', fontSize: '1.1rem' }}>{shop.shop_name}</h3>
                          <span className={`badge ${shop.is_open ? 'badge-open' : 'badge-closed'}`}>
                            {shop.is_open ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>{shop.category}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#888' }}>
                          <MapPin size={14} />
                          <span>{shop.village}, {shop.city}</span>
                        </div>
                        {distance && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                            {distance} km away
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="products-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {view === 'offers' && <h3 style={{ marginTop: 0, gridColumn: '1/-1' }}>Best Offers in the Village</h3>}
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#e0f7fa', borderRadius: '8px', margin: '1rem 0', gridColumn: '1/-1' }}>
                <h3 style={{ color: '#006064', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Where are the products?</h3>
                <p style={{ color: '#00838f', fontSize: '0.9rem' }}>Searching nearby... or maybe ask shopkeepers directly!</p>
              </div>
            ) : (
              products.map(product => {
                const distance = userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, product.latitude, product.longitude) : null;
                return (
                  <div key={product.id} className="card" onClick={() => navigate(`/shop/${product.shop_id}`)} style={{ cursor: 'pointer', height: '100%' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {product.image && (
                        <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                          <img src={product.image} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{product.name}</h4>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#666' }}>{product.shop_name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: 'bold' }}>₹{product.price}</p>
                          {product.is_special_offer === 1 && (
                            <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', color: '#888' }}>₹{product.original_price}</span>
                          )}
                        </div>
                        {product.is_special_offer === 1 && (
                          <span style={{ fontSize: '0.7rem', background: 'red', color: 'white', padding: '2px 6px', borderRadius: '4px', marginTop: '5px', display: 'inline-block' }}>
                            {product.offer_message || 'Special Offer'}
                          </span>
                        )}
                        {distance && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                            {distance} km away
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {view === 'products' && hasMore && !loading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={loadMoreProducts} disabled={loadingMore} style={{ width: 'auto', padding: '10px 30px' }}>
                {loadingMore ? 'Loading...' : 'Load More Products'} <ArrowDown size={14} style={{ marginLeft: 5 }} />
              </button>
            </div>
          )}
        </>
      )}

      <BenefitsSlider />
      {/* ... (Footer and Toast kept same) ... */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
        <h4>Terms & Conditions</h4>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          1. All products are sold by respective shopkeepers.<br />
          2. Village Market is a platform to connect buyers and sellers.<br />
          3. Verify products before purchasing.
        </p>
      </div>

      {undoResponse && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#333', color: 'white', padding: '10px 20px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}>
          <span>Reply removed</span>
          <button onClick={handleUndo} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer' }}>Undo</button>
        </div>
      )}
    </DashboardLayout>
  );
}

function BenefitsSlider() {
  // Same as before
  const benefits = [
    "Agar aapko koi product kisi local shop par nahi milta, toh yahaan aasani se mil sakta hai.",
    "Aap kisi bhi shop ki duri apni location se dekh sakte hain aur map ke jariye wahan pahunch sakte hain.",
    "Shopkeeper apne business ko online laa sakta hai aur zyada customers tak pahunch sakta hai.",
    "Aapko pehle hi pata chal jayega ki shop open hai ya closed."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % benefits.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
      borderRadius: '8px',
      border: '1px solid #a5d6a7'
    }}>
      <h4 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Benefits of using this app</h4>
      <div style={{ height: '60px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <p key={index} style={{
          margin: 0,
          color: '#1b5e20',
          fontSize: '0.95rem',
          animation: 'slideUp 0.8s ease-out'
        }}>
          ✅ {benefits[index]}
        </p>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}