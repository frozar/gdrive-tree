function findKeyByPredicat(nodes, predicat) {
  const nodesToVisit = [...nodes].reverse();

  const key = [0];
  const lengthStack = [nodesToVisit.length];
  while (0 < nodesToVisit.length && 0 < lengthStack.length) {
    if (lengthStack.at(-1) <= key.at(-1)) {
      key.pop();
      lengthStack.pop();
      key[key.length - 1]++;
      continue;
    }

    let currentNode = nodesToVisit.pop();

    if (predicat(currentNode)) {
      return key;
    }

    if (currentNode.subNodes) {
      lengthStack.push(currentNode.subNodes.length);
      nodesToVisit.push(...[...currentNode.subNodes].reverse());
      key.push(0);
      continue;
    }
    key[key.length - 1]++;
  }
}

function findKeyById(nodes, id) {
  const res = findKeyByPredicat(nodes, (n) => n.id === id);
  if (res) {
    return res;
  } else {
    return new Error(`Cannot find targetNode "${id}"`);
  }
}

// // Test of findKey()
// console.log("test [0],", findKeyById([{ id: "0" }], "0"));
// console.log("test [1],", findKeyById([{ id: "0" }, { id: "1" }], "1"));
// console.log(
//   "test [0, 0],",
//   findKeyById([{ id: "0", subNodes: [{ id: "00" }] }], "00")
// );
// console.log(
//   "test [0, 1],",
//   findKeyById([{ id: "0", subNodes: [{ id: "00" }, { id: "01" }] }], "01")
// );
// console.log(
//   "test [1, 0],",
//   findKeyById(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "10"
//   )
// );
// console.log(
//   "test Error,",
//   findKeyById(
//     [
//       { id: "0", subNodes: [{ id: "00" }, { id: "01" }] },
//       { id: "1", subNodes: [{ id: "10" }, { id: "11" }] },
//     ],
//     "12"
//   )
// );
// console.log(
//   "test [0, 1],",
//   findKeyById(
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
//   findKeyById(
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
//   findKeyById(
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
  }
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
