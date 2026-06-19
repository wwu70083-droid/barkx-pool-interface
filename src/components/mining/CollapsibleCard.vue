<template>
  <div class="collapsible-card">
    <div class="collapsible-header" @click="isOpen = !isOpen">
      <span style="display: flex; align-items: center; gap: 8px">
        <slot name="icon" />
        {{ title }}
      </span>
      <span class="chevron" :class="{ up: isOpen }">▼</span>
    </div>
    <div class="collapsible-content" :class="{ show: isOpen }">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  initiallyOpen: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(props.initiallyOpen);
</script>

<style scoped>
.collapsible-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.collapsible-card:hover {
  border-color: var(--border-glow);
}

.collapsible-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--cyan);
  font-size: 15px;
}

.collapsible-content {
  padding: 0 16px 16px 16px;
  display: none;
}

.collapsible-content.show {
  display: block;
  animation: fade-in 0.3s ease;
}

.chevron {
  transition: transform 0.3s ease;
  display: inline-block;
}

.chevron.up {
  transform: rotate(180deg);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
