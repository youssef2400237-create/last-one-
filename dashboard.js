/* =============================================
   GAMEVAULT - Admin Dashboard
   Connected to Backend API
   ============================================= */

// ===== API Helper =====
const API_BASE = "/api/admin";

function getToken() {
  return localStorage.getItem("token") || "";
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      token,
      ...options.headers,
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ===== State =====
const state = {
  games: [],
  users: [],
  activeSection: "overview",
  gamesPage: 1,
  gamesPageSize: 5,
  gamesSearch: "",
  gamesFilter: "all",
  usersSearch: "",
  usersFilter: "all",
  editingGameId: null,
  editingUserId: null,
  loading: false,
};

// ===== DOM Refs =====
const refs = {
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  hamburgerBtn: document.getElementById("hamburgerBtn"),
  sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
  sidebarLinks: document.querySelectorAll(".sidebar-link"),
  sections: document.querySelectorAll(".dashboard-section"),
  globalSearch: document.getElementById("globalSearch"),
  refreshStatsBtn: document.getElementById("refreshStatsBtn"),
  openGameModalBtn: document.getElementById("openGameModalBtn"),
  gamesSearch: document.getElementById("gamesSearch"),
  gamesFilter: document.getElementById("gamesFilter"),
  newGameBtn: document.getElementById("newGameBtn"),
  gamesTableBody: document.getElementById("gamesTableBody"),
  gamesCount: document.getElementById("gamesCount"),
  gamesPagination: document.getElementById("gamesPagination"),
  gamesPaginationInfo: document.getElementById("gamesPaginationInfo"),
  usersSearch: document.getElementById("usersSearch"),
  usersFilter: document.getElementById("usersFilter"),
  newUserBtn: document.getElementById("newUserBtn"),
  usersTableBody: document.getElementById("usersTableBody"),
  usersCount: document.getElementById("usersCount"),
  totalUsers: document.getElementById("totalUsers"),
  totalGames: document.getElementById("totalGames"),
  activeUsers: document.getElementById("activeUsers"),
  totalRevenue: document.getElementById("totalRevenue"),
  activityList: document.getElementById("activityList"),
  gameModal: document.getElementById("gameModal"),
  gameModalForm: document.getElementById("gameModalForm"),
  modalTitle: document.getElementById("modalTitle"),
  modalGameTitle: document.getElementById("modalGameTitle"),
  modalGameCategory: document.getElementById("modalGameCategory"),
  modalGamePrice: document.getElementById("modalGamePrice"),
  modalGameStock: document.getElementById("modalGameStock"),
  modalGameStatus: document.getElementById("modalGameStatus"),
  modalGameImage: document.getElementById("modalGameImage"),
  modalImagePreview: document.getElementById("modalImagePreview"),
  modalPreviewImg: document.getElementById("modalPreviewImg"),
  imagePresetRow: document.getElementById("imagePresetRow"),
  modalSaveBtn: document.getElementById("modalSaveBtn"),
  modalCancelBtn: document.getElementById("modalCancelBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  userModal: document.getElementById("userModal"),
  userModalForm: document.getElementById("userModalForm"),
  userModalTitle: document.getElementById("userModalTitle"),
  modalUserName: document.getElementById("modalUserName"),
  modalUserEmail: document.getElementById("modalUserEmail"),
  modalUserRole: document.getElementById("modalUserRole"),
  modalUserStatus: document.getElementById("modalUserStatus"),
  userModalSaveBtn: document.getElementById("userModalSaveBtn"),
  userModalCancelBtn: document.getElementById("userModalCancelBtn"),
  closeUserModalBtn: document.getElementById("closeUserModalBtn"),
  toastContainer: document.getElementById("toastContainer"),
};

/* =============================================
   INIT
   ============================================= */
async function init() {
  attachEvents();
  await loadAllData();
}

/* =============================================
   LOAD DATA FROM BACKEND
   ============================================= */
async function loadAllData() {
  showPageLoader(true);
  await Promise.all([loadGames(), loadUsers()]);
  showPageLoader(false);
  render();
}

async function loadGames() {
  const { ok, data } = await apiFetch(`${API_BASE}/get-games`);
  if (ok && data.data) {
    // بنحول الـ MongoDB _id لـ id عشان الكود يشتغل عادي
    state.games = data.data.map((g) => ({
      id: g._id,
      title: g.title,
      category: g.genre || g.category || "General",
      price: g.price,
      status: g.stock > 0 ? "available" : "unavailable",
      imageUrl: g.imageUrl || "",
      stock: g.stock || 0,
    }));
  } else {
    showToast(data.message || "Failed to load games", "error");
  }
}

async function loadUsers() {
  const { ok, data } = await apiFetch(`${API_BASE}/get-user-by-admin`);
  if (ok && data.data) {
    state.users = data.data.map((u) => ({
      id: u._id,
      name: u.userName,
      email: u.email,
      role: u.role,
      status: "active", // مفيش status في الـ model بتاعك
    }));
  } else {
    showToast(data.message || "Failed to load users", "error");
  }
}

/* =============================================
   EVENTS
   ============================================= */
function attachEvents() {
  // Sidebar mobile
  refs.hamburgerBtn.addEventListener("click", openSidebar);
  refs.sidebarCloseBtn.addEventListener("click", closeSidebar);
  refs.sidebarOverlay.addEventListener("click", closeSidebar);

  refs.sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveSection(link.dataset.view);
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // Global search
  refs.globalSearch.addEventListener("input", (e) => {
    const value = e.target.value.trim().toLowerCase();
    if (state.activeSection === "games") {
      state.gamesSearch = value;
      state.gamesPage = 1;
      refs.gamesSearch.value = value;
      renderGamesSection();
    }
    if (state.activeSection === "users") {
      state.usersSearch = value;
      refs.usersSearch.value = value;
      renderUsersSection();
    }
  });

  // Refresh — بيجيب من الـ DB تاني
  refs.refreshStatsBtn.addEventListener("click", async () => {
    await loadAllData();
    showToast("Data refreshed from database.");
  });

  refs.openGameModalBtn.addEventListener("click", () => openGameModal("add"));

  // Games filters
  refs.gamesSearch.addEventListener("input", (e) => {
    state.gamesSearch = e.target.value.trim().toLowerCase();
    state.gamesPage = 1;
    refs.globalSearch.value = state.gamesSearch;
    renderGamesSection();
  });
  refs.gamesFilter.addEventListener("change", (e) => {
    state.gamesFilter = e.target.value;
    state.gamesPage = 1;
    renderGamesSection();
  });

  // Users filters
  refs.usersSearch.addEventListener("input", (e) => {
    state.usersSearch = e.target.value.trim().toLowerCase();
    refs.globalSearch.value = state.usersSearch;
    renderUsersSection();
  });
  refs.usersFilter.addEventListener("change", (e) => {
    state.usersFilter = e.target.value;
    renderUsersSection();
  });

  refs.newUserBtn.addEventListener("click", () => openUserModal("add"));
  if (refs.newGameBtn) {
    refs.newGameBtn.addEventListener("click", () => openGameModal("add"));
  }

  // Game modal
  refs.gameModalForm.addEventListener("submit", saveModalGame);
  refs.modalCancelBtn.addEventListener("click", closeGameModal);
  refs.closeModalBtn.addEventListener("click", closeGameModal);
  refs.gameModal.addEventListener("click", (e) => {
    if (e.target === refs.gameModal) closeGameModal();
  });

  // Image preset thumbnails
  if (refs.imagePresetRow) {
    refs.imagePresetRow.addEventListener("click", (e) => {
      const thumb = e.target.closest(".img-preset-thumb");
      if (!thumb) return;
      const url = thumb.dataset.url;
      refs.modalGameImage.value = url;
      // highlight selected
      refs.imagePresetRow.querySelectorAll(".img-preset-thumb").forEach(t => t.classList.remove("selected"));
      thumb.classList.add("selected");
      showImagePreview(url);
    });
  }
  // URL input preview
  if (refs.modalGameImage) {
    refs.modalGameImage.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      // deselect presets
      if (refs.imagePresetRow) refs.imagePresetRow.querySelectorAll(".img-preset-thumb").forEach(t => t.classList.remove("selected"));
      if (url) showImagePreview(url);
      else hideImagePreview();
    });
  }

  // User modal
  refs.userModalForm.addEventListener("submit", saveModalUser);
  refs.userModalCancelBtn.addEventListener("click", closeUserModal);
  refs.closeUserModalBtn.addEventListener("click", closeUserModal);
  refs.userModal.addEventListener("click", (e) => {
    if (e.target === refs.userModal) closeUserModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGameModal();
      closeUserModal();
      if (window.innerWidth <= 900) closeSidebar();
    }
  });
}

