// src/components/product/ConfirmDeleteModal.tsx
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface Props {
  isOpen: boolean;
  onCancel: () => void;       
  onConfirm: () => void;
  itemName?: string;
  deleteLoading: boolean;
}

const ConfirmDeleteModal = ({ isOpen, onCancel, onConfirm, itemName = "esta formación", deleteLoading }: Props) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogTrigger></DialogTrigger>
      <DialogContent>
        <div
          className="max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center flex-col justify-between p-6">
            <h3 className="text-lg font-bold">¿Eliminar {itemName}?</h3>
            <p className="mb-6">Esta acción no se puede deshacer.</p>
          </div>
          <div className="p-2">
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                className='cursor-pointer'
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className='cursor-pointer'
                variant="destructive"
                onClick={onConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;