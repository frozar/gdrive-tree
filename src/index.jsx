import { render } from "solid-js/web";
import { createStore } from "solid-js/store";
import { Router } from "solid-app-router";

import "./index.css";
import "./init";
import App from "./App";

const defaultStore = {
  isExternalLibLoaded: false,
  // isAuthorized: false,
  hasCredential: false,
  rootNodes: {
    content: [],
    isInitialised: false,
    isLoading: false,
  },
};

export const [store, setStore] = createStore(defaultStore);

// Hot Module Reload (HMR) code
if (import.meta.hot) {
}

render(() => {
  return (
    <Router>
      <App />
    </Router>
  );
}, document.getElementById("app"));
