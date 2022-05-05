import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { unwrap } from "solid-js/store";

import { getSortedNodesFromDirectory } from "../triggerFilesRequest";
import Tree from "./index";
import {
  setNodeInStoreById,
  getNodeById,
  getParentNodeById,
  getRicherNodes,
  getNodePathById,
  isFolder,
} from "./node";
import {
  findParentElementWithPredicat,
  findChildElementWithPredicat,
} from "./htmlElement";

import SpinningWheel from "../../SpinningWheel";
import { store } from "../../index";

// TODO: use solidjs-icon librairy
const ArrowIcon = ({ id, toggleExpanded }) => {
  const isExpanded = () => {
    const foundNode = getNodeById(store.nodes.rootNode, id);
    if (foundNode) {
      return foundNode.isExpanded;
    } else {
      return false;
    }
  };

  let arrowRef;

  function addClassIfExpanded(isExpanded) {
    if (isExpanded) {
      arrowRef.classList.add("expand-folder");
    } else {
      arrowRef.classList.remove("expand-folder");
    }
  }

  function handleClickArrow() {
    toggleExpanded();
  }

  createEffect(() => {
    addClassIfExpanded(isExpanded());
  });

  onMount(() => {
    arrowRef.addEventListener("click", handleClickArrow);
  });

  onCleanup(() => {
    arrowRef.removeEventListener("click", handleClickArrow);
  });

  return (
    <span ref={arrowRef} class="arrow-container custom-transition-duration">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="16px"
        height="16px"
        viewBox="0 -5 25 30"
        aria-hidden="true"
      >
        <path class="arrow" d="m5 20 10 -10 -10 -10 z"></path>
      </svg>
    </span>
  );
};

async function fetchSubNodes(id, fetchState, setFetchState) {
  if (fetchState() !== "done") {
    try {
      setFetchState("running");
      // TODO : enbedded deeper the call to the getRicherNodes() function
      const nodes = await getSortedNodesFromDirectory(999, "*", id);
      const richerNodes = getRicherNodes(nodes);

      setNodeInStoreById(id, { subNodes: richerNodes });

      setFetchState("done");
    } catch (error) {
      console.error(error);
      setFetchState("failed");
    }
  }
}

