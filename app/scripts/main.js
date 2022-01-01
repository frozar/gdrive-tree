// import { tabbable } from "./tabbable.js";
import { tabbable } from "tabbable";
import regeneratorRuntime from "regenerator-runtime";

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
  console.log("index.js: start");
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
    my_presonal_init();
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
  let HTMLsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  HTMLsvg.setAttribute("width", "16px");
  HTMLsvg.setAttribute("height", "16px");
  HTMLsvg.setAttribute("viewBox", "0 0 24 24");
  HTMLsvg.setAttribute("aria-hidden", "true");

  let svgNS = HTMLsvg.namespaceURI;

  let path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "m10 17 5-5-5-5v10z");
  HTMLsvg.appendChild(path);

  return HTMLsvg;
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
  const { pageSize, fields, q, folderId, pageToken, spaces } = args;
  const result = {};
  if (pageSize) {
    result.pageSize = pageSize;
  }
  if (fields) {
    result.fields = fields;
  }
  if (q) {
    result.q = q;
  } else if (folderId) {
    result.q = "'" + folderId + "' in parents";
  }
  if (pageToken) {
    result.pageToken = pageToken;
  }
  if (spaces) {
    result.spaces = spaces;
  }
  return result;
}

//   {
//   pageSize: pageSize,
//   // fields: "nextPageToken, files(id, name)",
//   fields: fields,
//   // q: "mimeType = 'application/vnd.google-apps.folder' and '' in parents",
//   // q: "mimeType = 'application/vnd.google-apps.folder'",
//   // q: "not properties has { key='parents' and value='' }",
//   // q: "'1gDNJO-ItDm2In206Tc9o9S1EqdSn0_S4' in parents",
//   q: "'" + directoryId + "' in parents",
//   // q: "properties has { parents=undefined }",
//   // q: "properties (parents) is undefined",
//   // q: "not properties has (parents)",
//   // q: "properties has {{ key='parents' and value='' }} or not properties has {{ key='parents' and value='' }}",
//   // q: "properties has { key='parents' and value='undefined' }",
//   // q: "not properties has { key='parents' and value='1fx8fwpgygF1HP_-nS_RVK99M0agdeR2Q' }",
//   pageToken: nextPageToken,
//   spaces: "drive",
// }
async function gFilesList(args) {
  return await gapi.client.drive.files.list(buildFilesListArg(args));
}

/**
 * Maps a node id to an array of children nodes.
 */
let nodesCache = {};

let rootNodeId;

async function getNodesFromDirectory(pageSize, fields, folderId) {
  if (nodesCache[folderId]) {
    return nodesCache[folderId];
  }

  const result = [];
  let nextPageToken;
  do {
    let response = await gFilesList({
      pageSize,
      fields,
      folderId,
      pageToken: nextPageToken,
      spaces: "drive",
    });
    nextPageToken = response.result.nextPageToken;
    if (response.result.files.length <= 0) {
      break;
    }
    for (let i = 0; i < response.result.files.length; i++) {
      result.push(response.result.files[i]);
    }
  } while (nextPageToken);

  nodesCache[folderId] = [...result];
  return result;
}

async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
  const nodes = await getNodesFromDirectory(pageSize, fields, folderId);
  nodes.sort(sortNodesDirectoryFirst);
  return nodes;
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

// function handleClick() {}

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
    console.log("Text keydown");
    event.cancelBubble = true;

    if (event.code === "Escape") {
      // console.log("Escape edition: discard changes");
      const textHTMLSpan = event.target;
      toggleContentEditable(textHTMLSpan);
      let selection = window.getSelection();
      selection.removeAllRanges();
      textHTMLSpan.innerText = originalTextContent;
      originalTextContent = undefined;
      textHTMLSpan.parentNode.focus();
    }
    if (event.code === "Enter") {
      console.log("Enter edition: validate changes");
      // TODO: send a request to google drive to update the file name
    }
  });

  appendTo(HTMLSpan, [createHTMLText(node.name)]);
  return HTMLSpan;
}

// Handle contextual menu (right click)
function createHTMLFolderNode(folder) {
  const toAppend = [];
  toAppend.push(createHTMLArrowRight());

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
      : undefined
  );

  if (nodes.length === 0) {
    const HTMLSpan = createHTMLSpan({
      style: "color: #555; font-style: italic;",
    });
    HTMLSpan.appendChild(createHTMLText("Empty"));
    HTMLDiv.appendChild(HTMLSpan);
  }
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];

    if (isFolder(node)) {
      HTMLDiv.appendChild(createHTMLFolderNode(node));
      if (!nodesCache[node.id]) {
        setTimeout(() => {
          getNodesFromDirectory(999, "*", node.id);
        }, 0);
      }
    } else {
      HTMLDiv.appendChild(createHTMLFileNode(node));
    }
  }
  return HTMLDiv;
}

/**
 * Print files in root directory.
 */
async function my_presonal_init() {
  const nodes = await getSortedNodesFromDirectory(999, "*", "root");
  if (0 < nodes.length) {
    rootNodeId = nodes[0].parents[0];
  }
  const HTMLDiv = createHTMLNodes(nodes, false);

  setAttributes(HTMLDiv, {
    style:
      "box-shadow: 0px 6px 6px -3px rgb(0 0 0 / 20%), 0px 10px 14px 1px rgb(0 0 0 / 14%), 0px 4px 18px 3px rgb(0 0 0 / 12%); margin-top: 0.5em;",
  });
  appendToContent([HTMLDiv]);

  const tabbableResult = tabbable(HTMLDiv);
  tabbableResult[0].focus();
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
