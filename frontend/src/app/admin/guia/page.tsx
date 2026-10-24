import type { ReactElement } from 'react';
import Link from 'next/link';

import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ImageIcon,
  Play,
  Sparkles,
} from 'lucide-react';

import styles from '../../guia-cliente/guia-cliente.module.css';

type Point = {
  label: string;
  text: string;
};

type Screen = {
  title: string;
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
    id: 'acceso',
    title: 'Tu tienda, en buenas manos',
    short: 'Acceso y navegación',
    intro:
      'Inicia sesión con una cuenta que tenga el rol de administrador. La barra “BRISÉE BAKE ADMIN” y el menú “Administración” te permiten reconocer tu espacio de trabajo.',
    screens: [
      {
        title: 'Barra y menú del administrador',
        image: null,
        points: [
          {
            label: 'Barra administrativa',
            text: 'Identifica la vista de administración en la parte superior de la página.',
          },
          {
            label: 'Botón + superior',
            text: 'Abre el formulario para crear un producto nuevo sin tener que entrar primero a un subcatálogo.',
          },
          {
            label: 'Menú Administración',
            text: 'Despliega las opciones Administrar productos, Crear producto, Administrar pedidos y Administrar clientes.',
          },
          {
            label: 'Vista previa',
            text: 'Regresa a la página principal para revisar la tienda. Tu sesión de administrador sigue activa.',
          },
        ],
      },
    ],
    note:
      'Para guardar un producto, utiliza la acción del formulario correspondiente. El botón general “Guardar cambios” del header no sustituye el envío del formulario.',
  },
  {
    id: 'productos',
    title: 'Cada delicia en su lugar',
    short: 'Administrar productos',
    intro:
      'Abre Administración y selecciona “Administrar productos”. Esta pantalla reúne el catálogo y permite encontrar el producto con el que necesitas trabajar.',
    screens: [
      {
        title: 'Catálogo de productos del administrador',
        image: null,
        points: [
          {
            label: 'Crear producto',
            text: 'Selecciona “+ Crear producto” para abrir el formulario de registro de un nuevo artículo.',
          },
          {
            label: 'Buscar producto',
            text: 'Escribe el nombre o la categoría en el buscador para localizar el artículo que necesitas.',
          },
          {
            label: 'Tarjetas del catálogo',
            text: 'Identifica el producto por su fotografía, nombre, descripción y precio antes de realizar cambios.',
          },
        ],
      },
    ],
  },
  {
    id: 'subcatalogos',
    title: 'Gestiona desde cada colección',
    short: 'Acciones en subcatálogos',
    intro:
      'Desde Catálogo, entra a la colección que necesitas, como galletas, macarons o granolas. Con tu sesión administrativa puedes crear, editar y eliminar productos desde los controles disponibles en cada subcatálogo.',
    screens: [
      {
        title: 'Productos de un subcatálogo',
        image: null,
        points: [
          {
            label: 'Producto que vas a gestionar',
            text: 'Localiza la tarjeta del artículo y revisa su nombre para seleccionar el producto correcto.',
          },
          {
            label: 'Ícono de lápiz',
            text: 'Abre la edición del producto asociado a esa tarjeta.',
          },
          {
            label: 'Añadir producto',
            text: 'Selecciona la tarjeta con el símbolo + para iniciar la creación de un artículo desde el subcatálogo.',
          },
          {
            label: 'Eliminar',
            text: 'Utiliza la opción de eliminación disponible para el producto. Revisa el artículo antes de completar la acción.',
          },
          {
            label: 'Ver más',
            text: 'Consulta la información ampliada del producto antes de decidir qué necesitas actualizar.',
          },
        ],
      },
    ],
    note:
      'El botón + de la barra superior y la tarjeta “Añadir producto” son accesos para crear productos. Al abrir el formulario, revisa la categoría seleccionada antes de guardarlo.',
  },
  {
    id: 'crear',
    title: 'Dale la bienvenida a un nuevo antojo',
    short: 'Crear un producto',
    intro:
      'Puedes comenzar desde el + superior, Administración → Crear producto, el botón “+ Crear producto” del catálogo administrativo o la tarjeta “Añadir producto” de un subcatálogo.',
    screens: [
      {
        title: 'Formulario de creación de producto',
        image: null,
        points: [
          {
            label: 'Nombre del producto',
            text: 'Escribe un nombre claro que permita reconocer el artículo en el catálogo.',
          },
          {
            label: 'Descripción',
            text: 'Describe el producto y su presentación. Completa los campos obligatorios señalados con un asterisco.',
          },
          {
            label: 'Información restante',
            text: 'Desplázate por el formulario y completa los demás datos solicitados. Revisa la categoría, el precio y la información de imagen que correspondan al producto.',
          },
          {
            label: 'Guardar el producto',
            text: 'Utiliza el botón de envío del formulario. Si aparece un error, corrige lo indicado; cuando se confirme la creación, verifica el artículo en el catálogo.',
          },
          {
            label: 'Volver a productos',
            text: 'Regresa al catálogo administrativo mediante el enlace que está sobre el formulario.',
          },
        ],
      },
    ],
    note:
      'Antes de guardar, verifica que el nombre, la descripción, la categoría, el precio y la imagen correspondan al mismo producto.',
  },
  {
    id: 'editar',
    title: 'Los pequeños detalles también cuentan',
    short: 'Editar un producto',
    intro:
      'Cuando necesites actualizar un artículo, localízalo en su subcatálogo y selecciona el ícono de lápiz de su tarjeta.',
    screens: [
      {
        title: 'Edición de un producto',
        image: null,
        points: [
          {
            label: 'Identificar el producto',
            text: 'Comprueba que el formulario corresponde al artículo que quieres modificar.',
          },
          {
            label: 'Actualizar la información',
            text: 'Cambia los datos necesarios y revisa los campos obligatorios antes de continuar.',
          },
          {
            label: 'Guardar la edición',
            text: 'Envía los cambios mediante el botón del formulario y revisa el mensaje que muestre la aplicación.',
          },
          {
            label: 'Verificar en el catálogo',
            text: 'Vuelve a consultar el artículo y comprueba que la información quedó como esperabas.',
          },
        ],
      },
    ],
  },
  {
    id: 'eliminar',
    title: 'Un catálogo siempre al día',
    short: 'Eliminar un producto',
    intro:
      'Usa la opción de eliminación cuando corresponda retirar un producto. Antes de completarla, verifica cuidadosamente cuál artículo seleccionaste.',
    screens: [
      {
        title: 'Eliminación de un producto',
        image: null,
        points: [
          {
            label: 'Seleccionar el artículo',
            text: 'Busca el producto en el subcatálogo y revisa su nombre e imagen.',
          },
          {
            label: 'Opción Eliminar',
            text: 'Selecciona la acción de eliminación correspondiente a ese producto.',
          },
          {
            label: 'Revisar la acción',
            text: 'Si la aplicación muestra una confirmación, léela y continúa únicamente si deseas eliminar ese artículo.',
          },
          {
            label: 'Comprobar el resultado',
            text: 'Revisa el mensaje de la aplicación y consulta el catálogo para verificar el resultado.',
          },
        ],
      },
    ],
    note:
      'Si únicamente necesitas corregir el nombre, el precio o la descripción, utiliza la edición del producto.',
  },
  {
    id: 'pedidos',
    title: 'De la cocina a una entrega feliz',
    short: 'Administrar pedidos',
    intro:
      'En Administración → Administrar pedidos puedes consultar las compras recibidas y organizar su preparación y entrega.',
    screens: [
      {
        title: 'Consulta de pedidos',
        image: null,
        points: [
          {
            label: 'Activos',
            text: 'Consulta los pedidos que todavía requieren atención. El número de la pestaña indica cuántos hay en ese grupo.',
          },
          {
            label: 'Entregados',
            text: 'Consulta los pedidos cuya entrega ya fue registrada y el contador de ese grupo.',
          },
          {
            label: 'Número y fecha del pedido',
            text: 'Identifica la compra para relacionarla con la conversación o consulta del cliente.',
          },
          {
            label: 'Cliente',
            text: 'Revisa el nombre y el correo de la persona que realizó la compra.',
          },
          {
            label: 'Productos y total',
            text: 'Consulta los artículos, sus cantidades y el valor del pedido antes de preparar la entrega.',
          },
        ],
      },
      {
        title: 'Actualizar el estado de entrega',
        image: null,
        points: [
          {
            label: 'Localizar el pedido',
            text: 'Encuentra el pedido que vas a actualizar y revisa que su número y cliente sean correctos.',
          },
          {
            label: 'Estado de entrega',
            text: 'Busca el selector en la parte inferior de la tarjeta del pedido.',
          },
          {
            label: 'Marcar como Entregado',
            text: 'Cuando la entrega se haya completado, cambia el estado de Pendiente a Entregado.',
          },
          {
            label: 'Revisar Entregados',
            text: 'Comprueba que el pedido aparece en esa pestaña y que los contadores se actualizaron.',
          },
        ],
      },
    ],
    note:
      'El estado de entrega representa la entrega del pedido. Marcarlo como Entregado no equivale a registrar o verificar un pago.',
  },
  {
    id: 'clientes',
    title: 'Las personas detrás de cada pedido',
    short: 'Clientes y permisos',
    intro:
      'En Administración → Administrar clientes puedes consultar las cuentas registradas y gestionar el rol de las cuentas que permiten modificarlo.',
    screens: [
      {
        title: 'Listado de clientes',
        image: null,
        points: [
          {
            label: 'Cantidad de clientes',
            text: 'Consulta el total de cuentas que muestra el encabezado del listado.',
          },
          {
            label: 'Nombre, correo y celular',
            text: 'Identifica a la persona y revisa los datos de contacto asociados a su cuenta.',
          },
          {
            label: 'Registro',
            text: 'Consulta la fecha y hora de creación de la cuenta.',
          },
          {
            label: 'Estado',
            text: 'Observa el estado que muestra la cuenta en la tabla.',
          },
          {
            label: 'Rol',
            text: 'En las filas habilitadas, abre el selector y elige Cliente o Administrador según los permisos que deba tener esa persona.',
          },
          {
            label: 'Verificar el cambio',
            text: 'Comprueba el resultado mostrado por la aplicación. Si un selector está deshabilitado, no permite modificar esa cuenta desde esa fila.',
          },
        ],
      },
    ],
    note:
      'El rol Administrador da acceso a las funciones de gestión. Antes de cambiarlo, confirma el correo y el nombre de la cuenta que seleccionaste.',
  },
  {
    id: 'manuales',
    title: 'Una guía para cada recorrido',
    short: 'Manuales y ayuda',
    intro:
      'El ícono de ayuda del header reúne los manuales de Brisée Bake. Como administrador, puedes escoger la guía que necesitas consultar desde su submenú.',
    screens: [
      {
        title: 'Submenú de manuales',
        image: null,
        points: [
          {
            label: 'Ícono de ayuda',
            text: 'Selecciona el símbolo de interrogación ubicado en el header para desplegar las opciones.',
          },
          {
            label: 'Guía del cliente',
            text: 'Consulta las instrucciones para registrarse, explorar productos, realizar compras y consultar pedidos.',
          },
          {
            label: 'Guía del administrador',
            text: 'Consulta las instrucciones para gestionar productos, pedidos, clientes y permisos.',
          },
          {
            label: 'Elegir una guía',
            text: 'Selecciona el manual que quieres abrir. El submenú se cerrará al navegar a la guía.',
          },
        ],
      },
    ],
    note:
      'Puedes cerrar el submenú pulsando nuevamente el ícono de ayuda, haciendo clic fuera de él o presionando Escape.',
  },
  {
    id: 'cuenta',
    title: 'Tu espacio de administración',
    short: 'Mi cuenta y cierre de sesión',
    intro:
      'El ícono de perfil permite acceder a la cuenta con la que estás trabajando. Desde allí puedes identificar tu sesión administrativa y finalizarla al terminar.',
    screens: [
      {
        title: 'Cuenta del administrador',
        image: null,
        points: [
          {
            label: 'Ícono de perfil',
            text: 'Selecciona el ícono de usuario del header para ingresar a tu cuenta.',
          },
          {
            label: 'Cuenta con sesión activa',
            text: 'Consulta el correo de la cuenta que está utilizando la plataforma.',
          },
          {
            label: 'Cerrar sesión',
            text: 'Selecciona esta opción para finalizar el acceso con tu cuenta administrativa.',
          },
          {
            label: 'Volver a ingresar',
            text: 'Cuando necesites administrar la tienda nuevamente, inicia sesión con tus credenciales.',
          },
        ],
      },
    ],
    note:
      'Cierra la sesión cuando termines, especialmente si utilizas un computador compartido.',
  },
];

