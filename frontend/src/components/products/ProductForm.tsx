'use client';

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react';

import { useSearchParams } from 'next/navigation';

import styles from './product-form.module.css';

type ProductStatus = 'ACTIVO' | 'INACTIVO';

type DietaryLabel =
  | 'SIN_AZUCAR'
  | 'SIN_GLUTEN'
  | 'KETO'
  | 'VEGANO'
  | 'LIBRE_DE_LACTEOS';

interface ProductCategory {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
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

interface ApiErrorResponse {
  readonly message?: string;
}

const CATEGORIES: readonly ProductCategory[] = [
  {
    id: 1,
    slug: 'macarons',
    name: 'Macarons',
  },
  {
    id: 2,
    slug: 'galletas',
    name: 'Galletas',
  },
  {
    id: 3,
    slug: 'granolas',
    name: 'Granolas',
  },
  {
    id: 4,
    slug: 'linea-saludable',
    name: 'Línea saludable',
  },
];

const DIETARY_LABELS: readonly DietaryLabel[] = [
  'SIN_AZUCAR',
  'SIN_GLUTEN',
  'KETO',
  'VEGANO',
  'LIBRE_DE_LACTEOS',
];

const INITIAL_FORM_DATA: ProductFormData = {
  nombre: '',
  descripcion: '',
  precio: '',
  presentacion: '',
  existencias: '',
  idCategoria: '',
  estado: 'ACTIVO',
  etiquetas: [],
};

export default function ProductForm(): ReactElement {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('categoria');

  const [formData, setFormData] =
    useState<ProductFormData>(INITIAL_FORM_DATA);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    if (!categorySlug) {
      return;
    }

    const selectedCategory = CATEGORIES.find(
      (category) => category.slug === categorySlug,
    );

    if (!selectedCategory) {
      return;
    }

    setFormData((previousFormData) => ({
      ...previousFormData,
      idCategoria: selectedCategory.id.toString(),
    }));
  }, [categorySlug]);

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
  }

  function handleDietaryLabelChange(
    dietaryLabel: DietaryLabel,
  ): void {
    setFormData((previousFormData) => {
      const isSelected =
        previousFormData.etiquetas.includes(dietaryLabel);

      if (isSelected) {
        return {
          ...previousFormData,
          etiquetas: previousFormData.etiquetas.filter(
            (currentLabel) =>
              currentLabel !== dietaryLabel,
          ),
        };
      }

      return {
        ...previousFormData,
        etiquetas: [
          ...previousFormData.etiquetas,
          dietaryLabel,
        ],
      };
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage('');
    setIsSuccess(false);

    try {
      const payload = {
        ...formData,
        precio: Number.parseFloat(formData.precio),
        existencias: Number.parseInt(
          formData.existencias,
          10,
        ),
        idCategoria: Number.parseInt(
          formData.idCategoria,
          10,
        ),
      };

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        'http://localhost:3001';

      const response = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorResponse: ApiErrorResponse =
          await response.json();

        throw new Error(
          errorResponse.message ??
            'Error al crear el producto',
        );
      }

      setIsSuccess(true);

      setFormData((previousFormData) => ({
        ...INITIAL_FORM_DATA,
        idCategoria: previousFormData.idCategoria,
      }));
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Ocurrió un error inesperado';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={styles.formContainer}
      onSubmit={handleSubmit}
    >
      {isSuccess && (
        <div
          className={styles.successMessage}
          role="status"
        >
          ¡Producto creado exitosamente! Ya puedes verlo en el
          catálogo.
        </div>
      )}

      {errorMessage && (
        <div
          className={styles.errorMessage}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="nombre">
          Nombre del producto *
        </label>

        <input
          type="text"
          id="nombre"
          name="nombre"
          className={styles.input}
          value={formData.nombre}
          onChange={handleInputChange}
          required
          maxLength={100}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="descripcion">
          Descripción *
        </label>

        <textarea
          id="descripcion"
          name="descripcion"
          className={styles.textarea}
          value={formData.descripcion}
          onChange={handleInputChange}
          required
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
        }}
      >
        <div
          className={styles.formGroup}
          style={{ flex: 1 }}
        >
          <label htmlFor="precio">
            Precio (COP) *
          </label>

          <input
            type="number"
            id="precio"
            name="precio"
            className={styles.input}
            value={formData.precio}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>

        <div
          className={styles.formGroup}
          style={{ flex: 1 }}
        >
          <label htmlFor="existencias">
            Existencias *
          </label>

          <input
            type="number"
            id="existencias"
            name="existencias"
            className={styles.input}
            value={formData.existencias}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
        }}
      >
        <div
          className={styles.formGroup}
          style={{ flex: 1 }}
        >
          <label htmlFor="presentacion">
            Presentación (ejemplo: 500 g o 1 unidad) *
          </label>

          <input
            type="text"
            id="presentacion"
            name="presentacion"
            className={styles.input}
            value={formData.presentacion}
            onChange={handleInputChange}
            required
            maxLength={50}
          />
        </div>

        <div
          className={styles.formGroup}
          style={{ flex: 1 }}
        >
          <label htmlFor="idCategoria">
            Categoría *
          </label>

          <select
            id="idCategoria"
            name="idCategoria"
            className={styles.select}
            value={formData.idCategoria}
            onChange={handleInputChange}
            required
          >
            <option value="">
              Selecciona una categoría
            </option>

            {CATEGORIES.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="estado">
          Estado *
        </label>

        <select
          id="estado"
          name="estado"
          className={styles.select}
          value={formData.estado}
          onChange={handleInputChange}
          required
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <fieldset className={styles.formGroup}>
        <legend>
          Etiquetas dietéticas (opcional)
        </legend>

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
                  handleDietaryLabelChange(dietaryLabel)
                }
              />

              {dietaryLabel.replaceAll('_', ' ')}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Creando...'
          : 'Guardar producto'}
      </button>
    </form>
  );
}