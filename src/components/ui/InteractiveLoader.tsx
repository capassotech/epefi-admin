import { useState, useEffect } from "react";

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
  const [message, setMessage] = useState(initialMessage);
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Cambiar mensaje después del delay
    const messageTimer = setTimeout(() => {
      setMessage(delayedMessage);
    }, delay);

    // Animación de puntos
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => {
      clearTimeout(messageTimer);
      clearInterval(dotsInterval);
    };
  }, [delayedMessage, delay]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Contenedor principal de animación */}
        <div className="relative w-40 h-40">
          {/* Círculo exterior giratorio con gradiente */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "hsl(var(--primary))",
              borderRightColor: "hsl(var(--primary))",
              animation: "spin 1s linear infinite",
            }}
          />
          
          {/* Círculo medio giratorio (dirección opuesta) */}
          <div 
            className="absolute inset-3 rounded-full border-4 border-transparent"
            style={{
              borderBottomColor: "hsl(var(--accent))",
              borderLeftColor: "hsl(var(--accent))",
              animation: "spin 1.5s linear infinite reverse",
            }}
          />
          
          {/* Círculo interior giratorio */}
          <div 
            className="absolute inset-6 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "hsl(var(--primary))",
              borderRightColor: "hsl(var(--accent))",
              animation: "spin 0.8s linear infinite",
            }}
          />
          
          {/* Logo EPEFI en el centro con efecto pulsante */}
          <div 
            className="absolute inset-10 rounded-full bg-background flex items-center justify-center overflow-hidden"
            style={{
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          >
            <img
              src="/logoNegro.png"
              alt="EPEFI"
              className="w-12 h-12 object-contain opacity-90"
              style={{
                animation: "logo-scale 2s ease-in-out infinite",
              }}
            />
          </div>
          
          {/* Partículas flotantes alrededor */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const radius = 70;
            
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${radius}px)`,
                  animation: `orbit 3s linear infinite`,
                  animationDelay: `${i * 0.25}s`,
                  boxShadow: "0 0 8px hsl(var(--primary))",
                  transformOrigin: "50% 50%",
                }}
              />
            );
          })}
        </div>

        {/* Mensaje con animación de escritura */}
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-foreground animate-fade-in">
            {message}{dots}
          </p>
          
          {/* Barra de progreso animada con gradiente */}
          <div className="w-80 h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary via-accent to-primary"
              style={{
                width: "100%",
                animation: "progress-shimmer 2s ease-in-out infinite",
                boxShadow: "0 0 10px hsl(var(--primary))",
              }}
            />
          </div>
          
          {/* Puntos de carga animados */}
          <div className="flex items-center justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                style={{
                  animation: "bounce 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Indicador de conexión con animación */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground animate-fade-in">
          <div 
            className="w-2.5 h-2.5 bg-green-500 rounded-full"
            style={{
              animation: "pulse-glow 2s ease-in-out infinite",
              boxShadow: "0 0 8px rgb(34, 197, 94)",
            }}
          />
          <span className="font-medium">Conectando con el servidor...</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes pulse-scale {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        
        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translateY(-70px);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translateY(-70px);
          }
        }
        
        @keyframes progress-shimmer {
          0% {
            transform: translateX(-100%) scaleX(0.5);
            opacity: 0.5;
          }
          50% {
            transform: translateX(0%) scaleX(1);
            opacity: 1;
          }
          100% {
            transform: translateX(100%) scaleX(0.5);
            opacity: 0.5;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes logo-pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes logo-scale {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.7;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

