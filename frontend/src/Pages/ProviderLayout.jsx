import React from "react";
import Sidebar from "./Sidebar";
import "../styles/scout-provider.css";
export default function ProviderLayout({ active, children }) {
  return (
    <div className="scout-provider-app">
      <div className="sp-app">
        <Sidebar active={active} />
        <div className="sp-main">{children}</div>
      </div>
    </div>
  );
}
