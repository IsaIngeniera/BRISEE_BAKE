'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

import { useCart } from '@/hooks/useCart';
import { getSessionUser, saveSession } from '@/services/auth';

import styles from './registro.module.css';

type RegisterForm = {
  nombre: string;
  apellido: string;
  celular: string;
  fechaNacimiento: string;
  correo: string;
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
  celular: '',
  fechaNacimiento: '',
  correo: '',
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

function RegistroContent() {
  const router = useRouter();
  const fromCart = useSearchParams().get('from') === 'carrito';
  const { items, isHydrated, loadError } = useCart();

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.precio) * item.cantidad,
    0,
  );

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          celular: form.celular.trim(),
          fechaNacimiento: form.fechaNacimiento,
          correo: form.correo.trim(),
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

      if (!data.access_token) {
        setError(
          'La cuenta se creó, pero no fue posible iniciar sesión. Ingresa desde la página de inicio de sesión.',
        );
        return;
      }

      saveSession(data.access_token, false);

      const sessionUser = getSessionUser();

      if (sessionUser) {
        try {
          localStorage.setItem(
            `brisee_profile_${sessionUser.sub}`,
            JSON.stringify({
              nombre: form.nombre.trim(),
              apellido: form.apellido.trim(),
              celular: form.celular.trim(),
              fechaNacimiento: form.fechaNacimiento,
            }),
          );
        } catch {
          // El registro permanece válido si falla el guardado local.
        }
      }

      router.replace(fromCart ? '/carrito' : '/cuenta');
    } catch {
      setError(
        'No fue posible conectar con el servidor. Inténtalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={fromCart ? styles.checkoutCard : styles.accountCard}>
        <section className={styles.content}>
          <Link
            href={fromCart ? '/carrito' : '/cuenta'}
            className={styles.backLink}
          >
            <ArrowLeft size={20} aria-hidden="true" />
            {fromCart ? 'Volver al carrito' : 'Volver a mi cuenta'}
          </Link>

          <p className={styles.eyebrow}>BRISÉE BAKE</p>
          <h1>Únete a Brisée Bake</h1>
          <p className={styles.intro}>
            Crea tu cuenta y forma parte de nuestra comunidad dulce.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.twoFields}>
              <div className={styles.field}>
                <label htmlFor="registro-nombre">Nombre *</label>
                <div className={styles.inputBox}>
                  <UserRound aria-hidden="true" />
                  <input
                    id="registro-nombre"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Tu nombre"
                    maxLength={50}
                    value={form.nombre}
                    onChange={(event) =>
                      updateField('nombre', event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="registro-apellido">Apellido *</label>
                <div className={styles.inputBox}>
                  <UserRound aria-hidden="true" />
                  <input
                    id="registro-apellido"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Tu apellido"
                    maxLength={50}
                    value={form.apellido}
                    onChange={(event) =>
                      updateField('apellido', event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="registro-celular">Teléfono *</label>
                <div className={styles.inputBox}>
                  <Phone aria-hidden="true" />
                  <input
                    id="registro-celular"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Tu número de teléfono"
                    maxLength={20}
                    value={form.celular}
                    onChange={(event) =>
                      updateField('celular', event.target.value.replace(/\D/g, ''))
                    }
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="registro-fecha">
                  Fecha de nacimiento *
                </label>
                <div className={styles.inputBox}>
                  <CalendarDays aria-hidden="true" />
                  <input
                    id="registro-fecha"
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(event) =>
                      updateField('fechaNacimiento', event.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="registro-correo">
                Correo electrónico *
              </label>
              <div className={styles.inputBox}>
                <Mail aria-hidden="true" />
                <input
                  id="registro-correo"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  maxLength={150}
                  value={form.correo}
                  onChange={(event) =>
                    updateField('correo', event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className={styles.twoFields}>
              <div className={styles.field}>
                <label htmlFor="registro-password">Contraseña *</label>
                <div className={styles.inputBox}>
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="registro-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    maxLength={255}
                    value={form.password}
                    onChange={(event) =>
                      updateField('password', event.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityButton}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="registro-confirmar">
                  Confirmar contraseña *
                </label>
                <div className={styles.inputBox}>
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="registro-confirmar"
                    type={showConfirmation ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    minLength={8}
                    maxLength={255}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField('confirmPassword', event.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    className={styles.visibilityButton}
                    onClick={() =>
                      setShowConfirmation((current) => !current)
                    }
                    aria-label={
                      showConfirmation
                        ? 'Ocultar confirmación'
                        : 'Mostrar confirmación'
                    }
                  >
                    {showConfirmation ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className={styles.loginLink}>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login">Iniciar sesión</Link>
          </p>
        </section>

        {fromCart ? (
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
              El costo de envío y el total final se calcularán
              durante la compra.
            </p>
          </aside>
        ) : (
          <div className={styles.photo}>
            <Image
              src="/images/registrobrisee.png"
              alt="Productos de Brisée Bake"
              fill
              sizes="(max-width: 760px) 100vw, 40vw"
              className={styles.photoImage}
              priority
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={<main className={styles.page}>Cargando registro...</main>}
    >
      <RegistroContent />
    </Suspense>
  );
}