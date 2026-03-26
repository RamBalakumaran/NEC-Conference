jest.mock("../model/paymentModel.js", () => ({
  paymentModel: {
    getPendingPaymentsOlderThan: jest.fn(),
    updatePaymentStatus: jest.fn(),
  },
}));

jest.mock("../service/razorpayService.js", () => ({
  isPaymentCaptured: jest.fn(),
}));

const { paymentModel } = require("../model/paymentModel.js");
const { isPaymentCaptured } = require("../service/razorpayService.js");
const { checkPendingPayments } = require("../service/paymentScheduler.js");

describe("paymentScheduler", () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("skips pending rows that do not have a Razorpay payment id yet", async () => {
    paymentModel.getPendingPaymentsOlderThan.mockImplementation((minutes, callback) =>
      callback(null, [
        {
          razorpayOrderId: "order_missing_payment_id",
          razorpayPaymentId: null,
          transactionId: null,
        },
      ])
    );

    await checkPendingPayments();

    expect(isPaymentCaptured).not.toHaveBeenCalled();
    expect(paymentModel.updatePaymentStatus).not.toHaveBeenCalled();
  });

  test("uses transactionId as a fallback payment id when verifying pending rows", async () => {
    paymentModel.getPendingPaymentsOlderThan.mockImplementation((minutes, callback) =>
      callback(null, [
        {
          razorpayOrderId: "order_with_transaction",
          razorpayPaymentId: null,
          transactionId: "pay_123",
        },
      ])
    );
    isPaymentCaptured.mockResolvedValue({ captured: true });

    await checkPendingPayments();

    expect(isPaymentCaptured).toHaveBeenCalledWith("pay_123");
    expect(paymentModel.updatePaymentStatus).toHaveBeenCalledWith(
      "order_with_transaction",
      "Paid",
      "pay_123",
      "pay_123",
      expect.any(Function)
    );
  });
});
