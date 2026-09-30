// -----------------------------------------------------------
// 1. DATA DEFINITIONS & DEFAULT ROSTER (3 VOLUNTEERS PER CART)
// -----------------------------------------------------------
const LOCATIONS = [
  { id: 'L1', name: 'Location 1 (L1)', landmark: 'Central Metro Station - North Entrance', cartStorage: 'Cart stored at Bro. Samuel\'s garage' },
  { id: 'L2', name: 'Location 2 (L2)', landmark: 'City Public Market & Community Square', cartStorage: 'Cart stored in Market Hall Locker #4' },
  { id: 'L3', name: 'Location 3 (L3)', landmark: 'Central Park West - Lake Walkway', cartStorage: 'Cart with Sister Martha' },
  { id: 'L4', name: 'Location 4 (L4)', landmark: 'Ferry Terminal & Marina Promenade', cartStorage: 'Cart stored at Terminal Info Booth' },
  { id: 'L5', name: 'Location 5 (L5)', landmark: 'Civic Center & Public Library Plaza', cartStorage: 'Cart with Bro. Robert' }
];

const SHIFT_TIMES = [
  {
    id: 0,
    name: 'Shift 1: Morning',
    timeString: '06:30 AM – 08:00 AM',
    icon: '🌅',
    className: 'morning'
  },
  {
    id: 1,
    name: 'Shift 2: Afternoon',
    timeString: '04:30 PM – 06:00 PM',
    icon: '🌇',
    className: 'afternoon'
  }
];

const DEFAULT_KEYMAN_PIN = '1234';

// State Variables
let currentDate = new Date();
// Normalize to date at midnight for consistent comparisons
currentDate.setHours(0, 0, 0, 0);

let isKeymanLoggedIn = false;
let currentFilter = 'ALL';
let enteredPin = '';
let speechSynthUtterance = null;

// Helper: format YYYY-MM-DD
function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate Initial Sample Roster with 3 Volunteers per Cart
function generateSampleScheduleForDate(dateKey) {
  return {
    'L1': [
      {
        p1: { name: 'Bro. Samuel David', phone: '555-0143' },
        p2: { name: 'Bro. Thomas Wayne', phone: '555-0188' },
        p3: { name: 'Sis. Martha Clark', phone: '555-0219' },
        notes: 'Take literature box #1. Cart is at station locker.'
      },
      {
        p1: { name: 'Sis. Sarah Johnson', phone: '555-0322' },
        p2: { name: 'Sis. Elizabeth Brown', phone: '555-0355' },
        p3: { name: '', phone: '' }, // 1 slot open
        notes: 'Need 1 afternoon partner for station rush.'
      }
    ],
    'L2': [
      {
        p1: { name: 'Bro. Robert Miller', phone: '555-0410' },
        p2: { name: 'Bro. James Wilson', phone: '555-0487' },
        p3: { name: 'Bro. Daniel Harris', phone: '555-0923' },
        notes: 'Market gets busy around 7:15 AM.'
      },
      {
        p1: { name: 'Sis. Patricia Davis', phone: '555-0812' },
        p2: { name: '', phone: '' }, // 2 slots open
        p3: { name: '', phone: '' },
        notes: 'Need 2 afternoon partners at Community Square.'
      }
    ],
    'L3': [
      {
        p1: { name: 'Bro. Joseph Taylor', phone: '555-0551' },
        p2: { name: 'Bro. Michael Moore', phone: '555-0771' },
        p3: { name: 'Bro. Kevin Martin', phone: '555-0955' },
        notes: 'Lake Walkway morning exercise route.'
      },
      {
        p1: { name: 'Sis. Jennifer Anderson', phone: '555-0604' },
        p2: { name: 'Sis. Linda Thomas', phone: '555-0629' },
        p3: { name: 'Sis. Barbara White', phone: '555-0899' },
        notes: 'Cart stored at park ranger desk.'
      }
    ],
    'L4': [
      {
        p1: { name: 'Bro. Paul Jackson', phone: '555-0782' },
        p2: { name: 'Bro. David Martinez', phone: '555-0834' },
        p3: { name: '', phone: '' }, // 1 slot open
        notes: 'Peak ferry commute at 7:30 AM.'
      },
      {
        p1: { name: '', phone: '' }, // 3 slots open (entire shift vacant)
        p2: { name: '', phone: '' },
        p3: { name: '', phone: '' },
        notes: 'Full afternoon shift open. Keyman seeking 3 volunteers.'
      }
    ],
    'L5': [
      {
        p1: { name: 'Sis. Ruth Evans', phone: '555-0199' },
        p2: { name: 'Sis. Mary Jenkins', phone: '555-0245' },
        p3: { name: 'Sis. Deborah Adams', phone: '555-0311' },
        notes: 'Library courtyard opens at 6:30 AM sharp.'
      },
      {
        p1: { name: 'Bro. Anthony Scott', phone: '555-0677' },
        p2: { name: 'Bro. Charles Perez', phone: '555-0712' },
        p3: { name: 'Bro. George Hall', phone: '555-0844' },
        notes: 'Both carts set up for plaza evening crowd.'
      }
    ]
  };
}

