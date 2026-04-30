"use client";

import { useState } from "react";

interface Props {
  children: React.ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <span
        role="tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0E0E0E",
          color: "#FAFAFA",
          fontFamily: "var(--sans)",
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: 1.45,
          textTransform: "none",
          letterSpacing: "normal",
          maxWidth: "220px",
          width: "max-content",
          padding: "8px 12px",
          borderRadius: 0,
          opacity: show ? 1 : 0,
          visibility: show ? "visible" : "hidden",
          transition: "opacity 150ms ease, visibility 150ms ease",
          pointerEvents: "none",
          zIndex: 50,
          textAlign: "left",
        }}
      >
        {text}
        {/* Downward caret */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #0E0E0E",
          }}
        />
      </span>
    </span>
  );
}
