import React from "react";
import { statusBadgeClass } from "../data/dataService";

export default function StatusBadge({ status }) {
  return (
    <span className={`sp-status-pill ${statusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
