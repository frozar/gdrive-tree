// import { tabbable } from "./tabbable.js";
import { tabbable } from "tabbable";
import regeneratorRuntime from "regenerator-runtime";
import axios from "axios";
import { escape } from "html-escaper";

// Client ID and API key from the Developer Console
let CLIENT_ID =
  "368874607594-dej3529rds6ktb0n9prebeotcp7clhu3.apps.googleusercontent.com";
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
    signoutButton.style.display = "block";
    init();
  } else {
    authorizeButton.style.display = "block";
    signoutButton.style.display = "none";
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

function createHTMLArrowRight() {
  let HTMLSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  HTMLSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  HTMLSvg.setAttribute("version", "1.1");
  HTMLSvg.setAttribute("width", "16px");
  HTMLSvg.setAttribute("height", "16px");
  HTMLSvg.setAttribute("viewBox", "0 -5 25 30");
  HTMLSvg.setAttribute("aria-hidden", "true");

  let svgNS = HTMLSvg.namespaceURI;

  let path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "m5 20 10 -10 -10 -10 z");
  HTMLSvg.appendChild(path);

  return HTMLSvg;
}

function setAttributes(HTMLElement, attributes) {
  for (const [key, val] of Object.entries(attributes)) {
    HTMLElement.setAttribute(key, val);
  }
}

function createHTMLSpan(attributes) {
  let HTMLSpan = document.createElement("span");
  if (attributes) {
    setAttributes(HTMLSpan, attributes);
  }
  return HTMLSpan;
}

function createHTMLDiv(attributes) {
  let HTMLDiv = document.createElement("div");
  if (attributes) {
    setAttributes(HTMLDiv, attributes);
  }
  return HTMLDiv;
}

function createHTMLIndentationUnit() {
  let HTMLspan = document.createElement("span");
  HTMLspan.setAttribute("style", "display: inline-block; width: 16px;");
  return HTMLspan;
}

function createHTMLImage(src) {
  let HTMLimg = document.createElement("img");
  HTMLimg.src = src;
  return HTMLimg;
}

function createHTMLText(message) {
  let HTMLtext = document.createTextNode(message);
  return HTMLtext;
}

function appendTo(destinationNode, HTMLnodes) {
  for (let i = 0; i < HTMLnodes.length; ++i) {
    destinationNode.appendChild(HTMLnodes[i]);
  }
}

function appendToContent(HTMLnodes) {
  let contentDiv = document.getElementById("content");
  appendTo(contentDiv, HTMLnodes);
}

function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

function sortNodesDirectoryFirst(node0, node1) {
  if (isFolder(node0) && !isFolder(node1)) {
    return -1;
  } else if (!isFolder(node0) && isFolder(node1)) {
    return 1;
  } else {
    return node0.name.localeCompare(node1.name);
  }
}

function buildFilesListArg(args) {
  const result = {};

  const authorisedKeys = [
    "pageSize",
    "fields",
    "q",
    "folderId",
    "pageToken",
    "spaces",
    "includeItemsFromAllDrives",
    "includeTeamDriveItems",
    "supportsAllDrives",
    "supportsTeamDrives",
    "orderBy",
  ];

  for (const key of Object.keys(args)) {
    if (!authorisedKeys.includes(key)) {
      continue;
    }
    if (key === "folderId") {
      const folderId = args[key];
      if (folderId) {
        result.q = "'" + folderId + "' in parents and trashed = false";
      }
    } else {
      result[key] = args[key];
    }
  }

  return result;
}

async function gFilesList(args) {
  return await gapi.client.drive.files.list(buildFilesListArg(args));
}

const enableNodesCache = true;
/**
 * Maps a node id to an array of children nodes.
 */
let nodesCache = {};

let rootNodeId;

async function loopRequest(listOptions) {
  const result = [];
  let nextPageToken;
  do {
    let response = await gFilesList({
      ...listOptions,
      pageToken: nextPageToken,
    });
    nextPageToken = response.result.nextPageToken;
    if (response.result.files.length <= 0) {
      break;
    }
    for (const file of response.result.files) {
      result.push(file);
    }
  } while (nextPageToken);

  return result;
}

