"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./ProductForm.module.css";

const CATEGORIES = [
  { id: 1, slug: "macarrones", name: "Macarrones" },
  { id: 2, slug: "galletas", name: "Galletas" },
  { id: 3, slug: "granolas", name: "Granolas" },
  { id: 4, slug: "linea-saludable", name: "Línea Saludable" },
];

const DIETARY_LABELS = [
  "SIN_AZUCAR",
  "SIN_GLUTEN",
  "KETO",
  "VEGANO",
  "LIBRE_DE_LACTEOS",
];

export default function ProductFormModal() {
  const searchParams = useSearchParams();
  const categoriaSlug = searchParams.get("categoria");

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    presentacion: "",
    existencias: "",
    idCategoria: "",
    estado: "ACTIVO",
    etiquetas: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (categoriaSlug) {
      const cat = CATEGORIES.find((c) => c.slug === categoriaSlug);
      if (cat) {
        setFormData((prev) => ({ ...prev, idCategoria: cat.id.toString() }));
      }
    }
  }, [categoriaSlug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (label: string) => {
    setFormData((prev) => {
      const isChecked = prev.etiquetas.includes(label);
      if (isChecked) {
        return { ...prev, etiquetas: prev.etiquetas.filter((l) => l !== label) };
      } else {
        return { ...prev, etiquetas: [...prev.etiquetas, label] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        precio: parseFloat(formData.precio),
        existencias: parseInt(formData.existencias, 10),
        idCategoria: parseInt(formData.idCategoria, 10),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const res = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear el producto");
      }

      setSuccess(true);
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        presentacion: "",
        existencias: "",
        idCategoria: formData.idCategoria,
        estado: "ACTIVO",
        etiquetas: [],
      });
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      {success && (
        <div className={styles.successMsg}>
          ¡Producto creado exitosamente! Ya puedes verlo en el catálogo.
        </div>
      )}

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="nombre">Nombre del Producto *</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          className={styles.input}
          value={formData.nombre}
          onChange={handleChange}
          required
          maxLength={100}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="descripcion">Descripción *</label>
        <textarea
          id="descripcion"
          name="descripcion"
          className={styles.textarea}
          value={formData.descripcion}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label htmlFor="precio">Precio (COP) *</label>
          <input
            type="number"
            id="precio"
            name="precio"
            className={styles.input}
            value={formData.precio}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label htmlFor="existencias">Existencias *</label>
          <input
            type="number"
            id="existencias"
            name="existencias"
            className={styles.input}
            value={formData.existencias}
            onChange={handleChange}
            required
            min="0"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label htmlFor="presentacion">Presentación (Ej: 500g, 1 Unidad) *</label>
          <input
            type="text"
            id="presentacion"
            name="presentacion"
            className={styles.input}
            value={formData.presentacion}
            onChange={handleChange}
            required
            maxLength={50}
          />
        </div>

        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label htmlFor="idCategoria">Categoría *</label>
          <select
            id="idCategoria"
            name="idCategoria"
            className={styles.select}
            value={formData.idCategoria}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="estado">Estado *</label>
        <select
          id="estado"
          name="estado"
          className={styles.select}
          value={formData.estado}
          onChange={handleChange}
          required
        >
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Etiquetas Dietéticas (Opcional)</label>
        <div className={styles.checkboxGroup}>
          {DIETARY_LABELS.map((label) => (
            <label key={label} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.etiquetas.includes(label)}
                onChange={() => handleCheckboxChange(label)}
              />
              {label.replaceAll("_", " ")}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? "Creando..." : "Guardar Producto"}
      </button>
    </form>
  );
}