// Normalize shift to guarantee 3 publishers for backwards compatibility
function normalizeShiftData(rawShift) {
  if (!rawShift) {
    return {
      p1: { name: '', phone: '' },
      p2: { name: '', phone: '' },
      p3: { name: '', phone: '' },
      notes: ''
    };
  }
  return {
    p1: rawShift.p1 || { name: '', phone: '' },
    p2: rawShift.p2 || { name: '', phone: '' },
    p3: rawShift.p3 || { name: '', phone: '' },
    notes: rawShift.notes || ''
  };
}

// Schedule Storage Manager
function getScheduleForDate(dateKey) {
  const storageKey = `cart_schedule_v2_${dateKey}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      LOCATIONS.forEach(loc => {
        if (!parsed[loc.id]) {
          parsed[loc.id] = [normalizeShiftData(null), normalizeShiftData(null)];
        } else {
          parsed[loc.id][0] = normalizeShiftData(parsed[loc.id][0]);
          parsed[loc.id][1] = normalizeShiftData(parsed[loc.id][1]);
        }
      });
      return parsed;
    } catch (e) {
      console.error('Error parsing stored schedule', e);
    }
  }
  // Generate default sample data for new date
  const sample = generateSampleScheduleForDate(dateKey);
  localStorage.setItem(storageKey, JSON.stringify(sample));
  return sample;
}

function saveScheduleForDate(dateKey, data) {
  const storageKey = `cart_schedule_v2_${dateKey}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
}

// -----------------------------------------------------------
// 2. ACCESSIBILITY CONTROLS (ZOOM & HIGH CONTRAST)
// -----------------------------------------------------------
function setFontZoom(level) {
  const html = document.documentElement;
  html.classList.remove('zoom-large', 'zoom-jumbo');

  document.getElementById('zoomNormalBtn').classList.remove('btn-primary');
  document.getElementById('zoomLargeBtn').classList.remove('btn-primary');
  document.getElementById('zoomJumboBtn').classList.remove('btn-primary');

  if (level === 'large') {
    html.classList.add('zoom-large');
    document.getElementById('zoomLargeBtn').classList.add('btn-primary');
  } else if (level === 'jumbo') {
    html.classList.add('zoom-jumbo');
    document.getElementById('zoomJumboBtn').classList.add('btn-primary');
  } else {
    document.getElementById('zoomNormalBtn').classList.add('btn-primary');
  }

  localStorage.setItem('cart_app_zoom', level);
  showToast(`Text size: ${level.toUpperCase()}`);
}

function toggleHighContrast() {
  const body = document.body;
  body.classList.toggle('ultra-contrast');
  const isUltra = body.classList.contains('ultra-contrast');
  localStorage.setItem('cart_app_contrast', isUltra ? 'ultra' : 'normal');

  const btn = document.getElementById('contrastToggleBtn');
  if (isUltra) {
    btn.textContent = '☀️ Standard';
    showToast('Ultra High-Contrast Enabled');
  } else {
    btn.textContent = '👁️ High-Vis';
    showToast('Standard High-Clarity Theme');
  }
}

function initUserPreferences() {
  const savedZoom = localStorage.getItem('cart_app_zoom') || 'normal';
  setFontZoom(savedZoom);

  const savedContrast = localStorage.getItem('cart_app_contrast');
  if (savedContrast === 'ultra') {
    document.body.classList.add('ultra-contrast');
    document.getElementById('contrastToggleBtn').textContent = '☀️ Standard';
  }

  const savedKeyman = localStorage.getItem('cart_app_keyman_auth');
  if (savedKeyman === 'true') {
    isKeymanLoggedIn = true;
    updateKeymanUI();
  }
}

