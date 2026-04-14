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
    setTimeout(initializeMap, 100); // Small delay to ensure DOM is ready
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

// Report Incident
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

// Send SOS
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

// Map Initialization
let map;
window.mapInitialized = false;

function initializeMap() {
  if (window.mapInitialized) return;
  
  try {
    map = L.map("map").setView([20.5937, 78.9629], 5); // Center on India

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    
    window.mapInitialized = true;
    loadMapData();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Fetch & Show Incidents, Shelters, Relief, SOS
async function loadMapData() {
  if (!window.mapInitialized) return;
  
  const endpoints = ["incidents", "shelters", "relief", "sos"];
  
  try {
    for (let ep of endpoints) {
      const res = await fetch(`${BASE_URL}/${ep}`);
      if (!res.ok) {
        console.error(`Failed to load ${ep}:`, res.statusText);
        continue;
      }
      
      const data = await res.json();

      if (ep === "incidents") {
        data.forEach(i => {
          if (i.latitude && i.longitude) {
            const isUserIncident = i.user_id === parseInt(currentUser.id);
            const marker = L.marker([i.latitude, i.longitude]);
            
            if (isUserIncident) {
              marker.setIcon(L.icon({
                iconUrl: "https://img.icons8.com/color/48/000000/marker.png",
                iconSize: [30, 30]
              }));
            }
            
            marker.addTo(map)
              .bindPopup(`<b>${i.title}</b><br>${i.description}<br>Status: ${i.status}${isUserIncident ? '<br><em>Your Report</em>' : ''}`);
          }
        });
      } else if (ep === "shelters") {
        data.forEach(s => {
          if (s.latitude && s.longitude) {
            L.marker([s.latitude, s.longitude], { 
              icon: L.icon({ 
                iconUrl: "https://img.icons8.com/color/48/000000/home.png", 
                iconSize: [30,30] 
              }) 
            })
            .addTo(map)
            .bindPopup(`<b>${s.name}</b><br>Capacity: ${s.capacity}<br>Contact: ${s.contact}`);
          }
        });
      } else if (ep === "relief") {
        data.forEach(r => {
          if (r.latitude && r.longitude) {
            L.marker([r.latitude, r.longitude], { 
              icon: L.icon({ 
                iconUrl: "https://img.icons8.com/color/48/000000/first-aid-kit.png", 
                iconSize: [30,30] 
              }) 
            })
            .addTo(map)
            .bindPopup(`<b>${r.title}</b><br>${r.description}`);
          }
        });
      } else if (ep === "sos") {
        data.forEach(sos => {
          if (sos.latitude && sos.longitude) {
            const isUserSOS = sos.user_id === parseInt(currentUser.id);
            const marker = L.marker([sos.latitude, sos.longitude], { 
              icon: L.icon({ 
                iconUrl: "https://img.icons8.com/color/48/000000/alarm.png", 
                iconSize: [30,30] 
              }) 
            });
            
            marker.addTo(map)
              .bindPopup(`<b>SOS:</b> ${sos.message}<br>Status: ${sos.status}${isUserSOS ? '<br><em>Your Request</em>' : ''}`);
          }
        });
      }
    }
  } catch (error) {
    console.error("Error loading map data:", error);
  }
}
