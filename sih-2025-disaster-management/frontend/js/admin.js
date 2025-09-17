const API_BASE = "http://127.0.0.1:5000/api";

// Load data when page loads
window.onload = () => {
  loadIncidents();
  loadRelief();
  loadSOS();
};

// Load incidents
async function loadIncidents() {
  let res = await fetch(`${API_BASE}/incidents`);
  let data = await res.json();
  let table = document.querySelector("#incidentsTable tbody");
  table.innerHTML = "";
  data.forEach(incident => {
    table.innerHTML += `
      <tr>
        <td>${incident.id}</td>
        <td>${incident.location}</td>
        <td>${incident.type}</td>
        <td>${incident.severity}</td>
        <td>${incident.status}</td>
        <td>
          <button onclick="updateIncident(${incident.id}, 'verified')">Verify</button>
          <button onclick="updateIncident(${incident.id}, 'resolved')">Resolve</button>
        </td>
      </tr>
    `;
  });
}

async function updateIncident(id, status) {
  await fetch(`${API_BASE}/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  loadIncidents();
}

// Load relief
async function loadRelief() {
  let res = await fetch(`${API_BASE}/relief`);
  let data = await res.json();
  let table = document.querySelector("#reliefTable tbody");
  table.innerHTML = "";
  data.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.location}</td>
        <td>${r.description}</td>
        <td>${r.status}</td>
      </tr>
    `;
  });
}

// Add new relief
document.getElementById("addReliefForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  let location = document.getElementById("relief_location").value;
  let description = document.getElementById("relief_description").value;

  await fetch(`${API_BASE}/relief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, description })
  });

  loadRelief();
  e.target.reset();
});

// Load SOS
async function loadSOS() {
  let res = await fetch(`${API_BASE}/sos`);
  let data = await res.json();
  let table = document.querySelector("#sosTable tbody");
  table.innerHTML = "";
  data.forEach(sos => {
    table.innerHTML += `
      <tr>
        <td>${sos.id}</td>
        <td>${sos.location}</td>
        <td>${sos.message}</td>
        <td>${sos.status}</td>
        <td>
          <button onclick="updateSOS(${sos.id}, 'acknowledged')">Acknowledge</button>
          <button onclick="updateSOS(${sos.id}, 'handled')">Handle</button>
        </td>
      </tr>
    `;
  });
}

async function updateSOS(id, status) {
  await fetch(`${API_BASE}/sos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  loadSOS();
}
