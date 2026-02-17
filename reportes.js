// ===============================
//  MÓDULO DE REPORTES (CORREGIDO)
// ===============================

document.addEventListener("DOMContentLoaded", () => {

if (localStorage.getItem("rol") === "lector") {
    document.getElementById("report-type").style.display = "none";
    document.getElementById("btn-generar-reporte").style.display = "none";
}
if (localStorage.getItem("rol") === "editor") {
    document.getElementById("report-type").style.display = "none";
    document.getElementById("btn-generar-reporte").style.display = "none";
}


    // Eventos del panel
    document.getElementById("report-type").addEventListener("change", filtrarSegunReporte);
    document.getElementById("btn-generar-reporte").addEventListener("click", generarReporte);

    // ---------------------------------------------
    // FILTRAR TABLA SEGÚN TIPO DE REPORTE
    // ---------------------------------------------
    function filtrarSegunReporte() {
        const tipo = document.getElementById("report-type").value;

        if (!tipo) {
            tabla.clearFilter();
            return;
        }

        // 🔥 Filtro correcto que NO rompe los filtros del header
        tabla.setFilter([
            { field: "TipoMisa", type: "=", value: tipo },
            { field: "MisaImpresa", type: "in", value: [false, undefined, null, ""] }
        ]);
    }

    // ---------------------------------------------
    // GENERAR REPORTE SEGÚN TIPO
    // ---------------------------------------------
    function generarReporte() {
        const tipo = document.getElementById("report-type").value;
        const seleccionadas = tabla.getSelectedData();

        if (!tipo) {
            alert("Seleccione un tipo de reporte.");
            return;
        }

        if (seleccionadas.length === 0) {
            alert("Seleccione al menos una misa.");
            return;
        }

        if (tipo === "G") return generarReporteG(seleccionadas);
        if (tipo === "M") return generarReporteM(seleccionadas);
        if (tipo === "L") return generarReporteL(seleccionadas);
        if (tipo === "F") return generarReporteF(seleccionadas);
        if (tipo === "N") return generarReporteN(seleccionadas);
    }

    // ---------------------------------------------
// REPORTE G — 30 DÍAS (1 misa por hoja)
// ---------------------------------------------
function generarReporteG(misas) {
    if (misas.length !== 1) {
        alert("Para misas tipo G debe seleccionar exactamente UNA misa.");
        return;
    }

    const misa = misas[0];

    if (!misa.FechaFija) {
        alert("La misa seleccionada no tiene FechaFija.");
        return;
    }

    // ⭐ Construcción segura de fecha
    const [y, m, d] = misa.FechaFija.split("-");
    const fechaInicio = new Date(y, m - 1, d);

    const fechas = [];
    for (let i = 0; i < 30; i++) {
        const f = new Date(fechaInicio);
        f.setDate(f.getDate() + i);
        fechas.push(f);
    }

    const filas = [];
    for (let i = 0; i < 6; i++) {
        filas.push(fechas.slice(i * 5, i * 5 + 5));
    }

    // ⭐ Fecha fin = última fecha de la serie
    const fechaFin = fechas[fechas.length - 1];

    // ⭐ Formatos de fecha
    const fInicioStr = fechaInicio.toLocaleDateString("es-ES");
    const fFinStr = fechaFin.toLocaleDateString("es-ES");

    let html = `
<html>
<head>
<title>Reporte Gregoriano</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: Arial, sans-serif; }

h1 {
    text-align: center;
    margin-bottom: 10px;
    font-size: 24px;
}

.section-title {
    font-weight: bold;
    color: #2a4fa3;
    margin-top: 12px;
    margin-bottom: 3px;
}




/* Cuadrícula de 3 columnas por fila */
.info-grid {
    display: flex;
    width: 100%;
    margin-top: 10px;
    margin-bottom: 5px;
}

/* Cada cuadrante */
.info-box {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #000;
    font-size: 14px;
    box-sizing: border-box;
    min-height: 60px;
}

/* Etiqueta */
.info-title {
    font-weight: bold;
    color: #2a4fa3;
    margin-bottom: 4px;
    font-size: 14px;
}






.info-line {
    margin: 3px 0;
    font-size: 15px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

td {
    border: 1px solid #000;
    padding: 12px;
    vertical-align: top;
    font-size: 14px;
    min-width: 140px;
    height: 120px;
}
</style>
</head>
<body>

<h1>MISAS GREGORIANAS</h1>

<!-- Fila 1 -->
<div class="info-grid">
    <div class="info-box">
        <div class="info-title">Fecha Solicitud</div>
        ${misa.FechaSolicitud || ""}
    </div>

    <div class="info-box">
        <div class="info-title">Intenciones</div>
        ${misa.Intenciones || ""}
    </div>

    <div class="info-box">
        <div class="info-title">Solicitante</div>
        ${misa.Contacto || ""}
    </div>
</div>

<!-- Fila 2 -->
<div class="info-grid">
    <div class="info-box">
        <div class="info-title">Fecha Inicio</div>
        ${fInicioStr}
    </div>

    <div class="info-box">
        <div class="info-title">Fecha Fin</div>
        ${fFinStr}
    </div>

    <div class="info-box">
        <div class="info-title">Celebrante</div>
        ${misa.Celebrante || ""}
    </div>
</div>

<table>
`;

    filas.forEach(fila => {
        html += "<tr>";
        fila.forEach(f => {
            const fecha = f.toLocaleDateString("es-ES");
            html += `<td>${fecha} &nbsp;&nbsp; :</td>`;
        });
        html += "</tr>";
    });

    html += `
</table>

</body>
</html>
`;

    abrirVentanaImpresion(html, [misa.MisaID]);
}


// ---------------------------------------------
// REPORTE M — (1 hoja por celebrante por hoja)
// ---------------------------------------------
function generarReporteM(misas) {
    if (misas.length !== 1) {
        alert("Para misas tipo M debe seleccionar exactamente UNA misa.");
        return;
    }

    const misa = misas[0];

    // ============================
    // 1) VALIDAR CAMPOS
    // ============================
    if (!misa.Celebrante) {
        alert("El campo Celebrante debe tener formato: celeb1/celeb2/celeb3");
        return;
    }

    const celebrantes = misa.Celebrante
        .split("/")
        .map(s => s.trim())
        .filter(s => s.length > 0);

    if (celebrantes.length === 0) {
        alert("Celebrante debe contener nombres separados por '/'. Ej: Juan/Pedro/Miguel");
        return;
    }

    // ============================
    // 2) PARSEAR CANTIDADES
    // ============================
    let cantidades = [];

    if (celebrantes.length === 1) {
        cantidades = [parseInt(misa.NumeroMisas, 10)];

        if (isNaN(cantidades[0]) || cantidades[0] < 1) {
            alert("NumeroMisas debe ser un número válido mayor o igual a 1.");
            return;
        }

    } else {
        if (!misa.Observaciones) {
            alert("Observaciones debe tener formato: 10/8/12");
            return;
        }

        cantidades = misa.Observaciones
            .split("/")
            .map(n => parseInt(n.trim(), 10))
            .filter(n => !isNaN(n));

        if (cantidades.length !== celebrantes.length) {
            alert("La cantidad de misas no coincide con la cantidad de celebrantes.");
            return;
        }
    }

    // ============================
    // 3) GENERAR TODAS LAS HOJAS EN UN SOLO HTML
    // ============================
    let html = `
<html>
<head>
<title>Reporte M</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: Arial, sans-serif; }

h1 {
    text-align: center;
    margin-bottom: 10px;
    font-size: 24px;
}

/* Cuadrícula de 2 columnas */
.info-grid-2 {
    display: flex;
    width: 100%;
    margin-top: 10px;
    margin-bottom: 5px;
}

.info-box-2 {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #000;
    font-size: 14px;
    box-sizing: border-box;
    min-height: 60px;
}

.info-title-2 {
    font-weight: bold;
    color: #2a4fa3;
    margin-bottom: 4px;
    font-size: 14px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

td {
    border: 1px solid #000;
    padding: 12px;
    vertical-align: top;
    font-size: 16px;
    text-align: center;
    min-width: 140px;
    height: 120px;
}

.page-break {
    page-break-after: always;
}
</style>
</head>
<body">
`;

    // ============================
    // 4) UNA HOJA POR CELEBRANTE
    // ============================
    cantidades.forEach((cantidad, index) => {
        const celebrante = celebrantes[index];

        const numeros = Array.from({ length: cantidad }, (_, i) => i + 1);

        const filas = [];
        for (let i = 0; i < Math.ceil(cantidad / 5); i++) {
            filas.push(numeros.slice(i * 5, i * 5 + 5));
        }

        html += `
<h1>MISAS</h1>

<!-- Fila 1 -->
<div class="info-grid-2">
    <div class="info-box-2">
        <div class="info-title-2">Fecha Solicitud</div>
        ${misa.FechaSolicitud || ""}
    </div>

    <div class="info-box-2">
        <div class="info-title-2">Intenciones</div>
        ${misa.Intenciones || ""}
    </div>
</div>

<!-- Fila 2 -->
<div class="info-grid-2">
    <div class="info-box-2">
        <div class="info-title-2">Fecha Inicio</div>
        ${misa.FechaFija || ""}
    </div>

    <div class="info-box-2">
        <div class="info-title-2">Celebrante</div>
        ${celebrante}
    </div>
</div>

<table>
`;

        filas.forEach(fila => {
            html += "<tr>";
            fila.forEach(num => {
                html += `<td>${num}</td>`;
            });
            html += "</tr>";
        });

        html += `
</table>

<div class="page-break"></div>
`;
    });

    html += `
</body>
</html>
`;

    // ============================
    // 5) ABRIR UNA SOLA VENTANA
    // ============================
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.document.title = "Reporte M";

    win.focus();
    win.print();

    marcarImpresa(misa.MisaID);

    setTimeout(() => window.cargarFichas(), 500);
}



// ---------------------------------------------
// REPORTE L — LISTADO LIBRE
// ---------------------------------------------
function generarReporteL(misas) {

    let html = `
<html>
<head>
<title>Reporte Tipo L</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: Arial, sans-serif; }

h1 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 5px;
}

h2 {
    text-align: center;
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 15px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

th, td {
    border: 1px solid #000;
    padding: 6px;
    font-size: 13px;
}

th {
    background: #e0e7ff;
}
</style>
</head>
<body>

<h1>Misa</h1>
<h2>Celebrante: ${misas[0].Celebrante || ""}</h2>

<table>
<tr>
    <th>Fecha Solicitud</th>
    <th>Fecha Fija</th>
    <th>Intenciones</th>
    <th>Fecha de Celebración</th>
</tr>
`;

    misas.forEach(m => {
        html += `
<tr>
    <td>${m.FechaSolicitud || ""}</td>
    <td>${m.FechaFija || ""}</td>
    <td>${m.Intenciones || ""}</td>
    <td></td>
</tr>`;
    });

    html += `
</table>

</body>
</html>
`;

    abrirVentanaImpresion(html, misas.map(m => m.MisaID));
}
    


// ---------------------------------------------
// REPORTE F — FILTRADO POR FECHA FIJA
// ---------------------------------------------

function generarReporteF(seleccionadas) {

    if (seleccionadas.length === 0) {
        alert("Debe seleccionar al menos una misa.");
        return;
    }

    // ⭐ 1) Validar que todas tengan la misma FechaFija
    const fechas = [...new Set(seleccionadas.map(m => m.FechaFija))];

    if (fechas.length > 1) {
        alert("Las misas seleccionadas tienen diferentes valores en FechaFija. Filtre primero por fecha.");
        return;
    }

    const fechaFija = fechas[0];
    const celebrante = seleccionadas[0].Celebrante || "";

    let html = `
<html>
<head>
<title>Reporte Tipo F</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: Arial, sans-serif; }

h1 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 5px;
}

h2 {
    text-align: center;
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 15px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

th, td {
    border: 1px solid #000;
    padding: 6px;
    font-size: 13px;
}

th {
    background: #e0e7ff;
}
</style>
</head>
<body>

<h1>Misa</h1>
<h2>Celebrante: ${celebrante}</h2>

<table>
<tr>
    <th>Fecha Solicitud</th>
    <th>Fecha Fija</th>
    <th>Intenciones</th>
    <th>Fecha de Celebración</th>
</tr>
`;

    seleccionadas.forEach(m => {
        html += `
<tr>
    <td>${m.FechaSolicitud || ""}</td>
    <td>${m.FechaFija || ""}</td>
    <td>${m.Intenciones || ""}</td>
    <td></td>
</tr>`;
    });

    html += `
</table>

</body>
</html>
`;

    abrirVentanaImpresion(html, seleccionadas.map(m => m.MisaID));
}


// ---------------------------------------------
// REPORTE N — NOTIFICACIÓN "NOMBRAR"
// ---------------------------------------------
function generarReporteN(seleccionadas) {

    if (seleccionadas.length === 0) {
        alert("Debe seleccionar al menos una misa.");
        return;
    }

    // ⭐ 1) Validar que todas tengan la misma FechaFija
    const fechas = [...new Set(seleccionadas.map(m => m.FechaFija))];

    if (fechas.length > 1) {
        alert("Las misas seleccionadas tienen diferentes valores en FechaFija. Filtre primero por fecha.");
        return;
    }

    const fechaFija = fechas[0];

    let html = `
<html>
<head>
<title>Reporte Tipo N</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: Arial, sans-serif; }

h1 {
    text-align: center;
    font-size: 26px;
    margin-bottom: 5px;
}

.linea-info {
    text-align: center;
    font-size: 18px;
    margin: 3px 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

th, td {
    border: 1px solid #000;
    padding: 6px;
    font-size: 18px; 
    height: 80px;           /* ⭐ LÍNEA MÁS ANCHA */

}

th {
    background: #e0e7ff;
}
</style>
</head>
<body>

<h1>Nombrar</h1>

<div class="linea-info">Fecha: ${fechaFija}</div>
<div class="linea-info">Misas</div>

<table>
<tr>
    <th>Detalle</th>
</tr>
`;

    // ⭐ 2) Por cada fila: "Misa Observaciones Intenciones"
    seleccionadas.forEach(m => {
        const obs = m.Observaciones || "";
        const inten = m.Intenciones || "";

        html += `
<tr>
    <td> ${obs} ${inten}</td>
</tr>`;
    });

    html += `
</table>

</body>
</html>
`;

    abrirVentanaImpresion(html, seleccionadas.map(m => m.MisaID));
}

// ---------------------------------------------
// ABRIR VENTANA E IMPRIMIR + MARCAR IMPRESAS
// ---------------------------------------------
function abrirVentanaImpresion(html, ids) {
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();

    win.document.title = "Reporte de Misas";

    win.focus();
    win.print();

    ids.forEach(id => marcarImpresa(id));

    setTimeout(() => window.cargarFichas(), 500);
}

async function marcarImpresa(id) {

if (localStorage.getItem("rol") === "lector") return;


    await fetch(`${API}/fichas/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
            MisaImpresa: true,
            ModificadoPor: localStorage.getItem("userID")
        })
    });
}

// ======================================================
//  ANALISIS DE DATOS — GRAFICOS + TABLAS PIVOT + SLICER
// ======================================================
document.getElementById("btn-analisis").addEventListener("click", generarAnalisis);

function generarAnalisis() {

    const datosOriginales = tabla.getData();

    if (datosOriginales.length === 0) {
        alert("No hay datos cargados.");
        return;
    }

    // Abrimos ventana
    const win = window.open("", "_blank");

    // ============================
    // HTML BASE
    // ============================
    win.document.write(`
<html>
<head>
<title>Análisis de Misas</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body { font-family: Arial; padding: 20px; }
h1 { text-align:center; }
h2 { margin-top: 25px; color:#2a4fa3; }

table { width:100%; border-collapse:collapse; margin-top:10px; }
th, td { border:1px solid #000; padding:6px; text-align:center; }
th { background:#e0e7ff; }

.graf-row {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
}

.canvas-box {
    width: 300px;
    height: 200px;
}

/* ⭐ SLICER */
.slicer {
    text-align:center;
    margin-bottom:20px;
}
.slicer button {
    padding:8px 15px;
    margin:5px;
    border:1px solid #2a4fa3;
    background:#e0e7ff;
    cursor:pointer;
    border-radius:5px;
}
.slicer button:hover {
    background:#cdd6ff;
}
</style>
</head>
<body>

<h1>Análisis de Misas</h1>

<div class="slicer" id="slicer"></div>

<div id="graficos"></div>
<div id="tablas"></div>

</body>
</html>
`);

    win.document.close();

    // Esperar a que cargue el DOM de la ventana
    win.onload = () => iniciarDashboard(win, datosOriginales);
}




/* ============================================================
   ANALISIS DE DATOS — SLICER MÉTRICA + SLICER AÑOS + KPIs +
   GRAFICOS + TABLAS PIVOT + TABLA EXPANDIBLE AÑO → MES × TIPO
   ============================================================ */

let metricaSeleccionada = "NumeroMisas"; // default

document.getElementById("btn-analisis").addEventListener("click", generarAnalisis);

function generarAnalisis() {

    const datosOriginales = tabla.getData();

    if (datosOriginales.length === 0) {
        alert("No hay datos cargados.");
        return;
    }

    const win = window.open("", "_blank");

    win.document.write(`
<html>
<head>
<title>Análisis de Misas</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body { font-family: Arial; padding: 20px; }
h1 { text-align:center; }
h2 { margin-top: 25px; color:#2a4fa3; }

table { width:100%; border-collapse:collapse; margin-top:10px; }
th, td { border:1px solid #000; padding:6px; text-align:center; }
th { background:#e0e7ff; }

/* ⭐ BARRA SUPERIOR DE SLICERS */
.slicer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

/* ⭐ SLICER MÉTRICA (izquierda) */
.slicer-metrica button {
    padding:8px 15px;
    margin-right:5px;
    border:1px solid #2a4fa3;
    background:#e0e7ff;
    cursor:pointer;
    border-radius:5px;
}
.slicer-metrica button.active {
    background:#2a4fa3;
    color:white;
}

/* ⭐ SLICER AÑOS (derecha) */
.slicer-anios button {
    padding:8px 15px;
    margin-left:5px;
    border:1px solid #2a4fa3;
    background:#e0e7ff;
    cursor:pointer;
    border-radius:5px;
}
.slicer-anios button.active {
    background:#2a4fa3;
    color:white;
}

/* ⭐ GRAFICOS EN FILA */
.graf-row {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
}
.canvas-box {
    width: 300px;
    height: 200px;
}

/* ⭐ TARJETAS KPI */
.kpi-row {
    display:flex;
    justify-content:center;
    gap:20px;
    margin-bottom:25px;
}
.kpi {
    background:#eef2ff;
    border:1px solid #c3c8ff;
    padding:15px;
    width:180px;
    text-align:center;
    border-radius:8px;
}
.kpi h3 {
    margin:0;
    font-size:14px;
    color:#2a4fa3;
}
.kpi p {
    margin:5px 0 0;
    font-size:22px;
    font-weight:bold;
}

/* ⭐ FILAS EXPANDIBLES */
.mes-row {
    background:#f7f7ff;
}
.mes-label {
    padding-left:25px;
    text-align:left;
}
.expand-btn {
    cursor:pointer;
    font-weight:bold;
    margin-right:5px;
}
</style>
</head>
<body>

<h1>Análisis de Misas</h1>

<div id="kpis"></div>
<div id="graficos"></div>
<div id="tablas"></div>

</body>
</html>
`);

    win.document.close();

    win.onload = () => iniciarDashboard(win, datosOriginales);
}

/* ============================================================
   FUNCIÓN CENTRAL DE VALOR SEGÚN MÉTRICA
   ============================================================ */
function obtenerValor(m) {
    if (metricaSeleccionada === "NumeroMisas") {
        return parseFloat(m.NumeroMisas || 0);
    } else {
        return parseFloat(m.Donativo || 0);
    }
}

//bbbbbbbb

function formatearValor(valor) {
    const num = Number(valor) || 0;

    if (metricaSeleccionada === "Donativo") {
        return num.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €";
    }

    return num.toLocaleString("es-ES");
}

//bbbbbbbbb

/* ============================================================
   CREAR BARRA SUPERIOR DE SLICERS
   ============================================================ */
function crearBarraSlicers(win, años, datosOriginales) {

    const barra = win.document.createElement("div");
    barra.className = "slicer-bar";

    // SLICER MÉTRICA (izquierda)
    const slicerMetrica = win.document.createElement("div");
    slicerMetrica.className = "slicer-metrica";

    slicerMetrica.innerHTML = `
        <button id="metricaMisas" class="active">Número de Misas</button>
        <button id="metricaDonativos">Donativos</button>
    `;

    // SLICER AÑOS (derecha)
    const slicerAnios = win.document.createElement("div");
    slicerAnios.className = "slicer-anios";

    slicerAnios.innerHTML = `
        <button data-year="ALL" class="active">TODOS</button>
        ${años.map(a => `<button data-year="${a}">${a}</button>`).join("")}
    `;

    barra.appendChild(slicerMetrica);
    barra.appendChild(slicerAnios);

    const kpisDiv = win.document.getElementById("kpis");
    win.document.body.insertBefore(barra, kpisDiv);

    // EVENTOS MÉTRICA
    const btnMisas = win.document.getElementById("metricaMisas");
    const btnDon = win.document.getElementById("metricaDonativos");

    btnMisas.onclick = () => {
        metricaSeleccionada = "NumeroMisas";
        btnMisas.classList.add("active");
        btnDon.classList.remove("active");
        win.renderDashboard();
    };

    btnDon.onclick = () => {
        metricaSeleccionada = "Donativo";
        btnDon.classList.add("active");
        btnMisas.classList.remove("active");
        win.renderDashboard();
    };

    // EVENTOS AÑOS
    let seleccionados = ["ALL"];

    slicerAnios.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {

            const year = btn.getAttribute("data-year");

            if (year === "ALL") {
                seleccionados = ["ALL"];
                slicerAnios.querySelectorAll("button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            } else {

                if (seleccionados.includes("ALL")) seleccionados = [];

                if (seleccionados.includes(year)) {
                    seleccionados = seleccionados.filter(x => x !== year);
                    btn.classList.remove("active");
                } else {
                    seleccionados.push(year);
                    btn.classList.add("active");
                }

                if (seleccionados.length === 0) {
                    seleccionados = ["ALL"];
                    slicerAnios.querySelector('[data-year="ALL"]').classList.add("active");
                } else {
                    slicerAnios.querySelector('[data-year="ALL"]').classList.remove("active");
                }
            }

            const datosFiltrados =
                seleccionados.includes("ALL")
                    ? datosOriginales
                    : datosOriginales.filter(m =>
                        m.FechaFija && seleccionados.includes(m.FechaFija.split("-")[0])
                    );

            win.renderDashboard(datosFiltrados);
        };
    });

    return seleccionados;
}

/* ============================================================
   INICIALIZAR DASHBOARD
   ============================================================ */
function iniciarDashboard(win, datosOriginales) {

    const años = [...new Set(
        datosOriginales.filter(m => m.FechaFija).map(m => m.FechaFija.split("-")[0])
    )].sort();

    crearBarraSlicers(win, años, datosOriginales);

    win.renderDashboard = (datos = datosOriginales) => {
        renderDashboard(win, datos);
    };

    win.renderDashboard(datosOriginales);
}

/* ============================================================
   RENDERIZAR TODO EL DASHBOARD
   ============================================================ */
function renderDashboard(win, datos) {

    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

    const porAnio = {};
    const porMes = {};
    const porTipo = {};
    const tipoPorAnio = {};

    datos.forEach(m => {
        if (!m.FechaFija) return;

        const [anio, mesStr] = m.FechaFija.split("-");
        const mes = parseInt(mesStr, 10) - 1;
        const tipo = m.TipoMisa;

        const valor = obtenerValor(m);

        porAnio[anio] = (porAnio[anio] || 0) + valor;

        if (!porMes[anio]) porMes[anio] = Array(12).fill(0);
        porMes[anio][mes] += valor;

        porTipo[tipo] = (porTipo[tipo] || 0) + valor;

        if (!tipoPorAnio[anio]) tipoPorAnio[anio] = {};
        if (!tipoPorAnio[anio][mes]) tipoPorAnio[anio][mes] = {};
        tipoPorAnio[anio][mes][tipo] = (tipoPorAnio[anio][mes][tipo] || 0) + valor;
    });

    /* ===================== KPIs ===================== */
    const totalValor = Object.values(porAnio).reduce((a,b)=>a+b,0);
    const totalAnios = Object.keys(porAnio).length;

    const promedioMensual = Math.round(totalValor / 12);

    const mesMasValor = (() => {
        const totales = Array(12).fill(0);
        Object.values(porMes).forEach(arr => arr.forEach((v, i) => totales[i] += v));
        const max = Math.max(...totales);
        return max > 0 ? meses[totales.indexOf(max)] : "-";
    })();

    const tipoMasFrecuente = Object.entries(porTipo)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    win.document.getElementById("kpis").innerHTML = `
<div class="kpi-row">
    <div class="kpi"><h3>Total</h3><p>${formatearValor(totalValor)}</p></div>
    <div class="kpi"><h3>Años seleccionados</h3><p>${formatearValor(totalAnios)}</p></div>
    <div class="kpi"><h3>Promedio mensual</h3><p>${formatearValor(promedioMensual)}</p></div>
    <div class="kpi"><h3>Mes con mayor valor</h3><p>${mesMasValor}</p></div>
    <div class="kpi"><h3>Tipo más frecuente</h3><p>${tipoMasFrecuente}</p></div>
</div>
`;

    /* ===================== GRAFICOS ===================== */
    win.document.getElementById("graficos").innerHTML = `
<div class="graf-row">

    <div class="canvas-box">
        <h2 style="text-align:center; font-size:16px;">Por Año</h2>
        <canvas id="grafAnio"></canvas>
    </div>

    <div class="canvas-box">
        <h2 style="text-align:center; font-size:16px;">Mes por Año</h2>
        <canvas id="grafMesAnio"></canvas>
    </div>

    <div class="canvas-box">
        <h2 style="text-align:center; font-size:16px;">Por Tipo</h2>
        <canvas id="grafTipo"></canvas>
    </div>

</div>
`;

    // Barras por año
    new win.Chart(win.document.getElementById('grafAnio'), {
        type: 'bar',
        data: {
            labels: Object.keys(porAnio),
            datasets: [{
                label: metricaSeleccionada,
                data: Object.values(porAnio),
                backgroundColor: "#4e79a7"
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Lineas mes × año
    const coloresAnios = [
        "#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f",
        "#edc948","#b07aa1","#ff9da7","#9c755f","#bab0ab"
    ];

    const datasetsMesAnio = Object.keys(porMes).map((anio, idx) => ({
        label: anio,
        data: porMes[anio],
        borderWidth: 2,
        fill: false,
        borderColor: coloresAnios[idx % coloresAnios.length]
    }));

    new win.Chart(win.document.getElementById('grafMesAnio'), {
        type: 'line',
        data: {
            labels: meses,
            datasets: datasetsMesAnio
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Pie por tipo
    new win.Chart(win.document.getElementById('grafTipo'), {
        type: 'pie',
        data: {
            labels: Object.keys(porTipo),
            datasets: [{
                data: Object.values(porTipo),
                backgroundColor: [
                    '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f'
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    /* ===================== TABLAS ===================== */
    let htmlTablas = "";

    // Tabla Año × Tipo
    htmlTablas += `
<h2>Total por Año y Tipo de Misa</h2>
<table>
<tr>
    <th>Año</th>
    <th>G</th>
    <th>M</th>
    <th>L</th>
    <th>F</th>
    <th>N</th>
    <th>Total</th>
</tr>
`;

    let totalG = 0, totalM = 0, totalL = 0, totalF = 0, totalN = 0;

    Object.keys(tipoPorAnio).sort().forEach(anio => {

        let g = 0, m = 0, l = 0, f = 0, n = 0;

        Object.keys(tipoPorAnio[anio]).forEach(mesIdx => {
            const tiposMes = tipoPorAnio[anio][mesIdx];
            g += tiposMes["G"] || 0;
            m += tiposMes["M"] || 0;
            l += tiposMes["L"] || 0;
            f += tiposMes["F"] || 0;
            n += tiposMes["N"] || 0;
        });

        const totalFila = g + m + l + f + n;

        totalG += g;
        totalM += m;
        totalL += l;
        totalF += f;
        totalN += n;

        htmlTablas += `
<tr>
    <td>${anio}</td>
    <td>${formatearValor(g)}</td>
    <td>${formatearValor(m)}</td>
    <td>${formatearValor(l)}</td>
    <td>${formatearValor(f)}</td>
    <td>${formatearValor(n)}</td>
    <td><strong>${formatearValor(totalFila)}</strong></td>
</tr>`;
    });

    const totalGeneral = totalG + totalM + totalL + totalF + totalN;

    htmlTablas += `
<tr style="background:#d0d7ff; font-weight:bold;">
    <td>TOTAL</td>
    <td>${formatearValor(totalG)}</td>
    <td>${formatearValor(totalM)}</td>
    <td>${formatearValor(totalL)}</td>
    <td>${formatearValor(totalF)}</td>
    <td>${formatearValor(totalN)}</td>
    <td>${formatearValor(totalGeneral)}</td>
</tr>
</table>
`;

    // Tabla expandible Año → Mes × Tipo
    htmlTablas += `
<h2>Detalle por Año → Mes × Tipo</h2>
<table id="tablaExpandible">
<tr>
    <th>Año</th>
    <th>Mes</th>
    <th>G</th>
    <th>M</th>
    <th>L</th>
    <th>F</th>
    <th>N</th>
    <th>Total</th>
</tr>
`;

    Object.keys(tipoPorAnio).sort().forEach(anio => {

        let gAnio = 0, mAnio = 0, lAnio = 0, fAnio = 0, nAnio = 0;

        Object.keys(tipoPorAnio[anio]).forEach(mesIdx => {
            const tiposMes = tipoPorAnio[anio][mesIdx];
            gAnio += tiposMes["G"] || 0;
            mAnio += tiposMes["M"] || 0;
            lAnio += tiposMes["L"] || 0;
            fAnio += tiposMes["F"] || 0;
            nAnio += tiposMes["N"] || 0;
        });

        const totalAnio = gAnio + mAnio + lAnio + fAnio + nAnio;

        htmlTablas += `
<tr class="anio-row" data-anio="${anio}">
    <td><span class="expand-btn" data-anio="${anio}">[ + ]</span> ${anio}</td>
    <td></td>
    <td>${formatearValor(gAnio)}</td>
    <td>${formatearValor(mAnio)}</td>
    <td>${formatearValor(lAnio)}</td>
    <td>${formatearValor(fAnio)}</td>
    <td>${formatearValor(nAnio)}</td>
    <td><strong>${formatearValor(totalAnio)}</strong></td>
</tr>
`;

        // Filas de meses
        for (let i = 0; i < 12; i++) {
            const tiposMes = tipoPorAnio[anio][i] || {};
            const g = tiposMes["G"] || 0;
            const m = tiposMes["M"] || 0;
            const l = tiposMes["L"] || 0;
            const f = tiposMes["F"] || 0;
            const n = tiposMes["N"] || 0;
            const totalMes = g + m + l + f + n;

            if (totalMes === 0) continue;

            htmlTablas += `
<tr class="mes-row mes-${anio}" style="display:none;">
    <td></td>
    <td class="mes-label">${meses[i]}</td>
    <td>${formatearValor(g)}</td>
    <td>${formatearValor(m)}</td>
    <td>${formatearValor(l)}</td>
    <td>${formatearValor(f)}</td>
    <td>${formatearValor(n)}</td>
    <td><strong>${formatearValor(totalMes)}</strong></td>
</tr>
`;
        }
    });

    htmlTablas += `</table>`;

    win.document.getElementById("tablas").innerHTML = htmlTablas;

    // Eventos expandir / colapsar
    win.document.querySelectorAll(".expand-btn").forEach(btn => {
        btn.onclick = () => {
            const anio = btn.getAttribute("data-anio");
            const filas = win.document.querySelectorAll(`.mes-${anio}`);
            const expandido = btn.textContent.includes("-");

            if (expandido) {
                btn.textContent = "[ + ]";
                filas.forEach(f => f.style.display = "none");
            } else {
                btn.textContent = "[ - ]";
                filas.forEach(f => f.style.display = "table-row");
            }
        };
    });
}




});