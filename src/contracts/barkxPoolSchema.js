export const BARKX_POOL_MODES = Object.freeze({
  MODE_A: "mode_a",
  MODE_B: "mode_b",
  MODE_C: "mode_c",
});

export const BARKX_POOL_LOCKS = Object.freeze({
  MODE_A_MS: 360 * 24 * 60 * 60 * 1000,
  MODE_B_MS: 24 * 60 * 60 * 1000,
  MODE_C_MS: 90 * 24 * 60 * 60 * 1000,
});

export const BARKX_POOL_PAUSE_FLAGS = Object.freeze({
  DEPOSIT_VN: 0x01,
  DEPOSIT_WVN1: 0x02,
  DEPOSIT_LP: 0x04,
  WITHDRAW_WVN1: 0x08,
  WITHDRAW_LP: 0x10,
  CLAIM_BARKX: 0x20,
});

export const BARKX_POOL_VIEW_METHODS = Object.freeze({
  USER_INFO: "userInfo",
  NONCES: "nonces",
  LP_PER_VN: "lpPerVN",
  LP_MIN: "lpMin",
  DIRECT_TAX_BPS: "directTaxBps",
  REINVEST_TAX_BPS: "reinvestTaxBps",
  BARKX_PER_VN: "barkXPerVN",
  GLOBAL_PAUSE_FLAGS: "globalPauseFlags",
  USER_PAUSE_FLAGS: "userPauseFlags",
  MODE_A_BUCKET_COUNT: "modeABucketCount",
  MODE_B_VN_BUCKET_COUNT: "modeBVNBucketCount",
  MODE_B_LP_BUCKET_COUNT: "modeBLPBucketCount",
  MODE_C_BUCKET_COUNT: "modeCBucketCount",
  MODE_A_BUCKETS: "modeABuckets",
  MODE_B_VN_BUCKETS: "modeBVNBuckets",
  MODE_B_LP_BUCKETS: "modeBLPBuckets",
  MODE_C_BUCKETS: "modeCBuckets",
  USED_IN_MODE_A: "usedInModeA",
});

export const BARKX_POOL_WRITE_METHODS = Object.freeze({
  DEPOSIT_MODE_A: "depositModeA",
  DEPOSIT_MODE_A_WVN1: "depositModeAWVN1",
  DEPOSIT_MODE_B_VN1: "depositModeBVN1",
  DEPOSIT_MODE_B_LP: "depositModeBLP",
  REINVEST: "reinvest",
  WITHDRAW_MODE_A: "withdrawModeA",
  WITHDRAW_MODE_B_VN1: "withdrawModeBVN1",
  WITHDRAW_LP: "withdrawLP",
  CLAIM: "claim",
});

export const BARKX_POOL_WRITE_METHOD_SIGNATURES = Object.freeze({
  depositModeA: ["vnAmount", "usdtAmt", "minLP", "deadline"],
  depositModeAWVN1: ["tokenIds", "usdtAmt", "minLP", "deadline"],
  depositModeBVN1: ["tokenIds"],
  depositModeBLP: ["lpAmount", "fromManual"],
  reinvest: ["amount", "deadline", "sig", "minUsdtOut", "minLP"],
  withdrawModeA: ["bucketIdx", "doVN", "doLP"],
  withdrawModeBVN1: ["bucketIdxs"],
  withdrawLP: ["isModeC", "bucketIdxs"],
  claim: ["amount", "deadline", "sig"],
});

export const BARKX_POOL_ERROR_HINT_KEYS = Object.freeze({
  Paused: "errors.barkxPool.paused",
  StillLocked: "errors.barkxPool.stillLocked",
  LPCapExceeded: "errors.barkxPool.lpCapExceeded",
  NoVNStaked: "errors.barkxPool.noVnStaked",
  InsufficientLP: "errors.barkxPool.insufficientLp",
  BelowLpMin: "errors.barkxPool.belowLpMin",
  MustWithdrawAllLP: "errors.barkxPool.mustWithdrawAllLp",
  InvalidSignature: "errors.barkxPool.invalidSignature",
  SignatureExpired: "errors.barkxPool.signatureExpired",
  AlreadyUsedInModeA: "errors.barkxPool.alreadyUsedInModeA",
  ZeroAmount: "errors.barkxPool.zeroAmount",
  NothingToWithdraw: "errors.barkxPool.nothingToWithdraw",
  InvalidBucket: "errors.barkxPool.invalidBucket",
  SlippageExceeded: "errors.barkxPool.slippageExceeded",
  InsufficientBalance: "errors.barkxPool.insufficientBalance",
  InvalidParam: "errors.barkxPool.invalidParam"
});

export const BARKX_POOL_ERROR_HINTS = new Proxy(
  {},
  {
    get(_, errorName) {
      const localeKey = BARKX_POOL_ERROR_HINT_KEYS[errorName];
      return localeKey ? translate(localeKey) : "";
    },
  },
);

export function getBarkxPoolErrorHint(errorName) {
  const localeKey = BARKX_POOL_ERROR_HINT_KEYS[errorName];
  return localeKey ? translate(localeKey) : "";
}

export const BARKX_POOL_PAGE_ACTIONS = Object.freeze({
  dashboard: {
    reads: [
      "userInfo",
      "lpPerVN",
      "modeABucketCount",
      "modeBVNBucketCount",
      "modeBLPBucketCount",
      "modeCBucketCount",
    ],
    writes: [],
  },
  liquidity: {
    reads: [],
    writes: [],
  },
  pool: {
    reads: [
      "userInfo",
      "lpPerVN",
      "lpMin",
      "nonces",
      "modeABucketCount",
      "modeBVNBucketCount",
      "modeBLPBucketCount",
      "modeCBucketCount",
      "globalPauseFlags",
      "userPauseFlags",
    ],
    writes: [
      "depositModeA",
      "depositModeAWVN1",
      "depositModeBVN1",
      "depositModeBLP",
      "withdrawModeA",
      "withdrawModeBVN1",
      "withdrawLP",
      "claim",
      "reinvest",
    ],
  },
  v_pool: {
    reads: [],
    writes: [],
  },
  settings: {
    reads: [
      "globalPauseFlags",
      "trustedSigner",
      "lpPerVN",
      "lpMin",
      "directTaxBps",
      "reinvestTaxBps",
      "barkXPerVN",
    ],
    writes: [],
  },
});

export const BARKX_POOL_GOVERNANCE_NOTES = Object.freeze({
  adminEntry: "BarkXPoolMultiSig",
  summary:
    "Owner-only governance should be routed through BarkXPoolMultiSig proposals and approvals instead of assuming direct owner calls from the UI.",
});

export function hasPauseFlag(flags, flag) {
  return (Number(flags) & Number(flag)) === Number(flag);
}

export function getLpCap(vnStaked, lpPerVN) {
  return BigInt(vnStaked) * BigInt(lpPerVN);
}
import { translate } from "@/i18n";
