// =========================================================================
// CART WITNESSING APP — COMPLETE SCHEDULE SYSTEM
// 5 Locations · 2 Shifts · 3 Volunteers per Cart
// =========================================================================

// -----------------------------------------------------------
// 1. DATA DEFINITIONS & DEFAULT ROSTER
// -----------------------------------------------------------
const LOCATIONS = [
  { id: 'L1', name: 'Location 1 (Balwarte)', landmark: 'Balwarte', cartStorage: 'Cart stored at Balwarte' },
  { id: 'L2', name: 'Location 2 (Gesen)', landmark: 'Gesen', cartStorage: 'Cart stored at Gesen' },
  { id: 'L3', name: 'Location 3 (Kanlaon / Villarica Pawnshop)', landmark: 'Kanlaon / Villarica Pawnshop', cartStorage: 'Cart stored at Kanlaon / Villarica Pawnshop' },
  { id: 'L4', name: 'Location 4 (Multipurpose / Brgy. Outpost sa Tapat ng Metroplaza)', landmark: 'Multipurpose / Brgy. Outpost sa Tapat ng Metroplaza', cartStorage: 'Cart stored at Multipurpose / Brgy. Outpost' },
  { id: 'L5', name: 'Location 5 (Phase 5 / 7-Eleven)', landmark: 'Phase 5 / 7-Eleven', cartStorage: 'Cart stored at Phase 5 / 7-Eleven' }
];

const SHIFT_TIMES = [
  { id: 0, name: 'Shift 1: Morning', timeString: '06:30 AM – 08:30 AM', icon: '🌅', className: 'morning' },
  { id: 1, name: 'Shift 2: Afternoon', timeString: '04:30 PM – 06:00 PM', icon: '🌇', className: 'afternoon' }
];

const DEFAULT_KEYMAN_PIN = '1234';

// State
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let isKeymanLoggedIn = false;
let currentFilter = 'ALL';
let enteredPin = '';
let speechSynthUtterance = null;