/* =============================================
   SIDEBAR
   ============================================= */
function openSidebar() {
  refs.sidebar.classList.add("open");
  refs.sidebarOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  refs.sidebar.classList.remove("open");
  refs.sidebarOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* =============================================
   NAVIGATION
   ============================================= */
function setActiveSection(view) {
  state.activeSection = view;
  refs.sidebarLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
  refs.sections.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.section !== view);
  });
  refs.globalSearch.value = "";
  refs.globalSearch.placeholder =
    view === "games"
      ? "Search games..."
      : view === "users"
        ? "Search users..."
        : "Search games, users, actions...";
  render();
}

/* =============================================
   RENDER
   ============================================= */
function render() {
  renderOverview();
  renderGamesSection();
  renderUsersSection();
}

function renderOverview() {
  const activeCount = state.users.filter((u) => u.status === "active").length;
  const totalRevenue = state.games.reduce((sum, g) => sum + g.price * 12, 0);

  refs.totalUsers.textContent = state.users.length;
  refs.totalGames.textContent = state.games.length;
  refs.activeUsers.textContent = activeCount;
  refs.totalRevenue.textContent = `$${totalRevenue.toFixed(0)}k`;
  refs.activityList.innerHTML = getActivityEvents()
    .map(createActivityItem)
    .join("");
}

