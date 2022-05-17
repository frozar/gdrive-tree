import { createEffect, Show, onMount } from "solid-js";

import Tree from "./tree";
import { triggerFilesRequest } from "./triggerFilesRequest";
import { store } from "../index";
import {
  checkAccessToken,
  removeAccessToken,
  setAccessToken,
  getAccessToken,
} from "../token";
import SpinningWheel from "../SpinningWheel";
import { rootId } from "../globalConstant";

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

  const isReady = () => !store.isExternalLibLoaded || store.nodes.isLoading;

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
  const isReady = () => {
    return (
      store.hasValidToken && store.nodes.isInitialised && !store.nodes.isLoading
    );
  };

  createEffect(async () => {
    const accessTokenString = getAccessToken();

    function responseHandler(data) {
      if (data.error) {
        removeAccessToken();
      } else {
        setAccessToken(accessTokenObject);

        triggerFilesRequest(initSwitch);
      }
    }

    function errorHandler(error) {
      console.error(error);
      removeAccessToken();
    }

    checkAccessToken(accessTokenString, responseHandler, errorHandler);
  });

  return (
    <Show
      when={isReady()}
      fallback={<ShowFilesButton initSwitch={initSwitch} />}
    >
      <Tree id={rootId} />
    </Show>
  );
};

export default TreeContainer;
