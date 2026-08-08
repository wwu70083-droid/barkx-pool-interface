/**
 * Quick Start planning arithmetic.
 *
 * Pure functions over bigints — no Vue, no network. They mirror the sizing rules
 * the BarkX agent uses in `skill.main_pool_best_plan_for_new_node.md`, reduced to
 * the four steps the onboarding modal drives (fresh VN, buy BARKX, mint LP,
 * deposit LP). The wVN1 step from that document is deliberately absent: there is
 * no free-floating wVN1 in the market today.
 *
 * Decimals: USDT 6, BARKX 18, LP 18. Everything here is wei in / wei out.
 */

/**
 * 0.000001 LP, in wei (LP is 18-decimal). Below this a step renders Skip /
 * Finish: minting or depositing less than this is not worth its gas, and the
 * UI rounds LP to 6 places anyway, so a smaller amount would display as zero.
 *
 * Raised from 1e-12 LP — that threshold was low enough to be no threshold at
 * all, letting the modal propose writes for amounts a user could not see.
 */
export const LP_DUST_WEI = 1000000000000n;

/**
 * Above this share of the LP quota, Buy BARKX halts the flow instead of skipping.
 * There is too little quota left to absorb a purchase, and unlike every other
 * reason not to buy, this one the user can act on — by staking more VN to raise
 * the cap. So it is reported and the flow stops, rather than being passed over.
 */
export const LP_QUOTA_NEAR_FULL_PCT = 90;

/**
 * Mint only 95% of the LP the quota could still absorb.
 *
 * Filling the cap to the brim leaves the next claim with nowhere to reinvest —
 * that write reverts, and the only way back is to buy and stake another VN, which
 * this flow would then fill to the brim again. Holding a twentieth back breaks
 * that loop. The cost is some leftover BARKX from the buy step, which stays in
 * the wallet for the user to spend as they see fit.
 */
const MINT_FILL_NUM = 95n;
const MINT_FILL_DEN = 100n;

/**
 * 1 USDT, in wei. The minimum swap worth proposing, enforced at both ends of
 * `planBuyBarkx`: a balance below it skips the step before the arithmetic runs,
 * and a computed spend below it is discarded afterwards. Either way the swap
 * would cost more gas than it moves — the amount rounds away against the pool's
 * reserves.
 */
export const MIN_BUY_USDT_WEI = 1000000n;

/** Cap a single swap at a tenth of the pool's USDT — deeper moves the price too far. */
const SWAP_RESERVE_FRACTION_CAP = 0.1;

/** 6a demands a little USDT headroom, since the ratio moves between read and write. */
const USDT_SUFFICIENCY_MARGIN = 1.02;

/**
 * Share of the LP quota already used, as a percentage (0–100).
 * With no quota at all (no VN staked) usage is 0 — the quota does not exist yet,
 * which is not the same as being full.
 */
export function computeLpQuotaUsagePct(stakedLP, lpCap) {
  if (lpCap <= 0n) return 0;
  if (stakedLP >= lpCap) return 100;
  return Number((stakedLP * 10000n) / lpCap) / 100;
}

/** True once the user has used more than 90% of their LP quota space. */
export function isLpQuotaNearFull(stakedLP, lpCap) {
  return computeLpQuotaUsagePct(stakedLP, lpCap) > LP_QUOTA_NEAR_FULL_PCT;
}

/**
 * Over-supply the fresh-VN deposit's USDT by 2%.
 *
 * The pool refunds excess USDT inside the same transaction, but never tops up a
 * shortfall — an under-supplied deposit just consumes less of the gift, and the
 * remainder stays in the pool permanently. So the margin is deliberately
 * asymmetric: rounding up costs nothing, rounding down forfeits gift BARKX.
 */
const VN_USDT_MARGIN_NUM = 102n;
const VN_USDT_MARGIN_DEN = 100n;

/**
 * How many fresh VN the wallet can actually deposit.
 *
 * Depositing VN gifts `barkXPerVN` BARKX per VN, and that gift must be paired
 * with the user's own USDT at the current reserve ratio — so USDT, not the VN
 * balance, is usually what binds.
 *
 * The VN count is sized against the *margined* per-VN cost, so the wallet can
 * always afford to actually send the margin. Sizing against the bare cost and
 * clamping afterwards would silently void the margin for exactly the user who
 * spends their whole USDT balance — the case it exists to protect.
 *
 * @returns {{ vnCount: bigint, usdtNeeded: bigint, usdtToSend: bigint, limitedBy: "vn"|"usdt"|"none" }}
 */
