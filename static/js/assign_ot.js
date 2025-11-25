// static/js/assign_ot.js
async function loadMaterials(){
  const res = await fetch('/materials/?limit=500');
  const items = await res.json();
  const sel = document.getElementById('sap_select');
  sel.innerHTML = '';
  items.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.sap;
    opt.text = `${m.sap} — ${m.breve_descripcion}`;
    sel.appendChild(opt);
  });
}

async function loadTecnicosSelect(){
  const res = await fetch('/tecnicos/');
  const items = await res.json();
  const sel = document.getElementById('tec_select');
  sel.innerHTML = '<option value="">--Sin técnico--</option>';
  items.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.text = `${t.id} — ${t.nombre}`;
    sel.appendChild(opt);
  });
}

async function loadOts(){
  const res = await fetch('/ots/');
  const items = await res.json();
  const ul = document.getElementById('ots_list');
  ul.innerHTML = '';
  items.slice().reverse().slice(0,20).forEach(ot => {
    const li = document.createElement('li');
    li.innerText = `${ot.id_ot} | SAP: ${ot.sap_id} | Tec: ${ot.id_tecnico} | Pendiente: ${ot.pendiente}`;
    ul.appendChild(li);
  });
}

document.getElementById('ot-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id_ot = document.getElementById('id_ot').value.trim();
  const sap_id = document.getElementById('sap_select').value;
  const id_tecnico = document.getElementById('tec_select').value || null;
  const cantidad = Number(document.getElementById('cantidad').value) || 1;
  if(!id_ot || !sap_id) return alert('ID_OT y SAP son requeridos');

  const payload = { id_ot, sap_id, id_tecnico: id_tecnico ? Number(id_tecnico) : null, cantidad };
  const res = await fetch('/ots/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  if(res.ok){
    alert('OT creada');
    document.getElementById('id_ot').value='';
    loadOts();
  } else {
    const err = await res.json();
    alert(err.detail || 'Error creando OT');
  }
});

(async function init(){
  await loadMaterials();
  await loadTecnicosSelect();
  await loadOts();
})();
