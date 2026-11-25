const API = '/api/v1';

let token = localStorage.getItem('rolecall_token') || '';
let currentUser = null;

const messageBox = document.getElementById('messageBox');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const userBar = document.getElementById('userBar');
const userLabel = document.getElementById('userLabel');

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = 'message ' + (isError ? 'err' : 'ok');
}

function clearMessage() {
  messageBox.className = 'message hidden';
  messageBox.textContent = '';
}

function toFullTime(t) {
  if (!t) return t;
  return t.length === 5 ? t + ':00' : t;
}

function esc(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API + path, { ...options, headers });
  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && data.message
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : 'Request failed (' + res.status + ')';
    throw new Error(msg);
  }
  return data;
}

function setLoggedOut() {
  token = '';
  currentUser = null;
  localStorage.removeItem('rolecall_token');
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  userBar.classList.add('hidden');
}

function updateRoleUI() {
  const isDirector = currentUser && currentUser.role === 'director';
  const isActor = currentUser && currentUser.role === 'actor';

  document.getElementById('productionFormBox').classList.toggle('hidden', !isDirector);
  document.getElementById('rehearsalFormBox').classList.toggle('hidden', !isDirector);
  document.getElementById('assignmentFormBox').classList.toggle('hidden', !isDirector);
  document.getElementById('availabilityFormBox').classList.toggle('hidden', !isActor);
}

async function loadAllData() {
  await Promise.all([
    loadProductions(),
    loadRehearsals(),
    loadAvailabilities(),
    loadAssignments(),
    loadActorsDropdown(),
  ]);
}

