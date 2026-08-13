import { useMainStore } from "@/store";
import { USE_SELF_SERVICE, ensureServiceReady, sendServiceMessage } from "@/composables/useRelayService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const USE_FETCH_GATEWAY =
  import.meta.env.MODE !== "development"
  && import.meta.env.MODE !== "test";
const FETCH_GATEWAY_PREFIX = "/pool";
const FETCH_API_BASE = normalizeFetchApiBase(API_BASE);
const SELF_SERVICE_FALLBACK_TIMEOUT_MS = 10000;
const DEBUG_BACKEND_LOGS = import.meta.env.DEV;
let requestSeq = 0;

function backendDebug(...args) {
  if (DEBUG_BACKEND_LOGS) {
    console.log(...args);
  }
}

function summarizeBackendError(error) {
  return {
    message: error?.message || String(error),
    code: error?.code,
    responseCode: error?.responseCode,
    isBusinessError: !!error?.isBusinessError,
    isRelayError: !!error?.isRelayError,
    isPreflightError: !!error?.isPreflightError,
    isSelfServiceTimeout: !!error?.isSelfServiceTimeout,
  };
}

function createBackendApiError(message, responseCode) {
  const error = new Error(message || `API error ${responseCode}`);
  error.responseCode = responseCode;
  error.isBusinessError = true;
  return error;
}

function normalizeFetchApiBase(base) {
  const normalizedBase = typeof base === "string" ? base.replace(/\/+$/, "") : "";

  if (!USE_FETCH_GATEWAY) {
    if (!normalizedBase) {
      return "";
    }

    if (normalizedBase === FETCH_GATEWAY_PREFIX) {
      return "";
    }

    if (normalizedBase.endsWith(FETCH_GATEWAY_PREFIX)) {
      return normalizedBase.slice(0, -FETCH_GATEWAY_PREFIX.length);
    }

    return normalizedBase;
  }

  if (!normalizedBase) {
    return FETCH_GATEWAY_PREFIX;
  }

  if (normalizedBase === FETCH_GATEWAY_PREFIX || normalizedBase.endsWith(FETCH_GATEWAY_PREFIX)) {
    return normalizedBase;
  }

  return `${normalizedBase}${FETCH_GATEWAY_PREFIX}`;
}

function resolveFetchUrl(path) {
  return `${FETCH_API_BASE}${path}`;
}

function createRequestTrace(method, url, transport) {
  requestSeq += 1;
  return {
    id: `${transport}-${requestSeq}`,
    method,
    url,
    transport,
  };
}

function getQueryParams(url) {
  if (typeof url !== "string" || !url) return {};

  try {
    const parsed = new URL(url, "http://localhost");
    return Object.fromEntries(parsed.searchParams.entries());
  } catch (error) {
    console.warn("[Backend] getQueryParams failed:", url, error);
    return {};
  }
}

function parseRequestBody(body) {
  if (!body) return null;
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function createTimeoutError(method, url, timeoutMs) {
  const error = new Error(`Self Service timeout after ${timeoutMs}ms`);
  error.code = "SELF_SERVICE_TIMEOUT";
  error.method = method;
  error.url = url;
  error.timeoutMs = timeoutMs;
  error.isSelfServiceTimeout = true;
  return error;
}

function withTimeout(promise, timeoutMs, createError) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(typeof createError === "function" ? createError() : createError);
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function isGetMethod(method) {
  return (method || "GET").toUpperCase() === "GET";
}

function shouldFallbackToFetch(method, error) {
  if (!API_BASE) return false;
  if (!USE_SELF_SERVICE) return false;
  if (error?.isBusinessError) return false;
  if (error?.responseCode === 400 || error?.responseCode === 401 || error?.responseCode === 404 || error?.responseCode === 422) {
    return false;
  }
  if (isGetMethod(method)) {
    return true;
  }
  return !!error?.isPreflightError;
}

async function requestViaFetch(path, options = {}, method = "GET", fallbackMeta = null) {
  const url = resolveFetchUrl(path);
  const trace = createRequestTrace(method, url, fallbackMeta ? "fetch-fallback" : "fetch");
  const params = getQueryParams(url);

  backendDebug(`[Backend][${trace.id}] request →`, {
    method: trace.method,
    transport: trace.transport,
    url: trace.url,
    params,
    fallback: fallbackMeta,
  });

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const json = await res.json();

    backendDebug(`[Backend][${trace.id}] request ←`, {
      status: res.status,
      ok: res.ok,
      url: trace.url,
      params,
      fallback: fallbackMeta,
      resultCode: json?.code,
    });

    if (json.code !== 200) {
      throw createBackendApiError(json.message, json.code);
    }
    return json.data;
  } catch (error) {
    console.error(`[Backend][${trace.id}] request ✗`, {
      url: trace.url,
      fallback: fallbackMeta,
      ...summarizeBackendError(error),
    });
    throw error;
  }
}

