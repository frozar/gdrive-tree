import { onMount, onCleanup } from "solid-js";

import Header from "./header";
import Main from "./main";
import { store } from "./index";

let isHeaderHidden = false;

function watchMouseMove(event) {
  if (store.isGapiAvailable && store.isSignedIn) {
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
    window.addEventListener("mousemove", watchMouseMove);
  });

  onCleanup(() => {
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
