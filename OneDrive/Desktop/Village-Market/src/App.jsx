import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Eager load splash screen for instant feedback
import SplashScreen from './pages/SplashScreen';

// Lazy load other pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const RegisterUser = lazy(() => import('./pages/RegisterUser'));
const RegisterShop = lazy(() => import('./pages/RegisterShop'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ShopDashboard = lazy(() => import('./pages/ShopDashboard'));
const ShopProfile = lazy(() => import('./pages/ShopProfile'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const ArchivedReplies = lazy(() => import('./pages/ArchivedReplies'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '10px' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    <p style={{ color: '#666' }}>Loading...</p>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/user" element={<RegisterUser />} />
        <Route path="/register/shop" element={<RegisterShop />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/shop/dashboard" element={<ShopDashboard />} />
        <Route path="/shop/profile" element={<ShopProfile />} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/chat/:type/:id" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/archived-replies" element={<ArchivedReplies />} />
      </Routes>
    </Suspense>
  );
}

export default App;
