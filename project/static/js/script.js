// Configuration
const MAX_SPEED_GAUGE = 100; // km/h for full circle
const POLL_INTERVAL = 1000; // ms

// DOM Elements
const speedDisplay = document.getElementById('speedDisplay');
const speedRing = document.getElementById('speedRing');
const distDisplay = document.getElementById('distDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const maxSpeedDisplay = document.getElementById('maxSpeedDisplay');
const connectionStatus = document.getElementById('connectionStatus');
const gpsStatus = document.getElementById('gpsStatus');
const latDisplay = document.getElementById('latDisplay');
const lonDisplay = document.getElementById('lonDisplay');
const resetBtn = document.getElementById('resetBtn');

// State
let map;
let polyline;
let currentMarker;
let pathData = [];
let maxSpeed = 0;
let watchId = null;

// Initialize Map
function initMap() {
    map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    polyline = L.polyline([], {
        color: '#ccff00',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(map);

    // Current position marker
    currentMarker = L.circleMarker([0, 0], {
        radius: 8,
        fillColor: '#ccff00',
        color: '#000',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map);
}

// Update UI
function updateDashboard(data) {
    const current = data.current;
    const path = data.path;

    // Speed
    const speed = current.speed || 0;
    speedDisplay.textContent = Math.round(speed);

    // Gauge - Arc path calculation
    const percent = Math.min(speed / MAX_SPEED_GAUGE, 1);
    const arcLength = 440;
    const offset = arcLength - (arcLength * percent);
    speedRing.style.strokeDashoffset = offset;

    // Distance
    distDisplay.textContent = (current.distance || 0).toFixed(2);

    // Max Speed
    if (speed > maxSpeed) {
        maxSpeed = speed;
        maxSpeedDisplay.textContent = Math.round(maxSpeed);
    }

    // Time calculation
    if (current.trip_start_time) {
        const startTime = new Date(current.trip_start_time);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);

        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;

        timeDisplay.textContent =
            String(h).padStart(2, '0') + ':' +
            String(m).padStart(2, '0') + ':' +
            String(s).padStart(2, '0');
    } else {
        timeDisplay.textContent = '00:00:00';
    }

    // Coordinates
    if (current.latitude && current.longitude) {
        latDisplay.textContent = current.latitude.toFixed(6);
        lonDisplay.textContent = current.longitude.toFixed(6);

        // Update current marker
        currentMarker.setLatLng([current.latitude, current.longitude]);
    }

    // Connection Status
    const now = new Date();
    const lastUpdate = current.timestamp ? new Date(current.timestamp) : null;
    const diff = lastUpdate ? (now - lastUpdate) / 1000 : 999;

    if (diff < 5 && current.timestamp) {
        connectionStatus.textContent = "ONLINE";
        connectionStatus.classList.add('online');
    } else {
        connectionStatus.textContent = "OFFLINE";
        connectionStatus.classList.remove('online');
    }

    // Map Path
    if (path && path.length > 0) {
        const latlngs = path.map(p => [p.lat, p.lng]);
        polyline.setLatLngs(latlngs);

        // Auto-pan to current position if online
        if (connectionStatus.classList.contains('online') && path.length > 0) {
            const lastPoint = latlngs[latlngs.length - 1];
            map.setView(lastPoint, 16);
        }
    }
}

// Fetch Data
async function fetchData() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        connectionStatus.textContent = "ERROR";
        connectionStatus.classList.remove('online');
    }
}

// Reset Trip
resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset the trip?')) {
        await fetch('/api/reset', { method: 'POST' });
        maxSpeed = 0;
        maxSpeedDisplay.textContent = "0";
        polyline.setLatLngs([]);
    }
});

// GPS Tracking from Browser
function startGPSTracking() {
    console.log("Attempting to start GPS tracking...");

    if (!("geolocation" in navigator)) {
        console.error("Geolocation is NOT supported by this browser");
        gpsStatus.textContent = "NOT SUPPORTED";
        alert("Geolocation is not supported by this browser.");
        return;
    }

    console.log("Geolocation API is available");

    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (!isSecure) {
        console.warn("Warning: Not on HTTPS or localhost. Geolocation may not work.");
        gpsStatus.textContent = "INSECURE";
    }

    gpsStatus.textContent = "ACQUIRING";

    // First, try to get current position to trigger permission prompt
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log("Initial GPS position acquired:", position.coords);
            gpsStatus.textContent = "LOCKED";

            // Send initial position
            sendLocation(position.coords.latitude, position.coords.longitude);

            // Now start watching
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    console.log("GPS update:", lat, lng);

                    gpsStatus.textContent = "LOCKED";
                    sendLocation(lat, lng);
                },
                (error) => {
                    handleGPSError(error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 1000,
                    timeout: 10000
                }
            );
        },
        (error) => {
            handleGPSError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

function handleGPSError(error) {
    console.error("Geolocation error:", error);

    switch (error.code) {
        case error.PERMISSION_DENIED:
            gpsStatus.textContent = "DENIED";
            console.error("User denied location permission");
            alert("Location permission denied. Please enable location access in your browser settings.");
            break;
        case error.POSITION_UNAVAILABLE:
            gpsStatus.textContent = "UNAVAILABLE";
            console.error("Location information unavailable");
            break;
        case error.TIMEOUT:
            gpsStatus.textContent = "TIMEOUT";
            console.error("Location request timed out");
            break;
        default:
            gpsStatus.textContent = "ERROR";
            console.error("Unknown geolocation error");
    }
}

async function sendLocation(lat, lng) {
    try {
        const response = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng
            })
        });

        if (response.ok) {
            console.log("Location sent successfully:", lat, lng);
        } else {
            console.error("Failed to send location:", response.status);
        }
    } catch (e) {
        console.error("Error sending GPS:", e);
    }
}

// Start
initMap();
setInterval(fetchData, POLL_INTERVAL);
fetchData(); // Initial call

// Wait a bit before starting GPS to ensure page is loaded
setTimeout(() => {
    startGPSTracking();
}, 1000);
