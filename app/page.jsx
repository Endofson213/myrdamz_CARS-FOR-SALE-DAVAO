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
import { useMemo, useRef, useState , useEffect } from "react";
import { bodyTypes, formatMileage, formatPrice, getAssetPath, inventory } from "./data/vehicles";
import Image from "next/image";
import logo from "./pictures/LogoMYRDAMZ.png";
import hero1 from "./pictures/CarHeroBG.jpg";
import hero2 from "./pictures/CarHeroBG2.jpg";
import hero3 from "./pictures/CarHeroBG3.jpg";
import hero4 from "./pictures/CarHeroBG4.jpg";
import hero5 from "./pictures/CarHeroBG5.jpg";

const heroImages = [hero1, hero2, hero3, hero4, hero5];

const MESSENGER_URL = "https://www.messenger.com/t/105855237963972";
const DEFAULT_CATALOG_PAGE_SIZE = 8;
const VIEW_MORE_ROW_COUNT = 2;

const emptyInquiry = {
  name: "",
  mobile: "",
  unit: "",
  message: ""
};

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
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
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 180, damping: 28 });

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
      style={{ rotateX, rotateY, transformPerspective: 1000, "--accent": accent }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ y: -5, scale: 1.006 }}
      transition={{ type: "spring", stiffness: 180, damping: 28 }}
    >
      {children}
    </motion.article>
  );
}

function createOptions(vehicles, key, preferredOptions = ["All"]) {
  const values = Array.from(new Set(vehicles.map((vehicle) => vehicle[key]).filter(Boolean)));
  const preferred = preferredOptions.filter((option) => option === "All" || values.includes(option) || key === "type");
  const extras = values.filter((value) => !preferred.includes(value));
  return [...preferred, ...extras];
}

function getVehicleStatus(vehicle) {
  return vehicle.status || "Available";
}

function isSold(vehicle) {
  return getVehicleStatus(vehicle) === "Sold";
}

function isUnavailable(vehicle) {
  return ["Reserved", "Sold"].includes(getVehicleStatus(vehicle));
}

function statusRank(vehicle) {
  const status = getVehicleStatus(vehicle);
  if (status === "Sold") return 2;
  if (status === "Reserved") return 1;
  return 0;
}

function getCatalogPageSize() {
  if (typeof window === "undefined") return DEFAULT_CATALOG_PAGE_SIZE;
  if (window.innerWidth <= 680) return 3;
  if (window.innerWidth <= 900) return 6;
  if (window.innerWidth <= 1120) return 9;
  return DEFAULT_CATALOG_PAGE_SIZE;
}

function getCatalogColumnCount() {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth <= 680) return 1;
  if (window.innerWidth <= 900) return 2;
  if (window.innerWidth <= 1120) return 3;
  return 4;
}

export default function Home() {
  const [filters, setFilters] = useState({
    type: "All",
    fuel: "All",
    transmission: "All",
    search: "",
    sort: "featured"
  });
  const [vehicles, setVehicles] = useState(inventory);
  const [vehicleLoadStatus, setVehicleLoadStatus] = useState("ready");
  const [inquiryStatus, setInquiryStatus] = useState("");
  const [inquiry, setInquiry] = useState(emptyInquiry);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [catalogPageSize, setCatalogPageSize] = useState(DEFAULT_CATALOG_PAGE_SIZE);
  const [catalogViewMoreSize, setCatalogViewMoreSize] = useState(DEFAULT_CATALOG_PAGE_SIZE);
  const [visibleVehicleCount, setVisibleVehicleCount] = useState(DEFAULT_CATALOG_PAGE_SIZE);
  const inquiryParamHandled = useRef(false);
  const bodyTypeOptions = useMemo(() => createOptions(vehicles, "type", bodyTypes), [vehicles]);
  const fuelOptions = useMemo(() => createOptions(vehicles, "fuel"), [vehicles]);
  const transmissionOptions = useMemo(() => createOptions(vehicles, "transmission"), [vehicles]);

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase();
    const list = vehicles.filter((vehicle) => {
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
        haystack.includes(search)
      );
    });

    const activeFirst = (a, b) => statusRank(a) - statusRank(b);
    if (filters.sort === "price-low") return [...list].sort((a, b) => activeFirst(a, b) || a.price - b.price);
    if (filters.sort === "price-high") return [...list].sort((a, b) => activeFirst(a, b) || b.price - a.price);
    if (filters.sort === "year-new") return [...list].sort((a, b) => activeFirst(a, b) || b.year - a.year);
    return [...list].sort(activeFirst);
  }, [filters, vehicles]);
  const visibleVehicles = useMemo(
    () => filtered.slice(0, visibleVehicleCount),
    [filtered, visibleVehicleCount]
  );
  const remainingVehicleCount = Math.max(filtered.length - visibleVehicles.length, 0);
