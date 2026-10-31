'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '@/services/auth';
import styles from './recuperar.module.css';

function RecuperarPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estado para solicitud de enlace
  const [correo, setCorreo] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Estado para asignación de nueva contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  // Estados comunes
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestLink(e: FormEvent) {
    e.preventDefault();
    if (!correo.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const msg = await requestPasswordReset(correo.trim());
      setRequestSent(true);
      setSuccessMessage(msg);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar la solicitud.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError('Ingresa tu nueva contraseña.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const msg = await resetPassword(token!, password);
      setResetCompleted(true);
      setSuccessMessage(msg);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al restablecer la contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // VISTA 1: Cambiar contraseña (cuando viene el token en el query param)
  if (token) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Nueva Contraseña</h1>
        <p className={styles.description}>
          Ingresa y confirma tu nueva contraseña para volver a acceder a tu
          cuenta de Brisée Bake.
        </p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {resetCompleted ? (
          <div>
            <div className={styles.success}>{successMessage}</div>
            <div className={styles.loginLinkBox}>
              <Link href="/login" className={styles.submit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '52px' }}>
                Iniciar sesión ahora
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <label className={styles.label} htmlFor="new-password">
              Nueva contraseña (mínimo 6 caracteres)
            </label>
            <div className={styles.inputBox}>
              <LockKeyhole size={20} aria-hidden="true" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
              <button
                type="button"
                className={styles.showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <label className={styles.label} htmlFor="confirm-password">
              Confirmar nueva contraseña
            </label>
            <div className={styles.inputBox}>
              <LockKeyhole size={20} aria-hidden="true" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>

            <div className={styles.loginLinkBox}>
              <Link href="/login">Volver al inicio de sesión</Link>
            </div>
          </form>
        )}
      </div>
    );
  }

  // VISTA 2: Solicitar enlace de recuperación (cuando no hay token)
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
      <p className={styles.description}>
        Ingresa tu correo electrónico registrado y te enviaremos un enlace de
        seguridad para que puedas crear una nueva contraseña.
      </p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {requestSent ? (
        <div>
          <div className={styles.success}>{successMessage}</div>
          <div className={styles.loginLinkBox}>
            <Link href="/login">Regresar al inicio de sesión</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestLink} className={styles.form}>
          <label className={styles.label} htmlFor="email-recovery">
            Correo electrónico
          </label>
          <div className={styles.inputBox}>
            <Mail size={20} aria-hidden="true" />
            <input
              id="email-recovery"
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setError('');
              }}
            />
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Mandar correo de recuperación'}
          </button>

          <div className={styles.loginLinkBox}>
            ¿Te acordaste de tu contraseña? <Link href="/login">Inicia sesión</Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <section className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Volver al inicio de sesión</span>
        </Link>
      </div>
      <Suspense fallback={<div className={styles.card}>Cargando...</div>}>
        <RecuperarPasswordContent />
      </Suspense>
    </section>
  );
}
