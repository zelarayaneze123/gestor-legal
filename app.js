// ===============================
// CONFIGURACIÓN DE GOOGLE CALENDAR
// ===============================
// 1. Crear un proyecto en Google Cloud.
// 2. Activar Google Calendar API.
// 3. Crear un OAuth Client ID de tipo "Web application".
// 4. Reemplazar este valor por tu Client ID.
//
// Ejemplo:
// const GOOGLE_CLIENT_ID = "1234567890-abc.apps.googleusercontent.com";

const GOOGLE_CLIENT_ID = "REEMPLAZAR_CON_TU_CLIENT_ID.apps.googleusercontent.com";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

let tokenClient;
let gapiReady = false;
let googleConnected = false;

const form = document.getElementById("deadlineForm");
const caseName = document.getElementById("caseName");
const procedure = document.getElementById("procedure");
const notificationDate = document.getElementById("notificationDate");
const deadlineResult = document.getElementById("deadlineResult");
const deadlineList = document.getElementById("deadlineList");
const allDeadlines = document.getElementById("allDeadlines");
const toast = document.getElementById("toast");

let deadlines = JSON.parse(localStorage.getItem("gestorLegalDeadlines") || "[]");

// ---------- UTILIDADES ----------

function formatDate(dateString) {
  if (!dateString) return "—";
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function addBusinessDays(dateString, businessDays) {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);

    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return date;
}

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function getBusinessDays() {
  const option = procedure.options[procedure.selectedIndex];
  return Number(option?.dataset.days || 0);
}

function calculateDeadline() {
  if (!notificationDate.value || !getBusinessDays()) {
    deadlineResult.textContent = "—";
    return null;
  }

  const days = getBusinessDays();
  const result = addBusinessDays(notificationDate.value, days);

  deadlineResult.textContent = formatDate(toDateInputValue(result));

  return result;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function saveDeadlines() {
  localStorage.setItem("gestorLegalDeadlines", JSON.stringify(deadlines));
}

// ---------- RENDER ----------

function renderDeadlines() {
  const sorted = [...deadlines].sort((a, b) =>
    a.deadline.localeCompare(b.deadline)
  );

  if (!sorted.length) {
    deadlineList.innerHTML = `<div class="empty">Todavía no hay vencimientos cargados.</div>`;
  } else {
    deadlineList.innerHTML = sorted.slice(0, 5).map(deadlineCard).join("");
  }

  allDeadlines.innerHTML = sorted.length
    ? sorted.map(deadlineCard).join("")
    : `<div class="empty">No hay vencimientos registrados.</div>`;
}

function deadlineCard(item) {
  return `
    <div class="deadline-item">
      <div>
        <h4>${escapeHTML(item.caseName)}</h4>
        <p>${escapeHTML(item.procedure)}</p>
        <p><strong>Vence:</strong> ${formatDate(item.deadline)}</p>
      </div>

      <div class="item-actions">
        <button class="small-btn" onclick="sendToGoogle('${item.id}')">
          📅 Google Calendar
        </button>
        <button class="small-btn delete-btn" onclick="deleteDeadline('${item.id}')">
          Eliminar
        </button>
      </div>
    </div>
  `;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- FORMULARIO ----------

procedure.addEventListener("change", calculateDeadline);
notificationDate.addEventListener("change", calculateDeadline);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const result = calculateDeadline();

  if (!result) {
    showToast("Completá todos los datos.");
    return;
  }

  const item = {
    id: crypto.randomUUID(),
    caseName: caseName.value.trim(),
    procedure: procedure.value,
    notificationDate: notificationDate.value,
    deadline: toDateInputValue(result)
  };

  deadlines.push(item);
  saveDeadlines();
  renderDeadlines();

  form.reset();
  deadlineResult.textContent = "—";

  showToast("Vencimiento guardado correctamente.");
});

// ---------- ELIMINAR ----------

window.deleteDeadline = function(id) {
  deadlines = deadlines.filter(item => item.id !== id);
  saveDeadlines();
  renderDeadlines();
  showToast("Vencimiento eliminado.");
};

// ---------- VISTAS ----------

document.getElementById("showDeadlinesBtn").addEventListener("click", () => {
  document.getElementById("formView").classList.add("hidden");
  document.getElementById("listView").classList.remove("hidden");
});

document.querySelector(".menu-item.active").addEventListener("click", () => {
  document.getElementById("listView").classList.add("hidden");
  document.getElementById("formView").classList.remove("hidden");
});

// ---------- GOOGLE CALENDAR ----------

async function initializeGoogleAPI() {
  if (GOOGLE_CLIENT_ID.startsWith("REEMPLAZAR")) {
    console.warn("Falta configurar GOOGLE_CLIENT_ID.");
    return;
  }

  try {
    await new Promise(resolve => {
      const wait = setInterval(() => {
        if (window.gapi) {
          clearInterval(wait);
          resolve();
        }
      }, 100);
    });

    await new Promise(resolve => gapi.load("client", resolve));

    await gapi.client.init({
      discoveryDocs: [DISCOVERY_DOC]
    });

    gapiReady = true;

    await new Promise(resolve => {
      const wait = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(wait);
          resolve();
        }
      }, 100);
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: ""
    });

    googleConnected = true;
  } catch (error) {
    console.error(error);
  }
}

document.getElementById("connectGoogleBtn").addEventListener("click", () => {
  if (!tokenClient) {
    showToast("Primero configurá tu Client ID de Google.");
    return;
  }

  tokenClient.callback = (response) => {
    if (response.error) {
      console.error(response);
      showToast("No se pudo conectar con Google Calendar.");
      return;
    }

    showToast("Google Calendar conectado.");
  };

  tokenClient.requestAccessToken({ prompt: "consent" });
});

window.sendToGoogle = async function(id) {
  const item = deadlines.find(d => d.id === id);

  if (!item) return;

  if (!tokenClient) {
    showToast("Configurá Google Calendar primero.");
    return;
  }

  tokenClient.callback = async (response) => {
    if (response.error) {
      console.error(response);
      showToast("No se pudo autorizar Google Calendar.");
      return;
    }

    try {
      const event = {
        summary: `Vencimiento: ${item.caseName}`,
        description:
          `Carátula: ${item.caseName}\n` +
          `Trámite: ${item.procedure}\n` +
          `Fecha de notificación: ${formatDate(item.notificationDate)}`,
        start: {
          date: item.deadline
        },
        end: {
          date: item.deadline
        }
      };

      await gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event
      });

      showToast("Vencimiento agregado a Google Calendar.");
    } catch (error) {
      console.error(error);
      showToast("Error al crear el evento.");
    }
  };

  tokenClient.requestAccessToken({ prompt: "consent" });
};

// Inicialización
window.addEventListener("load", () => {
  renderDeadlines();
  initializeGoogleAPI();
});
