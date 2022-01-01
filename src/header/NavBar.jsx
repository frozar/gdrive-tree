import LoginButton from "./LoginButton";

const NavBar = () => {
  return (
    <navbar class="navbar bg-base-100 mb-2 shadow-xl">
      <div class="navbar-start">
        <a class="btn btn-ghost normal-case text-xl">GDrive Tree</a>
      </div>
      <div class="navbar-end">
        <LoginButton />
      </div>
    </navbar>
  );
};

export default NavBar;
