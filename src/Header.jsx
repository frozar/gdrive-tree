import NavBar from "./NavBar";

const Header = () => {
  return (
    <header
      class="fixed w-full left-0 top-0 z-10 transition-transform"
      style="transition-duration: 300ms;"
    >
      <NavBar />
    </header>
  );
};

export default Header;