// -----------------------------------------------------------
// 3. DATE NAVIGATION & UI RENDERING
// -----------------------------------------------------------
function updateDateDisplay() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[currentDate.getDay()];
  const monthName = months[currentDate.getMonth()];
  const dayNum = currentDate.getDate();
  const year = currentDate.getFullYear();

  const title = `${dayName}, ${monthName} ${dayNum}`;
  document.getElementById('currentDateTitle').textContent = title;

  // Calculate relative label (Today, Tomorrow, Yesterday, etc.)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((currentDate - today) / (1000 * 60 * 60 * 24));
  
  let sub = `${year} Roster`;
  if (diffDays === 0) sub = "Today's Schedule";
  else if (diffDays === 1) sub = "Tomorrow's Schedule";
  else if (diffDays === -1) sub = "Yesterday's Schedule";
  else if (diffDays > 1) sub = `In ${diffDays} days`;
  else if (diffDays < -1) sub = `${Math.abs(diffDays)} days ago`;

  document.getElementById('currentDateSubtitle').textContent = sub;
  document.getElementById('directDatePicker').value = formatDateKey(currentDate);
}

function changeDateOffset(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  updateDateDisplay();
  renderScheduleGrid();
}

function goToToday() {
  currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  updateDateDisplay();
  renderScheduleGrid();
  showToast("Jumped to Today");
}

function onDirectDateSelected(dateVal) {
  if (!dateVal) return;
  const parts = dateVal.split('-');
  if (parts.length === 3) {
    currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    currentDate.setHours(0, 0, 0, 0);
    updateDateDisplay();
    renderScheduleGrid();
  }
}