export function computeFreshVnPlan({
  vnBalance,
  usdtBalance,
  barkXPerVN,
  barkxReserve,
  usdtReserve,
}) {
  const empty = { vnCount: 0n, usdtNeeded: 0n, usdtToSend: 0n, limitedBy: "none" };

  if (vnBalance <= 0n) return { ...empty, limitedBy: "vn" };
  if (barkXPerVN <= 0n || barkxReserve <= 0n || usdtReserve <= 0n) return empty;

  // usdt(N) = N * barkXPerVN * usdtReserve / barkxReserve
  const usdtPerVn = (barkXPerVN * usdtReserve) / barkxReserve;
  if (usdtPerVn <= 0n) {
    // The gift is free to pair at this ratio — VN balance is the only limit.
    return { vnCount: vnBalance, usdtNeeded: 0n, usdtToSend: 0n, limitedBy: "vn" };
  }

  const usdtPerVnMargined = (usdtPerVn * VN_USDT_MARGIN_NUM) / VN_USDT_MARGIN_DEN;
  const affordable = usdtBalance / usdtPerVnMargined;
  if (affordable <= 0n) return { ...empty, limitedBy: "usdt" };

  const vnCount = affordable < vnBalance ? affordable : vnBalance;
  const usdtNeeded = vnCount * usdtPerVn;
  const margined = (usdtNeeded * VN_USDT_MARGIN_NUM) / VN_USDT_MARGIN_DEN;

  return {
    vnCount,
    usdtNeeded,
    usdtToSend: margined > usdtBalance ? usdtBalance : margined,
    limitedBy: affordable < vnBalance ? "usdt" : "vn",
  };
}

/**
 * BARKX + USDT required to mint `lpAmount` LP at the current reserve ratio.
 * Same derivation as `getEstimatedAssetsForLp` in pool.vue.
 */
export function computeAssetsForLp(lpAmount, { barkxReserve, usdtReserve, totalSupply }) {
  if (lpAmount <= 0n || totalSupply <= 0n) return { barkx: 0n, usdt: 0n };
  return {
    barkx: (lpAmount * barkxReserve) / totalSupply,
    usdt: (lpAmount * usdtReserve) / totalSupply,
  };
}

/** LP that `barkxAmount` BARKX would mint, if USDT were unlimited. */
export function computeLpForBarkx(barkxAmount, { barkxReserve, totalSupply }) {
  if (barkxAmount <= 0n || barkxReserve <= 0n || totalSupply <= 0n) return 0n;
  return (barkxAmount * totalSupply) / barkxReserve;
}

/** USDT that pairs with `barkxAmount` BARKX at the current ratio. */
export function computePairedUsdt(barkxAmount, { barkxReserve, usdtReserve }) {
  if (barkxAmount <= 0n || barkxReserve <= 0n) return 0n;
  return (barkxAmount * usdtReserve) / barkxReserve;
}

/** BARKX that `usdtAmount` USDT can pair at the current ratio. */
export function computePairedBarkx(usdtAmount, { barkxReserve, usdtReserve }) {
  if (usdtAmount <= 0n || usdtReserve <= 0n) return 0n;
  return (usdtAmount * barkxReserve) / usdtReserve;
}

/**
 * LP that actually has to be minted: 95% of the free quota space, less whatever
 * LP is already idle in the wallet. Both the buy step and the mint step size
 * against this same figure — sizing the purchase against the raw quota instead
 * would buy BARKX for LP the wallet already holds, and strand it.
 *
 * The 95% is the reinvestment headroom (see `MINT_FILL_NUM`). It is applied to
 * the quota space before the wallet's idle LP is subtracted, so a wallet already
 * holding that much LP mints nothing rather than being asked to top up a target
 * it has passed. The *deposit* step is not reduced — LP already in the wallet
 * should go in; only newly minted LP is held back.
 */
export function computeMintDemand(lpToFill, lpBalance) {
  const target = (lpToFill * MINT_FILL_NUM) / MINT_FILL_DEN;
  return target > lpBalance ? target - lpBalance : 0n;
}

