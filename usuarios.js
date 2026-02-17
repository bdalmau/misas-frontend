const API = "https://misas-backend-nfoz.onrender.com";

async function cargarUsuarios() {
    const res = await fetch(`${API}/usuarios`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const data = await res.json();
    return data;
}

async function initTabla() {
    const data = await cargarUsuarios();

    new Tabulator("#usuarios-table", {
        data: data,
        layout: "fitColumns",
        columns: [
            { title: "Usuario", field: "usuario", width: 350 },
            { title: "Rol", field: "rol", editor: "select", editorParams: { values: ["admin", "editor", "lector"] } },
            { title: "Activo", field: "activo", formatter: "tickCross", editor: true },
            {
                title: "Acciones",
                formatter: () => "🗑️",
                width: 350,
                hozAlign: "center",
                cellClick: (e, cell) => borrarUsuario(cell.getRow().getData().id)
            }
        ],
        cellEdited: async (cell) => {
            const row = cell.getRow().getData();
            await fetch(`${API}/usuarios/${row.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify(row)
            });
        }
    });
}

async function borrarUsuario(id) {
    if (!confirm("¿Seguro que quieres borrar este usuario?")) return;

    await fetch(`${API}/usuarios/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    location.reload();
}

function abrirCrearUsuario() {
    const usuario = prompt("Nombre de usuario:");
    const password = prompt("Contraseña:");
    const rol = prompt("Rol (admin/editor/lector):", "lector");

    if (!usuario || !password || !rol) return;

    fetch(`${API}/usuarios`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ usuario, password, rol })
    }).then(() => location.reload());
}

initTabla();