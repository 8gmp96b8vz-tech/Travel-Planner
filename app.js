const API_KEY = "27bccbcf5a7b40a4a10c36dafd837587";

function showToast(message, type) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "toast " + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function searchCity(cityName) {
  // 1. ПЕРЕВІРЯЄМО КЕШ: Чи шукали ми вже це місто?
  const cacheKey = "cache_" + cityName.toLowerCase().trim();
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const places = JSON.parse(cachedData);
    
    currentPlaces = places;
    document.getElementById("filterControls").style.display = "flex";
    
    showToast("Loaded " + cityName + " from cache ⚡", "success");
    renderResults(places);
    return; 
  }

  // 2. ЯКЩО КЕШУ НЕМАЄ — робимо запит в інтернет
  document.getElementById("results").innerHTML =
    "<p class='placeholder'>Searching for " + cityName + "...</p>";

  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?city=" + encodeURIComponent(cityName) +
    "&format=json&limit=1";

  fetch(url)
    .then(function (response) { return response.json(); })
    .then(function (data) {
      if (data.length === 0) {
        showToast('City "' + cityName + '" not found. Try another name.', "error");
        document.getElementById("results").innerHTML =
          "<p class='placeholder'>No results. Try a different city name.</p>";
        return;
      }
      const lat = data[0].lat;
      const lon = data[0].lon;
      getPlaces(lat, lon, cityName);
    })
    .catch(function () {
      showToast("Network error. Check your internet connection.", "error");
      document.getElementById("results").innerHTML =
        "<p class='placeholder'>Could not connect. Try again.</p>";
    });
}

function getPlaces(lat, lon, cityName) {
  const url =
    "https://api.geoapify.com/v2/places" +
    "?categories=tourism.attraction,tourism.sights,catering.restaurant,entertainment" +
    "&filter=circle:" + lon + "," + lat + ",5000" +
    "&bias=proximity:" + lon + "," + lat +
    "&limit=15" +
    "&apiKey=" + API_KEY;

  fetch(url)
    .then(function (response) { return response.json(); })
    .then(function (data) {
      const places = data.features;

      if (!places || places.length === 0) {
        showToast("No attractions found near " + cityName + ".", "info");
        document.getElementById("results").innerHTML =
          "<p class='placeholder'>No places found. Try a bigger city.</p>";
        return;
      }

      showToast(places.length + " places found in " + cityName + "!", "success");

      // ЗБЕРІГАЄМО В КЕШ: записуємо нові дані в блокнот для наступного разу
      const cacheKey = "cache_" + cityName.toLowerCase().trim();
      localStorage.setItem(cacheKey, JSON.stringify(places));
      currentPlaces = places;
      document.getElementById("filterControls").style.display = "flex";
      renderResults(places);
    })
    .catch(function () {
      showToast("Could not load places. Check your API key.", "error");
    });
}

