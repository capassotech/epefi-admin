import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTour, type TourStep } from '@/hooks/useTour';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TourButtonProps {
  steps: TourStep[];
  className?: string;
}

export function TourButton({ steps, className }: TourButtonProps) {
  const { startTour } = useTour(steps);

  const handleClick = () => {
    // Verificar que todos los elementos del tour existan en el DOM
    const allElementsExist = steps.every(step => {
      const element = document.querySelector(step.element);
      return element !== null;
    });

    if (!allElementsExist) {
      console.warn('Algunos elementos del tour no se encontraron en el DOM');
    }

    // Pequeño delay para asegurar que los elementos estén renderizados
    setTimeout(() => {
      startTour();
    }, 300);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer',
              className
            )}
            aria-label="Ver tutorial"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Ver tutorial</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
