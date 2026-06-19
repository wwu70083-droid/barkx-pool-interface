import { ref } from "vue";

const IS_COCO = import.meta.env.VITE_ISCOCO === "1";
const USE_SELF_SERVICE = import.meta.env.VITE_FETCHTYPE === "1";
const DEBUG_RELAY_LOGS = import.meta.env.DEV;
const SERVICE_KEY = import.meta.env.VITE_SERVICEKEY || "";
const API_CONTENT = import.meta.env.VITE_API_CONTENT || "";
const API_SIGNATURE = import.meta.env.VITE_API_SIGNATURE || "";

const signObj = { content: API_CONTENT, signature: API_SIGNATURE };

function relayDebug(...args) {
  if (DEBUG_RELAY_LOGS) {
    console.log(...args);
  }
}

function summarizeRelayError(error) {
  return {
    message: error?.message || String(error),
    code: error?.code,
    responseCode: error?.responseCode,
    isBusinessError: !!error?.isBusinessError,
    isRelayError: !!error?.isRelayError,
    isPreflightError: !!error?.isPreflightError,
  };
}

relayDebug("[RelayService] env loaded:", {
  IS_COCO,
  USE_SELF_SERVICE,
  hasServiceKey: !!SERVICE_KEY,
  hasApiContent: !!API_CONTENT,
  hasApiSignature: !!API_SIGNATURE,
});

// Shared state
const serviceReady = ref(!USE_SELF_SERVICE);
const serviceChecking = ref(false);
let serviceInitPromise = null;

function getClient() {
  return window.relayx;
}

function normalizeServiceUrl(url) {
  if (typeof url !== "string" || !url) return url;

  if (!/^https?:\/\//i.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch (error) {
    console.warn("[RelayService] normalizeServiceUrl failed, using raw url:", url, error);
    return url;
  }
}

function getQueryParams(url) {
  if (typeof url !== "string" || !url) return {};

  try {
    const parsed = new URL(url, "http://localhost");
    return Object.fromEntries(parsed.searchParams.entries());
  } catch (error) {
    console.warn("[RelayService] getQueryParams failed, using empty params:", url, error);
    return {};
  }
}

function unwrapServiceResponse(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  // RelayX wraps the backend payload in:
  // { messageId, cmd, data: ... }
  if ((response.messageId !== undefined || response.cmd !== undefined)
    && response.data
    && typeof response.data === "object") {
    return response.data;
  }

  return response;
}

function createServiceError(message, response, serviceResponse) {
  const error = new Error(message || "sendServiceMessage failed");
  error.rawResponse = response;
  error.serviceResponse = serviceResponse;
  error.responseCode = serviceResponse?.code;
  error.isBusinessError = !!(response?.data && typeof response.data === "object" && response.data.code !== undefined);
  error.isRelayError = !error.isBusinessError && error.responseCode !== undefined;
  return error;
}

function createRelayUnavailableError() {
  const error = new Error("relayx sendServiceMessage not available");
  error.code = "SELF_SERVICE_UNAVAILABLE";
  error.isPreflightError = true;
  return error;
}

function createServiceNotReadyError() {
  const error = new Error("Self Service is not initialized yet");
  error.code = "SELF_SERVICE_NOT_READY";
  error.isPreflightError = true;
  return error;
}

/**
 * Check Self Service registration status
 * Uses SDK: client.checkServiceStatus(sigInfo)
 */
async function checkService() {
  const client = getClient();
  if (!client?.checkServiceStatus) {
    console.warn("[RelayService] checkServiceStatus not available");
    return false;
  }
  relayDebug("[RelayService] checkServiceStatus →", {
    hasContent: !!signObj.content,
    hasSignature: !!signObj.signature,
  });
  const res = await client.checkServiceStatus(signObj);
  relayDebug("[RelayService] checkServiceStatus ←", {
    code: res?.code,
    hasResult: res?.result !== undefined,
  });
  return res.result;
}

/**
 * Register Self Service
 * Uses SDK: client.registerService({ serviceKey }, sigInfo)
 */
async function registerService() {
  const client = getClient();
  if (!client?.registerService) {
    console.error("[RelayService] registerService not available");
    return false;
  }
  const payload = { serviceKey: SERVICE_KEY };
  relayDebug("[RelayService] registerService →", {
    hasServiceKey: !!payload.serviceKey,
    hasSignature: !!signObj.signature,
  });
  const res = await client.registerService(payload, signObj);
  relayDebug("[RelayService] registerService ←", {
    code: res?.code,
  });
  if (res.code === 200) {
    relayDebug("[RelayService] registerService success");
    return true;
  }
  console.error("[RelayService] registerService failed code:", res.code);
  return false;
}

