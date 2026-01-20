import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour, type TourStep } from '@/hooks/useTour';

interface TourButtonProps {
  steps: TourStep[];
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function TourButton({ steps, className, variant = 'outline', size = 'default' }: TourButtonProps) {
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
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
      title="Iniciar tutorial"
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Tutorial
    </Button>
  );
}

