"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Gauge,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

const inventory = [
  {
    id: "fortuner-v-2023",
    name: "2023 Toyota Fortuner V",
    type: "SUV",
    year: 2023,
    price: 1850000,
    mileage: 18000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 7,
    badge: "Featured",
    image: "https://images.pexels.com/photos/1005634/pexels-photo-1005634.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#caa86a",
    description:
      "Executive family SUV profile with diesel efficiency, strong road presence, and Davao-ready ground clearance."
  },
  {
    id: "bmw-3-2021",
    name: "2021 BMW 3-Series Sport",
    type: "Sedan",
    year: 2021,
    price: 2280000,
    mileage: 24000,
    fuel: "Gasoline",
    transmission: "Automatic",
    seats: 5,
    badge: "Prestige",
    image: "https://images.pexels.com/photos/8556280/pexels-photo-8556280.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#6f9ea5",
    description:
      "A refined sedan choice for buyers who want a premium cabin, crisp handling, and business-class styling."
  },
  {
    id: "hilux-conquest-2022",
    name: "2022 Toyota Hilux Conquest",
    type: "Pickup",
    year: 2022,
    price: 1680000,
    mileage: 31000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 5,
    badge: "Utility Luxe",
    image: "https://images.pexels.com/photos/4895416/pexels-photo-4895416.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#8d6b35",
    description:
      "A premium pickup listing for buyers needing cargo strength, elevated stance, and everyday comfort."
  },
  {
    id: "alphard-2022",
    name: "2022 Toyota Alphard Executive",
    type: "Van",
    year: 2022,
    price: 4180000,
    mileage: 15000,
    fuel: "Gasoline",
    transmission: "Automatic",
    seats: 7,
    badge: "VIP",
    image: "https://images.pexels.com/photos/37147584/pexels-photo-37147584.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#7b2833",
    description:
      "A luxury transport profile for family, executive, or client-service use with a VIP seating focus."
  },
  {
    id: "mustang-2020",
    name: "2020 Ford Mustang GT",
    type: "Sports",
    year: 2020,
    price: 3580000,
    mileage: 19000,
    fuel: "Gasoline",
    transmission: "Automatic",
    seats: 4,
    badge: "Performance",
    image: "https://images.pexels.com/photos/13741314/pexels-photo-13741314.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#d7b56d",
    description:
      "A statement performance listing for buyers who want weekend drama and unmistakable street presence."
  },
  {
    id: "everest-titanium-2022",
    name: "2022 Ford Everest Titanium",
    type: "SUV",
    year: 2022,
    price: 1980000,
    mileage: 26000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 7,
    badge: "Family Luxe",
    image: "https://images.pexels.com/photos/5975536/pexels-photo-5975536.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#2e5a50",
    description:
      "A seven-seat premium SUV profile with a composed highway feel and strong everyday practicality."
  },
  {
    id: "lexus-is-2020",
    name: "2020 Lexus IS Premium",
    type: "Sedan",
    year: 2020,
    price: 2380000,
    mileage: 28000,
    fuel: "Gasoline",
    transmission: "Automatic",
    seats: 5,
    badge: "Refined",
    image: "https://images.pexels.com/photos/7394765/pexels-photo-7394765.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#a8a39a",
    description:
      "A quiet luxury sedan listing with elegant styling, premium comfort, and a polished ownership feel."
  },
  {
    id: "staria-2023",
    name: "2023 Hyundai Staria Premium",
    type: "Van",
    year: 2023,
    price: 2580000,
    mileage: 12000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 8,
    badge: "New Arrival",
    image: "https://images.pexels.com/photos/25286626/pexels-photo-25286626.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#4b6f78",
    description:
      "A modern people-mover profile with spacious seating and a premium shuttle look for family or business."
  },
  {
    id: "civic-rs-2024",
    name: "2024 Honda Civic RS Turbo",
    type: "Sedan",
    year: 2024,
    price: 1720000,
    mileage: 6000,
    fuel: "Gasoline",
    transmission: "Automatic",
    seats: 5,
    badge: "Low Mileage",
    image: "https://images.pexels.com/photos/305070/pexels-photo-305070.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#8797a5",
    description:
      "A sharp compact sedan profile with turbo character, clean cabin tech, and a younger premium look."
  },
  {
    id: "prado-2021",
    name: "2021 Toyota Prado VX",
    type: "SUV",
    year: 2021,
    price: 3850000,
    mileage: 22000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 7,
    badge: "Executive 4x4",
    image: "https://images.pexels.com/photos/12681128/pexels-photo-12681128.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#3f4b42",
    description:
      "A premium 4x4 listing for buyers who want comfort, command seating, and long-trip confidence."
  },
  {
    id: "ranger-raptor-2023",
    name: "2023 Ford Ranger Raptor",
    type: "Pickup",
    year: 2023,
    price: 2480000,
    mileage: 14000,
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 5,
    badge: "Adventure",
    image: "https://images.pexels.com/photos/15489329/pexels-photo-15489329.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#a46b46",
    description:
      "A bold performance pickup profile for buyers who like aggressive styling and weekend capability."
  },
  {
    id: "rx-hybrid-2022",
    name: "2022 Lexus RX Hybrid",
    type: "SUV",
    year: 2022,
    price: 4380000,
    mileage: 16000,
    fuel: "Hybrid",
    transmission: "Automatic",
    seats: 5,
    badge: "Hybrid Luxe",
    image: "https://images.pexels.com/photos/14313337/pexels-photo-14313337.jpeg?auto=compress&cs=tinysrgb&w=1400",
    accent: "#6f7f70",
    description:
      "A luxury crossover listing for buyers who want a quiet drive, premium comfort, and hybrid efficiency."
  }
];

