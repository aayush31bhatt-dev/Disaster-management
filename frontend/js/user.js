// ANHONI Disaster Management - User Dashboard
// Role-based access control: Only "user" role can access this page

const BASE_URL = "http://127.0.0.1:5000/api";

// Initialize access control for user dashboard
if (!ACCESS_CONTROL.initPageAccess("user", "user_dashboard.html")) {
  // Access denied - user will be redirected by access control module
  throw new Error("Access denied to user dashboard");
}

// Get current user info
const currentUser = ACCESS_CONTROL.getCurrentUser();
console.log(`[USER_DASHBOARD] User ${currentUser.id} accessed user dashboard`);

// Dashboard state
let userStats = {
  incidents: 0,
  sos: 0,
  total: 0
};

// User location state
let userLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  timestamp: null
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  loadUserInfo();
  loadUserStats();
  initializeLocationButtons();
});

// Load user information
function loadUserInfo() {
  // Display username (you can extend this to fetch actual username from backend)
  const userNameElement = document.getElementById('userNameText');
  if (userNameElement) {
    userNameElement.textContent = `User ${currentUser.id}`;
  }
}

// Navigation functions
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));
  
  // Remove active class from all nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.classList.remove('active'));
  
  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Add active class to corresponding nav link
  const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
  
  // Initialize map if disaster-map section is shown
  if (sectionId === 'disaster-map' && !window.mapInitialized) {
    setTimeout(() => {
      getUserLocation();
      initializeMap();
    }, 100); // Small delay to ensure DOM is ready
  }
}

// Logout popup functions
function toggleLogoutPopup() {
  const popup = document.getElementById('logoutPopup');
  popup.classList.toggle('show');
}

// Close popup when clicking outside
document.addEventListener('click', function(event) {
  const popup = document.getElementById('logoutPopup');
  const username = document.getElementById('usernameDisplay');
  
  if (!username.contains(event.target)) {
    popup.classList.remove('show');
  }
});

// Logout function using access control module
function logout() {
  console.log(`[USER_DASHBOARD] User ${currentUser.id} logging out`);
  ACCESS_CONTROL.logout();
}