async function loadProductions() {
  const result = await api('/productions?page=1&limit=50');
  const rows = result.data || [];
  const tbody = document.getElementById('productionsTable');
  const select = document.getElementById('rehProduction');

  const isDirector = currentUser.role === 'director';

  tbody.innerHTML = rows.length
    ? rows
        .map(
          (p) => `<tr>
            <td>${p.id}</td>
            <td>${esc(p.title)}</td>
            <td>${esc(p.venue || '-')}</td>
            <td>${esc(p.startDate)} to ${esc(p.endDate)}</td>
            <td>${esc(p.director ? p.director.fullName : p.directorId)}</td>
            <td>${isDirector ? `<button class="delete-btn" onclick="deleteProduction(${p.id})">Delete</button>` : '-'}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="6">No productions yet.</td></tr>';

  select.innerHTML = rows.length
    ? rows.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('')
    : '<option value="">No productions</option>';
}

async function loadRehearsals() {
  const result = await api('/rehearsals?page=1&limit=50');
  const rows = result.data || [];
  const tbody = document.getElementById('rehearsalsTable');
  const select = document.getElementById('assignRehearsal');

  const isDirector = currentUser.role === 'director';

  tbody.innerHTML = rows.length
    ? rows
        .map(
          (r) => `<tr>
            <td>${r.id}</td>
            <td>${esc(r.production ? r.production.title : r.productionId)}</td>
            <td>${esc(r.title)}</td>
            <td>${esc(r.rehearsalDate)}</td>
            <td>${esc(r.startTime)} - ${esc(r.endTime)}</td>
            <td>${esc(r.location || '-')}</td>
            <td>${isDirector ? `<button class="delete-btn" onclick="deleteRehearsal(${r.id})">Delete</button>` : '-'}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="7">No rehearsals scheduled.</td></tr>';

  select.innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<option value="${r.id}">${esc(r.title)} (${esc(r.rehearsalDate)} ${esc(r.startTime)})</option>`,
        )
        .join('')
    : '<option value="">No rehearsals</option>';
}

async function loadAvailabilities() {
  const rows = await api('/availabilities');
  const tbody = document.getElementById('availabilitiesTable');

  tbody.innerHTML = rows.length
    ? rows
        .map((a) => {
          const canDelete = currentUser.role === 'actor' && a.userId === currentUser.id;
          return `<tr>
            <td>${a.id}</td>
            <td>${esc(a.user ? a.user.fullName : a.userId)}</td>
            <td>${esc(a.availableDate)}</td>
            <td>${esc(a.startTime)} - ${esc(a.endTime)}</td>
            <td>${esc(a.status)}</td>
            <td>${esc(a.note || '-')}</td>
            <td>${canDelete ? `<button class="delete-btn" onclick="deleteAvailability(${a.id})">Delete</button>` : '-'}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="7">No availability records.</td></tr>';
}

async function loadAssignments() {
  const rows = await api('/cast-assignments');
  const tbody = document.getElementById('assignmentsTable');
  const isDirector = currentUser.role === 'director';

  tbody.innerHTML = rows.length
    ? rows
        .map(
          (c) => `<tr>
            <td>${c.id}</td>
            <td>${esc(c.rehearsal ? c.rehearsal.title : c.rehearsalId)}</td>
            <td>${c.rehearsal ? esc(c.rehearsal.rehearsalDate + ' ' + c.rehearsal.startTime + '-' + c.rehearsal.endTime) : '-'}</td>
            <td>${esc(c.actor ? c.actor.fullName : c.actorId)}</td>
            <td>${esc(c.roleName)}</td>
            <td>${esc(c.notes || '-')}</td>
            <td>${isDirector ? `<button class="delete-btn" onclick="deleteAssignment(${c.id})">Remove</button>` : '-'}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="7">No cast assignments yet.</td></tr>';
}

async function loadActorsDropdown() {
  const select = document.getElementById('assignActor');
  if (currentUser.role !== 'director') {
    select.innerHTML = '';
    return;
  }

  const actors = await api('/users?role=actor');
  select.innerHTML = actors.length
    ? actors.map((u) => `<option value="${u.id}">${esc(u.fullName)} (${esc(u.email)})</option>`).join('')
    : '<option value="">No actors registered</option>';
}

async function initSession() {
  if (!token) {
    setLoggedOut();
    return;
  }

  try {
    currentUser = await api('/auth/profile');
    userLabel.textContent = currentUser.fullName + ' (' + currentUser.role + ')';
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userBar.classList.remove('hidden');
    updateRoleUI();
    await loadAllData();
  } catch {
    setLoggedOut();
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
      }),
    });
    token = res.accessToken;
    localStorage.setItem('rolecall_token', token);
    e.target.reset();
    showMessage('Logged in successfully.', false);
    await initSession();
  } catch (err) {
    showMessage(err.message, true);
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value,
      }),
    });
    e.target.reset();
    showMessage('Account created. You can now log in.', false);
  } catch (err) {
    showMessage(err.message, true);
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  setLoggedOut();
  showMessage('Logged out.', false);
});

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

document.getElementById('productionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    await api('/productions', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('prodTitle').value,
        venue: document.getElementById('prodVenue').value || undefined,
        startDate: document.getElementById('prodStart').value,
        endDate: document.getElementById('prodEnd').value,
        description: document.getElementById('prodDesc').value || undefined,
      }),
    });
    e.target.reset();
    showMessage('Production added.', false);
    await loadProductions();
  } catch (err) {
    showMessage(err.message, true);
  }
});

document.getElementById('rehearsalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    await api('/rehearsals', {
      method: 'POST',
      body: JSON.stringify({
        productionId: Number(document.getElementById('rehProduction').value),
        title: document.getElementById('rehTitle').value,
        location: document.getElementById('rehLocation').value || undefined,
        rehearsalDate: document.getElementById('rehDate').value,
        startTime: toFullTime(document.getElementById('rehStart').value),
        endTime: toFullTime(document.getElementById('rehEnd').value),
        notes: document.getElementById('rehNotes').value || undefined,
      }),
    });
    e.target.reset();
    showMessage('Rehearsal scheduled.', false);
    await loadRehearsals();
  } catch (err) {
    showMessage(err.message, true);
  }
});

document.getElementById('availabilityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    await api('/availabilities', {
      method: 'POST',
      body: JSON.stringify({
        availableDate: document.getElementById('availDate').value,
        startTime: toFullTime(document.getElementById('availStart').value),
        endTime: toFullTime(document.getElementById('availEnd').value),
        status: document.getElementById('availStatus').value,
        note: document.getElementById('availNote').value || undefined,
      }),
    });
    e.target.reset();
    showMessage('Availability saved.', false);
    await loadAvailabilities();
  } catch (err) {
    showMessage(err.message, true);
  }
});

document.getElementById('assignmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  try {
    await api('/cast-assignments', {
      method: 'POST',
      body: JSON.stringify({
        rehearsalId: Number(document.getElementById('assignRehearsal').value),
        actorId: Number(document.getElementById('assignActor').value),
        roleName: document.getElementById('assignRole').value,
        notes: document.getElementById('assignNotes').value || undefined,
      }),
    });
    e.target.reset();
    showMessage('Actor assigned to rehearsal.', false);
    await loadAssignments();
  } catch (err) {
    showMessage(err.message, true);
  }
});

window.deleteProduction = async (id) => {
  clearMessage();
  try {
    await api('/productions/' + id, { method: 'DELETE' });
    showMessage('Production deleted.', false);
    await loadProductions();
  } catch (err) {
    showMessage(err.message, true);
  }
};

window.deleteRehearsal = async (id) => {
  clearMessage();
  try {
    await api('/rehearsals/' + id, { method: 'DELETE' });
    showMessage('Rehearsal deleted.', false);
    await loadRehearsals();
  } catch (err) {
    showMessage(err.message, true);
  }
};

window.deleteAvailability = async (id) => {
  clearMessage();
  try {
    await api('/availabilities/' + id, { method: 'DELETE' });
    showMessage('Availability deleted.', false);
    await loadAvailabilities();
  } catch (err) {
    showMessage(err.message, true);
  }
};

window.deleteAssignment = async (id) => {
  clearMessage();
  try {
    await api('/cast-assignments/' + id, { method: 'DELETE' });
    showMessage('Cast assignment removed.', false);
    await loadAssignments();
  } catch (err) {
    showMessage(err.message, true);
  }
};

initSession();
