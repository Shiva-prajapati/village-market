import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Save, Clock } from 'lucide-react';

export default function ShopProfile() {
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [name, setName] = useState('');
    const [shopName, setShopName] = useState('');
    const [category, setCategory] = useState('');
    const [openingTime, setOpeningTime] = useState('');
    const [closingTime, setClosingTime] = useState('');

    // Photos
    const [ownerPhoto, setOwnerPhoto] = useState(null);
    const [shopPhoto, setShopPhoto] = useState(null);
    const [ownerPhotoPreview, setOwnerPhotoPreview] = useState(null);
    const [shopPhotoPreview, setShopPhotoPreview] = useState(null);

    // Location Updates
    const [newCoords, setNewCoords] = useState(null);
    const [locationStatus, setLocationStatus] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.type !== 'shopkeeper') {
            navigate('/login');
            return;
        }
        fetchShopDetails(user.id);
    }, []);

    const fetchShopDetails = async (id) => {
        try {
            const res = await fetch(`/api/shops/${id}`);
            const data = await res.json();
            setShop(data);

            // Initialize form
            setName(data.name || '');
            setShopName(data.shop_name || '');
            setCategory(data.category || '');
            setOpeningTime(data.opening_time || '');
            setClosingTime(data.closing_time || '');
            setOwnerPhotoPreview(data.owner_photo);
            setShopPhotoPreview(data.shop_photo);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const getLiveLocation = () => {
        setLocationStatus('Fetching accurate location...');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                        setLocationStatus('Invalid coordinates.');
                        return;
                    }

                    setNewCoords({ latitude: lat, longitude: lon });
                    setLocationStatus('Location Captured!');
                },
                (err) => {
                    setLocationStatus('Error: ' + err.message);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('Geolocation Not Supported');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('id', shop.id);
        data.append('name', name);
        data.append('shop_name', shopName);
        data.append('category', category);
        data.append('opening_time', openingTime);
        data.append('closing_time', closingTime);

        if (newCoords) {
            data.append('latitude', newCoords.latitude);
            data.append('longitude', newCoords.longitude);
        }

        if (ownerPhoto) data.append('owner_photo', ownerPhoto);
        if (shopPhoto) data.append('shop_photo', shopPhoto);

        try {
            const res = await fetch('/api/shop/profile', {
                method: 'POST',
                body: data
            });
            const updatedShop = await res.json();
            if (res.ok) {
                alert('Profile Updated Successfully!');
                // Update local storage if needed, though usually minimal data is stored there
                const currentUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedShop }));
                fetchShopDetails(shop.id); // Refresh
            } else {
                alert('Failed to update profile');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile');
        }
    };

    if (loading) return <div className="container"><div className="content">Loading...</div></div>;

    return (
        <div className="container" style={{ maxWidth: '100%', padding: '0', background: '#fff' }}>

            {/* Header */}
            <div className="header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 0,
                position: 'sticky',
                top: 0,
                padding: '1rem',
                zIndex: 100
            }}>
                <ArrowLeft onClick={() => navigate('/shop/dashboard')} style={{ cursor: 'pointer' }} />
                <span>Shop Profile</span>
                <div style={{ width: 24 }} /> {/* Spacer */}
            </div>

            <div className="content" style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Photos Section */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {/* Owner Photo */}
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img
                                src={ownerPhotoPreview || '/placeholder-user.jpg'}
                                alt="Owner"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                            />
                            <label htmlFor="owner-photo-upload" style={{
                                position: 'absolute', bottom: 0, right: 0,
                                background: 'white', borderRadius: '50%', padding: '6px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)', cursor: 'pointer'
                            }}>
                                <Camera size={16} color="var(--primary-color)" />
                            </label>
                            <input
                                id="owner-photo-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setOwnerPhoto(e.target.files[0]);
                                        setOwnerPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                    }
                                }}
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '5px' }}>Owner</p>
                        </div>

                        {/* Shop Photo */}
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img
                                src={shopPhotoPreview || '/placeholder-shop.jpg'}
                                alt="Shop"
                                style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '1px solid #ddd' }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                            />
                            <label htmlFor="shop-photo-upload" style={{
                                position: 'absolute', bottom: '-5px', right: '-5px',
                                background: 'white', borderRadius: '50%', padding: '6px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)', cursor: 'pointer'
                            }}>
                                <Camera size={16} color="var(--primary-color)" />
                            </label>
                            <input
                                id="shop-photo-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setShopPhoto(e.target.files[0]);
                                        setShopPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                    }
                                }}
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '5px' }}>Shop</p>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #eee', width: '100%' }} />

                    {/* Basic Details */}
                    <div className="input-group">
                        <label>Shopkeeper Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="input-group">
                        <label>Shop Name</label>
                        <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} required />
                    </div>

                    <div className="input-group">
                        <label>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius)', border: '1px solid #ccc' }}>
                            <option value="Grocery">Grocery / Kirana</option>
                            <option value="Vegetables">Vegetables & Fruits</option>
                            <option value="Dairy">Dairy & Milk</option>
                            <option value="Bakery">Bakery & Snacks</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Timings */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> Open Time</label>
                            <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> Close Time</label>
                            <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                        </div>
                    </div>

                    {/* Read-only Fields */}
                    <div className="input-group">
                        <label>Mobile Number (Not Editable)</label>
                        <input type="text" value={shop.mobile} disabled style={{ background: '#f5f5f5', color: '#888' }} />
                    </div>

                    <div className="input-group">
                        <label><MapPin size={14} /> Shop Location</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input type="text" value={shop.village} disabled style={{ flex: 1, background: '#f5f5f5', color: '#888' }} />
                            <input type="text" value={shop.city} disabled style={{ flex: 1, background: '#f5f5f5', color: '#888' }} />
                        </div>

                        <div style={{ padding: '15px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                            <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#1E40AF' }}>
                                <strong>GPS Coordinates:</strong><br />
                                {newCoords ? (
                                    <span style={{ color: '#166534', fontWeight: 'bold' }}>
                                        New: {newCoords.latitude.toFixed(5)}, {newCoords.longitude.toFixed(5)}
                                    </span>
                                ) : (
                                    <span style={{ color: '#64748B' }}>
                                        Current: {shop.latitude || 'Not Set'}, {shop.longitude || 'Not Set'}
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={getLiveLocation}
                                disabled={locationStatus.includes('Fetching')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    background: '#fff', border: '1px solid #3B82F6', color: '#2563EB'
                                }}
                            >
                                <MapPin size={16} /> {locationStatus || 'Update Live Location'}
                            </button>
                            {newCoords && (
                                <p style={{ fontSize: '0.8rem', color: '#166534', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '1.2em' }}>✓</span> Location captured. Click "Update Profile" to save.
                                </p>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Save size={18} /> Update Profile
                    </button>

                </form>

            </div>
        </div>
    );
}