// Load user statistics
async function loadUserStats() {
  try {
    // Load incidents created by current user
    const incidentsRes = await fetch(`${BASE_URL}/incidents`);
    if (incidentsRes.ok) {
      const incidents = await incidentsRes.json();
      userStats.incidents = incidents.filter(incident => 
        incident.user_id === parseInt(currentUser.id)
      ).length;
    }
    
    // Load SOS requests created by current user
    const sosRes = await fetch(`${BASE_URL}/sos`);
    if (sosRes.ok) {
      const sosRequests = await sosRes.json();
      userStats.sos = sosRequests.filter(sos => 
        sos.user_id === parseInt(currentUser.id)
      ).length;
    }
    
    // Calculate total
    userStats.total = userStats.incidents + userStats.sos;
    
    // Update UI
    updateStatsDisplay();
    
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

// Update statistics display
function updateStatsDisplay() {
  const incidentCountEl = document.getElementById('incidentCount');
  const sosCountEl = document.getElementById('sosCount');
  const totalCountEl = document.getElementById('totalCount');
  
  if (incidentCountEl) incidentCountEl.textContent = userStats.incidents;
  if (sosCountEl) sosCountEl.textContent = userStats.sos;
  if (totalCountEl) totalCountEl.textContent = userStats.total;
}

// Add location detection buttons
function initializeLocationButtons() {
  // Add "Get Current Location" buttons to forms
  addLocationButton('incidentForm', 'incidentLat', 'incidentLon');
  addLocationButton('sosForm', 'sosLat', 'sosLon');
}

// Add location detection button to a form
function addLocationButton(formId, latInputId, lonInputId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const latInput = document.getElementById(latInputId);
  const lonInput = document.getElementById(lonInputId);
  
  if (latInput && lonInput) {
    const locationBtn = document.createElement('button');
    locationBtn.type = 'button';
    locationBtn.className = 'btn-primary';
    locationBtn.style.marginLeft = '10px';
    locationBtn.style.background = '#28a745';
    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Get Current Location';
    
    locationBtn.onclick = () => getCurrentLocation(latInputId, lonInputId);
    
    // Insert button after longitude input
    lonInput.parentNode.appendChild(locationBtn);
  }
}

// Get current location using GPS
function getCurrentLocation(latInputId, lonInputId) {
  if (navigator.geolocation) {
    const locationBtn = event.target;
    const originalText = locationBtn.innerHTML;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
    locationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById(latInputId).value = position.coords.latitude.toFixed(6);
        document.getElementById(lonInputId).value = position.coords.longitude.toFixed(6);
        locationBtn.innerHTML = originalText;
        locationBtn.disabled = false;
        alert('Location detected successfully!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Error getting location: ' + error.message);
        locationBtn.innerHTML = originalText;
        locationBtn.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

// Get user's live location and watch for updates
function getUserLocation() {
  if (!navigator.geolocation) {
    updateLocationStatus('Geolocation not supported by your browser', false);
    return;
  }
  
  updateLocationStatus('Getting your location...', true);
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.latitude = position.coords.latitude;
      userLocation.longitude = position.coords.longitude;
      userLocation.accuracy = position.coords.accuracy;
      userLocation.timestamp = new Date(position.timestamp);
      
      console.log('User location detected:', userLocation);
      updateLocationStatus(`
        Your Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}
        (Accuracy: ±${Math.round(userLocation.accuracy)}m)
      `, true);
      
      // Re-center map on user location
      if (window.mapInitialized && map) {
        map.setView([userLocation.latitude, userLocation.longitude], 14);
      }
      
      // Load nearby shelters
      if (window.mapInitialized) {
        loadNearbyShelters();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      updateLocationStatus('Unable to detect location: ' + error.message, false);
      
      // Use default India location if geolocation fails
      userLocation.latitude = 20.5937;
      userLocation.longitude = 78.9629;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    }
  );
  
  // Watch for continuous location updates
  navigator.geolocation.watchPosition(
    (position) => {
      userLocation.latitude = position.coords.latitude;
      userLocation.longitude = position.coords.longitude;
      userLocation.accuracy = position.coords.accuracy;
      userLocation.timestamp = new Date(position.timestamp);
      console.log('Location updated:', userLocation);
    },
    (error) => {
      console.warn('Location watch error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    }
  );
}

// Update location status UI
function updateLocationStatus(message, isUpdating = false) {
  const statusEl = document.getElementById('locationStatus');
  if (statusEl) {
    statusEl.innerHTML = `
      ${isUpdating ? '<i class="fas fa-spinner fa-spin" style="color: #3b82f6; margin-right: 0.5rem;"></i>' : '<i class="fas fa-location-dot" style="color: #3b82f6; margin-right: 0.5rem;"></i>'}
      <span id="locationText">${message}</span>
    `;
  }
}

// Calculate distance between two coordinates (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// Load and display nearby shelters within 10km
async function loadNearbyShelters() {
  if (!userLocation.latitude || !userLocation.longitude) {
    console.warn('User location not available for computing nearby shelters');
    return;
  }
  
  try {
    const sheltersRes = await fetch(`${BASE_URL}/shelters`);
    const reliefRes = await fetch(`${BASE_URL}/relief`);
    
    let allShelters = [];
    
    if (sheltersRes.ok) {
      const shelters = await sheltersRes.json();
      allShelters = allShelters.concat(shelters.map(s => ({ ...s, type: 'shelter' })));
    }
    
    if (reliefRes.ok) {
      const relief = await reliefRes.json();
      allShelters = allShelters.concat(relief.map(r => ({ ...r, type: 'relief' })));
    }
    
    // Filter shelters within 10km
    const nearbyShelters = allShelters
      .map(shelter => ({
        ...shelter,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          shelter.latitude,
          shelter.longitude
        )
      }))
      .filter(shelter => shelter.distance <= 10)
      .sort((a, b) => a.distance - b.distance);
    
    displayNearbySheltersList(nearbyShelters);
  } catch (error) {
    console.error('Error loading nearby shelters:', error);
  }
}

// Display nearby shelters list
function displayNearbySheltersList(shelters) {
  const container = document.getElementById('nearbySheltersList');
  if (!container) return;
  
  if (shelters.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #7c8db5; padding: 2rem; background: rgba(30, 41, 59, 0.5); border-radius: 8px;"><i class="fas fa-info-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>No shelters found within 10 km radius</div>';
    return;
  }
  
  container.innerHTML = shelters.map(shelter => {
    const isShelter = shelter.type === 'shelter';
    const occupied = shelter.occupied || 0;
    const capacity = shelter.capacity || 0;
    const available = Math.max(capacity - occupied, 0);
    const occupancyPercent = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
    
    return `
      <div class="shelter-card ${isShelter ? '' : 'relief'}">
        <div class="shelter-card-header">
          <h4 class="shelter-card-title">${shelter.name}</h4>
          <div class="shelter-card-icon">
            <i class="fas ${isShelter ? 'fa-home' : 'fa-first-aid'}"></i>
          </div>
        </div>
        
        <div class="shelter-detail">
          <i class="fas fa-map-pin"></i>
          <span><strong>${shelter.city}</strong>, ${shelter.address}</span>
        </div>
        
        <div class="shelter-detail">
          <i class="fas fa-phone"></i>
          <span><strong>${shelter.contact}</strong></span>
        </div>
        
        <div class="shelter-detail">
          <i class="fas fa-compass"></i>
          <span><strong>${shelter.distance.toFixed(1)} km away</strong></span>
        </div>
        
        ${isShelter ? `
          <div class="shelter-capacity">
            <div class="capacity-stat">
              <span class="capacity-stat-value">${available}</span>
              <span class="capacity-stat-label">Available</span>
            </div>
            <div class="capacity-stat">
              <span class="capacity-stat-value">${capacity}</span>
              <span class="capacity-stat-label">Capacity</span>
            </div>
          </div>
          <div style="margin-top: 0.8rem; background: rgba(59, 130, 246, 0.1); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #3b82f6 0%, #0ea5e9 100%); height: 100%; width: ${occupancyPercent}%;"></div>
          </div>
        ` : ''}
        
        <span class="distance-badge">
          <i class="fas fa-location-dot" style="margin-right: 0.3rem;"></i>
          ${shelter.distance.toFixed(1)} km
        </span>
      </div>
    `;
  }).join('');
}

// Report Incident
if (document.getElementById("incidentForm")) {
  document.getElementById("incidentForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("incidentTitle").value;
    const description = document.getElementById("incidentDesc").value;
    const latitude = document.getElementById("incidentLat").value;
    const longitude = document.getElementById("incidentLon").value;

    try {
      const res = await fetch(`${BASE_URL}/incidents`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          title, 
          description, 
          latitude: parseFloat(latitude), 
          longitude: parseFloat(longitude),
          user_id: currentUser.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Incident reported successfully!");
        document.getElementById("incidentForm").reset();
        userStats.incidents++;
        userStats.total++;
        updateStatsDisplay();
        if (window.mapInitialized) {
          loadMapData(); // Refresh map data
        }
      } else {
        alert(data.message || "Failed to report incident");
      }
    } catch (error) {
      console.error("Error reporting incident:", error);
      alert("Error reporting incident. Please try again.");
    }
  });
}

// Send SOS
if (document.getElementById("sosForm")) {
  document.getElementById("sosForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = document.getElementById("sosMessage").value;
    const latitude = document.getElementById("sosLat").value;
    const longitude = document.getElementById("sosLon").value;

    try {
      const res = await fetch(`${BASE_URL}/sos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          message, 
          latitude: parseFloat(latitude), 
          longitude: parseFloat(longitude),
          user_id: currentUser.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("SOS sent successfully! Emergency response has been notified.");
        document.getElementById("sosForm").reset();
        userStats.sos++;
        userStats.total++;
        updateStatsDisplay();
        if (window.mapInitialized) {
          loadMapData(); // Refresh map data
        }
      } else {
        alert(data.message || "Failed to send SOS");
      }
    } catch (error) {
      console.error("Error sending SOS:", error);
      alert("Error sending SOS. Please try again.");
    }
  });
}

// Create custom HTML icon with Font Awesome
function createCustomIcon(faClass, color = '#3b82f6') {
  return L.divIcon({
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 1.2rem;
      color: white;
    ">
      <i class="fas ${faClass}"></i>
    </div>`,
    iconSize: [40, 40],
    className: 'custom-marker'
  });
}

// Map Initialization
let map;
let mapLayers;
let userMarker;
window.mapInitialized = false;

function initializeMap() {
  if (window.mapInitialized) return;
  
  try {
    // Default center or user location
    const centerLat = userLocation.latitude || 20.5937;
    const centerLon = userLocation.longitude || 78.9629;
    
    map = L.map("map").setView([centerLat, centerLon], 13);

    // Use dark tile layer for better aesthetic
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      opacity: 0.85
    }).addTo(map);

    mapLayers = {
      incidents: L.layerGroup().addTo(map),
      shelters: L.layerGroup().addTo(map),
      relief: L.layerGroup().addTo(map),
      sos: L.layerGroup().addTo(map),
      userLocation: L.layerGroup().addTo(map)
    };
    
    // Add user location marker
    if (userLocation.latitude && userLocation.longitude) {
      addUserLocationMarker();
    }
    
    window.mapInitialized = true;
    setTimeout(() => map.invalidateSize(), 150);
    loadMapData();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Add user location marker to map
function addUserLocationMarker() {
  if (!mapLayers || !mapLayers.userLocation) return;
  
  mapLayers.userLocation.clearLayers();
  
  // User location marker with pulsing effect
  userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
    icon: createCustomIcon('fa-location-dot', '#10b981')
  })
    .addTo(mapLayers.userLocation)
    .bindPopup(`<b>Your Location</b><br>Lat: ${userLocation.latitude.toFixed(6)}<br>Lon: ${userLocation.longitude.toFixed(6)}`);
  
  // Add accuracy circle
  if (userLocation.accuracy) {
    L.circle([userLocation.latitude, userLocation.longitude], {
      radius: userLocation.accuracy,
      color: '#10b981',
      fillColor: '#d1fae5',
      fillOpacity: 0.1,
      weight: 1.5,
      dashArray: '5, 5'
    }).addTo(mapLayers.userLocation);
  }
}

// Fetch & Show Incidents, Shelters, Relief, SOS with improved icons
async function loadMapData() {
  if (!window.mapInitialized || !mapLayers) return;
  
  try {
    // Keep user marker
    const userLocationLayer = mapLayers.userLocation;
    delete mapLayers.userLocation;
    
    // Clear other layers
    Object.values(mapLayers).forEach(layer => layer.clearLayers());
    
    // Restore user location layer
    mapLayers.userLocation = userLocationLayer;

    // Fetch all data
    const incidents = await (await fetch(`${BASE_URL}/incidents`)).json().catch(() => []);
    const shelters = await (await fetch(`${BASE_URL}/shelters`)).json().catch(() => []);
    const relief = await (await fetch(`${BASE_URL}/relief`)).json().catch(() => []);
    const sos = await (await fetch(`${BASE_URL}/sos`)).json().catch(() => []);

    // Add incidents
    incidents.forEach(i => {
      if (i.latitude && i.longitude) {
        const isUserIncident = i.user_id === parseInt(currentUser.id);
        const marker = L.marker([i.latitude, i.longitude], {
          icon: createCustomIcon('fa-exclamation-triangle', isUserIncident ? '#f59e0b' : '#ef4444')
        })
          .addTo(mapLayers.incidents)
          .bindPopup(`
            <b>${i.title}</b><br>
            ${i.description}<br>
            <strong>Status:</strong> ${i.status}
            ${isUserIncident ? '<br><em style="color: #f59e0b;">Your Report</em>' : ''}
          `);
      }
    });

    // Add shelters
    shelters.forEach(s => {
      if (s.latitude && s.longitude) {
        const available = Math.max((s.capacity || 0) - (s.occupied || 0), 0);
        L.marker([s.latitude, s.longitude], {
          icon: createCustomIcon('fa-home', '#3b82f6')
        })
          .addTo(mapLayers.shelters)
          .bindPopup(`
            <b>${s.name}</b><br>
            📍 ${s.address}<br>
            👥 Available: ${available}/${s.capacity}<br>
            📞 ${s.contact}
          `);
      }
    });

    // Add relief centers
    relief.forEach(r => {
      if (r.latitude && r.longitude) {
        L.marker([r.latitude, r.longitude], {
          icon: createCustomIcon('fa-first-aid', '#22c55e')
        })
          .addTo(mapLayers.relief)
          .bindPopup(`
            <b>${r.title}</b><br>
            ${r.description}
          `);
      }
    });

    // Add SOS requests
    sos.forEach(sosItem => {
      if (sosItem.latitude && sosItem.longitude) {
        const isUserSOS = sosItem.user_id === parseInt(currentUser.id);
        const marker = L.circleMarker([sosItem.latitude, sosItem.longitude], {
          radius: isUserSOS ? 10 : 8,
          color: isUserSOS ? '#ff6b6b' : '#dc2626',
          weight: 2.5,
          fillColor: isUserSOS ? '#ff6b6b' : '#dc2626',
          fillOpacity: 0.85
        })
          .addTo(mapLayers.sos)
          .bindPopup(`
            <b>🆘 SOS:</b> ${sosItem.message}<br>
            <strong>Status:</strong> ${sosItem.status}
            ${isUserSOS ? '<br><em style="color: #dc2626;">Your Request</em>' : ''}
          `);
      }
    });
  } catch (error) {
    console.error("Error loading map data:", error);
  }
}
