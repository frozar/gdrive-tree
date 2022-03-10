import { defaultStore, setStore } from "./index";

// Client ID and API key from the Developer Console
const CLIENT_ID =
  "368874607594-nvsbjbq932pdvgcegs4qsuhh46ni7jo7.apps.googleusercontent.com";
const API_KEY = "AIzaSyBZlbqrkQQ18akLJQ5cZV4ITpT5Om5QMGg";

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = [
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

export function checkSignInStatus() {
  // console.info("BEG checkSignInStatus");
  if (
    gapi &&
    gapi.auth2 &&
    gapi.auth2.getAuthInstance() &&
    gapi.auth2.getAuthInstance().isSingedIn
  ) {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSession);

    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

    updateSession(isSignedIn);

    setStore("isSignedIn", () => isSignedIn);
  }
  setStore("isInitialising", () => false);
  // console.info("END checkSignInStatus");
}

/**
 *  On load, called to load the auth2 library and API client library.
 */
export function handleClientLoad() {
  gapi.load("client:auth2", initClient);
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
    .then(() => {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSession);

      const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      console.log(
        "initClient gapi.auth2.getAuthInstance().isSignedIn.get()",
        isSignedIn
      );

      // Handle the initial sign-in state.
      updateSession(isSignedIn);

      setStore("isInitialising", () => false);
      setStore("isSignedIn", () => isSignedIn);
      console.info("Initialisation gapi: DONE");
    })
    .catch(function (error) {
      console.error("Initialisation gapi: FAILURE");
      console.error(error);
      setStore("isInitialising", () => false);
      const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      setStore("isSignedIn", () => isSignedIn);
    });
}

export function updateCurrentUser(currentUser) {
  const basicProfile = currentUser.getBasicProfile();
  var id_token = currentUser.getAuthResponse().id_token;

  setStore("userToken", () => id_token);
  setStore("userFullName", () => basicProfile.getName());
  setStore("userAvatarUrl", () => basicProfile.getImageUrl());
}

function updateSession(isSignedIn) {
  setStore("isLogging", () => false);
  setStore("isSignedIn", () => isSignedIn);

  // Grab user information if logged
  if (isSignedIn) {
    const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    updateCurrentUser(currentUser);
  } else {
    setStore("userToken", () => defaultStore.userToken);
    setStore("userFullName", () => defaultStore.userFullName);
    setStore("userAvatarUrl", () => defaultStore.userAvatarUrl);
  }
}
