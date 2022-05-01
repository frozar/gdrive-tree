function findKeyByPredicat(nodes, predicat, key) {
  for (const indexNode in nodes) {
    const nbIndexNode = Number(indexNode);
    key.push(nbIndexNode);
    const n = nodes[nbIndexNode];

    if (predicat(n)) {
      return key;
    }

    if (n.subNodes) {
      const res = findKeyByPredicat(n.subNodes, predicat, key);
      if (res) {
        return res;
      }
    }
    key.pop();
  }
}

function findKeyById(nodes, id) {
  const res = findKeyByPredicat(nodes, (n) => n.id === id, []);
  if (res) {
    return res;
  } else {
    return new Error(`Cannot find targetNode "${id}"`);
  }
}

// Test of findKey()
// console.log("test [0],", findKey([{ id: "0" }], "0"));
// console.log("test [1],", findKey([{ id: "0" }, { id: "1" }], "1"));
// console.log(
//   "test [0, 0],",
//   findKey([{ id: "0", subNodes: [{ id: "00" }] }], "00")
// );
// console.log(
//   "test [0, 1],",
//   findKey([{ id: "0", subNodes: [{ id: "00" }, { id: "01" }] }], "01")
// );
// console.log(
//   "test [1, 0],",
//   findKey(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "10"
//   )
// );
// console.log(
//   "test null,",
//   findKey(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "12"
//   )
// );

export function getNodeById(rootNode, id) {
  const key = findKeyById(rootNode.subNodes, id);
  // console.log("key", key);

  let targetNode = { ...rootNode };
  for (const k of key) {
    targetNode = targetNode.subNodes[k];
  }
  return targetNode;
}

export function setNodeById(rootNode, id, updates) {
  let targetNode = getNodeById(rootNode, id);
  if (targetNode) {
    for (const [k, v] of Object.entries(updates)) {
      targetNode[k] = v;
    }

    // console.log("targetNode", targetNode);
  }
}

export function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

export function getRicherNodes(nodes) {
  return [...nodes].map((n) => {
    if (isFolder(n)) {
      return { ...n, subNodes: undefined, isExpanded: false };
    } else {
      return { ...n };
    }
  });
}