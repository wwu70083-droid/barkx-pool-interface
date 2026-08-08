const env = import.meta.env ?? {};
const isMainnetMode = env.MODE === "production" || env.MODE === "pre";
const defaultChain = isMainnetMode
  ? { id: 42161, name: "Arbitrum One" }
  : { id: 421614, name: "Arbitrum Sepolia" };

export const BARKX_CHAIN = Object.freeze({
  id: Number(env.VITE_BARKX_CHAIN_ID || defaultChain.id),
  name: env.VITE_BARKX_CHAIN_NAME || defaultChain.name,
});

export const BARKX_CONTRACTS = Object.freeze({
  barkXPool: env.VITE_BARKX_POOL_ADDRESS || "",
  barkX: env.VITE_BARKX_TOKEN_ADDRESS || "",
  vn: env.VITE_BARKX_VN_ADDRESS || "",
  wVN1: env.VITE_BARKX_WVN1_ADDRESS || "",
  lpToken: env.VITE_BARKX_LP_TOKEN_ADDRESS || "",
  router: env.VITE_BARKX_ROUTER_ADDRESS || "",
  usdt: env.VITE_BARKX_USDT_ADDRESS || "",
  factory: env.VITE_BARKX_FACTORUY_ADDRESS || "",
  // SubPool (VIP Pool)
  wVN2: env.VITE_BARKX_WVN2_ADDRESS || "",
  vLP: env.VITE_BARKX_VLP_ADDRESS || "",
  subPool: env.VITE_BARKX_SUB_POOL_ADDRESS || "",
  // Elite Pool
  vBARKX: env.VITE_BARKX_VBARKX_ADDRESS || "",
  elitePool: env.VITE_BARKX_ELITE_POOL_ADDRESS || "",
  // Utility
  erc721BatchTransfer: env.VITE_BARKX_ERC721_BATCH_TRANSFER_ADDRESS || "",
});

export const BARKX_OPTIONAL_CONTRACTS = Object.freeze({
  barkXPoolMultiSig: env.VITE_BARKX_POOL_MULTISIG_ADDRESS || "",
  subPoolMultiSig: env.VITE_BARKX_SUB_POOL_MULTISIG_ADDRESS || "",
  incubator: env.VITE_BARKX_INCUBATOR_ADDRESS || "",
  openDao: env.VITE_BARKX_MARKET_CAP_OPENDAO_ADDRESS || "",
  openDaoFeedback: env.VITE_BARKX_MARKET_CAP_OPENDAO_FEEDBACK_ADDRESS || "",
});

export const BARKX_MARKET_CAP_BYPASS_ADDRESSES = Object.freeze([
  env.VITE_BARKX_MARKET_CAP_SAFE_MULTISIG_ADDRESS || "",
  env.VITE_BARKX_MARKET_CAP_MARKET_MAKER_ADDRESS || "",
  BARKX_CONTRACTS.barkXPool,
  BARKX_CONTRACTS.elitePool,
  BARKX_CONTRACTS.subPool,
  BARKX_OPTIONAL_CONTRACTS.incubator,
  BARKX_OPTIONAL_CONTRACTS.openDao,
  BARKX_OPTIONAL_CONTRACTS.openDaoFeedback,
]);

export const BARKX_CONTRACT_ENV_KEYS = Object.freeze({
  barkXPool: "VITE_BARKX_POOL_ADDRESS",
  barkX: "VITE_BARKX_TOKEN_ADDRESS",
  vn: "VITE_BARKX_VN_ADDRESS",
  wVN1: "VITE_BARKX_WVN1_ADDRESS",
  lpToken: "VITE_BARKX_LP_TOKEN_ADDRESS",
  router: "VITE_BARKX_ROUTER_ADDRESS",
  usdt: "VITE_BARKX_USDT_ADDRESS",
  factory: "VITE_BARKX_FACTORUY_ADDRESS",
  wVN2: "VITE_BARKX_WVN2_ADDRESS",
  vLP: "VITE_BARKX_VLP_ADDRESS",
  subPool: "VITE_BARKX_SUB_POOL_ADDRESS",
  vBARKX: "VITE_BARKX_VBARKX_ADDRESS",
  elitePool: "VITE_BARKX_ELITE_POOL_ADDRESS",
});

export function hasBarkxPoolAddresses() {
  return Object.values(BARKX_CONTRACTS).every(Boolean);
}

export function getMissingBarkxContractEnvKeys() {
  return Object.entries(BARKX_CONTRACTS).reduce((missing, [key, value]) => {
    if (!value) {
      missing.push(BARKX_CONTRACT_ENV_KEYS[key]);
    }

    return missing;
  }, []);
}