const Folder = ({ node, setParentHeight, mustAutofocus }) => {
  const [fetchState, setFetchState] = createSignal("init");
  // const [isMounted, setIsMounted] = createSignal(false);

  // onMount(() => {
  //   if (!isMounted()) {
  //     setIsMounted(true);
  //     console.log("isMounted DONE");
  //   }
  // });

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  function toggleExpanded() {
    console.log("toggleExpanded");
    setNodeInStoreById(node.id, (obj) => ({
      // ...obj,
      isExpanded: !obj.isExpanded,
    }));
    // function getTreeRef(id) {
    //   const parentLi = document.getElementById(id);
    //   if (parentLi === null) {
    //     return null;
    //   }
    //   const childUl = findChildElementWithPredicat(
    //     parentLi,
    //     (element) => element.tagName === "UL"
    //   );
    //   if (childUl === null) {
    //     return null;
    //   }

    //   return childUl.parentElement;
    // }

    // function setNodeHeight(id, toExpand) {
    //   const treeRef = getTreeRef(id);
    //   if (treeRef === null) {
    //     return;
    //   }
    //   // console.log("0 treeRef", treeRef);
    //   const currentElementHeight = treeRef.getBoundingClientRect().height;

    //   setNodeInStoreById(id, (obj) => ({
    //     ...obj,
    //     isExpanded: !obj.isExpanded,
    //     height: toExpand ? currentElementHeight : 0,
    //   }));

    //   return currentElementHeight;
    // }

    // function updateNodeHeight(id, incrementHeight) {
    //   const treeRef = getTreeRef(id);
    //   if (treeRef === null) {
    //     return;
    //   }
    //   // console.log("1 treeRef", treeRef);

    //   setNodeInStoreById(id, (obj) => ({
    //     ...obj,
    //     height: obj.height + incrementHeight,
    //   }));
    // }
    // const isExpanded = unwrap(node.isExpanded);

    // const nodePath = getNodePathById(store.nodes.rootNode, node.id);

    // nodePath.shift();
    // const startNode = nodePath.pop();
    // const startNodeHeight = setNodeHeight(startNode.id, !isExpanded);

    // while (nodePath.length) {
    //   const currentNode = nodePath.pop();
    //   updateNodeHeight(
    //     currentNode.id,
    //     isExpanded ? -startNodeHeight : startNodeHeight
    //   );
    // }
  }

  // const isExpanded = () => {
  //   const foundNode = getNodeById(store.nodes.rootNode, node.id);
  //   if (foundNode) {
  //     return foundNode.isExpanded;
  //   } else {
  //     return false;
  //   }
  // };

  createEffect(() => {
    function getTreeRef(id, verbose) {
      const parentLi = document.getElementById(id);
      if (verbose) {
        console.log("id", id);
        console.log("parentLi", parentLi);
      }
      if (parentLi === null) {
        return null;
      }
      const childUl = findChildElementWithPredicat(
        parentLi,
        (element) => element.tagName === "UL"
      );
      if (verbose) {
        console.log("childUl", childUl);
        if (childUl !== null) {
          console.log("childUl.parentElement", childUl.parentElement);
        }
      }
      if (childUl === null) {
        return null;
      }

      return childUl.parentElement;
    }

    function setNodeHeight(id, toExpand) {
      const treeRef = getTreeRef(id, false);
      // console.log("treeRef", treeRef);
      if (treeRef === null) {
        return null;
      }
      // console.log("0 treeRef", treeRef);
      const currentElementHeight = treeRef.getBoundingClientRect().height;

      let hasUpdated = false;
      const node = getNodeById(store.nodes.rootNode, id);
      if (node.height === 0 && toExpand) {
        setNodeInStoreById(id, { height: currentElementHeight });
        hasUpdated = true;
      } else if (node.height !== 0 && !toExpand) {
        setNodeInStoreById(id, { height: 0 });
        hasUpdated = true;
      }

      return [hasUpdated, currentElementHeight];
    }

    function updateNodeHeight(id, incrementHeight) {
      const treeRef = getTreeRef(id);
      if (treeRef === null) {
        return;
      }
      // console.log("1 treeRef", treeRef);

      setNodeInStoreById(id, (obj) => ({
        // ...obj,
        height: obj.height + incrementHeight,
      }));
    }

    // if (!isMounted()) {
    //   return;
    // }
    // const isExpanded = unwrap(node.isExpanded);

    const nodePath = getNodePathById(store.nodes.rootNode, node.id);
    // console.log(
    //   "nodePath",
    //   nodePath.map((n) => unwrap(n).name)
    // );
    if (!isFolder(nodePath[nodePath.length - 1])) {
      return;
    }

    // console.log("isExpanded", isExpanded());
    nodePath.shift();
    const startNode = nodePath.pop();
    // const startNodeHeight = setNodeHeight(startNode.id, !isExpanded);
    // const startNodeHeight = setNodeHeight(startNode.id, !isExpanded());
    // const res = setNodeHeight(startNode.id, isExpanded());
    // const res = setNodeHeight(startNode.id, startNode.isExpanded);
    const res = setNodeHeight(startNode.id, node.isExpanded);

    // console.log("res", res);
    if (res === null) {
      // console.log("");
      return;
    }

    const [hasUpdated, startNodeHeight] = res;
    if (hasUpdated) {
      while (nodePath.length) {
        const currentNode = nodePath.pop();
        updateNodeHeight(
          currentNode.id,
          // isExpanded ? -startNodeHeight : startNodeHeight
          // isExpanded() ? -startNodeHeight : startNodeHeight
          // isExpanded() ? startNodeHeight : -startNodeHeight
          node.isExpanded ? startNodeHeight : -startNodeHeight
        );
      }
    }
    // console.log("");
  });

  const isParentExpanded = () => {
    const parentNode = getParentNodeById(store.nodes.rootNode, node.id);
    if (parentNode) {
      return parentNode.isExpanded;
    } else {
      return false;
    }
  };

  // Fetch only if the parent tree has been expanded once.
  createEffect(() => {
    if (isParentExpanded()) {
      fetchSubNodes(node.id, fetchState, setFetchState);
    }
  });

  let nameRef;

  function handleClickName(e) {
    // Handle only double click
    if (e.detail === 2) {
      toggleExpanded();
    }
  }

  onMount(() => {
    nameRef.addEventListener("click", handleClickName);
  });

  onCleanup(() => {
    nameRef.removeEventListener("click", handleClickName);
  });

  return (
    <li id={node.id}>
      <span class="folder-surrounding-span">
        <ArrowIcon id={node.id} toggleExpanded={toggleExpanded} />
        <span
          class="selectable"
          tabindex="0"
          autofocus={mustAutofocus}
          ref={nameRef}
        >
          <img
            src={node.iconLink}
            onerror={(event) => {
              const currentImage = event.currentTarget;
              console.info("First image load failed", currentImage.src);

              // To prevent this from being executed over and over
              currentImage.onerror = (event) => {
                const currentImage = event.currentTarget;
                console.error("Second image load failed", currentImage.src);
                currentImage.onerror = null;
                currentImage.src = currentImage.src;
              };

              // Refresh the src attribute, which should make the
              // browsers reload the iamge.
              currentImage.src = currentImage.src;
            }}
          />
          <span
            style={
              fetchState() === "failed"
                ? "margin-left: 4px; margin-right: 2px; color: red"
                : "margin-left: 4px; margin-right: 2px"
            }
            contenteditable="false"
          >
            {node.name}
          </span>
        </span>
        {fetchState() === "running" && <SmallSpinningWheel />}
      </span>
      {fetchState() === "done" && (
        <Tree
          id={node.id}
          setParentHeight={setParentHeight}
          // treeRef={treeRef}
        />
      )}
    </li>
  );
};

export default Folder;
