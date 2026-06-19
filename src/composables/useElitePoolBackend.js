import { USE_SELF_SERVICE, ensureServiceReady, sendServiceMessage } from "@/composables/useRelayService";
import { useMainStore } from "@/store";

const env = import.meta.env ?? {};
const isGatewayMode = env.MODE === "production" || env.MODE === "pre";
const API_BASE = env.VITE_BARKX_ELITE_API_BASE_URL || "";
const ELITE_GATEWAY_PREFIX = isGatewayMode ? "/elite_pool" : "";
const ELITE_SUCCESS_CODE = Number(env.VITE_BARKX_ELITE_API_SUCCESS_CODE ?? 200);
const SELF_SERVICE_FALLBACK_TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Self Service timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeFetchApiBase() {
  const base = typeof API_BASE === "string" ? API_BASE.replace(/\/+$/, "") : "";
  const prefix = typeof ELITE_GATEWAY_PREFIX === "string" ? ELITE_GATEWAY_PREFIX.replace(/\/+$/, "") : "";

  if (!prefix) {
    return base;
  }

  if (!base) {
    return prefix;
  }

  if (base.endsWith(prefix)) {
    return base;
  }

  return `${base}${prefix}`;
}

const FETCH_API_BASE = normalizeFetchApiBase();

function extractResponseData(json) {
  if (json && typeof json === "object" && json.code !== undefined) {
    if (json.code !== 0 && json.code !== 200) {
      const error = new Error(json.message || `Elite Pool API error code=${json.code}`);
      error.responseCode = json.code;
      throw error;
    }
    return json.data;
  }

  return json?.data ?? json;
}

function normalizeListData(data, nestedKey = "") {
  if (Array.isArray(data)) {
    return data;
  }

  if (nestedKey && data && Array.isArray(data[nestedKey])) {
    return data[nestedKey];
  }

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

function withBearerToken(adminToken) {
  return adminToken
    ? { headers: { Authorization: `Bearer ${adminToken}` } }
    : {};
}

function withAdminOptions(adminToken, options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  };
}

function withJsonBody(method, body, adminToken = "") {
  return withAdminOptions(adminToken, {
    method,
    body: JSON.stringify(body),
  });
}

async function requestViaFetch(path, options = {}) {
  const url = `${FETCH_API_BASE}${path}`;
  const { headers, ...fetchOptions } = options;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json();
  return extractResponseData(json);
}

async function requestViaCoco(path, options = {}) {
  const prefix = typeof ELITE_GATEWAY_PREFIX === "string" ? ELITE_GATEWAY_PREFIX.replace(/\/+$/, "") : "";
  const cocoPath = prefix ? `${prefix}${path}` : path;
  const method = (options.method || "GET").toUpperCase();
  const data = options.body
    ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body)
    : null;

  await ensureServiceReady();
  const result = await sendServiceMessage(method, cocoPath, data, options.headers || {}, "", ELITE_SUCCESS_CODE);
  return extractResponseData(result);
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
        if (!canFallback) {
          throw error;
        }
        return requestViaFetch(path, options);
      }
    }

    return requestViaFetch(path, options);
  } finally {
    store.finishBackendRequestPending();
  }
}

export function getElitePoolUserInfo(address) {
  return request(`/api/users/${address}/info`);
}

export function getElitePoolPendingRewards(address) {
  return request(`/api/users/${address}/pending-rewards`);
}

export function requestElitePoolClaimSignature(address) {
  return request(`/api/users/${address}/claim-signature`);
}

export function getElitePoolUnlockedVN(address) {
  return request(`/api/users/${address}/unlocked-vn`).then(data =>
    normalizeListData(data, "unlockedBuckets"),
  );
}

export function getElitePoolUnlockedLP(address) {
  return request(`/api/users/${address}/unlocked-lp`).then(data =>
    normalizeListData(data, "unlockedBuckets"),
  );
}

export function getElitePoolDepositHistory(address) {
  return request(`/api/users/${address}/deposit-history`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolIncomeHistory(address) {
  return request(`/api/users/${address}/income-history`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolCurrentStats() {
  return request("/api/stats/current");
}

export function getElitePoolInfo() {
  return getElitePoolCurrentStats();
}

export function getElitePoolDailyStats(days = 30) {
  const params = new URLSearchParams({ days: String(days) });
  return request(`/api/stats/daily?${params}`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolHourlyStats(hours = 24, adminToken = "") {
  const params = new URLSearchParams({ hours: String(hours) });
  return request(`/api/stats/hourly?${params}`, withBearerToken(adminToken)).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolVNLeaderboard(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/leaderboard/vn?${params}`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolLPLeaderboard(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/leaderboard/lp?${params}`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolIncomeLeaderboard(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/api/leaderboard/income?${params}`).then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolTopBurn() {
  return request("/api/leaderboard/top-burn").then(data =>
    normalizeListData(data),
  );
}

export function getElitePoolTopDeposit() {
  return request("/api/leaderboard/top-deposit").then(data =>
    normalizeListData(data),
  );
}

export function unlockElitePoolSigner(password, adminToken = "") {
  return request("/api/admin/unlock", withJsonBody("POST", { password }, adminToken));
}

export function getElitePoolSignerStatus(adminToken = "") {
  return request("/api/admin/signer-status", withBearerToken(adminToken));
}

export function getElitePoolAdminConfig(adminToken = "") {
  return request("/api/admin/config", withBearerToken(adminToken));
}

export function updateElitePoolAdminConfig({ key, value, signature, timestamp }, adminToken = "") {
  return request(
    "/api/admin/config",
    withJsonBody("POST", { key, value, signature, timestamp }, adminToken),
  );
}

export function getElitePoolRpcEndpoints(adminToken = "") {
  return request("/api/system/rpc-endpoints", withBearerToken(adminToken)).then(data =>
    normalizeListData(data),
  );
}

export function addElitePoolRpcEndpoint({ url, priority }, adminToken = "") {
  return request(
    "/api/system/rpc-endpoints",
    withJsonBody("POST", { url, priority }, adminToken),
  );
}

export function updateElitePoolRpcEndpoint(id, { priority, enabled }, adminToken = "") {
  return request(
    `/api/system/rpc-endpoints/${id}`,
    withJsonBody("PUT", { priority, enabled }, adminToken),
  );
}

export function deleteElitePoolRpcEndpoint(id, adminToken = "") {
  return request(
    `/api/system/rpc-endpoints/${id}`,
    withAdminOptions(adminToken, { method: "DELETE" }),
  );
}

export function switchElitePoolRpcEndpoint(adminToken = "") {
  return request(
    "/api/system/rpc-switch",
    withAdminOptions(adminToken, { method: "POST" }),
  );
}

export function getElitePoolSystemContracts(adminToken = "") {
  return request("/api/system/contracts", withBearerToken(adminToken)).then(data =>
    normalizeListData(data),
  );
}

export function updateElitePoolSystemContract(name, { address, enabled }, adminToken = "") {
  return request(
    `/api/system/contracts/${name}`,
    withJsonBody("PUT", { address, enabled }, adminToken),
  );
}

export function getElitePoolSystemConfig(adminToken = "") {
  return request("/api/system/system-config", withBearerToken(adminToken)).then(data =>
    normalizeListData(data),
  );
}

export function updateElitePoolSystemConfig(key, value, adminToken = "") {
  return request(
    `/api/system/system-config/${key}`,
    withJsonBody("PUT", { value }, adminToken),
  );
}
