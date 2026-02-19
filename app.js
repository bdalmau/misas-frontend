const API = "https://misas-backend-nfoz.onrender.com";

/* ---------------------------------------------------------
   1) Mensajes personalizados de validación
--------------------------------------------------------- */
const mensajesValidacion = {
    required: "Este campo es obligatorio.",
    minLength: "El texto ingresado es demasiado corto.",
    maxLength: "El texto ingresado supera la longitud permitida.",
    min: "El valor ingresado es demasiado pequeño.",
    max: "El valor ingresado es demasiado grande.",
    email: "Has ingresado un correo con una estructura inválida.",
    in: "El valor ingresado no está permitido.",
};

/* ---------------------------------------------------------
   2) Validadores personalizados
--------------------------------------------------------- */
Tabulator.extendModule("validate", "validators", {
    email: function (cell, value) {
        if (!value) return true;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }
});

/* ---------------------------------------------------------
   3) Normalizar fechas
--------------------------------------------------------- */
function normalizarFecha(valor) {
    if (!valor) return "";
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

    if (valor instanceof Date) {
        const y = valor.getFullYear();
        const m = String(valor.getMonth() + 1).padStart(2, "0");
        const d = String(valor.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    return valor;
}

/* ---------------------------------------------------------
   4) Normalizar booleanos
--------------------------------------------------------- */
function normalizarBoolean(valor) {
    if (valor === "" || valor === null || valor === undefined) return false;
    return valor === true || valor === "true";
}

/* ---------------------------------------------------------
   5) Editor Flatpickr (para celdas)
--------------------------------------------------------- */
function flatpickrEditor(cell, onRendered, success, cancel) {
    const input = document.createElement("input");
    input.type = "text";
    input.style.width = "100%";

    onRendered(() => {
        flatpickr(input, {
            locale: "es",
            dateFormat: "Y-m-d",
            defaultDate: cell.getValue(),
            allowInput: true,
            onChange: (_, dateStr) => success(dateStr),
            onClose: () => { if (!input.value) cancel(); }
        });
        input.focus();
    });

    return input;
}

/* ---------------------------------------------------------
   6) HeaderFilter con Flatpickr (para filtros)
--------------------------------------------------------- */
function flatpickrHeaderFilter(cell, onRendered, success, cancel) {
    const input = document.createElement("input");
    input.type = "text";
    input.style.width = "100%";

    onRendered(() => {
        flatpickr(input, {
            locale: "es",
            dateFormat: "Y-m-d",
            allowInput: true,
            onChange: (_, dateStr) => success(dateStr)
        });
    });

    return input;
}

function limpiarPayload(ficha) {
    return {
        TipoMisa: ficha.TipoMisa,
        Intenciones: ficha.Intenciones,
        FechaSolicitud: ficha.FechaSolicitud,
        FechaFija: ficha.FechaFija,
        FechaCelebracion: ficha.FechaCelebracion,
        NumeroMisas: ficha.NumeroMisas,
        Donativo: ficha.Donativo,
        PagoRealizado: ficha.PagoRealizado,
        Observaciones: ficha.Observaciones,
        Celebrante: ficha.Celebrante,
        MisaAprobada: ficha.MisaAprobada,
        Contacto: ficha.Contacto,
        Email: ficha.Email,
        Telefono: ficha.Telefono,
        OtrosComentarios: ficha.OtrosComentarios,
        MisaImpresa: ficha.MisaImpresa
    };
}


/* ---------------------------------------------------------
   7) Generar copias optimizado (corrección Donativo)
--------------------------------------------------------- */
async function generarCopiasMisas(rowData, table) {

if (localStorage.getItem("rol") === "lector") {
    alert("No tienes permisos para generar copias.");
    return;
}


    const fechaBase = rowData.FechaFija;
    const numeroMisas = parseInt(rowData.NumeroMisas, 10);
    const tipo = document.getElementById("tipoRepeticionGlobal").value;

    if (!fechaBase) return alert("Debe seleccionar una FechaFija.");
    if (!numeroMisas || numeroMisas < 1) return alert("NumeroMisas debe ser mayor o igual a 1.");
    if (!tipo) return alert("Debe seleccionar un tipo de repetición.");

    let fecha = new Date(fechaBase);

    /* ⭐ CALCULAR DONATIVO UNITARIO */
    const donativoTotal = parseFloat(rowData.Donativo || 0);
    const donativoUnitario = numeroMisas > 0 ? (donativoTotal / numeroMisas) : 0;

    /* 1) Actualizar registro original */
    if (rowData.MisaID) {

        const payloadOriginal = limpiarPayload({
            ...rowData,
            NumeroMisas: 1,
            Donativo: donativoUnitario
        });

        await fetch(`${API}/fichas/${rowData.MisaID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                ...payloadOriginal,
                ModificadoPor: localStorage.getItem("userID")
            }),
        });

        const row = table.getRow(rowData.MisaID);
        if (row) row.update(payloadOriginal);
    }

    /* 2) Generar copias optimizado */
    table.blockRedraw();

    for (let i = 1; i < numeroMisas; i++) {

        let nuevo = { ...rowData };

        if (tipo === "dias consecutivos") fecha.setDate(fecha.getDate() + 1);
        else if (tipo === "semana consecutiva") fecha.setDate(fecha.getDate() + 7);
        else if (tipo === "mes consecutivo") fecha.setMonth(fecha.getMonth() + 1);

        nuevo.FechaFija = fecha.toISOString().split("T")[0];
        nuevo.NumeroMisas = 1;
        nuevo.Donativo = donativoUnitario;

        delete nuevo.MisaID;

        const payload = limpiarPayload(nuevo);

        const res = await fetch(`${API}/fichas/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                ...payload,
                CreadoPor: localStorage.getItem("userID"),
                ModificadoPor: localStorage.getItem("userID")
            }),
        });

        const data = await res.json();
        nuevo.MisaID = data.id;

        table.addRow(nuevo, true);
    }

    table.restoreRedraw();
}

