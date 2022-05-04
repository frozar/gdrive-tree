import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

import { getSortedNodesFromDirectory } from "../triggerFilesRequest";
import Tree from "./index";
import {
  setNodeInStoreById,
  getNodeById,
  getParentNodeById,
  getRicherNodes,
} from "./node";
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
      ...obj,
      isExpanded: !obj.isExpanded,
    }));
  }

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
        <Tree id={node.id} setParentHeight={setParentHeight} />
      )}
    </li>
  );
};

export default Folder;
