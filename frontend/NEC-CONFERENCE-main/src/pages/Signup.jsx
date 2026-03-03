import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useConference } from '../context/ConferenceContext';
import axios from 'axios';
import { trackSignup } from '../lib/trackClient';
import { User, Mail, Lock, School, Phone, Calendar, BookOpen, ArrowRight, Briefcase, UserCheck } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useConference();
  
  const [role, setRole] = useState('student'); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    orgName: '', // College or Company Name
    phone: '',
    year: '',
    department: '',
    designation: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setFormData({ 
      ...formData, 
      year: '', 
      department: '', 
      designation: '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // ✅ FIX: map orgName to college
      const payload = { 
        ...formData,
        college: formData.orgName, 
        role 
      };
      
      const { data } = await axios.post(
        'http://localhost:5200/conference/auth/signup',
        payload
      );
      
      login(data.result, data.token);
      try { trackSignup({ name: data.result.name, email: data.result.email }, data.token); } catch (_) {}
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0518] p-4 font-['Orbitron'] relative overflow-hidden">
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[550px] z-10 my-10">
        <div className="bg-[#1a0b2e]/80 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl shadow-2xl">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">
              Create Account
            </h2>
            <p className="text-purple-300 text-sm font-space-grotesk tracking-wide">
              Register as {role.charAt(0).toUpperCase() + role.slice(1)} to access Conference
            </p>
          </div>

          <div className="flex bg-[#0f0518] p-1 rounded-xl mb-6 border border-purple-500/20">
            {['student', 'faculty', 'industry'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize 
                  ${role === r 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center text-sm font-space-grotesk">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-space-grotesk">
            
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              <input name="name" placeholder="Full Name" onChange={handleChange} required className="input-field" />
            </div>

            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required className="input-field" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="input-field" />
            </div>

            <div className="relative group">
              {role === 'industry' ? (
                <Briefcase className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              ) : (
                <School className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              )}
              <input 
                name="orgName" 
                placeholder={role === 'industry' ? "Company Name" : "College / Institution Name"} 
                onChange={handleChange} 
                required 
                className="input-field" 
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
              <input name="phone" placeholder="Phone Number" onChange={handleChange} required maxLength={10} className="input-field" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {role === 'student' && (
                <div className="relative group">
                  <Calendar className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
                  <select name="year" onChange={handleChange} required className="input-field appearance-none cursor-pointer">
                    <option value="">Select Year</option>
                    <option value="1">I Year</option>
                    <option value="2">II Year</option>
                    <option value="3">III Year</option>
                    <option value="4">IV Year</option>
                  </select>
                </div>
              )}

              {(role === 'student' || role === 'faculty') && (
                <div className={`relative group ${role === 'faculty' ? 'col-span-2' : ''}`}>
                  <BookOpen className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
                  <select name="department" onChange={handleChange} required className="input-field appearance-none cursor-pointer">
                    <option value="">Select Dept</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AI&DS">AI & DS</option>
                  </select>
                </div>
              )}

              {(role === 'faculty' || role === 'industry') && (
                <div className="relative group col-span-2">
                  <UserCheck className="absolute left-3 top-3.5 text-purple-400 w-5 h-5" />
                  <input 
                    name="designation" 
                    placeholder="Designation (e.g. Asst. Professor / Manager)" 
                    onChange={handleChange} 
                    required 
                    className="input-field" 
                  />
                </div>
              )}
            </div>

            <button 
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl 
                         hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transform hover:scale-[1.02] transition-all duration-300
                         flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`} 
              {!loading && <ArrowRight size={20} />}
            </button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-bold hover:underline transition-colors">
                Login here
              </Link>
            </p>
          </div>

        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background-color: #0f0518;
          border: 1px solid rgba(126, 34, 206, 0.5);
          border-radius: 0.75rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          padding-left: 2.5rem;
          padding-right: 1rem;
          color: white;
          transition: all 0.3s;
        }
        .input-field:focus {
          border-color: #ec4899;
          outline: none;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2);
        }
        .input-field::placeholder {
          color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default Signup;
