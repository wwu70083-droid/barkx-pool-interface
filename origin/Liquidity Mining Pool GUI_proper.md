# Liquidity Mining Pool GUI

<!--

BARKX-USDT on Uniswap V2 (Arbitrum One)

Understanding the mechanics:

The BarkX mining pool is a liquidity mining pool taking user-staked BARKX-USDT LP tokens as the only mining power to allocate the crypto BARKX.

Users have multiple ways to enter the pool:

The first one is the most recommended, which is depositing VN. VN is short for Vector Nexus, an ERC-1155 token representing the right to join the pool. Once one unused VN is deposited, 100 BARKX will be given for free and paired with the user's USDT to mint new LP. The LP is auto staked and become mining power. This way of entry will lock the deposit for 360 days for both VN and LP.

The second one is depositing LP. Users can manually pair BARKX and USDT to mint LP in Uniswap and then have BARKX-USDT LP in their wallet. They must have at least one VN (by the first way) in the pool first before adding these additional LP. This way of entry will not suffer any lock for the LP.

However, deposited VN provides LP Effective Cap. One VN can support 100 LP. Unsupported LP cannot provide mining power. To activate all LP in the pool, users must ensure they have deposited enough VN.

To distinguish unused VN and used VN, all VN deposited are wrapped into wVN, which is ERC-721. This progress cannot be reversed. Any VN withdrawn from the pool are wVN. Therefore, users mainly deposit wVN to expand LP Effective Cap. These wVN deposit will not suffer any lock.

-->

## Top Bar

### Show Menu Button

### Show Connected Wallet

<!--

If not connected, show the connect button.

-->

## Menu

1. Dashboard
2. Swap
3. Liquidity
4. BarkX Pool
5. Settings

<!--

The HTML pages should be divided based on the main features and let pages jump in a directory. Do not put all codes in one HTML!

-->

## Dashboard

### Show Uniswap Pricing: BARKX/USDT

* Price Display Precision: 0.000

### Show APY

* APY Display Precision: 0.00%

### Idle VN in Wallet

#### Show Wallet Balance: VN

* Amount Display Precision: Integer

#### Show Wallet Balance: wVN

* Amount Display Precision: Integer

### Show Show Pending Rewards Amount: BARKX

* Amount Display Precision: 0.00

### Show Show Achieved Rewards Amount: BARKX

* Amount Display Precision: 0.00

### My Deposit

#### Show Deposited Amount: VN

* Amount Display Precision: Integer

#### Show LP Effective Cap Amount: LP

* Amount Display Precision: 0.000000

#### Show Deposited Amount: LP

* Amount Display Precision: 0.000000

## Swap

<!--

Fork the Uniswap common GUI for the BARKX-USDT swapping on Uniswap V2.

Other crypto swapping are not supported here.

-->

## Liquidity

### Add Liquidity

<!--

Fork the Uniswap common GUI for the BARKX-USDT liquidity adding on Uniswap V2.

Other crypto liquidity providing are not supported here.

-->

### Remove Liquidity

<!--

Fork the Uniswap common GUI for the BARKX-USDT liquidity removal on Uniswap V2.

Other crypto liquidity removal are not supported here.

-->

## BarkX Pool

### Deposit VN

Deposit your new VN with USDT to auto-mint LP. Get 100 BARKX bonus per VN!

#### Show APY

* APY Display Precision: 0.00%

#### Show Lock Period: 360 Days

#### Set Input Amount: VN

* Amount Display Precision: Integer

* Show MAX Button (out of wallet balance)

#### Show Bonus Amount: BARKX

* Amount Display Precision: 0.00

All BARKX bonus will be paired with USDT to mint BARKX-USDT LP.

#### Show Uniswap Pricing: BARKX/USDT

* Price Display Precision: 0.000

#### Show Pairing Amount: USDT

* Amount Display Precision: 0.00

<!--

The USDT needed is auto-calculated.

-->

#### Show Wallet Balance: USDT

* Amount Display Precision: 0.00

#### Show Confirm Deposit Button

