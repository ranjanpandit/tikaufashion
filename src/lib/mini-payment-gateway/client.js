const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export function loadPaymentGatewayScript(providerConfig = {}) {
  const provider = providerConfig?.provider;

  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);

    if (provider !== "razorpay") {
      return resolve(true);
    }

    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement("script");
    script.src = providerConfig?.scriptUrl || RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function openPaymentGatewayCheckout({ providerConfig = {}, options = {}, paymentUrl }) {
  const provider = providerConfig?.provider;

  if (typeof window === "undefined") {
    throw new Error("Payment checkout is only available in the browser");
  }

  if (provider === "razorpay") {
    if (!window.Razorpay) {
      throw new Error("Payment provider SDK not loaded");
    }

    const razorpay = new window.Razorpay(options);

    if (typeof options.onPaymentFailed === "function") {
      razorpay.on("payment.failed", options.onPaymentFailed);
    }

    razorpay.open();
    return razorpay;
  }

  if (provider === "openmoney") {
    const redirectUrl = paymentUrl || options?.url || options?.paymentUrl;

    if (!redirectUrl) {
      throw new Error("OpenMoney payment URL missing");
    }

    window.location.assign(redirectUrl);
    return null;
  }

  throw new Error(`Unsupported payment provider: ${provider}`);
}
