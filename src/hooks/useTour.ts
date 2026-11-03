import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { Config, Driver } from 'driver.js';

export type TourStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
};

export function useTour(steps: TourStep[]) {
  const driverRef = useRef<Driver | null>(null);

  // Cerrar el tour si cambian los pasos (otra página) o se desmonta el componente
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [steps]);

  // Se crea una instancia nueva en cada apertura para que el tour pueda repetirse.
  // Importante: no usar `onDestroyStarted`, porque con ese hook driver.js deja de
  // cerrarse solo con la X, Escape o el clic en el fondo.
  const createDriver = (config: Config) => {
    driverRef.current?.destroy();
    const instance = driver({
      ...config,
      onDestroyed: () => {
        try {
          localStorage.setItem('tour-completed', 'true');
        } catch {
          // Sin acceso a localStorage (modo privado, etc.): no es crítico
        }
        driverRef.current = null;
      },
    });
    driverRef.current = instance;
    return instance;
  };

  const startTour = () => {
    if (steps.length === 0) return;

    createDriver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      showButtons: ['next', 'previous', 'close'],
      prevBtnText: 'Atrás',
      nextBtnText: 'Siguiente',
      doneBtnText: 'Terminar',
      steps: steps.map(step => ({
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.side || 'bottom',
          align: step.popover.align || 'start',
        },
      })),
    }).drive();
  };

  const highlightElement = (selector: string) => {
    createDriver({}).highlight({
      element: selector,
      popover: {
        title: 'Elemento destacado',
        description: 'Este es un elemento importante',
      },
    });
  };

  return { startTour, highlightElement };
}
