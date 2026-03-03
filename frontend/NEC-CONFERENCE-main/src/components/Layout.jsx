import React from 'react';
import Particle from './Particle';
import { Navbar } from "./Navbar/Navbar.jsx"; // Adjust path if needed
import Footer from "./Footer.jsx"; // Adjust path if needed
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden flex flex-col">
      {/* GLOBAL BUBBLE EFFECT */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <Particle />
      </div>

      {/* Navbar stays at the top */}
      <Navbar />

      {/* Page Content: flex-grow pushes the footer down */}
      <main className="relative z-10 flex-grow">
        <Outlet />
      </main>

      {/* Footer appears at the bottom of every page */}
      <Footer />
    </div>
  );
};

export default Layout;