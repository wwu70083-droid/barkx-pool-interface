// BarkX Incubator configuration.

const env = import.meta.env ?? {};

export const INCUBATOR_CONFIG = Object.freeze({
  incubator: env.VITE_BARKX_INCUBATOR_ADDRESS || "",
  multisig: env.VITE_BARKX_INCUBATOR_MULTISIG_ADDRESS || "",
  barkx: env.VITE_BARKX_TOKEN_ADDRESS || "",
  vbarkx: env.VITE_BARKX_VBARKX_ADDRESS || "",
  apiBaseUrl: env.VITE_BARKX_INCUBATOR_API_BASE_URL || "",
});

export function hasIncubatorConfig() {
  return Boolean(INCUBATOR_CONFIG.incubator && INCUBATOR_CONFIG.apiBaseUrl);
}
