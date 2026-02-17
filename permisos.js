function getRol() {
    return localStorage.getItem("rol");
}

function esAdmin() {
    return getRol() === "admin";
}

function esEditor() {
    return getRol() === "editor";
}

function esLector() {
    return getRol() === "lector";
}

function protegerBotones() {
    const rol = getRol();

    // Botón borrar misa → solo admin
    const btnBorrar = document.getElementById("btn-borrar");
    if (btnBorrar && !esAdmin()) {
        btnBorrar.style.display = "none";
    }

    // Botón crear misa → admin y editor
    const btnCrear = document.getElementById("btn-crear");
    if (btnCrear && esLector()) {
        btnCrear.style.display = "none";
    }

    // Botón editar misa → admin y editor
    const btnEditar = document.getElementById("btn-editar");
    if (btnEditar && esLector()) {
        btnEditar.style.display = "none";
    }

    // Botón gestionar usuarios → solo admin
    const btnUsuarios = document.getElementById("btn-usuarios");
    if (btnUsuarios && !esAdmin()) {
        btnUsuarios.style.display = "none";
    }     

    // Botón análisis → solo admin
    const btnAnalisis = document.getElementById("btn-analisis");
    if (btnAnalisis && esEditor()) {
        btnAnalisis.style.display = "none";
    } 

    
    // Selección tipo repeticiones usuarios → admin y editor
    const btnRepeticiones = document.getElementById("tipoRepeticionGlobal");
    if (btnRepeticiones && esLector()) {
        btnRepeticiones.style.display = "none";
    } 

}