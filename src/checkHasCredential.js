import { store, setStore } from "./index";

export function checkHasCredential() {
  // WARNING: this if to check the store.nodes.isLoading signal is necessary to
  //          trigger the run of this effect when the load is done
  store.nodes.isLoading;
  store.nodes.isInitialised;
  if (store.isExternalLibLoaded) {
    const newHasCredential = gapi.client.getToken() !== null;
    if (store.hasCredential !== newHasCredential) {
      setStore("hasCredential", () => newHasCredential);
    }
  }
}
