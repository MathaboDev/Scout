import { Link } from "react-router-dom";
import logoUrl from "../assets/scout-logo.png";

// Scout's logo: white "Scout" script on an orange circle.
// The same image is used on the PDF report letterhead
// (backend/core/assets/scout-logo.png), so keep the two files identical.
// Importing the .png gives us its URL; Vite copies the file into the build.

export function Mark({ size = 40, className = "" }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="Scout"
      className={`shrink-0 rounded-full ${className}`}
    />
  );
}

export default function Logo({ className = "", to = "/", size = 54 }) {
  return (
    <Link to={to} aria-label="Scout home" className={`inline-flex items-center ${className}`}>
      <Mark size={size} />
    </Link>
  );
}