/**
 * Decide whether to buy BARKX with USDT before minting LP, and how much to spend.
 *
 * This is §S6 of the skill document. The two fractions `fB` and `fU` say which
 * side of the wallet runs out first against the LP still to mint; only the
 * smaller side is worth acting on, and only a shortfall of BARKX can be fixed by
 * a purchase. Selling BARKX is never proposed.
 *
 * @returns {{
 *   shouldBuy: boolean,
 *   usdtToSpend: bigint,
 *   planCase: "6a"|"6b"|"6c"|"none",
 *   reason: "quota_near_full"|"insufficient_usdt"|"quota_full"|"sufficient"|"usdt_is_short_side"|"no_assets"|"buy"|"dust",
 *   cappedBy: "formula"|"needed_barkx"|"reserve_depth"|null,
 * }}
 */
export function planBuyBarkx({
  lpToFill,
  lpBalance = 0n,
  stakedLP,
  lpCap,
  barkxBalance,
  usdtBalance,
  barkxReserve,
  usdtReserve,
  totalSupply,
}) {
  const none = { shouldBuy: false, usdtToSpend: 0n, planCase: "none", cappedBy: null };

  // Two preconditions are checked before any sizing arithmetic runs, in order.
  //
  // First the quota. Above 90% used there is too little room left to absorb a
  // purchase, and this is the one reason not to buy that the user can actually
  // fix — by staking more VN. So it halts the flow rather than skipping, and it
  // outranks the USDT floor: being told to raise the cap is more useful than
  // being silently passed over for holding dust.
  if (isLpQuotaNearFull(stakedLP, lpCap)) {
    return { ...none, reason: "quota_near_full" };
  }

  // Then the USDT floor. Under 1 USDT cannot fund a purchase worth its gas, so
  // the plan is not computed at all and the step skips.
  if (usdtBalance < MIN_BUY_USDT_WEI) return { ...none, reason: "insufficient_usdt" };

  // Size against what must actually be MINTED, not the raw quota space — LP the
  // wallet already holds needs no BARKX bought for it.
  const mintDemand = computeMintDemand(lpToFill, lpBalance);

  if (mintDemand < LP_DUST_WEI) return { ...none, reason: "quota_full" };
  if (barkxReserve <= 0n || usdtReserve <= 0n || totalSupply <= 0n) return { ...none, reason: "quota_full" };

  const { barkx: neededBarkx, usdt: neededUsdt } = computeAssetsForLp(mintDemand, {
    barkxReserve,
    usdtReserve,
    totalSupply,
  });
  if (neededBarkx <= 0n || neededUsdt <= 0n) return { ...none, reason: "quota_full" };

  if (barkxBalance <= 0n && usdtBalance <= 0n) return { ...none, reason: "no_assets" };

  // Fractions of the missing side each wallet side could cover on its own.
  const fB = Number(barkxBalance) / Number(neededBarkx);
  const fU = Number(usdtBalance) / Number(neededUsdt);

  // 6a — both sides suffice; mint straight away, no swap.
  if (fB >= 1 && fU >= USDT_SUFFICIENCY_MARGIN) {
    return { ...none, planCase: "6a", reason: "sufficient" };
  }

  // 6b — USDT is the short side. Buying BARKX would need a sale to fund it.
  if (fU <= fB) {
    return { ...none, planCase: "6b", reason: "usdt_is_short_side" };
  }

  // 6c — BARKX is the short side, and USDT can buy it.
  if (usdtBalance <= 0n) return { ...none, planCase: "6b", reason: "usdt_is_short_side" };

  const r = Number(usdtReserve) / Number(barkxReserve); // USDT per BARKX, raw units
  const U = Number(usdtReserve);
  const barkxHeldAsUsdt = Number(barkxBalance) * r;

  const D = Number(usdtBalance) - barkxHeldAsUsdt;
  if (!(D > 0)) return { ...none, planCase: "6b", reason: "usdt_is_short_side" };

  const V = U + barkxHeldAsUsdt;
  if (!(V > 0)) return { ...none, planCase: "6b", reason: "usdt_is_short_side" };

  // One fixed-point step on the exact balance condition. It lands under the exact
  // answer on purpose, so any residue is left in USDT rather than stranded BARKX.
  const phi0 = D / (2 * V);
  const phi = D / (V * (2 + phi0));
  let s = U * phi;
  let cappedBy = "formula";

  // Never buy more BARKX than the remaining quota can absorb.
  const barkxShortfall = neededBarkx > barkxBalance ? neededBarkx - barkxBalance : 0n;
  const shortfallAsUsdt = Number(barkxShortfall) * r;
  if (shortfallAsUsdt < s) {
    s = shortfallAsUsdt;
    cappedBy = "needed_barkx";
  }

  // Never move the price by trading against more than a tenth of the pool's USDT.
  const depthCap = U * SWAP_RESERVE_FRACTION_CAP;
  if (depthCap < s) {
    s = depthCap;
    cappedBy = "reserve_depth";
  }

  // Never spend more than the wallet holds.
  if (Number(usdtBalance) < s) {
    s = Number(usdtBalance);
    cappedBy = "formula";
  }

  if (!(s > 0)) return { ...none, planCase: "6c", reason: "dust" };

  // The same 1 USDT floor applied to the balance on the way in, now applied to
  // the answer on the way out. A wallet can clear the entry check and still be
  // sized down to pennies here — the caps above cut `s` to the quota shortfall,
  // a tenth of the pool, or the balance, any of which can land under a dollar.
  // Such a swap is not worth its gas, so it is dropped rather than proposed.
  const usdtToSpend = BigInt(Math.floor(s));
  if (usdtToSpend < MIN_BUY_USDT_WEI) return { ...none, planCase: "6c", reason: "dust" };

  return { shouldBuy: true, usdtToSpend, planCase: "6c", reason: "buy", cappedBy };
}

