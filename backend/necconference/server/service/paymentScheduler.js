const { paymentModel } = require("../model/paymentModel.js");
const { isPaymentCaptured } = require("./razorpayService.js");

// Check and update pending payments
const checkPendingPayments = async () => {
  console.log("Running pending payment check...");
  
  try {
    // Get pending payments older than 5 minutes
    paymentModel.getPendingPaymentsOlderThan(5, async (err, payments) => {
      if (err) {
        // ignore missing-table errors during early startup
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('Pending payment check skipped, table not yet present');
          return;
        }
        console.error("Error fetching pending payments:", err);
        return;
      }
      
      if (!payments || payments.length === 0) {
        console.log("No pending payments to check");
        return;
      }
      
      console.log(`Found ${payments.length} pending payments to verify`);
      
      for (const payment of payments) {
        try {
          if (payment.razorpayOrderId) {
            const result = await isPaymentCaptured(payment.razorpayPaymentId);
            if (result.captured) {
              paymentModel.updatePaymentStatus(
                payment.razorpayOrderId,
                "Paid",
                payment.razorpayPaymentId,
                payment.razorpayPaymentId,
                () => {} // ignore callback errors here
              );
              console.log(`Payment ${payment.razorpayOrderId} marked Paid by scheduler`);
            }
          }
        } catch (error) {
          console.error(`Error checking payment ${payment.razorpayOrderId}:`, error);
        }
      }
    });
  } catch (error) {
    console.error("Error in checkPendingPayments:", error);
  }
};

// Cleanup expired pending orders (older than 30 minutes)
const cleanupExpiredOrders = async () => {
  console.log("Running expired order cleanup...");
  
  try {
    paymentModel.getPendingPaymentsOlderThan(30, (err, payments) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('Expired order cleanup skipped, table not yet present');
          return;
        }
        console.error("Error fetching expired payments:", err);
        return;
      }
      
      if (!payments || payments.length === 0) {
        console.log("No expired orders to cleanup");
        return;
      }
      
      console.log(`Found ${payments.length} expired orders to cleanup`);
      
      for (const payment of payments) {
        paymentModel.updatePaymentStatus(
          payment.razorpayOrderId,
          'Failed',
          null,
          null,
          () => {}
        );
        console.log(`Payment ${payment.razorpayOrderId} expired by scheduler`);
      }
    });
  } catch (error) {
    console.error("Error in cleanupExpiredOrders:", error);
  }
};

// Start the scheduler
const startPaymentScheduler = () => {
  // Check pending payments every 5 minutes
  setInterval(checkPendingPayments, 5 * 60 * 1000);
  
  // Cleanup expired orders every 15 minutes
  setInterval(cleanupExpiredOrders, 15 * 60 * 1000);
  
  console.log("Payment scheduler started");
  
  // Run initial check after 30 seconds
  setTimeout(checkPendingPayments, 30000);
  setTimeout(cleanupExpiredOrders, 45000);
};

module.exports = {
  checkPendingPayments,
  cleanupExpiredOrders,
  startPaymentScheduler,
};
