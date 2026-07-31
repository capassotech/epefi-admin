// src/components/product/ConfirmDeleteModal.tsx

import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onCancel: () => void;       
  onConfirm: (id: string) => void;
  itemName: string;
  deleteLoading: boolean;
  id: string;
}

const ConfirmDeleteModal = ({ isOpen, onCancel, onConfirm, itemName, deleteLoading, id }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="break-words">¿Eliminar {itemName}?</span>
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El elemento será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={deleteLoading}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(id)}
            disabled={deleteLoading}
            className="w-full sm:w-auto cursor-pointer"
          >
            {deleteLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;