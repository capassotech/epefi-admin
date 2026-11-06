import type { ImgHTMLAttributes } from "react";
import { useTheme } from "@/context/ThemeContext";

// Logo de EPEFI con el texto en negro o en blanco según el tema
export function BrandLogo({ alt = "EPEFI", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const { theme } = useTheme();
  return <img {...props} src={theme === "dark" ? "/logoBlanco.png" : "/logoNegro.png"} alt={alt} />;
}