// -----------------------------------------------------------
// 2. HELPER UTILITIES
// -----------------------------------------------------------
function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateTitle(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function normalizeShiftData(raw) {
  if (!raw) return { p1:{name:'',phone:''}, p2:{name:'',phone:''}, p3:{name:'',phone:''}, notes:'' };
  return {
    p1: { name: (raw.p1 && raw.p1.name) ? raw.p1.name : '', phone: '' },
    p2: { name: (raw.p2 && raw.p2.name) ? raw.p2.name : '', phone: '' },
    p3: { name: (raw.p3 && raw.p3.name) ? raw.p3.name : '', phone: '' },
    notes: raw.notes || ''
  };
}

// -----------------------------------------------------------
// 3. SCHEDULE STORAGE (localStorage)
// -----------------------------------------------------------
function generateSampleScheduleForDate(dateKey) {
  return {
    'L1': [
      { p1:{name:'Bro. Samuel David',phone:''}, p2:{name:'Bro. Thomas Wayne',phone:''}, p3:{name:'Sis. Martha Clark',phone:''}, notes:'Take literature box #1.' },
      { p1:{name:'Sis. Sarah Johnson',phone:''}, p2:{name:'Sis. Elizabeth Brown',phone:''}, p3:{name:'',phone:''}, notes:'Need 1 afternoon partner.' }
    ],
    'L2': [
      { p1:{name:'Bro. Robert Miller',phone:''}, p2:{name:'Bro. James Wilson',phone:''}, p3:{name:'Bro. Daniel Harris',phone:''}, notes:'Market busy around 7:15 AM.' },
      { p1:{name:'Sis. Patricia Davis',phone:''}, p2:{name:'',phone:''}, p3:{name:'',phone:''}, notes:'Need 2 afternoon partners.' }
    ],
    'L3': [
      { p1:{name:'Bro. Joseph Taylor',phone:''}, p2:{name:'Bro. Michael Moore',phone:''}, p3:{name:'Bro. Kevin Martin',phone:''}, notes:'Morning exercise route.' },
      { p1:{name:'Sis. Jennifer Anderson',phone:''}, p2:{name:'Sis. Linda Thomas',phone:''}, p3:{name:'Sis. Barbara White',phone:''}, notes:'Cart at park ranger desk.' }
    ],
    'L4': [
      { p1:{name:'Bro. Paul Jackson',phone:''}, p2:{name:'Bro. David Martinez',phone:''}, p3:{name:'',phone:''}, notes:'Peak ferry at 7:30 AM.' },
      { p1:{name:'',phone:''}, p2:{name:'',phone:''}, p3:{name:'',phone:''}, notes:'Full afternoon shift open.' }
    ],
    'L5': [
      { p1:{name:'Sis. Ruth Evans',phone:''}, p2:{name:'Sis. Mary Jenkins',phone:''}, p3:{name:'Sis. Deborah Adams',phone:''}, notes:'Library opens at 6:30 AM.' },
      { p1:{name:'Bro. Anthony Scott',phone:''}, p2:{name:'Bro. Charles Perez',phone:''}, p3:{name:'Bro. George Hall',phone:''}, notes:'Plaza evening crowd.' }
    ]
  };
}

function getScheduleForDate(dateKey) {
  const storageKey = `cart_schedule_v2_${dateKey}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      LOCATIONS.forEach(loc => {
        if (!parsed[loc.id]) parsed[loc.id] = [normalizeShiftData(null), normalizeShiftData(null)];
        else {
          parsed[loc.id] = parsed[loc.id].map(shift => normalizeShiftData(shift));
        }
      });
      return parsed;
    } catch(e) { /* fall through */ }
  }
  return generateSampleScheduleForDate(dateKey);
}

function saveScheduleForDate(dateKey, data) {
  localStorage.setItem(`cart_schedule_v2_${dateKey}`, JSON.stringify(data));
}

// -----------------------------------------------------------
// 4. DATE NAVIGATION
// -----------------------------------------------------------
function updateDateDisplay() {
  const title = formatDateTitle(currentDate);
  document.getElementById('currentDateTitle').textContent = title;

  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((currentDate - today) / 86400000);
  let subtitle = "Today's Schedule";
  if (diff === 1) subtitle = "Tomorrow's Schedule";
  else if (diff === -1) subtitle = "Yesterday's Schedule";
  else if (diff > 1) subtitle = `${diff} days from now`;
  else if (diff < -1) subtitle = `${Math.abs(diff)} days ago`;
  document.getElementById('currentDateSubtitle').textContent = subtitle;

  document.getElementById('directDatePicker').value = formatDateKey(currentDate);
  renderSchedule();
}

function changeDateOffset(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  updateDateDisplay();
}

function goToToday() {
  currentDate = new Date(); currentDate.setHours(0,0,0,0);
  updateDateDisplay();
}

function onDirectDateSelected(val) {
  if (!val) return;
  const parts = val.split('-');
  currentDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  currentDate.setHours(0,0,0,0);
  updateDateDisplay();
}

// -----------------------------------------------------------
// 5. MAIN SCHEDULE RENDERER
// -----------------------------------------------------------
function renderSchedule() {
  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  const grid = document.getElementById('scheduleGrid');
  grid.innerHTML = '';

  let totalAssigned = 0, totalSlots = 30;

  LOCATIONS.forEach(loc => {
    if (currentFilter !== 'ALL' && currentFilter !== loc.id) return;

    const card = document.createElement('div');
    card.className = 'location-card';
    card.id = `card-${loc.id}`;

    let cardHTML = `
      <div class="location-header">
        <div class="location-title-box">
          <span class="location-tag">${escapeHtml(loc.id)}</span>
          <span class="location-name">${escapeHtml(loc.name)}</span>
        </div>
        <div class="location-landmark">📍 ${escapeHtml(loc.landmark)}</div>
      </div>`;

    const shifts = data[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];

    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      const slots = [
        { data: shift.p1, role: 'Slot 1 · Lead / Driver', num: 1 },
        { data: shift.p2, role: 'Slot 2 · Cart Partner', num: 2 },
        { data: shift.p3, role: 'Slot 3 · Cart Partner', num: 3 }
      ];

      let filledCount = 0;
      let slotsHTML = '';

      slots.forEach(s => {
        const filled = s.data && s.data.name && s.data.name.trim().length > 0;
        if (filled) {
          filledCount++;
          totalAssigned++;
          slotsHTML += `
            <div class="slot-row slot-filled">
              <div class="slot-info">
                <div class="slot-name">${escapeHtml(s.data.name)}</div>
                <div class="slot-role">${s.role}</div>
              </div>
            </div>`;
        } else {
          slotsHTML += `
            <div class="slot-row slot-empty" onclick="${isKeymanLoggedIn ? `openShiftEditorModal('${loc.id}', ${shiftDef.id})` : `openVolunteerModal('${loc.id}', ${shiftDef.id})`}">
              <div class="slot-info">
                <div class="slot-name empty-slot-text">⚠️ Open — Tap to ${isKeymanLoggedIn ? 'assign' : 'volunteer'}</div>
                <div class="slot-role">${s.role}</div>
              </div>
            </div>`;
        }
      });

      const needed = 3 - filledCount;
      const statusClass = needed === 0 ? 'shift-status-full' : needed >= 2 ? 'shift-status-critical' : 'shift-status-partial';
      const statusText = needed === 0 ? '✅ Fully Staffed' : `⚠️ ${needed} Open`;

      cardHTML += `
        <div class="shift-block ${shiftDef.className}">
          <div class="shift-block-header">
            <div>
              <span class="shift-icon">${shiftDef.icon}</span>
              <span class="shift-label">${escapeHtml(shiftDef.name)}</span>
            </div>
            <div>
              <span class="shift-time-badge">${escapeHtml(shiftDef.timeString)}</span>
              <span class="shift-status-badge ${statusClass}">${statusText}</span>
            </div>
          </div>
          <div class="shift-slots">${slotsHTML}</div>
          ${shift.notes ? `<div class="shift-notes">📝 ${escapeHtml(shift.notes)}</div>` : ''}
          ${isKeymanLoggedIn ? `<button class="btn btn-sm btn-primary shift-edit-btn" onclick="openShiftEditorModal('${loc.id}', ${shiftDef.id})">✏️ Edit Shift</button>` : ''}
        </div>`;
    });

    card.innerHTML = cardHTML;
    grid.appendChild(card);
  });

  // Update stats
  document.getElementById('statConfirmedSlots').textContent = `${totalAssigned} / ${totalSlots}`;
  document.getElementById('statNeededSlots').textContent = totalSlots - totalAssigned;
}

// -----------------------------------------------------------
// 6. LOCATION FILTER
// -----------------------------------------------------------
function filterLocation(locId) {
  currentFilter = locId;
  document.querySelectorAll('.location-chip').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`filterBtn${locId}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderSchedule();
}

// -----------------------------------------------------------
// 7. KEYMAN AUTHENTICATION
// -----------------------------------------------------------
function openKeymanAuthModal() {
  if (isKeymanLoggedIn) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('loggedInView').style.display = 'block';
  } else {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('loggedInView').style.display = 'none';
    clearPin();
  }
  document.getElementById('keymanModal').classList.add('active');
}

