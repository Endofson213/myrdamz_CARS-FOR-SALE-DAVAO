"use client";

import { motion, useScroll, useMotionValueEvent} from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CarFront,
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
      <a href="/#catalog" onClick={() => setIsMenuOpen(false)}>Catalog</a>
      <a href="/#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
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

export default function ProductPageClient({ vehicle, related }) {
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
          style={{ backgroundImage: `url("${vehicle.image}")` }}
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
              <Sparkles size={16} /> {vehicle.badge} / {vehicle.type}
            </p>
            <h1>{vehicle.name}</h1>
            <p>{vehicle.description}</p>
          </motion.div>

          <motion.aside className="price-stage" variants={fadeUp}>
            <span>Posted price</span>
            <strong>{formatPrice(vehicle.price)}</strong>
            <p>No checkout wall. Confirm availability and viewing schedule offline.</p>
            <div className="price-ring" aria-hidden="true">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }} />
            </div>
          </motion.aside>
        </motion.div>
      </section>

      <section className="product-detail-section">
        <motion.div className="product-image-panel" initial={{ opacity: 0, y: 42 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.75 }}>
          <img src={vehicle.image} alt={vehicle.name} />
          <div className="inquiry-card image-inquiry-card">
            <div>
              <p className="eyebrow">Selected unit</p>
              <h3>{vehicle.name}</h3>
              <strong>{formatPrice(vehicle.price)}</strong>
            </div>
            <Link className="button button-primary" href={`/#contact`}>
              Prepare Inquiry <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>

        <motion.div className="spec-panel" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <div className="section-heading compact">
            <p className="eyebrow">Vehicle profile</p>
            <h2>Specs at a glance</h2>
            <p>Built for quick buyer evaluation before a Davao viewing appointment.</p>
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
                  <span>{item.badge}</span>
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
