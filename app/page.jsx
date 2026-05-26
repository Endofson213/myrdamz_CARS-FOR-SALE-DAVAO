"use client";

import { 
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionValueEvent 
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Gauge,
  MessageCircle,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState , useEffect } from "react";
import { bodyTypes, formatMileage, formatPrice, fuels, inventory, transmissions } from "./data/vehicles";
import Image from "next/image";
import logo from "./pictures/LogoMYRDAMZ.png";
import hero1 from "./pictures/CarHeroBG.jpg";
import hero2 from "./pictures/CarHeroBG2.jpg";
import hero3 from "./pictures/CarHeroBG3.jpg";
import hero4 from "./pictures/CarHeroBG4.jpg";
import hero5 from "./pictures/CarHeroBG5.jpg";

const heroImages = [hero1, hero2, hero3, hero4, hero5];


const fadeUp = {
  hidden: { opacity: 0, y: 34, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.78, ease: [0.19, 1, 0.22, 1] }
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

function TiltCard({ children, className, accent }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 220, damping: 24 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 220, damping: 24 });

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.article
      className={className}
      style={{ rotateX, rotateY, "--accent": accent }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ y: -10, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      {children}
    </motion.article>
  );
}

export default function Home() {
  const [filters, setFilters] = useState({
    type: "All",
    fuel: "All",
    transmission: "All",
    search: "",
    maxPrice: 5800000,
    sort: "featured"
  });
  const [inquiryStatus, setInquiryStatus] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase();
    const list = inventory.filter((vehicle) => {
      const haystack = [
        vehicle.name,
        vehicle.type,
        vehicle.year,
        vehicle.fuel,
        vehicle.transmission,
        vehicle.description
      ]
        .join(" ")
        .toLowerCase();

      return (
        (filters.type === "All" || vehicle.type === filters.type) &&
        (filters.fuel === "All" || vehicle.fuel === filters.fuel) &&
        (filters.transmission === "All" || vehicle.transmission === filters.transmission) &&
        vehicle.price <= filters.maxPrice &&
        haystack.includes(search)
      );
    });

    if (filters.sort === "price-low") return [...list].sort((a, b) => a.price - b.price);
    if (filters.sort === "price-high") return [...list].sort((a, b) => b.price - a.price);
    if (filters.sort === "year-new") return [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [filters]);
const [heroIndex, setHeroIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setHeroIndex((current) => (current + 1) % heroImages.length);
  }, 5000);

  return () => clearInterval(interval);
}, []);
  function resetFilters() {
    setFilters({
      type: "All",
      fuel: "All",
      transmission: "All",
      search: "",
      maxPrice: 5800000,
      sort: "featured"
    });
  }
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
  setIsScrolled(latest > 80);
  if (latest > 80) setIsMenuOpen(false);
});

  return (
<main>
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
        <strong>MYRDAMZ</strong>
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
      <a href="#catalog" onClick={() => setIsMenuOpen(false)}>Catalog</a>
      <a href="#experience" onClick={() => setIsMenuOpen(false)}>Experience</a>
      <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
    </nav>
  </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
       <motion.div
  className="hero-bg"
  initial={{ scale: 1.08 }}
  animate={{ scale: 1 }}
  transition={{ duration: 1.7, ease: [0.19, 1, 0.22, 1] }}
>
  {heroImages.map((image, index) => (
    <motion.div
      key={image.src}
      className="hero-bg-slide"
      style={{
        backgroundImage: `url(${image.src})`,
      }}
      animate={{
        opacity: heroIndex === index ? 1 : 0,
      }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
      }}
    />
  ))}
        </motion.div>
        <div className="scan-lines" aria-hidden="true" />
        <motion.div className="hero-content" variants={stagger} initial="hidden" animate="visible">
          <motion.h1 id="hero-title" variants={fadeUp}>
            Myrdamz Cars for Sales Davao
          </motion.h1>
          <motion.p className="hero-copy" variants={fadeUp}>
            Find your next ride in Davao with trusted cars, clear deals, and a smoother buying experience.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp}>
            <a className="button button-primary magnetic" href="#catalog">
              Browse Cars <ArrowRight size={18} />
            </a>
            <a className="button button-ghost" href="#contact">
              Book Viewing <CalendarDays size={18} />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-orbit"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
        >
          <div className="orbit-ring" />
          <motion.div className="orbit-car" animate={{ y: [-7, 7, -7] }} transition={{ duration: 3.7, repeat: Infinity, ease: "easeInOut" }}>
            <CarFront size={54} />
          </motion.div>
        </motion.div>
      </section>

      <section className="experience-band" id="experience" aria-labelledby="experience-title">
        <motion.div className="section-heading light" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Buyer flow</p>
          <h2 id="experience-title">Luxury feeling, practical path</h2>
        </motion.div>

        <motion.div className="experience-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          {[
            ["01", "Shortlist", "Compare price, year, body, fuel, transmission, and mileage at speed."],
            ["02", "View Product Page", "Open a selected unit for deeper specs, visuals, and inquiry context."],
            ["03", "Close Offline", "Discuss cash purchase, financing, reservation, and trade-in outside the site."]
          ].map(([number, title, copy]) => (
            <motion.article key={title} variants={fadeUp} whileHover={{ y: -8 }}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* <motion.section className="trust-strip" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
        {[
          ["Transparent PHP prices", "Every vehicle card displays the listed amount up front."],
          ["Advanced browsing", "Animated filters, live search, sort order, and price range."],
          ["Product pages", "Each selected unit opens into its own shareable detail page."]
        ].map(([title, copy]) => (
          <motion.div key={title} variants={fadeUp}>
            <BadgeCheck size={22} />
            <strong>{title}</strong>
            <span>{copy}</span>
          </motion.div>
        ))}
      </motion.section> */}

      <section className="catalog-section" id="catalog" aria-labelledby="catalog-title">
        <motion.div className="section-heading" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          {/* <p className="eyebrow">Animated catalog</p>
          <h2 id="catalog-title">Premium units with posted prices</h2> */}
          {/* <p>
            Cards react to motion, filters transition smoothly, and selecting a unit opens a full
            product page with more room for specs, pricing, and inquiry context.
          </p> */}
        </motion.div>

        <motion.div className="filter-shell" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <div className="filter-title">
            <SlidersHorizontal size={20} />
            <strong>Live Filters</strong>
          </div>

          <label className="search-field">
            <span>Search</span>
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              type="search"
              placeholder="Model, body, feature..."
            />
          </label>

          <div className="chips" aria-label="Body type filters">
            {bodyTypes.map((type) => (
              <button
                key={type}
                className={filters.type === type ? "chip active" : "chip"}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, type }))}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="select-grid">
            <label>
              Fuel
              <select value={filters.fuel} onChange={(event) => setFilters((current) => ({ ...current, fuel: event.target.value }))}>
                {fuels.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel === "All" ? "All fuel types" : fuel}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Transmission
              <select
                value={filters.transmission}
                onChange={(event) => setFilters((current) => ({ ...current, transmission: event.target.value }))}
              >
                {transmissions.map((transmission) => (
                  <option key={transmission} value={transmission}>
                    {transmission === "All" ? "All transmissions" : transmission}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort
              <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
                <option value="featured">Featured first</option>
                <option value="price-low">Lowest price</option>
                <option value="price-high">Highest price</option>
                <option value="year-new">Newest year</option>
              </select>
            </label>
          </div>
          
          {/* price range slider filter */}
          {/* <label className="price-range">
            <span>
              Max price <strong>{formatPrice(filters.maxPrice)}</strong>
            </span>
            <input
              type="range"
              min="900000"
              max="5800000"
              step="50000"
              value={filters.maxPrice}
              onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))}
            />
          </label> */}
        </motion.div>

        <div className="catalog-toolbar">
          <motion.p key={filtered.length} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            Showing {filtered.length} of {inventory.length} units
          </motion.p>
          <button className="text-button" type="button" onClick={resetFilters}>
            <RefreshCw size={16} /> Reset Filters
          </button>
        </div>

        <motion.div className="vehicle-grid" layout>
          <AnimatePresence mode="popLayout">
            {filtered.map((vehicle, index) => (
              <TiltCard key={vehicle.id} className="vehicle-card" accent={vehicle.accent}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 36, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.92 }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.18), ease: [0.19, 1, 0.22, 1] }}
                >
                  <Link className="vehicle-media" href={`/cars/${vehicle.id}`} aria-label={`View product page for ${vehicle.name}`}>
                    <img src={vehicle.image} alt={vehicle.name} loading="lazy" />
                    <span className="badge">{vehicle.badge}</span>
                    {/* <motion.span
                      className="card-glint"
                      aria-hidden="true"
                      animate={{ x: ["-120%", "180%"] }}
                      transition={{ duration: 3.9, repeat: Infinity, repeatDelay: 2 + index * 0.12, ease: "easeInOut" }}
                    /> */}
                  </Link>
                  <div className="vehicle-body">
                    <div>
                      <h3>{vehicle.name}</h3>
                      <p>
                        {vehicle.type} / {vehicle.year}
                      </p>
                    </div>
                    <strong className="price">{formatPrice(vehicle.price)}</strong>
                    <ul className="spec-list">
                      <li>
                        <Gauge size={16} /> {formatMileage(vehicle.mileage)}
                      </li>
                      <li>{vehicle.transmission}</li>
                      <li>{vehicle.fuel}</li>
                      <li>{vehicle.seats} seats</li>
                    </ul>
                    <div className="card-actions">
                      <Link className="button button-primary" href={`/cars/${vehicle.id}`}>
                        Details <ArrowRight size={16} />
                      </Link>
                      <a className="button button-ghost dark" href="#contact">
                        Inquire
                      </a>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <motion.div className="empty-state" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <h3>No units match those filters</h3>
            <p>Widen the price range or switch back to all body styles.</p>
          </motion.div>
        )}
      </section>

      

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <motion.div className="section-heading" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Book a viewing in Davao</h2>
          <p>
            The form stays inquiry-only. Add the real phone number, Facebook page, or email endpoint
            when the business is ready.
          </p>

          <div className="map-card">
         <iframe title="MYRDAMZ Car Display Center map" 
         src="https://maps.google.com/maps?hl=en&amp;q=MYRDAMZ%20CAR%20DISPLAY%20CENTER%20%2F%20CARS%20FOR%20SALE%20DAVAO&amp;z=16&amp;output=embed" 
         loading="lazy" 
         allowFullScreen="" 
         referrerPolicy="no-referrer-when-downgrade">
         </iframe>
        </div>
        </motion.div>

        <motion.form className="contact-form" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <label>
            Full name
            <input type="text" name="name" placeholder="Juan Dela Cruz" />
          </label>
          <label>
            Mobile number
            <input type="tel" name="mobile" placeholder="09XX XXX XXXX" />
          </label>
          <label>
            Interested unit
            <input type="text" name="unit" placeholder="Toyota Fortuner, sedan, pickup..." />
          </label>
          <label>
            Message
            <textarea name="message" rows="4" placeholder="Preferred viewing day, budget, trade-in details..." />
          </label>
          <button
            className="button button-primary"
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.closest("form");
              const formData = new FormData(form);
              const unit = formData.get("unit") || "a selected unit";
              setInquiryStatus(`Inquiry draft ready for ${unit}. Connect this to your real contact channel before launch.`);
            }}
          >
            Prepare Inquiry <MessageCircle size={18} />
          </button>
          <AnimatePresence>
            {inquiryStatus && (
              <motion.p className="form-status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {inquiryStatus}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>
      </section>

      <footer className="site-footer">
        <p>Myrdamz Cars for Sales Davao.</p>
      </footer>
    </main>
  );
}