function closeKeymanModal() {
  document.getElementById('keymanModal').classList.remove('active');
  clearPin();
}

function pressPinDigit(digit) {
  if (enteredPin.length >= 4) return;
  enteredPin += digit;
  updatePinDots();
  if (enteredPin.length === 4) setTimeout(() => submitPinLogin(), 200);
}

function backspacePin() {
  enteredPin = enteredPin.slice(0, -1);
  updatePinDots();
}

function clearPin() {
  enteredPin = '';
  updatePinDots();
}

function updatePinDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`pDot${i}`);
    if (dot) dot.classList.toggle('filled', i <= enteredPin.length);
  }
}

function submitPinLogin() {
  if (enteredPin === DEFAULT_KEYMAN_PIN) {
    isKeymanLoggedIn = true;
    document.getElementById('keymanBtnText').textContent = 'Keyman ⭐';
    document.getElementById('keymanActionBtn').classList.add('active');
    closeKeymanModal();
    showToast('🔓 Keyman mode activated! You can now edit all shifts.');
    renderSchedule();
  } else {
    showToast('❌ Incorrect PIN. Try again.');
    clearPin();
  }
}

function logoutKeyman() {
  isKeymanLoggedIn = false;
  document.getElementById('keymanBtnText').textContent = 'Keyman';
  document.getElementById('keymanActionBtn').classList.remove('active');
  closeKeymanModal();
  showToast('🚪 Logged out. Viewer mode active.');
  renderSchedule();
}

