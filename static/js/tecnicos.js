// static/js/tecnicos.js
async function loadTecnicos(){
  const res = await fetch('/tecnicos/');
  const list = await res.json();
  const tbody = document.querySelector('#tbl tbody');
  tbody.innerHTML = '';
  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.id}</td><td contenteditable="false">${t.nombre}</td>
      <td>
        <button data-id="${t.id}" class="edit">Editar</button>
        <button data-id="${t.id}" class="delete">Borrar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('create-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  if(!nombre) return alert('Nombre requerido');
  const res = await fetch('/tecnicos/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nombre})});
  if(res.ok){
    document.getElementById('nombre').value='';
    loadTecnicos();
  } else {
    const err = await res.json();
    alert(err.detail || 'Error');
  }
});

document.querySelector('#tbl').addEventListener('click', async (e)=>{
  if(e.target.classList.contains('delete')){
    const id = e.target.dataset.id;
    if(!confirm('Borrar técnico?')) return;
    const res = await fetch(`/tecnicos/${id}`, {method: 'DELETE'});
    if(res.ok) loadTecnicos(); else alert('Error borrando');
  } else if(e.target.classList.contains('edit')){
    const id = e.target.dataset.id;
    const tr = e.target.closest('tr');
    const nombreCell = tr.children[1];
    const current = nombreCell.innerText;
    const nuevo = prompt('Nuevo nombre', current);
    if(nuevo && nuevo.trim()){
      const res = await fetch(`/tecnicos/${id}`, {
        method: 'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({nombre: nuevo.trim()})
      });
      if(res.ok) loadTecnicos();
      else {
        const err = await res.json();
        alert(err.detail || 'Error actualizando');
      }
    }
  }
});

// inicializar
loadTecnicos();
