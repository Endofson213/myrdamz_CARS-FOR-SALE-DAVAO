"use client";

import { ArrowLeft, ArrowRight, Home, ImagePlus, LogOut, Pencil, Save, ShieldCheck, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { vehicleBodyTypes } from "../data/vehicles";

const blankVehicle = {
  id: "",
  name: "",
  type: "",
  year: "",
  price: "",
  mileage: "",
  fuel: "",
  transmission: "",
  seats: "",
  status: "Available",
  soldDate: "",
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
  const [authForm, setAuthForm] = useState({ username: "", password: "", setupCode: "" });
  const [vehicles, setVehicles] = useState([]);
  const [heroImages, setHeroImages] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(blankVehicle);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroStatus, setHeroStatus] = useState("");
  const [formDirty, setFormDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const sortedVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles
      .filter((vehicle) => {
        const text = [vehicle.name, vehicle.type, vehicle.year, vehicle.fuel, vehicle.transmission, vehicle.status, vehicle.soldDate]
          .join(" ")
          .toLowerCase();
        const matchesSearch = text.includes(query);
        const matchesStatus = statusFilter === "All" || (vehicle.status || "Available") === statusFilter;
        const matchesType = typeFilter === "All" || vehicle.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [vehicles, search, statusFilter, typeFilter]);

  const adminTypeOptions = useMemo(
    () => ["All", ...Array.from(new Set(vehicles.map((vehicle) => vehicle.type).filter(Boolean))).sort()],
    [vehicles]
  );

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!formDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [formDirty]);

  async function loadSession() {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not check the admin session.");
      setSession({ loading: false, ...data });

      if (data.authenticated) {
        loadVehicles();
        loadHeroImages();
      }
    } catch (error) {
      setSession({ loading: false, authenticated: false, setupRequired: false });
      setStatus(error instanceof Error ? error.message : "Could not check the admin session.");
    }
  }

  async function loadVehicles() {
    try {
      const response = await fetch("/api/admin/vehicles", { cache: "no-store" });
      const data = await response.json();

      if (response.status === 401) {
        setSession({ loading: false, authenticated: false, setupRequired: false });
        setStatus("Your admin session expired. Log in again.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load vehicles.");

      setVehicles(data.vehicles || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load vehicles.");
    }
  }

  async function loadHeroImages() {
    try {
      const response = await fetch("/api/admin/hero-images", { cache: "no-store" });
      const data = await response.json();

      if (response.status === 401) {
        setSession({ loading: false, authenticated: false, setupRequired: false });
        setHeroStatus("Your admin session expired. Log in again.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load hero images.");

      setHeroImages(data.images || []);
      setHeroStatus("");
    } catch (error) {
      setHeroStatus(error instanceof Error ? error.message : "Could not load hero images.");
    }
  }

  function updateAuthForm(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function updateVehicleForm(event) {
    const { name, value } = event.target;
    setVehicleForm((current) => ({ ...current, [name]: value }));
    setFormDirty(true);
  }

  function getTodayInputDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateVehicleStatus(statusOption) {
    setVehicleForm((current) => ({
      ...current,
      status: statusOption,
      soldDate: statusOption === "Sold" ? current.soldDate || getTodayInputDate() : ""
    }));
    setFormDirty(true);
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
    setFormDirty(true);
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
    setFormDirty(true);
  }

  function formatMileage(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? `${Number(digits).toLocaleString("en-PH")} km` : "";
  }

  function updateMileage(event) {
    setVehicleForm((current) => ({
      ...current,
      mileage: formatMileage(event.target.value)
    }));
    setFormDirty(true);
  }

  function clearVehicleForm() {
    const confirmed = window.confirm(
      "Clear all vehicle fields and stop editing the current entry?"
    );
    if (!confirmed) return;

    setVehicleForm(blankVehicle);
    setEditingId("");
    setFormDirty(false);
    setStatus("Vehicle form cleared.");
  }

  function confirmDiscardChanges() {
    if (!formDirty) return true;
    return window.confirm("Discard the unsaved changes in the vehicle form?");
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image for compression."));
      };
      image.src = url;
    });
  }

  async function compressImageFile(file, {
    maxDimension = 1600,
    quality = 0.76,
    fallbackName = "vehicle-photo"
  } = {}) {
    if (file.type === "image/gif") return file;

    const image = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || fallbackName;
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  }

  async function uploadHeroImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const confirmed = window.confirm(
      `Compress and upload ${files.length} hero image${files.length === 1 ? "" : "s"} to Supabase?`
    );
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setUploadingHero(true);
    setHeroStatus("");

    try {
      let nextImages = heroImages;

      for (const file of files) {
        const uploadFile = await compressImageFile(file, {
          maxDimension: 2200,
          quality: 0.72,
          fallbackName: "hero-image"
        });
        const formData = new FormData();
        formData.append("image", uploadFile);

        const response = await fetch("/api/admin/hero-images", {
          method: "POST",
          body: formData
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not upload hero image.");
        }

        nextImages = data.images || nextImages;
        setHeroImages(nextImages);
      }

      setHeroStatus(`${files.length} hero image${files.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setHeroStatus(error instanceof Error ? error.message : "Could not upload hero image.");
    } finally {
      setUploadingHero(false);
      event.target.value = "";
    }
  }

  async function moveHeroImage(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= heroImages.length) return;

    const nextImages = [...heroImages];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];

    try {
      const response = await fetch("/api/admin/hero-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: nextImages })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not reorder hero images.");

      setHeroImages(data.images || nextImages);
      setHeroStatus("Hero image order updated.");
    } catch (error) {
      setHeroStatus(error instanceof Error ? error.message : "Could not reorder hero images.");
    }
  }

  async function removeHeroImage(image, index) {
    const confirmed = window.confirm(
      `Permanently delete hero image ${index + 1} from Supabase? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/hero-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: image })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not delete hero image.");

      setHeroImages(data.images || []);
      setHeroStatus("Hero image deleted.");
    } catch (error) {
      setHeroStatus(error instanceof Error ? error.message : "Could not delete hero image.");
    }
  }

  async function uploadImage(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const confirmed = window.confirm(
      `Upload ${files.length} photo${files.length === 1 ? "" : "s"} to storage?`
    );
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setUploading(true);
    setStatus("");

    const uploadedUrls = [];
    const uploadWarnings = [];

    try {
      for (const file of files) {
        const uploadFile = await compressImageFile(file);
        const formData = new FormData();
        formData.append("image", uploadFile);

        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData
        });
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : { error: await response.text() };

        if (!response.ok) {
          setStatus(data.error || "Could not upload image.");
          return;
        }

        if (!data.url) {
          setStatus("The upload finished, but no image URL was returned.");
          return;
        }

        uploadedUrls.push(data.url);
        if (data.warning) uploadWarnings.push(data.warning);
      }

      setVehicleForm((current) => {
        const images = Array.from(new Set([...(current.images || []), current.image, ...uploadedUrls].filter(Boolean)));
        return { ...current, image: images[0] || "", images };
      });
      setFormDirty(true);
      setStatus([
        `${uploadedUrls.length} compressed photo${uploadedUrls.length === 1 ? "" : "s"} uploaded. Save the vehicle to keep them.`,
        ...uploadWarnings
      ].join(" "));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeVehiclePhoto(photo) {
    const confirmed = window.confirm(
      "Remove this photo from the vehicle? After saving, it will be deleted from storage after at least 24 hours if no vehicle uses it."
    );
    if (!confirmed) return;

    setVehicleForm((current) => {
      const images = (current.images || []).filter((image) => image !== photo);
      return { ...current, images, image: images[0] || "" };
    });
    setFormDirty(true);
  }

  function moveVehiclePhoto(index, direction) {
    setVehicleForm((current) => {
      const images = [...(current.images?.length ? current.images : [current.image].filter(Boolean))];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= images.length) return current;

      [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
      return { ...current, images, image: images[0] || "" };
    });
    setFormDirty(true);
  }

  function setCoverPhoto(index) {
    setVehicleForm((current) => {
      const images = [...(current.images?.length ? current.images : [current.image].filter(Boolean))];
      const [cover] = images.splice(index, 1);
      const nextImages = [cover, ...images].filter(Boolean);
      return { ...current, images: nextImages, image: nextImages[0] || "" };
    });
    setFormDirty(true);
  }

  async function submitAuth(event) {
    event.preventDefault();

    if (
      session.setupRequired
      && !window.confirm(`Create the admin account "${authForm.username.trim()}"?`)
    ) {
      return;
    }

    setStatus("");
    setAuthSubmitting(true);

    try {
      const endpoint = session.setupRequired ? "/api/admin/setup" : "/api/admin/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Authentication failed.");

      setSession({ loading: false, authenticated: true, setupRequired: false, user: data.user });
      setAuthForm({ username: "", password: "", setupCode: "" });
      setStatus(session.setupRequired ? "Admin account created." : "Logged in.");
      loadVehicles();
      loadHeroImages();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function logout() {
    if (!confirmDiscardChanges()) return;

    const confirmed = window.confirm("Log out of the admin dashboard?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not log out.");

      setSession({ loading: false, authenticated: false, setupRequired: false });
      setVehicles([]);
      setHeroImages([]);
      setVehicleForm(blankVehicle);
      setEditingId("");
      setFormDirty(false);
      setStatus("Logged out.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not log out.");
    }
  }

  async function saveVehicle(event) {
    event.preventDefault();

    const action = editingId ? "update" : "add";
    const confirmed = window.confirm(
      `${editingId ? "Update" : "Add"} "${vehicleForm.name.trim()}"? This will ${action} the vehicle in the live inventory.`
    );
    if (!confirmed) return;

    setStatus("");
    setSaving(true);

    try {
      const response = await fetch(editingId ? `/api/admin/vehicles/${editingId}` : "/api/admin/vehicles", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleForm)
      });
      const data = await response.json();

      if (response.status === 401) {
        setSession({ loading: false, authenticated: false, setupRequired: false });
        throw new Error("Your admin session expired. Log in again.");
      }
      if (!response.ok) throw new Error(data.error || "Could not save vehicle.");

      setStatus(
        data.warning
          ? `${data.vehicle.name} saved. ${data.warning}`
          : `${data.vehicle.name} saved with vehicle ID "${data.vehicle.id}".`
      );
      setVehicleForm(blankVehicle);
      setEditingId("");
      setFormDirty(false);
      loadVehicles();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save vehicle.");
    } finally {
      setSaving(false);
    }
  }

  function editVehicle(vehicle) {
    if (formDirty && editingId !== vehicle.id && !confirmDiscardChanges()) return;

    setEditingId(vehicle.id);
    setVehicleForm({
      ...blankVehicle,
      ...vehicle,
      images: vehicle.images?.length ? vehicle.images : [vehicle.image].filter(Boolean),
      year: String(vehicle.year),
      price: formatPeso(vehicle.price),
      mileage: formatMileage(vehicle.mileage),
      seats: String(vehicle.seats),
      soldDate: vehicle.soldDate || "",
      downPayment: formatPeso(vehicle.financing?.downPayment),
      payment2Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 2)?.monthlyPayment),
      payment3Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 3)?.monthlyPayment),
      payment4Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 4)?.monthlyPayment),
      payment5Years: formatPeso(vehicle.financing?.terms?.find((term) => Number(term.years) === 5)?.monthlyPayment)
    });
    setFormDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteVehicle(vehicle) {
    const confirmed = window.confirm(
      `Permanently delete "${vehicle.name}"? Its unused uploaded photos will be removed from storage after at least 24 hours.`
    );
    if (!confirmed) return;

    setStatus("");
    setDeletingId(vehicle.id);

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicle.id}`, { method: "DELETE" });
      const data = await response.json();

      if (response.status === 401) {
        setSession({ loading: false, authenticated: false, setupRequired: false });
        throw new Error("Your admin session expired. Log in again.");
      }
      if (!response.ok) throw new Error(data.error || "Could not delete vehicle.");

      if (editingId === vehicle.id) {
        setVehicleForm(blankVehicle);
        setEditingId("");
        setFormDirty(false);
      }
      setStatus(data.warning ? `${vehicle.name} deleted. ${data.warning}` : `${vehicle.name} deleted.`);
      loadVehicles();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete vehicle.");
    } finally {
      setDeletingId("");
    }
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
              <input
                name="password"
                value={authForm.password}
                onChange={updateAuthForm}
                type="password"
                required
                minLength={session.setupRequired ? 12 : 1}
                maxLength={128}
                autoComplete={session.setupRequired ? "new-password" : "current-password"}
              />
            </label>
            {session.setupRequired && (
              <label>
                Setup code
                <input
                  name="setupCode"
                  value={authForm.setupCode}
                  onChange={updateAuthForm}
                  type="password"
                  required
                  autoComplete="off"
                />
              </label>
            )}
            <button className="button button-primary" type="submit" disabled={authSubmitting}>
              {authSubmitting ? "Please wait..." : session.setupRequired ? "Create Admin" : "Log In"} <ShieldCheck size={18} />
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
          <Link
            className="button button-ghost"
            href="/"
            onClick={(event) => {
              if (!confirmDiscardChanges()) event.preventDefault();
            }}
          >
            <Home size={18} /> Home
          </Link>
          <button className="button button-ghost" type="button" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <section className="admin-hero-panel">
        <div className="admin-form-title">
          <div>
            <p className="eyebrow">Homepage</p>
            <h2>Hero images</h2>
          </div>
          <span>{heroImages.length} image{heroImages.length === 1 ? "" : "s"}</span>
        </div>

        <label className="admin-upload">
          <span className="admin-upload-box">
            <ImagePlus size={22} />
            <strong>{uploadingHero ? "Compressing and uploading..." : "Upload hero images"}</strong>
            <small>Images are resized to 2200px and compressed to WebP at 72% quality.</small>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadHeroImages}
              disabled={uploadingHero}
              multiple
            />
          </span>
        </label>

        {heroImages.length > 0 && (
          <div className="admin-hero-grid">
            {heroImages.map((image, index) => (
              <article key={image} className="admin-hero-image">
                <img src={image} alt={`Homepage hero ${index + 1}`} loading="lazy" decoding="async" />
                <div>
                  <strong>{index === 0 ? "First slide" : `Slide ${index + 1}`}</strong>
                  <span className="admin-image-actions">
                    <button
                      type="button"
                      onClick={() => moveHeroImage(index, -1)}
                      disabled={index === 0}
                      aria-label="Move hero image left"
                    >
                      <ArrowLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHeroImage(index, 1)}
                      disabled={index === heroImages.length - 1}
                      aria-label="Move hero image right"
                    >
                      <ArrowRight size={15} />
                    </button>
                    <button type="button" onClick={() => removeHeroImage(image, index)}>
                      Delete
                    </button>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {heroStatus && <p className="form-status">{heroStatus}</p>}
      </section>

      <section className="admin-grid">
        <form className="admin-form admin-vehicle-form" onSubmit={saveVehicle}>
          <div className="admin-form-title">
            <h2>{editingId ? "Edit vehicle" : "Add vehicle"}</h2>
            <button className="text-button" type="button" onClick={clearVehicleForm}>
              Clear all
            </button>
          </div>

          <input type="hidden" name="id" value={vehicleForm.id} />
          <label>
            Vehicle name
            <input name="name" value={vehicleForm.name} onChange={updateVehicleName} placeholder="Model Variant" required />
          </label>

          <div className="admin-field-row">
            <label>
              Type
              <select name="type" value={vehicleForm.type} onChange={updateVehicleForm} required>
                <option value="" disabled>Select type</option>
                {vehicleBodyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Year
              <select name="year" value={vehicleForm.year} onChange={updateVehicleForm} required>
                <option value="" disabled>Select year</option>
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
            <input
              name="mileage"
              value={vehicleForm.mileage}
              onChange={updateMileage}
              inputMode="numeric"
              placeholder="Example: 28,000 km"
              required
            />
          </label>

          <div className="admin-field-row">
            <label>
              Fuel
              <select name="fuel" value={vehicleForm.fuel} onChange={updateVehicleForm} required>
                <option value="" disabled>Select fuel</option>
                <option value="Diesel">Diesel</option>
                <option value="Gasoline">Gasoline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>
            <label>
              Transmission
              <select name="transmission" value={vehicleForm.transmission} onChange={updateVehicleForm} required>
                <option value="" disabled>Select transmission</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
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
                    onClick={() => updateVehicleStatus(statusOption)}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {vehicleForm.status === "Sold" && (
            <label className="admin-half-field">
              Sold date
              <input name="soldDate" type="date" value={vehicleForm.soldDate} onChange={updateVehicleForm} required />
            </label>
          )}

          <label className="admin-upload">
            Unit photo
            <span className="admin-upload-box">
              <ImagePlus size={22} />
              <strong>{uploading ? "Compressing and uploading..." : "Upload vehicle photos"}</strong>
              <small>Select JPG, PNG, WEBP, or GIF files. Photos are compressed and must be under 4MB when uploaded.</small>
              <input name="imageUpload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} multiple />
            </span>
          </label>

          {(vehicleForm.images?.length || vehicleForm.image) && (
            <div className="admin-image-preview-grid">
              {(vehicleForm.images?.length ? vehicleForm.images : [vehicleForm.image]).map((photo, index) => (
                <div className="admin-image-preview" key={photo}>
                  <img src={photo} alt={`Vehicle photo ${index + 1}`} loading="lazy" decoding="async" />
                  <span>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</span>
                  <div className="admin-image-actions">
                    <button type="button" onClick={() => moveVehiclePhoto(index, -1)} disabled={index === 0} aria-label="Move photo left">
                      <ArrowLeft size={15} />
                    </button>
                    <button type="button" onClick={() => setCoverPhoto(index)} disabled={index === 0} aria-label="Make cover photo">
                      <Star size={15} />
                    </button>
                    <button type="button" onClick={() => moveVehiclePhoto(index, 1)} disabled={index === (vehicleForm.images?.length ? vehicleForm.images : [vehicleForm.image]).length - 1} aria-label="Move photo right">
                      <ArrowRight size={15} />
                    </button>
                    <button type="button" onClick={() => removeVehiclePhoto(photo)}>
                      Remove
                    </button>
                  </div>
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

          <button className="button button-primary" type="submit" disabled={saving || uploading}>
            <Save size={18} /> {saving ? "Saving..." : "Save vehicle"}
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

          <div className="admin-filter-grid">
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {["All", "Available", "Reserved", "Sold"].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                {adminTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setTypeFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="admin-vehicle-list">
            {sortedVehicles.map((vehicle) => (
              <article className="admin-vehicle-row" key={vehicle.id}>
                <img src={vehicle.image} alt={vehicle.name} loading="lazy" decoding="async" />
                <div>
                  <strong>{vehicle.name}</strong>
                  <span>{vehicle.year} / {vehicle.type} / {vehicle.status || "Available"} / PHP {Number(vehicle.price).toLocaleString("en-PH")}</span>
                  {vehicle.status === "Sold" && vehicle.soldDate && <small>Sold on {vehicle.soldDate}</small>}
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${vehicle.name}`}
                  onClick={() => editVehicle(vehicle)}
                  disabled={saving || deletingId === vehicle.id}
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${vehicle.name}`}
                  onClick={() => deleteVehicle(vehicle)}
                  disabled={saving || Boolean(deletingId)}
                >
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