function getActivityEvents() {
  const latestGame = state.games[0];
  return [
    {
      title: latestGame
        ? `Game in catalog: ${latestGame.title}`
        : "No games yet",
      subtitle: "Game catalog",
      time: "Live",
    },
    {
      title: `${state.users.length} users registered`,
      subtitle: "User accounts",
      time: "Live",
    },
    {
      title: `${state.games.filter((g) => g.status === "available").length} games available`,
      subtitle: "Store status",
      time: "Live",
    },
  ];
}

function createActivityItem({ title, subtitle, time }) {
  return `
    <div class="activity-item">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <span>${escapeHtml(time)}</span>
    </div>`;
}

/* =============================================
   GAMES SECTION
   ============================================= */
function renderGamesSection() {
  if (state.activeSection !== "games") return;

  const filtered = state.games.filter((game) => {
    const matchSearch = [game.title, game.category].some((v) =>
      v.toLowerCase().includes(state.gamesSearch),
    );
    const matchFilter =
      state.gamesFilter === "all" || game.status === state.gamesFilter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / state.gamesPageSize),
  );
  state.gamesPage = Math.min(state.gamesPage, totalPages);
  const start = (state.gamesPage - 1) * state.gamesPageSize;
  const pageItems = filtered.slice(start, start + state.gamesPageSize);

  refs.gamesTableBody.innerHTML = pageItems.length
    ? pageItems.map(createGameRow).join("")
    : `<tr><td colspan="5" class="empty-row">No games match your search.</td></tr>`;

  refs.gamesCount.textContent = `${filtered.length} game${filtered.length === 1 ? "" : "s"}`;
  refs.gamesPaginationInfo.textContent = `Page ${state.gamesPage} of ${totalPages}`;
  refs.gamesPagination.innerHTML = createPaginationButtons(totalPages);

  refs.gamesPagination.querySelectorAll(".pagination-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.gamesPage = Number(btn.dataset.page);
      renderGamesSection();
    });
  });

  refs.gamesTableBody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", handleGameAction);
  });
}

function createGameRow(game) {
  return `
    <tr>
      <td>${escapeHtml(game.title)}</td>
      <td>${escapeHtml(game.category)}</td>
      <td>$${Number(game.price).toFixed(2)}</td>
      <td><span class="badge-pill ${game.status}">${game.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary" data-action="edit"   data-id="${game.id}" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger"    data-action="delete" data-id="${game.id}" title="Delete"><i class="fas fa-trash"></i></button>
          <button class="btn btn-primary"   data-action="toggle" data-id="${game.id}" title="Toggle status"><i class="fas fa-exchange-alt"></i></button>
        </div>
      </td>
    </tr>`;
}

