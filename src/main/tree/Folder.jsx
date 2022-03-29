import { createSignal, createEffect } from "solid-js";

import { getSortedNodesFromDirectory } from "../triggerFilesRequest";
import Tree from "./index";
import SpinningWheel from "../../SpinningWheel";

const ArrowIcon = (props) => {
  const { isExpanded, setIsExpanded, toggleExpanded } = props;

  return (
    <span
      class="arrow-container custom-transition-duration"
      onClick={async (event) => {
        const { currentTarget } = event;
        toggleExpanded();
        if (isExpanded()) {
          currentTarget.classList.add("expand-folder");
        } else {
          currentTarget.classList.remove("expand-folder");
        }
      }}
    >
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

async function fetchSubNodes(id, fetchState, setFetchState, setSubNodes) {
  if (fetchState() !== "done") {
    try {
      setFetchState("running");
      const nodes = await getSortedNodesFromDirectory(999, "*", id);
      setSubNodes(nodes);
      setFetchState("done");
    } catch (error) {
      console.error(error);
      setFetchState("failed");
    }
  }
}

const Folder = (props) => {
  const { node, setParentHeight, isParentExpanded } = props;
  const { id, name } = node;

  const [isExpanded, setIsExpanded] = createSignal(false);
  const [subNodes, setSubNodes] = createSignal([]);
  const [fetchState, setFetchState] = createSignal("init");

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  function toggleExpanded() {
    setIsExpanded((isExpanded) => !isExpanded);
  }

  // Fetch only if the parent tree has been expanded once.
  createEffect(() => {
    if (isParentExpanded()) {
      fetchSubNodes(id, fetchState, setFetchState, setSubNodes);
    }
  });

  return (
    <li id={node.id}>
      <span class="folder-surrounding-span">
        <ArrowIcon
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          toggleExpanded={toggleExpanded}
        />
        <span
          class="selectable"
          tabindex="0"
          onClick={(e) => {
            // Handle only double click
            if (e.detail === 2) {
              toggleExpanded();
            }
          }}
        >
          <img
            src={node.iconLink}
            onerror={(event) => {
              const currentImage = event.currentTarget;
              console.info("First image load failed", currentImage.src);
              // console.log("event", event);

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
            style="margin-left: 4px; margin-right: 2px"
            contenteditable="false"
          >
            {name}
          </span>
        </span>
        {fetchState() === "running" && <SmallSpinningWheel />}
      </span>
      {fetchState() === "done" && (
        <Tree
          isRoot={false}
          nodes={subNodes}
          isExpanded={isExpanded}
          setParentHeight={setParentHeight}
          name={name}
        />
      )}
    </li>
  );
};

export default Folder;