/* ---------------------------------------------------------
   8) Columnas base
--------------------------------------------------------- */
const columnasBase = [
    {
        title: "⧉",
        formatter: () => "⧉",
        headerSort: false,
        hozAlign: "center",
        width: 40,
        frozen: true,
        cellClick: function(e, cell) {
            const rowData = cell.getRow().getData();
            generarCopiasMisas(rowData, cell.getTable());
        }
    },

    {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        hozAlign: "center",
        headerSort: false,
        width: 40,
        frozen: true
    },

    {
        title: "✖",
        field: "_delete",
        formatter: "buttonCross",
        width: 40,
        hozAlign: "center",
        headerSort: false,
        headerFilter: false,
        cellClick: async (e, cell) => {

if (localStorage.getItem("rol") === "lector") return;


            const row = cell.getRow().getData();
            if (!row.MisaID) return cell.getRow().delete();
            if (!confirm("¿Seguro que quieres borrar esta ficha?")) return;

            await fetch(`${API}/fichas/${row.MisaID}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            });

            cell.getRow().delete();
        },
        frozen: true
    },

    { title: "Tipo Misa", field: "TipoMisa", editor: "select", editorParams: { values: ["G", "M", "L", "F", "N"] }, validator: ["required", "in:G|M|L|F|N"], width: 80, headerFilter: "select", headerFilterParams: { values: [" ", "G", "M", "L", "F", "N"] }, frozen: true },

    { title: "Intenciones", field: "Intenciones", editor: "input", validator: ["required", "minLength:3", "maxLength:300"], width: 250, headerFilter: "input", frozen: true },

    { title: "ID", field: "MisaID", visible: false },

    { title: "Fecha Solicitud", field: "FechaSolicitud", editor: flatpickrEditor, width:115, validator: "required", headerFilter: flatpickrHeaderFilter },
    { title: "Fecha Fija", field: "FechaFija", width:90, editor: flatpickrEditor, headerFilter: flatpickrHeaderFilter },

    {
        title: "Fecha Celebracion",
        field: "FechaCelebracion",
        width:115,
        editor: flatpickrEditor,
        headerFilter: flatpickrHeaderFilter,
        validator: (cell, value) => {
            const row = cell.getRow().getData();
            if (!value || !row.FechaSolicitud) return true;
            return new Date(value) >= new Date(row.FechaSolicitud);
        }
    },

    { title: "Número de Misas", field: "NumeroMisas", editor: "number", validator: ["required", "min:1"], width: 100, headerFilter: "input" },
    { title: "Donativo Misa(s)", field: "Donativo", editor: "number", validator: ["min:0"], width: 100, headerFilter: "input" },

    {
        title: "Pago Realizado",
        field: "PagoRealizado",
        editor: "tickCross",
        formatter: cell => cell.getValue() ? "SI" : "NO",
        width: 130,
        headerFilter: "select",
        headerFilterParams: {
            values: {
                "": "Todos",
                "true": "Sí",
                "false": "No"
            }
        }
    },

    { title: "Observaciones", field: "Observaciones", editor: "input", validator: ["maxLength:300"], width: 250, headerFilter: "input" },

    {
        title: "Celebrante",
        field: "Celebrante",
        editor: "input",
        headerFilter: "input",
        width: 180
    },

    {
        title: "Misa Aprobada",
        field: "MisaAprobada",
        editor: "tickCross",
        formatter: cell => cell.getValue() ? "SI" : "NO",
        width: 130,
        headerFilter: "select",
        headerFilterParams: {
            values: {
                "": "Todos",
                "true": "Sí",
                "false": "No"
            }
        }
    },

    { title: "Contacto", field: "Contacto", editor: "input", validator: ["minLength:3", "maxLength:100"], width: 200, headerFilter: "input" },
    { title: "Email", field: "Email", editor: "input", validator: "email", width: 200, headerFilter: "input" },
    { title: "Telefono", field: "Telefono", editor: "input", validator: ["minLength:6", "maxLength:20"], width: 150, headerFilter: "input" },
    { title: "Otros Comentarios", field: "OtrosComentarios", editor: "input", validator: ["maxLength:300"], width: 250, headerFilter: "input" },

    {
        title: "Misa Impresa",
        field: "MisaImpresa",
        editor: "tickCross",
        formatter: cell => cell.getValue() ? "SI" : "NO",
        width: 130,
        headerFilter: "select",
        headerFilterParams: {
            values: {
                "": "Todos",
                "true": "Sí",
                "false": "No"
            }
        }
    },
];

/* ---------------------------------------------------------
   9) Reconstrucción de columnas
--------------------------------------------------------- */
function reconstruirColumnas(base, ordenGuardado) {
    if (!ordenGuardado) return base;

    const ordenadas = ordenGuardado
        .map(field => base.find(col => col.field === field))
        .filter(col => col);

    base.forEach(col => {
        if (!ordenGuardado.includes(col.field)) ordenadas.push(col);
    });

    return ordenadas;
}

const ordenGuardado = JSON.parse(localStorage.getItem("ordenColumnasFichas"));
const columnasFinales = reconstruirColumnas(columnasBase, ordenGuardado);

if (!columnasFinales.some(c => c.field === "MisaID")) {
    columnasFinales.push({ title: "ID", field: "MisaID", visible: false });
}




/* ---------------------------------------------------------
   10) Crear Tabulator optimizado
--------------------------------------------------------- */
window.tabla = new Tabulator("#tabla-fichas", {
    height: "100%",
    layout: "fitDataFill",
    movableColumns: true,
    headerFilterLiveFilter: false,
    columns: columnasFinales,
    index: "MisaID",

    columnMoved: function () {
        const fields = tabla.getColumns().map(col => col.getField());
        localStorage.setItem("ordenColumnasFichas", JSON.stringify(fields));
    }
});

if (localStorage.getItem("rol") === "lector") {
    columnasFinales.forEach(col => {
        delete col.editor;        // elimina editor
        delete col.cellClick;     // elimina acciones
    });
}



/* ---------------------------------------------------------
   11) Validación: mostrar errores
--------------------------------------------------------- */
tabla.on("validationFailed", function(cell, value, validators){
    const tipo = validators[0].type || validators[0];
    const mensaje = mensajesValidacion[tipo] || "Valor inválido.";
    const campo = cell.getField();

    const panel = document.getElementById("errores-tabla");
    if (panel) {
        panel.textContent = `Error en "${campo}": ${mensaje}`;
    }
});

/* ---------------------------------------------------------
   12) Guardado automático optimizado
--------------------------------------------------------- */
tabla.on("cellEdited", async function (cell) {

if (localStorage.getItem("rol") === "lector") {
    return; // no guarda nada
}


    // 1) VALIDACIÓN
    cell.validate();
    const el = cell.getElement();
    const panel = document.getElementById("errores-tabla");

    if (panel && !el.classList.contains("tabulator-validation-fail")) {
        panel.textContent = "";
    }

    // 2) GUARDADO
    const row = cell.getRow().getData();
    const campo = cell.getField();
    let valor = cell.getValue();

    valor = normalizarFecha(valor);
    if (["PagoRealizado", "MisaAprobada", "MisaImpresa"].includes(campo)) {
        valor = normalizarBoolean(valor);
    }

    // FILA NUEVA → POST
    if (!row.MisaID) {

        const res = await fetch(`${API}/fichas/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                ...row,
                [campo]: valor,
                CreadoPor: localStorage.getItem("userID"),
                ModificadoPor: localStorage.getItem("userID")
            }),
        });

        const data = await res.json();

        cell.getRow().update({
            MisaID: data.id,
            [campo]: valor
        });

        return;
    }

    // FILA EXISTENTE → PUT
    await fetch(`${API}/fichas/${row.MisaID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
            [campo]: valor,
            ModificadoPor: localStorage.getItem("userID")
        }),
    });

    cell.getRow().update({ [campo]: valor });
});

/* ---------------------------------------------------------
   13) Cargar datos (optimizado)
--------------------------------------------------------- */
async function cargarFichas() {
    const res = await fetch(`${API}/fichas/`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const data = await res.json();

    tabla.setData(data.fichas);

    tabla.on("dataLoaded", () => {
        tabla.setSort([{ column: "FechaFija", dir: "desc" }]);
    });
}

window.cargarFichas = cargarFichas;
cargarFichas();

/* ---------------------------------------------------------
   14) Botón Nueva Ficha
--------------------------------------------------------- */

if (localStorage.getItem("rol") === "lector") {
    document.getElementById("btn-nueva-ficha").style.display = "none";
    document.getElementById("btn-borrar-seleccion").style.display = "none";
}

document.getElementById("btn-nueva-ficha").addEventListener("click", () => {
    tabla.addRow({ MisaID: null }, true);
});

document.getElementById("btn-borrar-seleccion").addEventListener("click", async () => {

if (localStorage.getItem("rol") === "lector") return;


    const filas = tabla.getSelectedRows();

    if (filas.length === 0) {
        alert("No hay filas seleccionadas.");
        return;
    }

    if (!confirm(`¿Seguro que quieres borrar ${filas.length} fichas?`)) {
        return;
    }

    tabla.blockRedraw();

    for (const fila of filas) {
        const data = fila.getData();

        if (!data.MisaID) {
            fila.delete();
            continue;
        }

        await fetch(`${API}/fichas/${data.MisaID}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        fila.delete();
    }

    tabla.restoreRedraw();
});