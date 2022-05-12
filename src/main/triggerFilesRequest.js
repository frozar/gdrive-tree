import _ from "lodash";

import { getRicherNodes, isFolder } from "./tree/node";
import { tokenClient } from "../init";
import { store, setStore } from "../index";

import { rootId } from "./../globalConstant";

async function loopRequest(listOptions) {
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

  /**
   * Make as many requests that are necessary to retrieve the content of
   * a folder.
   *
   * @param {object} listOptions : necessary to build the request to google
   * @returns Array of files
   */
  // async function grabFiles_(listOptions) {
  //   const result = [];
  //   let nextPageToken;
  //   do {
  //     const response = await gFilesList({
  //       ...listOptions,
  //       pageToken: nextPageToken,
  //     });

  //     nextPageToken = response.result.nextPageToken;
  //     if (response.result.files.length <= 0) {
  //       nextPageToken = null;
  //       break;
  //     }
  //     for (const file of response.result.files) {
  //       result.push(file);
  //     }
  //   } while (nextPageToken);
  //   return result;
  // }

  async function grabFiles(listOptions, nextPageToken) {
    const response = await gFilesList({
      ...listOptions,
      pageToken: nextPageToken,
    });

    return [response.result.files, response.result.nextPageToken];
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
            reject(resp);
          }
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

  // TODO : loop the request if there is more files to load
  return new Promise(async (resolve, reject) => {
    let nextPageToken;
    let files;
    try {
      [files, nextPageToken] = await grabFiles(listOptions, nextPageToken);
      resolve(files);
    } catch (err) {
      console.info("First call to google API failed.");
      console.info(err);
      if (gapi.client.getToken() === null) {
        console.info("Ask consentment");
        getToken("consent")
          .then(async (resp) => {
            [files, nextPageToken] = await grabFiles(
              listOptions,
              nextPageToken
            );
            resolve(files);
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
            [files, nextPageToken] = await grabFiles(
              listOptions,
              nextPageToken
            );
            resolve(files);
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
  folderId,
  parentNodeId
) {
  const nodes = await getSortedNodesFunction(pageSize, fields, folderId);
  nodes.sort(sortNodesDirectoryFirst);

  const richerNodes = getRicherNodes(nodes, parentNodeId);

  return richerNodes;
}

async function getNodesFromDirectory(pageSize, fields, folderId) {
  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    folderId,
    spaces: "drive",
  });

  return result;
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

async function getEveryNodes(pageSize, fields) {
  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    spaces: "drive",
  });

  return result;
}

export async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
  return await higherGetSortedNodes(
    getNodesFromDirectory,
    pageSize,
    fields,
    folderId,
    folderId
  );
}

async function initNodesFromRoot() {
  return await getSortedNodesFromDirectory(999, "*", rootId);
}

async function getSortedSharedNodes(pageSize, fields, folderId, parentNodeId) {
  return await higherGetSortedNodes(
    getSharedNodes,
    pageSize,
    fields,
    folderId,
    parentNodeId
  );
}

async function initSharedNodes() {
  return await getSortedSharedNodes(999, "*", rootId, rootId);
}

async function getSortedEveryNodes(pageSize, fields, folderId, parentNodeId) {
  return await higherGetSortedNodes(
    getEveryNodes,
    pageSize,
    fields,
    folderId,
    parentNodeId
  );
}

async function initEveryNodes() {
  return await getSortedEveryNodes(999, "*", rootId, rootId);
}

function computeHasUpdated(richerNodes) {
  const nodesToUpdate = {};
  let hasUpdated = false;

  const newSubNodesId = richerNodes.map((n) => n.id);
  if (!_.isEqual(store.nodes.content["root"].subNodesId, newSubNodesId)) {
    nodesToUpdate["root"] = {
      ...store.nodes.content["root"],
      subNodesId: newSubNodesId,
    };
    hasUpdated = true;
  }

  for (const node of richerNodes) {
    if (!_.isEqual(node, store.nodes.content[node.id])) {
      nodesToUpdate[node.id] = node;
      hasUpdated = true;
    }
  }

  return [hasUpdated, nodesToUpdate];
}

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

  setStore("nodes", (current) => ({ ...current, isLoading: true }));

  let newNodes = await grabFiles(initSwitch);

  const [hasUpdated, nodesToUpdate] = computeHasUpdated(newNodes);

  if (hasUpdated) {
    if (Object.keys(nodesToUpdate).length) {
      setStore("nodes", (current) => ({
        ...current,
        isInitialised: true,
        isLoading: false,
        content: { ...current.content, ...nodesToUpdate },
      }));
    }
  } else {
    setStore("nodes", (current) => ({
      ...current,
      isInitialised: true,
      isLoading: false,
    }));
  }
}
