import regeneratorRuntime from "regenerator-runtime";
import { tabbable } from "tabbable";
import { escape } from "html-escaper";
import {
  selection,
  selectionDone,
  resetSelectionDone,
  clearSelection,
  nodeIsSelected,
} from "./selection";

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

function createHTMLImage(src) {
  let HTMLimg = document.createElement("img");
  HTMLimg.src = src;
  return HTMLimg;
}

export function createHTMLText(message) {
  let HTMLtext = document.createTextNode(message);
  return HTMLtext;
}

function appendTo(destinationNode, HTMLnodes) {
  for (let i = 0; i < HTMLnodes.length; ++i) {
    destinationNode.appendChild(HTMLnodes[i]);
  }
}

function clearState() {
  clearContent();
  clearObject(folderIdDict);
  clearObject(nodesCache);
}

function clearObject(obj) {
  for (const key in obj) {
    delete obj[key];
  }
}

function clearContent() {
  let contentDiv = document.getElementById("container");
  while (contentDiv.firstChild) {
    contentDiv.firstChild.remove();
  }
}

export function appendToContent(HTMLnodes) {
  let contentDiv = document.getElementById("container");
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
const nodesCache = {};

let rootNodeId;

const folderIdDict = {};

export function getFolderIds() {
  return Object.keys(folderIdDict);
}

function addFolderId(folderId) {
  folderIdDict[folderId] = true;
}

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

function retrieveFolderIds(nodes) {
  nodes.forEach((node) => {
    // console.log("node", node);
    if (isFolder(node)) {
      addFolderId(node.id);
    }
  });
}

async function getNodesFromDirectory(pageSize, fields, folderId) {
  if (nodesCache[folderId]) {
    return nodesCache[folderId];
  }

  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    folderId,
    spaces: "drive",
  });

  retrieveFolderIds(result);

  nodesCache[folderId] = [...result];

  return result;
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
  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    q: "sharedWithMe = true",
    spaces: "drive",
  });

  return result;
}

async function getSortedSharedNodes(pageSize, fields) {
  return await higherGetSortedNodes(getSharedNodes, pageSize, fields);
}

async function getEveryNodes(pageSize, fields) {
  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    spaces: "drive",
  });

  // result.forEach((node) => {
  //   // console.log("node", node);
  //   if (isFolder(node)) {
  //     addFolderId(node.id);
  //   }
  // });
  return result;
}

async function getSortedEveryNodes(pageSize, fields) {
  return await higherGetSortedNodes(getEveryNodes, pageSize, fields);
}

