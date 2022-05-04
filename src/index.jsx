// @refresh reload
import { render } from "solid-js/web";
import { createStore } from "solid-js/store";
import { Router } from "solid-app-router";

import "./index.css";
import "./init";
import App from "./App";

const defaultStore = {
  isExternalLibLoaded: false,
  hasCredential: false,
  nodes: {
    rootNode: { id: "root", isExpanded: true, subNodes: null },
    isInitialised: false,
    isLoading: false,
  },
};

export const [store, setStore] = createStore(defaultStore);

const cleanup = render(() => {
  return (
    <Router>
      <App />
    </Router>
  );
}, document.getElementById("app"));

// Solution to avoid duplique instance of HTML after Hot Module Reload:
// https://www.reddit.com/r/solidjs/comments/sfclv4/solidjs_with_vite_preventing_multiple_instances/

if (import.meta.hot) {
  console.log("Hot reload");
  import.meta.hot.dispose(cleanup);
}
