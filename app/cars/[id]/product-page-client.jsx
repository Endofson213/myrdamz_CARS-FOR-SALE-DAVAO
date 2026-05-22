"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";
import { formatMileage, formatPrice } from "../../data/vehicles";

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
  return (
    <header className="site-header product-header">
      <Link className="brand" href="/" aria-label="Myrdams Cars for Sales Davao home">
        <motion.span
          className="brand-mark"
          animate={{ rotate: [0, 6, -4, 0], boxShadow: ["0 0 0 rgba(102,217,241,0)", "0 0 38px rgba(102,217,241,.38)", "0 0 0 rgba(102,217,241,0)"] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        >
          M
        </motion.span>
        <span>
          <strong>Myrdams</strong>
          <small>Cars for Sales Davao</small>
        </span>
      </Link>

      <nav className="nav-links" aria-label="Product navigation">
        <Link href="/#catalog">Catalog</Link>
        <Link href="/#contact">Contact</Link>
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
          style={{ backgroundImage: `linear-gradient(90deg, rgba(4,54,80,.84), rgba(7,111,148,.5), rgba(239,251,255,.14)), url("${vehicle.image}")` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.35, ease: [0.19, 1, 0.22, 1] }}
        />
        <div className="scan-lines" aria-hidden="true" />
        <motion.div
          className="light-sweep"
          aria-hidden="true"
          animate={{ x: ["-30%", "135%"], opacity: [0, 0.7, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />

        <motion.div className="product-hero-grid" variants={stagger} initial="hidden" animate="visible">
          <motion.div className="product-copy" variants={fadeUp}>
            <Link className="back-link" href="/#catalog">
              <ArrowLeft size={17} /> Back to catalog
            </Link>
            <p className="eyebrow">
              <Sparkles size={16} /> {vehicle.badge} / {vehicle.type}
            </p>
            <h1>{vehicle.name}</h1>
            <p>{vehicle.description}</p>
            <div className="product-actions">
              <a className="button button-primary" href="#inquiry-panel">
                Book Viewing <CalendarDays size={18} />
              </a>
              <Link className="button button-ghost" href="/#contact">
                Main Contact <MessageCircle size={18} />
              </Link>
            </div>
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
          <div className="image-caption">
            <ShieldCheck size={18} />
            <span>Representative image. Replace with actual unit photos before final launch.</span>
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

      <section className="ownership-band" id="inquiry-panel">
        <motion.div className="section-heading light" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Inquiry path</p>
          <h2>Reserve the conversation, not an online checkout</h2>
          <p>Use this page to confirm the exact unit, arrange inspection, and discuss purchase terms directly.</p>
        </motion.div>

        <motion.div className="ownership-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          {[
            ["01", "Confirm availability", "Ask whether the unit is still available and if the posted price has changed."],
            ["02", "Schedule viewing", "Arrange a Davao City inspection, test drive, or video walkaround."],
            ["03", "Close offline", "Handle cash, financing, trade-in, or reservation directly with the business."]
          ].map(([number, title, copy]) => (
            <motion.article key={title} variants={fadeUp} whileHover={{ y: -8 }}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div className="inquiry-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.65 }}>
          <div>
            <p className="eyebrow">Selected unit</p>
            <h3>{vehicle.name}</h3>
            <strong>{formatPrice(vehicle.price)}</strong>
          </div>
          <Link className="button button-primary" href={`/#contact`}>
            Prepare Inquiry <ArrowRight size={18} />
          </Link>
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
        <p>Myrdams Cars for Sales Davao. Product page for {vehicle.name}.</p>
        <p>Representative images from Pexels and Unsplash research.</p>
      </footer>
    </main>
  );
}
