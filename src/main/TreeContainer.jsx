import { createSignal, createEffect, Show, onMount } from "solid-js";

import { store, setStore } from "../index";
import Tree from "./tree";
import SpinningWheel from "../SpinningWheel";
import { triggerFilesRequest } from "./triggerFilesRequest";

const ShowFilesButton = ({
  initSwitch,
  nodes,
  setNodes,
  setIsNodesInitialised,
  isLoading,
  setIsLoading,
}) => {
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

  const isReady = () => !store.isInitialised || isLoading();

  return (
    <Show
      when={isReady()}
      fallback={
        <Container>
          <button
            class="btn"
            onClick={() =>
              triggerFilesRequest(
                initSwitch,
                nodes,
                setNodes,
                setIsNodesInitialised,
                setIsLoading
              )
            }
          >
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

const TreeContainer = ({
  initSwitch,
  nodes,
  setNodes,
  isNodesInitialised,
  setIsNodesInitialised,
  isLoading,
  setIsLoading,
}) => {
  const [hasCredenital, setHasCredenital] = createSignal(false);

  // createEffect(() => {
  //   console.log("TreeContainer nodes()", nodes());
  // });
  createEffect(() => {
    // console.log("hasCredenital()", hasCredenital());
    // console.log("isNodesInitialised()", isNodesInitialised());
    // WARNING: this if to check the isLoading signal is necessary to
    //          trigger the run of this effect when the load is done
    if (!isLoading()) {
      // console.log("store.main.isLoading", store.main.isLoading);
      // if (!store.main.isLoading) {
      console.info(
        "File loading from google drive is done (or component has just render)"
      );
    }
    if (store.isInitialised) {
      setHasCredenital(gapi.client.getToken() !== null);
    }
  });

  return (
    <Show
      when={hasCredenital() && isNodesInitialised() && !isLoading()}
      fallback={
        <ShowFilesButton
          initSwitch={initSwitch}
          nodes={nodes}
          setNodes={setNodes}
          setIsNodesInitialised={setIsNodesInitialised}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      }
    >
      <Tree isRoot={true} nodes={nodes} name={"root"} />
    </Show>
  );
};

export default TreeContainer;
