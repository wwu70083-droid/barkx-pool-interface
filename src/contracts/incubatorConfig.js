// BarkX Incubator configuration. The incubator uses its own BARKX /
// vBARKX token addresses (per incubator-spec.md, distinct from the
// production pool's testnet tokens) and its own backend API. Keep these
// separate so the incubator stays decoupled from the rest of the dApp.

const env = import.meta.env ?? {};
const isMainnetMode = env.MODE === "production" || env.MODE === "pre";

// Spec testnet (Arbitrum Sepolia) token addresses; mainnet (Arbitrum One)
// addresses are used when built in production/pre mode.
const TESTNET = {
  barkx: "0x457fA4A1fCd0600c1Cf8485dD198f580f3339B0f",
  vbarkx: "0xb29D3368e40DA289694Db5debd37B3dfdb0Aa83F",
};
const MAINNET = {
  barkx: "0x55279F3c138521B0395BC8b76d123E94f1d935B2",
  vbarkx: "0x081Ac2F123972a4F36D23cd9e7Be7E3d2Fae2EF8",
};
const tokens = isMainnetMode ? MAINNET : TESTNET;

export const INCUBATOR_CONFIG = Object.freeze({
  incubator: env.VITE_BARKX_INCUBATOR_ADDRESS || "",
  barkx: env.VITE_BARKX_INCUBATOR_BARKX_ADDRESS || tokens.barkx,
  vbarkx: env.VITE_BARKX_INCUBATOR_VBARKX_ADDRESS || tokens.vbarkx,
  apiBaseUrl: env.VITE_BARKX_INCUBATOR_API_BASE_URL || "",
});

export function hasIncubatorConfig() {
  return Boolean(INCUBATOR_CONFIG.incubator && INCUBATOR_CONFIG.apiBaseUrl);
}
