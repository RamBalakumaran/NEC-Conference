"use client";
import React, { useState } from "react";
// ✅ Ensure this import path is correct (same folder)
import { FloatingNav } from "./floating-navbar"; 
import {
  IconHome, IconFileText, IconBook2, IconPhone, IconMenu2, IconX
} from "@tabler/icons-react";
import { ShoppingCart, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useConference } from '../../context/ConferenceContext'; 
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, cart, logout } = useConference(); 
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ✅ Update these lines in your Navbar.jsx
const navItems = [
  { 
    name: "Home", 
    link: "/", 
    icon: <IconHome className="h-4 w-4 text-white" /> 
  },
  
  ...(user ? [
    { 
      name: "Tracks", 
      link: "/dashboard", 
      icon: <IconFileText className="h-4 w-4 text-white" /> 
    },
  ] : []),

  { 
    name: "Contact", 
    link: "/contact", 
    icon: <IconPhone className="h-4 w-4 text-white" /> 
  },
];

  // Helper to handle navigation and close drawer
  const handleNavigation = (path) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  const MobileDrawer = () => (
    <motion.div
      initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
      className="fixed top-0 left-0 h-full w-[250px] bg-purple-900/95 backdrop-blur-md z-[1001] shadow-lg flex flex-col"
    >
      <div className="p-4 border-b border-purple-800 flex justify-between items-center">
        <span className="text-white font-bold">NEC Conference</span>
        <button onClick={() => setIsDrawerOpen(false)} className="text-white"><IconX size={24} /></button>
      </div>
      <div className="p-4 space-y-4">
        {navItems.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => handleNavigation(item.link)} 
            className="w-full text-left text-white p-2 hover:bg-purple-800/50 rounded-md flex items-center gap-2"
          >
            {item.icon} {item.name}
          </button>
        ))}
        
        {/* Mobile Auth Buttons */}
        {user ? (
          <>
            <button onClick={() => handleNavigation('/checkout')} className="w-full text-left text-white p-2 hover:bg-purple-800/50 rounded-md flex gap-2">
              <ShoppingCart size={18}/> Cart ({cart.length})
            </button>
            <button onClick={async () => { await logout(); setIsDrawerOpen(false); navigate('/login'); }} className="w-full text-left text-red-300 p-2 hover:bg-red-900/20 rounded-md flex gap-2">
              <LogOut size={18}/> Logout
            </button>
          </>
        ) : (
          <button onClick={() => handleNavigation('/login')} className="w-full bg-pink-600 text-white p-2 rounded-md">Login / Register</button>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {!isDrawerOpen && (
        <button className="max-[970px]:block hidden fixed top-4 right-4 z-[1002] bg-purple-900/30 p-2 rounded-md backdrop-blur-md"
          onClick={() => setIsDrawerOpen(true)}>
          <IconMenu2 className="h-6 w-6 text-white" />
        </button>
      )}

      <AnimatePresence>{isDrawerOpen && <MobileDrawer />}</AnimatePresence>

      {/* Desktop Navbar */}
      <div className="hidden min-[970px]:flex fixed top-4 w-full z-[1000] flex-col items-center">
        <div className="relative w-[80%] lg:w-[900px] flex items-center justify-between">
          
          <FloatingNav navItems={navItems} className="bg-purple-900/30 backdrop-blur-md border-purple-600/50 text-white" />

          {/* Auth & Cart Section */}
          <div className="navbar-user-actions absolute right-[-150px] top-2 flex items-center gap-4 bg-purple-900/30 backdrop-blur-md px-4 py-2 rounded-full border border-purple-500/30">
            {user ? (
              <>
                <div onClick={() => navigate('/checkout')} className="relative cursor-pointer text-white hover:text-pink-400 transition">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-white text-xs font-bold">{user.name.split(' ')[0]}</span>
                  <span className="text-purple-400 text-[10px] uppercase">{user.department}</span>
                </div>
                <button 
                  onClick={async () => { 
                    // Check if user is admin - if so, don't logout here
                    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
                    if (!isAdmin) {
                      await logout(); 
                      navigate('/login'); 
                    }
                  }} 
                  title="Logout" 
                  className="text-white hover:text-red-500"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-white text-sm font-semibold hover:text-pink-400 transition">
                <User size={16} /> Login
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