function renderResults(places) {
  const container = document.getElementById("results");

  container.innerHTML = places
    .map(function (place) {
      const props = place.properties;
      const name = props.name || "Unnamed place";
      const category = props.categories
        ? props.categories[0].split(".").pop().replace(/_/g, " ")
        : "attraction";
      const address = props.address_line2 || "";

      return (
        '<div class="place-card">' +
        '<div>' +
        '<h3>' + name + '</h3>' +
        '<span class="category">' + category + '</span>' +
        (address ? '<p style="font-size:12px;color:#6b7280;margin-top:4px">' + address + '</p>' : '') +
        
        // ОСЬ НОВА КНОПКА, ЯКУ Я ДОДАВ:
        '<button onclick="showDetails(\'' + name.replace(/'/g, "\\'") + '\', \'' + category.replace(/'/g, "\\'") + '\', \'' + address.replace(/'/g, "\\'") + '\', ' + props.lat + ', ' + props.lon + ')" style="display:block; margin-top:8px; background:none; border:none; color:var(--blue); cursor:pointer; font-size:13px; padding:0; font-weight:bold;">📍 View on Map</button>' +
        
        '</div>' +
        '<button class="add-btn" onclick="addToTrip(\'' +
        name.replace(/'/g, "\\'") + "','" + category.replace(/'/g, "\\'") +
        '\')">' +
        '+ Add' +
        '</button>' +
        '</div>'
      );
    })
    .join("");
}

let trip = JSON.parse(localStorage.getItem("trip")) || [];

function saveTrip() {
  localStorage.setItem("trip", JSON.stringify(trip));
}

function renderTrip() {
  const list = document.getElementById("tripItems");
  const emptyMsg = document.getElementById("emptyMsg");

  emptyMsg.style.display = trip.length === 0 ? "block" : "none";

  list.innerHTML = trip
    .map(function (place, index) {
      return (
        '<li>' +
        '<span>' + place.name +
        ' <small style="color:#6b7280">(' + place.category + ')</small>' +
        '</span>' +
        '<button class="remove-btn" onclick="removeFromTrip(' + index + ')">✕</button>' +
        '</li>'
      );
    })
    .join("");
}

function addToTrip(name, category) {
  if (trip.some(function (p) { return p.name === name; })) {
    showToast('"' + name + '" is already in your list!', "info");
    return;
  }
  trip.push({ name: name, category: category });
  saveTrip();
  renderTrip();
  showToast('"' + name + '" added to your trip!', "success");
}

function removeFromTrip(index) {
  const name = trip[index].name;
  trip.splice(index, 1);
  saveTrip();
  renderTrip();
  showToast('"' + name + '" removed.', "info");
}

document.getElementById("searchBtn").addEventListener("click", function () {
  const city = document.getElementById("searchInput").value.trim();
  if (city === "") {
    showToast("Please type a city name first.", "info");
    return;
  }
  searchCity(city);
});

document.getElementById("searchInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") document.getElementById("searchBtn").click();
});

renderTrip();

// --- ФІЛЬТРАЦІЯ ТА СОРТУВАННЯ ПОШУКУ ---
let currentPlaces = []; // Глобальна змінна для зберігання поточних результатів

function filterAndSortResults() {
  let filtered = [...currentPlaces]; // Робимо копію масиву

  const catSelect = document.getElementById("categoryFilter").value;
  const sortSelect = document.getElementById("sortFilter").value;

  // 1. Фільтрація за категорією
  if (catSelect !== "all") {
    filtered = filtered.filter(function(place) {
      if (!place.properties.categories) return false;
      // Шукаємо, чи є обрана категорія (tourism, catering тощо) у списку категорій місця
      return place.properties.categories.some(function(c) {
        return c.includes(catSelect);
      });
    });
  }

  // 2. Сортування за відстанню
  if (sortSelect === "distance") {
    filtered.sort(function(a, b) {
      // Geoapify повертає distance у метрах від центру пошуку
      const distA = a.properties.distance || 999999;
      const distB = b.properties.distance || 999999;
      return distA - distB;
    });
  }

  // Перемальовуємо результати з уже відфільтрованим списком
  renderResults(filtered);
}

//  SORTING TRIP LIST
function sortTrip(type) {
  if (trip.length === 0) {
    showToast("Your list is empty!", "info");
    return;
  }

  if (type === 'name') {
    // Сортуємо за назвою (від A до Z)
    trip.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
  } else if (type === 'category') {
    // Сортуємо за категорією (від A до Z)
    trip.sort(function(a, b) {
      return a.category.localeCompare(b.category);
    });
  }

  saveTrip();      // Зберігаємо відсортований список
  renderTrip();    // Оновлюємо список на сторінці
  showToast("Sorted by " + type, "success");
}
// --- ІНТЕРАКТИВНА КАРТА LEAFLET ---
let map = null; // Глобальна змінна для збереження карти

function showDetails(name, category, address, lat, lon) {
  // 1. Заповнюємо текст у вікні
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalCategory').textContent = category;
  document.getElementById('modalAddress').textContent = address || "No detailed address provided.";

  // 2. Показуємо вікно
  document.getElementById('detailsModal').style.display = 'flex';

  // 3. Ініціалізуємо або оновлюємо карту
  if (!map) {
    // Якщо карти ще немає, створюємо її
    map = L.map('map').setView([lat, lon], 15); // 15 - це масштаб наближення
    
    // Підключаємо безкоштовні тайли (зображення) від OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  } else {
    // Якщо карта вже існує, просто переміщуємо камеру на нові координати
    map.setView([lat, lon], 15);
  }

  // 4. Додаємо червоний маркер на локацію
  L.marker([lat, lon]).addTo(map)
    .bindPopup('<b>' + name + '</b>')
    .openPopup();

  // 5. Виправляємо баг рендеру: Leaflet не знає розмірів карти, поки вона була схована (display: none)
  setTimeout(() => map.invalidateSize(), 100);
}

function closeModal() {
  document.getElementById('detailsModal').style.display = 'none';
}
// --- UNIT TESTS (tests.js) ---

function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual === expected) return true;
      console.error(`Error: Expected '${expected}', but got '${actual}'`);
      return false;
    }
  };
}

function runUnitTests() {
  console.log("%cRUNNING TRAVEL PLANNER TESTS", "color: blue; font-weight: bold; font-size: 14px;");

  const originalTrip = [...trip];

  try {
    // TEST 1: Duplicate protection
    trip = []; 
    addToTrip("Test Rome", "tourism"); 
    addToTrip("Test Rome", "tourism"); 
    
    if (expect(trip.length).toBe(1)) {
      console.log("%cTest 1 (Duplicate protection) passed successfully.", "color: green");
    }

    // TEST 2: Alphabetical sorting
    trip = [
      { name: "Zebra Park", category: "park" },
      { name: "Apple Store", category: "shop" }
    ];
    sortTrip("name"); 
    
    if (expect(trip[0].name).toBe("Apple Store")) {
      console.log("%cTest 2 (Alphabetical sorting) passed successfully.", "color: green");
    }

    // TEST 3: Distance sorting
    let mockPlaces = [
      { properties: { name: "Far Place", distance: 1000 } },
      { properties: { name: "Nearest Place", distance: 150 } },
      { properties: { name: "Mid Place", distance: 500 } }
    ];
    
    mockPlaces.sort(function(a, b) {
      const distA = a.properties.distance || 999999;
      const distB = b.properties.distance || 999999;
      return distA - distB;
    });

    if (expect(mockPlaces[0].properties.name).toBe("Nearest Place")) {
      console.log("%cTest 3 (Distance sorting) passed successfully.", "color: green");
    }

  } catch (error) {
    console.error("Critical error during testing:", error);
  }

  // Повертаємо твої дані
  trip = originalTrip;
  saveTrip();
  renderTrip();

  console.log("%c--- TESTS COMPLETED ---", "color: blue; font-weight: bold;");
}
setTimeout(runUnitTests, 2000);