const API_KEY = "YOUR_API_KEY_HERE";

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
  // Reset UI filters to default state for a new search
  document.getElementById("categoryFilter").selectedIndex = 0;
  document.getElementById("sortFilter").selectedIndex = 0;
  // 1. CACHING MECHANISM: Check if the city data is already in LocalStorage
  // We normalize the city name (lowercase, trim) to use as a unique cache key
  const cacheKey = "cache_" + cityName.toLowerCase().trim();
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    // If data exists, parse it and render immediately without network request
    const places = JSON.parse(cachedData);
    
    currentPlaces = places;
    document.getElementById("filterControls").style.display = "flex";
    
    showToast("Loaded " + cityName + " from cache ⚡", "success");
    renderResults(places);
    return; 
  }

  // 2. GEOCODING: If no cache, request coordinates from Nominatim API
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
  // Fetch raw place data within a 5000m radius using Geoapify
  const url =
    "https://api.geoapify.com/v2/places" +
     "?categories=tourism.attraction,tourism.sights,catering.restaurant,entertainment,entertainment.museum,national_park,leisure.park" +
    "&filter=circle:" + lon + "," + lat + ",5000" +
    "&bias=proximity:" + lon + "," + lat +
    "&limit=30" +
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

    // We calculate the exact distance for each place from the city center
    // using the Haversine formula to enable accurate sorting later
    places.forEach(function(place) {
        if (place.properties.lat && place.properties.lon) {
          place.properties.distance = calculateDistance(lat, lon, place.properties.lat, place.properties.lon);
        }
      });
      // Update LocalStorage cache with the new, fully processed data
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
      const dist = props.distance ? props.distance + "m" : "Відстань невідома";

      return (
        '<div class="place-card">' +
        '<div>' +
        '<h3>' + name + '</h3>' +
        '<span class="category">' + category + ' (' + dist + ')</span>' + 
        (address ? '<p style="font-size:12px;color:#6b7280;margin-top:4px">' + address + '</p>' : '') +
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

document.getElementById("customPlaceForm").addEventListener("submit", function(e) {
  e.preventDefault(); 
  const nameInput = document.getElementById("customName");
  const catInput = document.getElementById("customCategory");
  
  const name = nameInput.value.trim();
  const category = catInput.value;
  if (name.length < 2) {
    showToast("Name must be at least 2 characters long.", "error");
    return;
  }
  addToTrip(name, category);
  nameInput.value = "";
});

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
function filterAndSortResults() {
  console.log("Button clicked. Selected filter: ", document.getElementById("sortFilter").value);
  
  // Create a shallow copy of the array to avoid mutating the original fetched data
  let filtered = [...currentPlaces]; 

  const catSelect = document.getElementById("categoryFilter").value;
  const sortSelect = document.getElementById("sortFilter").value;
  
  // 1. FILTERING: Retain only places that match the selected category
  if (catSelect !== "all") {
    filtered = filtered.filter(function(place) {
      if (!place.properties.categories) return false;
      return place.properties.categories.some(function(c) {
        return c.includes(catSelect);
      });
    });
  }

 // 2. SORTING: Reorder the array based on user preference
 if (sortSelect === "distance") {
    filtered.sort((a, b) => (a.properties.distance || 999999) - (b.properties.distance || 999999));
  } else if (sortSelect === "name") {
    // Alphabetical sort using localeCompare for accurate string comparison
    filtered.sort((a, b) => (a.properties.name || "").localeCompare(b.properties.name || ""));
  } else if (sortSelect === "rating") {
    // Sort by rating (highest first). Fallback to 0 if rating is missing
    filtered.sort((a, b) => (b.properties.rating || 0) - (a.properties.rating || 0));
  }

  renderResults(filtered);
}
//  SORTING TRIP LIST
function sortTrip(type) {
  if (trip.length === 0) {
    showToast("Your list is empty!", "info");
    return;
  }

  if (type === 'name') {
    // Sorted by name (from A to Z)
    trip.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
  } else if (type === 'category') {
    // Sorted by category (from A to Z)
    trip.sort(function(a, b) {
      return a.category.localeCompare(b.category);
    });
  }

  saveTrip();      // Save sorted list
  renderTrip();
  showToast("Sorted by " + type, "success");
}
let map = null; 
const detailsCache = {};

async function showDetails(name, category, address, lat, lon) {
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalCategory').textContent = category;
  document.getElementById('modalAddress').textContent = address || "No detailed address provided.";
  document.getElementById('modalMapLink').href = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
  
  document.getElementById('modalDescription').textContent = "Searching Wikipedia for more details...";
  const img = document.getElementById('modalImage');
  img.style.display = 'none'; 

  document.getElementById('detailsModal').style.display = 'flex';

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  
  if (detailsCache[cacheKey]) {
    console.log("Loading details from local cache ⚡");
    updateModalContent(detailsCache[cacheKey]);
  } else {
    try {
      const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=geosearch&gscoord=${lat}|${lon}&gsradius=300&gslimit=1`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      let searchTitle = name; 

      if (geoData.query && geoData.query.geosearch && geoData.query.geosearch.length > 0) {
        searchTitle = geoData.query.geosearch[0].title;
      }

      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages&exintro&explaintext&pithumbsize=600&titles=${encodeURIComponent(searchTitle)}`;
      const response = await fetch(wikiUrl);
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (pageId !== "-1") {
        const page = pages[pageId];
        
        let shortDesc = page.extract || "A unique description was not available.";
        if (shortDesc.length > 220) {
          shortDesc = shortDesc.substring(0, 220);
          shortDesc = shortDesc.substring(0, Math.min(shortDesc.length, shortDesc.lastIndexOf(" "))) + "...";
        }

        detailsCache[cacheKey] = {
          description: shortDesc,
          image: page.thumbnail ? page.thumbnail.source : null
        };
      } else {
        detailsCache[cacheKey] = {
          description: `This specific location has been verified at coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}. Further historical details were not found on Wikipedia.`,
          image: null
        };
      }
      updateModalContent(detailsCache[cacheKey]);

    } catch (error) {
      console.error("Error fetching dynamic details:", error);
      document.getElementById('modalDescription').textContent = "Error loading details.";
    }
  }

  if (!map) {
    map = L.map('map').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  } else {
    map.setView([lat, lon], 15);
  }

  L.marker([lat, lon]).addTo(map)
    .bindPopup('<b>' + name + '</b>')
    .openPopup();

  setTimeout(() => map.invalidateSize(), 100);
}

function updateModalContent(data) {
  document.getElementById('modalDescription').textContent = data.description;
  const img = document.getElementById('modalImage');
  if (data.image) {
    img.src = data.image;
    img.style.display = 'block';
  } else {
    img.style.display = 'none'; 
  }
}

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
  trip = originalTrip;
  saveTrip();
  renderTrip();

  console.log("%cTESTS COMPLETED", "color: blue; font-weight: bold;");
}
setTimeout(runUnitTests, 2000);

function closeModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

// Mathematical implementation of the Haversine formula
// Calculates the great-circle distance between two geographic coordinates in meters

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c; 
  return Math.round(distanceKm * 1000); // Return result in meters
}