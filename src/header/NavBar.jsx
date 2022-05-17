import { createSignal, createEffect } from "solid-js";

import { store } from "../index";
import { removeAccessToken } from "../token";

const NavBar = () => {
  let [buttonStyle, setButtonStyle] = createSignal("btn-disabled");

  createEffect(() => {
    if (store.hasValidToken) {
      setButtonStyle(() => "");
    } else {
      setButtonStyle(() => "btn-disabled");
    }
  });

  function handleClick() {
    google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () =>
      removeAccessToken()
    );
  }

  return (
    <navbar class="navbar bg-base-100 mb-2 shadow-xl">
      <div class="navbar-start">
        <a class="normal-case text-xl">GDrive Tree</a>
      </div>
      <div class="navbar-end">
        <span
          class={`btn ${buttonStyle()} normal-case text-sm`}
          onClick={handleClick}
        >
          Revoke authorisation
        </span>
      </div>
    </navbar>
  );
};

export default NavBar;
