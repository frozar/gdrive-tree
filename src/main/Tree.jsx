import { createSignal, createEffect, Show } from "solid-js";
import _ from "lodash";
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
  // if (store.isSignedIn) {
  return await gapi.client.drive.files.list(buildFilesListArg(args));
  // } else {
  //   return [];
  // }
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

const Tree = (props) => {
  // console.log("Tree props", props);
  const { initSwitch } = props;
  // console.log("Tree initSwitch", initSwitch);

  // const [nodes, setNodes] = createSignal([]);
  // createEffect(() => {
  //   console.log("Tree createEffect");
  //   if (store.isSignedIn) {
  //     switch (initSwitch) {
  //       case "drive":
  //         // setNodes(async (nodes) => await initNodesFromRoot());
  //         break;
  //       case "share":
  //         setNodes(async (nodes) => await initSharedNodes());
  //         break;
  //       case "every":
  //         setNodes(async (nodes) => await initEveryNodes());
  //         break;
  //       default:
  //         console.error(`initSwitch "${initSwitch}" is not handled.`);
  //     }
  //   }
  //   console.log("Tree nodes", nodes());
  // });

  const [loading, setLoading] = createSignal(true);

  // const nodes = async () => {
  //   setLoading(true);
  //   console.log("Tree Derived signal store.isSignedIn", store.isSignedIn);
  //   if (store.isSignedIn) {
  //     const newNodes = await initNodesFromRoot();
  //     console.log("newNodes", newNodes);
  //     setLoading(false);
  //     return newNodes;
  //   } else {
  //     setLoading(false);
  //     return [];
  //   }
  // };
  const [nodes, setNodes] = createSignal([]);

  createEffect(async () => {
    console.log("Tree createEffect store.isSignedIn", store.isSignedIn);
    if (store.isSignedIn) {
      const newNodes = await initNodesFromRoot();
      // console.log("newNodes", newNodes);
      if (!_.isEqual(nodes(), newNodes)) {
        setNodes(newNodes);
      }
      // setLoading(false);
      // return newNodes;
    }
    // else {
    //   const newNodes = [];
    //   if (!_.isEqual(nodes(), newNodes)) {
    //     setNodes(newNodes);
    //   }
    //   // setLoading(false);
    //   // return [];
    // }
  });

  // return <h1>TREE</h1>;
  // return <h1>{nodes()}</h1>;
  // return (
  //   <ul>
  //     <For each={nodes()}>{(node, i) => <li>{node.name}</li>}</For>
  //   </ul>
  // );
  return (
    <Show
      when={!(store.isInitialising || store.isLogging)}
      fallback={<h1>Loading</h1>}
    >
      <Show when={store.isSignedIn} fallback={<h1>Not Sign In</h1>}>
        <>
          <h1>Everything</h1>
          <ul>
            <For each={nodes()}>{(node, i) => <li>{node.name}</li>}</For>
          </ul>
        </>
      </Show>
    </Show>
  );
};

export default Tree;
