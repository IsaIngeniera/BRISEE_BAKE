'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useCart } from '@/hooks/useCart';

import styles from './registro.module.css';

type RegisterForm = {
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  fechaNacimiento: string;
  password: string;
  confirmPassword: string;
};

type ApiResponse = {
  message?: string | string[];
  access_token?: string;
};

const initialForm: RegisterForm = {
  nombre: '',
  apellido: '',
  correo: '',
  celular: '',
  fechaNacimiento: '',
  password: '',
  confirmPassword: '',
};

function formatPrice(value: number): string {
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

export default function RegistroPage() {
  const { items, isHydrated, loadError } = useCart();

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.precio) * item.cantidad,
    0,
  );

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          correo: form.correo.trim(),
          celular: form.celular.trim(),
          fechaNacimiento: form.fechaNacimiento,
          password: form.password,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message[0]
          : data.message;

        setError(message || 'No fue posible completar el registro');
        return;
      }

      setSuccess(true);
      setForm(initialForm);
    } catch {
      setError(
        'No fue posible conectar con el servidor. Inténtalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.columns}>
        <section className={styles.formColumn}>
          <Link href="/catalogo" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            Volver al catálogo
          </Link>

          <div className={styles.notice}>
            <strong>¿Ya tienes una cuenta?</strong>
            <span>Podrás ingresar con tu correo y contraseña.</span>
          </div>

          <h1>Crea tu cuenta</h1>

          <p className={styles.intro}>
            Registra tus datos para continuar con tus compras.
          </p>

          {success && (
            <div className={styles.success} role="status">
              <p>Cuenta creada exitosamente.</p>
              <Link href="/carrito">Volver a mi carrito</Link>
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Correo electrónico *
              <input
                type="email"
                autoComplete="email"
                maxLength={150}
                value={form.correo}
                onChange={(event) =>
                  updateField('correo', event.target.value)
                }
                required
              />
            </label>

            <div className={styles.twoFields}>
              <label>
                Nombre *
                <input
                  type="text"
                  autoComplete="given-name"
                  maxLength={50}
                  value={form.nombre}
                  onChange={(event) =>
                    updateField('nombre', event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Apellido *
                <input
                  type="text"
                  autoComplete="family-name"
                  maxLength={50}
                  value={form.apellido}
                  onChange={(event) =>
                    updateField('apellido', event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <label>
              Teléfono *
              <input
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={form.celular}
                onChange={(event) =>
                  updateField('celular', event.target.value)
                }
                required
              />
            </label>

            <label>
              Fecha de nacimiento *
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(event) =>
                  updateField('fechaNacimiento', event.target.value)
                }
                required
              />
            </label>

            <label>
              Contraseña *
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={255}
                value={form.password}
                onChange={(event) =>
                  updateField('password', event.target.value)
                }
                required
              />
              <small>Mínimo 8 caracteres.</small>
            </label>

            <label>
              Confirmar contraseña *
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField('confirmPassword', event.target.value)
                }
                required
              />
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </section>

        <aside className={styles.summary}>
          <h2>Resumen de tu carrito</h2>

          {!isHydrated ? (
            <p>Cargando carrito...</p>
          ) : loadError ? (
            <p role="alert">No se pudo cargar el carrito.</p>
          ) : items.length === 0 ? (
            <p>Aún no has agregado productos.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.productId}>
                  <span>
                    {item.nombre} × {item.cantidad}
                  </span>
                  <strong>
                    {formatPrice(
                      Number(item.precio) * item.cantidad,
                    )}
                  </strong>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.total}>
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <p className={styles.summaryNote}>
            El costo de envío y el total final se calcularán durante la
            compra.
          </p>
        </aside>
      </div>
    </div>
  );
}