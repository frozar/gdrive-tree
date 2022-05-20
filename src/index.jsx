import { render } from "solid-js/web";
import { createStore } from "solid-js/store";
import { Router } from "solid-app-router";

import "./index.css";
import "./init";
import App from "./App";
import { getRicherNode } from "./main/tree/node";
import { rootId } from "./globalConstant";

const defaultRootNode = (() => {
  const res = {
    ...getRicherNode(
      {
        id: rootId,
        name: "ROOT",
        mimeType: "application/vnd.google-apps.folder",
      },
      null
    ),
    isExpanded: true,
  };
  delete res.height;
  return res;
})();

const defaultStore = {
  isExternalLibLoaded: false,
  hasValidToken: false,
  nodes: {
    content: { [rootId]: defaultRootNode },
    isInitialised: false,
    isLoading: false,
  },
};

export const [store, setStore] = createStore(defaultStore);

render(() => {
  return (
    <Router>
      <App />
    </Router>
  );
}, document.getElementById("app"));

if (import.meta.hot) {
  // console.log("Hot reload");
}

// TODO: watch the resize event to set the body width and eventually display
//      an horizontal scroll bar
