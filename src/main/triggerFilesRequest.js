import _ from "lodash";

import { getRicherNodes, isFolder } from "./tree/node";
import { tokenClient } from "../init";
import { store, setStore } from "../index";
import { removeAccessToken, setAccessToken } from "../token";
import { rootId } from "../globalConstant";

// TODO : be able to update the content of a directory one call after the other
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

  async function grabFiles(listOptions, nextPageToken) {
    function gFilesList(listOptions) {
      return gapi.client.drive.files.list(buildFilesListArg(listOptions));
    }

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

async function higherGetSortedNodes(fetchNodesFunction, parentNodeId) {
  function sortNodesDirectoryFirst(node0, node1) {
    if (isFolder(node0) && !isFolder(node1)) {
      return -1;
    } else if (!isFolder(node0) && isFolder(node1)) {
      return 1;
    } else {
      return node0.name.localeCompare(node1.name);
    }
  }

  const nodes = await fetchNodesFunction();
  nodes.sort(sortNodesDirectoryFirst);

  const richerNodes = getRicherNodes(nodes, parentNodeId);

  return richerNodes;
}

const nodesFromDirectoryCase = 0;
const sharedNodesCase = 1;
const everyNodesCase = 2;

async function fetchNodes(specificCase, pageSize, fields, folderId) {
  let requestOptions = {};
  switch (specificCase) {
    case nodesFromDirectoryCase: {
      requestOptions = {
        pageSize,
        fields,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        spaces: "drive",
        folderId,
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

// TODO: do more local diffs between object to upgrade state at small granularity
function updateNodesContent(newNodes, parentFolderId) {
  function computeHasUpdated(newNodes, parentFolderId) {
    const nodesToUpdate = {};
    let hasUpdated = false;

    const newSubNodesId = newNodes.map((n) => n.id);
    if (
      !_.isEqual(
        new Set(store.nodes.content[parentFolderId].subNodesId),
        new Set(newSubNodesId)
      )
    ) {
      nodesToUpdate[parentFolderId] = {
        ...store.nodes.content[parentFolderId],
        subNodesId: newSubNodesId,
      };
      hasUpdated = true;
    }

    for (const node of newNodes) {
      if (!_.isEqual(node, store.nodes.content[node.id])) {
        nodesToUpdate[node.id] = node;
        hasUpdated = true;
      }
    }

    return [hasUpdated, nodesToUpdate];
  }

  const [hasUpdated, nodesToUpdate] = computeHasUpdated(
    newNodes,
    parentFolderId
  );

  if (hasUpdated) {
    // if (parentFolderId === "root") {
    //   console.log("parentFolderId", parentFolderId);
    //   console.log("nodesToUpdate", nodesToUpdate);
    // }
    if (Object.keys(nodesToUpdate).length) {
      setStore("nodes", (current) => ({
        ...current,
        content: { ...current.content, ...nodesToUpdate },
      }));
    }
  }
}

export async function updateNode(folderId) {
  const pageSize = 999;
  const fields = "*";
  const newNodes = await higherGetSortedNodes(
    () => fetchNodes(nodesFromDirectoryCase, pageSize, fields, folderId),
    folderId
  );

  updateNodesContent(newNodes, folderId);
}

export async function triggerFilesRequest(initSwitch) {
  function triggerInitFilesRequest(initSwitch) {
    async function initNodes(specificCase, folderId) {
      const pageSize = 999;
      const fields = "*";
      let callback;
      switch (specificCase) {
        case nodesFromDirectoryCase: {
          callback = () =>
            fetchNodes(nodesFromDirectoryCase, pageSize, fields, folderId);
          break;
        }
        case sharedNodesCase: {
          callback = () => fetchNodes(sharedNodesCase, pageSize, fields);
          break;
        }
        case everyNodesCase: {
          callback = () => fetchNodes(everyNodesCase, pageSize, fields);
          break;
        }
        default: {
          return new Promise((resolve, _) => resolve([]));
        }
      }

      return await higherGetSortedNodes(callback, folderId);
    }

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

    return initNodes(initSwitchToSpecificCase(initSwitch), rootId);
  }

  setStore("nodes", (current) => ({ ...current, isLoading: true }));

  const newNodes = await triggerInitFilesRequest(initSwitch);

  updateNodesContent(newNodes, rootId);

  setStore("nodes", (current) => ({
    ...current,
    isInitialised: true,
    isLoading: false,
  }));
}
