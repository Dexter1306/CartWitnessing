// -----------------------------------------------------------
// 1. DATA DEFINITIONS & DEFAULT ROSTER
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

// Generate Initial Sample Roster for demo
function generateSampleScheduleForDate(dateKey) {
  return {
    'L1': [
      {
        p1: { name: 'Bro. Samuel David', phone: '555-0143' },
        p2: { name: 'Bro. Thomas Wayne', phone: '555-0188' },
        notes: 'Take literature box #1. Cart is at station locker.'
      },
      {
        p1: { name: 'Sis. Martha Clark', phone: '555-0219' },
        p2: { name: '', phone: '' }, // Open slot
        notes: 'Need 1 afternoon partner. Handover key to Bro. Samuel.'
      }
    ],
    'L2': [
      {
        p1: { name: 'Sis. Sarah Johnson', phone: '555-0322' },
        p2: { name: 'Sis. Elizabeth Brown', phone: '555-0355' },
        notes: 'Market gets busy around 7:15 AM.'
      },
      {
        p1: { name: 'Bro. Robert Miller', phone: '555-0410' },
        p2: { name: 'Bro. James Wilson', phone: '555-0487' },
        notes: 'Please bring cart rain cover.'
      }
    ],
    'L3': [
      {
        p1: { name: 'Bro. Joseph Taylor', phone: '555-0551' },
        p2: { name: '', phone: '' }, // Open slot
        notes: 'Need a morning partner at Lake Walkway.'
      },
      {
        p1: { name: 'Sis. Jennifer Anderson', phone: '555-0604' },
        p2: { name: 'Sis. Linda Thomas', phone: '555-0629' },
        notes: 'Cart stored at park ranger desk.'
      }
    ],
    'L4': [
      {
        p1: { name: 'Bro. Michael Moore', phone: '555-0771' },
        p2: { name: 'Bro. Paul Jackson', phone: '555-0782' },
        notes: 'Peak ferry commute at 7:30 AM.'
      },
      {
        p1: { name: '', phone: '' }, // Empty shift
        p2: { name: '', phone: '' },
        notes: 'Shift currently vacant. Keyman looking for volunteers.'
      }
    ],
    'L5': [
      {
        p1: { name: 'Sis. Patricia Davis', phone: '555-0812' },
        p2: { name: 'Sis. Barbara White', phone: '555-0899' },
        notes: 'Library courtyard opens at 6:30 AM sharp.'
      },
      {
        p1: { name: 'Bro. Daniel Harris', phone: '555-0923' },
        p2: { name: 'Bro. Kevin Martin', phone: '555-0955' },
        notes: 'Both confirmed.'
      }
    ]
  };
}

