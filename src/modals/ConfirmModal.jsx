import React from 'react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure you want to delete this task?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmButtonVariant = 'danger',
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-blue-500 hover:bg-blue-600',
    success: 'bg-green-500 hover:bg-green-600',
  }[confirmButtonVariant] || 'bg-red-500 hover:bg-red-600';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-darkGrey p-6 shadow-xl">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">{title}</h3>
        <p className="text-mediumGrey mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-veryDarkGrey text-black dark:text-white hover:opacity-80 transition-opacity"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-full text-white ${confirmButtonClass} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;