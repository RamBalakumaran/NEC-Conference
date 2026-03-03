import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
// import { trackLogin } from '../lib/trackClient'; // Uncomment if you have this file

const ConferenceContext = createContext();

export const useConference = () => useContext(ConferenceContext);

export const ConferenceProvider = ({ children }) => {
  const getCartKey = (email) => `cart_${(email || 'guest').toLowerCase()}`;
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user')) || null);
  const [cart, setCart] = useState([]);
  const cartRef = useRef([]);

  // Load the active user's cart (isolated per user)
  useEffect(() => {
    const key = getCartKey(user?.email);
    const persisted = JSON.parse(localStorage.getItem(key) || '[]');
    setCart(Array.isArray(persisted) ? persisted : []);
  }, [user?.email]);

  useEffect(() => {
    cartRef.current = Array.isArray(cart) ? cart : [];
  }, [cart]);

  // Sync cart to local storage whenever it changes (per user key)
  useEffect(() => {
    const key = getCartKey(user?.email);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user?.email]);

  // Login
  const login = (userData, token) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
    
    // Optional: Analytics tracking
    // try { trackLogin({ name: userData.name, email: userData.email }, token); } catch (_) {}
  };

  // Logout
  const logout = async () => {
    try {
      const uid = user?._id || user?.id || null;
      if (user?.email) {
        const cartSnapshot = Array.isArray(cartRef.current) ? cartRef.current : [];
        const cartEventNames = cartSnapshot
          .map((ev) => (typeof ev === 'string' ? ev : (ev?.name || ev?.title || ev?.id || '')))
          .filter(Boolean);
        await axios.post('http://localhost:5200/conference/auth/logout', { 
            userId: uid,
            email: user.email,
            name: user.name,
            cartEvents: cartEventNames,
            cartAmount: calculateTotal(cartSnapshot)
        });
      }
    } catch (error) {
      console.error("Logout API failed", error);
    }

    setUser(null);
    // Keep user-specific cart in localStorage until manual removal/payment success.
    sessionStorage.clear();
  };

  // Add to Cart (With Email Notification & DB Sync)
  const addToCart = async (event) => {
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    if (!currentCart.find(item => item.id === event.id)) {
      const newCart = [...currentCart, event];
      cartRef.current = newCart;
      setCart(newCart);

      if (user) {
        try {
            // 1. Send Email Notification
            await axios.post('http://localhost:5200/conference/user/cart/add', {
                email: user.email,
                userName: user.name,
                eventName: event.title || event.name || 'Event'
            });

            // 2. Sync "Pending" state to DB
            await axios.post('http://localhost:5200/conference/user/cart/save', {
                userData: user,
                selectedEvents: newCart,
                amount: calculateTotal(newCart), // Recalculate total for DB
                cartUpdatedAt: Date.now()
            });
            // console.debug('[Cart Save] pendingEmailSent:', saveRes?.data?.pendingEmailSent);
        } catch (error) {
            console.error("Cart sync failed:", error);
        }
      }
    }
  };

  // Remove from Cart (With Email Notification & DB Sync)
  const removeFromCart = async (eventId) => {
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const eventToRemove = currentCart.find(item => item.id === eventId);
    const newCart = currentCart.filter(item => item.id !== eventId);
    cartRef.current = newCart;
    setCart(newCart);

    if (user && eventToRemove) {
       try {
           await axios.post('http://localhost:5200/conference/user/cart/remove', {
                email: user.email,
                userName: user.name,
                eventName: eventToRemove.title || eventToRemove.name || 'Event'
           });
           
           await axios.post('http://localhost:5200/conference/user/cart/save', {
                userData: user,
                selectedEvents: newCart,
                amount: calculateTotal(newCart),
                cartUpdatedAt: Date.now()
           });
       } catch (error) {
           console.error("Cart removal sync failed:", error);
       }
    }
  };

  // Clear the entire cart (called after successful payment)
  const clearCart = async () => {
    cartRef.current = [];
    setCart([]);
    if (user) {
      try {
        await axios.post('http://localhost:5200/conference/user/cart/save', {
          userData: user,
          selectedEvents: [],
          amount: 0,
          cartUpdatedAt: Date.now()
        });
      } catch (e) {
        console.error('Failed to sync cleared cart to server', e);
      }
    }
  };

  // ✅ PRICING LOGIC (Main Conference + Bundle)
  // Accepts 'currentCart' arg to allow calculation before state update if needed, defaults to state 'cart'
  const calculateTotal = (currentCart = cart) => {
    const MAIN_CONF_ID = 'icodses-2026'; // ID defined in AllTracks.jsx

    // 1. Check if Main Conference is selected
    const hasMainConference = currentCart.some(item => item.id === MAIN_CONF_ID);
    
    // 2. Count other (Pre-conference) events
    const standardEventsCount = currentCart.filter(item => item.id !== MAIN_CONF_ID).length;

    let total = 0;

    // Bundle Logic for Pre-Conference Events
    if (standardEventsCount === 1) total += 10;
    else if (standardEventsCount > 1) total += 15;

    // Add Main Conference Fee
    if (hasMainConference) total += 20;

    return total; 
  };

  return (
    <ConferenceContext.Provider value={{ 
      user, 
      login, 
      logout, 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart,
      totalPrice: calculateTotal() 
    }}>
      {children}
    </ConferenceContext.Provider>
  );
};
