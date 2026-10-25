import type { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ImageIcon,
  Play,
  Sparkles,
} from 'lucide-react';
import styles from './guia-cliente.module.css';

type Point = {
  label: string;
  text: string;
};

type Screen = {
  title: string;
  file: string;
  image: string | null;
  points: Point[];
};

type Chapter = {
  id: string;
  title: string;
  short: string;
  intro: string;
  screens: Screen[];
  note?: string;
};

const chapters: Chapter[] = [
  {
    id: 'inicio',
    title: 'Conoce tu rincón dulce',
    short: 'La página principal',
    intro:
      'Empieza por conocer la tienda. Desde la página principal puedes explorar nuestras propuestas y encontrar los accesos que te acompañarán durante tu compra.',
    screens: [
      {
        title: 'Página principal y navegación',
        file: 'inicio.png',
        image: '/manual/user/inicio/paginaPrincipal.png',
        points: [
          {
            label: 'Inicio',
            text: 'Regresa a la página principal para conocer Brisée Bake y sus productos destacados.',
          },
          {
            label: 'Catálogo',
            text: 'Accede a las categorías y encuentra los productos que quieres llevar.',
          },
          {
            label: 'Contacto',
            text: 'Encuentra la información para comunicarte con el negocio.',
          },
          {
            label: 'Carrito',
            text: 'Consulta los productos que has seleccionado y revisa tu pedido.',
          },
          {
            label: 'Perfil',
            text: 'Accede a las opciones de ingreso y registro, o consulta tu cuenta si ya iniciaste sesión.',
          },
          {
            label: 'Carrusel',
            text: 'Usa las flechas laterales o los indicadores inferiores para recorrer las imágenes.',
          },
        ],
      },
    ],
    note:
      'Al bajar por la página encontrarás “¿Quiénes somos?” y los detalles que hacen especial a Brisée: sabor, ingredientes frescos y elaboración artesanal.',
  },
  {
    id: 'catalogo',
    title: 'Encuentra tu próximo antojo',
    short: 'Catálogo y productos',
    intro:
      'Explora las categorías de galletas, macarons y granolas. Elige con calma: cada tarjeta reúne la información del producto antes de agregarlo.',
    screens: [
      {
        title: 'Explorar el catálogo',
        file: 'catalogo1.png',
        image: '/manual/user/catalogo/catalogo1.png',
        points: [
          {
            label: 'Categorías',
            text: 'Selecciona la categoría que te interesa para ver sus productos.',
          },
          {
            label: 'Buscador',
            text: 'Escribe parte del nombre del producto que quieres encontrar.',
          },
        ],
      },
      {
        title: 'Seleccionar un producto',
        file: 'catalogo2.png',
        image: '/manual/user/catalogo/catalogo2.png',
        points: [
          {
            label: 'Información del producto',
            text: 'Revisa la fotografía, el nombre, la descripción y el precio. Consulta más información con la opción disponible en la tarjeta.',
          },
          {
            label: 'Cantidad',
            text: 'Usa los controles de aumentar y disminuir para elegir las unidades.',
          },
          {
            label: 'Añadir al carrito',
            text: 'Agrega la cantidad seleccionada. Puedes seguir explorando otros productos y categorías.',
          },
        ],
      },
    ],
  },
  {
    id: 'carrito',
    title: 'Todo lo rico, en un solo lugar',
    short: 'Revisa tu carrito',
    intro:
      'Abre el carrito desde la barra superior. Antes de continuar, revisa los artículos, sus cantidades y el valor de tu pedido.',
    screens: [
      {
        title: 'Mi carrito',
        file: 'carrito.png',
        image: '/manual/user/carrito/carrito.png',
        points: [
          {
            label: 'Productos seleccionados',
            text: 'Comprueba el nombre, la imagen y el precio de cada artículo.',
          },
          {
            label: 'Modificar cantidad',
            text: 'Aumenta o disminuye las unidades. El total se actualiza con los cambios.',
          },
          {
            label: 'Eliminar producto',
            text: 'Retira del carrito un artículo que ya no quieras comprar.',
          },
          {
            label: 'Total del pedido',
            text: 'Revisa el valor de los productos antes de pasar al pago.',
          },
          {
            label: 'Continuar comprando',
            text: 'Regresa al catálogo si quieres agregar algo más.',
          },
          {
            label: 'Pagar',
            text: 'Continúa al proceso de compra cuando tu selección esté lista.',
          },
        ],
      },
    ],
  },
  {
    id: 'acceso',
    title: 'Un espacio para ti',
    short: 'Registro e inicio de sesión',
    intro:
      'Desde el ícono de perfil puedes crear una cuenta o ingresar con tus datos. Si ya tienes sesión activa, puedes seguir con tu compra.',
    screens: [
      {
        title: 'Bienvenida y acceso',
        file: 'bienvenido.png',
        image: '/manual/user/cuenta/bienvenido.png',
        points: [
          {
            label: 'Crear cuenta',
            text: 'Elige esta opción si es tu primera vez en Brisée Bake.',
          },
          {
            label: 'Iniciar sesión',
            text: 'Selecciona esta opción si ya tienes una cuenta registrada.',
          },
        ],
      },
      {
        title: 'Crear una cuenta',
        file: 'registro.png',
        image: '/manual/user/cuenta/crearCuenta.png',
        points: [
          {
            label: 'Datos personales',
            text: 'Completa tu nombre, apellido, teléfono y fecha de nacimiento.',
          },
          {
            label: 'Correo electrónico',
            text: 'Ingresa el correo que usarás para acceder a tu cuenta.',
          },
          {
            label: 'Contraseña y confirmación',
            text: 'Escribe tu contraseña y repítela exactamente igual en la confirmación.',
          },
          {
            label: 'Crear cuenta',
            text: 'Envía el formulario. Si aparece un error, revisa el mensaje y corrige los datos indicados.',
          },
          {
            label: 'Iniciar sesión',
            text: 'Si ya estás registrado, usa el enlace al formulario de ingreso.',
          },
        ],
      },
      {
        title: 'Iniciar sesión',
        file: 'inicio-sesion.png',
        image: '/manual/user/inicio/iniciosesion.png',
        points: [
          {
            label: 'Correo y contraseña',
            text: 'Escribe los datos de tu cuenta y selecciona “Iniciar sesión”.',
          },
          {
            label: 'Mostrar contraseña',
            text: 'Usa el ícono del campo para mostrar u ocultar lo que escribiste.',
          },
        ],
      },
    ],
    note:
      'Si el correo ya está registrado, inicia sesión con esa cuenta. Si las contraseñas no coinciden al registrarte, corrige la confirmación antes de enviar el formulario.',
  },
  {
    id: 'entrega',
    title: '¿Cómo recibirás tu pedido?',
    short: 'Opciones de entrega',
    intro:
      'Al continuar desde el carrito, elige cómo quieres recibir tu compra antes de ir al pago.',
    screens: [
      {
        title: 'Recogida o domicilio',
        file: 'entrega.png',
        image: '/manual/user/entrega/opcionesEntrega.png',
        points: [
          {
            label: 'Recogida en tienda',
            text: 'Selecciona esta opción si recogerás tu pedido en el establecimiento y continúa con el pago.',
          },
          {
            label: 'Domicilio',
            text: 'Selecciona esta opción si necesitas entrega a domicilio.',
          },
          {
            label: 'Aceptación del domicilio',
            text: 'Para domicilio, marca la casilla que confirma que pagarás los productos sin incluir todavía el costo del envío.',
          },
          {
            label: 'Continuar al pago',
            text: 'Revisa tu elección y avanza a la plataforma de pago.',
          },
        ],
      },
    ],
    note:
      'El domicilio se paga después: su costo no se suma al pago de los productos en este paso. Coordina los detalles de la entrega con Brisée Bake.',
  },
  {
    id: 'pago',
    title: 'Un paso más para disfrutar',
    short: 'Pago con Wompi',
    intro:
      'La compra continúa en Wompi. Allí podrás revisar el valor y elegir entre los medios de pago que la plataforma tenga disponibles.',
    screens: [
      {
        title: 'Pago y comprobante en Wompi',
        file: 'wompi.png',
        image: '/manual/user/pagos/wompi.png',
        points: [
          {
            label: 'Valor a pagar',
            text: 'Verifica el total que aparece antes de continuar.',
          },
          {
            label: 'Medio de pago',
            text: 'Elige una de las opciones disponibles y completa la información solicitada por Wompi.',
          },
          {
            label: 'Resultado de la transacción',
            text: 'Sigue las indicaciones y revisa el estado final. Conserva el comprobante cuando el pago se complete.',
          },
        ],
      },
    ],
    note:
      'Si el pago queda pendiente o no se completa, revisa el estado antes de intentarlo nuevamente. Si tienes dudas, consulta con Brisée Bake.',
  },
  {
    id: 'confirmacion',
    title: '¡Tu pedido ya tiene historia!',
    short: 'Confirmación y WhatsApp',
    intro:
      'Cuando el pago se confirma, la pantalla “¡Pago Exitoso!” muestra la compra registrada. Revisa el resumen y continúa con la coordinación de tu entrega.',
    screens: [
      {
        title: 'Confirmación de la compra',
        file: 'confirmacion.png',
        image: '/manual/user/pagos/pagoExitoso.png',
        points: [
          {
            label: 'Resumen de compra',
            text: 'Consulta el número del pedido, los productos, sus cantidades y el total.',
          },
          {
            label: 'Continuar por WhatsApp',
            text: 'Abre la conversación con el mensaje preparado de tu pedido.',
          },
          {
            label: 'Ver mis pedidos',
            text: 'Accede a la sección de pedidos de tu cuenta.',
          },
          {
            label: 'Ir a mi cuenta',
            text: 'Regresa al espacio de tu información personal.',
          },
        ],
      },
      {
        title: 'Coordina la entrega por WhatsApp',
        file: 'whatsapp.png',
        image: '/manual/user/pagos/whatsApp.png',
        points: [
          {
            label: 'Mensaje del pedido',
            text: 'Revisa tu nombre, el número del pedido, los productos, las cantidades y el total.',
          },
          {
            label: 'Enviar mensaje',
            text: 'Envía el mensaje desde WhatsApp para acordar los detalles con Brisée Bake.',
          },
        ],
      },
    ],
    note:
      'Abrir WhatsApp no envía el mensaje automáticamente. Revísalo y presiona enviar para iniciar la conversación.',
  },
  {
    id: 'cuenta',
    title: 'Vuelve cuando quieras',
    short: 'Mi cuenta y mis pedidos',
    intro:
      'Con tu sesión activa, entra a “Mi Cuenta” para consultar tu información y encontrar los accesos de tu compra.',
    screens: [
      {
        title: 'Mi cuenta',
        file: 'mi-cuenta.png',
        image: '/manual/user/cuenta/cuenta.png',
        points: [
          {
            label: 'Información personal',
            text: 'Consulta tu nombre, apellido, teléfono, fecha de nacimiento y correo electrónico.',
          },
          {
            label: 'Editar datos',
            text: 'Accede a la opción para actualizar tu información personal y sigue las indicaciones del formulario.',
          },
          {
            label: 'Mis pedidos',
            text: 'Ingresa a la sección donde puedes consultar tus pedidos registrados.',
          },
          {
            label: 'Ver mi carrito',
            text: 'Regresa a los productos de tu carrito.',
          },
          {
            label: 'Cerrar sesión',
            text: 'Finaliza el acceso a tu cuenta cuando termines, especialmente si usas un equipo compartido.',
          },
        ],
      },
    ],
  },
  {
    id: 'contacto',
    title: 'Estamos para acompañarte',
    short: 'Contacto y ubicación',
    intro:
      'Si necesitas ayuda, consulta los datos de Brisée Bake en el pie de página de la tienda.',
    screens: [
      {
        title: 'Información de contacto',
        file: 'contacto.png',
        image: '/manual/user/ayuda/contacto.png',
        points: [
          {
            label: 'Teléfono y correo',
            text: 'Encuentra los canales de contacto del negocio.',
          },
          {
            label: 'Dirección y mapa',
            text: 'Consulta dónde se encuentra el establecimiento.',
          },
          {
            label: 'Horarios de atención',
            text: 'Revisa los días y horarios publicados antes de planear tu visita.',
          },
        ],
      },
    ],
  },
];

