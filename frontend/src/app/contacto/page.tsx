'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';

import styles from './contacto.module.css';

const MAP_EMBED_SRC =
   'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1191.0777454138042!2d-75.58386195819763!3d6.171316331055563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMTAnMTUuNiJOIDc1wrAzNCc1OS4yIlc!5e0!3m2!1ses-419!2sco!4v1787681621293!5m2!1ses-419!2sco';


export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });
  const [isSent, setIsSent] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: conectar con el backend cuando exista el endpoint de contacto.
    setIsSent(true);
    setFormData({ nombre: '', email: '', mensaje: '' });

    window.setTimeout(() => setIsSent(false), 4000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.cardsGrid}>
        <section className={styles.infoCard}>
          <h1>Contacto</h1>

          <p className={styles.schedule}>
            Lunes, Miércoles, Jueves, Viernes
            <br />
            8:00 AM - 4:00 PM
          </p>

          <p className={styles.schedule}>
            Sábados
            <br />
            8:00 AM - 12:00 PM
          </p>

          <div className={styles.infoItem}>
            <MapPin aria-hidden="true" className={styles.infoIcon} />
            <div>
              <h2>Ubicación</h2>
              <p>Tv. 54D Sur #52D-52, Zona 9, Medellín, Envigado, Antioquia</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Mail aria-hidden="true" className={styles.infoIcon} />
            <div>
              <h2>Correo</h2>
              <p>briseebake@gmail.com</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Phone aria-hidden="true" className={styles.infoIcon} />
            <div>
              <h2>Teléfono</h2>
              <p>+57 300 3685556</p>
            </div>
          </div>
        </section>

        <section className={styles.formCard}>
          <h1>Deja un mensaje</h1>
          <p className={styles.formSubtitle}>Estamos listos para ayudarte</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              Nombre completo
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(event) =>
                  handleChange('nombre', event.target.value)
                }
              />
            </label>

            <label className={styles.field}>
              Email
              <input
                type="email"
                required
                value={formData.email}
                onChange={(event) =>
                  handleChange('email', event.target.value)
                }
              />
            </label>

            <label className={styles.field}>
              Mensaje
              <textarea
                required
                rows={5}
                value={formData.mensaje}
                onChange={(event) =>
                  handleChange('mensaje', event.target.value)
                }
              />
            </label>

            <button type="submit" className={styles.submitButton}>
              Enviar mensaje
              <ArrowRight aria-hidden="true" />
            </button>

            {isSent && (
              <p className={styles.confirmationMessage} role="status">
                ¡Gracias! Tu mensaje fue registrado.
              </p>
            )}
          </form>
        </section>
      </div>

      <section className={styles.mapContainer}>
        <iframe
          src={MAP_EMBED_SRC}
          title="Ubicación de Brisée Bake"
          loading="lazy"
          allowFullScreen
        />
      </section>
    </div>
  );
}