function createPaginationButtons(totalPages) {
  let out = "";
  for (let p = 1; p <= totalPages; p++) {
    out += `<button class="pagination-button ${p === state.gamesPage ? "active" : ""}" data-page="${p}">${p}</button>`;
  }
  return out;
}

async function handleGameAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "edit") {
    openGameModal("edit", id);
    return;
  }

  if (action === "delete") {
    await deleteGame(id);
    return;
  }

  if (action === "toggle") {
    await toggleGameStatus(id);
  }
}

// DELETE game → DELETE /api/admin/delete-game/:gameId
async function deleteGame(id) {
  setBtnLoading(true);
  const { ok, data } = await apiFetch(`${API_BASE}/delete-game/${id}`, {
    method: "DELETE",
  });
  setBtnLoading(false);

  if (ok) {
    state.games = state.games.filter((g) => g.id !== id);
    showToast("Game deleted successfully.");
    renderGamesSection();
    renderOverview();
  } else {
    showToast(data.message || "Failed to delete game.", "error");
  }
}

// TOGGLE STATUS → PUT /api/admin/edit-games/:gameId
async function toggleGameStatus(id) {
  const game = state.games.find((g) => g.id === id);
  if (!game) return;
  const newStatus = game.status === "available" ? "unavailable" : "available";
  const newStock = newStatus === "available" ? 10 : 0;

  const { ok, data } = await apiFetch(`${API_BASE}/edit-games/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: game.title,
      price: game.price,
      stock: newStock,
    }),
  });

  if (ok) {
    game.status = newStatus;
    showToast(`Game is now ${newStatus}.`);
    renderGamesSection();
    renderOverview();
  } else {
    showToast(data.message || "Failed to update status.", "error");
  }
}

/* =============================================
   USERS SECTION
   ============================================= */
function renderUsersSection() {
  if (state.activeSection !== "users") return;

  const filtered = state.users.filter((user) => {
    const matchSearch = [user.name, user.email, user.role].some((v) =>
      v.toLowerCase().includes(state.usersSearch),
    );
    const matchFilter =
      state.usersFilter === "all" || user.role === state.usersFilter;
    return matchSearch && matchFilter;
  });

  refs.usersTableBody.innerHTML = filtered.length
    ? filtered.map(createUserRow).join("")
    : `<tr><td colspan="5" class="empty-row">No users match your search.</td></tr>`;

  refs.usersCount.textContent = `${filtered.length} user${filtered.length === 1 ? "" : "s"}`;

  refs.usersTableBody.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", handleUserAction);
  });
}

function createUserRow(user) {
  const statusClass = user.status === "active" ? "available" : "unavailable";
  return `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.role)}</td>
      <td><span class="badge-pill ${statusClass}">${user.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary" data-action="edit"   data-id="${user.id}" title="Edit user"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger"    data-action="delete" data-id="${user.id}" title="Delete user"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
}

async function handleUserAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "edit") {
    openUserModal("edit", id);
    return;
  }
  if (action === "delete") {
    await deleteUser(id);
  }
}

// DELETE user → DELETE /api/admin/delete-user/:id
async function deleteUser(id) {
  const { ok, data } = await apiFetch(`${API_BASE}/delete-user/${id}`, {
    method: "DELETE",
  });

  if (ok) {
    state.users = state.users.filter((u) => u.id !== id);
    showToast("User deleted.");
    renderUsersSection();
    renderOverview();
  } else {
    showToast(data.message || "Failed to delete user.", "error");
  }
}

/* =============================================
   GAME MODAL
   ============================================= */
