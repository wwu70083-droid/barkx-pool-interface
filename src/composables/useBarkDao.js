import { computed, ref } from "vue";
import { getAddress, isAddress, zeroAddress } from "viem";
import { BarkDaoAbi } from "@/abi";
import {
  getGasOverrides,
  getPublicClient,
  getWalletClient,
  waitForTx,
  writeContractWithGasBuffer,
} from "@/composables/useContracts";
import {
  BARKDAO_CONTRACTS,
  hasBarkDaoAddress,
} from "@/contracts/barkDaoConfig";
import { useMainStore } from "@/store";

const loading = ref(false);
const highestParentAddress = ref("");
const recipient = ref("");
const disableRegister = ref(false);
const registrationFee = ref(0n);
const ethPaymentEnabled = ref(false);
const userMember = ref({ parent: "", joinedBlock: 0n });
const userLevel = ref(0n);
const currentUserAddress = ref("");

const contractConfigured = computed(() => hasBarkDaoAddress());
const isRegistered = computed(() => {
  if (!currentUserAddress.value) {
    return false;
  }

  return (
    isSameAddress(currentUserAddress.value, highestParentAddress.value) ||
    hasNonZeroAddress(userMember.value.parent)
  );
});
const inviterAddress = computed(() =>
  hasNonZeroAddress(userMember.value.parent) ? userMember.value.parent : "",
);

function hasNonZeroAddress(address) {
  return isAddress(address || "") && !isSameAddress(address, zeroAddress);
}

function isSameAddress(left, right) {
  if (!left || !right) {
    return false;
  }

  try {
    return getAddress(left) === getAddress(right);
  } catch {
    return false;
  }
}

function resetConfigState() {
  highestParentAddress.value = "";
  recipient.value = "";
  disableRegister.value = false;
  registrationFee.value = 0n;
  ethPaymentEnabled.value = false;
}

function resetUserState() {
  currentUserAddress.value = "";
  userMember.value = { parent: "", joinedBlock: 0n };
  userLevel.value = 0n;
}

function getDaoAddress() {
  return BARKDAO_CONTRACTS.dao;
}

async function fetchConfig() {
  if (!contractConfigured.value) {
    resetConfigState();
    return;
  }

  const client = getPublicClient();
  const daoAddress = getDaoAddress();
  const results = await client.multicall({
    contracts: [
      { address: daoAddress, abi: BarkDaoAbi, functionName: "highestParentAddress" },
      { address: daoAddress, abi: BarkDaoAbi, functionName: "recipient" },
      { address: daoAddress, abi: BarkDaoAbi, functionName: "disableRegister" },
      { address: daoAddress, abi: BarkDaoAbi, functionName: "payInfo", args: [zeroAddress] },
    ],
  });

  highestParentAddress.value = results[0].result ?? "";
  recipient.value = results[1].result ?? "";
  disableRegister.value = !!results[2].result;

  const payInfoResult = results[3].result;
  registrationFee.value =
    payInfoResult?.registrationFee ??
    payInfoResult?.[0] ??
    0n;
  ethPaymentEnabled.value =
    payInfoResult?.state ??
    payInfoResult?.[1] ??
    false;
}

async function fetchUserData(userAddress) {
  if (!contractConfigured.value || !isAddress(userAddress || "")) {
    resetUserState();
    return;
  }

  const normalizedAddress = getAddress(userAddress);
  const client = getPublicClient();
  const daoAddress = getDaoAddress();
  const results = await client.multicall({
    contracts: [
      { address: daoAddress, abi: BarkDaoAbi, functionName: "members", args: [normalizedAddress] },
      { address: daoAddress, abi: BarkDaoAbi, functionName: "levels", args: [normalizedAddress] },
    ],
  });

  const memberResult = results[0].result;
  userMember.value = {
    parent: memberResult?.parent ?? memberResult?.[0] ?? "",
    joinedBlock: memberResult?.joinedBlock ?? memberResult?.[1] ?? 0n,
  };
  userLevel.value = results[1].result ?? 0n;
  currentUserAddress.value = normalizedAddress;
}

