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
    image: "https://images.pexels.com/photos/1005634/pexels-photo-1005634.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "Executive family SUV profile with diesel efficiency, strong road presence, and Davao-ready ground clearance."
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
    image: "https://images.pexels.com/photos/8556280/pexels-photo-8556280.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A refined sedan choice for buyers who want a premium cabin, crisp handling, and business-class styling."
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
    image: "https://images.pexels.com/photos/4895416/pexels-photo-4895416.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A premium pickup listing for buyers needing cargo strength, elevated stance, and everyday comfort."
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
    image: "https://images.pexels.com/photos/37147584/pexels-photo-37147584.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A luxury transport profile for family, executive, or client-service use with a VIP seating focus."
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
    image: "https://images.pexels.com/photos/13741314/pexels-photo-13741314.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A statement performance listing for buyers who want weekend drama and unmistakable street presence."
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
    image: "https://images.pexels.com/photos/5975536/pexels-photo-5975536.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A seven-seat premium SUV profile with a composed highway feel and strong everyday practicality."
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
    image: "https://images.pexels.com/photos/7394765/pexels-photo-7394765.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A quiet luxury sedan listing with elegant styling, premium comfort, and a polished ownership feel."
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
    image: "https://images.pexels.com/photos/25286626/pexels-photo-25286626.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A modern people-mover profile with spacious seating and a premium shuttle look for family or business."
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
    image: "https://images.pexels.com/photos/305070/pexels-photo-305070.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A sharp compact sedan profile with turbo character, clean cabin tech, and a younger premium look."
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
    image: "https://images.pexels.com/photos/12681128/pexels-photo-12681128.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A premium 4x4 listing for buyers who want comfort, command seating, and long-trip confidence."
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
    image: "https://images.pexels.com/photos/15489329/pexels-photo-15489329.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A bold performance pickup profile for buyers who like aggressive styling and weekend capability."
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
    image: "https://images.pexels.com/photos/14313337/pexels-photo-14313337.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description: "A luxury crossover listing for buyers who want a quiet drive, premium comfort, and hybrid efficiency."
  }
];

const state = {
  type: "All",
  fuel: "All",
  transmission: "All",
  sort: "featured",
  search: "",
  maxPrice: 5800000
};

const formatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
});

const grid = document.querySelector("#vehicleGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#search");
const fuelSelect = document.querySelector("#fuel");
const transmissionSelect = document.querySelector("#transmission");
const sortSelect = document.querySelector("#sort");
const maxPriceInput = document.querySelector("#maxPrice");
const priceLabel = document.querySelector("#priceLabel");
const resetButton = document.querySelector("#resetFilters");
const dialog = document.querySelector("#vehicleDialog");
const dialogContent = document.querySelector("#dialogContent");
const closeDialog = document.querySelector("#closeDialog");
const prepareInquiry = document.querySelector("#prepareInquiry");
const formStatus = document.querySelector("#formStatus");

function formatPrice(value) {
  return formatter.format(value).replace("PHP", "PHP ");
}

function formatMileage(value) {
  return `${new Intl.NumberFormat("en-PH").format(value)} km`;
}

function vehicleMatches(vehicle) {
  const haystack = [
    vehicle.name,
    vehicle.type,
    vehicle.year,
    vehicle.fuel,
    vehicle.transmission,
    vehicle.description,
    vehicle.badge
  ].join(" ").toLowerCase();

  return (
    (state.type === "All" || vehicle.type === state.type) &&
    (state.fuel === "All" || vehicle.fuel === state.fuel) &&
    (state.transmission === "All" || vehicle.transmission === state.transmission) &&
    vehicle.price <= state.maxPrice &&
    haystack.includes(state.search.toLowerCase())
  );
}

function sortVehicles(list) {
  return [...list].sort((a, b) => {
    if (state.sort === "price-low") return a.price - b.price;
    if (state.sort === "price-high") return b.price - a.price;
    if (state.sort === "year-new") return b.year - a.year;
    return inventory.indexOf(a) - inventory.indexOf(b);
  });
}