const VIDEO_SRC = 'https://www.youtube.com/embed/cVPvYHLl94o';

function Screenshot({ screen }: { screen: Screen }): ReactElement {
  return (
    <div className={styles.walkthrough}>
      <figure className={styles.figure}>
        <div className={styles.screenTop}>
          <span aria-hidden="true">● ● ●</span>
          <span>{screen.title}</span>
        </div>

        {screen.image ? (
          <Image
            className={styles.screenshot}
            src={screen.image}
            alt={`Captura de ${screen.title}. Los elementos numerados se explican a continuación.`}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 800px"
            style={{
              width: '100%',
              height: 'auto',
            }}
          />
        ) : (
          <div className={styles.placeholder}>
            <ImageIcon
              size={36}
              strokeWidth={1}
              aria-hidden="true"
            />

            <span className={styles.placeholderTitle}>
              {screen.title}
            </span>

            <span>Espacio reservado para la captura</span>

            <div
              className={styles.numberRow}
              aria-label={`${screen.points.length} elementos por identificar en la captura`}
            >
              {screen.points.map((point, i) => (
                <span key={point.label}>{i + 1}</span>
              ))}
            </div>
          </div>
        )}

        <figcaption>
          Los números de la captura corresponden a las explicaciones de esta
          pantalla.
        </figcaption>
      </figure>

      <div className={styles.legend}>
        <h3>{screen.title}</h3>

        <ol>
          {screen.points.map((point, i) => (
            <li key={point.label}>
              <span
                className={styles.pointNumber}
                aria-hidden="true"
              >
                {i + 1}
              </span>

              <div>
                <h4>{point.label}</h4>
                <p>{point.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ClientGuidePage(): ReactElement {
  return (
    <main className={styles.page} id="guia-inicio">
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={19} aria-hidden="true" />
          Volver a Brisée
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <BookOpen size={17} aria-hidden="true" />
              GUÍA DEL CLIENTE
            </p>

            <h1>
              Un recorrido dulce,
              <br />
              <em>paso a paso.</em>
            </h1>

            <p>
              Desde tu primer antojo hasta la llegada de tu pedido. Te
              acompañamos a descubrir, elegir y comprar en Brisée Bake.
            </p>

            <a href="#inicio" className={styles.primaryLink}>
              Comenzar el recorrido
              <ArrowUpRight size={19} aria-hidden="true" />
            </a>
          </div>

          <div className={styles.heroAside}>
            <Sparkles
              size={30}
              strokeWidth={1}
              aria-hidden="true"
            />

            <span className={styles.brand}>
              Brisée
              <span>B A K E</span>
            </span>

            <p>
              Hecho con amor.
              <br />
              Explicado con cuidado.
            </p>

            <span className={styles.heroSeal}>
              TU GUÍA PARA COMPRAR
            </span>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav
              aria-label="Contenido de la guía"
              className={styles.index}
            >
              <p className={styles.eyebrow}>EN ESTA GUÍA</p>

              <h2>¿Por dónde empezamos?</h2>

              <ol>
                {chapters.map((chapter, i) => (
                  <li key={chapter.id}>
                    <a href={`#${chapter.id}`}>
                      <span>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {chapter.short}
                    </a>
                  </li>
                ))}
              </ol>

              <a className={styles.videoLink} href="#video">
                <Play size={15} aria-hidden="true" />
                Video del recorrido
              </a>
            </nav>

            <p className={styles.sidebarNote}>
              Sigue todo el recorrido o ve directamente al tema que necesitas.
            </p>
          </aside>

          <div className={styles.content}>
            <div className={styles.readingTip}>
              <Sparkles size={21} aria-hidden="true" />

              <p>
                <strong>Una guía para ir a tu ritmo.</strong> Cada pantalla
                tiene sus propias explicaciones numeradas. Puedes consultar
                esta página mientras recorres la tienda.
              </p>
            </div>

            {chapters.map((chapter, i) => (
              <section
                className={styles.chapter}
                id={chapter.id}
                key={chapter.id}
                aria-labelledby={`${chapter.id}-title`}
              >
                <header className={styles.chapterHeader}>
                  <span className={styles.chapterNumber}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div>
                    <p className={styles.eyebrow}>{chapter.short}</p>

                    <h2 id={`${chapter.id}-title`}>
                      {chapter.title}
                    </h2>
                  </div>
                </header>

                <p className={styles.intro}>{chapter.intro}</p>

                {chapter.screens.map((screen) => (
                  <Screenshot key={screen.file} screen={screen} />
                ))}

                {chapter.note && (
                  <aside className={styles.note}>
                    <span>Ten en cuenta</span>
                    <p>{chapter.note}</p>
                  </aside>
                )}

                <a href="#guia-inicio" className={styles.topLink}>
                  Volver al inicio ↑
                </a>
              </section>
            ))}

            <section
              className={styles.videoSection}
              id="video"
              aria-labelledby="video-title"
            >
              <p className={styles.eyebrow}>MÍRALO PASO A PASO</p>

              <h2 id="video-title">
                Tu próxima compra, en video.
              </h2>

              <p>
                Un recorrido para acompañar las explicaciones de esta guía.
              </p>

              <iframe
                className={styles.video}
                src={VIDEO_SRC}
                title="Video tutorial para comprar en Brisée Bake"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </section>

            <footer className={styles.guideFooter}>
              <span>Brisée Bake · Handmade with love</span>

              <a href="#guia-inicio">Volver al inicio ↑</a>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}