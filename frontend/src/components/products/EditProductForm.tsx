'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react';

import Link from 'next/link';

import styles from './edit-product-form.module.css';

type ProductStatus = 'ACTIVO' | 'INACTIVO';

type DietaryLabel =
  | 'SIN_AZUCAR'
  | 'SIN_GLUTEN'
  | 'KETO'
  | 'VEGANO'
  | 'LIBRE_DE_LACTEOS';

interface ProductImage {
  readonly id: string;
  readonly urlImagen: string;
  readonly nombre: string;
}

interface ProductCategory {
  readonly id: string;
  readonly nombre: string;
}

interface Product {
  readonly id: string;
  readonly idCategoria: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number | string;
  readonly presentacion: string;
  readonly existencias: number;
  readonly estado: ProductStatus;
  readonly etiquetas: DietaryLabel[];
  readonly categoria?: ProductCategory;
  readonly imagenes?: ProductImage[];
}

interface ProductFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  presentacion: string;
  existencias: string;
  idCategoria: string;
  estado: ProductStatus;
  etiquetas: DietaryLabel[];
}

interface EditProductFormProps {
  readonly productId: string;
}

const DIETARY_LABELS: readonly DietaryLabel[] = [
  'SIN_AZUCAR',
  'SIN_GLUTEN',
  'KETO',
  'VEGANO',
  'LIBRE_DE_LACTEOS',
];

const EMPTY_FORM_DATA: ProductFormData = {
  nombre: '',
  descripcion: '',
  precio: '',
  presentacion: '',
  existencias: '',
  idCategoria: '',
  estado: 'ACTIVO',
  etiquetas: [],
};

function createFormData(
  product: Product,
): ProductFormData {
  return {
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: String(product.precio),
    presentacion: product.presentacion,
    existencias: String(product.existencias),
    idCategoria: product.idCategoria,
    estado: product.estado,
    etiquetas: [...product.etiquetas],
  };
}

function serializeFormData(
  formData: ProductFormData,
): string {
  return JSON.stringify({
    ...formData,
    etiquetas: [...formData.etiquetas].sort(),
  });
}

