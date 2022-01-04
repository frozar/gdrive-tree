import regeneratorRuntime from "regenerator-runtime";

import router from "./router";
import show, { appendToContent, createHTMLText } from "./tree";
import "./button_toggle_all";
import "./selection";

// Client ID and API key from the Developer Console
let CLIENT_ID =
  "368874607594-9802hk2te62qs9dh0pfv28n872v8fo4d.apps.googleusercontent.com";
let API_KEY = "AIzaSyBZlbqrkQQ18akLJQ5cZV4ITpT5Om5QMGg";

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// let SCOPES = "https://www.googleapis.com/auth/drive.metadata.readonly";
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

let authorizeButton = document.getElementById("authorize_button");
let signoutButton = document.getElementById("signout_button");
let containerDiv = document.getElementById("container");
let navLinks = document.getElementById("nav_links");

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
      },
      function (error) {
        appendToContent([createHTMLText(JSON.stringify(error, null, 2))]);
      }
    );
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = "none";
    signoutButton.style.display = "inline";
    containerDiv.style.display = "block";
    navLinks.style.display = "inline";
    show("drive");
  } else {
    authorizeButton.style.display = "inline";
    signoutButton.style.display = "none";
    containerDiv.style.display = "none";
    navLinks.style.display = "none";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Wait for the google script to load properly
 */
const intervalID = setInterval(() => {
  while (typeof gapi === "undefined") {
    return;
  }
  handleClientLoad();
  clearInterval(intervalID);
}, 10);
