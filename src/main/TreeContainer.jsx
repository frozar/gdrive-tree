import { createSignal, createEffect, Show, onMount } from "solid-js";

import { store, setStore } from "../index";
import Tree from "./tree";
import SpinningWheel from "../SpinningWheel";
import { triggerFilesRequest } from "./triggerFilesRequest";

const ShowFilesButton = ({ initSwitch }) => {
  onMount(() => {
    const htmlElement = document.getElementsByTagName("html")[0];
    const bodyElement = document.getElementsByTagName("body")[0];
    const appElement = document.getElementById("app");
    const mainElement = document.getElementById("mainContent");
    htmlElement.style.height = "100%";
    bodyElement.style.height = "100%";
    appElement.style.height = "100%";
    mainElement.style.height = "100%";
  });

  const BigSpinningWheel = () => {
    return <SpinningWheel size="big" />;
  };

  const Container = (props) => {
    return <div id="show-files-button-container">{props.children}</div>;
  };

  const isReady = () => !store.isExternalLibLoaded || store.isRootNodesLoading;

  return (
    <Show
      when={isReady()}
      fallback={
        <Container>
          <button class="btn" onClick={() => triggerFilesRequest(initSwitch)}>
            Show Files
          </button>
        </Container>
      }
    >
      <Container>
        <button class="btn" disabled={isReady()}>
          <BigSpinningWheel />
        </button>
      </Container>
    </Show>
  );
};

const TreeContainer = ({ initSwitch }) => {
  const [hasCredential, setHasCredential] = createSignal(false);

  createEffect(() => {
    // WARNING: this if to check the isRootNodesLoading signal is necessary to
    //          trigger the run of this effect when the load is done
    store.isRootNodesLoading;
    if (store.isExternalLibLoaded) {
      const newHasCredential = gapi.client.getToken() !== null;
      if (hasCredential() !== newHasCredential) {
        setHasCredential(newHasCredential);
      }
    }
  });

  // Create a derived nodes variables
  const nodes = () => store.rootNodes;

  return (
    <Show
      when={
        hasCredential() &&
        store.isRootNodesInitialised &&
        !store.isRootNodesLoading
      }
      fallback={<ShowFilesButton initSwitch={initSwitch} />}
    >
      <Tree isRoot={true} nodes={nodes} name={"root"} />
    </Show>
  );
};

export default TreeContainer;
