"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent} from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
import { formatMileage, formatPrice, getAssetPath } from "../../data/vehicles";
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

function formatFinancingAmount(value) {
  const normalized = String(value || "").replace(/,/g, "").trim();
  const multiplier = /k$/i.test(normalized) ? 1000 : 1;
  const amount = Number(normalized.replace(/k$/i, "")) * multiplier;

  return Number.isFinite(amount) ? formatPrice(amount) : value;
}

function FinancingBlock({ financing, text }) {
  if (financing?.downPayment || financing?.terms?.some((term) => term.monthlyPayment)) {
    return (
      <div className="financing-card">
        {financing.downPayment > 0 && (
          <div className="financing-downpayment">
            <span>Estimated down payment</span>
            <strong>{formatPrice(financing.downPayment)}</strong>
          </div>
        )}
        <div className="financing-terms">
          {(financing.terms || [])
            .filter((term) => term.monthlyPayment > 0)
            .map(({ years, monthlyPayment }) => (
              <div key={years}>
                <span>{years} {years === 1 ? "year" : "years"}</span>
                <strong>{formatPrice(monthlyPayment)}</strong>
                <small>per month</small>
              </div>
            ))}
        </div>
      </div>
    );
  }

  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const downPaymentMatch = lines
    .map((line) => line.match(/\bDP\s*-\s*(?:DP\s*)?([\d,.]+\s*k?)/i))
    .find(Boolean);
  const downPayment = downPaymentMatch ? formatFinancingAmount(downPaymentMatch[1]) : null;
  const terms = lines.flatMap((line) => {
    const match = line.match(/^(\d+)(?:\s*months?)?\s*-\s*([\d,.]+)/i);
    if (!match) return [];

    const rawTerm = Number(match[1]);
    const years = rawTerm >= 12 ? rawTerm / 12 : rawTerm;
    if (!Number.isInteger(years)) return [];

    return [{
      years,
      payment: formatFinancingAmount(match[2])
    }];
  });

  if (!downPayment && !terms.length) return null;

  return (
    <div className="financing-card">
      {downPayment && (
        <div className="financing-downpayment">
          <span>Estimated down payment</span>
          <strong>{downPayment}</strong>
        </div>
      )}
      {terms.length > 0 && (
        <div className="financing-terms">
          {terms.map(({ years, payment }) => (
            <div key={years}>
              <span>{years} {years === 1 ? "year" : "years"}</span>
              <strong>{payment}</strong>
              <small>per month</small>
            </div>
          ))}
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
  const activeImage = getAssetPath(galleryImages[activeImageIndex] || vehicle.image);
  const coverImage = getAssetPath(galleryImages[0] || vehicle.image);

  useEffect(() => {
    if (galleryImages.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setImageDirection(1);
      setActiveImageIndex((current) => (current + 1) % galleryImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeImageIndex, galleryImages.length]);

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
          <ArrowLeft size={17} /> Back
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
            <div className="price-stage-row">
              <strong>{formatPrice(vehicle.price)}</strong>
              {unavailable ? (
                <button className="button button-primary price-stage-action" type="button" disabled>
                  {sold ? "Sold" : "Reserved"}
                </button>
              ) : (
                <Link className="button button-primary price-stage-action" href={`/?inquire=${vehicle.id}#contact`}>
                  Prepare Inquiry <ArrowRight size={19} />
                </Link>
              )}
            </div>
            {unavailable && (
              <p>{sold ? "This unit has been marked sold. Browse related units for available options." : "This unit is currently reserved. Browse related units for available options."}</p>
            )}
            <div className="price-ring" aria-hidden="true">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }} />
            </div>
          </motion.aside>
        </motion.div>
      </section>

      <section className="product-detail-section">
        <motion.div className="product-image-panel" initial={{ opacity: 0, y: 42 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.75 }}>
          <div className="product-gallery">
            <AnimatePresence initial={false} mode="sync">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={`${vehicle.name} photo ${activeImageIndex + 1}`}
                initial={{
                  opacity: 0,
                  x: imageDirection > 0 ? 36 : -36,
                  scale: 1.025
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  x: imageDirection > 0 ? -24 : 24,
                  scale: 0.985
                }}
                transition={{
                  duration: 0.72,
                  ease: [0.22, 1, 0.36, 1]
                }}
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
        </motion.div>

        <motion.div className="spec-panel" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <div className="section-heading compact">
            <FinancingBlock financing={vehicle.financing} text={vehicle.description} />
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
                <img src={getAssetPath(item.image)} alt={item.name} loading="lazy" />
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
