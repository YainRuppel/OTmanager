// static/js/assign_ot.js - versión corregida y robusta

// configuración
const MIN_SAP = 3;
const DEBOUNCE_MS = 250;
const RESULTS_LIMIT = 50;

// helpers
function debounce(fn, ms = DEBOUNCE_MS) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function fetchMaterialsBySap(sap, q = '') {
  const params = new URLSearchParams();
  if (sap) params.append('sap', sap);
  if (q) params.append('q', q);
  params.append('limit', String(RESULTS_LIMIT));
  const url = '/materials/' + (params.toString() ? `?${params.toString()}` : '');
  console.log('fetch ->', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed ' + res.status);
  return await res.json();
}

// UI materials
function clearResultsUI() {
  const ul = document.getElementById('materials_results');
  if (ul) ul.innerHTML = '';
}

function fillSelectWithSingle(sap, breve = '') {
  const sel = document.getElementById('sap_select');
  if (!sel) return;
  let opt = Array.from(sel.options).find(o => o.value === sap);
  if (!opt) {
    opt = document.createElement('option');
    opt.value = sap;
    opt.text = `${sap} — ${breve}`;
    sel.appendChild(opt);
  }
  sel.value = sap;
  console.log('Selected SAP in select:', sap);
}

function showResults(items) {
  const ul = document.getElementById('materials_results');
  if (!ul) return;
  ul.innerHTML = '';
  if (!items || items.length === 0) return;

  items.forEach(item => {
    const sapVal = item.sap ?? item.sap_id ?? '';
    const desc = item.breve_descripcion ?? item.descripcion ?? '';
    const li = document.createElement('li');
    li.style.padding = '6px';
    li.style.borderBottom = '1px solid #eee';
    li.style.cursor = 'pointer';
    li.textContent = `${sapVal} — ${desc}`;
    li.dataset.sap = sapVal;
    li.addEventListener('click', () => {
      fillSelectWithSingle(sapVal, desc);
      ul.innerHTML = '';
    });
    ul.appendChild(li);
  });

  if (items.length === 1) {
    const only = items[0];
    const sapVal = only.sap ?? only.sap_id ?? '';
    fillSelectWithSingle(sapVal, only.breve_descripcion ?? only.descripcion ?? '');
  }
}

// búsqueda debounced
const onSearchSapInput = debounce(async () => {
  try {
    const input = document.getElementById('search_sap');
    const qInput = document.getElementById('search_q');
    if (!input) return;
    const sap = input.value.trim();
    const q = qInput ? qInput.value.trim() : '';

    // console log para depuración
    console.log('input sap length:', sap.length, 'value:', sap);

    if (!sap || sap.length < MIN_SAP) {
      clearResultsUI();
      return;
    }

    const items = await fetchMaterialsBySap(sap, q);
    console.log('items fetched:', items.length, items.slice(0,5));
    showResults(items);
  } catch (err) {
    console.error('search sap error', err);
  }
}, DEBOUNCE_MS);

// carga de técnicos y OTs
async function loadTecnicosSelect(){
  try {
    console.log('loadTecnicosSelect: llamando /tecnicos/');
    const res = await fetch('/tecnicos/');
    if (!res.ok) {
      console.error('loadTecnicosSelect: response NOT OK', res.status);
      return;
    }
    const items = await res.json();
    console.log('loadTecnicosSelect: recibidos', items.length, 'técnicos');
    const sel = document.getElementById('tec_select');
    if (!sel) {
      console.warn('loadTecnicosSelect: no se encontró #tec_select en el DOM');
      return;
    }
    sel.innerHTML = '<option value="">--Sin técnico--</option>';
    items.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.text = `${t.id} — ${t.nombre}`;
      sel.appendChild(opt);
    });
    console.log('loadTecnicosSelect: select poblado con', sel.options.length, 'opciones');
  } catch (err) {
    console.error('loadTecnicosSelect error:', err);
  }
}

async function loadOts(){
  try {
    console.log('loadOts: llamando /ots/');
    const res = await fetch('/ots/');
    if (!res.ok) {
      console.error('loadOts: response NOT OK', res.status);
      return;
    }
    const items = await res.json();
    const ul = document.getElementById('ots_list');
    if (!ul) {
      console.warn('loadOts: no existe #ots_list en el DOM');
      return;
    }
    ul.innerHTML = '';
    items.slice().reverse().slice(0,20).forEach(ot => {
      const li = document.createElement('li');
      const paso = ot.procesoIntermedio ? 'Sí' : 'No';
      const pendiente = ot.pendiente ? 'Sí' : 'No';
      const obs = ot.observaciones ? ` | Obs: ${ot.observaciones}` : '';
      li.innerText = `${ot.id_ot || ot.id} | SAP: ${ot.sap_id || ot.sap} | Tec: ${ot.id_tecnico || '-'} | Pendiente: ${pendiente} | Paso intermedio: ${paso}${obs}`;
      ul.appendChild(li);
    });
    console.log('OTs cargadas:', items.length);
  } catch (err) {
    console.error('Error cargando OTs', err);
  }
}

// bloque principal: listeners e inicialización
document.addEventListener("DOMContentLoaded", () => {
  // evitar ENTER que haga submit accidental al tipear en búsqueda
  const form = document.getElementById('ot-form');
  if (!form) {
    console.error('No se encontró #ot-form en el DOM. Revisá el template HTML.');
    return;
  }
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // si el foco está en un campo de búsqueda, evitar submit
      const active = document.activeElement;
      if (active && (active.id === 'search_sap' || active.id === 'search_q')) {
        e.preventDefault();
        return;
      }
    }
  });

  // input de búsqueda SAP
  const searchSap = document.getElementById('search_sap');
  const searchQ = document.getElementById('search_q');
  if (searchSap) searchSap.addEventListener('input', onSearchSapInput);
  if (searchQ) searchQ.addEventListener('input', debounce(onSearchSapInput, DEBOUNCE_MS));

  // limpiar resultados si el select cambia manualmente
  const sel = document.getElementById('sap_select');
  if (sel) sel.addEventListener('change', () => clearResultsUI());

  // submit del formulario (ahora seguro dentro del DOMContentLoaded)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const sap_id = document.getElementById('sap_select').value;
      const tec_id = document.getElementById('tec_select').value || null;
      const cantidad = Number(document.getElementById('cantidad').value) || 1;
      const obs = document.getElementById('observaciones').value.trim();
      const proceso = document.getElementById('procesoIntermedio').checked;

      if (!sap_id) {
        alert("Seleccioná un material SAP antes de crear la OT");
        return;
      }

      const id_ot = "OT-" + Date.now();
      const payload = {
       // id_ot,
        sap_id,
        id_tecnico: tec_id ? Number(tec_id) : null,
        cantidad,
        observaciones: obs || null,
        procesoIntermedio: proceso
      };

      console.log("Enviando OT:", payload);

      const res = await fetch("/ots/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error al crear OT", err);
        alert("Error: " + (err.detail || JSON.stringify(err)));
        return;
      }

      const ot = await res.json();
      console.log("OT creada:", ot);
      alert("OT creada correctamente");
      // limpiar campos básicos
      document.getElementById('cantidad').value = '1';
      document.getElementById('procesoIntermedio').checked = false;
      document.getElementById('observaciones').value = '';
      clearResultsUI();
      loadOts();
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error al crear OT. Mirá la consola.');
    }
  });

  // inicializamos selects y listas
  loadTecnicosSelect();
  loadOts();
});
