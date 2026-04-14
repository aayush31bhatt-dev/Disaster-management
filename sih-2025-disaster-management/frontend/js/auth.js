// Load access control module
// Note: Make sure access-control.js is loaded before this script

// Change this base URL if your backend runs on another port
const BASE_URL = "http://127.0.0.1:5000/api";

// LOGIN
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      
      // Use enhanced UI functions if available, fallback to basic
      const showMessage = window.showLoginMessage || function(msg, type) {
        const messageElement = document.getElementById("loginMessage");
        if (messageElement) {
          messageElement.textContent = msg;
          messageElement.style.display = 'block';
        }
      };
      
      const setLoading = window.setLoginLoading || function(loading) {
        const btn = document.getElementById("loginBtn");
        if (btn) btn.disabled = loading;
      };
      
      // Show loading state
      setLoading(true);
      showMessage("Signing in...", 'info');
      
      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "username": email, password })
        });

        const data = await res.json();

        if (res.ok) {
          // Store authentication data using access control module
          ACCESS_CONTROL.storeAuthData({
            user_id: data.user_id,
            role: data.role
          });
          
          console.log(`[AUTH] Login successful for user ${data.user_id} with role ${data.role}`);
          
          // Show success message
          showMessage("Login successful! Redirecting...", 'success');
          
          // Delay redirect for better UX
          setTimeout(() => {
            ACCESS_CONTROL.handlePostLoginRedirect(data.role);
          }, 1200);
        } else {
          console.log(`[AUTH] Login failed: ${data.message}`);
          showMessage(data.message, 'error');
        }
      } catch (error) {
        console.error(`[AUTH] Login error:`, error);
        showMessage("Login failed. Please check your connection and try again.", 'error');
      } finally {
        // Reset loading state
        setLoading(false);
      }
    });
  }

  // REGISTER
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const messageElement = document.getElementById("registerMessage");

      // Show loading state
      messageElement.innerText = "Creating account...";
      
      try {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "username": email, password, "role": "user" })
        });

        const data = await res.json();
        messageElement.innerText = data.message;

        if (res.ok) {
          console.log(`[AUTH] Registration successful for ${email}`);
          alert("Registration successful! Please log in with your credentials.");
          window.location.href = "login.html";
        } else {
          console.log(`[AUTH] Registration failed: ${data.message}`);
        }
      } catch (error) {
        console.error(`[AUTH] Registration error:`, error);
        messageElement.innerText = "Registration failed. Please check your connection and try again.";
      }
    });
  }
});