* Show Unlock Date of Deposit (360 days later)

<!--

If the smart contract approval is needed, show approve buttons for VN and USDT instead of deposit.

-->

#### Messages After User Operation

* Success

	- Deposit is completed. 0.000000 LP has been generated and sent to the mining pool.

* Failure

	- Failed. Insufficient VN wallet balance.

	- Failed. Insufficient USDT wallet balance.

	- Failed. Please try again.

### Deposit wVN

Deposit your used VN to expand LP Effective Cap. No lock period!

#### Show APY

* APY Display Precision: 0.00%

#### Set Input Amount: wVN

* Amount Display Precision: Integer

* Show MAX Button (out of wallet balance)

#### Show LP Effective Cap Increasing Amount: LP

* Amount Display Precision: 0.000000

#### Show Confirm Deposit Button

<!--

If the smart contract approval is needed, show the approve button for wVN instead of deposit.

-->

#### Messages After User Operation

* Success

	- Deposit is completed. You now have more LP space in the mining pool.

* Failure

	- Failed. Insufficient wVN wallet balance.

	- Failed. You must have at least 0.000000 LP in the mining pool before depositing additional wVN.

	- Failed. Please try again.

### Deposit LP

Deposit your LP to increase mining power. No lock period!

#### Show APY

* APY Display Precision: 0.00%

#### Set Input Amount: LP

* Amount Display Precision: 0.000000

* Show 25%/50%/75%/100% Button (out of wallet balance)

#### Show Confirm Deposit Button

<!--

If the smart contract approval is needed, show the approve button for LP instead of deposit.

-->

#### Messages After User Operation

* Success

	- Deposit is completed.

* Failure

	- Failed. Insufficient LP wallet balance.

	- Failed. You must have at least 1 VN in the mining pool before depositing additional LP.

	- Failed. Please try again.  

### Withdraw wVN

Withdraw unlocked VN from the pool. Your LP Effective Cap will decrease.

#### Show Unlocked Amount: wVN

* Amount Display Precision: Integer

#### Set Output Amount: wVN

* Amount Display Precision: Integer

#### Show LP Effective Cap Decreasing Amount: LP

* Amount Display Precision: 0.000000

#### Show Confirm Withdrawal Button

#### Messages After User Operation

* Success

	- Withdrawal is completed. You now have less LP space in the mining pool.

	- Withdrawal is completed. All of your wVN and LP has been removed and returned to your wallet.

* Failure

	- Failed. Please try again. 

### Withdraw LP

Withdraw unlocked LP from the pool. Your mining power will decrease.

#### Show Unlocked Amount: LP

* Amount Display Precision: 0.000000

#### Set Output Amount: LP

* Amount Display Precision: 0.000000

#### Show Confirm Withdrawal Button

#### Messages After User Operation

* Success

	- Withdrawal is completed.

* Failure

	- Failed. You must have at least 0.000000 LP deposited when you have VN in the mining pool. 

	- Failed. Please try again. 

### Rewards

Claim rewards to your wallet or compound it into new LP and save 67% fees!

#### Show Pending Rewards Amount: BARKX

* Amount Display Precision: 0.00

#### Show Direct Claim Button

* Show Tax Rate: 30.00%

* Show Receiving Amount: BARKX

	* Amount Display Precision: 0.00

#### Show Compound Button

* Show Tax Rate: 10.00%

* Show Utilized Amount: BARKX

	* Amount Display Precision: 0.00

* Show Predicted LP Amount: LP

	* Amount Display Precision: 0.000000

* Show Unlock Date of Deposit (90 days later)

#### Messages After User Operation

* Success

	- Well done. 0.000000 BARKX has been claimed to wallet.

	- Well done. 0.000000 BARKX has been compounded into 0.000000 LP and sent to the mining pool.

* Failure

	- Failed. Please try again. 

## Settings

### Wallet Management

#### Copy Address

#### Switch

#### Disconnect

### Display Language

* EN

* CN

### Useful Links

#### Docs

#### Discord

### Version

v1.0