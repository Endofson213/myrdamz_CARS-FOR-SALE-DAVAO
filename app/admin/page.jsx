"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Home, ImagePlus, LogOut, Pencil, Save, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { vehicleBodyTypes } from "../data/vehicles";

const blankVehicle = {
  id: "",
  name: "",
  type: "SUV",
  year: new Date().getFullYear(),
  price: "",
  mileage: "",
  fuel: "Gasoline",
  transmission: "Automatic",
  seats: "",
  status: "Available",
  image: "",
  images: [],
  accent: "#8f1d24",
  description: "",
  downPayment: "",
  payment2Years: "",
  payment3Years: "",
  payment4Years: "",
  payment5Years: ""
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 40 }, (_, index) => currentYear - index);
const seatOptions = [2, 4, 5, 6, 7, 8, 10, 12, 15];

export default function AdminPage() {
  const [session, setSession] = useState({ loading: true, authenticated: false, setupRequired: false });
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(blankVehicle);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

  const sortedVehicles = useMemo(
    () => {
      const query = search.trim().toLowerCase();
      return vehicles
        .filter((vehicle) => {
          const text = [vehicle.name, vehicle.type, vehicle.year, vehicle.fuel, vehicle.transmission, vehicle.status]
            .join(" ")
            .toLowerCase();
          return text.includes(query);
        })
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    },
    [vehicles, search]
  );

  useEffect(() => {
    if (isGithubPages) return;
    loadSession();
  }, [isGithubPages]);

  async function loadSession() {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const data = await response.json();
    setSession({ loading: false, ...data });

    if (data.authenticated) {
      loadVehicles();
    }
  }

  async function loadVehicles() {
    const response = await fetch("/api/admin/vehicles", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not load vehicles.");
      return;
    }

    setVehicles(data.vehicles || []);
    setHistory(data.history || []);
  }

  function updateAuthForm(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

function updateVehicleForm(event) {
    const { name, value } = event.target;
    setVehicleForm((current) => ({ ...current, [name]: value }));
  }

  function makeSlug(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function updateVehicleName(event) {
    const { value } = event.target;
    setVehicleForm((current) => ({
      ...current,
      name: value,
      id: editingId ? current.id : makeSlug(value)
    }));
  }

  function formatPeso(value) {
    const amount = Number(String(value || "").replace(/[^0-9.-]+/g, ""));
    if (!amount) return "";
    return `PHP ${amount.toLocaleString("en-PH")}`;
  }

  function formatPesoField(field) {
    setVehicleForm((current) => ({ ...current, [field]: formatPeso(current[field]) }));
  }

  function updatePesoField(event) {
    const { name, value } = event.target;
    const digits = value.replace(/\D/g, "");
    setVehicleForm((current) => ({
      ...current,
      [name]: digits ? formatPeso(digits) : ""
    }));
  }

  async function uploadImage(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setStatus("");

    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setUploading(false);
        setStatus(data.error || "Could not upload image.");
        return;
      }

      uploadedUrls.push(data.url);
    }

    setUploading(false);
    setVehicleForm((current) => {
      const images = Array.from(new Set([...(current.images || []), current.image, ...uploadedUrls].filter(Boolean)));
      return { ...current, image: images[0] || "", images };
    });
    setStatus(`${uploadedUrls.length} photo${uploadedUrls.length === 1 ? "" : "s"} uploaded. Save the vehicle to keep them.`);
    event.target.value = "";
  }

  function removeVehiclePhoto(photo) {
    setVehicleForm((current) => {
      const images = (current.images || []).filter((image) => image !== photo);
      return { ...current, images, image: images[0] || "" };
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setStatus("");

    const endpoint = session.setupRequired ? "/api/admin/setup" : "/api/admin/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Authentication failed.");
      return;
    }

    setSession({ loading: false, authenticated: true, setupRequired: false, user: data.user });
    setAuthForm({ username: "", password: "" });
    setStatus(session.setupRequired ? "Admin account created." : "Logged in.");
    loadVehicles();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession({ loading: false, authenticated: false, setupRequired: false });
    setVehicles([]);
    setHistory([]);
    setStatus("Logged out.");
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setStatus("");

    const response = await fetch(editingId ? `/api/admin/vehicles/${editingId}` : "/api/admin/vehicles", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vehicleForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not save vehicle.");
      return;
    }

    setStatus(`${data.vehicle.name} saved with vehicle ID "${data.vehicle.id}".`);
    setHistory(data.history || []);
    setVehicleForm(blankVehicle);
    setEditingId("");
    loadVehicles();
  }

  function editVehicle(vehicle) {
    setEditingId(vehicle.id);
    setVehicleForm({
      ...blankVehicle,
      ...vehicle,
      images: vehicle.images?.length ? vehicle.images : [vehicle.image].filter(Boolean),
      year: String(vehicle.year),
      price: String(vehicle.price),
      mileage: String(vehicle.mileage),
      seats: String(vehicle.seats),
      downPayment: formatPeso(vehicle.financing?.downPayment),
      payment2Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 2)?.monthlyPayment),
      payment3Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 3)?.monthlyPayment),
      payment4Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 4)?.monthlyPayment),
      payment5Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 5)?.monthlyPayment)
    });
    setVehicleForm((current) => ({ ...current, price: formatPeso(vehicle.price) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteVehicle(vehicle) {
    const confirmed = window.confirm(`Delete ${vehicle.name} from the admin database?`);
    if (!confirmed) return;

    const response = await fetch(`/api/admin/vehicles/${vehicle.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not delete vehicle.");
      return;
    }

    setStatus(`${vehicle.name} deleted.`);
    setHistory(data.history || []);
    loadVehicles();
  }

  async function undoLastChange() {
    setStatus("");

    const response = await fetch("/api/admin/undo", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not undo the last action.");
      return;
    }

    setVehicles(data.vehicles || []);
    setHistory(data.history || []);
    setEditingId("");
    setVehicleForm(blankVehicle);
    setStatus(`Undid: ${data.undone}`);
  }

  if (isGithubPages) {
    return (
      <main className="admin-page">
        <section className="admin-auth-panel">
          <div>
            <p className="eyebrow"><ShieldCheck size={18} /> Static prototype</p>
            <h1>Admin is disabled on GitHub Pages</h1>
            <p>GitHub Pages can show the public catalog, but it cannot run the admin database, uploads, or API routes. Use local dev or Vercel when you need data entry.</p>
          </div>
          <Link className="button button-primary" href="/">
            <Home size={18} /> Back to Home
          </Link>
        </section>
      </main>
    );
  }

  if (session.loading) {
    return (
      <main className="admin-page">
        <section className="admin-auth-panel">
          <p>Loading admin...</p>
        </section>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="admin-page">
        <section className="admin-auth-panel">
          <div>
            <p className="eyebrow"><ShieldCheck size={18} /> Admin access</p>
            <h1>{session.setupRequired ? "Create admin account" : "Admin login"}</h1>
            <p>{session.setupRequired ? "Set up the first admin user for protected vehicle data entry." : "Log in to manage vehicle entries."}</p>
          </div>

          <form className="admin-form" onSubmit={submitAuth}>
            <label>
              Username
              <input name="username" value={authForm.username} onChange={updateAuthForm} required autoComplete="username" />
            </label>
            <label>
              Password
              <input name="password" value={authForm.password} onChange={updateAuthForm} type="password" required minLength={8} autoComplete={session.setupRequired ? "new-password" : "current-password"} />
            </label>
            <button className="button button-primary" type="submit">
              {session.setupRequired ? "Create Admin" : "Log In"} <ShieldCheck size={18} />
            </button>
            {status && <p className="form-status">{status}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Admin</p>
        </div>
        <div className="admin-topbar-actions">
          <Link className="button button-ghost" href="/">
            <Home size={18} /> Home
          </Link>
          <button className="button button-ghost" type="button" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <section className="admin-history-strip">
        <History size={18} />
        <button className="button button-ghost" type="button" onClick={undoLastChange} disabled={history.length === 0}>
            <Undo2 size={18} /> Undo last change
          </button>
        <span>{history[0] ? `Last action: ${history[0].label}` : "No actions to undo yet."}</span>
      </section>

      <section className="admin-grid">
        <form className="admin-form admin-vehicle-form" onSubmit={saveVehicle}>
          <div className="admin-form-title">
            <h2>{editingId ? "Edit vehicle" : "Add vehicle"}</h2>
            {editingId && (
              <button className="text-button" type="button" onClick={() => {
                setEditingId("");
                setVehicleForm(blankVehicle);
              }}>
                New entry
              </button>
            )}
          </div>

          <input
              type="hidden"
              name="id"
              value={vehicleForm.id}
            />
          <label>
            Vehicle name
            <input name="name" value={vehicleForm.name} onChange={updateVehicleName} placeholder="Model Variant" required />
          </label>

          <div className="admin-field-row">
            <label>
              Type
              <select name="type" value={vehicleForm.type} onChange={updateVehicleForm}>
                {vehicleBodyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Year
              <select name="year" value={vehicleForm.year} onChange={updateVehicleForm} required>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-half-field">
            Mileage
            <input name="mileage" value={vehicleForm.mileage} onChange={updateVehicleForm} type="number" min="0" required />
          </label>

          <div className="admin-field-row">
            <label>
              Fuel
              <select name="fuel" value={vehicleForm.fuel} onChange={updateVehicleForm}>
                <option>Diesel</option>
                <option>Gasoline</option>
                <option>Hybrid</option>
              </select>
            </label>
            <label>
              Transmission
              <select name="transmission" value={vehicleForm.transmission} onChange={updateVehicleForm}>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>
          </div>

          <div className="admin-field-row">
            <label>
              Seats
              <select name="seats" value={vehicleForm.seats} onChange={updateVehicleForm} required>
                <option value="">Select seats</option>
                {seatOptions.map((seats) => (
                  <option key={seats} value={seats}>
                    {seats} seats
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-status-field">
              Status
              <div className="admin-status-options" role="group" aria-label="Vehicle status">
                {["Available", "Reserved", "Sold"].map((statusOption) => (
                  <button
                    className={vehicleForm.status === statusOption ? "is-active" : ""}
                    key={statusOption}
                    type="button"
                    onClick={() => setVehicleForm((current) => ({ ...current, status: statusOption }))}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="admin-upload">
            Unit photo
            <span className="admin-upload-box">
              <ImagePlus size={22} />
              <strong>{uploading ? "Uploading..." : "Upload vehicle photos"}</strong>
              <small>Select one or multiple JPG, PNG, WEBP, or GIF files up to 6MB each</small>
              <input name="imageUpload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} multiple />
            </span>
          </label>

          {(vehicleForm.images?.length || vehicleForm.image) && (
            <div className="admin-image-preview-grid">
              {(vehicleForm.images?.length ? vehicleForm.images : [vehicleForm.image]).map((photo, index) => (
                <div className="admin-image-preview" key={photo}>
                  <img src={photo} alt={`Vehicle photo ${index + 1}`} />
                  <span>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</span>
                  <button type="button" onClick={() => removeVehiclePhoto(photo)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <fieldset className="admin-financing-fields">
            <legend>Financing</legend>
            <p>Enter the vehicle price, estimated down payment, and monthly payment for each term.</p>
            <div className="admin-financing-primary-grid">
              <label>
                Vehicle price
                <input
                  name="price"
                  value={vehicleForm.price}
                  onChange={updatePesoField}
                  onBlur={() => formatPesoField("price")}
                  inputMode="numeric"
                  placeholder="PHP 1,850,000"
                  required
                />
              </label>
              <label>
                Down payment
                <input
                  name="downPayment"
                  value={vehicleForm.downPayment}
                  onChange={updatePesoField}
                  onBlur={() => formatPesoField("downPayment")}
                  inputMode="numeric"
                  placeholder="PHP 150,000"
                  required
                />
              </label>
            </div>
            <div className="admin-financing-grid">
              {[2, 3, 4, 5].map((years) => {
                const field = `payment${years}Years`;
                return (
                  <label key={years}>
                    {years} years / month
                    <input
                      name={field}
                      value={vehicleForm[field]}
                      onChange={updatePesoField}
                      onBlur={() => formatPesoField(field)}
                      inputMode="numeric"
                      placeholder="PHP 25,000"
                      required
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button className="button button-primary" type="submit">
            <Save size={18} /> Save vehicle
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>

        <section className="admin-list">
          <div className="admin-form-title">
            <span>{sortedVehicles.length} of {vehicles.length} units</span>
          </div>

          <label className="admin-search">
            Search entries
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Model, year, type, fuel..." />
          </label>

          <div className="admin-vehicle-list">
            {sortedVehicles.map((vehicle) => (
              <article className="admin-vehicle-row" key={vehicle.id}>
                <img src={vehicle.image} alt={vehicle.name} />
                <div>
                  <strong>{vehicle.name}</strong>
                  <span>{vehicle.year} / {vehicle.type} / {vehicle.status || "Available"} / PHP {Number(vehicle.price).toLocaleString("en-PH")}</span>
                </div>
                <button type="button" aria-label={`Edit ${vehicle.name}`} onClick={() => editVehicle(vehicle)}>
                  <Pencil size={17} />
                </button>
                <button type="button" aria-label={`Delete ${vehicle.name}`} onClick={() => deleteVehicle(vehicle)}>
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
