import { createSignal, createEffect, Show, onMount } from "solid-js";

import { store, setStore } from "../index";
import Tree from "./tree";
import SpinningWheel from "../SpinningWheel";
import { checkHasCredential } from "../checkHasCredential";
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

  const isReady = () => !store.isExternalLibLoaded || store.rootNodes.isLoading;

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
  createEffect(checkHasCredential);

  // Create a derived nodes variables
  const nodes = () => store.rootNodes.content;

  return (
    <Show
      when={
        store.hasCredential &&
        store.rootNodes.isInitialised &&
        !store.rootNodes.isLoading
      }
      fallback={<ShowFilesButton initSwitch={initSwitch} />}
    >
      <Tree isRoot={true} nodes={nodes} name={"root"} />
    </Show>
  );
};

export default TreeContainer;
