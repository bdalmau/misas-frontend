async function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("error");

    errorDiv.textContent = "";

    const res = await fetch("https://misas-backend-nfoz.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!res.ok) {
        errorDiv.textContent = data.detail || "Error al iniciar sesión";
        return;
    }

    // Guardar sesión
    localStorage.setItem("token", data.token);
    localStorage.setItem("userID", data.userID);
    localStorage.setItem("rol", data.rol);
    localStorage.setItem("usuario", data.usuario);

    // Redirigir al dashboard
    window.location.href = "index.html";
}