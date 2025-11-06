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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            ¿Eliminar {itemName}?
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El elemento será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={deleteLoading}
            className="flex-1 sm:flex-none cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(id)}
            disabled={deleteLoading}
            className="flex-1 sm:flex-none cursor-pointer"
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