const bodyTypes = ["All", "SUV", "Sedan", "Pickup", "Van", "Sports"];
const fuels = ["All", "Diesel", "Gasoline", "Hybrid"];
const transmissions = ["All", "Automatic", "Manual"];

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

function formatPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  })
    .format(value)
    .replace("PHP", "PHP ");
}

function formatMileage(value) {
  return `${new Intl.NumberFormat("en-PH").format(value)} km`;
}

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
  const [selected, setSelected] = useState(null);
  const [inquiryStatus, setInquiryStatus] = useState("");

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase();
    const list = inventory.filter((vehicle) => {
      const haystack = [
        vehicle.name,
        vehicle.type,
        vehicle.year,
        vehicle.fuel,
        vehicle.transmission,
        vehicle.badge,
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

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Myrdams Cars for Sales Davao home">
          <motion.span
            className="brand-mark"
            animate={{ rotate: [0, 6, -4, 0], boxShadow: ["0 0 0 rgba(202,168,106,0)", "0 0 38px rgba(202,168,106,.34)", "0 0 0 rgba(202,168,106,0)"] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            M
          </motion.span>
          <span>
            <strong>Myrdams</strong>
            <small>Cars for Sales Davao</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#catalog">Catalog</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <motion.div className="hero-bg" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.7, ease: [0.19, 1, 0.22, 1] }} />
        <div className="scan-lines" aria-hidden="true" />
        <motion.div
          className="light-sweep"
          aria-hidden="true"
          animate={{ x: ["-30%", "135%"], opacity: [0, 0.75, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />

        <motion.div className="hero-content" variants={stagger} initial="hidden" animate="visible">
          <motion.p className="eyebrow" variants={fadeUp}>
            Davao City premium vehicle catalog
          </motion.p>
          <motion.h1 id="hero-title" variants={fadeUp}>
            Myrdams Cars for Sales Davao
          </motion.h1>
          <motion.p className="hero-copy" variants={fadeUp}>
            A cinematic Next.js vehicle catalog with transparent posted prices, fast filtering,
            luxury-grade motion, and no checkout wall.
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
          <span>12 premium sample units</span>
        </motion.div>
      </section>

      <motion.section className="trust-strip" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
        {[
          ["Transparent PHP prices", "Every vehicle card displays the listed amount up front."],
          ["Advanced browsing", "Animated filters, live search, sort order, and price range."],
          ["Inquiry only", "No payment wall. Customers book viewing and inspection offline."]
        ].map(([title, copy]) => (
          <motion.div key={title} variants={fadeUp}>
            <BadgeCheck size={22} />
            <strong>{title}</strong>
            <span>{copy}</span>
          </motion.div>
        ))}
      </motion.section>

      <section className="catalog-section" id="catalog" aria-labelledby="catalog-title">
        <motion.div className="section-heading" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Animated catalog</p>
          <h2 id="catalog-title">Premium units with posted prices</h2>
          <p>
            Cards react to motion, filters transition smoothly, and every unit opens into a
            cinematic detail view for faster buyer comparison.
          </p>
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

          <label className="price-range">
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
          </label>
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
                  <div className="vehicle-media">
                    <img src={vehicle.image} alt={vehicle.name} loading="lazy" />
                    <span className="badge">{vehicle.badge}</span>
                    <motion.span
                      className="card-glint"
                      aria-hidden="true"
                      animate={{ x: ["-120%", "180%"] }}
                      transition={{ duration: 3.9, repeat: Infinity, repeatDelay: 2 + index * 0.12, ease: "easeInOut" }}
                    />
                  </div>
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
                      <button className="button button-primary" type="button" onClick={() => setSelected(vehicle)}>
                        Details
                      </button>
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

      <section className="experience-band" id="experience" aria-labelledby="experience-title">
        <motion.div className="section-heading light" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Buyer flow</p>
          <h2 id="experience-title">Luxury feeling, practical path</h2>
        </motion.div>

        <motion.div className="experience-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          {[
            ["01", "Shortlist", "Compare price, year, body, fuel, transmission, and mileage at speed."],
            ["02", "View", "Use the catalog to pick units, then schedule an in-person Davao inspection."],
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

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <motion.div className="section-heading" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Book a viewing in Davao</h2>
          <p>
            The form stays inquiry-only. Add the real phone number, Facebook page, showroom address,
            or email endpoint when the business is ready.
          </p>
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
        <p>Myrdams Cars for Sales Davao. Next.js animated catalog with posted prices.</p>
        <p>Representative images from Pexels and Unsplash research.</p>
      </footer>

      <AnimatePresence>
        {selected && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div
              className="vehicle-modal"
              style={{ "--accent": selected.accent }}
              initial={{ opacity: 0, scale: 0.9, y: 44, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 24, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 210, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="modal-close" type="button" aria-label="Close vehicle details" onClick={() => setSelected(null)}>
                <X size={19} />
              </button>
              <div className="modal-media">
                <img src={selected.image} alt={selected.name} />
              </div>
              <div className="modal-copy">
                <p className="eyebrow">
                  <Sparkles size={16} /> {selected.badge} / {selected.type}
                </p>
                <h2>{selected.name}</h2>
                <strong className="price">{formatPrice(selected.price)}</strong>
                <p>{selected.description}</p>
                <ul className="spec-list wide">
                  <li>{selected.year} model</li>
                  <li>{selected.transmission}</li>
                  <li>{selected.fuel}</li>
                  <li>{formatMileage(selected.mileage)}</li>
                  <li>{selected.seats} seats</li>
                  <li>Davao City viewing</li>
                </ul>
                <a className="button button-primary" href="#contact" onClick={() => setSelected(null)}>
                  Send Inquiry <ArrowRight size={18} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
