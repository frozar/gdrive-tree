import _ from "lodash";

import { tokenClient } from "../init";
import { store, setStore } from "../index";

/**
 * Maps a node id to an array of children nodes.
 */
const nodesCache = {};

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

function gFilesList(listOptions) {
  return gapi.client.drive.files.list(buildFilesListArg(listOptions));
}

async function loopRequest(listOptions) {
  /**
   * Make as many requests that are necessary to retrieve the content of
   * a folder.
   *
   * @param {object} listOptions : necessary to build the request to google
   * @returns Array of files
   */
  async function grabFiles(listOptions) {
    const result = [];
    let nextPageToken;
    do {
      const response = await gFilesList({
        ...listOptions,
        pageToken: nextPageToken,
      });

      nextPageToken = response.result.nextPageToken;
      if (response.result.files.length <= 0) {
        nextPageToken = null;
        break;
      }
      for (const file of response.result.files) {
        result.push(file);
      }
    } while (nextPageToken);
    return result;
  }

  /**
   * Make a request for a new token
   *
   * @param {string} promptStr
   * @returns A promise
   */
  function getToken(promptStr) {
    return new Promise((resolve, reject) => {
      try {
        // Deal with the response for a new token
        tokenClient.callback = (resp) => {
          if (resp.error !== undefined) {
            // setStore("isAuthorized", () => false);
            reject(resp);
          }
          // setStore("isAuthorized", () => true);
          resolve(resp);
        };
        // Ask for a new token
        tokenClient.requestAccessToken({
          prompt: promptStr,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  return new Promise(async (resolve, reject) => {
    try {
      const result = await grabFiles(listOptions);
      resolve(result);
    } catch (err) {
      console.info("First call to google API failed.");
      console.info(err);
      if (gapi.client.getToken() === null) {
        console.info("Ask consentment");
        getToken("consent")
          .then(async (resp) => {
            const result = await grabFiles(listOptions);
            resolve(result);
          })
          .catch((err) => {
            console.error("Cannot call google API.");
            console.error(err);
            reject(err);
          });
      } else {
        console.info("Renew consentment");
        getToken("consent")
          .then(async (resp) => {
            const result = await grabFiles(listOptions);
            resolve(result);
          })
          .catch((err) => {
            console.error("Cannot call google API.");
            console.error(err);
            reject(err);
          });
      }
    }
  });
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
  return await getSortedNodesFromDirectory(999, "*", "root");
}

async function initSharedNodes() {
  return await getSortedSharedNodes(999, "*");
}

async function initEveryNodes() {
  return await getSortedEveryNodes(999, "*");
}

// TODO : manage prompt, when the user close the login connexion gui
//       for example

export async function triggerFilesRequest(initSwitch) {
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

  setStore("rootNodes", (current) => ({ ...current, isLoading: true }));

  let newNodes = await grabFiles(initSwitch);
  console.log("newNodes", newNodes);

  if (!_.isEqual(store.rootNodes.content, newNodes)) {
    setStore("rootNodes", (current) => ({ ...current, content: newNodes }));
  }
  setStore("rootNodes", (current) => ({
    ...current,
    isInitialised: true,
    isLoading: false,
  }));
}
