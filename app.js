// =========================================================================
// CART WITNESSING APP - SUMMARY & VACANCY REPORT (4-COLUMN LAYOUT WITH PNG EXPORT)
// =========================================================================

// 1. DATA DEFINITIONS & DEFAULT ROSTER (3 VOLUNTEERS PER CART)
const LOCATIONS = [
  { id: 'L1', name: 'Location 1 (L1)', landmark: 'Central Metro Station - North Entrance' },
  { id: 'L2', name: 'Location 2 (L2)', landmark: 'City Public Market & Community Square' },
  { id: 'L3', name: 'Location 3 (L3)', landmark: 'Central Park West - Lake Walkway' },
  { id: 'L4', name: 'Location 4 (L4)', landmark: 'Ferry Terminal & Marina Promenade' },
  { id: 'L5', name: 'Location 5 (L5)', landmark: 'Civic Center & Public Library Plaza' }
];

const SHIFT_TIMES = [
  { id: 0, name: 'Shift 1: Morning', timeString: '06:30 AM - 08:00 AM', className: 'morning' },
  { id: 1, name: 'Shift 2: Afternoon', timeString: '04:30 PM - 06:00 PM', className: 'afternoon' }
];

// 2. EXPORT TO IMAGE FUNCTION (Requires html2canvas library)
function exportReportToPNG() {
  const reportElement = document.getElementById('summary-report-container');
  if (!reportElement) {
    alert("Error: Summary report element not found.");
    return;
  }
  
  // Use html2canvas to capture the clean table element
  html2canvas(reportElement, { scale: 2, useCORS: true }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'Cart_Witnessing_Summary_Report.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error("PNG Export Failed:", err);
    alert("Could not export image. Ensure html2canvas script is included in index.html");
  });
}

// 3. RENDER CLEAN 4-COLUMN SUMMARY TABLE
function renderSummaryTable(reportData) {
  const tableBody = document.querySelector('#summary-table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  LOCATIONS.forEach(loc => {
    SHIFT_TIMES.forEach(shift => {
      const key = `${loc.id}-${shift.id}`;
      const volunteers = reportData[key] || [];
      
      // Calculate missing spots out of 3 maximum slots
      const vacancyCount = Math.max(0, 3 - volunteers.length);
      const vacancyText = vacancyCount === 0 ? "Fully Staffed" : `${vacancyCount} Vacant Slot(s)`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${loc.name}</strong><br><small>${loc.landmark}</small></td>
        <td><span class="badge ${shift.className}">${shift.name}</span><br><small>${shift.timeString}</small></td>
        <td>${volunteers.length > 0 ? volunteers.join(', ') : '<em>No volunteers assigned</em>'}</td>
        <td class="${vacancyCount > 0 ? 'vacancy-alert' : 'staffed-status'}">${vacancyText}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// Initialize event listeners when DOM content loads
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('btn-export-png');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportReportToPNG);
  }
});