function resetToSampleData() {
  const dateKey = formatDateKey(currentDate);
  localStorage.removeItem(`cart_schedule_v2_${dateKey}`);
  closeKeymanModal();
  showToast('🔄 Schedule reset to demo data.');
  renderSchedule();
}

// -----------------------------------------------------------
// 8. SHIFT EDITOR MODAL (Keyman Only)
// -----------------------------------------------------------
function openShiftEditorModal(locId, shiftIdx) {
  if (!isKeymanLoggedIn) return;
  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  const shifts = data[locId] || [normalizeShiftData(null), normalizeShiftData(null)];
  const shift = normalizeShiftData(shifts[shiftIdx]);
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];

  document.getElementById('editLocationId').value = locId;
  document.getElementById('editShiftIndex').value = shiftIdx;
  document.getElementById('editorShiftHeader').innerHTML = `${escapeHtml(loc.name)} &bull; ${escapeHtml(shiftDef.timeString)}`;
  document.getElementById('editorShiftDate').textContent = formatDateTitle(currentDate);
  document.getElementById('editPub1Name').value = shift.p1.name || '';
  document.getElementById('editPub2Name').value = shift.p2.name || '';
  document.getElementById('editPub3Name').value = shift.p3.name || '';
  document.getElementById('editShiftNotes').value = shift.notes || '';
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
  const data = getScheduleForDate(dateKey);
  if (!data[locId]) data[locId] = [normalizeShiftData(null), normalizeShiftData(null)];

  data[locId][shiftIdx] = {
    p1: { name: document.getElementById('editPub1Name').value.trim(), phone: '' },
    p2: { name: document.getElementById('editPub2Name').value.trim(), phone: '' },
    p3: { name: document.getElementById('editPub3Name').value.trim(), phone: '' },
    notes: document.getElementById('editShiftNotes').value.trim()
  };

  saveScheduleForDate(dateKey, data);
  closeShiftEditorModal();
  showToast('💾 Shift saved successfully!');
  renderSchedule();
}

function clearCurrentShift() {
  document.getElementById('editPub1Name').value = '';
  document.getElementById('editPub2Name').value = '';
  document.getElementById('editPub3Name').value = '';
  document.getElementById('editShiftNotes').value = '';
  showToast('🧹 Shift fields cleared.');
}

// -----------------------------------------------------------
// 9. VOLUNTEER SIGN-UP MODAL
// -----------------------------------------------------------
function openVolunteerModal(locId, shiftIdx) {
  const loc = LOCATIONS.find(l => l.id === locId);
  const shiftDef = SHIFT_TIMES[shiftIdx];
  document.getElementById('volLocId').value = locId;
  document.getElementById('volShiftIdx').value = shiftIdx;
  document.getElementById('volShiftInfo').innerHTML = `${escapeHtml(loc.name)} &bull; ${escapeHtml(shiftDef.timeString)}`;
  document.getElementById('volDateInfo').textContent = formatDateTitle(currentDate);
  document.getElementById('volName').value = '';
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
  if (!name) { showToast('⚠️ Please enter your name.'); return; }

  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  if (!data[locId]) data[locId] = [normalizeShiftData(null), normalizeShiftData(null)];
  const shift = normalizeShiftData(data[locId][shiftIdx]);

  // Fill the first empty slot
  if (!shift.p1.name || !shift.p1.name.trim()) { shift.p1 = {name, phone: ''}; }
  else if (!shift.p2.name || !shift.p2.name.trim()) { shift.p2 = {name, phone: ''}; }
  else if (!shift.p3.name || !shift.p3.name.trim()) { shift.p3 = {name, phone: ''}; }
  else { showToast('❌ All 3 slots are full for this shift.'); return; }

  data[locId][shiftIdx] = shift;
  saveScheduleForDate(dateKey, data);
  closeVolunteerModal();
  showToast(`✅ Thank you, ${name}! You're signed up.`);
  renderSchedule();
}

