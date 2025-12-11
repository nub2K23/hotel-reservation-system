// Simple client-only hotel reservation demo using localStorage
(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  const state = {
    user: null,
    rooms: [],
    reservations: []
  };

  // initial demo rooms
  function seed() {
    if (!localStorage.getItem('hrs_rooms')) {
      const demo = [
        { number: 101, type: 'Single', status: 'Available' },
        { number: 102, type: 'Double', status: 'Available' },
        { number: 103, type: 'Suite', status: 'Available' }
      ];
      localStorage.setItem('hrs_rooms', JSON.stringify(demo));
    }
    if (!localStorage.getItem('hrs_res')) {
      localStorage.setItem('hrs_res', JSON.stringify([]));
    }
  }

  function load() {
    state.rooms = JSON.parse(localStorage.getItem('hrs_rooms') || '[]');
    state.reservations = JSON.parse(localStorage.getItem('hrs_res') || '[]');
    state.user = JSON.parse(sessionStorage.getItem('hrs_user') || 'null');
  }

  function save() {
    localStorage.setItem('hrs_rooms', JSON.stringify(state.rooms));
    localStorage.setItem('hrs_res', JSON.stringify(state.reservations));
    // update stored revenue summary
    const revenue = state.reservations.reduce((s,r) => s + (r.payment ? Number(r.payment.amount||0) : 0), 0);
    localStorage.setItem('hrs_revenue', JSON.stringify(revenue));
    // attempt auto-save to default disk file if enabled
    try { attemptAutoSave(); } catch (e) { /* ignore */ }
  }

  // Export / Import handlers for persistence backup
  function exportData() {
    const data = {
      rooms: state.rooms,
      reservations: state.reservations,
      revenue: Number(localStorage.getItem('hrs_revenue') || 0)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hrs-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importDataFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.rooms && Array.isArray(data.rooms)) state.rooms = data.rooms;
        if (data.reservations && Array.isArray(data.reservations)) state.reservations = data.reservations;
        if (typeof data.revenue !== 'undefined') localStorage.setItem('hrs_revenue', JSON.stringify(Number(data.revenue) || 0));
        save(); load(); renderAll();
        alert('Import successful');
      } catch (err) {
        alert('Failed to import: invalid file');
      }
    };
    reader.readAsText(file);
  }

  // IndexedDB helpers to store persistent file handle (Chromium browsers)
  function openHandlesDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB not available'));
      const req = indexedDB.open('hrs_handles', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function storeHandle(handle) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openHandlesDB();
        const tx = db.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, 'dataFile');
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      } catch (err) { reject(err); }
    });
  }

  function getStoredHandle() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openHandlesDB();
        const tx = db.transaction('handles', 'readonly');
        const req = tx.objectStore('handles').get('dataFile');
        req.onsuccess = () => { db.close(); resolve(req.result); };
        req.onerror = () => { db.close(); resolve(null); };
      } catch (err) { resolve(null); }
    });
  }

  async function attemptAutoSave() {
    // write current data to stored handle if present
    try {
      const handle = await getStoredHandle();
      if (!handle) return; // not configured
      const data = { rooms: state.rooms, reservations: state.reservations, revenue: Number(localStorage.getItem('hrs_revenue') || 0) };
      const text = JSON.stringify(data, null, 2);
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
    } catch (err) {
      console.warn('Auto-save failed', err);
    }
  }

  // Allow user to select and store a default file for auto-save
  async function enableAutoSave() {
    if (!window.showSaveFilePicker) {
      alert('Auto-save requires a Chromium-based browser supporting the File System Access API. Falling back to manual export.');
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: 'hrs-data.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
      await storeHandle(handle);
      // do an immediate write
      await attemptAutoSave();
      alert('Auto-save enabled (file handle stored). Future saves will write automatically to this file.');
      return true;
    } catch (err) {
      console.warn('enableAutoSave cancelled', err);
      return false;
    }
  }

  async function disableAutoSave() {
    try {
      const db = await openHandlesDB();
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').delete('dataFile');
      tx.oncomplete = () => db.close();
    } catch (err) {
      console.warn('disableAutoSave', err);
    }
  }

  // File System Access API: Save/load directly to disk (Chromium browsers)
  async function saveToDisk() {
    const data = {
      rooms: state.rooms,
      reservations: state.reservations,
      revenue: Number(localStorage.getItem('hrs_revenue') || 0)
    };
    const text = JSON.stringify(data, null, 2);
    // feature detect
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'hrs-data.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        alert('Data saved to disk');
        return;
      } catch (err) {
        console.warn('Save to disk cancelled or failed', err);
      }
    }
    // fallback to export download
    exportData();
  }

  async function loadFromDisk() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }], multiple: false });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.rooms && Array.isArray(data.rooms)) state.rooms = data.rooms;
        if (data.reservations && Array.isArray(data.reservations)) state.reservations = data.reservations;
        if (typeof data.revenue !== 'undefined') localStorage.setItem('hrs_revenue', JSON.stringify(Number(data.revenue) || 0));
        save(); load(); renderAll();
        alert('Loaded data from disk');
        return;
      } catch (err) {
        console.warn('Load from disk cancelled or failed', err);
      }
    }
    // fallback: trigger import file input
    const input = qs('#importFile');
    if (input) input.click();
  }

  // UI helpers
  function showScreen(id) {
    qsa('.screen').forEach(s => s.classList.add('hidden'));
    qs(`#${id}`).classList.remove('hidden');
    qsa('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.route === id));
    if (id === 'rooms') renderRooms();
    if (id === 'reservations') renderReservations();
  }

  function renderRooms() {
    const tbody = qs('#roomsTable tbody');
    tbody.innerHTML = '';
    state.rooms.forEach((r, i) => {
      const tr = document.createElement('tr');
      const rateText = r.rate ? `$${Number(r.rate).toFixed(2)}` : '';
      tr.innerHTML = `<td>${r.number}</td><td>${r.type}</td><td>${rateText}</td><td>${r.status}</td>
        <td class="actions"><button class="small-btn btn" data-act="edit-room" data-i="${i}">Edit</button>
        <button class="small-btn btn" data-act="del-room" data-i="${i}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    populateRoomSelect();
  }

  // Populate room select with optional date-range filtering
  function populateRoomSelect(dIn, dOut) {
    const sel = qs('#rNumber');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">-- select room --</option>';

    // helper to check date overlap (inclusive start, exclusive end)
    function overlaps(aStart, aEnd, bStart, bEnd) {
      if (!aStart || !aEnd || !bStart || !bEnd) return false;
      return (aStart < bEnd) && (bStart < aEnd);
    }

    const conflicts = [];
    state.rooms.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.number;
      opt.textContent = `${r.number} — ${r.type}`;

      // determine if room should be disabled
      let disable = false;
      let note = '';
      let conflictInfo = '';

      // if user provided dates, check for overlaps with existing reservations
      if (dIn && dOut) {
        const selStart = dIn;
        const selEnd = dOut;
        const conflicting = state.reservations.find(rr => {
          if (!rr.dIn || !rr.dOut) return false;
          return overlaps(selStart, selEnd, rr.dIn, rr.dOut) && (rr.status === 'Booked' || rr.status === 'Checked-in') && String(rr.room) === String(r.number);
        });
        if (conflicting) { disable = true; note = ' (booked)'; conflictInfo = `${conflicting.guest}: ${conflicting.dIn} → ${conflicting.dOut}`; }
      } else {
        // fallback: disable if any booked or checked-in reservation exists for the room
        const conflicting = state.reservations.find(rr => (rr.status === 'Booked' || rr.status === 'Checked-in') && String(rr.room) === String(r.number));
        if (conflicting) { disable = true; note = ' (booked)'; conflictInfo = `${conflicting.guest}: ${conflicting.dIn || ''} → ${conflicting.dOut || ''}`; }
      }

      opt.textContent += note;
      if (disable) {
        opt.disabled = true;
        if (conflictInfo) opt.title = conflictInfo;
        if (conflictInfo) conflicts.push(`<li><strong>${r.number}</strong>: ${conflictInfo}</li>`);
      }
      sel.appendChild(opt);
    });

    // populate conflict tooltip list
    const confDiv = qs('#roomConflicts');
    if (confDiv) {
      if (conflicts.length) {
        confDiv.innerHTML = `<strong>Unavailable rooms:</strong><ul>${conflicts.join('')}</ul>`;
        confDiv.classList.remove('hidden');
      } else {
        confDiv.innerHTML = '';
        confDiv.classList.add('hidden');
      }
    }
    // restore previous selection if still present
    if (cur) sel.value = cur;
  }

  function renderReservations() {
    const ul = qs('#resList');
    ul.innerHTML = '';
    // show only upcoming (Booked) reservations in the upcoming list
    state.reservations.forEach((res, i) => {
      if (res.status !== 'Booked') return;
      const li = document.createElement('li');
      const payInfo = res.payment ? `${res.payment.method} $${Number(res.payment.amount||0).toFixed(2)}` : '';
      const cardInfo = res.payment && res.payment.cardMasked ? ` — ${res.payment.cardMasked}` : '';
      li.innerHTML = `<div><strong>${res.guest}</strong> — Room ${res.room} (${res.dIn} → ${res.dOut})</div>
        <div>${res.status || 'Booked'} <span class="muted">${payInfo}${cardInfo}</span> <button class="btn link" data-act="cancel" data-i="${i}">Cancel</button></div>`;
      ul.appendChild(li);
    });
  }

  function renderArrivals() {
    const ul = qs('#arrivalList'); ul.innerHTML = '';
    state.reservations.forEach((r,i) => {
      if (r.status === 'Booked') {
        const li = document.createElement('li');
        li.innerHTML = `<div>${r.guest} — Room ${r.room}</div>
          <div><button class="btn" data-act="checkin" data-i="${i}">Check-in</button></div>`;
        ul.appendChild(li);
      }
    });
  }

  function renderStays() {
    const ul = qs('#stayList'); ul.innerHTML = '';
    state.reservations.forEach((r,i) => {
      if (r.status === 'Checked-in') {
        const li = document.createElement('li');
        li.innerHTML = `<div>${r.guest} — Room ${r.room}</div>
          <div><button class="btn" data-act="checkout" data-i="${i}">Check-out</button></div>`;
        ul.appendChild(li);
      }
    });
  }

  function renderReports() {
    const rc = qs('#reportContent'); rc.innerHTML = '';
    const totalRooms = state.rooms.length;
    const occupied = state.reservations.filter(r => r.status === 'Checked-in').length;
    const revenue = state.reservations.reduce((s,r)=> s + (r.payment ? Number(r.payment.amount||0) : Number(r.rate||0)), 0);
    rc.innerHTML = `<p>Total rooms: <strong>${totalRooms}</strong></p>
      <p>Occupied now: <strong>${occupied}</strong></p>
      <p>Total revenue (payments): <strong>$${revenue.toFixed(2)}</strong></p>`;
  }
  

  // Validation helpers
  function luhnCheck(num) {
    const arr = (num + '').split('').reverse().map(x => parseInt(x, 10));
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      let v = arr[i];
      if (i % 2 === 1) {
        v *= 2;
        if (v > 9) v -= 9;
      }
      sum += v;
    }
    return sum % 10 === 0;
  }

  function validateExpiry(exp) {
    if (!exp) return false;
    const m = exp.trim().match(/^(\d{1,2})\/(\d{2,4})$/);
    if (!m) return false;
    let month = parseInt(m[1], 10);
    let year = parseInt(m[2], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const expDate = new Date(year, month); // first day of month after expiry
    return expDate > now;
  }

  // Form error helpers
  function showFormError(id, msg) {
    const el = qs('#' + id);
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function clearFormError(id) {
    const el = qs('#' + id);
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
  }

  // navigation & events
  function bind() {
    // nav
    qsa('[data-route]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const route = el.dataset.route;
        showScreen(route);
      });
    });

    // login
    qs('#btnLogin').addEventListener('click', () => {
      qs('#loginScreen').classList.remove('hidden');
      qs('#app').classList.add('hidden');
    });
    qs('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const user = qs('#username').value.trim();
      const pwd = qs('#password').value;
      if (!user) return alert('Enter username');
      // demo password is 'password'
      if (pwd !== 'password') return alert('Use password "password" for demo');
      state.user = { name: user };
      sessionStorage.setItem('hrs_user', JSON.stringify(state.user));
      qs('#userName').textContent = user;
      qs('#userMenu').classList.remove('hidden');
      qs('#btnLogin').classList.add('hidden');
      qs('#loginScreen').classList.add('hidden');
      qs('#app').classList.remove('hidden');
      showScreen('dashboard');
      renderAll();
    });
    qs('#btnLogout').addEventListener('click', () => {
      sessionStorage.removeItem('hrs_user'); state.user = null;
      qs('#userMenu').classList.add('hidden');
      qs('#btnLogin').classList.remove('hidden');
      qs('#app').classList.add('hidden');
      qs('#loginScreen').classList.remove('hidden');
    });

    // reservation form (includes payment fields + validation)
    qs('#resForm').addEventListener('submit', e => {
      e.preventDefault();
      clearFormError('resError');
      const paymentMethod = qs('#payMethod') ? qs('#payMethod').value : 'Card';
      const payAmt = Number(qs('#payAmt').value) || 0;
      const rawCard = qs('#cardNumber') ? qs('#cardNumber').value : '';
      const cardNum = rawCard.replace(/\D+/g, '');
      const last4 = cardNum ? cardNum.slice(-4) : '';
      const masked = last4 ? '**** **** **** ' + last4 : '';

      // Basic validation
      if (!qs('#gName').value.trim()) { showFormError('resError','Enter guest name'); return; }
      if (!qs('#rNumber').value) { showFormError('resError','Enter room number'); return; }
      if (!qs('#dIn').value || !qs('#dOut').value) { showFormError('resError','Enter check-in and check-out dates'); return; }
      if (!qs('#rate').value) { showFormError('resError','Enter rate'); return; }

      if (paymentMethod === 'Card') {
        if (!cardNum || cardNum.length < 13) { showFormError('resError','Enter a valid card number'); return; }
        if (!luhnCheck(cardNum)) { showFormError('resError','Invalid card number (failed Luhn)'); return; }
        const exp = qs('#cardExp') ? qs('#cardExp').value : '';
        if (!validateExpiry(exp)) { showFormError('resError','Card expiry is invalid or expired (use MM/YY)'); return; }
        const cvv = qs('#cardCvv') ? qs('#cardCvv').value : '';
        if (!/^[0-9]{3,4}$/.test(cvv)) { showFormError('resError','Enter a valid CVV (3 or 4 digits)'); return; }
        if (payAmt <= 0) { showFormError('resError','Enter a positive payment amount'); return; }
      }

      const payment = {
        method: paymentMethod,
        amount: payAmt || Number(qs('#rate').value) || 0,
        cardholder: qs('#cardName') ? qs('#cardName').value.trim() : '',
        cardMasked: masked,
        status: paymentMethod ? 'Paid' : 'Pending'
      };

      const res = {
        guest: qs('#gName').value.trim(),
        room: qs('#rNumber').value,
        dIn: qs('#dIn').value,
        dOut: qs('#dOut').value,
        rate: Number(qs('#rate').value) || 0,
        payment: payment,
        status: 'Booked',
        createdAt: new Date().toISOString()
      };
      state.reservations.push(res);
      save(); renderAll(); alert('Reservation saved');
      e.target.reset();
    });

    // auto-fill rate when selecting a room
    const roomSelect = qs('#rNumber');
    if (roomSelect) {
      roomSelect.addEventListener('change', () => {
        const num = roomSelect.value;
        const room = state.rooms.find(r => String(r.number) === String(num));
        if (room && room.rate) qs('#rate').value = room.rate;
      });
    }

    // re-populate room list when dates change (date-range-aware availability)
    const inDate = qs('#dIn');
    const outDate = qs('#dOut');
    function refreshRoomsByDates() {
      const a = inDate ? inDate.value : '';
      const b = outDate ? outDate.value : '';
      if (a && b) populateRoomSelect(a, b); else populateRoomSelect();
    }
    if (inDate) inDate.addEventListener('change', refreshRoomsByDates);
    if (outDate) outDate.addEventListener('change', refreshRoomsByDates);

    // show/hide card fields based on payment method
    const paySel = qs('#payMethod');
    function updateCardVisibility() {
      const cardWrap = qs('#cardFields');
      if (!cardWrap) return;
      if (paySel && paySel.value === 'Card') cardWrap.classList.remove('hidden');
      else cardWrap.classList.add('hidden');
    }
    if (paySel) {
      paySel.addEventListener('change', updateCardVisibility);
      updateCardVisibility();
    }

    // wire export/import UI
    const btnExport = qs('#btnExport');
    const btnImport = qs('#btnImport');
    const importFile = qs('#importFile');
    if (btnExport) btnExport.addEventListener('click', exportData);
    const btnSaveDisk = qs('#btnSaveDisk');
    const btnLoadDisk = qs('#btnLoadDisk');
    const btnAutoSave = qs('#btnAutoSave');
    if (btnSaveDisk) btnSaveDisk.addEventListener('click', saveToDisk);
    if (btnLoadDisk) btnLoadDisk.addEventListener('click', loadFromDisk);
    if (btnAutoSave) {
      // toggle auto-save
      btnAutoSave.addEventListener('click', async () => {
        const enabled = btnAutoSave.dataset.enabled === '1';
        if (!enabled) {
          const ok = await enableAutoSave();
          if (ok) { btnAutoSave.textContent = 'Disable Auto-Save'; btnAutoSave.dataset.enabled = '1'; }
        } else {
          await disableAutoSave();
          btnAutoSave.textContent = 'Enable Auto-Save'; btnAutoSave.dataset.enabled = '0';
          alert('Auto-save disabled');
        }
      });
      // read current state of stored handle
      getStoredHandle().then(h => { if (h) { btnAutoSave.textContent = 'Disable Auto-Save'; btnAutoSave.dataset.enabled = '1'; } else { btnAutoSave.dataset.enabled = '0'; } });
    }
    // one-time autosave prompt (show when no stored handle and not dismissed)
    const prompt = qs('#autosavePrompt');
    const promptEnable = qs('#promptEnable');
    const promptDismiss = qs('#promptDismiss');
    try {
      const dismissed = localStorage.getItem('hrs_autoprompt_dismissed') === '1';
      if (prompt && !dismissed && window.showSaveFilePicker) {
        // show prompt
        prompt.classList.remove('hidden');
      }
      if (promptEnable) promptEnable.addEventListener('click', async () => {
        const ok = await enableAutoSave();
        if (ok) {
          if (prompt) prompt.classList.add('hidden');
          if (btnAutoSave) { btnAutoSave.textContent = 'Disable Auto-Save'; btnAutoSave.dataset.enabled = '1'; }
        }
      });
      if (promptDismiss) promptDismiss.addEventListener('click', () => {
        localStorage.setItem('hrs_autoprompt_dismissed','1');
        if (prompt) prompt.classList.add('hidden');
      });
    } catch (e) { /* ignore */ }
    if (btnImport && importFile) {
      btnImport.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (f) importDataFile(f);
        e.target.value = '';
      });
    }

    // list actions (delegation)
    document.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      const idx = btn.dataset.i;
      if (!act) return;

      if (act === 'cancel') {
        state.reservations.splice(idx,1); save(); renderAll();
      } else if (act === 'checkin') {
        const r = state.reservations[idx];
        if (r) {
          r.status = 'Checked-in';
          // mark room occupied
          const room = state.rooms.find(rr => String(rr.number) === String(r.room));
          if (room) room.status = 'Occupied';
        }
        save(); renderAll();
      } else if (act === 'checkout') {
        const r = state.reservations[idx];
        if (r) {
          r.status = 'Checked-out';
          // mark room available
          const room = state.rooms.find(rr => String(rr.number) === String(r.room));
          if (room) room.status = 'Available';
        }
        save(); renderAll();
      }
    });

    // Rooms form handlers
    let editingRoomIndex = -1;
    const roomsForm = qs('#roomsForm');
      if (roomsForm) {
      roomsForm.addEventListener('submit', e => {
        e.preventDefault();
        clearFormError('roomsError');
        const num = Number(qs('#roomNumber').value);
        const type = qs('#roomType').value;
        const status = qs('#roomStatus').value;
        const rate = qs('#roomRate').value ? Number(qs('#roomRate').value) : 0;
        if (!num) { showFormError('roomsError','Enter valid room number'); return; }

        // if editing, update existing
        if (editingRoomIndex > -1) {
          state.rooms[editingRoomIndex] = { number: num, type, status, rate };
          editingRoomIndex = -1;
          qs('#roomSave').textContent = 'Add Room';
        } else {
          // prevent duplicate room number
          const exists = state.rooms.some(r => Number(r.number) === num);
          if (exists) { showFormError('roomsError','Room number already exists'); return; }
          state.rooms.push({ number: num, type, status, rate });
        }
        save(); renderAll(); roomsForm.reset();
      });

      qs('#roomCancel').addEventListener('click', () => {
        editingRoomIndex = -1; roomsForm.reset(); qs('#roomSave').textContent = 'Add Room'; clearFormError('roomsError');
      });
    }

    // handle edit/delete for rooms via delegation
    document.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      const idx = btn.dataset.i;
      if (!act) return;
      if (act === 'edit-room') {
        const i = Number(idx);
        const room = state.rooms[i];
        if (!room) return;
        editingRoomIndex = i;
        qs('#roomNumber').value = room.number;
        qs('#roomType').value = room.type;
        qs('#roomStatus').value = room.status;
        qs('#roomRate').value = room.rate || '';
        qs('#roomSave').textContent = 'Update Room';
        // switch to rooms screen if not visible
        showScreen('rooms');
      } else if (act === 'del-room') {
        const i = Number(idx);
        if (!confirm('Delete this room?')) return;
        state.rooms.splice(i,1);
        save(); renderAll();
      }
    });
  }

  function renderAll() {
    renderRooms(); renderReservations(); renderArrivals(); renderStays(); renderReports();
  }

  // init
  seed(); load(); bind();
  if (state.user) {
    qs('#userName').textContent = state.user.name;
    qs('#userMenu').classList.remove('hidden');
    qs('#btnLogin').classList.add('hidden');
    qs('#loginScreen').classList.add('hidden');
    qs('#app').classList.remove('hidden');
    showScreen('dashboard');
    renderAll();
  } else {
    // show login by default
    qs('#loginScreen').classList.remove('hidden');
  }
})();