function filterLocation(locId) {
  currentFilter = locId;
  const buttons = ['ALL', 'L1', 'L2', 'L3', 'L4', 'L5'];
  buttons.forEach(b => {
    const el = document.getElementById(`filterBtn${b}`);
    if (el) {
      if (b === locId) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
  renderScheduleGrid();
}

// -----------------------------------------------------------
// 4. SCHEDULE GRID BUILDER (PHONE OPTIMIZED 3-VOLUNTEER SLOTS)
// -----------------------------------------------------------
function renderScheduleGrid() {
  const container = document.getElementById('scheduleGrid');
  container.innerHTML = '';

  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  let totalSlots = 0;
  let filledSlots = 0;
  let openSlots = 0;

  const locationsToDisplay = currentFilter === 'ALL' 
    ? LOCATIONS 
    : LOCATIONS.filter(l => l.id === currentFilter);

  locationsToDisplay.forEach(loc => {
    const locShifts = scheduleData[loc.id] || [
      normalizeShiftData(null),
      normalizeShiftData(null)
    ];

    // Create Location Card
    const card = document.createElement('article');
    card.className = 'location-card';
    card.setAttribute('aria-labelledby', `heading-${loc.id}`);

    // Location Header with Storage Pill
    const header = document.createElement('div');
    header.className = 'location-header';
    header.innerHTML = `
      <div class="location-title-box">
        <span class="location-tag">${loc.id}</span>
        <div>
          <h2 id="heading-${loc.id}" class="location-name">${loc.name}</h2>
          <div class="location-landmark">📍 ${loc.landmark}</div>
        </div>
      </div>
      <div class="location-storage-pill">
        <span aria-hidden="true">📦</span>
        <span>${loc.cartStorage}</span>
      </div>
    `;
    card.appendChild(header);

    // Shifts container
    const shiftsGrid = document.createElement('div');
    shiftsGrid.className = 'shifts-container';

    SHIFT_TIMES.forEach(shiftDef => {
      const shiftData = normalizeShiftData(locShifts[shiftDef.id]);
      
      totalSlots += 3;
      const p1Filled = shiftData.p1 && shiftData.p1.name && shiftData.p1.name.trim().length > 0;
      const p2Filled = shiftData.p2 && shiftData.p2.name && shiftData.p2.name.trim().length > 0;
      const p3Filled = shiftData.p3 && shiftData.p3.name && shiftData.p3.name.trim().length > 0;
      
      let countFilled = 0;
      if (p1Filled) countFilled++;
      if (p2Filled) countFilled++;
      if (p3Filled) countFilled++;

      filledSlots += countFilled;
      openSlots += (3 - countFilled);

      // Status Badge details (Phone friendly)
      let statusBadgeHtml = '';
      if (countFilled === 3) {
        statusBadgeHtml = `<span class="status-badge full">✔️ Full (3/3)</span>`;
      } else if (countFilled === 2) {
        statusBadgeHtml = `<span class="status-badge need-one">⚠️ 1 Needed</span>`;
      } else if (countFilled === 1) {
        statusBadgeHtml = `<span class="status-badge need-two">⚠️ 2 Needed</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge empty">⭕ Open (3 Needed)</span>`;
      }

      // Build Shift Block
      const shiftBlock = document.createElement('div');
      shiftBlock.className = `shift-block ${shiftDef.className}`;

      shiftBlock.innerHTML = `
        <div>
          <div class="shift-header-info">
            <div>
              <div class="shift-name-tag">${shiftDef.name}</div>
              <div class="shift-time-badge">
                <span aria-hidden="true">${shiftDef.icon}</span>
                <span>${shiftDef.timeString}</span>
              </div>
            </div>
            ${statusBadgeHtml}
          </div>

          <!-- 3 Publisher Slots with 1-Tap Mobile Call Buttons -->
          <div class="publishers-list" role="list" aria-label="Volunteers">
            <!-- Slot 1 -->
            <div class="publisher-slot" role="listitem">
              <div class="slot-lead-info">
                <div class="slot-role">Slot 1 &bull; Driver / Lead</div>
                ${p1Filled ? `<div class="slot-name">${escapeHtml(shiftData.p1.name)}</div>` : `<div class="slot-empty-text">⚠️ Slot Open</div>`}
              </div>
              ${p1Filled && shiftData.p1.phone ? `
                <a href="tel:${escapeHtml(shiftData.p1.phone)}" class="slot-phone-btn" aria-label="Call ${escapeHtml(shiftData.p1.name)}">
                  📞 Call
                </a>
              ` : ''}
            </div>

            <!-- Slot 2 -->
            <div class="publisher-slot" role="listitem">
              <div class="slot-lead-info">
                <div class="slot-role">Slot 2 &bull; Cart Partner</div>
                ${p2Filled ? `<div class="slot-name">${escapeHtml(shiftData.p2.name)}</div>` : `<div class="slot-empty-text">⚠️ Slot Open</div>`}
              </div>
              ${p2Filled && shiftData.p2.phone ? `
                <a href="tel:${escapeHtml(shiftData.p2.phone)}" class="slot-phone-btn" aria-label="Call ${escapeHtml(shiftData.p2.name)}">
                  📞 Call
                </a>
              ` : ''}
            </div>

            <!-- Slot 3 -->
            <div class="publisher-slot" role="listitem">
              <div class="slot-lead-info">
                <div class="slot-role">Slot 3 &bull; Cart Partner</div>
                ${p3Filled ? `<div class="slot-name">${escapeHtml(shiftData.p3.name)}</div>` : `<div class="slot-empty-text">⚠️ Slot Open</div>`}
              </div>
              ${p3Filled && shiftData.p3.phone ? `
                <a href="tel:${escapeHtml(shiftData.p3.phone)}" class="slot-phone-btn" aria-label="Call ${escapeHtml(shiftData.p3.name)}">
                  📞 Call
                </a>
              ` : ''}
            </div>
          </div>

          ${shiftData.notes ? `
            <div class="shift-notes">
              <strong>Notes:</strong> ${escapeHtml(shiftData.notes)}
            </div>
          ` : ''}
        </div>

        <!-- Shift Action (Full-Width Thumb-Friendly) -->
        <div class="shift-action-row">
          ${isKeymanLoggedIn ? `
            <button class="btn btn-warning btn-block" onclick="openShiftEditor('${loc.id}', ${shiftDef.id})" aria-label="Keyman Edit ${loc.id} ${shiftDef.name}">
              ✏️ Edit Shift (3 Slots)
            </button>
          ` : `
            ${countFilled < 3 ? `
              <button class="btn btn-success btn-block" onclick="openVolunteerModal('${loc.id}', ${shiftDef.id})" aria-label="Volunteer for ${loc.id} ${shiftDef.name}">
                🙋 I Can Volunteer!
              </button>
            ` : `
              <button class="btn btn-outline btn-block" onclick="viewShiftDetails('${loc.id}', ${shiftDef.id})" aria-label="View Shift Details">
                📋 Shift Details
              </button>
            `}
          `}
        </div>
      `;

      shiftsGrid.appendChild(shiftBlock);
    });

    card.appendChild(shiftsGrid);
    container.appendChild(card);
  });

  // Update Summary Counter
  document.getElementById('statTotalLocations').textContent = LOCATIONS.length;
  document.getElementById('statConfirmedSlots').textContent = `${filledSlots} / ${totalSlots}`;
  document.getElementById('statNeededSlots').textContent = openSlots;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -----------------------------------------------------------
// 5. KEYMAN AUTHENTICATION (MOBILE PIN PAD)
// -----------------------------------------------------------
function openKeymanAuthModal() {
  const modal = document.getElementById('keymanModal');
  const loginView = document.getElementById('loginView');
  const loggedInView = document.getElementById('loggedInView');

  if (isKeymanLoggedIn) {
    loginView.style.display = 'none';
    loggedInView.style.display = 'block';
  } else {
    loginView.style.display = 'block';
    loggedInView.style.display = 'none';
    clearPin();
  }

  modal.classList.add('active');
}

function closeKeymanModal() {
  document.getElementById('keymanModal').classList.remove('active');
}

function pressPinDigit(digit) {
  if (enteredPin.length < 4) {
    enteredPin += digit;
    updatePinDots();
    if (enteredPin.length === 4) {
      setTimeout(submitPinLogin, 250);
    }
  }
}

function backspacePin() {
  if (enteredPin.length > 0) {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDots();
  }
}

function clearPin() {
  enteredPin = '';
  updatePinDots();
}

function updatePinDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`pDot${i}`);
    if (i <= enteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  }
}

function submitPinLogin() {
  if (enteredPin === DEFAULT_KEYMAN_PIN) {
    isKeymanLoggedIn = true;
    localStorage.setItem('cart_app_keyman_auth', 'true');
    updateKeymanUI();
    closeKeymanModal();
    renderScheduleGrid();
    showToast('🔓 Keyman Edit Mode Active');
  } else {
    clearPin();
    showToast('❌ Incorrect PIN. Hint: 1234');
  }
}

function logoutKeyman() {
  isKeymanLoggedIn = false;
  localStorage.removeItem('cart_app_keyman_auth');
  updateKeymanUI();
  closeKeymanModal();
  renderScheduleGrid();
  showToast('🔒 Returned to Viewer Mode');
}

function updateKeymanUI() {
  const btnText = document.getElementById('keymanBtnText');
  const btn = document.getElementById('keymanActionBtn');

  if (isKeymanLoggedIn) {
    btnText.textContent = 'Keyman ⭐';
    btn.classList.add('btn-warning');
    btn.classList.remove('btn-keyman');
  } else {
    btnText.textContent = 'Keyman';
    btn.classList.add('btn-keyman');
    btn.classList.remove('btn-warning');
  }
}

// -----------------------------------------------------------
// 6. SHIFT EDITOR (3 VOLUNTEERS)
// -----------------------------------------------------------
function openShiftEditor(locId, shiftIdx) {
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];
  const currentShift = normalizeShiftData(scheduleData[locId] && scheduleData[locId][shiftIdx]);

  document.getElementById('editLocationId').value = locId;
  document.getElementById('editShiftIndex').value = shiftIdx;
  document.getElementById('editorShiftHeader').textContent = `${loc.name} • ${shiftDef.name} (${shiftDef.timeString})`;
  document.getElementById('editorShiftDate').textContent = document.getElementById('currentDateTitle').textContent;

  document.getElementById('editPub1Name').value = currentShift.p1.name || '';
  document.getElementById('editPub1Phone').value = currentShift.p1.phone || '';
  document.getElementById('editPub2Name').value = currentShift.p2.name || '';
  document.getElementById('editPub2Phone').value = currentShift.p2.phone || '';
  document.getElementById('editPub3Name').value = currentShift.p3.name || '';
  document.getElementById('editPub3Phone').value = currentShift.p3.phone || '';
  document.getElementById('editShiftNotes').value = currentShift.notes || '';

  document.getElementById('shiftEditorModal').classList.add('active');
}

function closeShiftEditorModal() {
  document.getElementById('shiftEditorModal').classList.remove('active');
}

function saveShiftEditor(e) {
  e.preventDefault();
  const locId = document.getElementById('editLocationId').value;
  const shiftIdx = parseInt(document.getElementById('editShiftIndex').value);
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  if (!scheduleData[locId]) {
    scheduleData[locId] = [normalizeShiftData(null), normalizeShiftData(null)];
  }

  scheduleData[locId][shiftIdx] = {
    p1: {
      name: document.getElementById('editPub1Name').value.trim(),
      phone: document.getElementById('editPub1Phone').value.trim()
    },
    p2: {
      name: document.getElementById('editPub2Name').value.trim(),
      phone: document.getElementById('editPub2Phone').value.trim()
    },
    p3: {
      name: document.getElementById('editPub3Name').value.trim(),
      phone: document.getElementById('editPub3Phone').value.trim()
    },
    notes: document.getElementById('editShiftNotes').value.trim()
  };

  saveScheduleForDate(dateKey, scheduleData);
  closeShiftEditorModal();
  renderScheduleGrid();
  showToast(`✅ Saved ${locId} (3 Volunteers)!`);
}

function clearCurrentShift() {
  if (confirm('Clear all 3 volunteers and mark this shift as Open?')) {
    document.getElementById('editPub1Name').value = '';
    document.getElementById('editPub1Phone').value = '';
    document.getElementById('editPub2Name').value = '';
    document.getElementById('editPub2Phone').value = '';
    document.getElementById('editPub3Name').value = '';
    document.getElementById('editPub3Phone').value = '';
    document.getElementById('editShiftNotes').value = '';
  }
}

// -----------------------------------------------------------
// 7. VOLUNTEER REGISTRATION (MOBILE 1-TAP)
// -----------------------------------------------------------
function openVolunteerModal(locId, shiftIdx) {
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];

  document.getElementById('volLocId').value = locId;
  document.getElementById('volShiftIdx').value = shiftIdx;
  document.getElementById('volShiftInfo').textContent = `${loc.name} • ${shiftDef.name} (${shiftDef.timeString})`;
  document.getElementById('volDateInfo').textContent = document.getElementById('currentDateTitle').textContent;
  document.getElementById('volName').value = '';
  document.getElementById('volPhone').value = '';

  document.getElementById('volunteerModal').classList.add('active');
}

