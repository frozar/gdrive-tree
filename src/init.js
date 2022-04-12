// Documentation link:
// https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#implicit_flow_examples

import { setStore } from "./index";

// document.getElementById("showEventsBtn").style.visibility = "hidden";
// document.getElementById("revokeBtn").style.visibility = "hidden";

export let tokenClient;
let gapiInited;
let gisInited;

function checkBeforeStart() {
  if (gapiInited && gisInited) {
    setStore("isInitialised", () => true);
  }
}

function gapiInit() {
  gapi.client
    .init({
      // NOTE: OAuth2 'scope' and 'client_id' parameters have moved to initTokenClient().
    })
    .then(function () {
      // Load the Drive API discovery document.
      gapi.client.load(
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
      );
      gapiInited = true;
      checkBeforeStart();
      console.info("Gapi lib loaded");
    })
    .catch((err) => {
      console.error("Cannot load Gapi lib");
      console.error(err);
    });
}

function gapiLoad() {
  gapi.load("client", gapiInit);
}

function gisInit() {
  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"].join(" ");
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_CLIENT_ID,
    scope: SCOPES,
    prompt: "consent",
    callback: "", // defined at request time in await/promise scope.
  });

  // console.log("tokenClient", tokenClient);

  gisInited = true;
  checkBeforeStart();

  console.info("GSI lib loaded");
}

function triggerLoadScript(src, onloadCallback, onerrorCallback) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = onloadCallback;
  script.onerror = onerrorCallback;
  document.head.appendChild(script);
}

// Documentation link :
// https://levelup.gitconnected.com/how-to-load-external-javascript-files-from-the-browser-console-8eb97f7db778
triggerLoadScript("https://apis.google.com/js/api.js", gapiLoad, () =>
  console.error("Cannot load Gapi lib")
);

triggerLoadScript("https://accounts.google.com/gsi/client", gisInit, () =>
  console.error("Cannot load GIS lib")
);

// window.onload = function () {
// };