function cardTemplate(vehicle) {
  return `
    <article class="vehicle-card">
      <div class="vehicle-media">
        <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
        <span class="badge">${vehicle.badge}</span>
      </div>
      <div class="vehicle-body">
        <div class="vehicle-title">
          <div>
            <h3>${vehicle.name}</h3>
            <span>${vehicle.type} / ${vehicle.year}</span>
          </div>
        </div>
        <strong class="price">${formatPrice(vehicle.price)}</strong>
        <ul class="spec-list" aria-label="${vehicle.name} specifications">
          <li>${vehicle.transmission}</li>
          <li>${vehicle.fuel}</li>
          <li>${formatMileage(vehicle.mileage)}</li>
          <li>${vehicle.seats} seats</li>
        </ul>
        <div class="card-actions">
          <button class="button button-primary" type="button" data-details="${vehicle.id}">Details</button>
          <a class="button button-ghost" href="#contact">Inquire</a>
        </div>
      </div>
    </article>
  `;
}

function emptyTemplate() {
  return `
    <div class="empty-state">
      <h3>No units match those filters</h3>
      <p>Try widening the price range or switching back to all body styles.</p>
    </div>
  `;
}

function renderVehicles() {
  const filtered = sortVehicles(inventory.filter(vehicleMatches));
  grid.innerHTML = filtered.length ? filtered.map(cardTemplate).join("") : emptyTemplate();
  resultCount.textContent = `Showing ${filtered.length} of ${inventory.length} units`;
  priceLabel.textContent = formatPrice(state.maxPrice);
}

function updateChip(type) {
  document.querySelectorAll("[data-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
}

function openVehicle(vehicleId) {
  const vehicle = inventory.find((item) => item.id === vehicleId);
  if (!vehicle) return;

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <img src="${vehicle.image}" alt="${vehicle.name}">
      <div class="dialog-copy">
        <p class="eyebrow">${vehicle.badge} / ${vehicle.type}</p>
        <div>
          <h2>${vehicle.name}</h2>
          <strong class="price">${formatPrice(vehicle.price)}</strong>
        </div>
        <p>${vehicle.description}</p>
        <ul class="spec-list">
          <li>${vehicle.year} model</li>
          <li>${vehicle.transmission}</li>
          <li>${vehicle.fuel}</li>
          <li>${formatMileage(vehicle.mileage)}</li>
          <li>${vehicle.seats} seats</li>
          <li>Davao City viewing</li>
        </ul>
        <p>Image is representative. Replace with actual unit photos before final customer launch.</p>
        <a class="button button-primary" href="#contact">Send Inquiry</a>
      </div>
    </div>
  `;

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

document.querySelector("#typeFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  state.type = button.dataset.type;
  updateChip(state.type);
  renderVehicles();
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderVehicles();
});

fuelSelect.addEventListener("change", (event) => {
  state.fuel = event.target.value;
  renderVehicles();
});

transmissionSelect.addEventListener("change", (event) => {
  state.transmission = event.target.value;
  renderVehicles();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderVehicles();
});

maxPriceInput.addEventListener("input", (event) => {
  state.maxPrice = Number(event.target.value);
  renderVehicles();
});

resetButton.addEventListener("click", () => {
  state.type = "All";
  state.fuel = "All";
  state.transmission = "All";
  state.sort = "featured";
  state.search = "";
  state.maxPrice = 5800000;

  searchInput.value = "";
  fuelSelect.value = "All";
  transmissionSelect.value = "All";
  sortSelect.value = "featured";
  maxPriceInput.value = state.maxPrice;
  updateChip(state.type);
  renderVehicles();
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-details]");
  if (button) openVehicle(button.dataset.details);
});

closeDialog.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

prepareInquiry.addEventListener("click", () => {
  const form = prepareInquiry.closest("form");
  const data = new FormData(form);
  const unit = data.get("unit") || "a selected unit";
  formStatus.textContent = `Inquiry draft ready for ${unit}. Connect this form to your real phone, Facebook page, or email before launch.`;
  formStatus.classList.add("show");
});

renderVehicles();
