import jwt_decode from "jwt-decode";
import { jwt_key } from "./globalConstant";
import { setStore } from "./index";

function handleCredentialResponse(response) {
  console.log("handleCredentialResponse: Is signed in");
  setStore("isSignedIn", () => true);
  // console.log("Encoded JWT ID token: " + response.credential);

  // localStorage.setItem(jwt_key, response.credential);
  const accountDetails = jwt_decode(response.credential);
  // console.log("accountDetails", accountDetails);

  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large" } // customization attributes
  );
}

function saveCredential(credential) {
  console.log("saveCredential credential", credential);
}

window.onload = function () {
  google.accounts.id.initialize({
    // client_id:
    //   "368874607594-nvsbjbq932pdvgcegs4qsuhh46ni7jo7.apps.googleusercontent.com",
    client_id: import.meta.env.VITE_CLIENT_ID,
    auto_select: true,
    callback: handleCredentialResponse,
    native_callback: saveCredential,
  });

  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large" } // customization attributes
  );

  google.accounts.id.prompt((notification) => {
    // console.log("arguments", arguments);
    // console.dir(notification);
    // console.log(
    //   "notification.isDisplayMoment()",
    //   notification.isDisplayMoment()
    // );
    // console.log("notification.isDisplayed()", notification.isDisplayed());
    // console.log("notification.isNotDisplayed()", notification.isNotDisplayed());
    // console.log(
    //   "notification.isSkippedMoment()",
    //   notification.isSkippedMoment()
    // );
    // console.log(
    //   "notification.isDismissedMoment()",
    //   notification.isDismissedMoment()
    // );

    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // continue with another identity provider.
    }
  }); // also display the One Tap dialog
};
