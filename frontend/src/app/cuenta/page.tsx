'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  LogOut,
  Pencil,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  clearSession,
  getSessionUser,
  type SessionUser,
} from '@/services/auth';
import { useCart } from '@/hooks/useCart';

import styles from './cuenta.module.css';

type Profile = {
  nombre: string;
  apellido: string;
  celular: string;
  fechaNacimiento: string;
};

const emptyProfile: Profile = {
  nombre: '',
  apellido: '',
  celular: '',
  fechaNacimiento: '',
};

function readLocalProfile(userId: string): Profile {
  try {
    const saved = JSON.parse(
      localStorage.getItem(`brisee_profile_${userId}`) || '{}',
    ) as Partial<Profile>;

    return {
      nombre: typeof saved.nombre === 'string' ? saved.nombre : '',
      apellido:
        typeof saved.apellido === 'string' ? saved.apellido : '',
      celular:
        typeof saved.celular === 'string' ? saved.celular : '',
      fechaNacimiento:
        typeof saved.fechaNacimiento === 'string'
          ? saved.fechaNacimiento
          : '',
    };
  } catch {
    return { ...emptyProfile };
  }
}

export default function CuentaPage() {
  const router = useRouter();

  const [user, setUser] = useState<
    SessionUser | null | undefined
  >(undefined);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const { clearCart } = useCart();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localtest.me') {
        const search = window.location.search;
        window.location.replace(`http://localhost:3000/cuenta${search}`);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      const statusParam = params.get('status');
      
      // Si Wompi aprueba la transaccion, vaciamos el carrito
      if (idParam && statusParam === 'APPROVED') {
        setTransactionId(idParam);
        clearCart();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    const sessionUser = getSessionUser();
    setUser(sessionUser);

    if (sessionUser) {
      const saved = readLocalProfile(sessionUser.sub);
      setProfile(saved);
      setDraft(saved);
      
      // Fetch orders
      const token = localStorage.getItem('brisee_token');
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pedidos/mis-pedidos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
      } else {
        setLoadingOrders(false);
      }
    } else {
      setLoadingOrders(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clearCart]);

  function updateField(field: keyof Profile, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage('');
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const nextProfile: Profile = {
      nombre: draft.nombre.trim(),
      apellido: draft.apellido.trim(),
      celular: draft.celular.trim(),
      fechaNacimiento: draft.fechaNacimiento,
    };

    try {
      localStorage.setItem(
        `brisee_profile_${user.sub}`,
        JSON.stringify(nextProfile),
      );

      setProfile(nextProfile);
      setDraft(nextProfile);
      setIsEditing(false);
      setMessage('Datos guardados exitosamente.');
    } catch {
      setMessage(
        'No fue posible guardar los datos en este navegador.',
      );
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setIsEditing(false);
    router.replace('/login');
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <Link href="/catalogo" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al catálogo
        </Link>

        {user === undefined ? (
          <div className={styles.state} role="status">
            Cargando tu cuenta...
          </div>
        ) : !user ? (
          <div className={styles.welcomeCard}>
            <p className={styles.welcomeEyebrow}>
              BRISÉE BAKE
            </p>

            <h1>¡Bienvenido!</h1>

            <p className={styles.welcomeIntro}>
              Elige cómo quieres comenzar tu experiencia con
              nosotros.
            </p>

            <div
              className={styles.welcomePhoto}
              role="img"
              aria-label="Ilustración de bienvenida de Brisée Bake"
            >
              <span
                className={styles.welcomeFlower}
                aria-hidden="true"
              >
                ✿
              </span>
            </div>

            <div className={styles.welcomeActions}>
              <Link
                href="/login"
                className={styles.welcomeLogin}
              >
                Iniciar sesión
              </Link>

              <Link
                href="/registro"
                className={styles.welcomeSignup}
              >
                Crear cuenta
              </Link>
            </div>

            <p className={styles.welcomeFooter}>
              Tus momentos dulces comienzan aquí ♡
            </p>
          </div>
        ) : user.rol === 'ADMIN' ? (
          <div className={styles.adminCard}>
            <div className={styles.avatar}>
              <UserRound size={32} aria-hidden="true" />
            </div>

            <p className={styles.eyebrow}>
              BRISÉE BAKE ADMIN
            </p>

            <h1>Panel de administración</h1>
            <p>Sesión iniciada como {user.correo}</p>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <LogOut size={18} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className={styles.avatar}>
                <UserRound
                  size={34}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              <p className={styles.eyebrow}>
                BRISÉE BAKE
              </p>

              <h1>Mi cuenta</h1>

              <p className={styles.welcome}>
                {profile.nombre
                  ? `Hola, ${profile.nombre}`
                  : '¡Qué gusto verte!'}
              </p>

              <p className={styles.email}>
                {user.correo}
              </p>

              <div
                className={styles.separator}
                aria-hidden="true"
              >
                ✿
              </div>

              <Link
                href="/carrito"
                className={styles.cartLink}
              >
                <ShoppingBag
                  size={18}
                  aria-hidden="true"
                />
                Ver mi carrito
              </Link>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                <LogOut size={18} aria-hidden="true" />
                Cerrar sesión
              </button>
            </aside>

            <div className={styles.details}>
              {transactionId && (
                <div className={styles.successBanner}>
                  <h3>¡Pago exitoso!</h3>
                  <p>Tu transacción ha sido aprobada. Número de referencia: <strong>{transactionId}</strong></p>
                </div>
              )}

              <div className={styles.heading}>
                <div>
                  <p className={styles.eyebrow}>
                    TUS DATOS
                  </p>
                  <h2>Información personal</h2>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => {
                      setDraft(profile);
                      setIsEditing(true);
                      setMessage('');
                    }}
                  >
                    <Pencil
                      size={16}
                      aria-hidden="true"
                    />
                    Editar datos
                  </button>
                )}
              </div>

              {message && (
                <p
                  className={styles.status}
                  role="status"
                >
                  {message}
                </p>
              )}

              {isEditing ? (
                <form
                  className={styles.form}
                  onSubmit={saveProfile}
                >
                  <div className={styles.fields}>
                    <label>
                      Nombre
                      <input
                        value={draft.nombre}
                        onChange={(event) =>
                          updateField(
                            'nombre',
                            event.target.value,
                          )
                        }
                        maxLength={50}
                        autoComplete="given-name"
                        required
                      />
                    </label>

                    <label>
                      Apellido
                      <input
                        value={draft.apellido}
                        onChange={(event) =>
                          updateField(
                            'apellido',
                            event.target.value,
                          )
                        }
                        maxLength={50}
                        autoComplete="family-name"
                        required
                      />
                    </label>

                    <label>
                      Teléfono
                      <input
                        value={draft.celular}
                        onChange={(event) =>
                          updateField(
                            'celular',
                            event.target.value,
                          )
                        }
                        maxLength={20}
                        type="tel"
                        autoComplete="tel"
                        required
                      />
                    </label>

                    <label>
                      Fecha de nacimiento
                      <input
                        value={draft.fechaNacimiento}
                        onChange={(event) =>
                          updateField(
                            'fechaNacimiento',
                            event.target.value,
                          )
                        }
                        type="date"
                        required
                      />
                    </label>

                    <label className={styles.wide}>
                      Correo electrónico
                      <input
                        value={user.correo}
                        type="email"
                        readOnly
                        aria-describedby="email-note"
                      />
                      <small id="email-note">
                        El correo no se puede cambiar desde
                        esta vista.
                      </small>
                    </label>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                    >
                      Guardar cambios
                    </button>

                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => {
                        setDraft(profile);
                        setIsEditing(false);
                        setMessage('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.fields}>
                  <div className={styles.field}>
                    <span>Nombre</span>
                    <strong>
                      {profile.nombre ||
                        'Pendiente de completar'}
                    </strong>
                  </div>

                  <div className={styles.field}>
                    <span>Apellido</span>
                    <strong>
                      {profile.apellido ||
                        'Pendiente de completar'}
                    </strong>
                  </div>

                  <div className={styles.field}>
                    <span>Teléfono</span>
                    <strong>
                      {profile.celular ||
                        'Pendiente de completar'}
                    </strong>
                  </div>

                  <div className={styles.field}>
                    <span>Fecha de nacimiento</span>
                    <strong>
                      {profile.fechaNacimiento ||
                        'Pendiente de completar'}
                    </strong>
                  </div>

                  <div
                    className={`${styles.field} ${styles.wide}`}
                  >
                    <span>Correo electrónico</span>
                    <strong>{user.correo}</strong>
                  </div>
                </div>
              )}

              <div className={styles.ordersSection}>
                <div className={styles.heading} style={{ marginTop: '3rem' }}>
                  <div>
                    <p className={styles.eyebrow}>HISTORIAL</p>
                    <h2>Mis pedidos</h2>
                  </div>
                </div>
                
                {loadingOrders ? (
                  <p>Cargando pedidos...</p>
                ) : orders && orders.length > 0 ? (
                  <ul className={styles.ordersList}>
                    {orders.map((o) => (
                      <li key={o.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <p><strong>Fecha:</strong> {new Date(o.createdAt).toLocaleDateString()}</p>
                          <p><strong>Total:</strong> ${Number(o.total).toLocaleString('es-CO')}</p>
                          <p><strong>Estado:</strong> {o.estadoEntrega}</p>
                        </div>
                        <details className={styles.orderDetails}>
                          <summary>Ver productos</summary>
                          <ul>
                            {o.productos.map((p: any) => (
                              <li key={p.producto.id}>{p.cantidad}x {p.producto.nombre}</li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyOrders}>Aún no tienes pedidos.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}