export async function toggleFolderExpansion(folderId) {
  const parentDiv = document.getElementById(folderId);
  if (!isFolderExpanded(folderId)) {
    const nodes = await getSortedNodesFromDirectory(999, "*", folderId);
    parentDiv.append(createHTMLNodes(nodes, true));

    const HTMLArrow = parentDiv.firstChild.firstChild;
    HTMLArrow.style.transform = "rotate(90deg)";
  } else {
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
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  tabbableResult[0].focus();
  return tabbableResult[0];
}

function focusEndElement() {
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  tabbableResult[tabbableResult.length - 1].focus();
  return tabbableResult[tabbableResult.length - 1];
}

function focusNextElement(eventTarget) {
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = Math.min(
    tabbableResult.indexOf(eventTarget) + 1,
    tabbableResult.length - 1
  );
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusPreviousElement(eventTarget) {
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = Math.max(tabbableResult.indexOf(eventTarget) - 1, 0);
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusNextElementCircular(eventTarget) {
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  const nextFocusIndex = mod(
    tabbableResult.indexOf(eventTarget) + 1,
    tabbableResult.length
  );
  tabbableResult[nextFocusIndex].focus();
  return tabbableResult[nextFocusIndex];
}

function focusPreviousElementCircular(eventTarget) {
  const rootNode = document.getElementById("container");
  const tabbableResult = tabbable(rootNode);
  const previousFocusIndex = mod(
    tabbableResult.indexOf(eventTarget) - 1,
    tabbableResult.length
  );
  tabbableResult[previousFocusIndex].focus();
  return tabbableResult[previousFocusIndex];
}

export function isFolderExpanded(folderId) {
  return 1 < document.getElementById(folderId).childElementCount;
}

function focusParentFolder(node) {
  if (node.parents && node.parents[0]) {
    if (node.parents[0] !== rootNodeId) {
      const parentElement = document.getElementById(node.parents[0]);
      parentElement.firstChild.children[1].focus();
    }
  }
}

function toggleContentEditable(textHTMLSpan) {
  const isContentEditable = textHTMLSpan.getAttribute("contenteditable");
  const isContentEditableBool = isContentEditable === "true";
  textHTMLSpan.setAttribute("contenteditable", !isContentEditableBool);
}

// TODO: handle "Delete"
async function handleKeyDown(event, node) {
  if (event.code === "F2") {
    clearSelection();
    const textHTMLSpan = event.target.lastElementChild;
    toggleContentEditable(textHTMLSpan);
    textHTMLSpan.focus();
    const textContent = textHTMLSpan.innerHTML;
    const indexPt = textContent.lastIndexOf(".");
    const textHTMLNode = textHTMLSpan.firstChild;
    if (indexPt !== -1) {
      let selection = window.getSelection();
      let range = document.createRange();
      range.setStart(textHTMLNode, 0);
      range.setEnd(textHTMLNode, indexPt);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
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
      if (!isFolderExpanded(node.id)) {
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
      if (isFolderExpanded(node.id)) {
        await toggleFolderExpansion(node.id);
      } else {
        focusParentFolder(node);
      }
    } else {
      focusParentFolder(node);
    }
  }
  // TODO: manage CTRL
  // TODO: manage SHIFT
  if (event.code === "ArrowUp") {
    event.preventDefault();
    focusPreviousElementCircular(event.target);
  }
  // TODO: manage CTRL
  // TODO: manage SHIFT
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
  // TODO: manage CTRL
  // TODO: manage SHIFT
  if (event.code === "Space") {
    event.preventDefault();
    console.log("BEGIN selection", selection);
    // console.log("node.id", node.id);
    // console.log(
    //   "document.getElementById(node.id)",
    //   document.getElementById(node.id)
    // );
    const tabbableResult = tabbable(document.getElementById(node.id));
    // console.log("tabbableResult", tabbableResult);

    if (tabbableResult[0]) {
      console.log("tabbableResult[0].classList", tabbableResult[0].classList);
      console.log(
        "nodeIsSelected(tabbableResult[0])",
        nodeIsSelected(tabbableResult[0])
      );
      if (nodeIsSelected(tabbableResult[0])) {
        selection.deselect(tabbableResult[0]);
        tabbableResult[0].classList.remove("selected");
      } else {
        selection.select(tabbableResult[0]);
        tabbableResult[0].classList.add("selected");
      }
    }
    console.log("END   selection", selection);
    console.log("");

    // if (isFolder(node)) {
    //   toggleFolderExpansion(node.id);
    // }
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
    event.cancelBubble = true;
    toggleFolderExpansion(folder.id);
  });
  toAppend.push(HTMLSvg);

  const HTMLSpanLabel = createTextHTMLSpan(folder);

  const HTMLContentSpan = createHTMLSpan({
    class: "selectable",
    tabindex: 0,
  });
  appendTo(HTMLContentSpan, [createHTMLImage(folder.iconLink), HTMLSpanLabel]);
  toAppend.push(HTMLContentSpan);

  const HTMLParentSpan = createHTMLSpan({ class: "folder_surrounding_span" });
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
  const HTMLSpanContent = createHTMLSpan({
    class: "selectable file",
    tabindex: "0",
  });

  const toAppend = [];
  toAppend.push(createHTMLImage(file.iconLink));
  const HTMLSpan = createTextHTMLSpan(file);
  toAppend.push(HTMLSpan);
  appendTo(HTMLSpanContent, toAppend);

  HTMLSpanContent.addEventListener("click", (event) => {
    // console.log(file);
    document.getElementById(file.id).firstChild.focus();
  });

  HTMLSpanContent.addEventListener("dblclick", (event) => {
    openFile(file);
  });

  // To prevent text selection on double click
  HTMLSpanContent.addEventListener("mousedown", function (event) {
    if (event.detail > 1) {
      event.preventDefault();
    }
  });

  HTMLSpanContent.addEventListener("keydown", (event) => {
    handleKeyDown(event, file);
  });

  const HTMLDiv = createHTMLDiv();
  HTMLDiv.setAttribute("id", file.id);

  appendTo(HTMLDiv, [HTMLSpanContent]);
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
      const folder = node;
      HTMLDiv.appendChild(createHTMLFolderNode(folder));
      if (enableNodesCache) {
        if (!nodesCache[folder.id]) {
          setTimeout(() => {
            getNodesFromDirectory(999, "*", folder.id);
          }, 0);
        }
      }
    } else {
      const file = node;
      HTMLDiv.appendChild(createHTMLFileNode(file));
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

/**
 * Print files in root directory.
 */
export default async function show(initSwitch) {
  clearState();

  let nodes = [];
  switch (initSwitch) {
    case "drive":
      nodes = await initNodesFromRoot();
      break;
    case "share":
      nodes = await initSharedNodes();
      break;
    case "every":
      nodes = await initEveryNodes();
      break;
    default:
      console.error(`initSwitch "${initSwitch}" is not handled.`);
  }

  retrieveFolderIds(nodes);

  const HTMLDiv = createHTMLNodes(nodes, false);

  HTMLDiv.addEventListener("click", () => {
    // console.log("click on big div", selectionDone);
    // console.log("selectionDone", selectionDone);
    if (!selectionDone) {
      // console.log("selection", selection);
      // selection.clearSelection();
      // for (const node of document.querySelectorAll(".selected")) {
      //   node.classList.remove("selected");
      // }
      clearSelection();
    }
    // selectionDone = false;
    resetSelectionDone();
  });

  setAttributes(HTMLDiv, { style: "width: -webkit-fill-available;" });

  appendToContent([HTMLDiv]);

  if (0 < nodes.length) {
    const tabbableResult = tabbable(HTMLDiv);
    tabbableResult[0].focus();
  }
}