async function getNodesFromDirectory(pageSize, fields, folderId) {
  if (nodesCache[folderId]) {
    return nodesCache[folderId];
  }

  const result = await loopRequest({
    pageSize,
    fields,
    folderId,
    spaces: "drive",
  });

  nodesCache[folderId] = [...result];

  return result;
}

async function higherGetSortedNodes(
  getSortedNodesFunction,
  pageSize,
  fields,
  folderId
) {
  const nodes = await getSortedNodesFunction(pageSize, fields, folderId);
  nodes.sort(sortNodesDirectoryFirst);
  return nodes;
}

async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
  return await higherGetSortedNodes(
    getNodesFromDirectory,
    pageSize,
    fields,
    folderId
  );
}

async function getSharedNodes(pageSize, fields) {
  return await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    q: "sharedWithMe = true",
    spaces: "drive",
  });
}

async function getSortedSharedNodes(pageSize, fields) {
  return await higherGetSortedNodes(getSharedNodes, pageSize, fields);
}

async function getEveryNodes(pageSize, fields) {
  return await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    spaces: "drive",
  });
}

async function getSortedEveryNodes(pageSize, fields) {
  return await higherGetSortedNodes(getEveryNodes, pageSize, fields);
}

async function toggleFolderExpansion(folderId) {
  const parentDiv = document.getElementById(folderId);
  if (parentDiv.childElementCount === 1) {
    const nodes = await getSortedNodesFromDirectory(999, "*", folderId);
    parentDiv.append(createHTMLNodes(nodes, true));

    const HTMLArrow = parentDiv.firstChild.firstChild;
    HTMLArrow.style.transform = "rotate(90deg)";
  } else if (parentDiv.childElementCount === 2) {
    const HTMLFolderContent = parentDiv.lastElementChild;
    parentDiv.removeChild(HTMLFolderContent);

    const HTMLArrow = parentDiv.firstChild.firstChild;
    HTMLArrow.style.transform = "rotate(0deg)";
  }
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function focusHomeElement() {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  tabbableResult[0].focus();
  return tabbableResult[0];
}

function focusEndElement() {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  tabbableResult[tabbableResult.length - 1].focus();
  return tabbableResult[tabbableResult.length - 1];
}

function focusNextElement(eventTarget) {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = Math.min(
    tabbableResult.indexOf(eventTarget) + 1,
    tabbableResult.length - 1
  );
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusPreviousElement(eventTarget) {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = Math.max(tabbableResult.indexOf(eventTarget) - 1, 0);
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusNextElementCircular(eventTarget) {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = mod(
    tabbableResult.indexOf(eventTarget) + 1,
    tabbableResult.length
  );
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusPreviousElementCircular(eventTarget) {
  const rootNode = document.getElementById("content");
  const tabbableResult = tabbable(rootNode);
  const previousFocusIndex = mod(
    tabbableResult.indexOf(eventTarget) - 1,
    tabbableResult.length
  );
  tabbableResult[previousFocusIndex].focus();
  return tabbableResult[previousFocusIndex];
}

function isFolderExpanded(folder) {
  return 1 < document.getElementById(folder.id).childElementCount;
}

function focusParentFolder(node) {
  if (node.parents && node.parents[0]) {
    if (node.parents[0] !== rootNodeId) {
      const parentElement = document.getElementById(node.parents[0]);
      parentElement.firstChild.focus();
    }
  }
}

function toggleContentEditable(textHTMLSpan) {
  const isContentEditable = textHTMLSpan.getAttribute("contenteditable");
  const isContentEditableBool = isContentEditable === "true";
  textHTMLSpan.setAttribute("contenteditable", !isContentEditableBool);
}

// TODO: handle "F2"
// TODO: handle "Delete"
async function handleKeyDown(event, node) {
  if (event.code === "F2") {
    // console.log("target", event.target);
    // console.log("last elt", event.target.lastElementChild);
    // console.dir(event.target.lastElementChild);
    // console.log("last elt", event.target.firstChild.lastElementChild);
    // textHTMLSpan;
    // if (isFolder(node)) {
    // }
    const textHTMLSpan = event.target.lastElementChild;
    // console.dir(event.target);
    // const isContentEditable = textHTMLSpan.getAttribute("contenteditable");
    // // console.log("isContentEditable", isContentEditable);
    // // console.log("typeof isContentEditable", typeof isContentEditable);
    // const isContentEditableBool = isContentEditable === "true";
    // // console.log("isContentEditableBool", isContentEditableBool);
    // // console.log("!isContentEditableBool", !isContentEditableBool);
    // textHTMLSpan.setAttribute("contenteditable", !isContentEditableBool);
    toggleContentEditable(textHTMLSpan);
    textHTMLSpan.focus();
    // console.log("textHTMLSpan.innerHTML", textHTMLSpan.innerHTML);
    const textContent = textHTMLSpan.innerHTML;
    // Select everything except extension
    const indexPt = textContent.lastIndexOf(".");
    // console.log("textHTMLSpan", textHTMLSpan);
    // console.log("typeof textHTMLSpan", typeof textHTMLSpan);
    // console.dir(textHTMLSpan);
    // console.log("textHTMLSpan.firstChild", textHTMLSpan.firstChild);
    // console.log(
    //   "typeof textHTMLSpan.firstChild",
    //   typeof textHTMLSpan.firstChild
    // );
    const textHTMLNode = textHTMLSpan.firstChild;
    // console.dir(textHTMLSpan.firstChild);
    if (indexPt !== -1) {
      let selection = window.getSelection();
      let range = document.createRange();
      range.setStart(textHTMLNode, 0);
      range.setEnd(textHTMLNode, indexPt);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // textHTMLSpan.setSelectionRange(0, textContent.length);
      let selection = window.getSelection();
      let range = document.createRange();
      range.selectNodeContents(textHTMLNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  if (event.code === "ArrowRight") {
    event.preventDefault();
    if (isFolder(node)) {
      if (!isFolderExpanded(node)) {
        await toggleFolderExpansion(node.id);
      }
      const nodes = await getNodesFromDirectory(999, "*", node.id);
      if (0 < nodes.length) {
        focusNextElementCircular(event.target);
      }
    } else {
      focusNextElementCircular(event.target);
    }
  }
  if (event.code === "ArrowLeft") {
    event.preventDefault();
    if (isFolder(node)) {
      if (isFolderExpanded(node)) {
        await toggleFolderExpansion(node.id);
      } else {
        focusParentFolder(node);
      }
    } else {
      focusParentFolder(node);
    }
  }
  if (event.code === "ArrowUp") {
    event.preventDefault();
    focusPreviousElementCircular(event.target);
  }
  if (event.code === "ArrowDown") {
    event.preventDefault();
    focusNextElementCircular(event.target);
  }
  if (event.code === "PageUp") {
    event.preventDefault();
    let currentHTMLNode = event.target;
    for (const i in [...Array(10)]) {
      currentHTMLNode = focusPreviousElement(currentHTMLNode);
    }
  }
  if (event.code === "PageDown") {
    event.preventDefault();
    let currentHTMLNode = event.target;
    for (const i in [...Array(10)]) {
      currentHTMLNode = focusNextElement(currentHTMLNode);
    }
  }
  if (event.code === "Home") {
    event.preventDefault();
    focusHomeElement();
  }
  if (event.code === "End") {
    event.preventDefault();
    focusEndElement();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (isFolder(node)) {
      toggleFolderExpansion(node.id);
    }
  }
  if (event.code === "Enter") {
    event.preventDefault();
    if (isFolder(node)) {
      toggleFolderExpansion(node.id);
    } else {
      openFile(node);
    }
  }
}

let originalTextContent;

function createTextHTMLSpan(node) {
  const HTMLSpan = createHTMLSpan({
    style: "margin-left: 4px; margin-right: 2px",
    contenteditable: "false",
  });

  HTMLSpan.addEventListener("focusin", (event) => {
    // console.log("focusin");
    // // console.log(event.target.innerText);
    originalTextContent = event.target.innerText;
    console.log("INIT originalTextContent", originalTextContent);
  });

  // TODO: handle tab
  // TODO: handle shift + tab
  HTMLSpan.addEventListener("keydown", (event) => {
    // console.log("Text keydown");
    event.cancelBubble = true;

    const textHTMLSpan = event.target;
    if (event.code === "Escape") {
      // console.log("Escape edition: discard changes");
      toggleContentEditable(textHTMLSpan);
      let selection = window.getSelection();
      selection.removeAllRanges();
      textHTMLSpan.innerText = originalTextContent;
      originalTextContent = undefined;
      textHTMLSpan.parentNode.focus();
    }
    if (event.code === "Tab") {
      // console.log("Tab event");
      toggleContentEditable(textHTMLSpan);
      let selection = window.getSelection();
      selection.removeAllRanges();
      textHTMLSpan.innerText = originalTextContent;
      originalTextContent = undefined;
    }
    if (event.code === "Enter") {
      // console.log("Enter edition: validate changes");
      toggleContentEditable(textHTMLSpan);
      let selection = window.getSelection();
      selection.removeAllRanges();
      const newTextContent = escape(textHTMLSpan.innerText);
      // console.log("node.id", node.id);
      // console.log("newTextContent", newTextContent);

      // Sanity checks
      if (newTextContent === originalTextContent) {
        originalTextContent = undefined;
        textHTMLSpan.parentNode.focus();
        return;
      }

      if (newTextContent.length !== textHTMLSpan.innerText.length) {
        console.error("Escapable character present in new name");
        console.error("newTextContent", newTextContent);
        console.error("textHTMLSpan.innerText", textHTMLSpan.innerText);
        textHTMLSpan.innerText = originalTextContent;
        originalTextContent = undefined;
        textHTMLSpan.parentNode.focus();
        return;
      }

      gapi.client.drive.files
        .update({
          fileId: node.id,
          name: newTextContent,
        })
        .then((resp) => {
          // console.log("resp", resp);
          textHTMLSpan.innerText = newTextContent;
          originalTextContent = undefined;
          textHTMLSpan.parentNode.focus();
        })
        .catch((error) => {
          console.error("error", error);
          textHTMLSpan.innerText = originalTextContent;
          originalTextContent = undefined;
          textHTMLSpan.parentNode.focus();
        });

      // return;
    }
  });

  appendTo(HTMLSpan, [createHTMLText(node.name)]);
  return HTMLSpan;
}

// Handle contextual menu (right click)
function createHTMLFolderNode(folder) {
  const toAppend = [];

  const HTMLSvg = createHTMLArrowRight();
  HTMLSvg.addEventListener("click", (event) => {
    toggleFolderExpansion(folder.id);
  });
  toAppend.push(HTMLSvg);

  toAppend.push(createHTMLImage(folder.iconLink));

  const HTMLSpan = createTextHTMLSpan(folder);
  toAppend.push(HTMLSpan);

  const HTMLParentSpan = createHTMLSpan({
    style: "cursor: pointer; display: inline-flex; align-items: center;",
    tabindex: 0,
  });
  appendTo(HTMLParentSpan, toAppend);

  HTMLParentSpan.addEventListener("click", (event) => {
    document.getElementById(folder.id).firstChild.focus();
  });

  HTMLParentSpan.addEventListener("dblclick", (event) => {
    toggleFolderExpansion(folder.id);
  });

  // To prevent text selection on double click
  HTMLParentSpan.addEventListener("mousedown", function (event) {
    if (event.detail > 1) {
      event.preventDefault();
    }
  });

  HTMLParentSpan.addEventListener("keydown", (event) => {
    handleKeyDown(event, folder);
  });

  const HTMLDiv = document.createElement("div");
  HTMLDiv.setAttribute("id", folder.id);

  appendTo(HTMLDiv, [HTMLParentSpan]);
  return HTMLDiv;
}

function openFile(file) {
  if (file.webViewLink) {
    window.open(file.webViewLink);
  }
}

function createHTMLFileNode(file) {
  const toAppend = [];
  toAppend.push(createHTMLIndentationUnit());

  const HTMLSpanContent = createHTMLSpan({
    style: "cursor: pointer; display: inline-flex; align-items: center",
    tabindex: "0",
  });

  const toAppend2 = [];
  toAppend2.push(createHTMLImage(file.iconLink));
  const HTMLSpan = createTextHTMLSpan(file);
  toAppend2.push(HTMLSpan);
  appendTo(HTMLSpanContent, toAppend2);

  toAppend.push(HTMLSpanContent);

  const HTMLParentSpan = createHTMLSpan();

  appendTo(HTMLParentSpan, toAppend);

  HTMLParentSpan.addEventListener("click", (event) => {
    console.log(file);
    document.getElementById(file.id).firstChild.focus();
  });

  HTMLParentSpan.addEventListener("dblclick", (event) => {
    openFile(file);
  });

  // To prevent text selection on double click
  HTMLParentSpan.addEventListener("mousedown", function (event) {
    if (event.detail > 1) {
      event.preventDefault();
    }
  });

  HTMLParentSpan.addEventListener("keydown", (event) => {
    handleKeyDown(event, file);
  });

  const HTMLDiv = createHTMLDiv();
  HTMLDiv.setAttribute("id", file.id);

  appendTo(HTMLDiv, [HTMLParentSpan]);
  return HTMLDiv;
}

function createHTMLNodes(nodes, indentation = false) {
  const HTMLDiv = createHTMLDiv(
    indentation
      ? {
          style: "margin-left: 16px;",
        }
      : {
          style:
            "margin-top: 10px; margin-bottom: 10px; margin-left: 10px; display: inline-block;",
        }
  );

  if (nodes.length === 0) {
    const HTMLSpan = createHTMLSpan({
      style: "color: #555; font-style: italic;",
    });
    HTMLSpan.appendChild(createHTMLText("(Empty)"));
    HTMLDiv.appendChild(HTMLSpan);
  }
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];

    if (isFolder(node)) {
      HTMLDiv.appendChild(createHTMLFolderNode(node));
      if (enableNodesCache) {
        if (!nodesCache[node.id]) {
          setTimeout(() => {
            getNodesFromDirectory(999, "*", node.id);
          }, 0);
        }
      }
    } else {
      HTMLDiv.appendChild(createHTMLFileNode(node));
    }
  }
  return HTMLDiv;
}

async function initNodesFromRoot() {
  const nodes = await getSortedNodesFromDirectory(999, "*", "root");
  if (0 < nodes.length) {
    rootNodeId = nodes[0].parents[0];
  }
  return nodes;
}

async function initSharedNodes() {
  return await getSortedSharedNodes(999, "*");
}

async function initEveryNodes() {
  return await getSortedEveryNodes(999, "*");
}

const initSwitch = "root";
// const initSwitch = "shared";
// const initSwitch = "every";

/**
 * Print files in root directory.
 */
async function init() {
  let nodes = [];
  switch (initSwitch) {
    case "root":
      nodes = await initNodesFromRoot();
      break;
    case "shared":
      nodes = await initSharedNodes();
      break;
    case "every":
      nodes = await initEveryNodes();
      break;
    default:
      console.error(`initSwich "${initSwich}" is not handled.`);
  }

  const HTMLDiv = createHTMLNodes(nodes, false);

  setAttributes(HTMLDiv, {});
  appendToContent([HTMLDiv]);

  if (0 < nodes.length) {
    const tabbableResult = tabbable(HTMLDiv);
    tabbableResult[0].focus();
  }
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
