/**
 * Backend API service for BarkX VIP Pool (SubPool).
 *
 * API docs: docs/v-API.md
 *
 * Key differences from main pool backend:
 * - Response code: 0 = success (not 200)
 * - Path prefix: /api/user (not /api/users)
 * - Claim requires depositIds[]
 */
import { USE_SELF_SERVICE, ensureServiceReady, sendServiceMessage } from "@/composables/useRelayService";
import { useMainStore } from "@/store";

const env = import.meta.env ?? {};
const API_BASE = env.VITE_BARKX_SUB_POOL_API_BASE_URL || env.VITE_API_BASE_URL || "";
const VPOOL_GATEWAY_PREFIX = "/vpool";
const SELF_SERVICE_FALLBACK_TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Self Service timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}
// pre/production gateway only; development/test use the pool-specific base URL directly.
const USE_FETCH_GATEWAY = env.MODE === "production" || env.MODE === "pre";

function normalizeFetchApiBase() {
  const base = typeof API_BASE === "string" ? API_BASE.replace(/\/+$/, "") : "";

  if (!USE_FETCH_GATEWAY) {
    // Dev mode, no gateway prefix
    return base;
  }

  if (!base) return VPOOL_GATEWAY_PREFIX;
  if (base.endsWith(VPOOL_GATEWAY_PREFIX)) return base;
  return `${base}${VPOOL_GATEWAY_PREFIX}`;
}

const FETCH_API_BASE = normalizeFetchApiBase();

async function requestViaFetch(path, options = {}) {
  const url = `${FETCH_API_BASE}${path}`;
  console.log("[SubPoolBackend] fetch →", options.method || "GET", url);

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await res.json();

  console.log("[SubPoolBackend] fetch ←", json);

  if (json.code !== 0) {
    const err = new Error(json.message || `vPool API error code=${json.code}`);
    err.responseCode = json.code;
    throw err;
  }
  return json.data;
}

async function requestViaCoco(path, options = {}) {
  const cocoPath = USE_FETCH_GATEWAY ? `${VPOOL_GATEWAY_PREFIX}${path}` : path;
  const method = (options.method || "GET").toUpperCase();
  const data = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : null;

  console.log("[SubPoolBackend] coco →", method, cocoPath, data);

  try {
    await ensureServiceReady();
  } catch (error) {
    console.error("[SubPoolBackend] coco ✗ ensureServiceReady failed", { url: cocoPath, message: error?.message, code: error?.code });
    throw error;
  }

  let result;
  try {
    result = await sendServiceMessage(method, cocoPath, data, options.headers || {}, "", 0);
    console.log("[SubPoolBackend] coco ←", result);
  } catch (error) {
    console.error("[SubPoolBackend] coco ✗ sendServiceMessage failed", { url: cocoPath, message: error?.message, code: error?.code, responseCode: error?.responseCode });
    throw error;
  }

  // sendServiceMessage returns raw backend response
  if (result && typeof result === "object" && result.code !== undefined) {
    if (result.code !== 0) {
      const err = new Error(result.message || `vPool API error code=${result.code}`);
      err.responseCode = result.code;
      throw err;
    }
    return result.data;
  }
  return result;
}

async function request(path, options = {}) {
  const store = useMainStore();
  const method = (options.method || "GET").toUpperCase();
  store.startBackendRequestPending();
  try {
    if (USE_SELF_SERVICE) {
      try {
        const cocoRequest = requestViaCoco(path, options);
        if (method === "GET") {
          return await withTimeout(cocoRequest, SELF_SERVICE_FALLBACK_TIMEOUT_MS);
        }
        return await cocoRequest;
      } catch (error) {
        const canFallback = method === "GET" && API_BASE;
        console.warn("[SubPoolBackend] self-service fallback → fetch", {
          method,
          path,
          reason: error?.message || String(error),
          responseCode: error?.responseCode,
          canFallback,
          isSelfServiceTimeout: !!error?.isSelfServiceTimeout,
          isRelayError: !!error?.isRelayError,
          isBusinessError: !!error?.isBusinessError,
          isPreflightError: !!error?.isPreflightError,
        });
        if (canFallback) {
          return requestViaFetch(path, options);
        }
        throw error;
      }
    }
    return requestViaFetch(path, options);
  } finally {
    store.finishBackendRequestPending();
  }
}

/**
 * GET /api/user/:address
 * Returns { address, bonusRate, penaltyRate, pendingRewards, totalClaimed, nonce }
 */
export function getSubPoolUserInfo(address) {
  return request(`/api/user/${address}`);
}

/**
 * GET /api/user/:address/deposits
 * Returns array of unlocked, non-completed deposits (no pagination).
 */
export function getSubPoolDeposits(address) {
  return request(`/api/user/${address}/deposits`);
}

/**
 * POST /api/claim/sign
 * Returns { amount, nonce, deadline, signature }
 */
export function requestSubPoolClaimSignature(address, depositIds) {
  const body = { address };
  if (depositIds && depositIds.length > 0) body.depositIds = depositIds;
  return request("/api/claim/sign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST /api/claim/confirm
 * Marks deposit orders as "waiting_onchain" after tx submitted.
 * Returns { updated }
 */
export function claimConfirm(address, depositIds) {
  return request("/api/claim/confirm", {
    method: "POST",
    body: JSON.stringify({ address, depositIds }),
  });
}

/**
 * GET /api/pool/info
 * Returns { apr, dailyEmission, emissionRatio }
 */
export function getSubPoolInfo() {
  return request("/api/pool/info");
}

/**
 * GET /api/settlement/history/:address
 * Returns { total, page, pageSize, records }
 */
export function getSubPoolSettlementHistory(address, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  return request(`/api/settlement/history/${address}?${params}`);
}
