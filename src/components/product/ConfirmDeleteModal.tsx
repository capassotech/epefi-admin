// src/components/product/ConfirmDeleteModal.tsx
import React from 'react';

interface Props {
  isOpen: boolean;
  onCancel: () => void;        // 👈 Usa "onCancel", no "onClose"
  onConfirm: () => void;
  itemName?: string;
}

const ConfirmDeleteModal = ({ isOpen, onCancel, onConfirm, itemName = "esta formación" }: Props) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel} // 👈 Cierra al hacer clic fuera
    >
      <div 
        className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()} // 👈 Evita cerrar al hacer clic dentro
      >
        <h3 className="text-lg font-bold mb-4">¿Eliminar {itemName}?</h3>
        <p className="mb-6">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;