// BarkX Orderbook configuration (vBARKX <-> BARKX on-chain orderbook).
//
// Backend-free: the page reads listings / depth / history straight from the
// BarkXOrderbook contract. Tokens are the same testnet BARKX / vBARKX the rest
// of the dApp uses.

const env = import.meta.env ?? {};

export const ORDERBOOK_CONFIG = Object.freeze({
  orderbook: env.VITE_BARKX_ORDERBOOK_ADDRESS || "",
  barkx: env.VITE_BARKX_TOKEN_ADDRESS || "",
  vbarkx: env.VITE_BARKX_VBARKX_ADDRESS || "",
});

export function hasOrderbookConfig() {
  return Boolean(ORDERBOOK_CONFIG.orderbook);
}

// Hardcoded contract tiers (mirror BarkXOrderbook.sol; never user-editable).
// Price tier index -> BARKX per vBARKX label.
export const PRICE_TIERS = Object.freeze(["0.5", "0.6", "0.7", "0.8", "0.9", "1.0"]);
// Amount tier index -> whole vBARKX.
export const AMOUNT_TIERS = Object.freeze([100, 1000, 10000, 100000]);
// Page size (contract caps nothing; the GUI shows 20/page).
export const PAGE_SIZE = 20;
// feeRate scale: contract uses 10000 == 1% (denom 1e6). Display is read live.
export const FEE_DENOM = 1_000_000n;
