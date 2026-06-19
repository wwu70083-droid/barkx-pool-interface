require("dotenv").config();
const { ethers } = require("ethers");
const p = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const w = new ethers.Wallet(process.env.PRIVATE_KEY_OWNER, p);
const vn = new ethers.Contract(
  process.env.VN_ADDRESS,
  [
    "function setMaxPerWallet(uint256)",
    "function maxPerWallet() view returns(uint256)",
  ],
  w,
);
(async () => {
  console.log("当前 maxPerWallet:", (await vn.maxPerWallet()).toString());
  const tx = await vn.setMaxPerWallet(100000);
  await tx.wait();
  console.log("已修改为 100000, tx:", tx.hash);
})();
