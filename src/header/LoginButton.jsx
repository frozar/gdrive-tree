import { store, setStore } from "../index";
import { updateCurrentUser } from "../authentification";

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  // console.info("BEG handleAuthClick");
  setStore("isLogging", () => true);
  gapi.auth2
    .getAuthInstance()
    .signIn()
    .then((currentUser) => {
      setStore("isSignedIn", () => true);
      updateCurrentUser(currentUser);
    })
    .catch((error) => {
      console.error(error);
      setStore("isLogging", () => false);
      setStore("isSignedIn", () => false);
    });
  console.info("Signed in: DONE");
  // console.info("END   handleAuthClick");
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  // console.info("BEG handleSignoutClick");
  setStore("isLogging", () => true);
  gapi.auth2.getAuthInstance().signOut();
  // console.info("END   handleSignoutClick");
}

const LoginButton = () => {
  return (
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
