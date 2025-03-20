async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar el token y datos del usuario
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Redireccionar al dashboard
      window.location.href = '/dashboard.html';
    } else {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

// Verificar si ya hay una sesión activa
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    window.location.href = '/dashboard.html';
  }
});