// Schedule Storage Manager
function getScheduleForDate(dateKey) {
  const storageKey = `cart_schedule_${dateKey}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
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
  const storageKey = `cart_schedule_${dateKey}`;
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
  showToast(`Text size set to: ${level.toUpperCase()}`);
}

function toggleHighContrast() {
  const body = document.body;
  body.classList.toggle('ultra-contrast');
  const isUltra = body.classList.contains('ultra-contrast');
  localStorage.setItem('cart_app_contrast', isUltra ? 'ultra' : 'normal');

  const btn = document.getElementById('contrastToggleBtn');
  if (isUltra) {
    btn.textContent = '☀️ Standard Contrast';
    showToast('Ultra High-Contrast (Black & Yellow) Enabled');
  } else {
    btn.textContent = '👁️ High-Vis Contrast';
    showToast('Standard High Clarity Theme Enabled');
  }
}

function initUserPreferences() {
  const savedZoom = localStorage.getItem('cart_app_zoom') || 'normal';
  setFontZoom(savedZoom);

  const savedContrast = localStorage.getItem('cart_app_contrast');
  if (savedContrast === 'ultra') {
    document.body.classList.add('ultra-contrast');
    document.getElementById('contrastToggleBtn').textContent = '☀️ Standard Contrast';
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  showToast("Jumped to Today's Schedule");
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
// 4. SCHEDULE GRID BUILDER
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
      { p1: { name: '', phone: '' }, p2: { name: '', phone: '' }, notes: '' },
      { p1: { name: '', phone: '' }, p2: { name: '', phone: '' }, notes: '' }
    ];

    // Create Location Card
    const card = document.createElement('article');
    card.className = 'location-card';
    card.setAttribute('aria-labelledby', `heading-${loc.id}`);

    // Location Header
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
      <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span aria-hidden="true">📦</span>
        <span>${loc.cartStorage}</span>
      </div>
    `;
    card.appendChild(header);

    // Shifts container
    const shiftsGrid = document.createElement('div');
    shiftsGrid.className = 'shifts-container';

    SHIFT_TIMES.forEach(shiftDef => {
      const shiftData = locShifts[shiftDef.id] || { p1: { name: '', phone: '' }, p2: { name: '', phone: '' }, notes: '' };
      
      totalSlots += 2;
      const p1Filled = shiftData.p1 && shiftData.p1.name && shiftData.p1.name.trim().length > 0;
      const p2Filled = shiftData.p2 && shiftData.p2.name && shiftData.p2.name.trim().length > 0;
      
      let countFilled = 0;
      if (p1Filled) countFilled++;
      if (p2Filled) countFilled++;

      filledSlots += countFilled;
      openSlots += (2 - countFilled);

      // Status Badge details
      let statusBadgeHtml = '';
      if (countFilled === 2) {
        statusBadgeHtml = `<span class="status-badge full">✔️ Fully Staffed (2/2)</span>`;
      } else if (countFilled === 1) {
        statusBadgeHtml = `<span class="status-badge need-one">⚠️ 1 Partner Needed</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge empty">⭕ Open Shift (2 Needed)</span>`;
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

          <!-- Publisher Slots -->
          <div class="publishers-list" role="list" aria-label="Assigned volunteers">
            <!-- Slot 1 -->
            <div class="publisher-slot" role="listitem">
              <div>
                <div class="slot-role">Publisher 1 (Driver / Lead)</div>
                ${p1Filled ? `<div class="slot-name">${escapeHtml(shiftData.p1.name)}</div>` : `<div class="slot-empty-text">⚠️ Slot Open</div>`}
              </div>
              ${p1Filled && shiftData.p1.phone ? `
                <a href="tel:${escapeHtml(shiftData.p1.phone)}" class="slot-phone" aria-label="Call ${escapeHtml(shiftData.p1.name)}">
                  📞 ${escapeHtml(shiftData.p1.phone)}
                </a>
              ` : ''}
            </div>

            <!-- Slot 2 -->
            <div class="publisher-slot" role="listitem">
              <div>
                <div class="slot-role">Publisher 2 (Cart Partner)</div>
                ${p2Filled ? `<div class="slot-name">${escapeHtml(shiftData.p2.name)}</div>` : `<div class="slot-empty-text">⚠️ Slot Open</div>`}
              </div>
              ${p2Filled && shiftData.p2.phone ? `
                <a href="tel:${escapeHtml(shiftData.p2.phone)}" class="slot-phone" aria-label="Call ${escapeHtml(shiftData.p2.name)}">
                  📞 ${escapeHtml(shiftData.p2.phone)}
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

        <!-- Shift Actions -->
        <div class="shift-action-row">
          ${isKeymanLoggedIn ? `
            <button class="btn btn-warning" onclick="openShiftEditor('${loc.id}', ${shiftDef.id})" aria-label="Keyman: Edit ${loc.id} ${shiftDef.name}">
              ✏️ Edit Shift
            </button>
          ` : `
            ${countFilled < 2 ? `
              <button class="btn btn-success" onclick="openVolunteerModal('${loc.id}', ${shiftDef.id})" aria-label="Volunteer for ${loc.id} ${shiftDef.name}">
                🙋 I Can Volunteer!
              </button>
            ` : `
              <button class="btn btn-outline" onclick="viewShiftDetails('${loc.id}', ${shiftDef.id})" aria-label="View Shift Details">
                📋 View Details
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
// 5. KEYMAN AUTHENTICATION (Elderly-Friendly PIN Pad)
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
      // Automatic verify on 4th digit for elderly ease
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
    showToast('🔓 Welcome, Keyman! Edit Mode is now Active.');
  } else {
    clearPin();
    showToast('❌ Incorrect PIN. Please try again (Hint: 1234).');
  }
}

function logoutKeyman() {
  isKeymanLoggedIn = false;
  localStorage.removeItem('cart_app_keyman_auth');
  updateKeymanUI();
  closeKeymanModal();
  renderScheduleGrid();
  showToast('🔒 Logged Out. Returned to Viewer Mode.');
}

function updateKeymanUI() {
  const statusBadge = document.getElementById('keymanStatusDisplay');
  const btnText = document.getElementById('keymanBtnText');
  const btn = document.getElementById('keymanActionBtn');

  if (isKeymanLoggedIn) {
    statusBadge.className = 'keyman-status-badge logged-in';
    statusBadge.innerHTML = '<span>⭐</span><span>Keyman Edit Mode Active</span>';
    btnText.textContent = 'Keyman Settings / Logout';
    btn.classList.add('btn-warning');
    btn.classList.remove('btn-keyman');
  } else {
    statusBadge.className = 'keyman-status-badge viewer';
    statusBadge.innerHTML = '<span>👀</span><span>Viewer Mode (Read-Only)</span>';
    btnText.textContent = 'Keyman Login (Edit Mode)';
    btn.classList.add('btn-keyman');
    btn.classList.remove('btn-warning');
  }
}

// -----------------------------------------------------------
// 6. SHIFT EDITOR (FOR KEYMAN EDITING ENTRIES)
// -----------------------------------------------------------
function openShiftEditor(locId, shiftIdx) {
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];
  const currentShift = (scheduleData[locId] && scheduleData[locId][shiftIdx]) || {
    p1: { name: '', phone: '' },
    p2: { name: '', phone: '' },
    notes: ''
  };

  document.getElementById('editLocationId').value = locId;
  document.getElementById('editShiftIndex').value = shiftIdx;
  document.getElementById('editorShiftHeader').textContent = `${loc.name} • ${shiftDef.name} (${shiftDef.timeString})`;
  document.getElementById('editorShiftDate').textContent = document.getElementById('currentDateTitle').textContent;

  document.getElementById('editPub1Name').value = currentShift.p1 ? currentShift.p1.name : '';
  document.getElementById('editPub1Phone').value = currentShift.p1 ? currentShift.p1.phone : '';
  document.getElementById('editPub2Name').value = currentShift.p2 ? currentShift.p2.name : '';
  document.getElementById('editPub2Phone').value = currentShift.p2 ? currentShift.p2.phone : '';
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
    scheduleData[locId] = [
      { p1: { name: '', phone: '' }, p2: { name: '', phone: '' }, notes: '' },
      { p1: { name: '', phone: '' }, p2: { name: '', phone: '' }, notes: '' }
    ];
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
    notes: document.getElementById('editShiftNotes').value.trim()
  };

  saveScheduleForDate(dateKey, scheduleData);
  closeShiftEditorModal();
  renderScheduleGrid();
  showToast(`✅ Updated ${locId} shift assignment!`);
}

function clearCurrentShift() {
  if (confirm('Are you sure you want to clear both volunteers and mark this shift as Open?')) {
    document.getElementById('editPub1Name').value = '';
    document.getElementById('editPub1Phone').value = '';
    document.getElementById('editPub2Name').value = '';
    document.getElementById('editPub2Phone').value = '';
    document.getElementById('editShiftNotes').value = '';
  }
}

// -----------------------------------------------------------
// 7. VOLUNTEER REGISTRATION MODAL (FOR PUBLISHERS)
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

  const shift = scheduleData[locId][shiftIdx];
  // Assign to first open slot
  if (!shift.p1 || !shift.p1.name) {
    shift.p1 = { name, phone };
  } else if (!shift.p2 || !shift.p2.name) {
    shift.p2 = { name, phone };
  } else {
    alert('This shift was just filled by another publisher.');
    closeVolunteerModal();
    renderScheduleGrid();
    return;
  }

  saveScheduleForDate(dateKey, scheduleData);
  closeVolunteerModal();
  renderScheduleGrid();
  showToast(`🎉 Thank you, ${name}! You are scheduled for ${locId}.`);
}

function viewShiftDetails(locId, shiftIdx) {
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);
  const shift = scheduleData[locId][shiftIdx];

  const p1Text = shift.p1 && shift.p1.name ? `${shift.p1.name} (${shift.p1.phone || 'No phone'})` : 'Vacant';
  const p2Text = shift.p2 && shift.p2.name ? `${shift.p2.name} (${shift.p2.phone || 'No phone'})` : 'Vacant';

  alert(`📋 SHIFT DETAILS:\n\n${loc.name}\n${shiftDef.name} (${shiftDef.timeString})\nLocation: ${loc.landmark}\n\nPublisher 1: ${p1Text}\nPublisher 2: ${p2Text}\n\nStorage: ${loc.cartStorage}\nNotes: ${shift.notes || 'None'}`);
}

// -----------------------------------------------------------
// 8. ACCESSIBILITY UTILITIES: READ ALOUD & WHATSAPP EXPORT
// -----------------------------------------------------------
function speakSchedule() {
  if (!('speechSynthesis' in window)) {
    alert('Speech Synthesis is not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  let text = `Cart witnessing schedule for ${dateTitle}. `;

  LOCATIONS.forEach(loc => {
    text += `${loc.name} at ${loc.landmark}. `;
    const locShifts = scheduleData[loc.id] || [];

    // Morning
    const mShift = locShifts[0];
    const mP1 = (mShift && mShift.p1 && mShift.p1.name) ? mShift.p1.name : 'Open slot';
    const mP2 = (mShift && mShift.p2 && mShift.p2.name) ? mShift.p2.name : 'Open slot';
    text += `Morning shift, six thirty to eight AM: ${mP1} and ${mP2}. `;

    // Afternoon
    const aShift = locShifts[1];
    const aP1 = (aShift && aShift.p1 && aShift.p1.name) ? aShift.p1.name : 'Open slot';
    const aP2 = (aShift && aShift.p2 && aShift.p2.name) ? aShift.p2.name : 'Open slot';
    text += `Afternoon shift, four thirty to six PM: ${aP1} and ${aP2}. `;
  });

  speechSynthUtterance = new SpeechSynthesisUtterance(text);
  speechSynthUtterance.rate = 0.9; // Slightly slower for elderly clarity
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

  let msg = `🛒 *CART WITNESSING SCHEDULE*\n📅 *${dateTitle}*\n\n`;

  LOCATIONS.forEach(loc => {
    msg += `📍 *${loc.name}* (${loc.landmark})\n`;
    const shifts = scheduleData[loc.id] || [];

    // Shift 1
    const s1 = shifts[0] || {};
    const s1P1 = (s1.p1 && s1.p1.name) ? s1.p1.name : '⚠️ NEED VOLUNTEER';
    const s1P2 = (s1.p2 && s1.p2.name) ? s1.p2.name : '⚠️ NEED VOLUNTEER';
    msg += `  🌅 06:30 AM - 08:00 AM: ${s1P1} & ${s1P2}\n`;

    // Shift 2
    const s2 = shifts[1] || {};
    const s2P1 = (s2.p1 && s2.p1.name) ? s2.p1.name : '⚠️ NEED VOLUNTEER';
    const s2P2 = (s2.p2 && s2.p2.name) ? s2.p2.name : '⚠️ NEED VOLUNTEER';
    msg += `  🌇 04:30 PM - 06:00 PM: ${s2P1} & ${s2P2}\n\n`;
  });

  msg += `📞 To volunteer or swap, contact the Keyman.`;

  navigator.clipboard.writeText(msg).then(() => {
    showToast('📋 Schedule copied! Ready to paste into WhatsApp.');
  }).catch(err => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('📋 Schedule copied! Ready to paste into WhatsApp.');
  });
}

function resetToSampleData() {
  if (confirm('Reset today\'s schedule back to the demo sample roster?')) {
    const dateKey = formatDateKey(currentDate);
    const sample = generateSampleScheduleForDate(dateKey);
    saveScheduleForDate(dateKey, sample);
    closeKeymanModal();
    renderScheduleGrid();
    showToast('🔄 Restored default sample schedule.');
  }
}

// -----------------------------------------------------------
// 9. TOAST NOTIFICATION UTILITY
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
  }, 4000);
}

function hideToast() {
  document.getElementById('toastNotification').classList.remove('show');
}

// -----------------------------------------------------------
// 10. INITIALIZATION
// -----------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initUserPreferences();
  updateDateDisplay();
  renderScheduleGrid();
});