function openGameModal(mode, gameId = null) {
  state.editingGameId = mode === "edit" ? gameId : null;
  refs.modalTitle.textContent = mode === "edit" ? "Edit game" : "Add new game";
  refs.modalSaveBtn.textContent = mode === "edit" ? "Update game" : "Save game";

  if (mode === "edit") {
    const game = state.games.find((g) => g.id === gameId);
    if (!game) return;
    refs.modalGameTitle.value = game.title;
    refs.modalGameCategory.value = game.category;
    refs.modalGamePrice.value = Number(game.price).toFixed(2);
    refs.modalGameStatus.value = game.status;
    if (refs.modalGameImage) refs.modalGameImage.value = game.imageUrl || "";
    if (refs.modalGameStock) refs.modalGameStock.value = game.stock || 10;
    // show existing image preview and highlight preset
    const existingUrl = game.imageUrl || "";
    if (existingUrl) {
      showImagePreview(existingUrl);
      if (refs.imagePresetRow) {
        refs.imagePresetRow.querySelectorAll(".img-preset-thumb").forEach(t => {
          t.classList.toggle("selected", t.dataset.url === existingUrl);
        });
      }
    } else {
      hideImagePreview();
    }
  } else {
    refs.gameModalForm.reset();
    if (refs.modalGameStock) refs.modalGameStock.value = 10;
    hideImagePreview();
    if (refs.imagePresetRow) refs.imagePresetRow.querySelectorAll(".img-preset-thumb").forEach(t => t.classList.remove("selected"));
  }

  refs.gameModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGameModal() {
  refs.gameModal.classList.add("hidden");
  document.body.style.overflow = "";
  state.editingGameId = null;
  refs.gameModalForm.reset();
  if (refs.modalGameImage) refs.modalGameImage.value = "";
  hideImagePreview();
  if (refs.imagePresetRow) refs.imagePresetRow.querySelectorAll(".img-preset-thumb").forEach(t => t.classList.remove("selected"));
  clearFieldErrors(refs.gameModalForm);
}

// SAVE GAME → POST /api/admin/create-games/:userId  أو PUT /api/admin/edit-games/:gameId
async function saveModalGame(e) {
  e.preventDefault();

  const title = refs.modalGameTitle.value.trim();
  const category = refs.modalGameCategory.value.trim();
  const price = Number(refs.modalGamePrice.value);
  const status = refs.modalGameStatus.value;
  const imageUrl = refs.modalGameImage ? refs.modalGameImage.value.trim() : "";
  const stock = refs.modalGameStock ? Number(refs.modalGameStock.value) : (status === "available" ? 10 : 0);

  clearFieldErrors(refs.gameModalForm);

  // Client-side validation
  let isValid = true;
  if (!title) {
    showFieldError(refs.modalGameTitle, "Game title is required.");
    isValid = false;
  }
  if (!category) {
    showFieldError(refs.modalGameCategory, "Category is required.");
    isValid = false;
  }
  if (!refs.modalGamePrice.value || isNaN(price) || price < 0) {
    showFieldError(refs.modalGamePrice, "Enter a valid price (0 or more).");
    isValid = false;
  }
  if (!isValid) return;

  refs.modalSaveBtn.disabled = true;
  refs.modalSaveBtn.textContent = "Saving...";

  // لو editing → PUT، لو adding → POST
  if (state.editingGameId) {
    const { ok, data } = await apiFetch(
      `${API_BASE}/edit-games/${state.editingGameId}`,
      {
        method: "PUT",
        body: JSON.stringify({ title, price, genre: category, imageUrl, stock }),
      },
    );

    if (ok) {
      // نحدث الـ state محلياً بدون ما نعمل reload كامل
      const game = state.games.find((g) => g.id === state.editingGameId);
      if (game) Object.assign(game, { title, category, price, status, imageUrl, stock });
      showToast("Game updated successfully.");
      closeGameModal();
      renderGamesSection();
      renderOverview();
    } else {
      showToast(data.message || "Failed to update game.", "error");
    }
  } else {
    // POST create-games — بنحتاج userId من الـ token
    // بنجيب الـ admin id من الـ token المحفوظ
    const adminId = getAdminIdFromToken();
    const { ok, data } = await apiFetch(`${API_BASE}/create-games/${adminId}`, {
      method: "POST",
      body: JSON.stringify({ title, price, genre: category, imageUrl, stock }),
    });

    if (ok) {
      showToast("Game added successfully.");
      closeGameModal();
      // بنعمل reload للـ games عشان نجيب الـ _id الحقيقي من DB
      await loadGames();
      renderGamesSection();
      renderOverview();
    } else {
      showToast(data.message || "Failed to add game.", "error");
    }
  }

  refs.modalSaveBtn.disabled = false;
  refs.modalSaveBtn.textContent = state.editingGameId
    ? "Update game"
    : "Save game";
}

/* =============================================
   USER MODAL
   ============================================= */
function openUserModal(mode, userId = null) {
  state.editingUserId = mode === "edit" ? userId : null;
  refs.userModalTitle.textContent =
    mode === "edit" ? "Edit user" : "Add new user";
  refs.userModalSaveBtn.textContent =
    mode === "edit" ? "Update user" : "Save user";

  if (mode === "edit") {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return;
    refs.modalUserName.value = user.name;
    refs.modalUserEmail.value = user.email;
    refs.modalUserRole.value = user.role;
    refs.modalUserStatus.value = user.status;
  } else {
    refs.userModalForm.reset();
  }

  refs.userModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeUserModal() {
  refs.userModal.classList.add("hidden");
  document.body.style.overflow = "";
  state.editingUserId = null;
  refs.userModalForm.reset();
  clearFieldErrors(refs.userModalForm);
}

// SAVE USER → POST /api/admin/add-user  أو PUT /api/admin/edit-user/:id
async function saveModalUser(e) {
  e.preventDefault();

  const name = refs.modalUserName.value.trim();
  const email = refs.modalUserEmail.value.trim();
  const role = refs.modalUserRole.value;
  const status = refs.modalUserStatus.value;

  clearFieldErrors(refs.userModalForm);

  let isValid = true;
  if (!name) {
    showFieldError(refs.modalUserName, "Name is required.");
    isValid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError(refs.modalUserEmail, "Enter a valid email address.");
    isValid = false;
  }
  if (!isValid) return;

  refs.userModalSaveBtn.disabled = true;
  refs.userModalSaveBtn.textContent = "Saving...";

  if (state.editingUserId) {
    // PUT /api/admin/edit-user/:id
    const { ok, data } = await apiFetch(
      `${API_BASE}/edit-user/${state.editingUserId}`,
      {
        method: "PUT",
        body: JSON.stringify({ userName: name, email }),
      },
    );

    if (ok) {
      const user = state.users.find((u) => u.id === state.editingUserId);
      if (user) Object.assign(user, { name, email, role, status });
      showToast("User updated successfully.");
      closeUserModal();
      renderUsersSection();
      renderOverview();
    } else {
      showToast(data.message || "Failed to update user.", "error");
    }
  } else {
    // POST /api/admin/add-user
    const { ok, data } = await apiFetch(`${API_BASE}/add-user`, {
      method: "POST",
      body: JSON.stringify({
        userName: name,
        email,
        password: "DefaultPass123", // الـ admin بيحدد password مؤقت
        role,
      }),
    });

    if (ok) {
      showToast("User added. Default password: DefaultPass123");
      closeUserModal();
      await loadUsers();
      renderUsersSection();
      renderOverview();
    } else {
      showToast(data.message || "Failed to add user.", "error");
    }
  }

  refs.userModalSaveBtn.disabled = false;
  refs.userModalSaveBtn.textContent = state.editingUserId
    ? "Update user"
    : "Save user";
}

/* =============================================
   UTILS
   ============================================= */
function getAdminIdFromToken() {
  try {
    const token = getToken();
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return "";
  }
}

function showPageLoader(show) {
  state.loading = show;
  // لو عندك loader element في الـ HTML
  const loader = document.getElementById("pageLoader");
  if (loader) loader.style.display = show ? "flex" : "none";
}

function setBtnLoading(show) {
  // يمنع double click على الـ action buttons
  document.querySelectorAll(".action-buttons button").forEach((btn) => {
    btn.disabled = show;
  });
}

function showFieldError(inputEl, message) {
  const label = inputEl.closest("label");
  if (!label) return;
  const err = document.createElement("span");
  err.className = "field-error";
  err.style.cssText =
    "color:#ff6b7d;font-size:0.78rem;display:block;margin-top:4px;";
  err.textContent = message;
  label.appendChild(err);
  inputEl.style.borderColor = "#ff6b7d";
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
  form.querySelectorAll("input, select").forEach((el) => {
    el.style.borderColor = "";
  });
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.cssText +=
    type === "error"
      ? "border-left: 4px solid #ff6b7d;"
      : "border-left: 4px solid #00ff88;";
  refs.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

/* =============================================
   IMAGE PREVIEW HELPERS
   ============================================= */
function showImagePreview(url) {
  if (!refs.modalImagePreview || !refs.modalPreviewImg) return;
  refs.modalPreviewImg.src = url;
  refs.modalImagePreview.style.display = "block";
}

function hideImagePreview() {
  if (!refs.modalImagePreview || !refs.modalPreviewImg) return;
  refs.modalImagePreview.style.display = "none";
  refs.modalPreviewImg.src = "";
}

init();
