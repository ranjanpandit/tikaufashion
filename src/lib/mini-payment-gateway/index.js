import crypto from "crypto";
import Razorpay from "razorpay";
import {
  getActivePaymentProvider,
  getMiniPaymentPlatformConfig,
  getOpenMoneyConfig,
  getPayoutWebhookConfig,
  getPaymentGatewayPublicConfig,
} from "./config";

const PAYMENT_DEBUG_LOGS = String(process.env.PAYMENT_DEBUG_LOGS || "").toLowerCase() === "true";

function maskSecret(value = "") {
  const s = String(value || "");
  if (!s) return "";
  if (s.length <= 8) return "*".repeat(s.length);
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
}

function maskBearer(token = "") {
  const s = String(token || "");
  if (!s) return "";
  if (s.length <= 14) return `Bearer ${"*".repeat(s.length)}`;
  return `Bearer ${s.slice(0, 8)}***${s.slice(-6)}`;
}

function debugLog(label, payload) {
  if (!PAYMENT_DEBUG_LOGS) return;
  console.log(`[PAYMENT DEBUG] ${label}`, payload);
}

function getRazorpayClient() {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys missing");
  }

  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export function getPaymentGatewayMeta() {
  return getPaymentGatewayPublicConfig();
}

async function readJsonResponse(response) {
  const rawText = await response.text();

  if (!rawText) {
    return { data: null, rawText: "" };
  }

  try {
    return { data: JSON.parse(rawText), rawText };
  } catch {
    return { data: null, rawText };
  }
}

function buildNonJsonError(prefix, response, rawText = "") {
  const preview = String(rawText || "").replace(/\s+/g, " ").trim().slice(0, 120);
  return new Error(
    `${prefix}. Upstream returned non-JSON response (status ${response.status}). Preview: ${preview || "empty body"}`
  );
}

function formatOpenMoneyAmount(amountInMinorUnits) {
  const rupees = Number(amountInMinorUnits || 0) / 100;
  if (!Number.isFinite(rupees) || rupees <= 0) {
    throw new Error("Invalid amount for OpenMoney intent order");
  }
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

function resolveOpenMoneyToken(payload = {}) {
  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    payload?.jwt ||
    payload?.data?.token ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    ""
  );
}

function resolveOpenMoneyPaymentUrl(payload = {}) {
  return (
    payload?.qrString ||
    payload?.paymentUrl ||
    payload?.payment_url ||
    payload?.redirectUrl ||
    payload?.redirect_url ||
    payload?.url ||
    payload?.checkoutUrl ||
    payload?.checkout_url ||
    payload?.data?.qrString ||
    payload?.data?.paymentUrl ||
    payload?.data?.payment_url ||
    payload?.data?.redirectUrl ||
    payload?.data?.redirect_url ||
    ""
  );
}

function resolveOpenMoneyOrderData(payload = {}) {
  return payload?.data && typeof payload.data === "object" ? payload.data : payload;
}

function isOpenMoneySuccess(payload = {}) {
  const status = Number(payload?.status);
  const apiStatus = String(payload?.data?.api_status || payload?.api_status || "")
    .trim()
    .toLowerCase();
  return status === 1 || apiStatus === "success";
}

function normalizeOpenMoneyStatusValue(value) {
  const str = String(value || "")
    .trim()
    .toLowerCase();

  if (!str) return "";

  if (
    [
      "1",
      "paid",
      "success",
      "successful",
      "completed",
      "captured",
      "approved",
    ].includes(str)
  ) {
    return "PAID";
  }

  if (
    [
      "2",
      "pending",
      "processing",
      "inprocess",
      "initiated",
      "created",
      "waiting",
    ].includes(str)
  ) {
    return "PENDING";
  }

  if (
    [
      "3",
      "failed",
      "failure",
      "cancelled",
      "canceled",
      "rejected",
      "declined",
      "expired",
    ].includes(str)
  ) {
    return "FAILED";
  }

  return "";
}

