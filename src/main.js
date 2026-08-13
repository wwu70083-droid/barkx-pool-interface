import { createApp } from "vue";
import "../origin/style.css";
import "./style.less";
import App from "./App.vue";
import i18n from "@/i18n";
import router from "@/router";
import { createPinia } from "pinia";
import { RelayXClient } from "relayx-api";
import { useMainStore } from "@/store";
import { initService } from "@/composables/useRelayService";

if (import.meta.env.DEV) {
  import("vconsole").then(({ default: VConsole }) => new VConsole());
}

const pinia = createPinia();
const app = createApp(App);

window.relayx = new RelayXClient();

app.use(router);
app.use(pinia);
app.use(i18n);

const store = useMainStore(pinia);
initService(store).catch((error) => {
  console.warn("[main] Self Service init failed:", error);
});

app.mount("#app");
