// admin_ots.js - cliente para /ui/admin_ots

async function fetchPending(sap='', tec='') {
  const params = new URLSearchParams();
  if (sap) params.append('sap', sap);
  if (tec) params.append('tec', tec);
  const url = '/admin/ots/pending' + (params.toString() ? `?${params.toString()}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error fetching pending');
  return await res.json();
}

async function fetchClosed() {
  const res = await fetch('/admin/ots/closed');
  if (!res.ok) throw new Error('Error fetching closed');
  return await res.json();
}

async function fetchSummary() {
  const res = await fetch('/admin/ots/summary');
  if (!res.ok) throw new Error('Error fetching summary');
  return await res.json();
}

function rowTemplate(ot) {
  // crea <tr> DOM para una OT
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="border:1px solid #ddd; padding:6px;">${ot.id}</td>
    <td style="border:1px solid #ddd; padding:6px;">${ot.id_ot || ('#' + ot.id)}</td>
    <td style="border:1px solid #ddd; padding:6px;">${ot.sap_id || '-'}</td>
    <td style="border:1px solid #ddd; padding:6px;">${ot.cantidad || 1}</td>
    <td style="border:1px solid #ddd; padding:6px;">${ot.id_tecnico || '-'}</td>
    <td style="border:1px solid #ddd; padding:6px;">${ot.inicio ? new Date(ot.inicio).toLocaleString() : '-'}</td>
    <td style="border:1px solid #ddd; padding:6px;">
      <button class="btn-close" data-id="${ot.id}">Cerrar</button>
      <button class="btn-edit" data-id="${ot.id}">Editar</button>
    </td>
  `;
  return tr;
}

async function loadPending() {
  try {
    const sap = document.getElementById('admin_filter_sap').value.trim();
    const tec = document.getElementById('admin_filter_tec').value.trim();
    const items = await fetchPending(sap, tec);
    const tbody = document.querySelector('#admin_pending_table tbody');
    tbody.innerHTML = '';
    items.forEach(ot => {
      const r = rowTemplate(ot);
      tbody.appendChild(r);
    });
    // attach handlers
    document.querySelectorAll('.btn-close').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Cerrar OT #' + id + ' ?')) return;
      try {
        const res = await fetch(`/admin/ots/${id}/close`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(()=>({detail:'Error'}));
          alert('Error: ' + (err.detail || res.status));
          return;
        }
        alert('OT cerrada');
        await reloadAll();
      } catch (err) {
        console.error(err); alert('Error en cierre (ver consola)');
      }
    }));

    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      // edit: preguntar observaciones y pendiente
      const obs = prompt('Nueva observación (vacío = no cambiar):');
      const pendienteStr = prompt('Pendiente? (true/false) dejar vacío para no cambiar:');
      const payload = {};
      if (obs !== null && obs !== '') payload.observaciones = obs;
      if (pendienteStr === 'true' || pendienteStr === 'false') payload.pendiente = (pendienteStr === 'true');
      if (Object.keys(payload).length === 0) return;
      try {
        const res = await fetch(`/admin/ots/${id}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(()=>({detail:'Error'}));
          alert('Error: ' + (err.detail || res.status));
          return;
        }
        alert('OT actualizada');
        await reloadAll();
      } catch (err) {
        console.error(err); alert('Error actualizando OT');
      }
    }));

  } catch (err) {
    console.error('loadPending error', err);
  }
}

async function loadClosed() {
  try {
    const items = await fetchClosed();
    const ul = document.getElementById('admin_closed_list');
    ul.innerHTML = '';
    items.forEach(ot => {
      const li = document.createElement('li');
      li.textContent = `${ot.id_ot || ot.id} | SAP: ${ot.sap_id} | Tec: ${ot.id_tecnico || '-'} | Fin: ${ot.fin ? new Date(ot.fin).toLocaleString() : '-'}`;
      ul.appendChild(li);
    });
  } catch (err) { console.error('loadClosed', err); }
}

async function loadSummary() {
  try {
    const items = await fetchSummary();
    const ul = document.getElementById('admin_summary');
    ul.innerHTML = '';
    items.forEach(r => {
      const li = document.createElement('li');
      li.textContent = `${r.sap_id} — ${r.total} OT(s) con procesoIntermedio`;
      ul.appendChild(li);
    });
  } catch (err) { console.error('loadSummary', err); }
}

async function reloadAll() {
  await Promise.all([loadPending(), loadClosed(), loadSummary()]);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin_apply_filters').addEventListener('click', (e) => { e.preventDefault(); loadPending(); });
  document.getElementById('admin_clear_filters').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('admin_filter_sap').value=''; document.getElementById('admin_filter_tec').value=''; loadPending(); });
  reloadAll();
});
