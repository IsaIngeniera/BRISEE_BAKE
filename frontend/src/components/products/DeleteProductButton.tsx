'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AUTH_TOKEN_KEY } from '@/services/auth';
import styles from './delete-product.module.css';

interface DeleteProductButtonProps {
  id: string;
  nombre: string;
}

export default function DeleteProductButton({
  id,
  nombre,
}: DeleteProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    if (!isDeleting) {
      setIsModalOpen(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 3300);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token =
        sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(AUTH_TOKEN_KEY);

      const response = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        let errorMessage = 'Error al eliminar el producto';

        try {
          const errorBody: unknown = await response.json();
          if (
            typeof errorBody === 'object' &&
            errorBody !== null &&
            'message' in errorBody
          ) {
            const message = (errorBody as { message?: unknown }).message;
            if (typeof message === 'string') {
              errorMessage = message;
            } else if (
              Array.isArray(message) &&
              message.every(
                (item): item is string => typeof item === 'string',
              )
            ) {
              errorMessage = message.join(', ');
            }
          }
        } catch {
          // Conserva el mensaje predeterminado si no hay un cuerpo JSON.
        }

        throw new Error(errorMessage);
      }

      setIsModalOpen(false);
      showToast(`Producto '${nombre}' eliminado correctamente`);
      router.refresh();
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Hubo un problema al intentar eliminar el producto.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={openModal}
        aria-label={`Eliminar ${nombre}`}
      >
        Eliminar
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalIcon} aria-hidden="true">
              !
            </div>

            <h2 className={styles.modalTitle}>
              ¿Seguro que deseas eliminar este producto?
            </h2>

            <p className={styles.modalText}>
              Esta acción no se puede deshacer. El producto{' '}
              <strong>{nombre}</strong> dejará de estar disponible en
              el catálogo.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeModal}
                disabled={isDeleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={styles.toast} role="alert">
          <span className={styles.toastIcon}>✓</span>
          {toastMessage}
        </div>
      )}
    </>
  );
}
