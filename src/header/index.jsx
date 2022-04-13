import { createEffect } from "solid-js";

import NavBar from "./NavBar";
import { store } from "../index";
import { hiddenClass } from "../globalConstant";

// TODO: deal with credential revocation

const Header = () => {
  let refHeader;
  let timeoutID = null;

  createEffect(() => {
    if (store.isExternalLibLoaded) {
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
        if (!store.isExternalLibLoaded) {
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
        displayTopBar(headerElement, "show");
      }}
      onMouseLeave={(event) => {
        const headerElement = event.currentTarget;
        displayTopBar(headerElement, "hide");
      }}
      class="fixed w-full left-0 top-0 z-10 transition-transform custom-transition-duration"
    >
      <NavBar />
    </header>
  );
};

export default Header;
