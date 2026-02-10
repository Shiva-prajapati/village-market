import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', mobile: '', password: '' });
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
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    // Basic India format check (starts with 6-9)
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError('Please enter a valid active mobile number.');
      return;
    }
    try {
      const response = await fetch('/api/register/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/user/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="container">
      <div className="header">User Registration</div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" name="name" placeholder="Enter Name" required onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Mobile Number</label>
            <input type="tel" name="mobile" placeholder="Enter Mobile Number" required maxLength="10" onChange={handleChange} value={formData.mobile} />
          </div>
          <div className="input-group">
            <label>Create Password</label>
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