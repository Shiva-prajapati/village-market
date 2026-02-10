import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut, Archive } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u) {
      navigate('/login');
      return;
    }
    setUser(u);
    setName(u.name || u.shop_name);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('id', user.id);
    data.append('name', name);
    if (profilePic) {
      if (!profilePic.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }
      data.append('profile_pic', profilePic);
    }

    const res = await fetch('/api/user/profile', {
      method: 'POST',
      body: data
    });
    const updatedUser = await res.json();
    if (res.ok) {
      updatedUser.type = user.type;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      setProfilePic(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="header" style={{ justifyContent: 'space-between' }}>
        <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span>Profile</span>
        <LogOut onClick={logout} style={{ cursor: 'pointer' }} />
      </div>
      <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--background-color)', padding: '2rem 1rem' }}>

        {/* Profile Header Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <img
              src={user.profile_pic ? user.profile_pic : 'https://via.placeholder.com/150'}
              alt="Profile"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)'
              }}
            />
            {isEditing && (
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--primary-color)', color: 'white',
                padding: '10px', borderRadius: '50%', cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                <Camera size={20} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setProfilePic(e.target.files[0])} />
              </label>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} style={{ width: '100%' }}>
              <div className="input-group">
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>{user.name || user.shop_name}</h2>
              <p style={{ color: '#64748B', fontSize: '1rem', background: '#F1F5F9', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '1.5rem' }}>
                {user.mobile}
              </p>

              <button
                className="btn btn-secondary"
                onClick={() => setIsEditing(true)}
                style={{ borderRadius: '50px', fontWeight: '600' }}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Menu Options */}
        {!isEditing && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ marginLeft: '1rem', color: '#94A3B8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</h3>

            {user.type === 'user' && (
              <>
                <div
                  onClick={() => navigate('/cart')}
                  style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ padding: '10px', background: '#EFF6FF', borderRadius: '12px', color: '#2563EB' }}>
                    <Archive size={20} />
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: '500', flex: 1 }}>My Cart</span>
                </div>

                <div
                  onClick={() => navigate('/user/archived-replies')}
                  style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ padding: '10px', background: '#F0FDF4', borderRadius: '12px', color: '#16A34A' }}>
                    <Archive size={20} />
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: '500', flex: 1 }}>Archived Replies</span>
                </div>
              </>
            )}

            <div
              onClick={logout}
              style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <div style={{ padding: '10px', background: '#FEE2E2', borderRadius: '12px', color: '#EF4444' }}>
                <LogOut size={20} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: '500', flex: 1, color: '#EF4444' }}>Logout</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}