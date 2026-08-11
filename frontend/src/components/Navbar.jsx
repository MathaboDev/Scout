import { ArrowRight } from "lucide-react";
import Logo from "./Logo.jsx";
import Button from "./Button.jsx";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 md:px-12">
      <Logo variant="light" />
      <div className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
        <a href="#why-scout" className="transition-colors hover:text-white">
          How it works
        </a>
        <a href="#privacy" className="transition-colors hover:text-white">
          Privacy &amp; POPIA
        </a>
        <span className="cursor-default text-white/40">For providers · soon</span>
      </div>
      <div className="flex items-center gap-3">
        <Button to="/login" variant="ghost" className="hidden sm:inline-flex">
          Log in
        </Button>
        <Button to="/register" variant="lime">
          Get started <ArrowRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
