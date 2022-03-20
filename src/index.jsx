import { render } from "solid-js/web";
import { createStore } from "solid-js/store";
import { Router } from "solid-app-router";

import "./index.css";
import App from "./App";
import { handleClientLoad, checkSignInStatus } from "./authentification";

export const defaultStore = {
  isGapiAvailable: false,
  isInitialising: true,
  isSignedIn: false,
  isLogging: false,
  userFullName: "",
  userAvatarUrl: "",
  userToken: "",
};

export const [store, setStore] = createStore(defaultStore);

// HMR code
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    setStore("isGapiAvailable", () => true);
    checkSignInStatus();
  });
}

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById("app")
);

/**
 * Wait for the google variable 'gapi' to be defined
 */
const intervalID = setInterval(() => {
  while (typeof gapi === "undefined") {
    return;
  }
  setStore("isGapiAvailable", () => true);
  handleClientLoad();
  clearInterval(intervalID);
}, 10);
