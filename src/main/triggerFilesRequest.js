import _ from "lodash";

import { getRicherNodes, isFolder } from "./tree/node";
import { tokenClient } from "../init";
import { store, setStore } from "../index";
import { removeAccessToken, setAccessToken } from "../token";

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

  // TODO : NEXT : loop the request if there is more files to load
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
            setAccessToken(gapi.client.getToken());
            [files, nextPageToken] = await grabFiles(
              listOptions,
              nextPageToken
            );
            resolve(files);
          })
          .catch((err) => {
            removeAccessToken();
            console.error("Cannot call google API.");
            console.error(err);
            reject(err);
          });
      } else {
        console.info("Renew consentment");
        getToken("consent")
          .then(async (resp) => {
            setAccessToken(gapi.client.getToken());
            [files, nextPageToken] = await grabFiles(
              listOptions,
              nextPageToken
            );
            resolve(files);
          })
          .catch((err) => {
            removeAccessToken();
            console.error("Cannot call google API.");
            console.error(err);
            reject(err);
          });
      }
    }
  });
}

async function higherGetSortedNodes(getNodesFunction, parentNodeId) {
  function sortNodesDirectoryFirst(node0, node1) {
    if (isFolder(node0) && !isFolder(node1)) {
      return -1;
    } else if (!isFolder(node0) && isFolder(node1)) {
      return 1;
    } else {
      return node0.name.localeCompare(node1.name);
    }
  }

  const nodes = await getNodesFunction();
  nodes.sort(sortNodesDirectoryFirst);

  const richerNodes = getRicherNodes(nodes, parentNodeId);

  return richerNodes;
}

const nodesFromDirectoryCase = 0;
const sharedNodesCase = 1;
const everyNodesCase = 2;

async function getNodes(specificCase, pageSize, fields, folderId) {
  let requestOptions = {};
  switch (specificCase) {
    case nodesFromDirectoryCase: {
      requestOptions = {
        pageSize,
        fields,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        folderId,
        spaces: "drive",
      };
      break;
    }
    case sharedNodesCase: {
      requestOptions = {
        pageSize,
        fields,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q: "sharedWithMe = true",
        spaces: "drive",
      };
      break;
    }
    case everyNodesCase: {
      requestOptions = {
        pageSize,
        fields,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        spaces: "drive",
      };
      break;
    }
    default: {
      return new Promise((resolve, _) => resolve([]));
    }
  }

  return await loopRequest(requestOptions);
}

export async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
  return await higherGetSortedNodes(
    () => getNodes(nodesFromDirectoryCase, pageSize, fields, folderId),
    folderId
  );
}

async function initNodes(specificCase) {
  const pageSize = 999;
  const fields = "*";
  let callback;
  switch (specificCase) {
    case nodesFromDirectoryCase: {
      callback = () =>
        getNodes(nodesFromDirectoryCase, pageSize, fields, rootId);
      break;
    }
    case sharedNodesCase: {
      callback = () => getNodes(sharedNodesCase, pageSize, fields);
      break;
    }
    case everyNodesCase: {
      callback = () => getNodes(everyNodesCase, pageSize, fields);
      break;
    }
    default: {
      return new Promise((resolve, _) => resolve([]));
    }
  }

  return await higherGetSortedNodes(callback, rootId);
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
  function initSwitchToSpecificCase(initSwitch) {
    switch (initSwitch) {
      case "drive":
        return nodesFromDirectoryCase;
      case "shared":
        return sharedNodesCase;
      case "every":
        return everyNodesCase;
      default:
        console.error(`initSwitch "${initSwitch}" is not handled.`);
        return everyNodesCase + 1;
    }
  }

  function grabFiles(initSwitch) {
    return initNodes(initSwitchToSpecificCase(initSwitch));
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
