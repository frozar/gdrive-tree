import { createEffect } from "solid-js";

import NavBar from "./NavBar";
import { store } from "../index";
import { hiddenClass } from "../globalConstant";

const Header = () => {
  let refHeader;
  let timeoutID = null;

  createEffect(() => {
    if (store.isGapiAvailable && store.isSignedIn) {
      timeoutID = setTimeout(() => {
        displayTopBar(refHeader, "hide");
        timeoutID = null;
      }, 300);
    }
  });

  const displayTopBar = (headerElement, action) => {
    if (typeof timeoutID === "number") {
      clearTimeout(timeoutID);
      timeoutID = null;
    }

    const mainElement = document.getElementById("mainContent");
    // const hiddenClass = "header--hidden";

    switch (action) {
      case "show": {
        headerElement.classList.remove(hiddenClass);
        mainElement.classList.remove(hiddenClass);
        break;
      }
      case "hide": {
        if (!(store.isGapiAvailable && store.isSignedIn)) {
          headerElement.classList.remove(hiddenClass);
          mainElement.classList.remove(hiddenClass);
        } else {
          headerElement.classList.add(hiddenClass);
          mainElement.classList.add(hiddenClass);
        }
        break;
      }
      default: {
        console.error(`Unknown action "${action}"`);
        console.trace();
      }
    }
  };

  return (
    <header
      id="topBar"
      ref={refHeader}
      onMouseEnter={(event) => {
        const headerElement = event.currentTarget;
        // showTopBar(headerElement);
        displayTopBar(headerElement, "show");
      }}
      onMouseLeave={(event) => {
        const headerElement = event.currentTarget;
        // hideTopBar(headerElement);
        displayTopBar(headerElement, "hide");
      }}
      class="fixed w-full left-0 top-0 z-10 transition-transform custom-transition-duration"
    >
      <NavBar />
    </header>
  );
};

export default Header;
