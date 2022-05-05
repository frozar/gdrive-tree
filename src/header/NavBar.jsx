import { createSignal, createEffect } from "solid-js";

import { store, setStore } from "../index";
import { checkHasCredential } from "../checkHasCredential";

const NavBar = () => {
  let [buttonStyle, setButtonStyle] = createSignal("btn-disabled");

  createEffect(checkHasCredential);

  createEffect(() => {
    if (store.hasCredential) {
      setButtonStyle(() => "");
    } else {
      setButtonStyle(() => "btn-disabled");
    }
  });

  function handleClick() {
    google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () =>
      setStore("hasCredential", () => false)
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
