const express = require('express');
const router = express.Router();

// Import the functions we defined in the controller
const { 
    notifyAddToCart, 
    notifyRemoveFromCart, 
    saveCartState,
    validateUser // Including this to prevent your specific error
} = require('../controller/userController');

// Define Routes
router.post('/cart/add', notifyAddToCart);
router.post('/cart/remove', notifyRemoveFromCart);
router.post('/cart/save', saveCartState);

// This was likely the line causing your crash. 
// Now it will work because validateUser is exported in the controller.
router.get('/validateuser', validateUser);

module.exports = router;