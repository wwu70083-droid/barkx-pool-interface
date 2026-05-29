import { translate } from "@/i18n";

function createMessage(key, group, outcome, defaults = {}) {
  return {
    key,
    group,
    outcome,
    textKey: `messages.uniswap.items.${key}`,
    defaults,
  };
}

export const UNISWAP_MESSAGE_GROUPS = Object.freeze([
  {
    id: "swap",
    labelKey: "messages.uniswap.groups.swap",
    messages: [
      createMessage("uniswap_swap_success", "swap", "success"),
      createMessage("uniswap_swap_failure_retry", "swap", "failure"),
    ],
  },
  {
    id: "add_liquidity",
    labelKey: "messages.uniswap.groups.addLiquidity",
    messages: [
      createMessage("uniswap_add_liquidity_success", "add_liquidity", "success", {
        lpAmount: "0.000000",
      }),
      createMessage(
        "uniswap_add_liquidity_failure_retry",
        "add_liquidity",
        "failure",
      ),
    ],
  },
  {
    id: "remove_liquidity",
    labelKey: "messages.uniswap.groups.removeLiquidity",
    messages: [
      createMessage(
        "uniswap_remove_liquidity_success",
        "remove_liquidity",
        "success",
        {
          lpAmount: "0.000000",
        },
      ),
      createMessage(
        "uniswap_remove_liquidity_failure_retry",
        "remove_liquidity",
        "failure",
      ),
    ],
  },
]);

export const UNISWAP_MESSAGES = Object.freeze(
  UNISWAP_MESSAGE_GROUPS.reduce((map, group) => {
    group.messages.forEach((message) => {
      map[message.key] = message;
    });

    return map;
  }, {}),
);

export function resolveUniswapMessage(messageKey, params = {}) {
  const message = UNISWAP_MESSAGES[messageKey];

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
      UNISWAP_MESSAGE_GROUPS.find((group) => group.id === message.group)?.labelKey ||
        "",
    ),
    text: translate(message.textKey, mergedParams),
  };
}