const [heroIndex, setHeroIndex] = useState(0);

useEffect(() => {
  heroImages.forEach((image) => {
    const preload = new window.Image();
    preload.src = image.src;
  });

  const interval = setInterval(() => {
    setHeroIndex((current) => (current + 1) % heroImages.length);
  }, 5000);

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  function updateCatalogPageSize() {
    setCatalogPageSize(getCatalogPageSize());
    setCatalogViewMoreSize(getCatalogColumnCount() * VIEW_MORE_ROW_COUNT);
  }

  updateCatalogPageSize();
  window.addEventListener("resize", updateCatalogPageSize);
  return () => window.removeEventListener("resize", updateCatalogPageSize);
}, []);

useEffect(() => {
  setVisibleVehicleCount(catalogPageSize);
}, [filters, catalogPageSize]);

useEffect(() => {
  async function loadVehicles() {
    if (process.env.NEXT_PUBLIC_GITHUB_PAGES === "true") {
      setVehicles(inventory);
      setVehicleLoadStatus("ready");
      return;
    }

    setVehicleLoadStatus("loading");
    try {
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
        setVehicleLoadStatus("ready");
        return;
      }
      setVehicleLoadStatus(inventory.length ? "ready" : "error");
    } catch {
      setVehicleLoadStatus(inventory.length ? "ready" : "error");
    }
  }

  loadVehicles();
}, []);

