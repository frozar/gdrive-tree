// import { unwrap, produce } from "solid-js/store";
import { produce } from "solid-js/store";
import _ from "lodash";

import { store, setStore } from "../../index";

// function getNodePathKeyByPredicat(root, predicat, unwraped) {
//   const nodesToVisit = unwraped ? [unwrap(root)] : [root];

//   const key = [];
//   const nodePath = [];
//   const lengthStack = [nodesToVisit.length];
//   while (0 < nodesToVisit.length && 0 < lengthStack.length) {
//     if (lengthStack.at(-1) <= key.at(-1)) {
//       nodePath.pop();
//       key.pop();
//       lengthStack.pop();
//       if (0 < key.length) {
//         key[key.length - 1]++;
//         continue;
//       } else {
//         break;
//       }
//     }

//     let currentNode = nodesToVisit.pop();
//     nodePath.push(currentNode);

//     if (predicat(currentNode)) {
//       return [nodePath, key];
//     }

//     if (currentNode.subNodes) {
//       lengthStack.push(currentNode.subNodes.length);
//       nodesToVisit.push(...[...currentNode.subNodes].reverse());
//       key.push(0);
//       continue;
//     }

//     nodePath.pop();
//     key[key.length - 1]++;
//   }
//   return null;
// }

// const verboseGetNodePathKeyById = false;

// function getNodePathKeyById(root, id, unwraped) {
//   const res = getNodePathKeyByPredicat(root, (n) => n.id === id, unwraped);

//   if (res) {
//     return res;
//   } else {
//     if (verboseGetNodePathKeyById) {
//       console.error(`Cannot find targetNode with id "${id}"`);
//       console.error("root", root);
//     }
//     return null;
//   }
// }

// // Test of findKey()
// console.log("test [],", getNodePathKeyById({ id: "root" }, "root")[1]);
// console.log(
//   "test [0],",
//   getNodePathKeyById({ id: "root", subNodes: [{ id: "0" }] }, "0")[1]
// );
// console.log("test null,", getNodePathKeyById({ id: "root" }, "0"));
// console.log(
//   "test [1],",
//   getNodePathKeyById({ id: "root", subNodes: [{ id: "0" }, { id: "1" }] }, "1")[1]
// );
// console.log(
//   "test [0, 0]",
//   getNodePathKeyById(
//     { id: "root", subNodes: [{ id: "0", subNodes: [{ id: "00" }] }] },
//     "00"
//   )[1]
// );
// console.log(
//   "test [0, 1],",
//   getNodePathKeyById(
//     {
//       id: "root",
//       subNodes: [{ id: "0", subNodes: [{ id: "00" }, { id: "01" }] }],
//     },
//     "01"
//   )[1]
// );
// console.log(
//   "test [1, 0],",
//   getNodePathKeyById(
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
//   getNodePathKeyById(
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
//   getNodePathKeyById(
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
//   getNodePathKeyById(
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
//   getNodePathKeyById(
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

// const dataSet = {
//   id: "root",
//   subNodes: [
//     {
//       id: "d0",
//       subNodes: [
//         {
//           id: "d00",
//           subNodes: [
//             { id: "d000", subNodes: [{ id: "f0000" }, { id: "f0001" }] },
//             { id: "d001", subNodes: [{ id: "f0010" }, { id: "f0011" }] },
//           ],
//         },
//         { id: "d01", subNodes: [] },
//         { id: "f02" },
//         { id: "f03" },
//       ],
//     },
//     { id: "d1", subNodes: [] },
//   ],
// };
// for (const [targetId, expectedKey, expectedNodePath] of [
//   ["root", [], ["root"]],
//   ["d0", [0], ["root", "d0"]],
//   ["d00", [0, 0], ["root", "d0", "d00"]],
//   ["d000", [0, 0, 0], ["root", "d0", "d00", "d000"]],
//   ["f0000", [0, 0, 0, 0], ["root", "d0", "d00", "d000", "f0000"]],
//   ["f0001", [0, 0, 0, 1], ["root", "d0", "d00", "d000", "f0001"]],
//   ["d001", [0, 0, 1], ["root", "d0", "d00", "d001"]],
//   ["f0010", [0, 0, 1, 0], ["root", "d0", "d00", "d001", "f0010"]],
//   ["f0011", [0, 0, 1, 1], ["root", "d0", "d00", "d001", "f0011"]],
//   ["d01", [0, 1], ["root", "d0", "d01"]],
//   ["f02", [0, 2], ["root", "d0", "f02"]],
//   ["f03", [0, 3], ["root", "d0", "f03"]],
//   ["d1", [1], ["root", "d1"]],
// ]) {
//   const [nodePath, key] = getNodePathKeyById(dataSet, targetId);
//   console.log(
//     "test key [",
//     String(expectedKey),
//     "]",
//     _.isEqual(
//       expectedNodePath,
//       nodePath.map((n) => n.id)
//     ),
//     _.isEqual(expectedKey, key)
//   );
// }

