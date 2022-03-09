// import "regenerator-runtime";

// import "./router";
// import show, { appendToContent, createHTMLText } from "./tree";
// import "./button_toggle_all";
// import "./new_folder.js";
// import "./selection";

import { produce } from "solid-js/store";

import { store, setStore } from "./App";

// Client ID and API key from the Developer Console
let CLIENT_ID =
  "368874607594-nvsbjbq932pdvgcegs4qsuhh46ni7jo7.apps.googleusercontent.com";
let API_KEY = "AIzaSyBZlbqrkQQ18akLJQ5cZV4ITpT5Om5QMGg";

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
let SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/docs",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.photos.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.apps.readonly",
  "https://www.googleapis.com/auth/drive.scripts",
].join(" ");

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleClientHotReload() {
  console.log("handleClientHotReload typeof gapi", typeof gapi);
  setStore("isSessionInitialised", () => typeof gapi !== "undefined");

  if (typeof gapi !== "undefined") {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

    updateSigninStatus(isSignedIn);

    console.info("Hot Reload: DONE");
  }
}

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleClientLoad() {
  if (typeof gapi !== "undefined") {
    gapi.load("client:auth2", initClient);
  }
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  console.info("Process gapi initialisation...");
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      console.log(
        "initClient gapi.auth2.getAuthInstance().isSignedIn.get()",
        isSignedIn
      );
      // Handle the initial sign-in state.
      updateSigninStatus(isSignedIn);

      setStore("isSessionInitialised", () => true);
      setStore("isSignedIn", () => isSignedIn);
      console.info("Initialisation gapi: DONE");
    })
    .catch(function (error) {
      console.error("Initialisation gapi: FAILURE");
      console.error(error);
      setStore("isSessionInitialised", () => true);
      const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      setStore("isSignedIn", () => isSignedIn);
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (store.isSignedIn !== isSignedIn) {
    setStore("isSignedIn", () => isSignedIn);
  }

  // Grab user information if logged
  if (isSignedIn) {
    const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    const basicProfile = currentUser.getBasicProfile();
    var id_token = currentUser.getAuthResponse().id_token;

    setStore("userToken", () => id_token);
    setStore("userFullName", () => basicProfile.getName());
    setStore("userAvatarUrl", () => basicProfile.getImageUrl());
  }
}
