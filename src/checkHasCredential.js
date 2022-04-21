import { store, setStore } from "./index";

export function checkHasCredential() {
  // WARNING: this if to check the store.rootNodes.isLoading signal is necessary to
  //          trigger the run of this effect when the load is done
  store.rootNodes.isLoading;
  store.rootNodes.isInitialised;
  if (store.isExternalLibLoaded) {
    const newHasCredential = gapi.client.getToken() !== null;
    if (store.hasCredential !== newHasCredential) {
      setStore("hasCredential", () => newHasCredential);
    }
  }
}
