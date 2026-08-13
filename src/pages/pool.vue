<template>
  <Transition name="custom-modal-fade">
    <div
      v-if="isNodeStatusModalOpen"
      class="custom-modal-overlay"
      @click="closeNodeStatusModal"
    >
      <div
        class="custom-modal cyan-theme"
        @click.stop
      >
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="closeNodeStatusModal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="custom-modal-title">{{ $t("pages.pool.depositStatus.title") }}</div>
        <div class="custom-modal-text" v-html="nodeStatusModalContent"></div>
      </div>
    </div>
  </Transition>

  <Transition name="custom-modal-fade">
    <div
      v-if="isEstimateModalOpen"
      class="custom-modal-overlay"
      @click="closeEstimateModal"
    >
      <div
        class="custom-modal cyan-theme"
        @click.stop
      >
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="closeEstimateModal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="custom-modal-title">{{ $t("pages.pool.estimate.title") }}</div>
        <div class="custom-modal-text" v-html="estimateModalContent"></div>
      </div>
    </div>
  </Transition>

  <MiningShell>
    <div style="text-align: center; margin-bottom: 20px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.pool.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.pool.subtitle") }}
      </p>
    </div>

    <div class="tabs">
      <div
        class="tab"
        :class="{ active: activeTab === 'dep-vn' }"
        @click="activeTab = 'dep-vn'"
      >
        {{ $t("pages.pool.tabs.depositVn") }}
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'dep-more' }"
        @click="activeTab = 'dep-more'"
      >
        {{ $t("pages.pool.tabs.depositMore") }}
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'withdraw' }"
        @click="activeTab = 'withdraw'"
      >
        {{ $t("pages.pool.tabs.withdraw") }}
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'rewards' }"
        @click="activeTab = 'rewards'"
      >
        {{ $t("pages.pool.tabs.rewards") }}
      </div>
    </div>

    <div id="dep-vn" class="panel" :class="{ active: activeTab === 'dep-vn' }">
      <div class="info-box">
        {{ $t("pages.pool.depositVn.infoBefore") }}<strong style="color: var(--cyan); text-shadow: 0 0 10px var(--cyan-glow)">{{ barkXPerVN > 0n ? formatTokenAmount(barkXPerVN, 18, 0) : '—' }} BARKX</strong>{{ $t("pages.pool.depositVn.infoAfter") }}
      </div>

      <div class="stats-grid three-cols">
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
          <div class="stat-card-value green">{{ aprDisplay }}</div>
        </div>
        <div class="stat-card interactive" :title="$t('pages.pool.common.nodeBoostTitle')" @click="goToNodeBoost">
          <div class="stat-card-title">{{ $t("nav.nodeBoost") }}</div>
          <div class="stat-card-value amber stat-card-value--interactive">
            x{{ nodeBoostMultiplier.toFixed(2) }}
            <svg
              class="stat-card-inline-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
          <div class="stat-card-value" style="color: var(--text-primary)">
            {{ formatLockPeriod(lockModeA) }}
          </div>
        </div>
      </div>

      <div
        class="stat-card"
        style="
          margin-top: -4px;
          margin-bottom: 16px;
          padding: 14px;
          background: rgba(56, 189, 248, 0.05);
          border-color: rgba(56, 189, 248, 0.2);
        "
      >
        <div
          style="
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          "
        >
          {{ $t("pages.pool.personalBoostedApy") }}
        </div>
        <div
          class="stat-card-value"
          style="
            color: var(--cyan);
            font-size: 22px;
            text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
          "
        >
          {{ personalBoostedApyDisplay }}
        </div>
      </div>

      <div class="input-group" style="margin-top: 16px">
        <div class="input-header">
          <span>{{ $t("pages.pool.depositVn.depositNewVn") }}</span><span>{{ $t("common.balance", { amount: formatIntegerAmount(vnBalance) }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="depositVnInput"
            type="text"
            inputmode="numeric"
            class="input-field"
            placeholder="0"
          />
          <div class="asset-badge">VN</div>
        </div>
        <div class="percent-btns">
          <button class="p-btn" type="button" @click="setMaxVN">{{ $t("common.max") }}</button>
        </div>
      </div>

      <div
        style="
          text-align: center;
          color: var(--text-muted);
          font-size: 24px;
          margin: 8px 0;
        "
      >
        ↓
      </div>

      <div class="input-group" style="margin-top: 8px; border-color: var(--cyan)">
        <div class="input-header">
          <span style="color: var(--cyan); font-weight: 600"
            >{{ $t("pages.pool.depositVn.bonusToDeposit") }}</span
          >
          <span>{{ $t("pages.pool.depositVn.barkxPrice", { price: barkxPrice > 0 ? truncateFixed(barkxPrice, 3) : '—' }) }}</span>
        </div>
        <div class="input-row">
          <input
            :value="formattedBonusBarkx"
            type="number"
            class="input-field"
            placeholder="0.00"
            readonly
            style="color: var(--cyan)"
          />
          <div class="asset-badge">BARKX</div>
        </div>
      </div>

      <div
        style="
          text-align: center;
          color: var(--text-muted);
          font-size: 24px;
          margin: 8px 0;
        "
      >
        +
      </div>

      <div class="input-group" style="margin-top: 8px">
        <div class="input-header">
          <span>{{ $t("pages.pool.depositVn.pairingWith") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(usdtBalance, 6, 2) + ' USDT' }) }}</span>
        </div>
        <div class="input-row">
          <input
            :value="formattedPairingUsdt"
            type="number"
            class="input-field"
            placeholder="0.00"
            readonly
          />
          <div class="asset-badge">USDT</div>
        </div>
      </div>

      <div class="data-row" style="margin-top: 16px">
        <span class="data-lbl">{{ $t("pages.pool.depositVn.predictedLp") }}</span
        ><span class="data-val highlight">~{{ predictedLp }} LP</span>
      </div>

      <ApprovalActionGroup
        :requirements="depositVnRequirements"
        :check-handler="checkDepositVnApproval"
        :approve-handler="handleDepositVnApprove"
        :action-label="$t('pages.pool.depositVn.action')"
        :action-disabled="depositVnDisabled"
        :action-pending-text="$t('pages.pool.depositVn.pending')"
        @action="handleDepositVn"
      />
      <div
        style="
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-muted);
        "
      >
        {{ $t("pages.pool.depositVn.unlockDate", { date: unlockDate360 }) }}
      </div>
    </div>

    <div id="dep-more" class="panel" :class="{ active: activeTab === 'dep-more' }">
      <div class="sub-tab-container">
        <button
          class="sub-tab-btn"
          :class="{ active: activeDepositMoreTab === 'dep-more-lp' }"
          type="button"
          @click="activeDepositMoreTab = 'dep-more-lp'"
        >
          {{ $t("pages.pool.depositMore.lp") }}
        </button>
        <button
          class="sub-tab-btn"
          :class="{ active: activeDepositMoreTab === 'dep-more-wvn' }"
          type="button"
          @click="activeDepositMoreTab = 'dep-more-wvn'"
        >
          {{ $t("pages.pool.depositMore.wvn") }}
        </button>
      </div>

      <div
        id="dep-more-lp"
        class="sub-panel"
        :style="{ display: activeDepositMoreTab === 'dep-more-lp' ? 'block' : 'none' }"
      >
        <div class="info-box">
          {{ $t("pages.pool.depositMore.lpInfo", { lockPeriod: formatLockPeriod(lockModeB) }) }}
        </div>
      <div class="stats-grid three-cols">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
            <div class="stat-card-value green">{{ aprDisplay }}</div>
          </div>
          <div class="stat-card interactive" :title="$t('pages.pool.common.nodeBoostTitle')" @click="goToNodeBoost">
            <div class="stat-card-title">{{ $t("nav.nodeBoost") }}</div>
            <div class="stat-card-value amber stat-card-value--interactive">
              x{{ nodeBoostMultiplier.toFixed(2) }}
              <svg
                class="stat-card-inline-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">
              {{ formatLockPeriod(lockModeB) }}
            </div>
          </div>
        </div>

        <div
          class="stat-card"
          style="
            margin-top: -4px;
            margin-bottom: 16px;
            padding: 14px;
            background: rgba(56, 189, 248, 0.05);
            border-color: rgba(56, 189, 248, 0.2);
          "
        >
          <div
            style="
              font-size: 11px;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            "
          >
            {{ $t("pages.pool.personalBoostedApy") }}
          </div>
          <div
            class="stat-card-value"
            style="
              color: var(--cyan);
              font-size: 22px;
              text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            "
          >
            {{ personalBoostedApyDisplay }}
          </div>
        </div>

        <div class="input-group" style="margin-top: 16px">
          <div class="input-header">
            <span>{{ $t("pages.pool.depositMore.depositLp") }}</span><span>{{ $t("common.balance", { amount: formatTokenAmount(lpBalance) }) }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="depositLpInput"
              type="text"
              inputmode="decimal"
              class="input-field"
              placeholder="0.000000"
            />
            <div class="asset-badge">LP</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="setLpPercent(25)">25%</button
            ><button class="p-btn" type="button" @click="setLpPercent(50)">50%</button>
            <button class="p-btn" type="button" @click="setLpPercent(75)">75%</button
            ><button class="p-btn" type="button" @click="setLpPercent(100)">100%</button>
          </div>
        </div>
        <ApprovalActionGroup
          :requirements="depositLpRequirements"
          :check-handler="checkDepositLpApproval"
          :approve-handler="handleDepositLpApprove"
          :action-label="$t('pages.pool.depositMore.depositLpAction')"
          :action-disabled="depositLpDisabled"
          :action-pending-text="$t('pages.pool.depositMore.depositLpPending')"
          @action="handleDepositLp"
        />
        <div
          style="
            text-align: center;
            margin-top: 12px;
            font-size: 12px;
            color: var(--text-muted);
          "
        >
          {{ $t("pages.pool.depositMore.unlockLater", { lockPeriod: formatLockPeriod(lockModeB) }) }}
        </div>
      </div>

      <div
        id="dep-more-wvn"
        class="sub-panel"
        :style="{ display: activeDepositMoreTab === 'dep-more-wvn' ? 'block' : 'none' }"
      >
        <div class="info-box">
          {{ $t("pages.pool.depositMore.wvnInfo", { lockPeriod: formatLockPeriod(lockModeB) }) }}
        </div>
        <div class="stats-grid three-cols">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
            <div class="stat-card-value green">{{ aprDisplay }}</div>
          </div>
          <div class="stat-card interactive" :title="$t('pages.pool.common.nodeBoostTitle')" @click="goToNodeBoost">
            <div class="stat-card-title">{{ $t("nav.nodeBoost") }}</div>
            <div class="stat-card-value amber stat-card-value--interactive">
              x{{ nodeBoostMultiplier.toFixed(2) }}
              <svg
                class="stat-card-inline-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">
              {{ formatLockPeriod(lockModeB) }}
            </div>
          </div>
        </div>

        <div
          class="stat-card"
          style="
            margin-top: -4px;
            margin-bottom: 16px;
            padding: 14px;
            background: rgba(56, 189, 248, 0.05);
            border-color: rgba(56, 189, 248, 0.2);
          "
        >
          <div
            style="
              font-size: 11px;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            "
          >
            {{ $t("pages.pool.personalBoostedApy") }}
          </div>
          <div
            class="stat-card-value"
            style="
              color: var(--cyan);
              font-size: 22px;
              text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            "
          >
            {{ personalBoostedApyDisplay }}
          </div>
        </div>

        <div class="input-group" style="margin-top: 16px">
          <div class="input-header">
            <span>{{ $t("pages.pool.depositMore.depositUsedVn") }}</span><span>{{ $t("common.balance", { amount: formatIntegerAmount(wvn1Balance) }) }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="depositWvnInput"
              type="text"
              inputmode="numeric"
              class="input-field"
              placeholder="0"
            />
            <div class="asset-badge" style="background: var(--bg-card-solid)">
              wVN
            </div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="setMaxWvn1">{{ $t("common.max") }}</button>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.depositMore.capIncrease") }}</span
          ><span class="data-val highlight">+{{ depositWvnCapIncrease > 0n ? formatTokenAmount(depositWvnCapIncrease) : '0.000000' }} LP</span>
        </div>
        <ApprovalActionGroup
          :requirements="depositWvnRequirements"
          :check-handler="checkDepositWvnApproval"
          :approve-handler="handleDepositWvnApprove"
          :action-label="$t('pages.pool.depositMore.depositWvnAction')"
          :action-disabled="depositWvnDisabled"
          :action-pending-text="$t('pages.pool.depositMore.depositWvnPending')"
          @action="handleDepositWvn"
        />
        <div
          style="
            text-align: center;
            margin-top: 12px;
            font-size: 12px;
            color: var(--text-muted);
          "
        >
          {{ $t("pages.pool.depositMore.unlockLater", { lockPeriod: formatLockPeriod(lockModeB) }) }}
        </div>
      </div>
    </div>

    <div id="withdraw" class="panel" :class="{ active: activeTab === 'withdraw' }">
      <div class="info-box amber">
        {{ $t("pages.pool.withdraw.info") }}
      </div>

      <div class="sub-tab-container" style="margin-bottom: 12px">
        <button
          class="sub-tab-btn"
          :class="{ active: activeWithdrawTab === 'wd-wvn-lp' }"
          type="button"
          @click="activeWithdrawTab = 'wd-wvn-lp'"
        >{{ $t("pages.pool.withdraw.tabWvnLp") }}</button>
        <button
          class="sub-tab-btn"
          :class="{ active: activeWithdrawTab === 'wd-wvn-or-lp' }"
          type="button"
          @click="activeWithdrawTab = 'wd-wvn-or-lp'"
        >{{ $t("pages.pool.withdraw.tabWvnOrLp") }}</button>
        <button
          class="sub-tab-btn"
          :class="{ active: activeWithdrawTab === 'wd-lp-only' }"
          type="button"
          @click="activeWithdrawTab = 'wd-lp-only'"
        >{{ $t("pages.pool.withdraw.tabLpOnly") }}</button>
      </div>

      <div
        v-show="activeWithdrawTab === 'wd-wvn-lp'"
        id="locked-stat-row"
        class="data-row"
        style="
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 12px;
        "
      >
        <span class="data-lbl">{{ $t("pages.pool.withdraw.miningPower") }}</span>
        <span class="data-val highlight">{{ lockedMiningPowerDisplay }} LP</span>
      </div>

      <div
        v-show="activeWithdrawTab === 'wd-wvn-or-lp'"
        id="deposited-stat-row"
        class="data-row"
        style="
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 12px;
        "
      >
        <span class="data-lbl">{{ $t("pages.pool.withdraw.miningPower") }}</span>
        <span class="data-val highlight">{{ depositedMiningPowerDisplay }} LP</span>
      </div>

      <div
        v-show="activeWithdrawTab === 'wd-lp-only'"
        id="compounding-stat-row"
        class="data-row"
        style="
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 12px;
        "
      >
        <span class="data-lbl">{{ $t("pages.pool.withdraw.miningPower") }}</span>
        <span class="data-val highlight">{{ compoundingMiningPowerDisplay }} LP</span>
      </div>

      <!-- Select All -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px">
        <label class="wd-select-all">
          <input
            ref="wdSelectAllInput"
            type="checkbox"
            :checked="wdSelectAllChecked"
            @change="setCurrentPageSelected($event.target.checked)"
          />
          {{ $t("pages.pool.withdraw.selectAll") }}
        </label>
      </div>

      <!-- Order list -->
      <div class="order-list">
        <div v-if="wdPagedList.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px">
          {{ $t("pages.pool.withdraw.noRecords") }}
        </div>
        <div
          v-for="item in wdPagedList"
          :key="item.key"
          class="order-item"
          :class="{ 'is-selected': wdSelected.has(item.key), 'is-locked': !item.isUnlocked || item.isConfirming }"
          @click="item.isUnlocked && !item.isConfirming && toggleSelect(item.key)"
        >
          <input
            type="checkbox"
            class="order-checkbox"
            :checked="isWithdrawItemSelected(item.key)"
            :disabled="!item.isUnlocked || item.isConfirming"
            @click.stop
            @change="setWithdrawItemSelected(item.key, $event.target.checked)"
          />
          <div class="order-details-left">
            <div class="order-id">{{ item.txHash ? (item.txHash.slice(0, 6) + '...' + item.txHash.slice(-4)) : '#' + item.idx }}</div>
            <div v-if="item.isConfirming" class="order-status is-confirming">
              {{ $t("pages.pool.withdraw.confirming") }}
            </div>
            <div v-else class="order-status" :class="item.isUnlocked ? 'is-unlocked' : 'is-locked'">
              {{ item.isUnlocked ? $t("pages.pool.withdraw.unlocked") : $t("pages.pool.withdraw.locked") }}
            </div>
          </div>
          <div class="order-assets-right">
            <div v-if="item.vnCount" class="asset-line">{{ item.vnCount }} wVN</div>
            <div v-if="item.lpAmount > 0n" class="asset-line">{{ formatTokenAmount(item.lpAmount) }} LP</div>
            <div style="font-size: 11px; color: var(--text-muted)">{{ formatUnlockDate(item.unlocksAt) }}</div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button class="page-btn" :disabled="wdPage <= 1" @click="wdPage--">&#10094;</button>
        <span style="font-size: 13px; color: var(--text-primary); font-weight: 600; letter-spacing: 1px">{{ wdPage }} / {{ wdTotalPages }}</span>
        <button class="page-btn" :disabled="wdPage >= wdTotalPages" @click="wdPage++">&#10095;</button>
      </div>

      <!-- Aggregated summary -->
      <div class="wd-summary">
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px">
          {{ $t("pages.pool.withdraw.selectedSummary") }}
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.pool.withdraw.totalWvn") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">{{ wdSummary.vnCount }} wVN</span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.pool.withdraw.totalLp") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">{{ formatTokenAmount(wdSummary.lpAmount) }} LP</span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.pool.withdraw.capDecrease") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">-{{ formatTokenAmount(wdSummary.capDecrease) }} LP</span>
        </div>
      </div>

      <button
        class="btn-submit amber"
        style="margin-top: 16px"
        :disabled="wdSelected.size === 0"
        @click="handleWithdrawSelected"
      >
        {{ $t("pages.pool.withdraw.withdrawSelected") }}
      </button>
    </div>

    <div id="rewards" class="panel" :class="{ active: activeTab === 'rewards' }">
      <div class="info-box">
        {{ $t("pages.pool.rewards.infoBefore") }}<strong style="color: var(--green); text-shadow: 0 0 10px var(--green-glow)">{{ compoundDiscount }}</strong>{{ $t("pages.pool.rewards.infoAfter") }}
      </div>

      <div style="text-align: center; padding: 20px 0">
        <div
          style="
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
          "
        >
          {{ $t("pages.pool.rewards.autoAccumulated") }}
        </div>
        <div
          style="
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
          "
        >
          {{ $t("pages.pool.rewards.pendingRewards") }}
        </div>
        <div class="rewards-big-value">
          {{ formatTokenAmount(pendingRewards, 18, REWARD_DISPLAY_DECIMALS) }} <span class="rewards-big-unit">BARKX</span>
        </div>
      </div>

      <div
        style="
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        "
      >
        <div style="font-weight: 600; margin-bottom: 10px">{{ $t("pages.pool.rewards.directClaim") }}</div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.feeRate") }}</span
          ><span class="data-val" style="color: var(--red)">{{ formatBps(directTaxBps) }}</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.receivingAmount") }}</span
          ><span class="data-val">{{ formatTokenAmount(directClaimReceiving, 18, REWARD_DISPLAY_DECIMALS) }} BARKX</span>
        </div>
        <button
          class="btn-submit"
          style="margin-top: 10px"
          :disabled="rewardsDisabled"
          @click="handleDirectClaim"
        >
          {{ directClaimButtonLabel }}
        </button>
      </div>

      <div
        style="
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 12px;
          padding: 16px;
          background: rgba(168, 85, 247, 0.05);
        "
      >
        <div
          style="
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--purple);
          "
        >
          {{ $t("pages.pool.rewards.compoundTitle") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.feeRate") }}</span
          ><span class="data-val" style="color: var(--red)">{{ formatBps(reinvestTaxBps) }}</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.lockPeriod") }}</span
          ><span class="data-val">{{ formatLockPeriod(lockModeC) }}</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.utilizedAmount") }}</span
          ><span class="data-val">{{ formatTokenAmount(compoundUtilized, 18, REWARD_DISPLAY_DECIMALS) }} BARKX</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.pool.rewards.predictedLp") }}</span
          ><span class="data-val">~{{ compoundPredictedLp }} LP</span>
        </div>
        <button class="btn-submit purple" style="margin-top: 10px" :disabled="rewardsDisabled" @click="handleCompound">
          {{ compoundButtonLabel }}
        </button>
        <div
          style="
            text-align: center;
            margin-top: 12px;
            font-size: 12px;
            color: var(--text-muted);
          "
        >
          {{ $t("pages.pool.rewards.lockedUntil", { date: unlockDate90 }) }}
        </div>
      </div>

      <SwapOptionsPanel
        :title="$t('components.collapsibleCard.swapOptions')"
        style="margin-top: 16px; margin-bottom: 0"
        v-model:selected-slippage="selectedSlippage"
        v-model:custom-slippage="customSlippage"
        v-model:deadline="transactionDeadline"
        v-model:expert-mode="expertMode"
      />
    </div>

    <div
      class="card clickable-card cyan"
      style="margin-top: 24px; border-color: var(--border-glow)"
      @click="openNodeStatusModal"
    >
      <div class="card-top-tools">
        <div
          class="card-corner-badge"
          :class="nodeStatusClass"
        >
          <span>{{ nodeStatusLabel }}</span>
        </div>
        <div class="info-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
      </div>

      <div class="card-title">{{ $t("pages.pool.depositStatus.title") }}</div>

      <div class="data-row" style="align-items: flex-start">
        <span class="data-lbl">{{ $t("pages.pool.depositStatus.vectorNexus") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatIntegerAmount(userInfo.vnStaked) }} VN</div>
        </div>
      </div>

      <div class="data-row" style="align-items: flex-start">
        <span class="data-lbl">{{ $t("pages.pool.depositStatus.lpToken") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(userInfo.stakedLP) }} LP</div>
          <div
            style="
              font-size: 12px;
              color: var(--text-muted);
              margin-top: 4px;
            "
          >
            {{ stakedLpUsd }}
          </div>
        </div>
      </div>

      <div class="data-row" style="align-items: flex-start; border-bottom: none">
        <span class="data-lbl">{{ $t("pages.pool.depositStatus.lpCap") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(lpCap) }} LP</div>
          <div
            v-if="lpCap > 0n"
            :style="{
              fontSize: '12px',
              color: lpCapUsageOver70 ? 'var(--amber)' : 'var(--green)',
              marginTop: '4px',
              fontWeight: 500,
            }"
          >
            {{ $t("pages.pool.depositStatus.unusedCap", { amount: formatTokenAmount(lpCapUnused) }) }}
          </div>
        </div>
      </div>

      <div
        v-if="lpCap > 0n && lpCapUsageOver70"
        style="
          background: rgba(245, 158, 11, 0.1);
          border: 1px dashed var(--amber);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--amber);
          text-align: center;
        "
        @click.stop
      >
        💡 {{ $t("pages.pool.depositStatus.noteOver70") }}
      </div>
      <div
        v-else-if="lpCap > 0n"
        style="
          background: rgba(34, 197, 94, 0.1);
          border: 1px dashed var(--green);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
        "
        @click.stop
      >
        💡 {{ $t("pages.pool.depositStatus.note") }}
        <span
          style="color: var(--cyan); cursor: pointer; text-decoration: underline"
          @click="openDepositMoreLp"
          >{{ $t("pages.pool.depositStatus.cta") }}</span
        >
        {{ $t("pages.pool.depositStatus.tail") }}
      </div>

      <button
        class="btn-submit"
        style="margin-top: 16px"
        type="button"
        @click.stop="openEstimateModal"
      >
        {{ $t("pages.pool.depositStatus.estimate") }}
      </button>
    </div>

    <AiBonusModal :open="aiBonusOpen" @close="aiBonusOpen = false" />
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import AiBonusModal from "@/components/mining/AiBonusModal.vue";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import MiningShell from "@/components/mining/MiningShell.vue";
import SwapOptionsPanel from "@/components/mining/SwapOptionsPanel.vue";
import { useMainStore } from "@/store";
import { usePoolData } from "@/composables/usePoolData";
import { useBalances } from "@/composables/useBalances";
import { useApproval } from "@/composables/useApproval";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import { getWalletClient, getPublicClient, getGasOverrides, writeContractWithGasBuffer, waitForTx, ADDRESSES } from "@/composables/useContracts";
import {
  getUserInfo as fetchBackendUserInfo,
  requestClaimSignature,
  getLatestApr,
  getUnlockedDeposits,
  withdrawConfirm,
  getCompoundConfig,
  getCompoundRatio,
} from "@/composables/useBackend";
import { useNotice } from "@/composables/useNotice";
import { resolveBarkxPoolMessage } from "@/components/mining/barkxPoolMessages";
import { getBarkxPoolErrorHint } from "@/contracts/barkxPoolSchema";
import { BarkXPoolAbi, WVN1Abi } from "@/abi";
import {
  calculateApyFromApr,
  formatTokenAmount,
  formatIntegerAmount,
  formatBps,
  parseContractErrorKey,
  safeParseUnits,
  truncateFixed,
} from "@/utils/format";

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { walletConnected, walletIsTargetChain, account } = storeToRefs(store);

const poolData = usePoolData();
const {
  barkxPrice, userInfo, lpPerVN, lpMin, barkXPerVN,
  directTaxBps, reinvestTaxBps, lpCap, lpCapUnused,
  lockModeA, lockModeB, lockModeC,
  modeABuckets,
  isPausedDepositVN, isPausedDepositWVN1, isPausedDepositLP,
  isPausedWithdrawWVN1, isPausedWithdrawLP, isPausedClaim,
  nonce,
} = poolData;

const balances = useBalances();
const { vnBalance, wvn1Balance, lpBalance, usdtBalance } = balances;
const approval = useApproval();
const uniswap = useUniswapV2();
const { showNotice } = useNotice();

const route = useRoute();
const router = useRouter();
const activeTab = ref("dep-vn");
const activeDepositMoreTab = ref("dep-more-lp");
const activeWithdrawTab = ref("wd-wvn-lp");
const depositVnInput = ref("");
const selectedSlippage = ref("0.5%");
const customSlippage = ref("");
const transactionDeadline = ref("20");
const expertMode = ref(false);

// wVN1 token enumeration for Mode B deposit
const userWvn1TokenIds = ref([]);

const depositVnRequirements = computed(() => [
  { id: "pool:vn", label: "VN" },
  { id: "pool:usdt", label: "USDT" },
]);
const depositWvnRequirements = computed(() => [
  { id: "pool:wvn", label: "wVN" },
]);
const depositLpRequirements = computed(() => [
  { id: "pool:lp", label: "LP" },
]);
const MIN_REWARD_ACTION_AMOUNT = 1000000000000000000n;
const REWARD_DISPLAY_DECIMALS = 4;
const MIN_ESTIMATE_LP_CAP = 100000000000000n;
const isNodeStatusModalOpen = ref(false);
const isEstimateModalOpen = ref(false);
const backendPoolUserInfo = ref(null);
const compoundThreshold = ref(50);
const compoundRatio = ref(0);

// --- Action disabled states ---
const depositVnInputInvalid = computed(() => {
  const rawValue = String(depositVnInput.value ?? "").trim();
  if (!/^\d+$/.test(rawValue)) return true;
  if (rawValue.length > 10) return true;

  const vnAmount = BigInt(rawValue);
  if (vnAmount <= 0n) return true;
  if (vnAmount > vnBalance.value) return true;

  return false;
});

const depositVnDisabled = computed(() => {
  if (depositVnInputInvalid.value) return true;
  // Check USDT balance >= pairing USDT needed
  if (pairingUsdt.value > 0) {
    const needed = safeParseUnits(truncateFixed(pairingUsdt.value, 6), 6);
    if (needed && needed > usdtBalance.value) return true;
  }
  return false;
});

const depositWvnInputInvalid = computed(() => {
  const rawValue = String(depositWvnInput.value ?? "").trim();
  if (!/^\d+$/.test(rawValue)) return true;
  if (rawValue.length > 10) return true;

  const wvn = Number(rawValue);
  if (!Number.isInteger(wvn) || wvn <= 0) return true;
  if (wvn > userWvn1TokenIds.value.length) return true;

  return false;
});

const depositWvnDisabled = computed(() => {
  return depositWvnInputInvalid.value;
});

const depositLpInputInvalid = computed(() => {
  const rawAmount = String(depositLpInput.value ?? "").trim();
  const lp = Number(rawAmount) || 0;
  if (lp <= 0) return true;

  const parsedAmount = safeParseUnits(rawAmount, 18);
  if (parsedAmount === null) return true;
  if (parsedAmount > lpBalance.value) return true;

  return false;
});

const depositLpDisabled = computed(() => {
  return depositLpInputInvalid.value;
});

const isNodeActive = computed(() => modeABuckets.value.length > 0);

const nodeStatusLabel = computed(() =>
  t(
    isNodeActive.value
      ? "common.modals.nodeStatus.active"
      : "common.modals.nodeStatus.inactive",
  ),
);

const nodeStatusClass = computed(() =>
  isNodeActive.value ? "status-active" : "status-inactive",
);

const nodeStatusColor = computed(() =>
  isNodeActive.value ? "var(--green)" : "var(--text-muted)",
);

const rewardsDisabled = computed(() => {
  return pendingRewards.value < MIN_REWARD_ACTION_AMOUNT;
});

const directClaimButtonLabel = computed(() =>
  rewardsDisabled.value
    ? t("pages.pool.rewards.lessThanOneAction")
    : t("pages.pool.rewards.directClaimAction"),
);

const compoundButtonLabel = computed(() =>
  rewardsDisabled.value
    ? t("pages.pool.rewards.lessThanOneAction")
    : t("pages.pool.rewards.compoundAction"),
);

const nodeBoostMultiplier = computed(() => {
  if (!walletConnected.value || !walletIsTargetChain.value || !account.value) {
    return 1;
  }

  const nodeBoost = backendPoolUserInfo.value?.nodeBoost || {};
  const total = Number.parseFloat(String(nodeBoost.total ?? ""));
  if (Number.isFinite(total) && total > 0) {
    return total;
  }

  const bonusRate = Number.parseFloat(String(backendPoolUserInfo.value?.bonusRate ?? "0"));
  const penaltyRate = Number.parseFloat(String(backendPoolUserInfo.value?.penaltyRate ?? "0"));
  const safeBonusRate = Number.isFinite(bonusRate) ? bonusRate : 0;
  const safePenaltyRate = Number.isFinite(penaltyRate) ? penaltyRate : 0;
  const rawBoost = (1 + safeBonusRate) * (1 + safePenaltyRate);

  if (!Number.isFinite(rawBoost) || rawBoost <= 0) {
    return 1;
  }

  return Math.min(rawBoost, 2);
});

const personalBoostedApyDisplay = computed(() => {
  const rawApr = Number(currentApr.value);
  if (!Number.isFinite(rawApr) || rawApr <= 0) {
    return "—";
  }

  const boostedApr = rawApr * nodeBoostMultiplier.value;
  const boostedApy = calculateApyFromApr(boostedApr);
  return `${truncateFixed(boostedApy * 100, 2)}%`;
});

const nodeStatusModalContent = computed(() => `
  <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-dark); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
    <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
      ${t("common.modals.nodeStatus.title")}
    </div>
    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
      ${t("common.modals.nodeStatus.currentStatus")}
      <span style="color: ${nodeStatusColor.value}; font-weight: 700; margin-left: 8px; text-transform: uppercase;">
        ${nodeStatusLabel.value}
      </span>
    </div>
    <div style="font-size: 12px;">
      ${t("common.modals.nodeStatus.descriptionHtml")}
    </div>
  </div>
  <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-dark); border-radius: 12px; padding: 16px;">
    <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
      ${t("common.modals.compoundEligibility.title")}
    </div>
    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
      ${t("common.modals.compoundEligibility.lifetimeRatio")}
      <span style="color: var(--cyan); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; margin-left: 8px;">
        ${compoundRatio.value}%
      </span>
    </div>
    <div style="font-size: 12px; margin-bottom: 8px;">
      ${t("common.modals.compoundEligibility.metricHint")}
    </div>
    <div style="font-size: 12px;">
      <strong>${t("common.modals.compoundEligibility.rulesTitle")}</strong>
      ${t("common.modals.compoundEligibility.rulesHtml", { threshold: compoundThreshold.value })}
    </div>
  </div>
`);

const estimateRemainingCap = computed(() =>
  lpCapUnused.value > 0n ? lpCapUnused.value : 0n,
);

const estimateModalContent = computed(() => {
  if (userInfo.value.vnStaked === 0n || estimateRemainingCap.value < MIN_ESTIMATE_LP_CAP) {
    return `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 32px; margin-bottom: 12px;">💡</div>
        <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
          ${t("pages.pool.estimate.emptyMessage")}<br><br>
          ${t("pages.pool.estimate.emptyActionBefore")} <strong>1 VN</strong> ${t("pages.pool.estimate.emptyActionAfter")}
        </div>
      </div>
    `;
  }

  const estimatedAssets = getEstimatedAssetsForLp(estimateRemainingCap.value);

  return `
    <div class="modal-inner-card">
      <div class="data-row" style="padding: 4px 0; border: none;">
        <span class="data-lbl">${t("pages.pool.estimate.barkxPrice")}</span>
        <span class="data-val" style="color: var(--text-primary);">${estimateBarkxPriceDisplay.value} USDT</span>
      </div>
      <div class="data-row" style="padding: 4px 0; border: none;">
        <span class="data-lbl">${t("pages.pool.estimate.plannedLp")}</span>
        <span class="data-val" style="color: var(--cyan);">${formatTokenAmount(estimateRemainingCap.value)} LP</span>
      </div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 20px; margin: 8px 0;">↓</div>
    <div class="modal-inner-card">
      <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; text-align: center;">${t("pages.pool.estimate.assetsRequired")}</div>
      <div style="text-align: center; padding: 8px 0;">
        <span style="color: var(--green); font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${estimatedAssets.barkx} BARKX</span>
      </div>
      <div style="text-align: center; padding: 8px 0;">
        <span style="color: var(--green); font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${estimatedAssets.usdt} USDT</span>
      </div>
    </div>
  `;
});

const estimateBarkxPriceDisplay = computed(() => {
  const price = uniswap.barkxPrice.value;
  return Number.isFinite(price) && price > 0 ? price.toFixed(3) : "0.000";
});

const slippagePct = computed(() => {
  return parseFloat(selectedSlippage.value) || parseFloat(customSlippage.value) || 0.5;
});

// --- Lock period display ---
function formatLockPeriod(seconds) {
  const s = Number(seconds);
  if (s <= 0) return "—";
  if (s === 86400) {
    return t("common.duration.hours24");
  }
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(t(days === 1 ? "common.duration.day" : "common.duration.days", { count: days }));
  if (hours > 0) parts.push(t(hours === 1 ? "common.duration.hour" : "common.duration.hours", { count: hours }));
  if (minutes > 0) parts.push(t(minutes === 1 ? "common.duration.minute" : "common.duration.minutes", { count: minutes }));
  return parts.length > 0 ? parts.join(" ") : t("common.duration.lessThanMinute");
}

// --- wVN1 token enumeration ---

async function fetchUserWvn1TokenIds() {
  if (!account.value) return;
  try {
    const client = getPublicClient();
    const totalMinted = await client.readContract({
      address: ADDRESSES.wVN1,
      abi: WVN1Abi,
      functionName: "totalMinted",
    });
    if (!totalMinted || totalMinted === 0n) {
      userWvn1TokenIds.value = [];
      return;
    }
    const calls = [];
    for (let i = 1n; i <= totalMinted; i++) {
      calls.push({
        address: ADDRESSES.wVN1,
        abi: WVN1Abi,
        functionName: "ownerOf",
        args: [i],
      });
    }
    const results = await client.multicall({ contracts: calls });
    const ids = [];
    const userAddr = account.value.toLowerCase();
    results.forEach((r, idx) => {
      if (r.result && r.result.toLowerCase() === userAddr) {
        ids.push(BigInt(idx + 1));
      }
    });
    userWvn1TokenIds.value = ids;
  } catch (err) {
    console.error("fetchUserWvn1TokenIds failed:", err);
    userWvn1TokenIds.value = [];
  }
}

// --- Data loading ---

async function initializePoolPageData() {
  if (!walletConnected.value || !walletIsTargetChain.value || !account.value) return;
  await Promise.all([
    poolData.fetchAll(account.value),
    balances.fetchBalances(account.value),
    uniswap.fetchPair(),
    fetchUserWvn1TokenIds(),
    fetchPendingRewards(),
    fetchApr(),
    fetchCompoundData(),
    fetchUnlockedDeposits(),
  ]);
}

function refreshPoolPageDataInBackground() {
  initializePoolPageData().catch((error) => {
    console.error("initializePoolPageData failed:", error);
  });
}

onMounted(initializePoolPageData);
watch(
  () => account.value,
  () => {
    clearPendingRewardsOverride();
    stopPendingRewardsResync();
    initializePoolPageData();
  },
);

// --- Tab / route watchers (unchanged) ---

watch(
  () => [route.query.tab, route.query.sub],
  ([tab, sub]) => {
    const nextTab =
      tab === "dep-more" || tab === "withdraw" || tab === "rewards" || tab === "dep-vn"
        ? tab
        : "dep-vn";

    activeTab.value = nextTab;

    if (nextTab === "dep-more") {
      activeDepositMoreTab.value =
        sub === "dep-more-lp" || sub === "dep-more-wvn" ? sub : "dep-more-lp";
    }

    if (nextTab === "withdraw") {
      activeWithdrawTab.value =
        sub === "wd-wvn-lp" || sub === "wd-wvn-or-lp" || sub === "wd-lp-only" ? sub : "wd-wvn-lp";
    }
  },
  { immediate: true },
);

watch(activeTab, (tab) => {
  const query = {
    ...route.query,
    tab,
  };

  if (tab === "dep-more") {
    query.sub = activeDepositMoreTab.value;
  } else if (tab === "withdraw") {
    query.sub = activeWithdrawTab.value;
  } else {
    delete query.sub;
  }

  if (route.query.tab === query.tab && route.query.sub === query.sub) {
    return;
  }

  router.replace({ query });
});

watch(activeDepositMoreTab, (sub) => {
  if (activeTab.value !== "dep-more") {
    return;
  }

  if (route.query.sub === sub && route.query.tab === "dep-more") {
    return;
  }

  router.replace({
    query: {
      ...route.query,
      tab: "dep-more",
      sub,
    },
  });
});

watch(activeWithdrawTab, (sub) => {
  if (activeTab.value !== "withdraw") {
    return;
  }

  if (route.query.sub === sub && route.query.tab === "withdraw") {
    return;
  }

  router.replace({
    query: {
      ...route.query,
      tab: "withdraw",
      sub,
    },
  });
});

// --- AI Bonus modal: re-opens on every switch to the rewards tab, by design ---
const aiBonusOpen = ref(false);

watch(
  activeTab,
  (tab) => {
    if (tab === "rewards") aiBonusOpen.value = true;
  },
  { immediate: true },
);

// --- Computed values for Deposit VN ---

const bonusBarkx = computed(() => {
  const vnAmount = parseInt(depositVnInput.value, 10) || 0;
  // barkXPerVN is in wei (BigInt), divide by 1e18 for display
  const perVn = Number(barkXPerVN.value) / 1e18;
  return vnAmount * perVn;
});

const pairingUsdt = computed(() => {
  if (barkxPrice.value <= 0) return 0;
  return bonusBarkx.value * barkxPrice.value;
});

const predictedLp = computed(() => {
  if (bonusBarkx.value <= 0 || pairingUsdt.value <= 0 || !isFinite(bonusBarkx.value)) return "0.000000";
  try {
    if (uniswap.pair.value && uniswap.totalSupply.value > 0n) {
      const barkxRaw = parseUnits(truncateFixed(bonusBarkx.value, 6), 18).toString();
      const usdtRaw = parseUnits(truncateFixed(pairingUsdt.value, 6), 6).toString();
      return uniswap.estimateAddLiquidityLP(barkxRaw, usdtRaw);
    }
    return truncateFixed(Math.sqrt(bonusBarkx.value * pairingUsdt.value), 6);
  } catch {
    return "0.000000";
  }
});

const formattedBonusBarkx = computed(() =>
  bonusBarkx.value > 0 ? truncateFixed(bonusBarkx.value, 2) : "",
);

const formattedPairingUsdt = computed(() =>
  pairingUsdt.value > 0 ? truncateFixed(pairingUsdt.value, 2) : "",
);

function setMaxVN() {
  depositVnInput.value = String(vnBalance.value);
}

function getDepositVnPrecheckNotice() {
  const rawValue = String(depositVnInput.value ?? "").trim();
  if (depositVnInputInvalid.value) return null;

  const vnAmount = BigInt(rawValue);
  const predictedLpRaw = safeParseUnits(predictedLp.value, 18);
  if (predictedLpRaw === null) return null;

  const nextVnStaked = userInfo.value.vnStaked + vnAmount;
  const nextLpStaked = userInfo.value.stakedLP + predictedLpRaw;
  const nextLpCap = nextVnStaked * lpPerVN.value;

  if (nextLpStaked > nextLpCap) {
    return resolveBarkxPoolMessage("deposit_vn_lp_failure_cap_reached");
  }

  return null;
}

function getDepositWvnPrecheckNotice() {
  if (depositWvnInputInvalid.value) return null;

  if (userInfo.value.stakedLP <= lpMin.value) {
    return resolveBarkxPoolMessage("deposit_wvn_only_failure_requires_lp", {
      lpAmount: formatTokenAmount(lpMin.value),
    });
  }

  return null;
}

function getDepositLpPrecheckNotice(amount) {
  if (depositLpInputInvalid.value) return null;

  if (userInfo.value.vnStaked <= 0n) {
    return resolveBarkxPoolMessage("deposit_lp_only_failure_requires_vn");
  }

  if (amount > lpCapUnused.value) {
    return resolveBarkxPoolMessage("deposit_lp_only_failure_cap_reached");
  }

  return null;
}

function getWithdrawPrecheckNotice(selectedItems) {
  const totalSelectedVn = selectedItems.reduce((sum, item) => sum + BigInt(item.vnCount || 0), 0n);
  const totalSelectedLp = selectedItems.reduce((sum, item) => sum + BigInt(item.lpAmount || 0n), 0n);

  const remainingVn = userInfo.value.vnStaked > totalSelectedVn
    ? userInfo.value.vnStaked - totalSelectedVn
    : 0n;
  const remainingLp = userInfo.value.stakedLP > totalSelectedLp
    ? userInfo.value.stakedLP - totalSelectedLp
    : 0n;
  const remainingLpCap = remainingVn * lpPerVN.value;

  if (totalSelectedVn > 0n && remainingLp > remainingLpCap) {
    return resolveBarkxPoolMessage("withdraw_wvn_failure_cap_exceeded");
  }

  if (totalSelectedLp > 0n && remainingVn > 0n && remainingLp < lpMin.value) {
    return resolveBarkxPoolMessage("withdraw_lp_failure_requires_lp", {
      lpAmount: formatTokenAmount(lpMin.value),
    });
  }

  return null;
}

function getCompoundPrecheckNotice() {
  const predictedLpRaw = safeParseUnits(compoundPredictedLp.value, 18);
  if (predictedLpRaw === null) return null;

  if (predictedLpRaw > lpCapUnused.value) {
    return resolveBarkxPoolMessage("compound_failure_cap_exceeded");
  }

  return null;
}

// --- Approve handlers (called by ApprovalActionGroup) ---
async function checkDepositVnApproval(requirement) {
  if (requirement.id === "pool:vn") return approval.isVnApprovedForPool();
  if (requirement.id === "pool:usdt") return approval.isUsdtApprovedForPool();
  return false;
}

async function checkDepositWvnApproval(requirement) {
  if (requirement.id === "pool:wvn") return approval.isWvn1ApprovedForPool();
  return false;
}

async function checkDepositLpApproval(requirement) {
  if (requirement.id === "pool:lp") return approval.isLpApprovedForPool();
  return false;
}

async function handleDepositVnApprove(requirement) {
  if (requirement.id === "pool:vn") {
    const approved = await approval.approveVnForPool();
    if (approved) {
      refreshPoolPageDataInBackground();
    }
    return approved;
  }
  if (requirement.id === "pool:usdt") {
    const approved = await approval.approveUsdtForPool(maxUint256);
    if (approved) {
      refreshPoolPageDataInBackground();
    }
    return approved;
  }
  return false;
}

async function handleDepositWvnApprove(requirement) {
  if (requirement.id === "pool:wvn") {
    const approved = await approval.approveWvn1ForPool();
    if (approved) {
      refreshPoolPageDataInBackground();
    }
    return approved;
  }
  return false;
}

async function handleDepositLpApprove(requirement) {
  if (requirement.id === "pool:lp") {
    const approved = await approval.approveLpForPool(maxUint256);
    if (approved) {
      refreshPoolPageDataInBackground();
    }
    return approved;
  }
  return false;
}

// --- Deposit VN (Mode A) ---
async function handleDepositVn() {
  if (depositVnInputInvalid.value) return;

  const precheckNotice = getDepositVnPrecheckNotice();
  if (precheckNotice) {
    showNotice(precheckNotice);
    return;
  }

  const vnAmount = parseInt(String(depositVnInput.value ?? "").trim(), 10) || 0;
  if (vnAmount <= 0) return;

  const usdtAmt = parseUnits(truncateFixed(pairingUsdt.value, 6), 6);
  const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + Number(transactionDeadline.value) * 60);
  let minLP = 0n;
  if (predictedLp.value !== "0.000000") {
    const estLp = parseUnits(predictedLp.value, 18);
    minLP = estLp * BigInt(Math.floor((1 - slippagePct.value / 100) * 10000)) / 10000n;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.depositVn.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const predictedLpRaw = safeParseUnits(predictedLp.value, 18) ?? 0n;
    const nextVnStaked = userInfo.value.vnStaked + BigInt(vnAmount);
    const nextLpStaked = userInfo.value.stakedLP + predictedLpRaw;
    const nextLpCap = nextVnStaked * lpPerVN.value;
    const [vnApproved, usdtApproved] = await Promise.all([
      approval.isVnApprovedForPool(),
      approval.isUsdtApprovedForPool(),
    ]);

    const gasOverrides = await getGasOverrides();
    console.log("[depositModeA:debug]", {
      contract: ADDRESSES.barkXPool,
      account: userAccount,
      input: {
        depositVnInput: String(depositVnInput.value ?? ""),
        vnAmount: BigInt(vnAmount).toString(),
        barkxPrice: barkxPrice.value,
        barkXPerVN: barkXPerVN.value.toString(),
        predictedLp: predictedLp.value,
        predictedLpRaw: predictedLpRaw.toString(),
        pairingUsdtDisplay: formattedPairingUsdt.value,
        usdtAmt: usdtAmt.toString(),
        minLP: minLP.toString(),
        deadline: deadlineSec.toString(),
      },
      balances: {
        vnBalance: vnBalance.value.toString(),
        usdtBalance: usdtBalance.value.toString(),
      },
      approvals: {
        vnApproved,
        usdtApproved,
      },
      poolState: {
        vnStaked: userInfo.value.vnStaked.toString(),
        stakedLP: userInfo.value.stakedLP.toString(),
        lpPerVN: lpPerVN.value.toString(),
        lpCap: lpCap.value.toString(),
        lpCapUnused: lpCapUnused.value.toString(),
        nextVnStaked: nextVnStaked.toString(),
        nextLpStaked: nextLpStaked.toString(),
        nextLpCap: nextLpCap.toString(),
      },
      gasOverrides: {
        maxFeePerGas: gasOverrides.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasOverrides.maxPriorityFeePerGas?.toString(),
      },
    });

    await getPublicClient().simulateContract({
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeA",
      args: [BigInt(vnAmount), usdtAmt, minLP, deadlineSec],
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeA",
      args: [BigInt(vnAmount), usdtAmt, minLP, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    const receipt = await waitForTx(hash);
    await initializePoolPageData();
    depositVnInput.value = "";
    showNotice(resolveBarkxPoolMessage("deposit_vn_lp_success", { lpAmount: formatTokenAmount(receipt.logs?.length ? minLP : 0n) }));
  } catch (err) {
    console.error("depositModeA failed:", err);
    showNotice(resolveBarkxPoolMessage("deposit_vn_lp_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

// --- Deposit wVN1 (Mode B VN1) ---
const depositWvnInput = ref("");

function setMaxWvn1() {
  depositWvnInput.value = String(userWvn1TokenIds.value.length);
}

const depositWvnCapIncrease = computed(() => {
  const count = parseInt(depositWvnInput.value, 10) || 0;
  if (count <= 0 || lpPerVN.value === 0n) return 0n;
  return BigInt(count) * lpPerVN.value;
});

async function handleDepositWvn() {
  if (depositWvnInputInvalid.value) return;

  const precheckNotice = getDepositWvnPrecheckNotice();
  if (precheckNotice) {
    showNotice(precheckNotice);
    return;
  }

  const count = parseInt(String(depositWvnInput.value ?? "").trim(), 10) || 0;
  console.log("[depositModeBVN1] input count:", count, "available tokenIds:", userWvn1TokenIds.value.map(String));
  if (count <= 0 || userWvn1TokenIds.value.length === 0) return;

  const tokenIds = userWvn1TokenIds.value.slice(0, count);
  if (tokenIds.length === 0) return;

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.depositMore.depositWvnPending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const gasOverrides = await getGasOverrides();
    console.log("[depositModeBVN1]", {
      contract: ADDRESSES.barkXPool,
      tokenIds: tokenIds.map(String),
      userAccount,
      gasOverrides: { maxFeePerGas: gasOverrides.maxFeePerGas?.toString(), maxPriorityFeePerGas: gasOverrides.maxPriorityFeePerGas?.toString() },
    });

    // Simulate first to catch revert reason
    try {
      await getPublicClient().simulateContract({
        address: ADDRESSES.barkXPool,
        abi: BarkXPoolAbi,
        functionName: "depositModeBVN1",
        args: [tokenIds],
        account: userAccount,
      });
      console.log("[depositModeBVN1] simulation passed");
    } catch (simErr) {
      console.error("[depositModeBVN1] simulation FAILED:", simErr);
      console.error("[depositModeBVN1] revert reason:", simErr?.cause?.reason || simErr?.shortMessage || simErr?.message);
    }

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeBVN1",
      args: [tokenIds],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await initializePoolPageData();
    depositWvnInput.value = "";
    showNotice(resolveBarkxPoolMessage("deposit_wvn_only_success"));
  } catch (err) {
    console.error("depositModeBVN1 failed:", err);
    showNotice(resolveBarkxPoolMessage("deposit_wvn_only_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

// --- Deposit LP (Mode B LP) ---
const depositLpInput = ref("");

async function handleDepositLp() {
  if (depositLpInputInvalid.value) return;

  const rawAmount = String(depositLpInput.value ?? "").trim();
  if (!rawAmount || Number(rawAmount) <= 0) return;

  const amount = safeParseUnits(rawAmount, 18);
  if (amount === null) return;
  if (amount > lpBalance.value) return;

  const precheckNotice = getDepositLpPrecheckNotice(amount);
  if (precheckNotice) {
    showNotice(precheckNotice);
    return;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.depositMore.depositLpPending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const gasOverrides = await getGasOverrides();
    console.log("[depositModeBLP]", { contract: ADDRESSES.barkXPool, amount: amount.toString(), fromManual: true });
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeBLP",
      args: [amount, true],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await initializePoolPageData();
    depositLpInput.value = "";
    showNotice(resolveBarkxPoolMessage("deposit_lp_only_success"));
  } catch (err) {
    console.error("depositModeBLP failed:", err);
    showNotice(resolveBarkxPoolMessage("deposit_lp_only_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

// LP percentage buttons
function setLpPercent(pct) {
  if (lpBalance.value <= 0n) return;
  const amount = (lpBalance.value * BigInt(pct)) / 100n;
  depositLpInput.value = formatUnits(amount, 18);
}

// --- Withdraw: list-based with 3 sub-tabs, data from backend ---

const WD_PAGE_SIZE = 10;
const wdPage = ref(1);
const wdSelected = ref(new Set());
const wdBackendRecords = ref([]);
const wdSelectAllInput = ref(null);
const STAKED_LP_BY_MODE_KEY_MAP = Object.freeze({
  lpStakedModeA: "modeA",
  lpStakedModeB: "modeBLP",
  lpStakedModeC: "modeC",
});

function getActiveStakeAmount(key) {
  const stakedLpByModeKey = STAKED_LP_BY_MODE_KEY_MAP[key];
  const value = stakedLpByModeKey
    ? backendPoolUserInfo.value?.stakedLpByMode?.[stakedLpByModeKey]
    : undefined;
  if (value === null || value === undefined || value === "") {
    return 0n;
  }

  try {
    return BigInt(String(value));
  } catch {
    return 0n;
  }
}

const lockedMiningPowerDisplay = computed(() =>
  formatTokenAmount(
    getActiveStakeAmount("lpStakedModeA"),
    18,
    9,
  ),
);

const depositedMiningPowerDisplay = computed(() =>
  formatTokenAmount(
    getActiveStakeAmount("lpStakedModeB"),
    18,
    9,
  ),
);

const compoundingMiningPowerDisplay = computed(() =>
  formatTokenAmount(
    getActiveStakeAmount("lpStakedModeC"),
    18,
    9,
  ),
);

// Type mapping: backend type → source key
const TYPE_SOURCE_MAP = {
  DepositModeA: "modeA",
  DepositModeBVN1: "modeBVN",
  DepositModeBLP: "modeBLP",
  Reinvest: "modeC",
};

async function fetchUnlockedDeposits() {
  if (!store.account) return;
  try {
    const data = await getUnlockedDeposits(store.account);
    wdBackendRecords.value = Array.isArray(data) ? data : [];
  } catch {
    wdBackendRecords.value = [];
  }
}

// All records mapped (not filtered by tab)
const wdAllRecords = computed(() => {
  return wdBackendRecords.value.filter(r => {
    const source = TYPE_SOURCE_MAP[r.type] || r.type;
    if (source === "modeBVN") return r.vn_status !== "withdrawn";
    if (source === "modeBLP") return r.lp_status !== "withdrawn";
    if (source === "modeC") return r.lp_status !== "withdrawn";
    // modeA: fully withdrawn only when both are withdrawn
    return !(r.vn_status === "withdrawn" && r.lp_status === "withdrawn");
  }).map(r => {
    const source = TYPE_SOURCE_MAP[r.type] || r.type;
    const vnCount = r.vn_count ?? r.token_ids?.length ?? 0;
    const lpAmount = r.lp_amount ? BigInt(r.lp_amount) : 0n;
    // Mode B VN checks vn_status, Mode B LP checks lp_status, others check both
    let isConfirming = false;
    if (source === "modeBVN") isConfirming = r.vn_status === "confirming";
    else if (source === "modeBLP") isConfirming = r.lp_status === "confirming";
    else isConfirming = r.vn_status === "confirming" || r.lp_status === "confirming";
    return {
      key: `${source}-${r.bucket_idx}`,
      source,
      idx: r.bucket_idx,
      txHash: r.tx_hash || "",
      vnCount,
      lpAmount,
      unlocksAt: r.unlocks_at ? BigInt(Math.floor(new Date(r.unlocks_at).getTime() / 1000)) : 0n,
      isUnlocked: true,
      isConfirming,
      type: r.type,
      vnStatus: r.vn_status,
      lpStatus: r.lp_status,
    };
  });
});

// Filtered list for current tab display
const wdFullList = computed(() => {
  const tab = activeWithdrawTab.value;
  return wdAllRecords.value.filter(item => {
    if (tab === "wd-wvn-lp") return item.source === "modeA";
    if (tab === "wd-wvn-or-lp") return item.source === "modeBVN" || item.source === "modeBLP";
    if (tab === "wd-lp-only") return item.source === "modeC";
    return true;
  });
});

// Switching tab: keep selections, only reset pagination and selectAll checkbox
watch(activeWithdrawTab, () => {
  wdPage.value = 1;
});

const wdTotalPages = computed(() => Math.max(1, Math.ceil(wdFullList.value.length / WD_PAGE_SIZE)));

const wdPagedList = computed(() => {
  const start = (wdPage.value - 1) * WD_PAGE_SIZE;
  return wdFullList.value.slice(start, start + WD_PAGE_SIZE);
});

function toggleSelect(key) {
  setWithdrawItemSelected(key, !wdSelected.value.has(key));
}

function isWithdrawItemSelected(key) {
  return wdSelected.value.has(key);
}

function setWithdrawItemSelected(key, checked) {
  const next = new Set(wdSelected.value);
  if (checked) next.add(key);
  else next.delete(key);
  wdSelected.value = next;
}

const wdCurrentPageSelectableKeys = computed(() => {
  return wdPagedList.value
    .filter(item => item.isUnlocked && !item.isConfirming)
    .map(item => item.key);
});

// Whether all selectable items on current page are selected
const wdSelectAllChecked = computed(() => {
  if (wdCurrentPageSelectableKeys.value.length === 0) return false;
  return wdCurrentPageSelectableKeys.value.every(key => wdSelected.value.has(key));
});

const wdSelectAllIndeterminate = computed(() => {
  if (wdCurrentPageSelectableKeys.value.length === 0) return false;
  const selectedCount = wdCurrentPageSelectableKeys.value.filter(key => wdSelected.value.has(key)).length;
  return selectedCount > 0 && selectedCount < wdCurrentPageSelectableKeys.value.length;
});

function setCurrentPageSelected(checked) {
  const next = new Set(wdSelected.value);
  for (const key of wdCurrentPageSelectableKeys.value) {
    if (checked) next.add(key);
    else next.delete(key);
  }
  wdSelected.value = next;
}

watchEffect(() => {
  if (wdSelectAllInput.value) {
    wdSelectAllInput.value.indeterminate = wdSelectAllIndeterminate.value;
  }
});

function formatUnlockDate(ts) {
  if (!ts || ts === 0n) return "";
  return new Date(Number(ts) * 1000).toISOString().slice(0, 16).replace("T", " ");
}

// Aggregated summary of selected items (across all tabs)
const wdSummary = computed(() => {
  let vnCount = 0;
  let lpAmount = 0n;
  let capDecrease = 0n;

  for (const item of wdAllRecords.value) {
    if (!wdSelected.value.has(item.key)) continue;
    vnCount += item.vnCount;
    lpAmount += item.lpAmount;
    if (item.vnCount > 0) capDecrease += BigInt(item.vnCount) * lpPerVN.value;
  }

  return { vnCount, lpAmount, capDecrease };
});

// --- Execute withdraw for selected items ---
async function handleWithdrawSelected() {
  if (wdSelected.value.size === 0) return;

  const selected = wdAllRecords.value.filter(item => wdSelected.value.has(item.key));
  if (selected.length === 0) return;

  const precheckNotice = getWithdrawPrecheckNotice(selected);
  if (precheckNotice) {
    showNotice(precheckNotice);
    return;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.withdraw.withdrawPending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    const modeAIdxs = selected.filter(i => i.source === "modeA").map(i => BigInt(i.idx));
    const modeBVNIdxs = selected.filter(i => i.source === "modeBVN").map(i => BigInt(i.idx));
    const modeBLPIdxs = selected.filter(i => i.source === "modeBLP").map(i => BigInt(i.idx));
    const modeCIdxs = selected.filter(i => i.source === "modeC").map(i => BigInt(i.idx));

    // Build confirm items for backend
    const confirmItems = selected.map(item => {
      const assetMap = { modeA: "both", modeBVN: "vn", modeBLP: "lp", modeC: "lp" };
      return { type: item.type, bucketIdx: item.idx, asset: assetMap[item.source] || "both" };
    });

    console.log("[batchWithdraw]", {
      modeA: modeAIdxs.map(String),
      modeBVN: modeBVNIdxs.map(String),
      modeBLP: modeBLPIdxs.map(String),
      modeC: modeCIdxs.map(String),
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "batchWithdraw",
      args: [modeAIdxs, modeBVNIdxs, modeBLPIdxs, modeCIdxs],
      account: userAccount,
      ...gasOverrides,
    });

    try {
      await withdrawConfirm(userAccount, confirmItems);
    } catch (confirmError) {
      // The transaction is already submitted on-chain at this point.
      // Keep waiting for the receipt instead of surfacing a misleading failure.
      console.warn("withdrawConfirm failed after tx submission:", confirmError);
    }

    await waitForTx(hash);

    await initializePoolPageData();
    wdSelected.value = new Set();
    showNotice({ outcome: "success", text: t("pages.pool.withdraw.successMessage") });
  } catch (err) {
    console.error("withdraw failed:", err);
    showNotice({ outcome: "failure", text: t("messages.barkxPool.items.withdraw_wvn_failure_retry") });
  } finally {
    store.clearWalletPendingState();
  }
}

// --- APR ---
const currentApr = ref("");

const lpCapUsageOver70 = computed(() => {
  if (lpCap.value <= 0n) return false;
  const used = lpCap.value - lpCapUnused.value;
  return used * 100n / lpCap.value >= 70n;
});

const aprDisplay = computed(() => {
  if (!currentApr.value) return "—";
  const num = Number(currentApr.value);
  return isFinite(num) ? `${truncateFixed(num * 100, 2)}%` : "—";
});

async function fetchApr() {
  try {
    const data = await getLatestApr();
    currentApr.value = data?.apr ?? data?.apy ?? "";
  } catch {
    currentApr.value = "";
  }
}

async function fetchCompoundData() {
  if (!account.value) {
    compoundRatio.value = 0;
    compoundThreshold.value = 50;
    return;
  }

  try {
    const [config, ratio] = await Promise.all([
      getCompoundConfig(),
      getCompoundRatio(account.value),
    ]);
    const parsedThreshold = Number.parseInt(String(config?.compoundMedalK ?? "50"), 10);
    const parsedRatio = Number.parseInt(String(ratio?.compoundRatio ?? "0"), 10);
    compoundThreshold.value = Number.isFinite(parsedThreshold) ? parsedThreshold : 50;
    compoundRatio.value = Number.isFinite(parsedRatio) ? parsedRatio : 0;
  } catch {
    compoundRatio.value = 0;
    compoundThreshold.value = 50;
  }
}

// --- Rewards ---
const PENDING_REWARDS_OVERRIDE_TTL_MS = 10 * 60 * 1000;
const PENDING_REWARDS_RESYNC_INTERVAL_MS = 3000;
const PENDING_REWARDS_RESYNC_MAX_ATTEMPTS = 10;

const pendingRewardsServer = ref(0n);
const pendingRewardsOverride = ref(null);
const pendingRewards = computed(() =>
  pendingRewardsOverride.value ?? pendingRewardsServer.value,
);

let pendingRewardsOverrideTimer = null;
let pendingRewardsResyncTimer = null;
let pendingRewardsResyncAttempts = 0;

function clearPendingRewardsOverride() {
  if (pendingRewardsOverrideTimer !== null) {
    window.clearTimeout(pendingRewardsOverrideTimer);
    pendingRewardsOverrideTimer = null;
  }
  pendingRewardsOverride.value = null;
}

function stopPendingRewardsResync() {
  if (pendingRewardsResyncTimer !== null) {
    window.clearTimeout(pendingRewardsResyncTimer);
    pendingRewardsResyncTimer = null;
  }
  pendingRewardsResyncAttempts = 0;
}

function setPendingRewardsOverride(value) {
  clearPendingRewardsOverride();
  pendingRewardsOverride.value = value;
  pendingRewardsOverrideTimer = window.setTimeout(() => {
    pendingRewardsOverride.value = null;
    pendingRewardsOverrideTimer = null;
  }, PENDING_REWARDS_OVERRIDE_TTL_MS);
}

function schedulePendingRewardsResync() {
  stopPendingRewardsResync();

  const run = async () => {
    pendingRewardsResyncTimer = null;
    pendingRewardsResyncAttempts += 1;

    await fetchPendingRewards();

    if (pendingRewardsOverride.value === null || pendingRewardsServer.value === 0n) {
      clearPendingRewardsOverride();
      stopPendingRewardsResync();
      return;
    }

    if (pendingRewardsResyncAttempts >= PENDING_REWARDS_RESYNC_MAX_ATTEMPTS) {
      stopPendingRewardsResync();
      return;
    }

    pendingRewardsResyncTimer = window.setTimeout(run, PENDING_REWARDS_RESYNC_INTERVAL_MS);
  };

  pendingRewardsResyncTimer = window.setTimeout(run, PENDING_REWARDS_RESYNC_INTERVAL_MS);
}

function settlePendingRewardsLocally() {
  pendingRewardsServer.value = 0n;
  setPendingRewardsOverride(0n);
  schedulePendingRewardsResync();
}

function getRewardFailureNotice(error, fallbackKey) {
  const errorName = parseContractErrorKey(error);
  const contractHint = getBarkxPoolErrorHint(errorName);
  return {
    outcome: "failure",
    text: contractHint || t(fallbackKey),
  };
}

async function fetchPendingRewards() {
  if (!account.value) {
    pendingRewardsServer.value = 0n;
    backendPoolUserInfo.value = null;
    clearPendingRewardsOverride();
    stopPendingRewardsResync();
    return;
  }
  try {
    const data = await fetchBackendUserInfo(account.value);
    backendPoolUserInfo.value = data || null;
    pendingRewardsServer.value = data.totalIncome ? BigInt(data.totalIncome) : 0n;
    if (pendingRewardsOverride.value !== null && pendingRewardsServer.value === 0n) {
      clearPendingRewardsOverride();
      stopPendingRewardsResync();
    }
  } catch (err) {
    console.error("fetchPendingRewards failed:", err);
    backendPoolUserInfo.value = null;
  }
}

onBeforeUnmount(() => {
  clearPendingRewardsOverride();
  stopPendingRewardsResync();
  document.body.style.overflow = "";
});

// LP → USD valuation: lpAmount / totalSupply × 2 × usdtReserve
const stakedLpUsd = computed(() => {
  const lp = userInfo.value.stakedLP;
  if (lp <= 0n || !uniswap.totalSupply.value || uniswap.totalSupply.value === 0n) return "—";
  const usdtRes = uniswap.usdtReserve.value;
  if (usdtRes <= 0n) return "—";
  const usd = Number(lp) / Number(uniswap.totalSupply.value) * 2 * Number(usdtRes) / 1e6;
  if (usd >= 1_000_000) return "~$" + truncateFixed(usd / 1_000_000, 2) + "M";
  if (usd >= 1_000) return "~$" + truncateFixed(usd / 1_000, 0) + "K";
  return "~$" + truncateFixed(usd, 2);
});

const compoundDiscount = computed(() => {
  const d = Number(directTaxBps.value);
  const r = Number(reinvestTaxBps.value);
  if (d <= 0) return "—";
  return Math.round((1 - r / d) * 100) + "%";
});

const directClaimReceiving = computed(() => {
  const tax = Number(directTaxBps.value);
  const raw = Number(pendingRewards.value);
  if (raw <= 0) return 0n;
  return BigInt(Math.floor(raw * (1 - tax / 10000)));
});

const compoundUtilized = computed(() => {
  const tax = Number(reinvestTaxBps.value);
  const raw = Number(pendingRewards.value);
  if (raw <= 0) return 0n;
  return BigInt(Math.floor(raw * (1 - tax / 10000)));
});

const compoundPredictedLp = computed(() => {
  if (compoundUtilized.value <= 0n) return "0.000000";
  // Compound flow: half BARKX swapped to USDT, then both added as liquidity
  const halfBarkx = compoundUtilized.value / 2n;
  if (uniswap.pair.value && uniswap.totalSupply.value > 0n) {
    const quote = uniswap.getSwapQuote(true, halfBarkx.toString());
    if (quote) {
      return uniswap.estimateAddLiquidityLP(halfBarkx.toString(), quote.amountOut.toString());
    }
  }
  return "0.000000";
});

// claim(amount, deadline, sig)
async function handleDirectClaim() {
  if (rewardsDisabled.value) return;

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.rewards.directClaimPending") });

    const { amount, deadline, signature } = await requestClaimSignature(account.value);

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "claim",
      args: [BigInt(amount), BigInt(deadline), signature],
      account: userAccount,
      ...gasOverrides,
    });
    const net = formatTokenAmount(directClaimReceiving.value, 18, 2);
    await waitForTx(hash);
    await initializePoolPageData();
    settlePendingRewardsLocally();
    showNotice(resolveBarkxPoolMessage("direct_claim_success", { barkxAmount: net }));
  } catch (err) {
    console.error("claim failed:", err);
    showNotice(getRewardFailureNotice(err, "messages.barkxPool.items.direct_claim_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

// reinvest(amount, deadline, sig, minUsdtOut, minLP)
async function handleCompound() {
  if (rewardsDisabled.value) return;

  const precheckNotice = getCompoundPrecheckNotice();
  if (precheckNotice) {
    showNotice(precheckNotice);
    return;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.rewards.compoundPending") });

    const { amount, deadline, signature } = await requestClaimSignature(account.value);

    // Calculate minUsdtOut and minLP from slippage
    let minUsdtOut = 0n;
    let minLP = 0n;
    const netAmount = BigInt(amount) * (10000n - BigInt(Number(reinvestTaxBps.value))) / 10000n;
    const halfBarkx = netAmount / 2n;
    if (uniswap.pair.value) {
      const quote = uniswap.getSwapQuote(true, halfBarkx.toString());
      if (quote) {
        const slippageFactor = BigInt(Math.floor((1 - slippagePct.value / 100) * 10000));
        minUsdtOut = quote.amountOut * slippageFactor / 10000n;
        const estLpStr = uniswap.estimateAddLiquidityLP(halfBarkx.toString(), quote.amountOut.toString());
        if (estLpStr !== "0.000000") {
          minLP = parseUnits(estLpStr, 18) * slippageFactor / 10000n;
        }
      }
    }

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "reinvest",
      args: [BigInt(amount), BigInt(deadline), signature, minUsdtOut, minLP],
      account: userAccount,
      ...gasOverrides,
    });
    const utilized = formatTokenAmount(compoundUtilized.value, 18, 2);
    const lp = compoundPredictedLp.value;
    await waitForTx(hash);
    await initializePoolPageData();
    settlePendingRewardsLocally();
    showNotice(resolveBarkxPoolMessage("compound_success", { barkxAmount: utilized, lpAmount: lp }));
  } catch (err) {
    console.error("reinvest failed:", err);
    showNotice(getRewardFailureNotice(err, "messages.barkxPool.items.compound_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

// Unlock date computed (360 days from now for Mode A)
const unlockDate360 = computed(() => {
  const seconds = Number(lockModeA.value);
  const d = new Date();
  d.setSeconds(d.getSeconds() + (seconds || 360 * 86400));
  return d.toISOString().slice(0, 16).replace("T", " ");
});

const unlockDate90 = computed(() => {
  const seconds = Number(lockModeC.value);
  const d = new Date();
  d.setSeconds(d.getSeconds() + (seconds || 90 * 86400));
  return d.toISOString().slice(0, 16).replace("T", " ");
});

function openDepositMoreLp() {
  router.push({
    path: "/pool",
    query: {
      tab: "dep-more",
      sub: "dep-more-lp",
    },
  });
  window.scrollTo(0, 0);
}

function goToNodeBoost() {
  router.push({ path: "/node-boost" });
  window.scrollTo(0, 0);
}

function openNodeStatusModal() {
  document.body.style.overflow = "hidden";
  isNodeStatusModalOpen.value = true;
}

function closeNodeStatusModal() {
  document.body.style.overflow = "";
  isNodeStatusModalOpen.value = false;
}

function openEstimateModal() {
  document.body.style.overflow = "hidden";
  isEstimateModalOpen.value = true;
}

function closeEstimateModal() {
  document.body.style.overflow = "";
  isEstimateModalOpen.value = false;
}

function getEstimatedAssetsForLp(lpAmount) {
  if (lpAmount <= 0n || uniswap.totalSupply.value <= 0n) {
    return { barkx: "0.00", usdt: "0.00" };
  }

  const neededBarkx = lpAmount * uniswap.barkxReserve.value / uniswap.totalSupply.value;
  const neededUsdt = lpAmount * uniswap.usdtReserve.value / uniswap.totalSupply.value;

  return {
    barkx: formatEstimateTokenAmount(neededBarkx, 18),
    usdt: formatEstimateTokenAmount(neededUsdt, 6),
  };
}

function formatEstimateTokenAmount(value, decimals) {
  const amount = Number(formatUnits(value, decimals));
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0.00";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>

<style scoped>
.rewards-big-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--cyan);
  font-family: "JetBrains Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rewards-big-unit {
  font-size: 20px;
}

.data-lbl {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 12px;
}
.data-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.withdraw-warning {
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.08);
  color: #f7d08a;
  font-size: 13px;
  line-height: 1.5;
}

.sub-tab-container {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.sub-tab-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sub-tab-btn.active {
  background: rgba(56, 189, 248, 0.15);
  color: var(--cyan);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.sub-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stats-grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stats-grid.three-cols .stat-card {
  padding: 12px 6px;
}

.stats-grid.three-cols .stat-card-title {
  font-size: 10px;
  letter-spacing: 0;
  margin-bottom: 6px;
}

.stats-grid.three-cols .stat-card-value {
  font-size: 16px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-card.interactive {
  background: rgba(245, 158, 11, 0.05);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card.interactive:hover {
  background: rgba(245, 158, 11, 0.12);
  border-style: solid;
  transform: translateY(-2px);
  border-color: var(--amber);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.stat-card.interactive .stat-card-title {
  color: var(--amber);
}

.stat-card-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.stat-card-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 600;
}

.stat-card-value--interactive {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.stat-card-inline-icon {
  opacity: 0.8;
  margin-top: 1px;
}

.clickable-card {
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  position: relative;
}

.clickable-card.cyan:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(56, 189, 248, 0.15);
}

.card-top-tools {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-corner-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
}

.info-icon-small {
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition:
    opacity 0.3s ease,
    color 0.3s ease;
}

.status-active {
  color: var(--green);
}

.status-inactive {
  color: var(--text-muted);
}

.info-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.card-top-tools .info-icon {
  position: static;
}

.clickable-card.cyan:hover .card-corner-badge,
.clickable-card.cyan:hover .info-icon,
.clickable-card.cyan:hover .info-icon-small {
  color: var(--cyan);
  opacity: 1;
}

.custom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(18, 14, 10, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.custom-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
}

.custom-modal.cyan-theme .custom-modal-close:hover {
  color: var(--cyan);
}

.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}

.custom-modal-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.custom-modal-text :deep(strong) {
  color: var(--text-primary);
}

.custom-modal-text :deep(.modal-inner-card) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.custom-modal-text :deep(.modal-inner-card:last-child) {
  margin-bottom: 0;
}

.custom-modal-fade-enter-active,
.custom-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.custom-modal-fade-enter-from,
.custom-modal-fade-leave-to {
  opacity: 0;
}

.custom-modal-fade-enter-from .custom-modal,
.custom-modal-fade-leave-to .custom-modal {
  transform: translateY(20px);
}

/* --- Withdraw order list --- */

.wd-select-all {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.wd-select-all input {
  margin-right: 8px;
  accent-color: var(--amber);
  transform: scale(1.2);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  min-height: 80px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 14px;
  min-height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.order-item:hover:not(.is-locked) {
  border-color: var(--amber);
  background: rgba(245, 158, 11, 0.05);
}

.order-item.is-selected {
  border-color: var(--amber);
  background: rgba(245, 158, 11, 0.08);
}

.order-item.is-locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.order-checkbox {
  margin-right: 14px;
  accent-color: var(--amber);
  transform: scale(1.3);
  cursor: pointer;
}

.order-details-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-id {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.order-status {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.order-status.is-unlocked {
  color: var(--green);
}

.order-status.is-locked {
  color: var(--text-muted);
}
.order-status.is-confirming {
  color: var(--amber);
}

.order-assets-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-line {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.page-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--amber);
  color: var(--amber);
  background: rgba(245, 158, 11, 0.1);
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wd-summary {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}
</style>
