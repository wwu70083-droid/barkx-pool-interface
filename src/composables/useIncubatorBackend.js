// BarkX Incubator backend client. Mirrors useElitePoolBackend's
// relay-or-fetch transport so it works both in the production gateway
// (Coco self-service) and via direct fetch in dev/testnet. Talks to the
// incubator backend at VITE_BARKX_INCUBATOR_API_BASE_URL.

import { USE_SELF_SERVICE, ensureServiceReady, sendServiceMessage } from "@/composables/useRelayService";
import { useMainStore } from "@/store";

const env = import.meta.env ?? {};
const API_BASE = env.VITE_BARKX_INCUBATOR_API_BASE_URL || "";
const SUCCESS_CODE = Number(env.VITE_BARKX_INCUBATOR_API_SUCCESS_CODE ?? 200);
const SELF_SERVICE_FALLBACK_TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Self Service timeout after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function normalizeFetchApiBase() {
  const base = typeof API_BASE === "string" ? API_BASE.replace(/\/+$/, "") : "";
  return base;
}

const FETCH_API_BASE = normalizeFetchApiBase();

function createIncubatorError(message, code, status) {
  const error = new Error(message || code || `Incubator API error ${status || ""}`.trim());
  error.code = code || "";
  error.responseCode = code || status;
  error.status = status;
  error.isBusinessError = !!code;
  return error;
}

// The incubator backend returns plain JSON (no {code,message,data}
// envelope) for /incubator/* — pass it through. Tolerate an envelope too.
function extractResponseData(json, status = 200) {
  if (json && typeof json === "object" && json.code !== undefined && json.data !== undefined) {
    if (json.code !== 0 && json.code !== 200) {
      throw createIncubatorError(json.message, json.code, status);
    }
    return json.data;
  }
  return json;
}

async function requestViaFetch(path, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(`${FETCH_API_BASE}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw createIncubatorError(json?.message, json?.code, res.status);
  }
  return extractResponseData(json, res.status);
}

async function requestViaCoco(path, options = {}) {
  const cocoPath = path;
  const method = (options.method || "GET").toUpperCase();
  const data = options.body
    ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body)
    : null;
  await ensureServiceReady();
  const result = await sendServiceMessage(method, cocoPath, data, options.headers || {}, "", SUCCESS_CODE);
  return extractResponseData(result);
}

async function request(path, options = {}) {
  const store = useMainStore();
  const method = (options.method || "GET").toUpperCase();
  store.startBackendRequestPending();
  try {
    if (USE_SELF_SERVICE) {
      try {
        const coco = requestViaCoco(path, options);
        return method === "GET" ? await withTimeout(coco, SELF_SERVICE_FALLBACK_TIMEOUT_MS) : await coco;
      } catch (error) {
        if (method === "GET" && API_BASE) return requestViaFetch(path, options);
        throw error;
      }
    }
    return requestViaFetch(path, options);
  } finally {
    store.finishBackendRequestPending();
  }
}

// ── Public reads ──
export function getIncubatorProfile(address) {
  return request(`/incubator/profile/${address}`);
}

export function getIncubatorConfig() {
  return request("/incubator/config");
}

export function getIncubatorLeaderboard() {
  return request("/incubator/leaderboard").then((d) => d?.leaderboard ?? []);
}

// ── Convert signature requests ──
// Wallet-authenticated (audit #1): the caller must first fetch a one-time
// challenge and personal_sign its `message`, then submit { address,
// signature, challengeNonce } so the backend can prove wallet ownership
// before issuing a convert approval.
export function getConvertChallenge(address) {
  return request(`/incubator/convert/challenge/${address}`);
}

export function requestNormalConvertSignature({ address, signature, challengeNonce }) {
  return request("/incubator/convert/normal", {
    method: "POST",
    body: JSON.stringify({ address, signature, challengeNonce }),
  });
}

export function requestLeaderConvertSignature({ address, signature, challengeNonce }) {
  return request("/incubator/convert/leader", {
    method: "POST",
    body: JSON.stringify({ address, signature, challengeNonce }),
  });
}
