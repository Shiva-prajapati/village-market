import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash, LogOut, User, Edit, Award } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function ShopDashboard() {
  const navigate = useNavigate();
  const { getShopDetail } = useData();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [chats, setChats] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImage, setProductImage] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.type !== 'shopkeeper') {
      navigate('/login');
      return;
    }
    // Use Cache if available
    getShopDetail(user.id).then(data => {
      setShop(data);
      setProducts(data?.products || []);
    });
    fetchChats(user.id);
  }, [getShopDetail]);

  const fetchShopDetails = async (id) => {
    const data = await getShopDetail(id, true); // Force refresh if needed
    setShop(data);
    setProducts(data.products || []);
  };

  const fetchChats = async (id) => {
    // Chat caching is complex, let's keep it real-time or simpler for now
    const res = await fetch(`/api/shop/chats/${id}`);
    const data = await res.json();
    setChats(data);
  };

  // ... Keep existing edit/delete logic as it was ...
  const toggleStatus = async () => {
    const newStatus = shop.is_open ? 0 : 1;
    await fetch(`/api/shops/${shop.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: newStatus })
    });
    setShop({ ...shop, is_open: newStatus });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('shop_id', shop.id);
    data.append('name', newProduct.name);
    data.append('price', newProduct.price);
    data.append('is_best_seller', newProduct.is_best_seller || 0);
    data.append('is_special_offer', newProduct.is_special_offer || 0);
    data.append('offer_message', newProduct.offer_message || '');
    data.append('original_price', newProduct.original_price || '');
    if (productImage) data.append('image', productImage);

    const res = await fetch('/api/products', {
      method: 'POST',
      body: data
    });
    if (res.ok) {
      setShowAddProduct(false);
      fetchShopDetails(shop.id); // Refresh Data
      setNewProduct({ name: '', price: '' });
      setProductImage(null);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', editingProduct.name);
    data.append('price', editingProduct.price);
    data.append('is_best_seller', editingProduct.is_best_seller || 0);
    data.append('is_special_offer', editingProduct.is_special_offer || 0);
    data.append('offer_message', editingProduct.offer_message || '');
    data.append('original_price', editingProduct.original_price || '');
    if (productImage) data.append('image', productImage);

    const res = await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PUT',
      body: data
    });

    if (res.ok) {
      setEditingProduct(null);
      setProductImage(null);
      fetchShopDetails(shop.id);
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('Delete this product?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchShopDetails(shop.id);
    }
  };

  const toggleStock = async (product) => {
    const newStock = product.in_stock ? 0 : 1;
    await fetch(`/api/products/${product.id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: newStock })
    });
    fetchShopDetails(shop.id);
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!shop) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'inherit', justifyContent: 'space-between', width: '100%', alignItems: 'center', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {shop.shop_photo && <img src={shop.shop_photo} alt="Shop" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)' }}>{shop.shop_name}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dashboard</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexDirection: 'inherit', alignItems: 'center' }}>
        <button onClick={() => navigate('/shop/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-color)' }}>
          <User size={20} />
          <span className="hide-mobile" style={{ fontSize: '0.9rem' }}>Profile</span>
        </button>
        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--error-color)' }}>
          <LogOut size={20} />
          <span className="hide-mobile" style={{ fontSize: '0.9rem' }}>Logout</span>
        </button>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );

  return (
    <DashboardLayout sidebar={sidebarContent}>
      {/* Shop Status Section */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', marginBottom: '2rem' }}>
        <span style={{ fontSize: '1.2rem' }}>Shop Status: <strong style={{ color: shop.is_open ? 'green' : 'red' }}>{shop.is_open ? 'OPEN' : 'CLOSED'}</strong></span>
        <div className="toggle-switch" onClick={toggleStatus}>
          <div style={{
            width: 50, height: 26, background: shop.is_open ? 'var(--primary-color)' : '#ccc',
            borderRadius: 20, position: 'relative', transition: '0.3s'
          }}>
            <div style={{
              width: 20, height: 20, background: 'white', borderRadius: '50%',
              position: 'absolute', top: 3, left: shop.is_open ? 27 : 3, transition: '0.3s'
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Products Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Products ({products.length})</h3>
            <button className="btn btn-primary" onClick={() => setShowAddProduct(!showAddProduct)} style={{ width: 'auto', padding: '8px 16px', margin: 0 }}>
              <Plus size={18} style={{ marginRight: 5 }} /> Add
            </button>
          </div>

          {showAddProduct && (
            <div className="card">
              <form onSubmit={handleAddProduct}>
                <div className="input-group">
                  <label>Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Price</label>
                  <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Image (Gallery/Camera)</label>
                  <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} />
                </div>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={newProduct.is_best_seller || false}
                    onChange={e => setNewProduct({ ...newProduct, is_best_seller: e.target.checked ? 1 : 0 })}
                    style={{ width: 'auto' }}
                  />
                  <label style={{ margin: 0 }}>Mark as Best Seller</label>
                </div>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={newProduct.is_special_offer || false}
                    onChange={e => setNewProduct({ ...newProduct, is_special_offer: e.target.checked ? 1 : 0 })}
                    style={{ width: 'auto' }}
                  />
                  <label style={{ margin: 0 }}>Special Offer</label>
                </div>
                {newProduct.is_special_offer === 1 && (
                  <>
                    <div className="input-group">
                      <label>Original Price (Before Discount)</label>
                      <input type="number" value={newProduct.original_price || ''} onChange={e => setNewProduct({ ...newProduct, original_price: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label>Offer Message (e.g. 10% OFF)</label>
                      <input type="text" value={newProduct.offer_message || ''} onChange={e => setNewProduct({ ...newProduct, offer_message: e.target.value })} required />
                    </div>
                  </>
                )}
                <button type="submit" className="btn btn-secondary">Save Product</button>
              </form>
            </div>
          )}

          <div className="products-list">
            {products.map(product => (
              <div key={product.id} className="card">
                {editingProduct && editingProduct.id === product.id ? (
                  <form onSubmit={handleUpdateProduct}>
                    {/* ... Same Edit Form ... */}
                    <div className="input-group">
                      <label>Product Name</label>
                      <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label>Price</label>
                      <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label>Change Image (Optional)</label>
                      <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} />
                    </div>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={editingProduct.is_best_seller === 1}
                        onChange={e => setEditingProduct({ ...editingProduct, is_best_seller: e.target.checked ? 1 : 0 })}
                        style={{ width: 'auto' }}
                      />
                      <label style={{ margin: 0 }}>Mark as Best Seller</label>
                    </div>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={editingProduct.is_special_offer === 1}
                        onChange={e => setEditingProduct({ ...editingProduct, is_special_offer: e.target.checked ? 1 : 0 })}
                        style={{ width: 'auto' }}
                      />
                      <label style={{ margin: 0 }}>Special Offer</label>
                    </div>
                    {editingProduct.is_special_offer === 1 && (
                      <>
                        <div className="input-group">
                          <label>Original Price (Before Discount)</label>
                          <input type="number" value={editingProduct.original_price || ''} onChange={e => setEditingProduct({ ...editingProduct, original_price: e.target.value })} required />
                        </div>
                        <div className="input-group">
                          <label>Offer Message (e.g. 10% OFF)</label>
                          <input type="text" value={editingProduct.offer_message || ''} onChange={e => setEditingProduct({ ...editingProduct, offer_message: e.target.value })} required />
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingProduct(null); setProductImage(null); }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {product.image && <img src={product.image} alt={product.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <h4 style={{ margin: 0 }}>{product.name}</h4>
                        {product.is_best_seller === 1 && <Award size={16} color="var(--warning-color)" fill="var(--warning-color)" />}
                        {product.is_special_offer === 1 && <span style={{ fontSize: '0.7rem', background: 'var(--error-color)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Offer</span>}
                      </div>
                      <p style={{ margin: '5px 0' }}>
                        {product.is_special_offer === 1 && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '5px' }}>₹{product.original_price}</span>}
                        ₹{product.price}
                      </p>
                      <span className={`badge ${product.in_stock ? 'badge-open' : 'badge-closed'}`} onClick={() => toggleStock(product)} style={{ cursor: 'pointer' }}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Edit size={18} color="var(--primary-color)" onClick={() => setEditingProduct(product)} style={{ cursor: 'pointer' }} />
                      <Trash size={18} color="var(--error-color)" onClick={() => deleteProduct(product.id)} style={{ cursor: 'pointer' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Requests and Chats Section */}
        <div>
          <UserRequestsSection shopId={shop.id} />

          <div style={{ marginTop: '2rem' }}>
            <h3>Chats ({chats.length})</h3>
            <div className="chats-list">
              {chats.length === 0 && <p>No chats yet.</p>}
              {chats.map(chatUser => (
                <div key={chatUser.id} className="card" onClick={() => navigate(`/chat/user/${chatUser.id}`)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} />
                    </div>
                    <span>{chatUser.name}</span>
                  </div>

                  <Trash
                    size={20}
                    color="var(--error-color)"
                    style={{ padding: '2px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this chat?')) {
                        fetch(`/api/chats/${shop.id}/${chatUser.id}`, { method: 'DELETE' })
                          .then(res => {
                            if (res.ok) fetchChats(shop.id);
                          });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function UserRequestsSection({ shopId }) {
  // ... Keep Same ... 
  const [requests, setRequests] = useState([]);
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState({ price: '', note: '' });
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (shopId) {
      fetchRequests();
    }
  }, [shopId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/shop/requests?shop_id=${shopId}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('shop_id', shopId);
    data.append('product_name', respondingTo.product_name);
    data.append('price', response.price);
    data.append('note', response.note);
    data.append('response_type', 'yes');
    if (image) data.append('image', image);

    try {
      const res = await fetch(`/api/requests/${respondingTo.id}/respond`, {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        alert('Response sent!');
        setRespondingTo(null);
        setResponse({ price: '', note: '' });
        setImage(null);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (reqId) => {
    try {
      const res = await fetch(`/api/requests/${reqId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          response_type: 'no'
        })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>User Product Requests</h3>
      {requests.length === 0 && <p>No pending requests.</p>}
      {requests.map(req => (
        <div key={req.id} className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
          <p><strong>{req.user_name}</strong> is looking for: <strong style={{ fontSize: '1.1rem' }}>{req.product_name}</strong></p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(req.timestamp).toLocaleString()}</p>

          {respondingTo && respondingTo.id === req.id ? (
            <form onSubmit={submitResponse} style={{ marginTop: '10px' }}>
              <div className="input-group">
                <label>Your Price</label>
                <input type="number" value={response.price} onChange={e => setResponse({ ...response, price: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="input-group">
                <label>Note (Optional)</label>
                <input type="text" value={response.note} onChange={e => setResponse({ ...response, note: e.target.value })} placeholder="e.g. Available in 1 hour" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Response</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRespondingTo(null)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={() => setRespondingTo(req)} style={{ flex: 1 }}>YES, I have this</button>
              <button className="btn btn-secondary" onClick={() => handleDecline(req.id)} style={{ flex: 1 }}>NO</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}