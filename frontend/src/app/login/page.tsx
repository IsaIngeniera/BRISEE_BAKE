'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { getSessionUser, login, loginWithGoogle, saveSession } from '@/services/auth';

import styles from './login.module.css';

type FieldErrors = {
  correo?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};

    if (!correo.trim()) {
      nextErrors.correo = 'Ingresa tu correo electrónico.';
    } else if (!emailRef.current?.checkValidity()) {
      nextErrors.correo = 'Ingresa un correo válido.';
    }

    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    setErrors(nextErrors);
    setError('');

    if (nextErrors.correo || nextErrors.password) {
      (nextErrors.correo ? emailRef : passwordRef).current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await login(correo.trim(), password);
      saveSession(token, remember);

      const destination =
        getSessionUser()?.rol === 'ADMIN' ? '/admin/productos' : '/';

      router.replace(destination);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible conectar con el servidor.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar si Google retornó con access_token en el hash de la URL (#access_token=ya29...)
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('error='))) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const authError = params.get('error');

      // Limpiar hash de la URL para que no quede visible
      window.history.replaceState(null, '', window.location.pathname);

      queueMicrotask(() => {
        if (authError) {
          setIsSubmitting(true);
          void loginWithGoogle({ error: authError })
            .catch((err: unknown) => {
              setError(
                err instanceof Error
                  ? err.message
                  : 'El proceso de inicio de sesión con Google fue cancelado.',
              );
            })
            .finally(() => setIsSubmitting(false));
          return;
        }

        if (accessToken || idToken) {
          setIsSubmitting(true);
          void (async () => {
            try {
              const token = await loginWithGoogle({
                token: accessToken || undefined,
                credential: idToken || undefined,
              });
              saveSession(token, true);

              const destination =
                getSessionUser()?.rol === 'ADMIN' ? '/admin/productos' : '/';
              router.replace(destination);
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'No fue posible completar el inicio de sesión con Google.',
              );
            } finally {
              setIsSubmitting(false);
            }
          })();
        }
      });
    }
  }, [router]);

  function handleGoogleLogin() {
    setError('');

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '226767961526-tvt08tg96u9bv0vjbakuagkt714po0d1.apps.googleusercontent.com';

    if (!clientId) {
      setError(
        'Para redirigirte a la página oficial de Google donde eliges tu cuenta, debes configurar la variable NEXT_PUBLIC_GOOGLE_CLIENT_ID en el archivo .env con tu Client ID de Google Cloud Console.',
      );
      return;
    }

    setIsSubmitting(true);
    const redirectUri = `${window.location.origin}/login`;
    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid email profile',
        prompt: 'select_account',
      }).toString();

    window.location.href = googleAuthUrl;
  }

  return (
    <section className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/cuenta" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Volver a mi cuenta</span>
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.photo}>
          <Image
            src="/images/login.png"
            alt="Caja de macarons Brisée Bake"
            fill
            sizes="(max-width: 760px) 100vw, 45vw"
            className={styles.photoImage}
            priority
          />
        </div>

        <div className={styles.content}>
          <h1>¡Bienvenido!</h1>

          <p className={styles.intro}>
            Inicia sesión para realizar pedidos y consultar tus compras
          </p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className={styles.form}
          >
            <label htmlFor="login-correo">Correo electrónico</label>

            <div className={styles.inputBox}>
              <Mail size={19} aria-hidden="true" />

              <input
                id="login-correo"
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="Ingrese su correo electrónico"
                value={correo}
                aria-invalid={!!errors.correo}
                aria-describedby={
                  errors.correo ? 'login-correo-error' : undefined
                }
                onChange={(event) => {
                  setCorreo(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    correo: undefined,
                  }));
                  setError('');
                }}
              />
            </div>

            {errors.correo && (
              <span
                id="login-correo-error"
                className={styles.fieldError}
              >
                {errors.correo}
              </span>
            )}

            <label htmlFor="login-password">Contraseña</label>

            <div className={styles.inputBox}>
              <LockKeyhole size={19} aria-hidden="true" />

              <input
                id="login-password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingrese su contraseña"
                value={password}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password
                    ? 'login-password-error'
                    : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                  setError('');
                }}
              />

              <button
                type="button"
                className={styles.showPassword}
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? (
                  <EyeOff size={19} aria-hidden="true" />
                ) : (
                  <Eye size={19} aria-hidden="true" />
                )}
              </button>
            </div>

            {errors.password && (
              <span
                id="login-password-error"
                className={styles.fieldError}
              >
                {errors.password}
              </span>
            )}

            <div className={styles.options}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                />
                Recordarme
              </label>

              <span
                className={styles.pending}
                title="Disponible próximamente"
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>o continúa con</span>
          </div>

          <button
            className={styles.google}
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleGoogleLogin()}
          >
            <span className={styles.googleMark} aria-hidden="true">
              G
            </span>
            Continuar con Google
          </button>

          <p className={styles.register}>
            ¿No tienes cuenta?
            <br />
            <Link href="/registro">Crea una cuenta</Link>
          </p>
        </div>
      </div>
    </section>
  );
}