/**
 * Size the manual LP mint.
 *
 * Mint demand is 95% of the free quota space, less the LP already idle in the
 * wallet — there is no reason to mint LP the wallet could simply deposit, and the
 * last twentieth is left unfilled so the next claim has room to reinvest. The
 * mint is then bounded by whichever side of the wallet runs out first.
 *
 * @returns {{ mintDemand: bigint, barkxIn: bigint, usdtIn: bigint, lpOut: bigint, canMint: boolean }}
 */
export function computeMintLpPlan({
  lpToFill,
  lpBalance,
  barkxBalance,
  usdtBalance,
  barkxReserve,
  usdtReserve,
  totalSupply,
}) {
  const idle = { mintDemand: 0n, barkxIn: 0n, usdtIn: 0n, lpOut: 0n, canMint: false };

  const mintDemand = computeMintDemand(lpToFill, lpBalance);
  if (mintDemand < LP_DUST_WEI) return { ...idle, mintDemand };
  if (barkxReserve <= 0n || usdtReserve <= 0n || totalSupply <= 0n) return { ...idle, mintDemand };

  const { barkx: neededBarkx } = computeAssetsForLp(mintDemand, {
    barkxReserve,
    usdtReserve,
    totalSupply,
  });

  // BARKX to supply = the smallest of: what the quota wants, what the wallet holds,
  // and what the wallet's USDT can pair.
  const barkxFromUsdt = computePairedBarkx(usdtBalance, { barkxReserve, usdtReserve });
  let barkxIn = neededBarkx;
  if (barkxBalance < barkxIn) barkxIn = barkxBalance;
  if (barkxFromUsdt < barkxIn) barkxIn = barkxFromUsdt;

  if (barkxIn <= 0n) return { ...idle, mintDemand };

  const usdtIn = computePairedUsdt(barkxIn, { barkxReserve, usdtReserve });
  if (usdtIn <= 0n || usdtIn > usdtBalance) return { ...idle, mintDemand };

  const lpOut = computeLpForBarkx(barkxIn, { barkxReserve, totalSupply });
  if (lpOut < LP_DUST_WEI) return { ...idle, mintDemand };

  return { mintDemand, barkxIn, usdtIn, lpOut, canMint: true };
}

/**
 * Size the top-up LP deposit: everything the wallet holds, clamped to the free
 * quota space. The contract rejects the whole transaction on breach, so this is
 * never rounded up.
 *
 * @returns {{ lpAmount: bigint, canDeposit: boolean }}
 */
export function computeDepositLpPlan({ lpBalance, lpToFill }) {
  const lpAmount = lpBalance < lpToFill ? lpBalance : lpToFill;
  return { lpAmount, canDeposit: lpAmount >= LP_DUST_WEI };
}
