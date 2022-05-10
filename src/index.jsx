import { render } from "solid-js/web";
import { createStore } from "solid-js/store";
import { Router } from "solid-app-router";

import "./index.css";
import "./init";
import App from "./App";
import { getRicherNode } from "./main/tree/node";

const defaultRootNode = getRicherNode(
  {
    id: "root",
    name: "ROOT",
    mimeType: "application/vnd.google-apps.folder",
  },
  null
);

const defaultStore = {
  isExternalLibLoaded: false,
  hasCredential: false,
  nodes: {
    rootNode: defaultRootNode,
    content: { root: defaultRootNode },
    isInitialised: false,
    isLoading: false,
  },
};

export const [store, setStore] = createStore(defaultStore);

// const cleanup =
render(() => {
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
  // import.meta.hot.accept();
  // import.meta.hot.dispose(cleanup);
}

// TODO: watch the resize event to set the body width and eventually display
//      an horizontal scroll bar