function closeVolunteerModal() {
  document.getElementById('volunteerModal').classList.remove('active');
}

function submitVolunteerRequest(e) {
  e.preventDefault();
  const locId = document.getElementById('volLocId').value;
  const shiftIdx = parseInt(document.getElementById('volShiftIdx').value);
  const name = document.getElementById('volName').value.trim();
  const phone = document.getElementById('volPhone').value.trim();

  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  const shift = normalizeShiftData(scheduleData[locId][shiftIdx]);
  
  // Assign to first open slot among 3 volunteers
  if (!shift.p1 || !shift.p1.name) {
    shift.p1 = { name, phone };
  } else if (!shift.p2 || !shift.p2.name) {
    shift.p2 = { name, phone };
  } else if (!shift.p3 || !shift.p3.name) {
    shift.p3 = { name, phone };
  } else {
    alert('This shift was just filled by other publishers (3/3 full).');
    closeVolunteerModal();
    renderScheduleGrid();
    return;
  }

  scheduleData[locId][shiftIdx] = shift;
  saveScheduleForDate(dateKey, scheduleData);
  closeVolunteerModal();
  renderScheduleGrid();
  showToast(`🎉 Scheduled ${name} for ${locId}!`);
}

function viewShiftDetails(locId, shiftIdx) {
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);
  const shift = normalizeShiftData(scheduleData[locId][shiftIdx]);

  const p1Text = shift.p1 && shift.p1.name ? `${shift.p1.name} (${shift.p1.phone || 'No phone'})` : 'Vacant';
  const p2Text = shift.p2 && shift.p2.name ? `${shift.p2.name} (${shift.p2.phone || 'No phone'})` : 'Vacant';
  const p3Text = shift.p3 && shift.p3.name ? `${shift.p3.name} (${shift.p3.phone || 'No phone'})` : 'Vacant';

  alert(`📋 SHIFT DETAILS (3 VOLUNTEERS):\n\n${loc.name}\n${shiftDef.name} (${shiftDef.timeString})\nLocation: ${loc.landmark}\n\n1. Driver/Lead: ${p1Text}\n2. Partner: ${p2Text}\n3. Partner: ${p3Text}\n\nStorage: ${loc.cartStorage}\nNotes: ${shift.notes || 'None'}`);
}

