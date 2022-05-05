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
import { findChildElementWithPredicat } from "./htmlElement";

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

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  function toggleExpanded() {
    setNodeInStoreById(node.id, (obj) => ({
      isExpanded: !obj.isExpanded,
    }));
  }

  createEffect(() => {
    const verbose = false;
    function getTreeRef(id) {
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
      const treeRef = getTreeRef(id);
      if (treeRef === null) {
        return null;
      }
      const currentElementHeight = treeRef.getBoundingClientRect().height;
      // The 'heightOffset' gives enough space to avoid the focus border
      // to be cropped on the last element of a folder.
      const heightOffset = 3;
      const heightToSet = currentElementHeight + heightOffset;

      let hasUpdated = false;
      const node = getNodeById(store.nodes.rootNode, id);
      if (node.height === 0 && toExpand) {
        setNodeInStoreById(id, { height: heightToSet });
        hasUpdated = true;
      } else if (node.height !== 0 && !toExpand) {
        setNodeInStoreById(id, { height: 0 });
        hasUpdated = true;
      }

      return [hasUpdated, heightToSet];
    }

    function updateNodeHeight(id, incrementHeight) {
      const treeRef = getTreeRef(id);
      if (treeRef === null) {
        return;
      }

      setNodeInStoreById(id, (obj) => ({
        height: obj.height + incrementHeight,
      }));
    }

    const nodePath = getNodePathById(store.nodes.rootNode, node.id);
    if (!isFolder(nodePath[nodePath.length - 1])) {
      return;
    }

    nodePath.shift();
    const startNode = nodePath.pop();
    const res = setNodeHeight(startNode.id, node.isExpanded);

    if (res === null) {
      return;
    }

    const [hasUpdated, startNodeHeight] = res;
    if (hasUpdated) {
      while (nodePath.length) {
        const currentNode = nodePath.pop();
        updateNodeHeight(
          currentNode.id,
          node.isExpanded ? startNodeHeight : -startNodeHeight
        );
      }
    }
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
    <li id={node.id} class="pt-1">
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
        <Tree id={node.id} setParentHeight={setParentHeight} />
      )}
    </li>
  );
};

export default Folder;