useEffect(() => {
  if (inquiryParamHandled.current) return;

  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("inquire");
  if (!vehicleId) return;

  const selected = vehicles.find((vehicle) => vehicle.id === vehicleId);
  if (!selected) return;

  inquiryParamHandled.current = true;
  fillInquiryFromVehicle(selected);
}, [vehicles]);

  function createVehicleMessage(vehicle) {
    return [
      `Hi, I am interested in ${vehicle.name}.`,
      `Specs: ${vehicle.year} ${vehicle.type}, ${formatMileage(vehicle.mileage)}, ${vehicle.fuel}, ${vehicle.transmission}, ${vehicle.seats} seats.`,
      "Please confirm if this unit is still available and when I can book a viewing in Davao."
    ].join("\n").trim();
  }

  function fillInquiryFromVehicle(vehicle) {
    setInquiry((current) => ({
      ...current,
      unit: `${vehicle.name} - ${formatPrice(vehicle.price)}`,
      message: createVehicleMessage(vehicle)
    }));
    setInquiryStatus(`Selected ${vehicle.name}. Enter your name and mobile number so the seller can confirm availability and viewing schedule.`);

    window.requestAnimationFrame(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleInquiryChange(event) {
    const { name, value } = event.target;
    setInquiry((current) => ({ ...current, [name]: value }));
  }

  function handleInquirySubmit(event) {
    event.preventDefault();

    const lines = [
      `Name: ${inquiry.name.trim()}`,
      `Mobile: ${inquiry.mobile.trim()}`,
      inquiry.unit.trim() && `Interested unit: ${inquiry.unit.trim()}`,
      inquiry.message.trim()
    ].filter(Boolean);

    const messengerUrl = `${MESSENGER_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
    setInquiryStatus("Messenger opened in a new tab. If it did not open, check your browser pop-up settings.");
    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  }
  function resetFilters() {
    setFilters({
      type: "All",
      fuel: "All",
      transmission: "All",
      search: "",
      sort: "featured"
    });
    setVisibleVehicleCount(catalogPageSize);
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
            animate={{ rotate: [0, 6, -4, 0] }}
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
      <a href="#catalog" onClick={() => setIsMenuOpen(false)}>CATALOG</a>
      <a href="#experience" onClick={() => setIsMenuOpen(false)}>EXPERIENCE</a>
    </nav>
  </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
<motion.div
  className="hero-bg"
  initial={{ scale: 1.025 }}
  animate={{ scale: 1 }}
  transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
>
  <AnimatePresence initial={false}>
    <motion.div
      key={heroImages[heroIndex].src}
      className="hero-bg-slide"
      style={{
        backgroundImage: `url(${heroImages[heroIndex].src})`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.65,
        ease: "easeInOut",
      }}
    />
  </AnimatePresence>
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
              Message Us <MessageCircle size={18} />
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
            {bodyTypeOptions.map((type) => (
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
                {fuelOptions.map((fuel) => (
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
                {transmissionOptions.map((transmission) => (
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
        </motion.div>

        <div className="catalog-toolbar">
          <motion.p key={filtered.length} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {vehicleLoadStatus === "loading" ? "Loading units..." : `Showing ${visibleVehicles.length} of ${filtered.length} matching units`}
          </motion.p>
          <button className="text-button" type="button" onClick={resetFilters}>
            <RefreshCw size={16} /> Reset Filters
          </button>
        </div>

        <motion.div className="vehicle-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleVehicles.map((vehicle, index) => (
              <TiltCard key={vehicle.id} className="vehicle-card" accent={vehicle.accent}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 36, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.92 }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.18), ease: [0.19, 1, 0.22, 1] }}
                >
                  <Link className="vehicle-media" href={`/cars/${vehicle.id}`} aria-label={`View product page for ${vehicle.name}`}>
                    <img src={getAssetPath(vehicle.image)} alt={vehicle.name} loading="lazy" />
                    <span className={isSold(vehicle) ? "badge badge-sold" : getVehicleStatus(vehicle) === "Reserved" ? "badge badge-reserved" : "badge"}>{isSold(vehicle) ? "Sold" : getVehicleStatus(vehicle) === "Reserved" ? "Reserved" : vehicle.badge || vehicle.type}</span>
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
                      <button className="button button-ghost dark" type="button" onClick={() => fillInquiryFromVehicle(vehicle)} disabled={isUnavailable(vehicle)}>
                        {isSold(vehicle) ? "Sold" : getVehicleStatus(vehicle) === "Reserved" ? "Reserved" : "Inquire"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </AnimatePresence>
        </motion.div>

        {remainingVehicleCount > 0 && (
          <motion.div
            className="catalog-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="button button-primary catalog-more-button"
              type="button"
              onClick={() => setVisibleVehicleCount((count) => Math.min(count + catalogViewMoreSize, filtered.length))}
            >
              View more units <ArrowRight size={18} />
            </button>
            <span>{remainingVehicleCount} more matching unit{remainingVehicleCount === 1 ? "" : "s"}</span>
          </motion.div>
        )}

        {filtered.length === 0 && (
          <motion.div className="empty-state" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <h3>{vehicleLoadStatus === "loading" ? "Loading inventory" : vehicleLoadStatus === "error" ? "Inventory could not load" : vehicles.length === 0 ? "No units listed yet" : "No units match those filters"}</h3>
            <p>{vehicleLoadStatus === "loading" ? "Fetching the latest vehicle entries from the admin database." : vehicleLoadStatus === "error" ? "Refresh the page or check the vehicle database connection." : vehicles.length === 0 ? "Add real Davao units from the admin page when they are ready." : "Reset the filters or try a different search term."}</p>
          </motion.div>
        )}
      </section>

      

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <motion.div className="section-heading" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Book a viewing in Davao</h2>
          <p>Choose a unit, review the auto-filled details, then send the inquiry through Messenger.</p>

          <div className="map-card">
         <iframe title="MYRDAMZ Car Display Center map" 
         src="https://maps.google.com/maps?hl=en&amp;q=MYRDAMZ%20CAR%20DISPLAY%20CENTER%20%2F%20CARS%20FOR%20SALE%20DAVAO&amp;z=16&amp;output=embed" 
         loading="lazy" 
         allowFullScreen="" 
         referrerPolicy="no-referrer-when-downgrade">
         </iframe>
        </div>
        </motion.div>

        <motion.form className="contact-form" onSubmit={handleInquirySubmit} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <label>
            Full name
            <input type="text" name="name" value={inquiry.name} onChange={handleInquiryChange} placeholder="Juan Dela Cruz" required />
          </label>
          <label>
            Mobile number
            <input type="tel" name="mobile" value={inquiry.mobile} onChange={handleInquiryChange} placeholder="09XX XXX XXXX" required />
          </label>
            <label>
              Interested unit
            <input type="text" name="unit" value={inquiry.unit} onChange={handleInquiryChange} placeholder="Vehicle name or body type..." />
            </label>
          <label>
            Message
            <textarea name="message" value={inquiry.message} onChange={handleInquiryChange} rows="3" placeholder="Preferred viewing day, budget, trade-in details..." />
          </label>
          <button
            className="button button-primary"
            type="submit"
          >
            Send to Messenger <MessageCircle size={18} />
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