// -----------------------------------------------------------
// 8. MOBILE-FRIENDLY SUMMARY & VACANCY REPORT (CARD-BASED)
// -----------------------------------------------------------
function openSummaryReportModal() {
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  // Build simple table rows: one row per volunteer assigned to a shift
  const tableRows = [];

  LOCATIONS.forEach(loc => {
    const shifts = scheduleData[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];

    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      const volunteers = [];
      if (shift.p1 && shift.p1.name && shift.p1.name.trim()) volunteers.push(shift.p1.name.trim());
      if (shift.p2 && shift.p2.name && shift.p2.name.trim()) volunteers.push(shift.p2.name.trim());
      if (shift.p3 && shift.p3.name && shift.p3.name.trim()) volunteers.push(shift.p3.name.trim());

      // Add vacancy placeholders for open slots
      const openSlots = 3 - volunteers.length;
      for (let i = 0; i < openSlots; i++) {
        volunteers.push('<span style="color:#dc2626; font-style:italic;">— Vacant —</span>');
      }

      tableRows.push({
        location: loc.name,
        volunteers: volunteers.join('<br>'),
        date: dateTitle,
        time: shiftDef.timeString
      });
    });
  });

  // Clean simple table
  let html = `
    <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
      <table class="summary-report-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>Volunteers</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => `
            <tr>
              <td>${escapeHtml(row.location)}</td>
              <td>${row.volunteers}</td>
              <td>${escapeHtml(row.date)}</td>
              <td>${escapeHtml(row.time)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('summaryReportContent').innerHTML = html;
  document.getElementById('summaryReportModal').classList.add('active');
}

