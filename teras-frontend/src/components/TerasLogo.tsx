// src/components/TerasLogo.tsx
// Simple logo (utilise ton fichier SVG si présent)
import Logo from "../assets/logo-teras.svg";

type Anim = "none" | "float" | "pulse" | "hover-tilt" | "float+pulse";

export default function TerasLogo({
  size = 56,
  className = "",
  animate = "none",
}: {
  size?: number;
  className?: string;
  animate?: Anim;
}) {
  const animClass =
    animate === "float" ? "teras-anim-float" :
    animate === "pulse" ? "teras-anim-pulse" :
    animate === "hover-tilt" ? "teras-anim-hover-tilt" :
    animate === "float+pulse" ? "teras-anim-float teras-anim-pulse" : "";

  return (
    <img
      src={Logo}
      alt="TERAS Logo"
      width={size}
      height={size}
      className={`${animClass} select-none ${className}`}
      draggable="false"
    />
  );
}
