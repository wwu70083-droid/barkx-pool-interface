// BarkX Incubator backend client. Mirrors useElitePoolBackend's
// relay-or-fetch transport so it works both in the production gateway
// (Coco self-service) and via direct fetch in dev/testnet. Talks to the
// incubator backend at VITE_BARKX_INCUBATOR_API_BASE_URL.

import { USE_SELF_SERVICE, ensureServiceReady, sendServiceMessage } from "@/composables/useRelayService";
import { useMainStore } from "@/store";

const env = import.meta.env ?? {};
const isGatewayMode = env.MODE === "production" || env.MODE === "pre";
const API_BASE = env.VITE_BARKX_INCUBATOR_API_BASE_URL || "";
const GATEWAY_PREFIX = isGatewayMode ? "/incubator" : "";
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
  const prefix = typeof GATEWAY_PREFIX === "string" ? GATEWAY_PREFIX.replace(/\/+$/, "") : "";
  if (!prefix) return base;
  if (!base) return prefix;
  return base.endsWith(prefix) ? base : `${base}${prefix}`;
}

const FETCH_API_BASE = normalizeFetchApiBase();

// The incubator backend returns plain JSON (no {code,message,data}
// envelope) for /incubator/* — pass it through. Tolerate an envelope too.
function extractResponseData(json) {
  if (json && typeof json === "object" && json.code !== undefined && json.data !== undefined) {
    if (json.code !== 0 && json.code !== 200) {
      const err = new Error(json.message || `Incubator API error code=${json.code}`);
      err.responseCode = json.code;
      throw err;
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
    const err = new Error(json?.message || json?.code || `HTTP ${res.status}`);
    err.responseCode = json?.code || res.status;
    throw err;
  }
  return extractResponseData(json);
}

async function requestViaCoco(path, options = {}) {
  const prefix = typeof GATEWAY_PREFIX === "string" ? GATEWAY_PREFIX.replace(/\/+$/, "") : "";
  const cocoPath = prefix ? `${prefix}${path}` : path;
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
export function requestNormalConvertSignature(address) {
  return request("/incubator/convert/normal", { method: "POST", body: JSON.stringify({ address }) });
}

export function requestLeaderConvertSignature(address) {
  return request("/incubator/convert/leader", { method: "POST", body: JSON.stringify({ address }) });
}
