import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useConference } from '../context/ConferenceContext';
import axios from 'axios';
import { trackLogin } from '../lib/trackClient';
import { Mail, Lock, ArrowRight, ArrowLeft, UserCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Particle from '../components/Particle';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useConference();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (sessionStorage.getItem('isAdmin') === 'true') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- 1. ADMIN LOGIN CHECK (Hardcoded) ---
    if (formData.email === 'admin@gmail.com' && formData.password === 'necadmin123') {
      try {
        const { data } = await axios.post('http://localhost:5200/conference/auth/admin-login', formData);
        // Persist admin token and mark admin session
        localStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('isAdmin', 'true');
        login(data.result, data.token);
        navigate('/admin/dashboard');
        return;
      } catch (err) {
        setError(err.response?.data?.message || 'Admin login failed');
        setLoading(false);
        return;
      }
    }

    // --- 2. STANDARD USER LOGIN (API) ---
    try {
      // Ensure admin flag is cleared for normal users
      sessionStorage.removeItem('isAdmin');

      const { data } = await axios.post('http://localhost:5200/conference/auth/login', formData);
      
      // Update Context with API response
      // Assuming API returns { result: { userData }, token: "..." }
      login(data.result, data.token);
      // Track login event (best-effort)
      try { trackLogin({ name: data.result.name, email: data.result.email }, data.token); } catch(_) {}
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid Email or Password');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0518] relative overflow-hidden font-['Orbitron']">
      
      {/* 1. Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particle />
      </div>
      
      {/* Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[100px]" />
      </div>

      {/* 2. Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[450px] px-4"
      >
        <div className="bg-[#1a0b2e]/80 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')} 
            className="mb-6 flex items-center gap-2 text-purple-400 hover:text-white text-sm transition-colors font-space-grotesk"
          >
            <ArrowLeft size={16}/> Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
               <UserCircle className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">Welcome Back</h2>
            <p className="text-purple-300 text-sm font-space-grotesk tracking-widest">Sign in to continue</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-center text-sm font-space-grotesk flex items-center justify-center gap-2"
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 font-space-grotesk">
            
            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-purple-400 w-5 h-5 group-focus-within:text-pink-400 transition-colors pointer-events-none" />
              <input 
                type="email" 
                name="email"
                required 
                placeholder="Email Address"
                className="w-full bg-[#0f0518] border border-purple-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-pink-500 focus:outline-none transition-all placeholder:text-gray-600"
                onChange={handleChange}
                value={formData.email}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-purple-400 w-5 h-5 group-focus-within:text-pink-400 transition-colors pointer-events-none" />
              <input 
                type="password" 
                name="password"
                required 
                placeholder="Password"
                className="w-full bg-[#0f0518] border border-purple-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-pink-500 focus:outline-none transition-all placeholder:text-gray-600"
                onChange={handleChange}
                value={formData.password}
              />
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl 
                         hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transform hover:scale-[1.02] transition-all duration-300
                         flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Login"} 
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center font-space-grotesk">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-pink-400 hover:text-pink-300 font-bold hover:underline transition-colors decoration-pink-500/50">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;