function closeSummaryReportModal() {
  document.getElementById('summaryReportModal').classList.remove('active');
}

function printSummaryReport() {
  window.print();
}

function copyVacancyListWhatsApp() {
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  let msg = `📢 *URGENT CART WITNESSING VACANCIES*\n📅 *${dateTitle}*\n_3 Volunteers per cart_\n\n`;

  let totalNeeded = 0;

  LOCATIONS.forEach(loc => {
    const shifts = scheduleData[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];
    const locVacancies = [];

    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      const p1Filled = shift.p1 && shift.p1.name && shift.p1.name.trim().length > 0;
      const p2Filled = shift.p2 && shift.p2.name && shift.p2.name.trim().length > 0;
      const p3Filled = shift.p3 && shift.p3.name && shift.p3.name.trim().length > 0;

      let filled = (p1Filled ? 1 : 0) + (p2Filled ? 1 : 0) + (p3Filled ? 1 : 0);
      let needed = 3 - filled;
      if (needed > 0) {
        totalNeeded += needed;
        locVacancies.push(`  • *${shiftDef.name}* (${shiftDef.timeString}): ⚠️ *${needed} ${needed === 1 ? 'volunteer' : 'volunteers'} needed*`);
      }
    });

    if (locVacancies.length > 0) {
      msg += `📍 *${loc.name}* (${loc.landmark})\n${locVacancies.join('\n')}\n\n`;
    }
  });

  if (totalNeeded === 0) {
    msg += `🎉 All shifts are fully staffed today! Thank you, everyone!`;
  } else {
    msg += `Total Open Slots: *${totalNeeded}*\n📞 If you can volunteer for any of these open slots, please sign up or reply to the Keyman!`;
  }

  navigator.clipboard.writeText(msg).then(() => {
    showToast('📋 Vacancies copied for WhatsApp!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('📋 Vacancies copied for WhatsApp!');
  });
}