export default function EditProductForm({
  productId,
}: EditProductFormProps): ReactElement {
  const [formData, setFormData] =
    useState<ProductFormData>(EMPTY_FORM_DATA);

  const [savedFormData, setSavedFormData] =
    useState<ProductFormData | null>(null);

  const [categories, setCategories] =
    useState<ProductCategory[]>([]);

  const [currentImageUrl, setCurrentImageUrl] =
    useState<string>('');

  const [previewImageUrl, setPreviewImageUrl] =
    useState<string>('');

  const [selectedImageName, setSelectedImageName] =
    useState<string>('');

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isSaving, setIsSaving] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string>('');

  const [successMessage, setSuccessMessage] =
    useState<string>('');

  const [informationMessage, setInformationMessage] =
    useState<string>('');

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001';

  const displayedImageUrl =
    previewImageUrl || currentImageUrl;

  const hasChanges = useMemo((): boolean => {
    if (!savedFormData) {
      return false;
    }

    return (
      serializeFormData(formData) !==
        serializeFormData(savedFormData) ||
      Boolean(selectedImageName)
    );
  }, [formData, savedFormData, selectedImageName]);

  useEffect(() => {
    async function loadProduct(): Promise<void> {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [
          productResponse,
          productsResponse,
        ] = await Promise.all([
          fetch(`${apiUrl}/products/${productId}`, {
            cache: 'no-store',
          }),
          fetch(`${apiUrl}/products`, {
            cache: 'no-store',
          }),
        ]);

        if (!productResponse.ok) {
          throw new Error(
            'No fue posible cargar el producto seleccionado',
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            'No fue posible cargar las categorías',
          );
        }

        const product: Product =
          await productResponse.json();

        const products: Product[] =
          await productsResponse.json();

        const categoryMap = new Map<
          string,
          ProductCategory
        >();

        products.forEach((currentProduct) => {
          if (currentProduct.categoria) {
            categoryMap.set(
              currentProduct.categoria.id,
              currentProduct.categoria,
            );
          }
        });

        if (product.categoria) {
          categoryMap.set(
            product.categoria.id,
            product.categoria,
          );
        }

        const receivedFormData =
          createFormData(product);

        setFormData(receivedFormData);
        setSavedFormData(receivedFormData);

        setCategories(
          Array.from(categoryMap.values()).sort(
            (firstCategory, secondCategory) =>
              firstCategory.nombre.localeCompare(
                secondCategory.nombre,
                'es',
              ),
          ),
        );

        setCurrentImageUrl(
          product.imagenes?.[0]?.urlImagen ?? '',
        );
      } catch (caughtError: unknown) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Ocurrió un error inesperado';

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadProduct();
  }, [apiUrl, productId]);

  useEffect(() => {
    return (): void => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  function clearMessages(): void {
    setErrorMessage('');
    setSuccessMessage('');
    setInformationMessage('');
  }

  function handleInputChange(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ): void {
    const { name, value } = event.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));

    clearMessages();
  }

  function handleDietaryLabelChange(
    dietaryLabel: DietaryLabel,
  ): void {
    setFormData((previousFormData) => {
      const isSelected =
        previousFormData.etiquetas.includes(
          dietaryLabel,
        );

      return {
        ...previousFormData,
        etiquetas: isSelected
          ? previousFormData.etiquetas.filter(
              (currentLabel) =>
                currentLabel !== dietaryLabel,
            )
          : [
              ...previousFormData.etiquetas,
              dietaryLabel,
            ],
      };
    });

    clearMessages();
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const selectedFile = event.target.files?.[0];

    clearMessages();

    if (!selectedFile) {
      return;
    }

    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }

    setPreviewImageUrl(
      URL.createObjectURL(selectedFile),
    );

    setSelectedImageName(selectedFile.name);
  }

  function handleRestoreImage(): void {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }

    setPreviewImageUrl('');
    setSelectedImageName('');
    clearMessages();
  }

  function handleRestoreData(): void {
    if (!savedFormData) {
      return;
    }

    setFormData(savedFormData);
    handleRestoreImage();
    setInformationMessage(
      'Se restauró la información original del producto.',
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    clearMessages();

    if (!hasChanges) {
      setInformationMessage(
        'No realizaste cambios. Se conservaron los datos anteriores.',
      );

      return;
    }

    setIsSaving(true);

    /*
     * Simulación exclusiva del frontend.
     * Aquí se conectará posteriormente el PATCH del backend:
     *
     * await fetch(`${apiUrl}/products/${productId}`, {
     *   method: 'PATCH',
     *   headers: {
     *     'Content-Type': 'application/json',
     *   },
     *   body: JSON.stringify(payload),
     * });
     */

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 500);
    });

    setSavedFormData({
      ...formData,
      etiquetas: [...formData.etiquetas],
    });

    if (previewImageUrl) {
      setCurrentImageUrl(previewImageUrl);
    }

    setSelectedImageName('');
    setSuccessMessage(
      'Producto actualizado exitosamente',
    );
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div
        className={styles.loadingMessage}
        role="status"
      >
        Cargando información del producto...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.errorContainer}>
        <p role="alert">{errorMessage}</p>

        <Link
          href="/catalogo"
          className={styles.returnButton}
        >
          Regresar al catálogo
        </Link>
      </div>
    );
  }

  return (
    <form
      className={styles.formContainer}
      onSubmit={handleSubmit}
    >
      {successMessage && (
        <div
          className={styles.successMessage}
          role="status"
        >
          {successMessage}
        </div>
      )}

      {informationMessage && (
        <div
          className={styles.informationMessage}
          role="status"
        >
          {informationMessage}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="nombre">
          Nombre del producto
        </label>

        <input
          type="text"
          id="nombre"
          name="nombre"
          className={styles.input}
          value={formData.nombre}
          onChange={handleInputChange}
          maxLength={100}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="descripcion">
          Descripción
        </label>

        <textarea
          id="descripcion"
          name="descripcion"
          className={styles.textarea}
          value={formData.descripcion}
          onChange={handleInputChange}
        />
      </div>

      <div className={styles.twoColumnLayout}>
        <div className={styles.formGroup}>
          <label htmlFor="precio">
            Precio (COP)
          </label>

          <input
            type="number"
            id="precio"
            name="precio"
            className={styles.input}
            value={formData.precio}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="existencias">
            Existencias
          </label>

          <input
            type="number"
            id="existencias"
            name="existencias"
            className={styles.input}
            value={formData.existencias}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className={styles.twoColumnLayout}>
        <div className={styles.formGroup}>
          <label htmlFor="presentacion">
            Presentación
          </label>

          <input
            type="text"
            id="presentacion"
            name="presentacion"
            className={styles.input}
            value={formData.presentacion}
            onChange={handleInputChange}
            maxLength={50}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="idCategoria">
            Categoría
          </label>

          <select
            id="idCategoria"
            name="idCategoria"
            className={styles.select}
            value={formData.idCategoria}
            onChange={handleInputChange}
          >
            <option value="">
              Selecciona una categoría
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="estado">Estado</label>

        <select
          id="estado"
          name="estado"
          className={styles.select}
          value={formData.estado}
          onChange={handleInputChange}
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Etiquetas dietéticas</legend>

        <div className={styles.checkboxGroup}>
          {DIETARY_LABELS.map((dietaryLabel) => (
            <label
              key={dietaryLabel}
              className={styles.checkboxLabel}
            >
              <input
                type="checkbox"
                name="etiquetas"
                value={dietaryLabel}
                checked={formData.etiquetas.includes(
                  dietaryLabel,
                )}
                onChange={() =>
                  handleDietaryLabelChange(
                    dietaryLabel,
                  )
                }
              />

              {dietaryLabel.replaceAll('_', ' ')}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.formGroup}>
        <label htmlFor="imagen">
          Reemplazar imagen
        </label>

        {displayedImageUrl && (
          <div className={styles.imagePreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayedImageUrl}
              alt="Vista previa del producto"
            />
          </div>
        )}

        <input
          type="file"
          id="imagen"
          name="imagen"
          className={styles.fileInput}
          accept="image/*"
          onChange={handleImageChange}
        />

        {selectedImageName && (
          <div className={styles.selectedImage}>
            <span>{selectedImageName}</span>

            <button
              type="button"
              onClick={handleRestoreImage}
            >
              Conservar imagen anterior
            </button>
          </div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <Link
          href="/catalogo"
          className={styles.cancelButton}
        >
          Cancelar
        </Link>

        <button
          type="button"
          className={styles.restoreButton}
          onClick={handleRestoreData}
        >
          Restaurar datos
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving
            ? 'Guardando...'
            : 'Guardar cambios'}
        </button>
      </div>

      <p className={styles.developmentNotice}>
        Vista frontend: los cambios se muestran en esta pantalla,
        pero todavía no se envían a la base de datos.
      </p>
    </form>
  );
}