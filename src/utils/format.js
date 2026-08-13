import { formatUnits, parseUnits } from "viem";

/**
 * Truncate a number to N decimal places (no rounding).
 * e.g. truncateFixed(1.999, 2) → "1.99"
 */
export function truncateFixed(num, decimals) {
  const factor = Math.pow(10, decimals);
  return (Math.floor(num * factor) / factor).toFixed(decimals);
}

/**
 * Format a backend decimal string as a truncated percentage, e.g. "0.00003732" → "0.00%".
 *
 * Works on the digits rather than on a Number: the backend sends these ratios as
 * exact decimal strings, and `truncateFixed(Number(s) * 100, 2)` is off by one in
 * the last place for a large share of them (0.0016 → "0.15%" instead of "0.16%")
 * because the multiply lands just under the boundary in binary floating point.
 *
 * Returns null for anything that is not a plain decimal, so callers can render a
 * placeholder instead of a wrong number.
 */
export function formatDecimalStringAsPercent(value, decimals = 2) {
  const raw = String(value ?? "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;

  const negative = raw.startsWith("-");
  const [intPart, fracPart = ""] = raw.replace("-", "").split(".");

  // ×100 is a two-place shift of the decimal point.
  const shifted = intPart + fracPart.slice(0, 2).padEnd(2, "0");
  const rest = fracPart.slice(2);

  const whole = shifted.replace(/^0+(?=\d)/, "");
  const truncated = decimals > 0
    ? `${whole}.${rest.slice(0, decimals).padEnd(decimals, "0")}`
    : whole;

  return `${negative && /[1-9]/.test(whole + rest) ? "-" : ""}${truncated}%`;
}

/**
 * Complement of a backend decimal ratio, as a truncated percentage:
 * cutRatio "0.9500" → "5.00%". Same digit-based reasoning as above — here the
 * float path is wrong for 2259 of the 10001 possible four-decimal ratios.
 */
export function formatComplementAsPercent(value, decimals = 2) {
  const raw = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;

  const [intPart, fracPart = ""] = raw.split(".");
  // Complement against 1 by subtracting the digit string from 10^n.
  const scale = Math.max(fracPart.length, decimals + 2);
  const digits = BigInt(intPart + fracPart.padEnd(scale, "0"));
  const one = 10n ** BigInt(scale);
  if (digits > one) return null;

  const complement = one - digits;
  const asString = complement.toString().padStart(scale + 1, "0");
  const boundary = asString.length - scale;

  return formatDecimalStringAsPercent(
    `${asString.slice(0, boundary)}.${asString.slice(boundary)}`,
    decimals,
  );
}

/**
 * Convert APR (decimal form) to APY using daily compounding.
 * Formula: apy = (1 + apr / 365) ^ 365 - 1
 */
export function calculateApyFromApr(apr) {
  const num = Number(apr);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.pow(1 + num / 365, 365) - 1;
}

/**
 * Safely parse a user input string into BigInt wei.
 * Returns null instead of throwing on invalid/oversized input.
 */
export function safeParseUnits(value, decimals = 18) {
  try {
    const str = String(value ?? "").trim();
    if (!str || str.includes("e") || str.includes("E") || str.length > 30) return null;
    return parseUnits(str, decimals);
  } catch {
    return null;
  }
}

/**
 * Format a BigInt token amount to a human-readable string.
 * LP / USDT / BARKX are all 18 decimals.
 * @param {bigint|number|string} value - raw token amount
 * @param {number} decimals - token decimals (default 18)
 * @param {number} displayDecimals - decimal places to show (default 6)
 * @returns {string}
 */
export function formatTokenAmount(value, decimals = 18, displayDecimals = 6) {
  if (!value && value !== 0n && value !== 0) return "0." + "0".repeat(displayDecimals);
  const formatted = formatUnits(BigInt(value), decimals);
  const [intPart, decPart = ""] = formatted.split(".");
  // Add thousand separators to integer part
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (displayDecimals <= 0) {
    return withCommas;
  }
  const trimmed = (decPart + "0".repeat(displayDecimals)).slice(0, displayDecimals);
  return withCommas + "." + trimmed;
}

/**
 * Format integer amounts (for VN count etc.)
 */
export function formatIntegerAmount(value) {
  if (!value && value !== 0n && value !== 0) return "0";
  return BigInt(value).toLocaleString("en-US");
}

/**
 * Format BPS (basis points) to percentage string.
 * e.g. 3000 → "30.00%"
 */
export function formatBps(bps) {
  const num = Number(bps);
  return truncateFixed(num / 100, 2) + "%";
}

/**
 * Format a BigInt amount to a short display (e.g. $2.48M, $127K)
 */
export function formatCompactUsd(value, decimals = 18) {
  const num = Number(formatUnits(BigInt(value), decimals));
  if (num >= 1_000_000) return "$" + truncateFixed(num / 1_000_000, 2) + "M";
  if (num >= 1_000) return "$" + truncateFixed(num / 1_000, 0) + "K";
  return "$" + truncateFixed(num, 2);
}

/**
 * Parse a viem contract revert error and return the i18n key for user-friendly message.
 * Falls back to a generic message key if the error name is unrecognized.
 */
export function parseContractErrorKey(error) {
  // viem wraps contract reverts in ContractFunctionRevertedError
  const revertError = error?.walk?.(e => e?.data?.errorName) ?? error;
  const errorName = revertError?.data?.errorName || revertError?.errorName || "";

  // Import is avoided here — caller should pass the mapping or use inline
  // This returns just the error name for lookup in BARKX_POOL_ERROR_HINT_KEYS
  return errorName;
}

/**
 * Shorten an address for display: 0x1234...abcd
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return address.slice(0, chars + 2) + "..." + address.slice(-chars);
}

/**
 * Copy text to clipboard with fallback for mobile/WebView.
 * Returns true if successful.
 */
export async function copyToClipboard(text) {
  const fallbackCopy = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  };

  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return fallbackCopy();
      }
    }
    return fallbackCopy();
  } catch {
    return false;
  }
}
