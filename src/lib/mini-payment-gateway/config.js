const ACTIVE_PAYMENT_PROVIDER = String(
  process.env.default_pg ||
    process.env.DEFAULT_PG ||
    process.env.NEXT_PUBLIC_DEFAULT_PG ||
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ||
    "razorpay"
)
  .trim()
  .toLowerCase();

const PAYMENT_GATEWAY_NAME =
  process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_NAME || "Tikau Fashion";

const PAYMENT_PROVIDERS = {
  razorpay: {
    provider: "razorpay",
    providerLabel: "Razorpay",
    scriptUrl: "https://checkout.razorpay.com/v1/checkout.js",
    checkoutKey:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
  },
  openmoney: {
    provider: "openmoney",
    providerLabel: "OpenMoney",
    checkoutMode: "redirect",
  },
};

export function getActivePaymentProvider() {
  const config = PAYMENT_PROVIDERS[ACTIVE_PAYMENT_PROVIDER];

  if (!config) {
    throw new Error(`Unsupported payment provider: ${ACTIVE_PAYMENT_PROVIDER}`);
  }

  return config;
}

export function getPaymentGatewayPublicConfig() {
  const provider = getActivePaymentProvider();

  return {
    gatewayName: PAYMENT_GATEWAY_NAME,
    ...provider,
  };
}

export function getMiniPaymentPlatformConfig() {
  const baseUrl = process.env.MINI_PAYMENT_GATEWAY_BASE_URL || "";
  const apiKey = process.env.MINI_PAYMENT_GATEWAY_API_KEY || "";
  const apiSecret = process.env.MINI_PAYMENT_GATEWAY_API_SECRET || "";

  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error(
      "Mini payment platform credentials are missing. Set MINI_PAYMENT_GATEWAY_BASE_URL, MINI_PAYMENT_GATEWAY_API_KEY, and MINI_PAYMENT_GATEWAY_API_SECRET."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    apiSecret,
  };
}

export function hasMiniPaymentPlatformConfig() {
  return Boolean(
    process.env.MINI_PAYMENT_GATEWAY_BASE_URL &&
      process.env.MINI_PAYMENT_GATEWAY_API_KEY &&
      process.env.MINI_PAYMENT_GATEWAY_API_SECRET
  );
}

export function getOpenMoneyConfig() {
  const baseUrl = process.env.OPENMONEY_API_BASE_URL || "";
  const mid = process.env.OPENMONEY_MID || "";
  const email = process.env.OPENMONEY_EMAIL || "";
  const secretKey = process.env.OPENMONEY_API_SECRET_KEY || "";

  if (!baseUrl || !mid || !email || !secretKey) {
    throw new Error(
      "OpenMoney credentials are missing. Set OPENMONEY_API_BASE_URL, OPENMONEY_MID, OPENMONEY_EMAIL, and OPENMONEY_API_SECRET_KEY."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    mid,
    email,
    secretKey,
  };
}

export function getPayoutWebhookConfig() {
  const webhookUrl = process.env.PAYOUT_WEBHOOK_URL || "";
  const defaultClientId = process.env.PAYOUT_CLIENT_ID || "";

  if (!webhookUrl) return null;

  return {
    webhookUrl: webhookUrl.replace(/\/$/, ""),
    defaultClientId: String(defaultClientId || ""),
  };
}
