import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle } from 'lucide-react';

/**
 * Validate GPS coordinates (production-ready)
 */
const validateCoordinates = (lat, lon) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { valid: false, error: 'Invalid coordinates received' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { valid: false, error: 'Coordinates out of valid range' };
  }
  if (lat === 0 && lon === 0) {
    return { valid: false, error: 'Default coordinates detected (0,0) - please enable accurate location' };
  }
  return { valid: true, error: null };
};

export default function RegisterShop() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', village: '', city: '', shop_name: '', category: 'Grocery', mobile: '', password: '', latitude: '', longitude: ''
  });
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [shopPhoto, setShopPhoto] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [locationAttempts, setLocationAttempts] = useState(0);

  const handleChange = (e) => {
    if (e.target.name === 'mobile') {
      const val = e.target.value;
      if (!/^\d*$/.test(val)) return;
      if (val.length > 10) return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    setLocationStatus('Requesting precise GPS location...');
    setLocationError('');
    setLocationAttempts(prev => prev + 1);

    if (!navigator.geolocation) {
      setLocationError('⚠️ Geolocation not supported by this browser. Please use Chrome, Safari, or Firefox.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude);
        const lon = parseFloat(position.coords.longitude);
        const accuracy = position.coords.accuracy;

        // Validate coordinates
        const validation = validateCoordinates(lat, lon);
        if (!validation.valid) {
          setLocationError(validation.error);
          setLocationStatus('');
          return;
        }

        // Check accuracy (warn if > 50m, but still accept)
        if (accuracy > 50) {
          setLocationStatus(`⚠️ Location accuracy: ${Math.round(accuracy)}m (may be approximate)`);
        } else {
          setLocationStatus(`✓ Location fetched with ${Math.round(accuracy)}m accuracy`);
        }

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        setLocationError('');
      },
      (err) => {
        const errorMessages = {
          'PERMISSION_DENIED': '❌ Location permission denied. Please enable location in browser settings.',
          'POSITION_UNAVAILABLE': '❌ Location unavailable. Please check your GPS/network.',
          'TIMEOUT': '❌ Location request timed out. Please try again with good GPS signal.',
        };
        
        const errorMsg = errorMessages[err.code] || `❌ Error: ${err.message}`;
        setLocationError(errorMsg);
        setLocationStatus('');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000,  // Increased timeout
        maximumAge: 0 
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitude || !formData.longitude) {
      setError('❌ Please capture your location first (required for customers to find you)');
      return;
    }

    // Validate location one more time before submit
    const validation = validateCoordinates(formData.latitude, formData.longitude);
    if (!validation.valid) {
      setError(`❌ Location validation failed: ${validation.error}. Please try capturing again.`);
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError('Please enter a valid active mobile number.');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'latitude' || key === 'longitude') {
        data.append(key, parseFloat(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });
    if (ownerPhoto) data.append('owner_photo', ownerPhoto);
    if (shopPhoto) data.append('shop_photo', shopPhoto);

    try {
      const response = await fetch('/api/register/shopkeeper', {
        method: 'POST',
        body: data,
      });
      const resData = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(resData));
        navigate('/shop/dashboard');
      } else {
        setError(resData.error);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="container">
      <div className="header">Shopkeeper Registration</div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Owner Name</label>
            <input type="text" name="name" placeholder="Enter Owner Name" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Village Name</label>
            <input type="text" name="village" placeholder="Enter Village" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>City Name</label>
            <input type="text" name="city" placeholder="Enter City" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Shop Name</label>
            <input type="text" name="shop_name" placeholder="Enter Shop Name" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Shop Category</label>
            <select name="category" onChange={handleChange}>
              <option value="Grocery">Grocery</option>
              <option value="Dairy">Dairy</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Clothes">Clothes</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label>Shop Location (Required for Customers to find you)</label>
            {locationError && (
              <div style={{ 
                background: '#FEE2E2', 
                color: '#DC2626', 
                padding: '10px', 
                borderRadius: '8px', 
                marginBottom: '10px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{locationError}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button" 
                className={`btn ${formData.latitude ? 'btn-secondary' : 'btn-primary'}`} 
                onClick={getLocation} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px', 
                  flex: 1 
                }}
              >
                <MapPin size={20} />
                {formData.latitude ? `✓ Location Saved (${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)})` : ('📍 ' + (locationStatus || 'Capture Location'))}
              </button>
              {formData.latitude && <span style={{ color: 'green', fontSize: '1.2rem' }}>✔</span>}
            </div>
            {locationStatus && !locationError && <p style={{ color: '#16A34A', fontSize: '0.85rem', marginTop: '5px' }}>{locationStatus}</p>}
          </div>

          <div className="input-group">
            <label>Owner Photo (Camera/Gallery)</label>
            <input type="file" accept="image/*" onChange={(e) => setOwnerPhoto(e.target.files[0])} required />
          </div>

          <div className="input-group">
            <label>Shop Photo (Camera Only)</label>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setShopPhoto(e.target.files[0])} required />
          </div>

          <div className="input-group">
            <label>Mobile Number</label>
            <input type="tel" name="mobile" placeholder="Enter Mobile" required maxLength="10" onChange={handleChange} value={formData.mobile} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Create Password" required onChange={handleChange} />
          </div>

          {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer' }} onClick={() => navigate('/')}>Back</p>
      </div>
    </div>
  );
}