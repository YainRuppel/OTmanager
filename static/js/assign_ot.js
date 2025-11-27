// static/js/assign_ot.js

async function loadMaterials(){
  const res = await fetch('/materials/?limit=500');
  const items = await res.json();
  const sel = document.getElementById('sap_select');
  sel.innerHTML = '';
  items.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.sap;
    opt.text = `${m.sap} — ${m.breve_descripcion || ''}`;
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

  // mostramos las 20 últimas (invertidas)
  items.slice().reverse().slice(0,20).forEach(ot => {
    const li = document.createElement('li');

    // Formato legible y mostrando procesoIntermedio + observaciones
    const paso = ot.procesoIntermedio ? 'Sí' : 'No';
    const pendiente = ot.pendiente ? 'Sí' : 'No';
    const obs = ot.observaciones ? ` | Obs: ${ot.observaciones}` : '';

    li.innerText = `${ot.id_ot} | SAP: ${ot.sap_id} | Tec: ${ot.id_tecnico || '-'} | Pendiente: ${pendiente} | Paso intermedio: ${paso}${obs}`;
    ul.appendChild(li);
  });
}

// Manejo del form para crear OT
// Manejo del form para crear OT
document.getElementById('ot-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  console.log("Enviando formulario…"); //debug

  const submitBtn = document.querySelector('#ot-form button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Creando...';

  const sap_id = document.getElementById('sap_select').value;
  const id_tecnico = document.getElementById('tec_select').value || null;
  const cantidad = Number(document.getElementById('cantidad').value) || 1;
  const procesoIntermedio = document.getElementById('procesoIntermedio').checked;
  const observaciones = document.getElementById('observaciones').value.trim() || null;

  if(!sap_id){
    alert('SAP es requerido');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Crear OT';
    return;
  }

  const payload = {
    sap_id,
    id_tecnico: id_tecnico ? Number(id_tecnico) : null,
    cantidad,
    procesoIntermedio,
    observaciones
  };

  console.log("Payload a enviar:", payload);

  try {
    const res = await fetch('/ots/', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch(e){}

    console.log("Fetch status:", res.status, "Respuesta:", parsed || text);

    if (res.ok) {
      console.log("OT creada correctamente");
      alert('OT creada');
      document.getElementById('cantidad').value = '1';
      document.getElementById('procesoIntermedio').checked = false;
      document.getElementById('observaciones').value = '';
      loadOts();
    } else {
      if (parsed && parsed.detail) {
        console.error("Detalle de validación:", parsed.detail);
        alert("Error: " + JSON.stringify(parsed.detail, null, 2));
      } else {
        alert("Error creando OT: " + (text || res.status));
      }
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert('Error en la petición. Mirá la consola.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Crear OT';
  }
});


// inicialización
(async function init(){
  await loadMaterials();
  await loadTecnicosSelect();
  await loadOts();
})();
