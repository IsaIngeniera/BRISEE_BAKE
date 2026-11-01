"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AUTH_TOKEN_KEY,
  getSessionUser,
  type SessionUser,
} from "@/services/auth";

import styles from "./pedidos.module.css";

type BackendOrder = {
  id: string;
  estadoEntrega: string;
  total: number | string;
  createdAt: string;
  fechaEsperada: string;
  tipoEntrega: "ENVIO" | "RETIRO";
  pago?: {
    estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "CANCELADO";
  } | null;
  productos: Array<{
    cantidad: number;
    precioUnitario: number | string;
    producto: {
      id: string;
      nombre: string;
    };
  }>;
};

function formatOrderPrice(price: number | string): string {
  return `COP $ ${Number(price).toLocaleString("es-CO", {
    maximumFractionDigits: 0,
  })}`;
}

function getWhatsAppUrl(
  order: BackendOrder,
  user: SessionUser | null | undefined,
): string {
  const orderNumber = order.id.split("-")[0].toUpperCase();
  const userName = (() => {
    try {
      if (!user) return "";
      const saved = JSON.parse(
        localStorage.getItem(`brisee_profile_${user.sub}`) || "{}",
      );
      const nombre =
        typeof saved.nombre === "string" ? saved.nombre.trim() : "";
      const apellido =
        typeof saved.apellido === "string" ? saved.apellido.trim() : "";
      const fullName = [nombre, apellido].filter(Boolean).join(" ");
      return fullName || user.nombre || "";
    } catch {
      return user?.nombre || "";
    }
  })();

  const products = order.productos
    .map((item) => `• ${item.producto.nombre} × ${item.cantidad}`)
    .join("\n");

  const totalFormat = formatOrderPrice(order.total);

  const message = `¡Hola, Brisée Bake!\n${userName ? `Soy ${userName} y quiero consultar sobre mi pedido.` : "Quiero consultar sobre mi pedido."}\nMi número de pedido es #${orderNumber}.\n\nEstos son los productos:\n${products}\n\nTotal del pedido: ${totalFormat}\n\n¿Podemos coordinar los detalles de la entrega? ¡Muchas gracias!`;

  return `https://wa.me/573003685556?text=${encodeURIComponent(message)}`;
}
export default function CuentaPedidosPage() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sessionUser = getSessionUser();
    setUser(sessionUser);

    if (sessionUser) {
      const token =
        sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(AUTH_TOKEN_KEY);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      fetch(`${apiUrl}/pedidos/mis-pedidos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const data: unknown = await response.json();
          if (!response.ok) {
            throw new Error("No fue posible cargar tus pedidos.");
          }
          return data;
        })
        .then((data) => {
          setOrders(Array.isArray(data) ? (data as BackendOrder[]) : []);
        })
        .catch(() => {
          setLoadError("No fue posible cargar tus pedidos.");
        });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <Link href="/cuenta" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a mi cuenta
        </Link>

        {user === undefined ? (
          <div className={styles.state} role="status">
            Cargando tus pedidos...
          </div>
        ) : !user ? (
          <div className={styles.state}>
            <h1>Mis pedidos</h1>
            <p>Inicia sesión para consultar tus pedidos.</p>
            <Link href="/login" className={styles.actionLink}>
              Iniciar sesión
            </Link>
          </div>
        ) : user.rol === "ADMIN" ? (
          <div className={styles.state}>
            <h1>Mis pedidos</h1>
            <p>Esta sección está disponible para clientes.</p>
          </div>
        ) : (
          <main className={styles.content}>
            <header className={styles.heading}>
              <p className={styles.eyebrow}>HISTORIAL</p>
              <h1>Mis pedidos</h1>
              <p>Consulta el estado y el resumen de tus compras.</p>
            </header>

            {loadError ? (
              <p className={styles.emptyOrders} role="alert">
                {loadError}
              </p>
            ) : orders.length === 0 ? (
              <p className={styles.emptyOrders}>Aún no tienes pedidos</p>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <article key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <strong>
                        Pedido #{order.id.split("-")[0].toUpperCase()}
                      </strong>
                      <span className={styles.orderStatus}>
                        {order.estadoEntrega}
                      </span>
                      <span className={styles.orderStatus}>
                        Pago: {order.pago?.estado ?? "PENDIENTE"}
                      </span>
                    </div>

                    <p className={styles.orderDate}>
                      Fecha solicitada: {order.fechaEsperada}
                    </p>

                    <ul className={styles.orderItems}>
                      {order.productos.map((item) => (
                        <li key={`${order.id}-${item.producto.id}`}>
                          <span>
                            {item.producto.nombre} × {item.cantidad}
                          </span>
                          <strong>
                            {formatOrderPrice(
                              Number(item.precioUnitario) * item.cantidad,
                            )}
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.orderTotal}>
                      <span>
                        {order.tipoEntrega === "ENVIO"
                          ? "Envío a domicilio"
                          : "Recogida en tienda"}
                      </span>
                      <strong>{formatOrderPrice(Number(order.total))}</strong>
                    </div>

                    {order.estadoEntrega.toUpperCase() !== "ENTREGADO" &&
                      order.estadoEntrega.toUpperCase() !== "COMPLETADO" && (
                        <a
                          href={getWhatsAppUrl(order, user)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.whatsappButton}
                        >
                          <MessageCircle size={18} aria-hidden="true" />
                          Continuar por WhatsApp
                        </a>
                      )}
                  </article>
                ))}
              </div>
            )}
          </main>
        )}
      </div>
    </section>
  );
}
