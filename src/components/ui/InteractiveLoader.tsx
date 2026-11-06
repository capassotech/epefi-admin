import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/common/BrandLogo";

interface InteractiveLoaderProps {
  initialMessage: string;
  delayedMessage: string;
  delay?: number;
}

export function InteractiveLoader({
  initialMessage,
  delayedMessage,
  delay = 5000
}: InteractiveLoaderProps) {
  const [showDelayed, setShowDelayed] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Si la carga tarda, sumar un mensaje secundario explicando la demora
    const messageTimer = setTimeout(() => setShowDelayed(true), delay);

    // Animación de puntos
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "" : prev + "."));
    }, 500);

    return () => {
      clearTimeout(messageTimer);
      clearInterval(dotsInterval);
    };
  }, [delay]);

  return (
    <div
      className="loader-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="loader-card relative">
        {/* Halo naranja que respira detrás de la tarjeta */}
        <div className="loader-halo absolute -inset-10 rounded-full" aria-hidden="true" />

        <div className="relative flex w-[340px] max-w-[calc(100vw-2rem)] flex-col items-center gap-6 rounded-3xl bg-white/95 px-10 pt-10 pb-8 shadow-[0_30px_80px_-20px_rgb(15_23_42/0.45)] ring-1 ring-white/60">
          {/* Logo con un brillo que lo recorre */}
          <div className="loader-logo relative">
            <BrandLogo className="h-14 w-auto select-none" draggable={false} />
            <div className="loader-logo-shine absolute inset-0" aria-hidden="true" />
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            {/* Barra indeterminada con el degradé del logo */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-orange-100/70">
              <div className="loader-bar h-full w-2/5 rounded-full" />
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-lg font-semibold text-gray-900">
                {initialMessage}
                {/* Ancho fijo para que el texto no se mueva mientras cambian los puntos */}
                <span className="inline-block w-4 text-left">{dots}</span>
              </p>
              {showDelayed && (
                <p className="loader-delayed text-xs leading-relaxed text-gray-500">{delayedMessage}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="font-medium">Conectando con el servidor...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
