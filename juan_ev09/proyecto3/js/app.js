// ===== Datos =====
const ESTADOS = ["Pendiente", "En proceso", "Completada"];
const CLAVE = "taskflow_tareas";

let tareas = [];
let siguienteId = 1;

// ===== Elementos del DOM =====
const form = document.getElementById("formTarea");
const lista = document.getElementById("listaTareas");
const mensajeVacio = document.getElementById("mensajeVacio");
const filtroEstado = document.getElementById("filtroEstado");
const filtroPrioridad = document.getElementById("filtroPrioridad");

// ===== Almacenamiento (el navegador conserva los datos al recargar) =====
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(tareas)); } catch (e) { /* sin almacenamiento */ }
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(datos)) return datos;
  } catch (e) { /* datos inválidos */ }
  return [
    { id: 1, nombre: "Diseñar la interfaz", descripcion: "Boceto de las pantallas principales", responsable: "Laura Gómez", prioridad: "Alta", fecha: "2026-10-30", estado: "En proceso" },
    { id: 2, nombre: "Revisar requisitos", descripcion: "Validar el alcance con el cliente", responsable: "Carlos Ruiz", prioridad: "Media", fecha: "2026-11-05", estado: "Pendiente" },
    { id: 3, nombre: "Configurar repositorio", descripcion: "Crear repositorio y ramas base", responsable: "Ana Torres", prioridad: "Baja", fecha: "2026-10-20", estado: "Completada" }
  ];
}

// ===== Utilidades =====
function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

function clase(texto) {
  return texto.toLowerCase().replace(/ /g, "");
}

function crearCelda(etiqueta, contenido) {
  const td = document.createElement("td");
  td.dataset.label = etiqueta;
  if (contenido instanceof Node) td.appendChild(contenido);
  else td.textContent = contenido;
  return td;
}

function crearBadge(texto, claseCss) {
  const span = document.createElement("span");
  span.className = `badge ${claseCss}`;
  span.textContent = texto;
  return span;
}

// ===== Indicadores =====
function actualizarIndicadores() {
  const contar = (estado) => tareas.filter((t) => t.estado === estado).length;
  document.getElementById("totalTareas").textContent = tareas.length;
  document.getElementById("totalPendientes").textContent = contar("Pendiente");
  document.getElementById("totalProceso").textContent = contar("En proceso");
  document.getElementById("totalCompletadas").textContent = contar("Completada");
}

// ===== Listado =====
function mostrarTareas() {
  const estado = filtroEstado.value;
  const prioridad = filtroPrioridad.value;

  const visibles = tareas.filter((t) =>
    (estado === "Todos" || t.estado === estado) &&
    (prioridad === "Todas" || t.prioridad === prioridad)
  );

  lista.innerHTML = "";
  mensajeVacio.hidden = visibles.length > 0;

  visibles.forEach((t) => {
    const tr = document.createElement("tr");

    const celdaNombre = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = t.nombre;
    const desc = document.createElement("span");
    desc.className = "task-desc";
    desc.textContent = t.descripcion;
    celdaNombre.append(titulo, desc);

    const acciones = document.createElement("div");
    acciones.style.display = "flex";
    acciones.style.gap = "6px";
    acciones.style.flexWrap = "wrap";

    const btnAvanzar = document.createElement("button");
    btnAvanzar.className = "btn small avanzar";
    btnAvanzar.textContent = t.estado === "Completada" ? "Reiniciar" : "Avanzar →";
    btnAvanzar.addEventListener("click", () => cambiarEstado(t.id));

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn small eliminar";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarTarea(t.id));

    acciones.append(btnAvanzar, btnEliminar);

    tr.append(
      crearCelda("Nombre", celdaNombre),
      crearCelda("Responsable", t.responsable),
      crearCelda("Prioridad", crearBadge(t.prioridad, clase(t.prioridad))),
      crearCelda("Fecha", formatearFecha(t.fecha)),
      crearCelda("Estado", crearBadge(t.estado, "st-" + clase(t.estado))),
      crearCelda("Acciones", acciones)
    );
    lista.appendChild(tr);
  });

  actualizarIndicadores();
}

// ===== Acciones =====
function cambiarEstado(id) {
  const tarea = tareas.find((t) => t.id === id);
  const indice = ESTADOS.indexOf(tarea.estado);
  tarea.estado = ESTADOS[(indice + 1) % ESTADOS.length];
  guardar();
  mostrarTareas();
}

function eliminarTarea(id) {
  const tarea = tareas.find((t) => t.id === id);
  if (confirm(`¿Seguro que deseas eliminar la actividad "${tarea.nombre}"?`)) {
    tareas = tareas.filter((t) => t.id !== id);
    guardar();
    mostrarTareas();
  }
}

// ===== Validación del formulario =====
function mostrarError(idCampo, idError, mensaje) {
  document.getElementById(idError).textContent = mensaje;
  document.getElementById(idCampo).classList.toggle("invalid", mensaje !== "");
  return mensaje === "";
}

function validarFormulario() {
  const nombre = document.getElementById("nombre").value.trim();
  const responsable = document.getElementById("responsable").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const fecha = document.getElementById("fecha").value;

  const okNombre = mostrarError("nombre", "errNombre", nombre.length < 3 ? "Mínimo 3 caracteres." : "");
  const okResp = mostrarError("responsable", "errResponsable", responsable.length < 3 ? "Indica el responsable." : "");
  const okDesc = mostrarError("descripcion", "errDescripcion", descripcion.length < 5 ? "Escribe una descripción (mín. 5 caracteres)." : "");
  const okFecha = mostrarError("fecha", "errFecha", fecha === "" ? "Selecciona la fecha límite." : "");

  return okNombre && okResp && okDesc && okFecha;
}

// ===== Eventos =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  tareas.push({
    id: siguienteId++,
    nombre: document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    responsable: document.getElementById("responsable").value.trim(),
    prioridad: document.getElementById("prioridad").value,
    fecha: document.getElementById("fecha").value,
    estado: document.getElementById("estado").value
  });

  guardar();
  form.reset();
  mostrarTareas();
});

filtroEstado.addEventListener("change", mostrarTareas);
filtroPrioridad.addEventListener("change", mostrarTareas);

// ===== Inicio =====
tareas = cargar();
siguienteId = tareas.reduce((max, t) => Math.max(max, t.id), 0) + 1;
mostrarTareas();
