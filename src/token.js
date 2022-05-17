import { store, setStore } from "./index";

import { accessTokenField } from "./globalConstant";

export function checkAccessToken(
  accessTokenString,
  responseHandler,
  errorHandler
) {
  if (
    store.isExternalLibLoaded &&
    accessTokenString &&
    JSON.parse(accessTokenString).access_token
  ) {
    const accessTokenObject = JSON.parse(accessTokenString);
    const accessToken = accessTokenObject.access_token;

    const verifyTokenURL =
      "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=";

    fetch(verifyTokenURL + accessToken)
      .then((resp) => resp.json())
      .then(responseHandler)
      .catch(errorHandler);
  }
}

export function getAccessToken() {
  localStorage.getItem(accessTokenField);
}

export function setAccessToken(accessTokenObject) {
  gapi.client.setToken(accessTokenObject);
  localStorage.setItem(accessTokenField, JSON.stringify(accessTokenObject));
  if (!store.hasValidToken) {
    setStore("hasValidToken", true);
  }
}

export function removeAccessToken() {
  localStorage.removeItem(accessTokenField);
  if (store.hasValidToken) {
    setStore("hasValidToken", false);
  }
}