async function request(path, options = {}) {
  const store = useMainStore();
  const method = (options.method || "GET").toUpperCase();
  const fetchUrl = resolveFetchUrl(path);

  store.startBackendRequestPending();

  try {
    if (USE_SELF_SERVICE) {
      const fallbackTrace = createRequestTrace(method, fetchUrl, "fallback-controller");
      const selfServiceRequest = requestViaCoco(path, options, method);

      try {
        if (isGetMethod(method)) {
          return await withTimeout(
            selfServiceRequest,
            SELF_SERVICE_FALLBACK_TIMEOUT_MS,
            () => createTimeoutError(method, path, SELF_SERVICE_FALLBACK_TIMEOUT_MS),
          );
        }

        return await selfServiceRequest;
      } catch (error) {
        if (!shouldFallbackToFetch(method, error)) {
          throw error;
        }

        console.warn(`[Backend][${fallbackTrace.id}] self-service fallback → fetch`, {
          method,
          path: fetchUrl,
          reason: error?.message || String(error),
          responseCode: error?.responseCode,
          isSelfServiceTimeout: !!error?.isSelfServiceTimeout,
          isRelayError: !!error?.isRelayError,
          isBusinessError: !!error?.isBusinessError,
          isPreflightError: !!error?.isPreflightError,
        });

        if (!isGetMethod(method)) {
          console.warn(`[Backend][${fallbackTrace.id}] non-GET fallback is only allowed for preflight failures before the self-service request is sent`, {
            method,
            path: fetchUrl,
            reason: error?.message || String(error),
          });
        }

        return requestViaFetch(path, options, method, {
          from: "self-service",
          reason: error?.message || String(error),
          responseCode: error?.responseCode,
          timeoutMs: error?.timeoutMs,
          isPreflightError: !!error?.isPreflightError,
        });
      }
    }

    return requestViaFetch(path, options, method);
  } finally {
    store.finishBackendRequestPending();
  }
}

async function requestViaCoco(path, options = {}, method = "GET") {
  const cocoPath = USE_FETCH_GATEWAY ? `${FETCH_GATEWAY_PREFIX}${path}` : path;
  const data = parseRequestBody(options.body);
  const headers = options.headers || {};
  const trace = createRequestTrace(method, cocoPath, "self-service");
  const params = getQueryParams(cocoPath);

  backendDebug(`[Backend][${trace.id}] request →`, {
    method: trace.method,
    transport: trace.transport,
    url: trace.url,
    params,
    hasBody: data !== null,
  });

  try {
    await ensureServiceReady();
    const result = await sendServiceMessage(method, cocoPath, data, headers, trace.id);
    backendDebug(`[Backend][${trace.id}] request ←`, {
      url: trace.url,
      params,
      type: typeof result,
      isArray: Array.isArray(result),
      keys: result && typeof result === "object" ? Object.keys(result) : [],
      hasCode: result?.code !== undefined,
      hasData: !!result?.data,
      dataType: typeof result?.data,
      dataKeys: result?.data && typeof result.data === "object" ? Object.keys(result.data) : [],
      resultCode: result?.code,
    });

    // sendServiceMessage returns the raw response from backend
    if (result && typeof result === "object" && result.code !== undefined) {
      if (result.code !== 200) {
        throw createBackendApiError(result.message, result.code);
      }
      return result.data;
    }

    return result;
  } catch (error) {
    console.error(`[Backend][${trace.id}] request ✗`, {
      url: trace.url,
      ...summarizeBackendError(error),
    });
    throw error;
  }
}

/**
 * GET /api/users/:address
 * Returns {
 *   address,
 *   stakedLp,
 *   stakedLpByMode: { modeA, modeBLP, modeC },
 *   contractNonce,
 *   totalIncome,
 *   bonusRate,
 *   penaltyRate
 * }
 */
export function getUserInfo(address) {
  return request(`/api/users/${address}`);
}

/**
 * GET /api/users/:address/compound-ratio
 * Returns { compoundRatio, totalCompound, totalClaim }
 */
export function getCompoundRatio(address) {
  return request(`/api/users/${address}/compound-ratio`);
}

/**
 * GET /api/deposits/:address
 * Returns { total, page, pageSize, list }
 */
export function getDeposits(address, { page = 1, pageSize = 20, type } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  if (type) params.set("type", type);
  return request(`/api/deposits/${address}?${params}`);
}

/**
 * GET /api/income/:address
 * Returns { totalIncome, total, list }
 */
export function getIncome(address, { page = 1, pageSize = 30 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  return request(`/api/income/${address}?${params}`);
}

/**
 * POST /api/claim/sign
 * Returns { amount, nonce, deadline, signature }
 */
export function requestClaimSignature(address) {
  return request("/api/claim/sign", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}

/**
 * GET /api/deposits/:address/unlocked
 * Returns array of unlocked deposit records
 */
export function getUnlockedDeposits(address) {
  return request(`/api/deposits/${address}/unlocked`);
}

/**
 * POST /api/withdraw/confirm
 * Marks deposit records as "confirming" before on-chain withdraw
 * @param {string} address
 * @param {Array<{type: string, bucketIdx: number, asset?: string}>} items
 * Returns { updated }
 */
export function withdrawConfirm(address, items) {
  return request("/api/withdraw/confirm", {
    method: "POST",
    body: JSON.stringify({ address, items }),
  });
}

/**
 * GET /api/stats/apr
 * Returns { date, globalEmission, stakedLp, suppliedLp, totalBarkxReserve, stakedBarkxReserve, tvl, apr }
 */
export function getLatestApr() {
  return request("/api/stats/apr");
}

/**
 * GET /api/stats/daily?page=&pageSize=
 * Returns historical APR list
 */
export function getDailyStats({ page = 1, pageSize = 30 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  return request(`/api/stats/daily?${params}`);
}

/**
 * GET /api/stats/compound-config
 * Returns { compoundMedalA, compoundMedalK }
 */
export function getCompoundConfig() {
  return request("/api/stats/compound-config");
}
