const Razorpay = require("razorpay");
const crypto = require("crypto");

// Lazy-load Razorpay instance to avoid errors if env vars are missing
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Verify webhook signature
const verifyWebhookSignature = (body, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) {
    console.error("Webhook secret or signature missing");
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  
  return expectedSignature === signature;
};

// Fetch payment details from Razorpay
const fetchPaymentFromRazorpay = async (paymentId) => {
  try {
    const payment = await getRazorpayInstance().payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error("Error fetching payment from Razorpay:", error);
    return { success: false, error: error.message };
  }
};

// Fetch order details from Razorpay
const fetchOrderFromRazorpay = async (orderId) => {
  try {
    const order = await getRazorpayInstance().orders.fetch(orderId);
    return { success: true, order };
  } catch (error) {
    console.error("Error fetching order from Razorpay:", error);
    return { success: false, error: error.message };
  }
};

// Verify payment signature (server-side)
const verifyPaymentSignature = (paymentData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;
  
  console.log("[RazorpayService] Verifying payment signature:", {
    razorpayOrderId,
    razorpayPaymentId,
    hasSignature: !!razorpaySignature,
    signatureLength: razorpaySignature?.length
  });
  
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    console.error("[RazorpayService] Missing payment details:", {
      hasOrderId: !!razorpayOrderId,
      hasPaymentId: !!razorpayPaymentId,
      hasSignature: !!razorpaySignature
    });
    return { valid: false, error: "Missing payment details" };
  }
  
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!secret) {
    console.error("[RazorpayService] RAZORPAY_KEY_SECRET is not configured!");
    console.error("[RazorpayService] Please set RAZORPAY_KEY_SECRET in environment variables");
    return { valid: false, error: "Payment gateway configuration error - contact support" };
  }
  
  // Generate expected signature: HMAC-SHA256 of "order_id|payment_id"
  const signaturePayload = `${razorpayOrderId}|${razorpayPaymentId}`;
  console.log("[RazorpayService] Signature payload:", signaturePayload);
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signaturePayload)
    .digest("hex");
  
  console.log("[RazorpayService] Signature comparison:", {
    expectedSignature: signature,
    receivedSignature: razorpaySignature,
    match: signature === razorpaySignature,
    secretLength: secret?.length,
    secretPrefix: secret?.substring(0, 4) + "..."
  });
  
  if (signature !== razorpaySignature) {
    console.error("[RazorpayService] Invalid signature detected!");
    console.error("[RazorpayService] This could be due to:");
    console.error("  - Using Razorpay test key in production or vice versa");
    console.error("  - Payment ID mismatch between order and payment");
    console.error("  - Signature tampering");
    return { 
      valid: false, 
      error: "Invalid payment signature - please try again or contact support if issue persists",
      debugInfo: {
        expectedPrefix: signature.substring(0, 10),
        receivedPrefix: razorpaySignature.substring(0, 10)
      }
    };
  }
  
  console.log("[RazorpayService] Signature verification successful");
  return { valid: true };
};

// Create refund
const createRefund = async (paymentId, amount = null) => {
  try {
    const refundData = {
      payment_id: paymentId,
    };
    
    // If partial refund, specify amount
    if (amount) {
      refundData.amount = amount; // in paise
    }
    
    const refund = await getRazorpayInstance().payments.createRefund(paymentId, refundData);
    return { success: true, refund };
  } catch (error) {
    console.error("Error creating refund:", error);
    return { success: false, error: error.message };
  }
};

// Get refund details
const getRefundDetails = async (refundId) => {
  try {
    const refund = await getRazorpayInstance().refunds.fetch(refundId);
    return { success: true, refund };
  } catch (error) {
    console.error("Error fetching refund:", error);
    return { success: false, error: error.message };
  }
};

// Check if payment is captured
const isPaymentCaptured = async (paymentId) => {
  try {
    const payment = await getRazorpayInstance().payments.fetch(paymentId);
    return {
      captured: payment.status === "captured",
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { captured: false, error: error.message };
  }
};

// Create a new order (for testing or manual creation)
const createOrder = async (orderData) => {
  try {
    const options = {
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      receipt: orderData.receipt,
      notes: orderData.notes || {},
    };
    
    const order = await getRazorpayInstance().orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
};

// Handle webhook events
const handleWebhookEvent = async (event) => {
  const { event: eventType, payload } = event;
  
  console.log("Processing webhook event:", eventType);
  
  switch (eventType) {
    case "payment.captured":
      return {
        event: "payment.captured",
        paymentId: payload.payment.entity.id,
        orderId: payload.payment.entity.order_id,
        status: "captured",
      };
      
    case "payment.failed":
      return {
        event: "payment.failed",
        paymentId: payload.payment.entity.id,
        orderId: payload.payment.entity.order_id,
        status: "failed",
        error: payload.payment.entity.error_description,
      };
      
    case "refund.created":
      return {
        event: "refund.created",
        refundId: payload.refund.entity.id,
        paymentId: payload.refund.entity.payment_id,
        status: "refunded",
      };
      
    default:
      console.log("Unhandled webhook event:", eventType);
      return null;
  }
};

module.exports = {
  verifyWebhookSignature,
  fetchPaymentFromRazorpay,
  fetchOrderFromRazorpay,
  verifyPaymentSignature,
  createRefund,
  getRefundDetails,
  isPaymentCaptured,
  createOrder,
  handleWebhookEvent,
};