function mapOpenMoneyStatusFromPayload(payload = {}) {
  const data = resolveOpenMoneyOrderData(payload);
  const candidates = [
    payload?.status_id,
    data?.status_id,
    payload?.status,
    data?.status,
    payload?.transaction_status,
    data?.transaction_status,
    payload?.payment_status,
    data?.payment_status,
    payload?.api_status,
    data?.api_status,
    payload?.message,
    data?.message,
  ];

  for (const value of candidates) {
    const mapped = normalizeOpenMoneyStatusValue(value);
    if (mapped) return mapped;
  }

  if (isOpenMoneySuccess(payload)) {
    return "PAID";
  }

  return "PENDING";
}

function extractOpenMoneyUtr(payload = {}) {
  const data = resolveOpenMoneyOrderData(payload);
  return (
    data?.utr ||
    payload?.utr ||
    data?.txn_id ||
    payload?.txn_id ||
    data?.transaction_id ||
    payload?.transaction_id ||
    data?.payment_id ||
    payload?.payment_id ||
    ""
  );
}

async function generateOpenMoneyToken() {
  const config = getOpenMoneyConfig();
  const url = `${config.baseUrl}/api/Auth/generate-token`;
  const requestBody = {
    mid: config.mid,
    email: config.email,
    secretkey: config.secretKey,
  };

  debugLog("OpenMoney token request", {
    method: "POST",
    url,
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
    body: {
      ...requestBody,
      secretkey: maskSecret(requestBody.secretkey),
    },
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  const { data, rawText } = await readJsonResponse(response);
  debugLog("OpenMoney token response", {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    data,
    rawText,
  });

  if (!data) {
    throw buildNonJsonError("Failed to generate OpenMoney token", response, rawText);
  }

  const token = resolveOpenMoneyToken(data);

  if (!response.ok || !token) {
    throw new Error(data?.message || data?.error || "Failed to generate OpenMoney token");
  }

  return token;
}

export async function createGatewayOrder({
  amount,
  currency = "INR",
  receipt,
  customer = {},
}) {
  const provider = getActivePaymentProvider();

  if (provider.provider === "razorpay") {
    const razorpay = getRazorpayClient();
    return razorpay.orders.create({
      amount,
      currency,
      receipt,
    });
  }

  if (provider.provider === "openmoney") {
    const config = getOpenMoneyConfig();
    const token = await generateOpenMoneyToken();
    const customerMobile = String(customer?.phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    if (!customerMobile) {
      throw new Error("OpenMoney requires a customer mobile number");
    }

    const url = `${config.baseUrl}/api/Payin/create-order`;
    const requestBody = {
      RefID: receipt || `OM-${Date.now()}`,
      Amount: formatOpenMoneyAmount(amount),
      Customer_Name: customer?.name || "Customer",
      Customer_Mobile: customerMobile,
      Customer_Email: customer?.email || config.email,
    };

    debugLog("OpenMoney create-order request", {
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: maskBearer(token),
      },
      body: requestBody,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const { data, rawText } = await readJsonResponse(response);
    debugLog("OpenMoney create-order response", {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      rawText,
    });

    if (!data) {
      throw buildNonJsonError("Failed to create OpenMoney order", response, rawText);
    }

    if (!response.ok || !isOpenMoneySuccess(data)) {
      throw new Error(data?.message || data?.error || "Failed to create OpenMoney order");
    }

    const orderData = resolveOpenMoneyOrderData(data);
    const paymentUrl = resolveOpenMoneyPaymentUrl(data);
    if (!paymentUrl) {
      throw new Error("OpenMoney create-order response does not include qrString/payment URL");
    }

    return {
      id:
        orderData?.txn_id ||
        orderData?.ref_id ||
        data?.orderId ||
        data?.order_id ||
        data?.RefID ||
        receipt ||
        null,
      refId: orderData?.ref_id || data?.RefID || receipt || null,
      amount: orderData?.amount || data?.Amount || formatOpenMoneyAmount(amount),
      currency,
      paymentUrl,
      qrString: orderData?.qrString || "",
      txnId: orderData?.txn_id || null,
      txnDate: orderData?.txn_date || null,
      apiStatus: orderData?.api_status || data?.api_status || null,
      raw: data,
    };
  }

  throw new Error(`Provider not implemented: ${provider.provider}`);
}

export async function checkGatewayPaymentStatus({ refId, serviceId = 1 }) {
  const provider = getActivePaymentProvider();

  if (provider.provider !== "openmoney") {
    throw new Error(`Provider not implemented: ${provider.provider}`);
  }

  const config = getOpenMoneyConfig();
  const requestBody = {
    RefId: String(refId || "").trim(),
    Service_Id: String(serviceId || 1),
  };

  if (!requestBody.RefId) {
    throw new Error("RefId is required for status-check");
  }

  const url =
    process.env.OPENMONEY_STATUS_CHECK_URL ||
    `${config.baseUrl}/api/payout/v1/status-check`;

  debugLog("OpenMoney status-check request", {
    method: "POST",
    url,
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  const { data, rawText } = await readJsonResponse(response);

  debugLog("OpenMoney status-check response", {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    data,
    rawText,
  });

  if (!data) {
    throw buildNonJsonError("Failed to check OpenMoney payment status", response, rawText);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Failed to check OpenMoney payment status");
  }

  return {
    status: mapOpenMoneyStatusFromPayload(data),
    utr: extractOpenMoneyUtr(data),
    raw: data,
  };
}

export async function createPlatformOrder({
  amount,
  currency = "INR",
  clientOrderId,
  customer,
  description,
  metadata,
  gatewayCode = "RAZORPAY",
}) {
  const config = getMiniPaymentPlatformConfig();

  const response = await fetch(`${config.baseUrl}/api/platform/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "x-api-secret": config.apiSecret,
    },
    body: JSON.stringify({
      amount,
      currency,
      clientOrderId,
      customerName: customer?.name || "",
      customerEmail: customer?.email || "",
      customerPhone: customer?.phone || "",
      description: description || "",
      gatewayCode,
      metadata,
    }),
    cache: "no-store",
  });

  const { data, rawText } = await readJsonResponse(response);
  if (!data) {
    throw buildNonJsonError("Failed to create platform order", response, rawText);
  }

  if (!response.ok) {
    throw new Error(data?.error || "Failed to create platform order");
  }

  return data;
}

export async function confirmPlatformOrderPayment({
  platformOrderId,
  gatewayCode = "RAZORPAY",
  gatewayOrderId,
  gatewayPaymentId,
  signature,
  payerName,
  payerReference,
  description,
  amount,
}) {
  const config = getMiniPaymentPlatformConfig();

  const response = await fetch(
    `${config.baseUrl}/api/platform/orders/${platformOrderId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "x-api-secret": config.apiSecret,
      },
      body: JSON.stringify({
        gatewayCode,
        gatewayOrderId,
        gatewayPaymentId,
        signature,
        payerName: payerName || "",
        payerReference: payerReference || "",
        description: description || "",
        amount,
      }),
      cache: "no-store",
    }
  );

  const { data, rawText } = await readJsonResponse(response);
  if (!data) {
    throw buildNonJsonError("Failed to confirm platform payment", response, rawText);
  }

  if (!response.ok) {
    throw new Error(data?.error || "Failed to confirm platform payment");
  }

  return data;
}

export async function syncPlatformOrderStatus({
  platformOrderId,
  gatewayCode = "RAZORPAY",
  status,
  gatewayOrderId,
  gatewayPaymentId,
  payerName,
  payerReference,
  description,
  amount,
  reason,
}) {
  const config = getMiniPaymentPlatformConfig();

  const response = await fetch(
    `${config.baseUrl}/api/platform/orders/${platformOrderId}/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "x-api-secret": config.apiSecret,
      },
      body: JSON.stringify({
        gatewayCode,
        status,
        gatewayOrderId: gatewayOrderId || "",
        gatewayPaymentId: gatewayPaymentId || "",
        payerName: payerName || "",
        payerReference: payerReference || "",
        description: description || "",
        amount,
        reason: reason || "",
      }),
      cache: "no-store",
    }
  );

  const { data, rawText } = await readJsonResponse(response);
  if (!data) {
    throw buildNonJsonError("Failed to sync platform order status", response, rawText);
  }

  if (!response.ok) {
    throw new Error(data?.error || "Failed to sync platform order status");
  }

  return data;
}

export function verifyGatewayPaymentSignature({
  providerOrderId,
  providerPaymentId,
  signature,
}) {
  const provider = getActivePaymentProvider();

  if (provider.provider === "razorpay") {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest("hex");

    return expected === signature;
  }

  throw new Error(`Provider not implemented: ${provider.provider}`);
}

export async function fetchGatewayPayment(providerPaymentId) {
  const provider = getActivePaymentProvider();

  if (provider.provider === "razorpay") {
    const razorpay = getRazorpayClient();
    return razorpay.payments.fetch(providerPaymentId);
  }

  throw new Error(`Provider not implemented: ${provider.provider}`);
}

export function verifyGatewayWebhookSignature({ rawBody, signature }) {
  const provider = getActivePaymentProvider();

  if (provider.provider === "razorpay") {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    return expected === signature;
  }

  throw new Error(`Provider not implemented: ${provider.provider}`);
}

export function buildGatewayOrderRecord({
  platformOrderId = null,
  platformGatewayCode = null,
  providerOrderId = null,
  providerPaymentId = null,
  signature = null,
  receipt = null,
  status = "PENDING",
  verifiedAt = null,
  syncStatus = "PENDING",
  syncMessage = null,
}) {
  const meta = getPaymentGatewayMeta();

  return {
    gateway: meta.gatewayName,
    provider: meta.provider,
    providerLabel: meta.providerLabel,
    platformOrderId,
    platformGatewayCode,
    providerOrderId,
    providerPaymentId,
    signature,
    receipt,
    status,
    verifiedAt,
    syncStatus,
    syncMessage,
  };
}

export async function sendPayoutWebhook({
  statusId,
  amount,
  utr,
  clientId,
  message,
}) {
  const config = getPayoutWebhookConfig();
  if (!config?.webhookUrl) {
    return { skipped: true, reason: "PAYOUT_WEBHOOK_URL not configured" };
  }

  const resolvedClientId = String(clientId || config.defaultClientId || "").replace(
    /\D/g,
    ""
  );

  if (!resolvedClientId) {
    throw new Error(
      "Payout webhook client_id is required. Set PAYOUT_CLIENT_ID or pass a numeric clientId."
    );
  }

  const formData = new FormData();
  formData.append("status_id", String(statusId || ""));
  formData.append("amount", String(amount || ""));
  formData.append("utr", String(utr || ""));
  formData.append("client_id", resolvedClientId);
  formData.append("message", String(message || ""));

  debugLog("Payout webhook request", {
    url: config.webhookUrl,
    payload: {
      status_id: String(statusId || ""),
      amount: String(amount || ""),
      utr: String(utr || ""),
      client_id: resolvedClientId,
      message: String(message || ""),
    },
  });

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const { data, rawText } = await readJsonResponse(response);

  debugLog("Payout webhook response", {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    data,
    rawText,
  });

  if (!response.ok) {
    throw new Error(
      `Payout webhook failed with status ${response.status}. ${
        data?.message || data?.error || rawText || "No response message"
      }`
    );
  }

  return { success: true, data, rawText };
}
