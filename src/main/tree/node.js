// TODO : use pop() instead of shift() -> reverse the use of the data structure.
// TODO : to delete
function findKeyByPredicatRecur(nodes, predicat, key) {
  for (const indexNode in nodes) {
    const nbIndexNode = Number(indexNode);
    key.push(nbIndexNode);
    const n = nodes[nbIndexNode];

    if (predicat(n)) {
      return key;
    }

    if (n.subNodes) {
      const res = findKeyByPredicatRecur(n.subNodes, predicat, key);
      if (res) {
        return res;
      }
    }
    key.pop();
  }
}

// TODO : use pop() instead of shift() -> reverse the use of the data structure.
function findKeyByPredicatImpe(nodes, predicat) {
  const nodesToVisit = [...nodes];

  const key = [0];
  const lengthStack = [nodesToVisit.length];
  while (0 < nodesToVisit.length && 0 < lengthStack.length) {
    if (lengthStack[0] <= key[0]) {
      key.shift();
      lengthStack.shift();
      key[0]++;
      continue;
    }

    let currentNode = nodesToVisit.shift();

    if (predicat(currentNode)) {
      return key.reverse();
    }

    if (currentNode.subNodes) {
      lengthStack.splice(0, 0, currentNode.subNodes.length);
      nodesToVisit.splice(0, 0, ...currentNode.subNodes);
      key.splice(0, 0, 0);
      continue;
    }
    key[0]++;
  }
}

// TODO : to delete
function findKeyById_(nodes, id) {
  const res = findKeyByPredicatRecur(nodes, (n) => n.id === id, []);
  if (res) {
    return res;
  } else {
    return new Error(`Cannot find targetNode "${id}"`);
  }
}

function findKeyById(nodes, id) {
  const res = findKeyByPredicatImpe(nodes, (n) => n.id === id);
  if (res) {
    return res;
  } else {
    return new Error(`Cannot find targetNode "${id}"`);
  }
}

// // Test of findKey()
// console.log("test [0],", findKeyByIdImpe([{ id: "0" }], "0"));
// console.log("test [1],", findKeyByIdImpe([{ id: "0" }, { id: "1" }], "1"));
// console.log(
//   "test [0, 0],",
//   findKeyByIdImpe([{ id: "0", subNodes: [{ id: "00" }] }], "00")
// );
// console.log(
//   "test [0, 1],",
//   findKeyByIdImpe([{ id: "0", subNodes: [{ id: "00" }, { id: "01" }] }], "01")
// );
// console.log(
//   "test [1, 0],",
//   findKeyByIdImpe(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "10"
//   )
// );
// console.log(
//   "test Error,",
//   findKeyByIdImpe(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "12"
//   )
// );
// console.log(
//   "test [0, 1],",
//   findKeyByIdImpe(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }] },
//       { id: "2" },
//     ],
//     "01"
//   )
// );
// console.log(
//   "test [1, 0],",
//   findKeyByIdImpe(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }] },
//       { id: "2" },
//     ],
//     "10"
//   )
// );
// console.log(
//   "test [2],",
//   findKeyByIdImpe(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }] },
//       { id: "2" },
//     ],
//     "2"
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