// Para incorporar el video:
// 1. Guárdalo en public/videos/guia-admin.mp4.
// 2. Cambia null por '/videos/guia-admin.mp4'.

const VIDEO_SRC: string | null = null;

function Screenshot({
  screen,
}: {
  screen: Screen;
}): ReactElement {
  return (
    <div className={styles.walkthrough}>
      <figure className={styles.figure}>
        <div className={styles.screenTop}>
          <span aria-hidden="true">● ● ●</span>
          <span>{screen.title}</span>
        </div>

        {screen.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.screenshot}
            src={screen.image}
            alt={`Captura de ${screen.title}; sus elementos se explican a continuación.`}
            loading="lazy"
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

            <span>
              Espacio reservado para la captura
            </span>

            <div
              className={styles.numberRow}
              aria-label={`${screen.points.length} elementos por identificar`}
            >
              {screen.points.map((point, index) => (
                <span key={point.label}>
                  {index + 1}
                </span>
              ))}
            </div>
          </div>
        )}

        <figcaption>
          Relaciona cada número de la captura con su
          explicación.
        </figcaption>
      </figure>

      <div className={styles.legend}>
        <h3>{screen.title}</h3>

        <ol>
          {screen.points.map((point, index) => (
            <li key={point.label}>
              <span
                className={styles.pointNumber}
                aria-hidden="true"
              >
                {index + 1}
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

export default function AdminGuidePage(): ReactElement {
  return (
    <main
      className={styles.page}
      id="guia-inicio"
    >
      <div className={styles.container}>
        <Link
          href="/admin/productos"
          className={styles.backLink}
        >
          <ArrowLeft
            size={19}
            aria-hidden="true"
          />

          Volver a administrar productos
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <BookOpen
                size={17}
                aria-hidden="true"
              />

              GUÍA DEL ADMINISTRADOR
            </p>

            <h1>
              El cuidado detrás
              <br />
              <em>de cada detalle.</em>
            </h1>

            <p>
              Productos que enamoran, pedidos bien
              organizados y clientes que vuelven.
              Te acompañamos a gestionar Brisée Bake,
              paso a paso.
            </p>

            <a
              href="#acceso"
              className={styles.primaryLink}
            >
              Comenzar el recorrido

              <ArrowUpRight
                size={19}
                aria-hidden="true"
              />
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
              Creado con amor.
              <br />
              Gestionado con cuidado.
            </p>

            <span className={styles.heroSeal}>
              TU GUÍA PARA ADMINISTRAR
            </span>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav
              aria-label="Contenido de la guía administrativa"
              className={styles.index}
            >
              <p className={styles.eyebrow}>
                EN ESTA GUÍA
              </p>

              <h2>Tu tienda, paso a paso.</h2>

              <ol>
                {chapters.map((chapter, index) => (
                  <li key={chapter.id}>
                    <a href={`#${chapter.id}`}>
                      <span>
                        {String(index + 1).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      {chapter.short}
                    </a>
                  </li>
                ))}
              </ol>

              <a
                className={styles.videoLink}
                href="#video"
              >
                <Play
                  size={15}
                  aria-hidden="true"
                />

                Video del recorrido
              </a>
            </nav>

            <p className={styles.sidebarNote}>
              Consulta una tarea específica o recorre
              toda la guía a tu ritmo.
            </p>
          </aside>

          <div className={styles.content}>
            <div className={styles.readingTip}>
              <Sparkles
                size={21}
                aria-hidden="true"
              />

              <p>
                <strong>
                  Cada detalle tiene su lugar.
                </strong>

                Encuentra los accesos y las acciones
                de cada pantalla en sus explicaciones
                numeradas.
              </p>
            </div>

            {chapters.map((chapter, index) => (
              <section
                className={styles.chapter}
                id={chapter.id}
                key={chapter.id}
                aria-labelledby={`${chapter.id}-title`}
              >
                <header
                  className={styles.chapterHeader}
                >
                  <span
                    className={styles.chapterNumber}
                  >
                    {String(index + 1).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div>
                    <p className={styles.eyebrow}>
                      {chapter.short}
                    </p>

                    <h2 id={`${chapter.id}-title`}>
                      {chapter.title}
                    </h2>
                  </div>
                </header>

                <p className={styles.intro}>
                  {chapter.intro}
                </p>

                {chapter.screens.map((screen) => (
                  <Screenshot
                    key={screen.title}
                    screen={screen}
                  />
                ))}

                {chapter.note && (
                  <aside className={styles.note}>
                    <span>Ten en cuenta</span>
                    <p>{chapter.note}</p>
                  </aside>
                )}

                <a
                  href="#guia-inicio"
                  className={styles.topLink}
                >
                  Volver al inicio ↑
                </a>
              </section>
            ))}

            <section
              className={styles.videoSection}
              id="video"
              aria-labelledby="video-title"
            >
              <p className={styles.eyebrow}>
                MÍRALO PASO A PASO
              </p>

              <h2 id="video-title">
                La gestión de tu tienda, en video.
              </h2>

              <p>
                Un recorrido por las tareas del
                administrador para acompañar esta guía.
              </p>

              {VIDEO_SRC ? (
                <video
                  className={styles.video}
                  controls
                  preload="metadata"
                  aria-label="Video tutorial del administrador de Brisée Bake"
                >
                  <source
                    src={VIDEO_SRC}
                    type="video/mp4"
                  />

                  Tu navegador no permite reproducir
                  este video.
                </video>
              ) : (
                <div
                  className={styles.videoPlaceholder}
                >
                  <span
                    className={styles.playCircle}
                  >
                    <Play
                      size={27}
                      aria-hidden="true"
                    />
                  </span>

                  <strong>
                    Recorrido del administrador
                  </strong>

                  <span>
                    Mientras se incorpora el video,
                    consulta las instrucciones de
                    cada sección.
                  </span>
                </div>
              )}
            </section>

            <footer className={styles.guideFooter}>
              <span>
                Brisée Bake · Handmade with love
              </span>

              <a href="#guia-inicio">
                Volver al inicio ↑
              </a>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}