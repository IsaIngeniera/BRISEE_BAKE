import Image from "next/image";

import { Mail, MapPin, Phone } from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";

import styles from "./Footer.module.css";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1191.0777454138042!2d-75.58386195819763!3d6.171316331055563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNsKwMTAnMTUuNiJOIDc1wrAzNCc1OS4yIlc!5e0!3m2!1ses-419!2sco!4v1787681621293!5m2!1ses-419!2sco";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.mainContent}>
        {/* Logo */}
        <div className={styles.logoColumn}>
          <Image
            src="/images/logo-brisee-transparent.png"
            alt="Logo de Brisée Bake"
            width={230}
            height={230}
            className={styles.logo}
          />
        </div>

        {/* Contact */}
        <section className={styles.section}>
          <h2 className={styles.title}>Contacto</h2>

          <address className={styles.contactList}>
            <a
              href="https://api.whatsapp.com/send?phone=573003685556"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactItem}
              aria-label="Contactar a Brisée Bake por WhatsApp"
            >
              <Phone aria-hidden="true" />

              <span>+57 300 3685556</span>
            </a>

            <a
              href="https://www.google.com/maps?q=Tv.+34D+Sur+%2332D-52,+Envigado,+Antioquia"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactItem}
              aria-label="Abrir dirección en Google Maps"
            >
              <MapPin aria-hidden="true" />

              <span>
                Tv. 34D Sur #32D-52, Zona 9,
                <br />
                Medellín, Envigado, Antioquia
              </span>
            </a>

            <a
              href="mailto:briseebake@gmail.com"
              className={styles.contactItem}
              aria-label="Enviar correo a Brisée Bake"
            >
              <Mail aria-hidden="true" />

              <span>briseebake@gmail.com</span>
            </a>
          </address>
        </section>

        {/* Opening hours */}
        <section className={styles.section}>
          <h2 className={styles.title}>Horario de atención</h2>

          <dl className={styles.schedule}>
            <div className={styles.scheduleRow}>
              <dt>Lunes,  Miercoles,  Jueves, Viernes </dt>
              <dd>8:00 AM - 4:00 PM</dd>
            </div>

            <div className={styles.scheduleRow}>
              <dt>Sábados</dt>
              <dd>8:00 AM - 12:00 PM</dd>
            </div>
          </dl>
        </section>

        {/* Google Maps */}
        <div className={styles.mapContainer}>
          <iframe
            src={GOOGLE_MAPS_URL}
            title="Ubicación de Brisée Bake"
            className={styles.map}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <nav
          className={styles.socialLinks}
          aria-label="Redes sociales de Brisée Bake"
        >
          <a
            href="https://www.instagram.com/briseebake/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Brisée Bake"
          >
            <FaInstagram aria-hidden="true" />
          </a>

          <a
            href="https://www.facebook.com/briseebake"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook de Brisée Bake"
          >
            <FaFacebookF aria-hidden="true" />
          </a>

          <a
            href="https://api.whatsapp.com/send?phone=573003685556"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp de Brisée Bake"
          >
            <FaWhatsapp aria-hidden="true" />
          </a>

          <a
            href="https://www.tiktok.com/@briseebake"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok de Brisée Bake"
          >
            <FaTiktok aria-hidden="true" />
          </a>
        </nav>

        <p className={styles.copyright}>
          Copyright © {new Date().getFullYear()}
        </p>

        <div className={styles.bottomSpacer} aria-hidden="true" />
      </div>
    </footer>
  );
}