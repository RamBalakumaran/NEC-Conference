import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConferenceProvider } from './context/ConferenceContext'; 
import './index.css';

// Components
import Layout from './components/Layout'; 
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AllTracks from './pages/AllTracks'; 
import Checkout from './pages/Checkout';
import Payment from './components/Registration/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';

import SpotlightedEvents from './components/SpotlightedEvents'; 
import Developers from './components/Developers';
import About from './components/About'; 
import Contact from './pages/Contact'
function App() {
  return (
    <ConferenceProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Admin routes rendered without the site Layout (no navbar/footer) */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* All other routes use the site Layout */}
          <Route path="/*" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            {/* support both /dashboard and /tracks for legacy reasons */}
            <Route path="dashboard" element={<AllTracks />} />
            <Route path="tracks" element={<AllTracks />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="registration/payment" element={<Payment />} />
            <Route path="keynotes" element={<SpotlightedEvents />} />
            <Route path="contact" element={<Contact />} />
            <Route path="developers" element={<Developers />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConferenceProvider>
  );
}

export default App;