async function validateParentAddress(parentAddress) {
  if (!contractConfigured.value || !isAddress(parentAddress || "")) {
    return {
      address: "",
      exists: false,
      isRoot: false,
      disabled: false,
      memberParent: "",
    };
  }

  const normalizedAddress = getAddress(parentAddress);
  const client = getPublicClient();
  const daoAddress = getDaoAddress();
  const results = await client.multicall({
    contracts: [
      { address: daoAddress, abi: BarkDaoAbi, functionName: "disableChildRegistration", args: [normalizedAddress] },
      { address: daoAddress, abi: BarkDaoAbi, functionName: "members", args: [normalizedAddress] },
    ],
  });

  const memberResult = results[1].result;
  const memberParent = memberResult?.parent ?? memberResult?.[0] ?? "";
  const isRoot = isSameAddress(normalizedAddress, highestParentAddress.value);

  return {
    address: normalizedAddress,
    exists: isRoot || hasNonZeroAddress(memberParent),
    isRoot,
    disabled: !!results[0].result,
    memberParent,
  };
}

async function fetchAll(userAddress = "") {
  const store = useMainStore();
  store.startChainReadPending();
  loading.value = true;

  try {
    await fetchConfig();
    await fetchUserData(userAddress);

    return {
      contractConfigured: contractConfigured.value,
      highestParentAddress: highestParentAddress.value,
      recipient: recipient.value,
      disableRegister: disableRegister.value,
      registrationFee: registrationFee.value,
      ethPaymentEnabled: ethPaymentEnabled.value,
      isRegistered: isRegistered.value,
      inviterAddress: inviterAddress.value,
      userLevel: userLevel.value,
      joinedBlock: userMember.value.joinedBlock,
    };
  } finally {
    loading.value = false;
    store.finishChainReadPending();
  }
}

async function registerWithEth(parentAddress) {
  if (!contractConfigured.value) {
    throw new Error("DAO_NOT_CONFIGURED");
  }

  await fetchConfig();

  if (!ethPaymentEnabled.value) {
    throw new Error("DAO_ETH_PAYMENT_DISABLED");
  }

  if (disableRegister.value) {
    throw new Error("DAO_REGISTER_DISABLED");
  }

  if (!isAddress(parentAddress || "")) {
    throw new Error("DAO_INVALID_PARENT");
  }

  const store = useMainStore();
  if (!isAddress(store.account || "")) {
    throw new Error("NO_WALLET_ACCOUNT");
  }

  const normalizedParent = getAddress(parentAddress);
  const normalizedUserAddress = getAddress(store.account);

  if (isSameAddress(normalizedParent, normalizedUserAddress)) {
    throw new Error("DAO_SELF_PARENT_FORBIDDEN");
  }

  const parentValidation = await validateParentAddress(normalizedParent);

  if (parentValidation.isRoot) {
    throw new Error("DAO_ROOT_FORBIDDEN");
  }

  if (!parentValidation.exists) {
    throw new Error("DAO_PARENT_NOT_FOUND");
  }

  if (parentValidation.disabled) {
    throw new Error("DAO_PARENT_DISABLED");
  }

  if (isRegistered.value) {
    throw new Error("DAO_ALREADY_REGISTERED");
  }

  const walletClient = getWalletClient();
  if (!walletClient) {
    throw new Error("NO_INJECTED_WALLET");
  }

  const [userAccount] = await walletClient.getAddresses();
  const gasOverrides = await getGasOverrides();
  await getPublicClient().simulateContract({
    address: getDaoAddress(),
    abi: BarkDaoAbi,
    functionName: "register",
    args: [normalizedParent, zeroAddress, 0n],
    account: userAccount,
    value: registrationFee.value,
  });

  const hash = await writeContractWithGasBuffer(walletClient, {
    address: getDaoAddress(),
    abi: BarkDaoAbi,
    functionName: "register",
    args: [normalizedParent, zeroAddress, 0n],
    account: userAccount,
    value: registrationFee.value,
    ...gasOverrides,
  });

  await waitForTx(hash);
  await fetchAll(userAccount);
  return hash;
}

export function useBarkDao() {
  return {
    loading,
    contractConfigured,
    highestParentAddress,
    recipient,
    disableRegister,
    registrationFee,
    ethPaymentEnabled,
    userMember,
    userLevel,
    isRegistered,
    inviterAddress,
    resetUserState,
    fetchConfig,
    fetchUserData,
    validateParentAddress,
    fetchAll,
    registerWithEth,
  };
}