// -----------------------------------------------------------
// 10. SUMMARY & VACANCY REPORT (Cart Witnessing Table Form + Mobile-Friendly PNG)
// -----------------------------------------------------------
function openSummaryReportModal() {
  const dateKey = formatDateKey(currentDate);
  const scheduleData = getScheduleForDate(dateKey);

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFormatted = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fullDateHeader = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  let totalFilled = 0;
  let totalVacant = 0;
  let tbodyHTML = '';

  LOCATIONS.forEach((loc, locIdx) => {
    const shifts = scheduleData[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];
    const bgClass = locIdx % 2 === 0 ? 'srt-loc-bg-light' : 'srt-loc-bg-alt';

    // Morning shift (idx 0)
    const mDef = SHIFT_TIMES[0];
    const mShift = normalizeShiftData(shifts[mDef.id]);
    const mp1 = (mShift.p1 && mShift.p1.name) ? mShift.p1.name.trim() : '';
    const mp2 = (mShift.p2 && mShift.p2.name) ? mShift.p2.name.trim() : '';
    const mp3 = (mShift.p3 && mShift.p3.name) ? mShift.p3.name.trim() : '';
    const mFilled = (mp1 ? 1 : 0) + (mp2 ? 1 : 0) + (mp3 ? 1 : 0);
    const mVacant = 3 - mFilled;
    totalFilled += mFilled;
    totalVacant += mVacant;

    let mStatusHtml = '';
    if (mVacant === 0) {
      mStatusHtml = '<span class="srt-status-pill srt-status-filled">✅ Staffed</span>';
    } else if (mVacant === 1) {
      mStatusHtml = '<span class="srt-status-pill srt-status-vacant-1">⚠️ 1 Needed</span>';
    } else if (mVacant === 2) {
      mStatusHtml = '<span class="srt-status-pill srt-status-vacant-2">⚠️ 2 Needed</span>';
    } else {
      mStatusHtml = '<span class="srt-status-pill srt-status-vacant-3">🚨 3 Needed</span>';
    }

    // Afternoon shift (idx 1)
    const aDef = SHIFT_TIMES[1];
    const aShift = normalizeShiftData(shifts[aDef.id]);
    const ap1 = (aShift.p1 && aShift.p1.name) ? aShift.p1.name.trim() : '';
    const ap2 = (aShift.p2 && aShift.p2.name) ? aShift.p2.name.trim() : '';
    const ap3 = (aShift.p3 && aShift.p3.name) ? aShift.p3.name.trim() : '';
    const aFilled = (ap1 ? 1 : 0) + (ap2 ? 1 : 0) + (ap3 ? 1 : 0);
    const aVacant = 3 - aFilled;
    totalFilled += aFilled;
    totalVacant += aVacant;

    let aStatusHtml = '';
    if (aVacant === 0) {
      aStatusHtml = '<span class="srt-status-pill srt-status-filled">✅ Staffed</span>';
    } else if (aVacant === 1) {
      aStatusHtml = '<span class="srt-status-pill srt-status-vacant-1">⚠️ 1 Needed</span>';
    } else if (aVacant === 2) {
      aStatusHtml = '<span class="srt-status-pill srt-status-vacant-2">⚠️ 2 Needed</span>';
    } else {
      aStatusHtml = '<span class="srt-status-pill srt-status-vacant-3">🚨 3 Needed</span>';
    }

    tbodyHTML += `
      <tr class="srt-row srt-location-row ${bgClass}">
        <td class="srt-loc-cell">
          <div class="srt-loc-name">📍 ${escapeHtml(loc.name)}</div>
          ${loc.landmark && loc.landmark !== loc.name && !loc.name.includes(`(${loc.landmark})`) ? `<div class="srt-loc-landmark">${escapeHtml(loc.landmark)}</div>` : ''}
        </td>
        <td class="srt-compound-cell srt-time-compound">
          <div class="srt-sub-row srt-sub-morning">
            <div class="srt-shift-badge srt-shift-morning">${mDef.icon} ${escapeHtml(mDef.name)}</div>
            <div class="srt-shift-hours"><span class="srt-time-icon">⏰</span><span class="srt-time-text">${escapeHtml(mDef.timeString.replace(/–/g, '-'))}</span></div>
          </div>
          <div class="srt-sub-row srt-sub-afternoon">
            <div class="srt-shift-badge srt-shift-afternoon">${aDef.icon} ${escapeHtml(aDef.name)}</div>
            <div class="srt-shift-hours"><span class="srt-time-icon">⏰</span><span class="srt-time-text">${escapeHtml(aDef.timeString.replace(/–/g, '-'))}</span></div>
          </div>
        </td>
        <td class="srt-compound-cell srt-vol-compound">
          <div class="srt-sub-row srt-sub-morning">
            <div class="srt-vol-list">
              <div class="srt-slot-row ${mp1 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">1</span>
                <span class="srt-slot-name">${mp1 ? escapeHtml(mp1) : '<em>— Vacant Slot —</em>'}</span>
              </div>
              <div class="srt-slot-row ${mp2 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">2</span>
                <span class="srt-slot-name">${mp2 ? escapeHtml(mp2) : '<em>— Vacant Slot —</em>'}</span>
              </div>
              <div class="srt-slot-row ${mp3 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">3</span>
                <span class="srt-slot-name">${mp3 ? escapeHtml(mp3) : '<em>— Vacant Slot —</em>'}</span>
              </div>
            </div>
          </div>
          <div class="srt-sub-row srt-sub-afternoon">
            <div class="srt-vol-list">
              <div class="srt-slot-row ${ap1 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">1</span>
                <span class="srt-slot-name">${ap1 ? escapeHtml(ap1) : '<em>— Vacant Slot —</em>'}</span>
              </div>
              <div class="srt-slot-row ${ap2 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">2</span>
                <span class="srt-slot-name">${ap2 ? escapeHtml(ap2) : '<em>— Vacant Slot —</em>'}</span>
              </div>
              <div class="srt-slot-row ${ap3 ? 'is-filled' : 'is-vacant'}">
                <span class="srt-slot-num">3</span>
                <span class="srt-slot-name">${ap3 ? escapeHtml(ap3) : '<em>— Vacant Slot —</em>'}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="srt-compound-cell srt-status-compound">
          <div class="srt-sub-row srt-sub-morning">
            ${mStatusHtml}
          </div>
          <div class="srt-sub-row srt-sub-afternoon">
            ${aStatusHtml}
          </div>
        </td>
      </tr>`;
  });

  let html = `
    <div class="srt-scroll-hint">👈 Swipe left/right to view full table form 👉</div>
    <div id="reportCaptureZone" class="srt-capture-zone">
      <!-- 1. Form Header -->
      <div class="srt-form-header">
        <div class="srt-form-top">
          <div class="srt-form-branding">
            <div>
              <div class="srt-form-title">CART WITNESSING ROSTER &amp; VACANCY REPORT</div>
              <div class="srt-form-subtitle">Official Congregation Schedule Form &bull; 3 Volunteers / Cart</div>
            </div>
          </div>
          <div class="srt-form-badge">5 LOCATIONS</div>
        </div>
        <div class="srt-form-meta-bar">
          <div class="srt-meta-date">📅 <strong>${escapeHtml(fullDateHeader)}</strong></div>
          <div class="srt-meta-chips">
            <span class="srt-chip srt-chip-total">Slots: 30</span>
            <span class="srt-chip srt-chip-filled">Filled: ${totalFilled}</span>
            <span class="srt-chip ${totalVacant > 0 ? 'srt-chip-vacant' : 'srt-chip-all-good'}">
              ${totalVacant > 0 ? `⚠️ ${totalVacant} Vacanc${totalVacant > 1 ? 'ies' : 'y'}` : '✅ 100% Staffed'}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Form Table -->
      <table class="summary-report-table">
        <thead>
          <tr>
            <th>Location &amp; Landmark</th>
            <th>Shift &amp; Time</th>
            <th>Volunteers (3 per Cart)</th>
            <th>Vacancy Status</th>
          </tr>
        </thead>
        <tbody>
          ${tbodyHTML}
        </tbody>
      </table>

      <!-- 3. Form Footer -->
      <div class="srt-form-footer">
        <div>📋 Cart Witnessing Management System &bull; Official Dispatch Form</div>
        <div>Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; Report adjustments to Keyman</div>
      </div>
    </div>`;

  document.getElementById('summaryReportContent').innerHTML = html;
  document.getElementById('summaryReportModal').classList.add('active');
}

