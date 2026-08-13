import Logo from "./Logo.jsx";
import Button from "./Button.jsx";

export default function AuthNavbar({ current }) {
  return (
    <nav className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-6 md:px-12">
      <Logo variant="dark" />
      <div className="flex items-center gap-2.5">
        <Button to="/" variant="ghost-dark" className="hidden sm:inline-flex">
          Back to website
        </Button>
        {current === "login" ? (
          <Button to="/register" variant="lime">Create account</Button>
        ) : (
          <Button to="/login" variant="outline">Log in</Button>
        )}
      </div>
    </nav>
  );
}
