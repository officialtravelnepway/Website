/* ============================
   Airports Data (single source of truth)
   ============================ */
const AIRPORTS = [
  { group: "Nepal", items: [["KTM", "Kathmandu (KTM)"]] },
  { group: "USA", items: [
    ["JFK", "New York (JFK)"], ["LAX", "Los Angeles (LAX)"],
    ["ORD", "Chicago (ORD)"], ["ATL", "Atlanta (ATL)"],
    ["SFO", "San Francisco (SFO)"], ["SEA", "Seattle (SEA)"],
    ["MIA", "Miami (MIA)"], ["BOS", "Boston (BOS)"],
    ["PHX", "Phoenix (PHX)"], ["DCA", "Washington D.C. (DCA)"]
  ]},
  { group: "UK", items: [
    ["LHR", "London Heathrow (LHR)"], ["LGW", "London Gatwick (LGW)"],
    ["MAN", "Manchester (MAN)"], ["BHX", "Birmingham (BHX)"],
    ["LPL", "Liverpool (LPL)"], ["STN", "London Stansted (STN)"],
    ["EDI", "Edinburgh (EDI)"], ["BRS", "Bristol (BRS)"]
  ]},
  { group: "Japan", items: [
    ["NRT", "Tokyo Narita (NRT)"], ["HND", "Tokyo Haneda (HND)"],
    ["KIX", "Osaka Kansai (KIX)"], ["NGO", "Nagoya (NGO)"],
    ["FUK", "Fukuoka (FUK)"], ["CTS", "Sapporo (CTS)"],
    ["OKA", "Okinawa (OKA)"]
  ]},
  { group: "South Korea", items: [
    ["ICN", "Seoul Incheon (ICN)"], ["GMP", "Seoul Gimpo (GMP)"],
    ["PUS", "Busan Gimhae (PUS)"]
  ]},
  { group: "Australia", items: [
    ["SYD", "Sydney (SYD)"], ["MEL", "Melbourne (MEL)"], ["BNE", "Brisbane (BNE)"]
  ]},
  { group: "UAE", items: [
    ["DXB", "Dubai (DXB)"], ["AUH", "Abu Dhabi (AUH)"]
  ]},
  { group: "Thailand", items: [
    ["BKK", "Bangkok (BKK)"], ["HKT", "Phuket (HKT)"], ["CNX", "Chiang Mai (CNX)"]
  ]}
];

/* Populate a <select> with grouped airports */
function populateAirports(selectEl) {
  AIRPORTS.forEach(group => {
    const og = document.createElement('optgroup');
    og.label = group.group;
    group.items.forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      og.appendChild(opt);
    });
    selectEl.appendChild(og);
  });
}

