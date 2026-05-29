import { ref } from "vue";

// Singleton state — shared across all components
const activeNotice = ref(null);

export function useNotice() {
  /**
   * Show a notice. Stays visible until user clicks outside or a new notice replaces it.
   */
  function showNotice(message) {
    activeNotice.value = message;
  }

  function clearNotice() {
    activeNotice.value = null;
  }

  return { activeNotice, showNotice, clearNotice };
}
