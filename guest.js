// frontend/js/guest.js
document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const loginForm = document.getElementById("guestLoginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  const ordersContainer = document.getElementById("ordersContainer");
  const serviceContainer = document.getElementById("serviceContainer");

  const serviceForm = document.getElementById("serviceForm");
  const serviceMsg = document.getElementById("serviceMsg");

  const foodForm = document.getElementById("foodForm");
  const foodMsg = document.getElementById("foodMsg");

  const tabs = document.querySelectorAll(".tabs button");
  const tabSections = document.querySelectorAll("#dashboardSection section");

  const BASE_URL = "http://localhost:3000/api/guest";

  // --- Tabs ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      tabSections.forEach((sec) => sec.classList.remove("active"));
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // --- Login ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const room_number = document.getElementById("room_number").value;
    const phone = document.getElementById("phone").value;

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || "Login failed";
        return;
      }
      localStorage.setItem("guestToken", data.token);
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
      loadDashboard();
    } catch (err) {
      console.error(err);
      loginError.textContent = "Server error";
    }
  });

  // --- Load Dashboard ---
  async function loadDashboard() {
    const token = localStorage.getItem("guestToken");
    if (!token) return;

    // Orders
    const resOrders = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ordersData = await resOrders.json();
    ordersContainer.innerHTML = "";
    if (!ordersData.orders || ordersData.orders.length === 0) {
      ordersContainer.innerHTML = "<p>No food orders yet.</p>";
    } else {
      const table = document.createElement("table");
      table.innerHTML = `<tr><th>Item</th><th>Quantity</th><th>Status</th><th>Time</th></tr>`;
      ordersData.orders.forEach((o) => {
        table.innerHTML += `<tr><td>${o.Item_Name}</td><td>${
          o.Quantity
        }</td><td>${o.Status}</td><td>${new Date(
          o.Order_Time
        ).toLocaleString()}</td></tr>`;
      });
      ordersContainer.appendChild(table);
    }

    // Services
    const resServices = await fetch(`${BASE_URL}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const servicesData = await resServices.json();
    serviceContainer.innerHTML = "";
    if (!servicesData.services || servicesData.services.length === 0) {
      serviceContainer.innerHTML = "<p>No service requests yet.</p>";
    } else {
      const table = document.createElement("table");
      table.innerHTML = `<tr><th>Service</th><th>Date</th><th>Status</th></tr>`;
      servicesData.services.forEach((s) => {
        table.innerHTML += `<tr><td>${s.Service_Type}</td><td>${s.Request_Date}</td><td>${s.Status}</td></tr>`;
      });
      serviceContainer.appendChild(table);
    }
  }

  // --- Request Service ---
  serviceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    serviceMsg.textContent = "";
    const token = localStorage.getItem("guestToken");
    const service_type = document.getElementById("serviceType").value;
    try {
      const res = await fetch(`${BASE_URL}/request-service`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ service_type }),
      });
      const data = await res.json();
      serviceMsg.style.color = res.ok ? "green" : "red";
      serviceMsg.textContent = data.message || data.error;
      loadDashboard();
    } catch (err) {
      console.error(err);
      serviceMsg.textContent = "Server error";
      serviceMsg.style.color = "red";
    }
  });

  // --- Order Food ---
  foodForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    foodMsg.textContent = "";
    const token = localStorage.getItem("guestToken");
    const item_id = document.getElementById("itemId").value;
    const quantity = document.getElementById("quantity").value;

    try {
      const res = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ item_id, quantity }),
      });
      const data = await res.json();
      foodMsg.style.color = res.ok ? "green" : "red";
      foodMsg.textContent = data.success ? "Order placed!" : data.error;
      loadDashboard();
    } catch (err) {
      console.error(err);
      foodMsg.textContent = "Server error";
      foodMsg.style.color = "red";
    }
  });

  // --- Logout ---
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("guestToken");
    dashboardSection.style.display = "none";
    loginSection.style.display = "block";
  });
});
