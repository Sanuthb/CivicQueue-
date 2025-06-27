const socket = io();
const deptSelect = document.getElementById('department');
const peopleElem = document.getElementById('people');
const waitElem = document.getElementById('wait');
const getTicketBtn = document.getElementById('get-ticket');
const ticketInfo = document.getElementById('ticket-info');
const url="http://localhost:3000"

function refreshQueue() {
  const dept = deptSelect.value;
  fetch(`${url}/api/queue/${dept}`)
    .then(res => res.json())
    .then(queue => {
      peopleElem.textContent = `People in queue: ${queue.length}`;
      waitElem.textContent = `Estimated wait: ${queue.length * 5} min`;
    });
}

deptSelect.addEventListener('change', refreshQueue);
getTicketBtn.addEventListener('click', () => {
  const name = document.getElementById('username').value.trim();
  const dept = deptSelect.value;
  if (!name) return alert('Enter your name');
  fetch(`${url}/api/ticket`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name, dept })
  })
    .then(res => res.json())
    .then(ticket => {
      ticketInfo.textContent = `Hi ${ticket.name}, your ticket #${ticket.number}`;
    });
});

socket.on('queueUpdate', data => {
  if (data.dept === deptSelect.value) refreshQueue();
});

refreshQueue();
