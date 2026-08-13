export const ELITE_POOL_PAUSE_FLAGS = Object.freeze({
  DEPOSIT_VN: 0x01,
  DEPOSIT_LP: 0x02,
  WITHDRAW_VN: 0x04,
  WITHDRAW_LP: 0x08,
  CLAIM_BARKX: 0x10,
});

const ELITE_POOL_ERROR_HINTS = Object.freeze({
  BelowMinDeposit: "Below minimum vBARKX deposit.",
  InsufficientBalance: "Insufficient balance.",
  InvalidBucket: "Invalid bucket selection.",
  InvalidParam: "Invalid transaction parameters.",
  InvalidSignature: "Invalid claim signature.",
  LPCapExceeded: "LP Effective Cap exceeded.",
  NoVNStaked: "Deposit VN first to unlock LP capacity.",
  NothingToWithdraw: "Nothing to withdraw.",
  Paused: "This action is currently paused.",
  SignatureExpired: "Claim signature expired.",
  SlippageExceeded: "Slippage exceeded. Please try again.",
  StillLocked: "Selected assets are still locked.",
  ZeroAmount: "Amount must be greater than 0.",
});

export function hasElitePauseFlag(flags, flag) {
  return (Number(flags) & Number(flag)) === Number(flag);
}

export function getElitePoolErrorHint(errorName) {
  return ELITE_POOL_ERROR_HINTS[errorName] || "";
}