function closeSummaryReportModal() {
  document.getElementById('summaryReportModal').classList.remove('active');
  // Clean up any lingering image preview
  const existingOverlay = document.querySelector('.image-preview-overlay');
  if (existingOverlay) existingOverlay.remove();
}

function downloadReportAsImage() {
  const el = document.getElementById('reportCaptureZone');
  if (!el) { showToast('⚠️ No report to capture.'); return; }
  showToast('📸 Generating image…');

  // Clone capture zone to an unconstrained offscreen container
  // This guarantees that mobile screen width, horizontal scroll position,
  // or viewport scaling NEVER clips Date or Shift Time columns!
  const clone = el.cloneNode(true);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '880px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.padding = '0';
  container.style.margin = '0';

  clone.style.width = '880px';
  clone.style.minWidth = '880px';
  clone.style.maxWidth = '880px';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  container.appendChild(clone);
  document.body.appendChild(container);

  html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 880,
    windowWidth: 880,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0
  }).then(canvas => {
    container.remove();

    canvas.toBlob(blob => {
      if (!blob) { showToast('❌ Failed to create image.'); return; }

      const blobUrl = URL.createObjectURL(blob);
      const fileName = `Cart-Schedule-${formatDateKey(currentDate)}.png`;

      // Check if native share is available (mobile)
      const canShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] });

      // Build fullscreen image preview overlay
      const overlay = document.createElement('div');
      overlay.className = 'image-preview-overlay';
      overlay.innerHTML = `
        <div class="image-preview-header">
          <h3>📸 Schedule Image Ready</h3>
          <p>Long-press the image below to save to your gallery</p>
        </div>
        <div class="image-preview-container">
          <img src="${blobUrl}" alt="Cart Witnessing Schedule" />
        </div>
        <div class="image-preview-actions">
          ${canShare ? `<button class="btn btn-lg btn-success" id="shareImageBtn">📤 Share / Save to Gallery</button>` : ''}
          <button class="btn btn-lg btn-primary" id="downloadImageBtn">💾 Download Image</button>
          <button class="btn btn-outline" id="closeImagePreviewBtn">✕ Close</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Download button — works on all platforms
      document.getElementById('downloadImageBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        link.click();
        showToast('✅ Image saved! Check your Downloads.');
      });

      // Share button — mobile native share sheet
      if (canShare) {
        document.getElementById('shareImageBtn').addEventListener('click', async () => {
          try {
            const file = new File([blob], fileName, { type: 'image/png' });
            await navigator.share({
              files: [file],
              title: 'Cart Witnessing Schedule',
              text: `Schedule for ${document.getElementById('currentDateTitle').textContent}`
            });
            showToast('✅ Shared successfully!');
          } catch (err) {
            if (err.name !== 'AbortError') showToast('❌ Share failed. Try long-press to save.');
          }
        });
      }

      // Close button
      document.getElementById('closeImagePreviewBtn').addEventListener('click', () => {
        overlay.remove();
        URL.revokeObjectURL(blobUrl);
      });

      // Also close on overlay background tap
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          URL.revokeObjectURL(blobUrl);
        }
      });

    }, 'image/png');
  }).catch(err => {
    container.remove();
    console.error(err);
    showToast('❌ Failed to generate image.');
  });
}


// -----------------------------------------------------------
// 11. WHATSAPP COPY FUNCTIONS
// -----------------------------------------------------------
function copyVacancyListWhatsApp() {
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  let msg = `📢 *CART WITNESSING VACANCIES*\n📅 *${dateTitle}*\n\n`;
  let totalNeeded = 0;

  LOCATIONS.forEach(loc => {
    const shifts = data[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];
    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      let filled = 0;
      if (shift.p1 && shift.p1.name && shift.p1.name.trim()) filled++;
      if (shift.p2 && shift.p2.name && shift.p2.name.trim()) filled++;
      if (shift.p3 && shift.p3.name && shift.p3.name.trim()) filled++;
      const needed = 3 - filled;
      if (needed > 0) {
        totalNeeded += needed;
        msg += `📍 *${loc.name}*\n⏰ ${shiftDef.timeString}\n⚠️ ${needed} volunteer(s) needed\n\n`;
      }
    });
  });

  if (totalNeeded === 0) msg += '🎉 All positions are fully staffed!\n';
  else msg += `---\n*Total needed: ${totalNeeded} volunteers*\n`;
  msg += '\n_Please reply if you can help! 🙏_';

  navigator.clipboard.writeText(msg).then(() => showToast('📲 Vacancy list copied! Paste in WhatsApp.')).catch(() => showToast('❌ Could not copy to clipboard.'));
}

function copyWhatsAppSummary() {
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  let msg = `📋 *CART WITNESSING SCHEDULE*\n📅 *${dateTitle}*\n\n`;

  LOCATIONS.forEach(loc => {
    msg += `📍 *${loc.name}*\n`;
    const shifts = data[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];
    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      msg += `  ${shiftDef.icon} ${shiftDef.timeString}\n`;
      const names = [];
      if (shift.p1 && shift.p1.name && shift.p1.name.trim()) names.push(shift.p1.name.trim());
      if (shift.p2 && shift.p2.name && shift.p2.name.trim()) names.push(shift.p2.name.trim());
      if (shift.p3 && shift.p3.name && shift.p3.name.trim()) names.push(shift.p3.name.trim());
      const openSlots = 3 - names.length;
      if (names.length > 0) msg += `    ${names.join(', ')}\n`;
      if (openSlots > 0) msg += `    ⚠️ ${openSlots} slot(s) open\n`;
    });
    msg += '\n';
  });

  navigator.clipboard.writeText(msg).then(() => showToast('📲 Schedule copied! Paste in WhatsApp.')).catch(() => showToast('❌ Could not copy to clipboard.'));
}

// -----------------------------------------------------------
// 12. TEXT-TO-SPEECH
// -----------------------------------------------------------
function speakSchedule() {
  if (!('speechSynthesis' in window)) { showToast('🔇 Speech not supported on this device.'); return; }
  window.speechSynthesis.cancel();
  const dateTitle = document.getElementById('currentDateTitle').textContent;
  const dateKey = formatDateKey(currentDate);
  const data = getScheduleForDate(dateKey);
  let text = `Cart witnessing schedule for ${dateTitle}. `;

  LOCATIONS.forEach(loc => {
    text += `${loc.name}. `;
    const shifts = data[loc.id] || [normalizeShiftData(null), normalizeShiftData(null)];
    SHIFT_TIMES.forEach(shiftDef => {
      const shift = normalizeShiftData(shifts[shiftDef.id]);
      text += `${shiftDef.name}. `;
      const names = [];
      if (shift.p1 && shift.p1.name && shift.p1.name.trim()) names.push(shift.p1.name);
      if (shift.p2 && shift.p2.name && shift.p2.name.trim()) names.push(shift.p2.name);
      if (shift.p3 && shift.p3.name && shift.p3.name.trim()) names.push(shift.p3.name);
      if (names.length > 0) text += names.join(', ') + '. ';
      else text += 'No volunteers assigned. ';
    });
  });

  speechSynthUtterance = new SpeechSynthesisUtterance(text);
  speechSynthUtterance.rate = 0.9;
  document.getElementById('ttsNotice').classList.add('active');
  speechSynthUtterance.onend = () => document.getElementById('ttsNotice').classList.remove('active');
  window.speechSynthesis.speak(speechSynthUtterance);
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  document.getElementById('ttsNotice').classList.remove('active');
}

// -----------------------------------------------------------
// 13. DARK MODE
// -----------------------------------------------------------
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('cart_dark_mode', isDark ? 'true' : 'false');
  const icon = document.getElementById('darkModeIcon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

// -----------------------------------------------------------
// 14. TOAST NOTIFICATION
// -----------------------------------------------------------
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  document.getElementById('toastMessage').textContent = message;
  toast.classList.add('active');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => hideToast(), 4000);
}

function hideToast() {
  document.getElementById('toastNotification').classList.remove('active');
}

// -----------------------------------------------------------
// 15. INITIALIZATION
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Restore dark mode preference
  const savedDark = localStorage.getItem('cart_dark_mode');
  if (savedDark === 'true') {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('darkModeIcon');
    if (icon) icon.textContent = '☀️';
  }

  updateDateDisplay();
});
