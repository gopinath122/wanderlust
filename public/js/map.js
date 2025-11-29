// public/js/map.js

// 1. Initialize Map
// We expect 'coordinates' to be available globally from the EJS file
// Leaflet needs [Lat, Lng], so we reverse the MongoDB [Lng, Lat] order
let map = L.map("map").setView([coordinates[1], coordinates[0]], 13);

// 2. Add OpenStreetMap Tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// 3. Add Marker
let marker = L.marker([coordinates[1], coordinates[0]]).addTo(map);

// 4. Add Popup
marker
  .bindPopup("<b>Exact Location</b><br>Will be provided after booking")
  .openPopup();
