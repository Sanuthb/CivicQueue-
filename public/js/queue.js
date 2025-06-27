const socket = io();
const deptSelect = document.getElementById('department');
const branchSelect = document.getElementById('branch');
const peopleElem = document.getElementById('people');
const waitElem = document.getElementById('wait');
const peakElem = document.getElementById('peak-time');
const getTicketBtn = document.getElementById('get-ticket');
const ticketInfo = document.getElementById('ticket-info');
const checklistBox = document.getElementById('checklist');
const priorityCheckbox = document.getElementById('priority');

let myTicket = null;

// Document checklist per department
const checklist = {
  passport: ['Aadhar Card', 'Old Passport', 'Photos'],
  license: ['Aadhar Card', 'Medical Certificate'],
  property: ['ID Proof', 'Tax Receipt', 'Sale Deed']
};

// Estimated peak time based on queue size
function estimatePeakTime(queueLength) {
  if (queueLength >= 15) return '11 AM – 1 PM';
  if (queueLength >= 10) return '2 PM – 4 PM';
  return 'Now is a good time';
}

// Update document checklist section
function updateChecklist() {
  const dept = deptSelect.value;
  const docs = checklist[dept];
  checklistBox.innerHTML = `
    <h4>Required Documents:</h4>
    <ul>${docs.map(doc => `<li>✔ ${doc}</li>`).join('')}</ul>
  `;
}

// Refresh the live queue data
function refreshQueue() {
  const dept = deptSelect.value;
  const branch = branchSelect.value;

  fetch(`/api/queue/${dept}`) // Branch-aware API can be added later
    .then(res => res.json())
    .then(queue => {
      peopleElem.textContent = `People in queue: ${queue.length}`;
      waitElem.textContent = `Estimated wait: ${queue.length * 5} min`;
      peakElem.textContent = `Peak Time: ${estimatePeakTime(queue.length)}`;

      if (myTicket && queue.length > 0 && queue[0].number === myTicket.number) {
        alert(`🔔 Hey ${myTicket.name}, it's your turn now!`);
        myTicket = null;
      }
    });
}

// Book a ticket
getTicketBtn.addEventListener('click', () => {
  const name = document.getElementById('username').value.trim();
  const dept = deptSelect.value;
  const branch = branchSelect.value;
  const isPriority = priorityCheckbox.checked;

  if (!name) return alert('Please enter your name');

  fetch('/api/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dept, branch, isPriority })
  })
    .then(res => res.json())
    .then(ticket => {
      myTicket = ticket;
      ticketInfo.innerHTML = `Hi ${ticket.name}, your ticket number is #${ticket.number} (${ticket.priority ? 'Priority' : 'Normal'})`;

      // 🔳 Generate and show QR code
      fetch('/api/ticket/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: { ...ticket, dept } })
      })
        .then(res => res.json())
        .then(data => {
          const img = document.createElement('img');
          img.src = data.qrImage;
          img.alt = "QR Code";
          img.style.marginTop = "10px";
          img.style.width = "180px";
          ticketInfo.appendChild(img);
        });

      refreshQueue();
    });
});

// Listen for queue updates via WebSocket
socket.on('queueUpdate', data => {
  if (data.dept === deptSelect.value) refreshQueue();
});

// React to UI changes
deptSelect.addEventListener('change', () => {
  myTicket = null;
  updateChecklist();
  refreshQueue();
});

branchSelect.addEventListener('change', () => {
  myTicket = null;
  refreshQueue();
});

// Initial load
updateChecklist();
refreshQueue();
