import { onMount, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";

import { handleClientLoad, handleClientHotReload } from "./authentification";
import Header from "./Header";
import Main from "./Main";

const defaultStore = {
  isSignedIn: false,
  isSessionInitialised: false,
  userFullName: "",
  userAvatarUrl: "",
  userToken: "",
};

export const [store, setStore] = createStore(defaultStore);

if (import.meta.hot) {
  // HMR code
  import.meta.hot.on("vite:beforeUpdate", () => {
    handleClientHotReload();
  });
}

let isHeaderHidden = false;

function watchMouseMove(event) {
  if (store.isSessionInitialised && store.isSignedIn) {
    const header = document.getElementsByTagName("header").item(0);
    const main = document.getElementsByTagName("main").item(0);
    const hiddenClass = "header--hidden";
    if (isHeaderHidden && event.clientY < 24) {
      header.classList.remove(hiddenClass);
      main.classList.remove(hiddenClass);
      isHeaderHidden = !isHeaderHidden;
    } else if (!isHeaderHidden && 72 < event.clientY) {
      header.classList.add(hiddenClass);
      main.classList.add(hiddenClass);
      isHeaderHidden = !isHeaderHidden;
    }
  }
}

const App = () => {
  // Check if the user is already connected when arriving on the page
  onMount(() => {
    console.log("onMount");
    handleClientLoad();
    // lastScrollY = window.scrollY;
    // window.addEventListener("scroll", watchScroll);
    window.addEventListener("mousemove", watchMouseMove);
  });

  onCleanup(() => {
    console.log("onCleanup");
    // window.removeEventListener("scroll", watchScroll);
    window.removeEventListener("mousemove", watchMouseMove);
  });

  return (
    <>
      <Header />
      <Main />
    </>
  );
};

export default App;
