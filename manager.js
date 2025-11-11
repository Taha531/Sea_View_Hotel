const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const roomsContainer = document.getElementById("rooms");
const servicesContainer = document.getElementById("services");
const foodContainer = document.getElementById("food");

const tabs = document.querySelectorAll(".tabs button");
const tabSections = document.querySelectorAll("#dashboardSection section");

// Backend URL
const BASE_URL = "http://localhost:3000/api/manager";

// TABS
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    tabSections.forEach((sec) => sec.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error;
      return;
    }
    localStorage.setItem("managerToken", data.token);
    loginSection.classList.remove("active");
    dashboardSection.classList.add("active");
    loadDashboard();
  } catch (err) {
    loginError.textContent = "Server error";
    console.error(err);
  }
});

// LOAD DASHBOARD
async function loadDashboard() {
  const token = localStorage.getItem("managerToken");
  if (!token) return;

  // Occupied Rooms
  try {
    const resRooms = await fetch(`${BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const roomsData = await resRooms.json();
    roomsContainer.innerHTML = "";
    if (roomsData.rooms.length === 0)
      roomsContainer.innerHTML = "<p>No occupied rooms.</p>";
    else {
      const table = document.createElement("table");
      table.innerHTML =
        "<tr><th>Room No</th><th>Guest Name</th><th>No. of Guests</th><th>CheckIn</th><th>CheckOut</th></tr>";
      roomsData.rooms.forEach((r) => {
        table.innerHTML += `<tr>
          <td>${r.Room_No}</td>
          <td>${r.Name}</td>
          <td>${r.Number_of_Guests}</td>
          <td>${new Date(r.CheckIn_Date).toLocaleDateString()}</td>
          <td>${new Date(r.CheckOut_Date).toLocaleDateString()}</td>
        </tr>`;
      });
      roomsContainer.appendChild(table);
    }

    // Service Requests
    const resServices = await fetch(`${BASE_URL}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const servicesData = await resServices.json();
    servicesContainer.innerHTML = "";
    if (servicesData.services.length === 0)
      servicesContainer.innerHTML = "<p>No service requests.</p>";
    else {
      const table = document.createElement("table");
      table.innerHTML =
        "<tr><th>Guest</th><th>Room</th><th>Service</th><th>Date</th><th>Status</th></tr>";
      servicesData.services.forEach((s) => {
        table.innerHTML += `<tr>
          <td>${s.Guest_Name}</td>
          <td>${s.Room_No}</td>
          <td>${s.Service_Type}</td>
          <td>${new Date(s.Request_Date).toLocaleDateString()}</td>
          <td>${s.Status || "Pending"}</td>
        </tr>`;
      });
      servicesContainer.appendChild(table);
    }

    // Food Orders
    const resFood = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const foodData = await resFood.json();
    foodContainer.innerHTML = "";
    if (foodData.orders.length === 0)
      foodContainer.innerHTML = "<p>No food orders.</p>";
    else {
      const table = document.createElement("table");
      table.innerHTML =
        "<tr><th>Guest</th><th>Room</th><th>Item</th><th>Quantity</th><th>Status</th><th>Order Time</th></tr>";
      foodData.orders.forEach((o) => {
        table.innerHTML += `<tr>
          <td>${o.Guest_Name}</td>
          <td>${o.Room_No}</td>
          <td>${o.Item_Name}</td>
          <td>${o.Quantity}</td>
          <td>${o.Status}</td>
          <td>${new Date(o.Order_Time).toLocaleString()}</td>
        </tr>`;
      });
      foodContainer.appendChild(table);
    }
  } catch (err) {
    console.error(err);
  }
}

// LOGOUT
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("managerToken");
  dashboardSection.classList.remove("active");
  loginSection.classList.add("active");
});