// -----------------------------------------------------------
// 9. ACCESSIBILITY UTILITIES: READ ALOUD & WHATSAPP EXPORT
// -----------------------------------------------------------
function speakSchedule() {
  if (!('speechSynthesis' in window)) {
    alert('Speech Synthesis is not supported in this mobile browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  let text = `Cart witnessing schedule for ${dateTitle}. Three volunteers per cart. `;

  LOCATIONS.forEach(loc => {
    text += `${loc.name} at ${loc.landmark}. `;
    const locShifts = scheduleData[loc.id] || [];

    // Morning
    const mShift = normalizeShiftData(locShifts[0]);
    const mP1 = (mShift.p1 && mShift.p1.name) ? mShift.p1.name : 'Open slot';
    const mP2 = (mShift.p2 && mShift.p2.name) ? mShift.p2.name : 'Open slot';
    const mP3 = (mShift.p3 && mShift.p3.name) ? mShift.p3.name : 'Open slot';
    text += `Morning shift: Slot one: ${mP1}. Slot two: ${mP2}. Slot three: ${mP3}. `;

    // Afternoon
    const aShift = normalizeShiftData(locShifts[1]);
    const aP1 = (aShift.p1 && aShift.p1.name) ? aShift.p1.name : 'Open slot';
    const aP2 = (aShift.p2 && aShift.p2.name) ? aShift.p2.name : 'Open slot';
    const aP3 = (aShift.p3 && aShift.p3.name) ? aShift.p3.name : 'Open slot';
    text += `Afternoon shift: Slot one: ${aP1}. Slot two: ${aP2}. Slot three: ${aP3}. `;
  });

  speechSynthUtterance = new SpeechSynthesisUtterance(text);
  speechSynthUtterance.rate = 0.9;
  speechSynthUtterance.pitch = 1.0;

  const indicator = document.getElementById('ttsNotice');
  indicator.classList.add('active');

  speechSynthUtterance.onend = function() {
    indicator.classList.remove('active');
  };
  speechSynthUtterance.onerror = function() {
    indicator.classList.remove('active');
  };

  window.speechSynthesis.speak(speechSynthUtterance);
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  document.getElementById('ttsNotice').classList.remove('active');
}

function copyWhatsAppSummary() {
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  let msg = `🛒 *CART WITNESSING SCHEDULE*\n📅 *${dateTitle}*\n_3 Volunteers Per Cart_\n\n`;

  LOCATIONS.forEach(loc => {
    msg += `📍 *${loc.name}* (${loc.landmark})\n`;
    const shifts = scheduleData[loc.id] || [];

    // Shift 1 (Morning)
    const s1 = normalizeShiftData(shifts[0]);
    const s1P1 = (s1.p1 && s1.p1.name) ? s1.p1.name : '⚠️ OPEN';
    const s1P2 = (s1.p2 && s1.p2.name) ? s1.p2.name : '⚠️ OPEN';
    const s1P3 = (s1.p3 && s1.p3.name) ? s1.p3.name : '⚠️ OPEN';
    msg += `  🌅 06:30 - 08:00 AM:\n    1. ${s1P1}\n    2. ${s1P2}\n    3. ${s1P3}\n`;

    // Shift 2 (Afternoon)
    const s2 = normalizeShiftData(shifts[1]);
    const s2P1 = (s2.p1 && s2.p1.name) ? s2.p1.name : '⚠️ OPEN';
    const s2P2 = (s2.p2 && s2.p2.name) ? s2.p2.name : '⚠️ OPEN';
    const s2P3 = (s2.p3 && s2.p3.name) ? s2.p3.name : '⚠️ OPEN';
    msg += `  🌇 04:30 - 06:00 PM:\n    1. ${s2P1}\n    2. ${s2P2}\n    3. ${s2P3}\n\n`;
  });

  msg += `📞 To volunteer or swap, contact the Keyman.`;

  navigator.clipboard.writeText(msg).then(() => {
    showToast('📋 Schedule copied for WhatsApp!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('📋 Schedule copied for WhatsApp!');
  });
}

function resetToSampleData() {
  if (confirm('Reset today\'s schedule back to demo sample roster (3 volunteers per cart)?')) {
    const dateKey = formatDateKey(currentDate);
    const sample = generateSampleScheduleForDate(dateKey);
    saveScheduleForDate(dateKey, sample);
    closeKeymanModal();
    renderScheduleGrid();
    showToast('🔄 Restored 3-volunteer demo schedule');
  }
}

// -----------------------------------------------------------
// 10. TOAST NOTIFICATION UTILITY
// -----------------------------------------------------------
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastMessage');
  toastText.textContent = msg;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    hideToast();
  }, 3500);
}

function hideToast() {
  document.getElementById('toastNotification').classList.remove('show');
}

// -----------------------------------------------------------
// 11. INITIALIZATION
// -----------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initUserPreferences();
  updateDateDisplay();
  renderScheduleGrid();
});
