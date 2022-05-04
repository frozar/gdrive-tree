import { unwrap, produce } from "solid-js/store";

import { setStore } from "../../index";

function getNodePathKeyByPredicat(root, predicat) {
  const nodesToVisit = [{ ...root }];

  const key = [];
  const nodePath = [];
  const lengthStack = [nodesToVisit.length];
  while (0 < nodesToVisit.length && 0 < lengthStack.length) {
    let currentNode = nodesToVisit.pop();
    nodePath.push(currentNode);

    if (predicat(currentNode)) {
      return [nodePath, key];
    }

    if (currentNode.subNodes) {
      lengthStack.push(currentNode.subNodes.length);
      nodesToVisit.push(...[...currentNode.subNodes].reverse());
      key.push(0);
      continue;
    }

    nodePath.pop();
    key[key.length - 1]++;

    if (lengthStack.at(-1) <= key.at(-1)) {
      nodePath.pop();
      key.pop();
      lengthStack.pop();
      if (0 < key.length) {
        key[key.length - 1]++;
        continue;
      } else {
        break;
      }
    }
  }
  return null;
}

function getNodePathKeyById(root, id) {
  const res = getNodePathKeyByPredicat(root, (n) => n.id === id);

  if (res) {
    return res;
  } else {
    console.log("root", root);
    console.log("id", id);
    return new Error(`Cannot find targetNode "${id}"`);
  }
}

// // Test of findKey()
// console.log("test [],", findNodesKeyById({ id: "root" }, "root")[1]);
// console.log(
//   "test [0],",
//   findNodesKeyById({ id: "root", subNodes: [{ id: "0" }] }, "0")[1]
// );
// console.log("test null,", findNodesKeyById({ id: "root" }, "0"));
// console.log(
//   "test [1],",
//   findNodesKeyById({ id: "root", subNodes: [{ id: "0" }, { id: "1" }] }, "1")[1]
// );
// console.log(
//   "test [0, 0]",
//   findNodesKeyById(
//     { id: "root", subNodes: [{ id: "0", subNodes: [{ id: "00" }] }] },
//     "00"
//   )[1]
// );
// console.log(
//   "test [0, 1],",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [{ id: "0", subNodes: [{ id: "00" }, { id: "01" }] }],
//     },
//     "01"
//   )[1]
// );
// console.log(
//   "test [1, 0],",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [
//         { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//         { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//       ],
//     },
//     "10"
//   )[1]
// );
// console.log(
//   "test Error,",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [
//         { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//         { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//       ],
//     },
//     "12"
//   )
// );
// console.log(
//   "test [0, 1],",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [
//         { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//         { id: "1", subNodes: [{ id: "10" }] },
//         { id: "2" },
//       ],
//     },
//     "01"
//   )[1]
// );
// console.log(
//   "test [1, 0],",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [
//         { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//         { id: "1", subNodes: [{ id: "10" }] },
//         { id: "2" },
//       ],
//     },
//     "10"
//   )[1]
// );
// console.log(
//   "test [2],",
//   findNodesKeyById(
//     {
//       id: "root",
//       subNodes: [
//         { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//         { id: "1", subNodes: [{ id: "10" }] },
//         { id: "2" },
//       ],
//     },
//     "2"
//   )[1]
// );

function itereOverNodes(rootNode, key) {
  let targetNode = { ...rootNode };
  for (const k of key) {
    targetNode = targetNode.subNodes[k];
  }
  return targetNode;
}

export function getNodePathById(rootNode, id) {
  const [nodePath, _] = getNodePathKeyById(rootNode, id);
  return nodePath;
}

export function getNodeById(rootNode, id) {
  const [nodePath, _] = getNodePathKeyById(rootNode, id);
  return nodePath.pop();
}

export function getParentNodeById(rootNode, id) {
  const [nodePath, _] = getNodePathKeyById(rootNode, id);
  nodePath.pop();

  if (nodePath.length === 0) {
    return null;
  } else {
    return nodePath.pop();
  }
}

function setNodeById(rootNode, id, objUpdatesOrFunctionUpdates) {
  let targetNode = getNodeById(rootNode, id);
  if (targetNode) {
    // console.log(
    //   "typeof objUpdatesOrFunctionUpdates",
    //   typeof objUpdatesOrFunctionUpdates
    // );
    if (typeof objUpdatesOrFunctionUpdates === "object") {
      const objUpdates = objUpdatesOrFunctionUpdates;
      for (const [k, v] of Object.entries(objUpdates)) {
        targetNode[k] = v;
      }
    }

    if (typeof objUpdatesOrFunctionUpdates === "function") {
      const fUpdates = objUpdatesOrFunctionUpdates;
      const newTargetNode = fUpdates(unwrap(targetNode));
      for (const key of Object.keys(newTargetNode)) {
        targetNode[key] = newTargetNode[key];
      }
    }
  }
}

export function setNodeInStoreById(id, objUpdatesOrFunctionUpdates) {
  setStore(
    produce((s) => {
      setNodeById(s.nodes.rootNode, id, objUpdatesOrFunctionUpdates);
    })
  );
}

export function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

export function getRicherNodes(nodes) {
  return [...nodes].map((n) => {
    if (isFolder(n)) {
      return { ...n, subNodes: null, isExpanded: false };
    } else {
      return { ...n };
    }
  });
}
