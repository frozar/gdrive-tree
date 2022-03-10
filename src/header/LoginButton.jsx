import { createEffect } from "solid-js";

import { store, setStore } from "../index";
import { updateCurrentUser } from "../authentification";

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  console.log("BEGIN handleAuthClick");
  try {
    setStore("isLogging", () => true);
    gapi.auth2
      .getAuthInstance()
      .signIn()
      .then((currentUser) => {
        console.log("signIn promise user", currentUser);
        updateCurrentUser(currentUser);
      })
      .catch((error) => {
        console.error("signIn promise error", error);
        setStore("isLogging", () => false);
      });
    // setStore("isSignedIn", () => true);
    console.log("Signed in: DONE");
  } catch (error) {
    console.error(error);
    console.error("Signed in: FAILURE");
    // setStore("isSignedIn", () => false);
  }
  console.log("END   handleAuthClick");
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  console.log("BEGIN handleSignoutClick");
  setStore("isLogging", () => true);
  gapi.auth2.getAuthInstance().signOut();
  // setStore("isSignedIn", () => false);
  console.log("END   handleSignoutClick");
}

const LoginButton = () => {
  // createEffect(() => {
  //   console.log(
  //     "LoginButton Effect store.isGapiAvailable",
  //     store.isGapiAvailable
  //   );
  //   // console.log("LoginButton Effect store.isSignedIn", store.isSignedIn);
  // });

  return (
    // <Show
    //   when={!store.isGapiAvailable}
    //   fallback={
    //     <Show
    //       when={store.isSignedIn}
    //       fallback={
    //         <button
    //           class="btn"
    //           onClick={handleAuthClick}
    //           disabled={!store.isGapiAvailable}
    //         >
    //           Login
    //         </button>
    //       }
    //     >
    //       <button
    //         class="btn"
    //         onClick={handleSignoutClick}
    //         disabled={!store.isGapiAvailable}
    //       >
    //         <Show when={!store.isGapiAvailable}>
    //           <div class="lds-hourglass"></div>
    //         </Show>
    //         <img
    //           class="avatar"
    //           src={store.userAvatarUrl + "?access_token=" + store.userToken}
    //           style="height:30px;margin-right:10px;"
    //         ></img>
    //         {store.userFullName}
    //       </button>
    //     </Show>
    //   }
    // >
    //   <button
    //     class="btn"
    //     onClick={handleAuthClick}
    //     disabled={!store.isGapiAvailable}
    //   >
    //     <div class="lds-hourglass"></div>
    //   </button>
    // </Show>
    <Show
      when={store.isInitialising}
      fallback={
        <Show
          when={store.isSignedIn}
          fallback={
            <Show
              when={store.isLogging}
              fallback={
                <button
                  class="btn"
                  onClick={handleAuthClick}
                  disabled={store.isLogging}
                >
                  Login
                </button>
              }
            >
              <button
                class="btn"
                onClick={handleAuthClick}
                disabled={store.isLogging}
              >
                <div class="lds-hourglass"></div>
              </button>
            </Show>
          }
        >
          <button
            class="btn"
            onClick={handleSignoutClick}
            disabled={store.isLogging}
          >
            <img
              class="avatar"
              src={store.userAvatarUrl + "?access_token=" + store.userToken}
              style="height:30px;margin-right:10px;"
            ></img>
            {store.userFullName}
          </button>
        </Show>
      }
    >
      <button
        class="btn"
        onClick={handleAuthClick}
        disabled={store.isInitialising}
      >
        <div class="lds-hourglass"></div>
      </button>
    </Show>
  );
};

export default LoginButton;
