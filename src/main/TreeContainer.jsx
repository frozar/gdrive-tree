import { createSignal, createEffect, Show } from "solid-js";
import _ from "lodash";

import { store, setStore } from "../index";
import Tree from "./tree";

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

const TreeContainer = (props) => {
  const { initSwitch } = props;

  const [nodes, setNodes] = createSignal([]);
  const [isLoading, setIsLoading] = createSignal(true);

  createEffect(async () => {
    if (store.isSignedIn) {
      setIsLoading(true);
      let newNodes = [];

      switch (initSwitch) {
        case "drive":
          newNodes = await initNodesFromRoot();
          break;
        case "shared":
          newNodes = await initSharedNodes();
          break;
        case "every":
          newNodes = await initEveryNodes();
          break;
        default:
          console.error(`initSwitch "${initSwitch}" is not handled.`);
      }

      if (!_.isEqual(nodes(), newNodes)) {
        setNodes(newNodes);
      }
      setIsLoading(false);
    }
  });

  return (
    <Show when={store.isSignedIn} fallback={<h1>Not Sign In</h1>}>
      <Show
        when={!(store.isInitialising || store.isLogging || isLoading())}
        fallback={<h1>Loading</h1>}
      >
        <Tree isRoot={true} nodes={nodes} name={"root"} />
      </Show>
    </Show>
  );
};

export default TreeContainer;