// TODO: big task
// Use a HashSet 'id' -> node to avoid to use a graph to store node
function getNodeById_(nodes, id, unwraped = false) {
  // const rootNode = nodes.rootNode;
  // const res = getNodePathKeyById(rootNode, id, unwraped);
  // if (res === null) {
  //   return null;
  // }

  // const [nodePath, _] = res;
  // return nodePath.pop();

  let res2 = nodes.content[id];
  if (!res2) {
    return null;
  }

  // if (unwraped) {
  //   return unwrap(res2);
  // } else {
  //   return res2;
  // }
  return res2;
}

export function getNodeById(id, unwraped = false) {
  return getNodeById_(store.nodes, id, unwraped);
}

export function getNodePathByNode(node) {
  const nodePath = [node];
  // let currentNode = node.parentNode;
  let currentNode = getNodeById(node.parentNodeId);
  while (currentNode) {
    nodePath.push(currentNode);
    // currentNode = currentNode.parentNode;
    currentNode = getNodeById(currentNode.parentNodeId);
  }
  return nodePath.reverse();
}

function setNodeById_(nodes, id, objUpdatesOrFunctionUpdates) {
  // const rootNode = nodes.rootNode;
  // // const targetNode = getNodeById_(rootNode, id);
  // const targetNode = getNodeById_(nodes, id);

  // if (targetNode === null) {
  //   return;
  // }

  // if (typeof objUpdatesOrFunctionUpdates === "object") {
  //   const objUpdates = objUpdatesOrFunctionUpdates;
  //   for (const [k, v] of Object.entries(objUpdates)) {
  //     targetNode[k] = v;
  //   }
  // }

  // if (typeof objUpdatesOrFunctionUpdates === "function") {
  //   const fUpdates = objUpdatesOrFunctionUpdates;
  //   const newTargetNode = fUpdates(unwrap(targetNode));
  //   for (const key of Object.keys(newTargetNode)) {
  //     targetNode[key] = newTargetNode[key];
  //   }
  // }

  const targetNode = nodes.content[id];
  // console.log("BEG targetNode", targetNode);
  if (!targetNode) {
    console.error(`Cannot find targetNode for id: [${id}]`);
    console.trace();
    return;
  }

  // if (typeof objUpdatesOrFunctionUpdates === "object") {
  //   const objUpdates = objUpdatesOrFunctionUpdates;
  //   console.log("objUpdates", objUpdates);
  //   for (const [k, v] of Object.entries(objUpdates)) {
  //     targetNode[k] = v;
  //   }
  // }

  // if (typeof objUpdatesOrFunctionUpdates === "function") {
  //   const fUpdates = objUpdatesOrFunctionUpdates;
  //   const newTargetNode = fUpdates(unwrap(targetNode));
  //   console.log("newTargetNode", newTargetNode);
  //   for (const key of Object.keys(newTargetNode)) {
  //     targetNode[key] = newTargetNode[key];
  //   }
  // }

  let objUpdates;
  if (typeof objUpdatesOrFunctionUpdates === "object") {
    objUpdates = objUpdatesOrFunctionUpdates;
  }

  if (typeof objUpdatesOrFunctionUpdates === "function") {
    const fUpdates = objUpdatesOrFunctionUpdates;
    // objUpdates = fUpdates(unwrap(targetNode));
    objUpdates = fUpdates(targetNode);
  }

  if (!objUpdates) {
    return;
  }

  // TODO: create a function of equality check between node because
  //       fields like parentNode and subNodes must be handle carefully.
  //       Not possible with the basic isEqual from lodash
  for (const [k, v] of Object.entries(objUpdates)) {
    // if (!_.isEqual(targetNode[k], v)) {
    targetNode[k] = v;
    // }
  }

  // // Deal if subNodes are submitted
  // if (Object.keys(objUpdates).includes("subNodes")) {
  //   // for (const [nodeId, node] of objUpdates["subNodes"]) {
  //   for (const node of objUpdates["subNodes"]) {
  //     // if (!_.isEqual(nodes.content[nodeId], node)) {
  //     nodes.content[node.id] = node;
  //     // }
  //   }
  // }

  // console.log("END targetNode", targetNode);
}

export function setNodesContent(nodes) {
  setStore(
    produce((s) => {
      for (const node of nodes) {
        s.nodes.content[node.id] = node;
      }
    })
  );
}

export function setNodeById(id, objUpdatesOrFunctionUpdates) {
  setStore(
    produce((s) => {
      setNodeById_(s.nodes, id, objUpdatesOrFunctionUpdates);
    })
  );
}

export function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

export function getRicherNode(node, parentNodeId) {
  if (isFolder(node)) {
    return {
      ...node,
      parentNodeId,
      subNodesId: null,
      isExpanded: false,
      height: 0,
    };
  } else {
    return { ...node, parentNodeId };
  }
}

export function getRicherNodes(nodes, parentNodeId) {
  return [...nodes].map((n) => getRicherNode(n, parentNodeId));
}