/* ============================
   Utilities
   ============================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function setMessage(el, text, type = '') {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message' + (type ? ' ' + type : '');
}

function formatNPR(n) {
  return 'Npr ' + n.toLocaleString('en-IN');
}

/* ============================
   Init
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
  /* ---- Year in footer ---- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Populate airport selects ---- */
  const departureSel = $('#departure');
  const destinationSel = $('#destination');
  if (departureSel) populateAirports(departureSel);
  if (destinationSel) populateAirports(destinationSel);

  /* ---- Hero destination autocomplete ---- */
  const airportChoices = AIRPORTS.flatMap(group =>
    group.items.map(([code, label]) => ({ code, label, group: group.group }))
  );

  function setupDestinationAutocomplete(inputId, menuId) {
    const input = $('#' + inputId);
    const menu = $('#' + menuId);
    if (!input || !menu) return;
    let activeIndex = -1;

    function render(query = '') {
      const q = query.trim().toLowerCase();
      if (!q) { menu.hidden = true; menu.innerHTML = ''; return; }
      const matches = airportChoices.filter(a => {
        const name = a.label.replace(/\s*\([A-Z]{3}\)$/, '').toLowerCase();
        return name.includes(q) || a.code.toLowerCase().includes(q);
      }).sort((a,b) => {
        const an = a.label.toLowerCase(), bn = b.label.toLowerCase();
        const as = an.startsWith(q) ? 0 : 1, bs = bn.startsWith(q) ? 0 : 1;
        return as - bs || an.localeCompare(bn);
      }).slice(0, 8);

      menu.innerHTML = '';
      activeIndex = -1;
      if (!matches.length) {
        menu.innerHTML = '<div class="autocomplete-empty">No matching destination found</div>';
        menu.hidden = false;
        return;
      }

      matches.forEach((airport, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'autocomplete-option';
        option.setAttribute('role', 'option');
        option.dataset.value = airport.label;
        option.innerHTML = `<i class="fa-solid fa-location-dot"></i><span><strong>${airport.label}</strong><small>${airport.group} · ${airport.code}</small></span>`;
        option.addEventListener('mousedown', e => {
          e.preventDefault();
          input.value = airport.label;
          menu.hidden = true;
        });
        menu.appendChild(option);
      });
      menu.hidden = false;
    }

    input.addEventListener('focus', () => render(input.value));
    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', e => {
      const options = [...menu.querySelectorAll('.autocomplete-option')];
      if (menu.hidden || !options.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, options.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        options[activeIndex].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        return;
      } else if (e.key === 'Escape') {
        menu.hidden = true;
        return;
      } else return;
      options.forEach((o, i) => o.classList.toggle('active', i === activeIndex));
    });

    document.addEventListener('click', e => {
      if (!input.parentElement.contains(e.target)) menu.hidden = true;
    });
  }

  setupDestinationAutocomplete('heroFrom', 'heroFromSuggestions');
  setupDestinationAutocomplete('heroTo', 'heroToSuggestions');
  setupDestinationAutocomplete('requestFrom', 'requestFromSuggestions');
  setupDestinationAutocomplete('requestTo', 'requestToSuggestions');

  /* ---- Mark current page in navigation ---- */
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.main-nav .nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    link.classList.toggle('active', href === currentPage);
  });

  /* ---- Header scroll state ---- */
  const header = $('.site-header');
  const scrollTopBtn = $('#scrollTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');

    if (scrollTopBtn) {
      if (window.scrollY > 400) scrollTopBtn.classList.add('visible');
      else scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Mobile nav toggle ---- */
  const navToggle = $('.nav-toggle');
  const mainNav = $('.main-nav');

  navToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  $$('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---- Active nav link based on scroll ---- */
  // Scroll-based section highlighting is only used for same-page (#section) navigation.
  // Multi-page links keep their current-page active state while scrolling.
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  const sectionLinks = navLinks.filter(l => (l.getAttribute('href') || '').startsWith('#'));
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    const linkObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          sectionLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => linkObserver.observe(s));
  }

  /* ---- Reveal animations ---- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  $$('[data-aos]').forEach(el => revealObserver.observe(el));

  /* ============================
     Flight search form — managed inventory
     ============================ */
  const flightForm = $('#flightForm');
  const flightMessage = $('#flightMessage');
  const flightResults = $('#flightResults');
  const depDateInput = $('#departure-date');
  const retDateInput = $('#return-date');
  const today = new Date().toISOString().split('T')[0];
  if (depDateInput) depDateInput.min = today;
  if (retDateInput) retDateInput.min = today;

  const FLIGHT_KEY = 'travelNepwayFlightsV1';
  const ADMIN_KEY = 'travelNepwayAdminAuthV1';
  const API_BASE = '';
  function apiHeaders(json=false){ const h={}; const t=sessionStorage.getItem('travelNepwayAdminTokenV4'); if(t) h.Authorization=`Bearer ${t}`; if(json) h['Content-Type']='application/json'; return h; }
  async function api(path, options={}){ const r=await fetch(API_BASE+path,{...options,headers:{...apiHeaders(Boolean(options.body)),...(options.headers||{})}}); const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.error||`Request failed (${r.status})`); return data; }
  async function syncFlightsFromServer(){ try { const flights=await api('/api/flights'); if(Array.isArray(flights)){ localStorage.setItem(FLIGHT_KEY,JSON.stringify(flights)); return flights; } } catch(_) {} return null; }
  syncFlightsFromServer();

  // DEMO DATA ONLY: these example fares/seat counts are not live or bookable inventory.
  const seedFlights = [
    {id:'TN-001', airline:'Nepal Airlines', number:'RA 201', from:'KTM', to:'DXB', date:today, depTime:'08:30', arrTime:'12:15', duration:'3h 45m', stops:'Direct', cabin:'Economy', price:42500, seats:18, active:true, featured:true},
    {id:'TN-002', airline:'Thai Airways', number:'TG 320', from:'KTM', to:'BKK', date:today, depTime:'10:05', arrTime:'14:55', duration:'4h 20m', stops:'Direct', cabin:'Economy', price:24500, seats:24, active:true, featured:true},
    {id:'TN-003', airline:'Qatar Airways', number:'QR 649', from:'KTM', to:'LHR', date:today, depTime:'02:15', arrTime:'09:45', duration:'11h 30m', stops:'1 Stop', cabin:'Economy', price:78200, seats:15, active:true, featured:true},
    {id:'TN-004', airline:'Emirates', number:'EK 2156', from:'KTM', to:'DXB', date:today, depTime:'19:10', arrTime:'22:00', duration:'4h 05m', stops:'Direct', cabin:'Economy', price:46800, seats:20, active:true, featured:false},
    {id:'TN-005', airline:'Turkish Airlines', number:'TK 727', from:'KTM', to:'LHR', date:today, depTime:'07:35', arrTime:'17:20', duration:'12h 15m', stops:'1 Stop', cabin:'Economy', price:83500, seats:12, active:true, featured:false}
  ];

  function getFlights() {
    try {
      const saved = JSON.parse(localStorage.getItem(FLIGHT_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    localStorage.setItem(FLIGHT_KEY, JSON.stringify(seedFlights));
    return [...seedFlights];
  }
  function saveFlights(flights) { localStorage.setItem(FLIGHT_KEY, JSON.stringify(flights)); return Promise.all(flights.map(f=>api('/api/flights',{method:'PUT',body:JSON.stringify(f)}))).catch(()=>null); }
  function airportLabel(code) {
    for (const group of AIRPORTS) for (const [value,label] of group.items) if (value === code) return label.replace(/\s*\([A-Z]{3}\)$/, '');
    return code;
  }
  function routeLabel(f) { return `${airportLabel(f.from)} → ${airportLabel(f.to)}`; }
  function flightResultsForSearch(from, to, date) {
    return getFlights().filter(f => f.active && f.from === from && f.to === to && f.date === date && Number(f.seats) > 0)
      .sort((a,b) => Number(a.price) - Number(b.price));
  }

  flightForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const dep = $('#departure').value;
    const dest = $('#destination').value;
    const depDate = depDateInput.value;
    const retDate = retDateInput.value;
    const pax = parseInt($('#passengers').value, 10);
    if (!dep || !dest) return setMessage(flightMessage, '⚠ Please select both departure and destination cities.', 'error');
    if (dep === dest) return setMessage(flightMessage, '⚠ Departure and destination cannot be the same.', 'error');
    if (!depDate) return setMessage(flightMessage, '⚠ Please choose a departure date.', 'error');
    if (new Date(depDate) < new Date(today)) return setMessage(flightMessage, '⚠ Departure date cannot be in the past.', 'error');
    if (retDate && new Date(retDate) < new Date(depDate)) return setMessage(flightMessage, '⚠ Return date must be after departure date.', 'error');
    if (!pax || pax < 1 || pax > 10) return setMessage(flightMessage, '⚠ Passengers must be between 1 and 10.', 'error');

    setMessage(flightMessage, '🔎 Searching our managed flight inventory…', '');
    setTimeout(() => {
      const matches = flightResultsForSearch(dep, dest, depDate).filter(f => Number(f.seats) >= pax);
      const depLabel = departureSel.options[departureSel.selectedIndex].text;
      const destLabel = destinationSel.options[destinationSel.selectedIndex].text;
      flightResults.hidden = false;
      flightResults.innerHTML = `
        <h4 style="font-family:'Inter',sans-serif;font-size:1rem;margin-bottom:.25rem;">${matches.length} flight${matches.length === 1 ? '' : 's'} · ${depLabel} → ${destLabel}</h4>
        <p style="font-size:.85rem;color:var(--muted);margin-bottom:.75rem;">${depDate}${retDate ? ' – ' + retDate : ''} · ${pax} passenger${pax > 1 ? 's' : ''}</p>`;
      if (!matches.length) {
        flightResults.innerHTML += `<div class="flight-item"><div class="flight-airline">No scheduled flights found.<small>Try another date or route, or contact Travel Nepway for a fare request.</small></div><a class="btn btn-outline" href="https://wa.me/9779851363710" target="_blank" rel="noopener">WhatsApp Us</a></div>`;
      } else {
        matches.forEach(f => {
          const item = document.createElement('div');
          item.className = 'flight-item';
          item.innerHTML = `
            <div class="flight-airline"><strong>${f.airline}</strong> · ${f.number}<small>${f.cabin} · ${f.stops} · ${f.seats} seats left</small></div>
            <div class="flight-times">${f.depTime} <i class="fa-solid fa-arrow-right" style="color:var(--primary)"></i> ${f.arrTime}<small>· ${f.duration}</small></div>
            <div class="flight-price">${formatNPR(Number(f.price) * pax)}<small>${formatNPR(Number(f.price))} / passenger</small></div>
            <button class="btn btn-outline" data-book-id="${f.id}">Select</button>`;
          flightResults.appendChild(item);
        });
        $$('[data-book-id]', flightResults).forEach(btn => btn.addEventListener('click', () => {
          const f = getFlights().find(x => x.id === btn.dataset.bookId);
          if (!f) return;
          setMessage(flightMessage, `✅ ${f.airline} ${f.number} selected. Contact us on WhatsApp or phone to confirm the booking.`, 'success');
          btn.textContent = 'Selected ✓'; btn.disabled = true;
          window.open(`https://wa.me/9779851363710?text=${encodeURIComponent(`Flight enquiry: ${f.airline} ${f.number}, ${f.from} to ${f.to}, ${f.date}, ${pax} passenger(s).`)}`, '_blank');
        }));
      }
      setMessage(flightMessage, '');
    }, 350);
  });

  /* ============================
     Deal "Book" buttons
     ============================ */
  $$('.book-flight-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.flight;
      // Scroll to flight form + prefill message
      document.getElementById('flights')?.scrollIntoView({ behavior: 'smooth' });
      setMessage(flightMessage, `✈ Selected deal: ${route}. Fill the form below to confirm.`, 'success');
    });
  });

  /* ============================
     Flight management admin
     ============================ */
  const adminLink = $('#adminLink');
  const adminSection = $('#flight-management');
  const adminModal = $('#adminModal');
  const adminLoginView = $('#adminLoginView');
  const flightEditorView = $('#flightEditorView');
  const adminLoginForm = $('#adminLoginForm');
  const flightEditorForm = $('#flightEditorForm');
  const adminTable = $('#adminFlightTable');
  const adminEmpty = $('#adminEmpty');
  const adminCount = $('#adminFlightCount');

  function isAdmin() { return sessionStorage.getItem(ADMIN_KEY) === '1' && !!sessionStorage.getItem('travelNepwayAdminTokenV4'); }
  function openAdminModal() {
    adminModal.hidden = false; adminModal.setAttribute('aria-hidden','false');
    adminLoginView.hidden = isAdmin(); flightEditorView.hidden = !isAdmin();
    if (isAdmin()) showAdminSection();
  }
  function closeAdminModal() { adminModal.hidden = true; adminModal.setAttribute('aria-hidden','true'); }
  function showAdminSection() {
    if (!adminSection) return;
    adminSection.hidden = false;
    renderAdminFlights();
    adminSection.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function resetFlightEditor() {
    flightEditorForm?.reset();
    $('#flightId').value = '';
    $('#flightDate').value = today;
    $('#flightSeats').value = 20;
    $('#flightActive').checked = true;
    $('#flightEditorTitle').textContent = 'Add Flight';
    setMessage($('#flightEditorMessage'), '');
  }
  function populateEditorAirports() {
    ['#flightFrom','#flightTo'].forEach(sel => {
      const el=$(sel); if (!el || el.options.length) return;
      populateAirports(el);
    });
  }
  function openEditor(flight) {
    populateEditorAirports();
    if (!flight) { resetFlightEditor(); }
    else {
      $('#flightEditorTitle').textContent = 'Edit Flight';
      Object.entries({flightId:flight.id,flightAirline:flight.airline,flightNumber:flight.number,flightFrom:flight.from,flightTo:flight.to,flightDate:flight.date,flightDepTime:flight.depTime,flightArrTime:flight.arrTime,flightDuration:flight.duration,flightStops:flight.stops,flightCabin:flight.cabin,flightPrice:flight.price,flightSeats:flight.seats}).forEach(([id,val])=>{const el=$('#'+id);if(el)el.value=val;});
      $('#flightActive').checked=!!flight.active; $('#flightFeatured').checked=!!flight.featured;
      setMessage($('#flightEditorMessage'), '');
    }
    adminLoginView.hidden=true; flightEditorView.hidden=false;
    adminModal.hidden=false; adminModal.setAttribute('aria-hidden','false');
  }
  function renderAdminFlights() {
    const flights=getFlights();
    if (adminCount) adminCount.textContent=`${flights.length} flight${flights.length===1?'':'s'}`;
    if (!adminTable) return;
    adminTable.innerHTML='';
    adminEmpty.hidden=flights.length>0;
    flights.sort((a,b)=>(a.date+a.depTime).localeCompare(b.date+b.depTime)).forEach(f=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><strong>${f.airline}</strong><br><small>${f.number}</small></td><td>${f.from} → ${f.to}</td><td>${f.date}</td><td>${f.depTime}–${f.arrTime}<br><small>${f.duration}</small></td><td>${f.stops}</td><td>${formatNPR(Number(f.price))}</td><td><span class="admin-status ${f.active?'active':'inactive'}">${f.active?'Active':'Inactive'}</span></td><td><button class="admin-action" data-edit="${f.id}" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="admin-action" data-toggle="${f.id}" title="Activate/Deactivate"><i class="fa-solid fa-power-off"></i></button><button class="admin-action" data-delete="${f.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></td>`;
      adminTable.appendChild(tr);
    });
    $$('[data-edit]',adminTable).forEach(b=>b.onclick=()=>openEditor(getFlights().find(f=>f.id===b.dataset.edit)));
    $$('[data-toggle]',adminTable).forEach(b=>b.onclick=()=>{const fs=getFlights();const f=fs.find(x=>x.id===b.dataset.toggle);if(f){f.active=!f.active;localStorage.setItem(FLIGHT_KEY,JSON.stringify(fs));api('/api/flights',{method:'PUT',body:JSON.stringify(f)}).then(renderAdminFlights).catch(err=>setMessage($('#adminLoginMessage'),'⚠ '+err.message,'error'));}});
    $$('[data-delete]',adminTable).forEach(b=>b.onclick=()=>{if(!confirm('Delete this flight from the inventory?'))return; localStorage.setItem(FLIGHT_KEY,JSON.stringify(getFlights().filter(f=>f.id!==b.dataset.delete))); api('/api/flights/'+encodeURIComponent(b.dataset.delete),{method:'DELETE'}).then(renderAdminFlights).catch(err=>setMessage($('#adminLoginMessage'),'⚠ '+err.message,'error'));});
  }

  $('#openAdminPageLogin')?.addEventListener('click', openAdminModal);
  adminLink?.addEventListener('click',e=>{ if (adminLink.getAttribute('href') === '#') { e.preventDefault(); openAdminModal(); } });
  $$('[data-close-admin]').forEach(el=>el.addEventListener('click',closeAdminModal));
  $('#addFlightBtn')?.addEventListener('click',()=>openEditor());
  $('#adminLogout')?.addEventListener('click',()=>{sessionStorage.removeItem(ADMIN_KEY);sessionStorage.removeItem('travelNepwayAdminTokenV4');adminSection.hidden=true;closeAdminModal();});
  adminLoginForm?.addEventListener('submit',async e=>{
    e.preventDefault();
    const u=$('#adminUsername').value.trim(), p=$('#adminPassword').value;
    try {
      const result=await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:u,password:p})});
      sessionStorage.setItem(ADMIN_KEY,'1'); sessionStorage.setItem('travelNepwayAdminTokenV4',result.token);
      adminLoginView.hidden=true; flightEditorView.hidden=true; closeAdminModal(); showAdminSection(); setMessage($('#adminLoginMessage'),'');
    } catch(err) { setMessage($('#adminLoginMessage'),'⚠ '+err.message,'error'); }
  });
  flightEditorForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const f={id:$('#flightId').value||`TN-${Date.now()}`,airline:$('#flightAirline').value.trim(),number:$('#flightNumber').value.trim(),from:$('#flightFrom').value,to:$('#flightTo').value,date:$('#flightDate').value,depTime:$('#flightDepTime').value,arrTime:$('#flightArrTime').value,duration:$('#flightDuration').value.trim(),stops:$('#flightStops').value,cabin:$('#flightCabin').value,price:Number($('#flightPrice').value),seats:Number($('#flightSeats').value),active:$('#flightActive').checked,featured:$('#flightFeatured').checked};
    if(!f.airline||!f.number||!f.from||!f.to||f.from===f.to||!f.date||!f.depTime||!f.arrTime||!f.duration||!f.price||f.seats<0)return setMessage($('#flightEditorMessage'),'⚠ Please complete all flight fields. Price must be greater than 0.','error');
    const fs=getFlights(), i=fs.findIndex(x=>x.id===f.id); if(i>=0)fs[i]=f;else fs.push(f); localStorage.setItem(FLIGHT_KEY,JSON.stringify(fs));
    api('/api/flights',{method:'PUT',body:JSON.stringify(f)}).then(()=>{closeAdminModal(); showAdminSection();}).catch(err=>setMessage($('#flightEditorMessage'),'⚠ '+err.message,'error'));
  });

  /* ============================
     Flight request via email
     ============================ */
  const flightRequestForm = $('#flightRequestForm');
  const flightRequestMessage = $('#flightRequestMessage');
  const requestDeparture = $('#requestDeparture');
  const requestReturn = $('#requestReturn');
  const today2 = new Date().toISOString().split('T')[0];
  if (requestDeparture) requestDeparture.min = today2;
  if (requestReturn) requestReturn.min = today2;
  flightRequestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = $('#requestFrom')?.value.trim(), to = $('#requestTo')?.value.trim();
    const departure = requestDeparture?.value, ret = requestReturn?.value;
    const passengers = $('#requestPassengers')?.value, cabin = $('#requestCabin')?.value;
    const name = $('#requestName')?.value.trim(), email = $('#requestEmail')?.value.trim(), phone = $('#requestPhone')?.value.trim();
    const note = $('#requestNote')?.value.trim();
    if (!from || !to || !departure || !name || !email || !phone) return setMessage(flightRequestMessage, '⚠ Please complete the required fields, including your contact number.', 'error');
    if (from.toLowerCase() === to.toLowerCase()) return setMessage(flightRequestMessage, '⚠ Departure and destination cannot be the same.', 'error');
    if (ret && new Date(ret) < new Date(departure)) return setMessage(flightRequestMessage, '⚠ Return date must be after departure date.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage(flightRequestMessage, '⚠ Please enter a valid email address.', 'error');
    if (!/^[+()\d\s.-]{7,20}$/.test(phone)) return setMessage(flightRequestMessage, '⚠ Please enter a valid contact number.', 'error');
    const ref = createReference('Flight');
    const record = {ref, type:'Flight', status:'Received', createdAt:new Date().toISOString(), data:{from,to,departure,returnDate:ret||'One way',passengers,cabin,name,email,phone,note}};
    const subject = `Flight Request ${ref} - ${from} to ${to} - ${departure}`;
    const body = [`Hello Travel Nepway & Tours,`,``,`I would like to request a flight fare:`,`Reference: ${ref}`,`From: ${from}`,`To: ${to}`,`Departure: ${departure}`,`Return: ${ret || 'One way'}`,`Passengers: ${passengers}`,`Cabin: ${cabin}`,`Name: ${name}`,`Customer Email: ${email}`,`Contact Number: ${phone}`,`Additional Request: ${note || 'None'}`,``,`Please send me the best available airfare and options.`,``,`Thank you,`,name].join('\n');
    try {
      await saveEnquiry(record);
      setMessage(flightRequestMessage, `✅ Reference ${ref} created. Opening your email request…`, 'success');
      window.location.href = `mailto:official@travelnepway.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (_) {
      setMessage(flightRequestMessage, `⚠ We could not save the request online. Please use WhatsApp or email us directly.`, 'error');
    }
  });

  /* ============================
     Smart enquiry references + WhatsApp forms
     ============================ */
  function createReference(type) {
    const prefix = type === 'Tour' ? 'TOUR' : type === 'Visa' ? 'VISA' : type === 'Flight' ? 'FLT' : 'REQ';
    return `TN-${prefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  function saveEnquiry(record) {
    const key = 'travelNepwayEnquiriesV1';
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    all.unshift(record); localStorage.setItem(key, JSON.stringify(all.slice(0, 50)));
    return api('/api/enquiries',{method:'POST',body:JSON.stringify(record)});
  }
  function whatsappEnquiry(form) {
    const type = form.dataset.type || 'Travel';
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.phone || !data.destination) return null;
    const ref = createReference(type);
    saveEnquiry({ref, type, status:'Received', createdAt:new Date().toISOString(), data});
    const lines = [`Hello Travel Nepway & Tours,`,``,`${type} enquiry`, `Reference: ${ref}`, `Name: ${data.name}`, `Phone/WhatsApp: ${data.phone}`, `Destination: ${data.destination}`];
    Object.entries(data).forEach(([k,v]) => { if (!['name','phone','destination'].includes(k) && v) lines.push(`${k}: ${v}`); });
    const url = `https://wa.me/9779851363710?text=${encodeURIComponent(lines.join('\\n'))}`;
    return {ref,url};
  }
  $$('.smart-enquiry-form').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const result = whatsappEnquiry(form);
    const msg = $('[data-form-message]', form);
    if (!result) return setMessage(msg, '⚠ Please complete your name, phone and destination.', 'error');
    setMessage(msg, `✅ Reference ${result.ref} created. Opening WhatsApp…`, 'success');
    setTimeout(() => window.open(result.url, '_blank', 'noopener'), 150);
  }));

  /* ---- Currency converter (planning rates only) ---- */
  const fxRates = {NPR:1, USD:0.00745, AED:0.02735, THB:0.251, JPY:1.10, GBP:0.00555, AUD:0.0114};
  const fxAmount=$('#fxAmount'), fxFrom=$('#fxFrom'), fxTo=$('#fxTo'), fxResult=$('#fxResult');
  function updateFX(){
    if (!fxAmount || !fxFrom || !fxTo || !fxResult) return;
    const amount=Number(fxAmount.value)||0;
    const npr=amount/fxRates[fxFrom.value];
    const converted=npr*fxRates[fxTo.value];
    fxResult.textContent=`${amount.toLocaleString()} ${fxFrom.value} ≈ ${converted.toLocaleString(undefined,{maximumFractionDigits:2})} ${fxTo.value}`;
  }
  [fxAmount,fxFrom,fxTo].forEach(el=>el?.addEventListener('input',updateFX));
  updateFX();

  /* ---- Enquiry tracker ---- */
  $('#trackBtn')?.addEventListener('click', async () => {
    const code=$('#trackingCode').value.trim().toUpperCase(); const out=$('#trackResult');
    if(!code) return;
    try { const item=await api('/api/enquiries/'+encodeURIComponent(code)); const date=new Date(item.createdAt).toLocaleString(); out.innerHTML=`<div class="track-card"><div><span class="eyebrow">${item.type}</span><h3>${item.ref}</h3><p>Received on ${date}</p></div><span class="admin-status active">${item.status}</span></div>`; }
    catch(_) { out.innerHTML='<div class="track-empty"><i class="fa-solid fa-circle-info"></i><strong>No enquiry found</strong><span>Check the reference number or contact Travel Nepway directly.</span></div>'; }
  });

  /* ============================
     Contact form
     ============================ */
  const contactForm = $('#contactForm');
  const contactMessage = $('#contactMessage');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const subject = $('#subject').value.trim() || 'Website enquiry';
    const message = $('#message').value.trim();
    if (!name) return setMessage(contactMessage, '⚠ Please enter your name.', 'error');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage(contactMessage, '⚠ Please enter a valid email address.', 'error');
    if (!message) return setMessage(contactMessage, '⚠ Please write a message.', 'error');
    const body = [`Hello Travel Nepway & Tours,`,``,`Name: ${name}`,`Customer Email: ${email}`,``,`${message}`].join('\n');
    window.location.href = `mailto:official@travelnepway.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage(contactMessage, '✅ Your email is ready to send.', 'success');
  });

  /* ============================
     Newsletter form
     ============================ */
  const newsletterForm = $('#newsletterForm');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input');
    if (!input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      input.style.outline = '2px solid #dc2626';
      setTimeout(() => (input.style.outline = ''), 1500);
      return;
    }
    input.value = '';
    input.placeholder = '✅ Subscribed!';
    setTimeout(() => (input.placeholder = 'Your email'), 2500);
  });

  /* ============================
     Hero search → scroll to form
     ============================ */
  const heroSearch = $('#heroSearch');
  heroSearch?.addEventListener('submit', (e) => {
    e.preventDefault();
    const from = $('#heroFrom').value.trim(), to = $('#heroTo').value.trim(), date = $('#heroDate').value, pax = $('#heroPax').value;
    if (!from || !to || !date) { alert('Please fill in From, To, and Departure date.'); return; }
    if (from.toLowerCase() === to.toLowerCase()) { alert('From and To cannot be the same.'); return; }
    const subject = `Flight Request - ${from} to ${to} - ${date}`;
    const body = [`Hello Travel Nepway & Tours,`,``,`Please provide an airfare quote:`,`From: ${from}`,`To: ${to}`,`Departure: ${date}`,`Passengers: ${pax}`,``,`Thank you.`].join('\n');
    window.location.href = `mailto:official@travelnepway.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});