async function ensureServiceReady() {
  if (!USE_SELF_SERVICE) return true;
  if (serviceReady.value) return true;
  if (serviceInitPromise) return serviceInitPromise;
  throw createServiceNotReadyError();
}

/**
 * Send HTTP request through Self Service P2P network
 * Uses SDK: client.sendServiceMessage(payload, sigInfo)
 * Matches: window.relayx.sendServiceMessage(data, sign)
 */
async function sendServiceMessage(method, url, data = null, headers = {}, traceId = "", successCode = 200) {
  const client = getClient();
  if (!client?.sendServiceMessage) throw createRelayUnavailableError();
  const serviceUrl = normalizeServiceUrl(url);
  const tracePrefix = traceId ? `[${traceId}] ` : "";
  const params = getQueryParams(serviceUrl);

  const payload = {
    type: "HTTP",
    content: {
      method,
      url: serviceUrl,
      headers: { "Content-Type": "application/json", ...headers },
      ...(data !== null ? { data } : {}),
    },
  };

  relayDebug(`[RelayService] ${tracePrefix}sendServiceMessage →`, {
    method,
    rawUrl: url,
    serviceUrl,
    params,
    headerKeys: Object.keys(payload.content.headers || {}),
    hasBody: data !== null,
  });
  const res = await client.sendServiceMessage(payload, signObj);
  const serviceResponse = unwrapServiceResponse(res);
  relayDebug(`[RelayService] ${tracePrefix}sendServiceMessage ←`, {
    rawUrl: url,
    serviceUrl,
    params,
    code: serviceResponse?.code,
    type: typeof res,
    isArray: Array.isArray(res),
    keys: res && typeof res === "object" ? Object.keys(res) : [],
    hasData: !!res?.data,
    dataType: typeof res?.data,
    dataKeys: res?.data && typeof res.data === "object" ? Object.keys(res.data) : [],
  });
  if (serviceResponse?.code !== undefined && serviceResponse.code !== successCode) {
    const error = createServiceError(serviceResponse?.message || res?.message || "sendServiceMessage failed", res, serviceResponse);
    console.error(`[RelayService] ${tracePrefix}sendServiceMessage ✗`, {
      rawUrl: url,
      serviceUrl,
      params,
      ...summarizeRelayError(error),
    });
    throw error;
  }
  return serviceResponse;
}

/**
 * Poll checkService every 1s, timeout 30s.
 */
function pollUntilReady() {
  const TIMEOUT = 30000;
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error("Self Service registration timeout"));
    }, TIMEOUT);

    const intervalId = setInterval(async () => {
      try {
        const status = await checkService();
        if (status) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          setTimeout(() => resolve(true), 1000);
        }
      } catch (error) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        reject(error);
      }
    }, 1000);
  });
}

/**
 * Initialize Self Service: check → register if needed → poll until ready.
 */
async function initService(store) {
  if (!USE_SELF_SERVICE) return;
  if (serviceReady.value) return;
  if (serviceInitPromise) return serviceInitPromise;

  serviceInitPromise = (async () => {
    serviceChecking.value = true;
    store.setWalletPendingState({ pending: true, text: "Initializing service..." });

    try {
      relayDebug("[RelayService] initService: checking status...");
      const checked = await checkService();
      if (checked) {
        relayDebug("[RelayService] initService: already registered ✓");
        serviceReady.value = true;
        return true;
      }

      relayDebug("[RelayService] initService: not registered, registering...");
      const registerOk = await registerService();
      if (!registerOk) {
        throw new Error("Self Service registration failed");
      }

      relayDebug("[RelayService] initService: polling until ready...");
      await pollUntilReady();
      relayDebug("[RelayService] initService: service ready ✓");
      serviceReady.value = true;
      return true;
    } catch (e) {
      console.warn("[RelayService] initService failed:", summarizeRelayError(e));
      e.code = e.code || "SELF_SERVICE_INIT_FAILED";
      e.isPreflightError = true;
      serviceReady.value = false;
      throw e;
    } finally {
      serviceChecking.value = false;
      store.clearWalletPendingState();
      serviceInitPromise = null;
    }
  })();

  return serviceInitPromise;
}

export {
  IS_COCO,
  USE_SELF_SERVICE,
  ensureServiceReady,
  serviceReady,
  serviceChecking,
  sendServiceMessage,
  initService,
};
