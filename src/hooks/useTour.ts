import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { Driver } from 'driver.js';

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
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    if (steps.length === 0) return;

    // Destruir el driver anterior si existe
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    // Remover el listener anterior si existe
    if (clickHandlerRef.current) {
      document.removeEventListener('click', clickHandlerRef.current, true);
    }

    // Crear un handler de eventos usando event delegation
    clickHandlerRef.current = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Verificar si el clic fue en un botón dentro del popover de driver
      const isDriverButton = target.closest('.driver-popover') !== null;
      if (!isDriverButton) return;

      const buttonText = target.textContent?.trim() || '';
      const isDoneButton = buttonText === 'Terminar' || buttonText === 'Done' || 
                          target.classList.contains('driver-done-btn') ||
                          target.getAttribute('data-driver-done-btn') !== null;
      
      const isCloseButton = target.classList.contains('driver-close-btn') ||
                           target.getAttribute('data-driver-close-btn') !== null ||
                           target.closest('.driver-close-btn') !== null;

      if (isDoneButton) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem('tour-completed', 'true');
        if (driverRef.current) {
          driverRef.current.destroy();
        }
        if (clickHandlerRef.current) {
          document.removeEventListener('click', clickHandlerRef.current, true);
          clickHandlerRef.current = null;
        }
      } else if (isCloseButton) {
        e.preventDefault();
        e.stopPropagation();
        if (driverRef.current) {
          driverRef.current.destroy();
        }
        if (clickHandlerRef.current) {
          document.removeEventListener('click', clickHandlerRef.current, true);
          clickHandlerRef.current = null;
        }
      }
    };

    // Agregar el listener usando capture phase para capturar antes que otros handlers
    document.addEventListener('click', clickHandlerRef.current, true);

    driverRef.current = driver({
      showProgress: true,
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
      onDestroyStarted: () => {
        // Guardar en localStorage que el tour fue completado
        localStorage.setItem('tour-completed', 'true');
      },
      onDestroyed: () => {
        // Limpiar la referencia después de que el tour se haya destruido completamente
        driverRef.current = null;
        if (clickHandlerRef.current) {
          document.removeEventListener('click', clickHandlerRef.current, true);
          clickHandlerRef.current = null;
        }
      },
    });

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      if (clickHandlerRef.current) {
        document.removeEventListener('click', clickHandlerRef.current, true);
        clickHandlerRef.current = null;
      }
    };
  }, [steps]);

  const startTour = () => {
    if (driverRef.current) {
      driverRef.current.drive();
    }
  };

  const highlightElement = (selector: string) => {
    if (driverRef.current) {
      driverRef.current.highlight({
        element: selector,
        popover: {
          title: 'Elemento destacado',
          description: 'Este es un elemento importante',
        },
      });
    }
  };

  return { startTour, highlightElement };
}

