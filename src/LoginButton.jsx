import { store } from "./App";
import { createEffect } from "solid-js";

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  if (typeof gapi !== "undefined") {
    gapi.auth2.getAuthInstance().signIn();
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  if (typeof gapi !== "undefined") {
    gapi.auth2.getAuthInstance().signOut();
  }
}

const LoginButton = () => {
  createEffect(() => {
    console.log(
      "LoginButton Effect store.isSessionInitialised",
      store.isSessionInitialised
    );
    // console.log("LoginButton Effect store.isSignedIn", store.isSignedIn);
  });

  return (
    <>
      <Show
        when={!store.isSessionInitialised}
        fallback={
          <Show
            when={store.isSignedIn}
            fallback={
              <button
                class="btn"
                onClick={handleAuthClick}
                disabled={!store.isSessionInitialised}
              >
                Login
              </button>
            }
          >
            <button
              class="btn"
              onClick={handleSignoutClick}
              disabled={!store.isSessionInitialised}
            >
              <Show when={!store.isSessionInitialised}>
                <div class="lds-hourglass"></div>
              </Show>
              {/* <img src="asset/img/login.png" style="height:30px;"></img> */}
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
          disabled={!store.isSessionInitialised}
        >
          <div class="lds-hourglass"></div>
        </button>
      </Show>
    </>
  );
};

export default LoginButton;
