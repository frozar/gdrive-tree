import _ from "lodash";

import { tokenClient } from "../init";
import { store, setStore } from "../index";

/**
 * Maps a node id to an array of children nodes.
 */
const nodesCache = {};

let rootNodeId;

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

function sortNodesDirectoryFirst(node0, node1) {
  if (isFolder(node0) && !isFolder(node1)) {
    return -1;
  } else if (!isFolder(node0) && isFolder(node1)) {
    return 1;
  } else {
    return node0.name.localeCompare(node1.name);
  }
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

function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

const folderIdDict = {};

function addFolderId(folderId) {
  folderIdDict[folderId] = true;
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

export async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
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

// TODO : manage prompt, when the user close the login connexion gui
//       for example

export function triggerFilesRequest(initSwitch) {
  function dealWithResponse(newNodes) {
    if (!_.isEqual(store.rootNodes.content, newNodes)) {
      setStore("rootNodes", (current) => ({ ...current, content: newNodes }));
    }
    setStore("rootNodes", (current) => ({
      ...current,
      isInitialised: true,
      isLoading: false,
    }));
  }

  function grabFiles(initSwitch) {
    switch (initSwitch) {
      case "drive":
        return initNodesFromRoot();
      case "shared":
        return initSharedNodes();
      case "every":
        return initEveryNodes();
      default:
        console.error(`initSwitch "${initSwitch}" is not handled.`);
        return new Promise((resolve, reject) => {
          resolve([]);
        });
    }
  }

  function callbackBody() {
    grabFiles(initSwitch)
      .then(dealWithResponse)
      .catch((err) => {
        console.error(err);
        tokenClient.requestAccessToken({ prompt: "" });
      });
  }

  tokenClient.callback = (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }

    // GIS has automatically updated gapi.client with the newly issued access token.
    // console.log(
    //   "gapi.client access token: " + JSON.stringify(gapi.client.getToken())
    // );

    callbackBody();
  };

  setStore("rootNodes", (current) => ({ ...current, isLoading: true }));
  // Conditionally ask users to select the Google Account they'd like to use,
  // and explicitly obtain their consent to fetch their Calendar.
  // NOTE: To request an access token a user gesture is necessary.
  if (gapi.client.getToken() === null) {
    // Prompt the user to select an Google Account and asked for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    // tokenClient.requestAccessToken({ prompt: "" });
    callbackBody();
  }
}
