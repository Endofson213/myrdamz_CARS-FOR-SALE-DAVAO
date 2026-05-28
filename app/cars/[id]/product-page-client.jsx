"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent} from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  MapPin,
  Menu,
  Sparkles,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { formatMileage, formatPrice } from "../../data/vehicles";
import Image from "next/image";
import logo from "../../pictures/LogoMYRDAMZ.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.72, ease: [0.19, 1, 0.22, 1] }
  }
};
const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08
    }
  }
};
 
function ProductHeader() {

   const [isScrolled, setIsScrolled] = useState(false);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
  setIsScrolled(latest > 30);
  if (latest > 30) setIsMenuOpen(false);
});
  return (
    
    <header
    className={`site-header ${isScrolled ? "is-scrolled" : ""}`}
  >
    <Link className="brand" href="/" aria-label="Myrdamz Cars for Sales Davao home">
      <motion.span
       className="brand-mark"
            animate={{ rotate: [0, 6, -4, 0], boxShadow: ["0 0 0 rgba(143,29,36,0)", "0 0 38px rgba(143,29,36,.3)", "0 0 0 rgba(143,29,36,0)"] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={logo}
          alt="Myrdamz Cars for Sales Davao logo"
          width={45}
          height={45}
          className="brand-logo"
        />
      </motion.span>

      <span>
        <strong>Myrdamz</strong>
        <small>Cars for Sales Davao</small>
      </span>
    </Link>

    <button
      className="menu-toggle"
      type="button"
      aria-label="Toggle navigation menu"
      aria-expanded={isMenuOpen}
      onClick={() => setIsMenuOpen((open) => !open)}
    >
      {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
    </button>

    <nav className={`nav-links ${isMenuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
      <a href="/#catalog" onClick={() => setIsMenuOpen(false)}>CATALOG</a>
      <a href="/#contact" onClick={() => setIsMenuOpen(false)}>CONTACT</a>
    </nav>
  </header>
  );
}

function SpecTile({ icon: Icon, label, value }) {
  return (
    <motion.li variants={fadeUp}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </motion.li>
  );
}

function DescriptionBlock({ text }) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const detailLines = lines.filter((line) => !/^[-*]\s+/.test(line) && !/(downpayment|financing)/i.test(line));
  const noteLines = lines.filter((line) => !/^[-*]\s+/.test(line) && /(downpayment|financing)/i.test(line));
  const bulletLines = lines
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, ""));

  return (
    <div className="spec-description-card">
      {detailLines.length > 0 && (
        <div className="spec-description-lines">
          {detailLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {(noteLines.length > 0 || bulletLines.length > 0) && (
        <div className="spec-inclusion-details">
          {noteLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {bulletLines.length > 0 && (
            <ul>
              {bulletLines.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductPageClient({ vehicle, related }) {
  const vehicleStatus = vehicle.status || "Available";
  const sold = vehicleStatus === "Sold";
  const reserved = vehicleStatus === "Reserved";
  const unavailable = sold || reserved;
  const galleryImages = useMemo(
    () => Array.from(new Set([...(vehicle.images || []), vehicle.image].filter(Boolean))),
    [vehicle.images, vehicle.image]
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState(1);
  const activeImage = galleryImages[activeImageIndex] || vehicle.image;
  const coverImage = galleryImages[0] || vehicle.image;
  const specs = [
    ["Year", vehicle.year, BadgeCheck],
    ["Mileage", formatMileage(vehicle.mileage), Gauge],
    ["Fuel", vehicle.fuel, Fuel],
    ["Transmission", vehicle.transmission, CarFront],
    ["Seats", `${vehicle.seats} seats`, Users],
    ["Viewing", "Davao City", MapPin]
  ];

  return (
    <main className="product-page" style={{ "--accent": vehicle.accent }}>
      <ProductHeader />

      <section className="product-hero">
        <motion.div
          className="product-hero-bg"
          style={{ backgroundImage: `url("${coverImage}")` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.35, ease: [0.19, 1, 0.22, 1] }}
        />
        <div className="scan-lines" aria-hidden="true" />
        <Link className="back-link" href="/#catalog">
          <ArrowLeft size={17} /> Back to catalog
        </Link>
        <motion.div className="product-hero-grid" variants={stagger} initial="hidden" animate="visible">
          <motion.div className="product-copy" variants={fadeUp}>
            <p className="eyebrow">
              <Sparkles size={16} /> {sold ? "Sold" : vehicleStatus === "Reserved" ? "Reserved" : vehicle.badge} / {vehicle.type}
            </p>
            <h1>{vehicle.name}</h1>
          </motion.div>

          <motion.aside className="price-stage" variants={fadeUp}>
            <span>Posted price</span>
            <strong>{formatPrice(vehicle.price)}</strong>
            <p>{sold ? "This unit has been marked sold. Browse related units for available options." : reserved ? "This unit is currently reserved. Browse related units for available options." : "No checkout wall. Confirm availability and viewing schedule offline."}</p>
            <div className="price-ring" aria-hidden="true">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }} />
            </div>
          </motion.aside>
        </motion.div>
      </section>

      <section className="product-detail-section">
        <motion.div className="product-image-panel" initial={{ opacity: 0, y: 42 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.75 }}>
          <div className="product-gallery">
            <AnimatePresence initial={false}>
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={`${vehicle.name} photo ${activeImageIndex + 1}`}
                initial={{ x: imageDirection > 0 ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: imageDirection > 0 ? "-100%" : "100%" }}
                transition={{ duration: 0.36, ease: [0.19, 1, 0.22, 1] }}
              />
            </AnimatePresence>
            {galleryImages.length > 1 && (
              <>
                <button
                  className="gallery-arrow gallery-arrow-prev"
                  type="button"
                  aria-label="Previous vehicle photo"
                  onClick={() => {
                    setImageDirection(-1);
                    setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="gallery-arrow gallery-arrow-next"
                  type="button"
                  aria-label="Next vehicle photo"
                  onClick={() => {
                    setImageDirection(1);
                    setActiveImageIndex((current) => (current + 1) % galleryImages.length);
                  }}
                >
                  <ChevronRight size={22} />
                </button>
                <span className="gallery-count">
                  {activeImageIndex + 1} / {galleryImages.length}
                </span>
              </>
            )}
          </div>
          <div className="inquiry-card image-inquiry-card">
            <div>
              <p className="eyebrow">Selected unit</p>
              <h3>{vehicle.name}</h3>
              <strong>{formatPrice(vehicle.price)}</strong>
            </div>
            {unavailable ? (
              <button className="button button-primary" type="button" disabled>
                {sold ? "Sold" : "Reserved"}
              </button>
            ) : (
              <Link className="button button-primary" href={`/?inquire=${vehicle.id}#contact`}>
                Prepare Inquiry <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div className="spec-panel" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <div className="section-heading compact">
            <p className="eyebrow">Vehicle profile</p>
            <h2 className="vehicle-profile-title">{vehicle.name}</h2>
            <DescriptionBlock text={vehicle.description} />
          </div>
          <ul className="product-spec-grid">
            {specs.map(([label, value, Icon]) => (
              <SpecTile key={label} icon={Icon} label={label} value={value} />
            ))}
          </ul>
        </motion.div>
      </section>

      <section className="related-section" aria-labelledby="related-title">
        <div className="section-heading compact">
          <p className="eyebrow">Keep browsing</p>
          <h2 id="related-title">Related units</h2>
        </div>
        <div className="related-grid">
          {related.map((item, index) => (
            <motion.article
              className="related-card"
              key={item.id}
              style={{ "--accent": item.accent }}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <Link href={`/cars/${item.id}`}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <div>
                  <span>{item.status === "Sold" ? "Sold" : item.status === "Reserved" ? "Reserved" : item.badge}</span>
                  <h3>{item.name}</h3>
                  <strong>{formatPrice(item.price)}</strong>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>Myrdamz Cars for Sales Davao. Product page for {vehicle.name}.</p>
        <p>Representative images from Pexels and Unsplash research.</p>
      </footer>
    </main>
  );
}
