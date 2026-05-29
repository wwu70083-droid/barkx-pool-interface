import { translate } from "@/i18n";

function createMessage(key, group, outcome, defaults = {}) {
  return {
    key,
    group,
    outcome,
    textKey: `messages.barkxPool.items.${key}`,
    defaults,
  };
}

export const BARKX_POOL_MESSAGE_GROUPS = Object.freeze([
  {
    id: "deposit_vn_lp",
    labelKey: "messages.barkxPool.groups.depositVnLp",
    messages: [
      createMessage("deposit_vn_lp_success", "deposit_vn_lp", "success", {
        lpAmount: "0.000000",
      }),
      createMessage(
        "deposit_vn_lp_failure_cap_reached",
        "deposit_vn_lp",
        "failure",
      ),
      createMessage("deposit_vn_lp_failure_retry", "deposit_vn_lp", "failure"),
    ],
  },
  {
    id: "deposit_wvn_only",
    labelKey: "messages.barkxPool.groups.depositWvnOnly",
    messages: [
      createMessage("deposit_wvn_only_success", "deposit_wvn_only", "success"),
      createMessage(
        "deposit_wvn_only_failure_requires_lp",
        "deposit_wvn_only",
        "failure",
        {
          lpAmount: "0.000000",
        },
      ),
      createMessage(
        "deposit_wvn_only_failure_retry",
        "deposit_wvn_only",
        "failure",
      ),
    ],
  },
  {
    id: "deposit_lp_only",
    labelKey: "messages.barkxPool.groups.depositLpOnly",
    messages: [
      createMessage("deposit_lp_only_success", "deposit_lp_only", "success"),
      createMessage(
        "deposit_lp_only_failure_requires_vn",
        "deposit_lp_only",
        "failure",
        {
          vnAmount: "1",
        },
      ),
      createMessage(
        "deposit_lp_only_failure_cap_reached",
        "deposit_lp_only",
        "failure",
      ),
      createMessage("deposit_lp_only_failure_retry", "deposit_lp_only", "failure"),
    ],
  },
  {
    id: "withdraw_wvn",
    labelKey: "messages.barkxPool.groups.withdrawWvn",
    messages: [
      createMessage(
        "withdraw_wvn_success_cap_decreased",
        "withdraw_wvn",
        "success",
      ),
      createMessage(
        "withdraw_wvn_success_all_removed",
        "withdraw_wvn",
        "success",
      ),
      createMessage(
        "withdraw_wvn_failure_cap_exceeded",
        "withdraw_wvn",
        "failure",
      ),
      createMessage("withdraw_wvn_failure_retry", "withdraw_wvn", "failure"),
    ],
  },
  {
    id: "withdraw_lp",
    labelKey: "messages.barkxPool.groups.withdrawLp",
    messages: [
      createMessage("withdraw_lp_success", "withdraw_lp", "success"),
      createMessage("withdraw_lp_failure_requires_lp", "withdraw_lp", "failure", {
        lpAmount: "0.000000",
      }),
      createMessage("withdraw_lp_failure_retry", "withdraw_lp", "failure"),
    ],
  },
  {
    id: "direct_claim",
    labelKey: "messages.barkxPool.groups.directClaim",
    messages: [
      createMessage("direct_claim_success", "direct_claim", "success", {
        barkxAmount: "0.000000",
      }),
      createMessage("direct_claim_failure_retry", "direct_claim", "failure"),
    ],
  },
  {
    id: "compound",
    labelKey: "messages.barkxPool.groups.compound",
    messages: [
      createMessage("compound_success", "compound", "success", {
        barkxAmount: "0.000000",
        lpAmount: "0.000000",
      }),
      createMessage(
        "compound_failure_cap_exceeded",
        "compound",
        "failure",
      ),
      createMessage("compound_failure_retry", "compound", "failure"),
    ],
  },
]);

export const BARKX_POOL_MESSAGES = Object.freeze(
  BARKX_POOL_MESSAGE_GROUPS.reduce((map, group) => {
    group.messages.forEach((message) => {
      map[message.key] = message;
    });

    return map;
  }, {}),
);

export const BARKX_POOL_MESSAGE_KEYS = Object.freeze(
  Object.keys(BARKX_POOL_MESSAGES),
);

export function resolveBarkxPoolMessage(messageKey, params = {}) {
  const message = BARKX_POOL_MESSAGES[messageKey];

  if (!message) {
    return null;
  }

  const mergedParams = {
    ...message.defaults,
    ...params,
  };

  return {
    ...message,
    label: translate(
      BARKX_POOL_MESSAGE_GROUPS.find((group) => group.id === message.group)?.labelKey ||
        "",
    ),
    text: translate(message.textKey, mergedParams),
  };
}
