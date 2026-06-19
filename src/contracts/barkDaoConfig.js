const env = import.meta.env ?? {};

export const BARKDAO_CONTRACTS = Object.freeze({
  dao: env.VITE_BARKDAO_ADDRESS || "",
});

export const BARKDAO_CONTRACT_ENV_KEYS = Object.freeze({
  dao: "VITE_BARKDAO_ADDRESS",
});

export function hasBarkDaoAddress() {
  return !!BARKDAO_CONTRACTS.dao;
}

export function getMissingBarkDaoContractEnvKeys() {
  return Object.entries(BARKDAO_CONTRACTS).reduce((missing, [key, value]) => {
    if (!value) {
      missing.push(BARKDAO_CONTRACT_ENV_KEYS[key]);
    }

    return missing;
  }, []);
}
