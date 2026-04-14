/**
 * ANHONI Disaster Management System - Access Control Module
 * 
 * This module provides role-based access control for frontend pages.
 * It ensures that:
 * - Users with "user" role can only access user_dashboard.html
 * - Users with "admin" role can only access admin_dashboard.html
 * - Unauthenticated users are redirected to login page
 */

const ACCESS_CONTROL = {
    BASE_URL: "http://127.0.0.1:5000/api",
    
    /**
     * Check if user is authenticated and has the required role
     * @param {string} requiredRole - Required role ('user' or 'admin')
     * @param {string} currentPage - Current page name for logging
     * @returns {boolean} - True if access is allowed
     */
    checkAccess: function(requiredRole, currentPage = 'unknown') {
        console.log(`[ACCESS_CONTROL] Checking access for ${currentPage}, required role: ${requiredRole}`);
        
        // Get authentication data from localStorage
        const userId = localStorage.getItem("user_id");
        const userRole = localStorage.getItem("user_role");
        const isLoggedIn = userId && userRole;
        
        console.log(`[ACCESS_CONTROL] User ID: ${userId}, User Role: ${userRole}, Logged In: ${isLoggedIn}`);
        
        // Check if user is authenticated
        if (!isLoggedIn) {
            console.log(`[ACCESS_CONTROL] User not authenticated, redirecting to login`);
            this.redirectToLogin("You must be logged in to access this page.");
            return false;
        }
        
        // Check if user has required role
        if (userRole !== requiredRole) {
            console.log(`[ACCESS_CONTROL] Access denied. User role: ${userRole}, Required: ${requiredRole}`);
            this.redirectToUnauthorized(userRole);
            return false;
        }
        
        console.log(`[ACCESS_CONTROL] Access granted for ${userRole} to ${currentPage}`);
        return true;
    },
    
    /**
     * Redirect to login page with message
     * @param {string} message - Message to display
     */
    redirectToLogin: function(message = "Please log in to continue.") {
        // Store the intended destination
        localStorage.setItem("redirect_after_login", window.location.pathname);
        
        // Clear any existing auth data
        this.clearAuthData();
        
        // Show message and redirect
        alert(message);
        window.location.href = "login.html";
    },
    
    /**
     * Redirect to appropriate dashboard based on user role
     * @param {string} userRole - Current user role
     */
    redirectToUnauthorized: function(userRole) {
        let redirectUrl = "login.html";
        let message = "Access denied. You don't have permission to view this page.";
        
        // Redirect to appropriate dashboard
        if (userRole === "admin") {
            redirectUrl = "admin_dashboard.html";
            message = "Access denied. Redirecting to admin dashboard.";
        } else if (userRole === "user") {
            redirectUrl = "user_dashboard.html";
            message = "Access denied. Redirecting to user dashboard.";
        }
        
        alert(message);
        window.location.href = redirectUrl;
    },
    
    /**
     * Store user authentication data after successful login
     * @param {object} loginResponse - Response from login API
     */
    storeAuthData: function(loginResponse) {
        localStorage.setItem("user_id", loginResponse.user_id);
        localStorage.setItem("user_role", loginResponse.role);
        localStorage.setItem("auth_timestamp", Date.now().toString());
        
        console.log(`[ACCESS_CONTROL] Auth data stored for user ${loginResponse.user_id} with role ${loginResponse.role}`);
    },
    
    /**
     * Clear all authentication data
     */
    clearAuthData: function() {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_role");
        localStorage.removeItem("auth_timestamp");
        localStorage.removeItem("redirect_after_login");
        
        console.log(`[ACCESS_CONTROL] Auth data cleared`);
    },
    
    /**
     * Get current user info
     * @returns {object} - User info object
     */
    getCurrentUser: function() {
        return {
            id: localStorage.getItem("user_id"),
            role: localStorage.getItem("user_role"),
            isAuthenticated: !!(localStorage.getItem("user_id") && localStorage.getItem("user_role"))
        };
    },
    
    /**
     * Check if current session is valid (basic timestamp check)
     * @returns {boolean} - True if session is valid
     */
    isSessionValid: function() {
        const authTimestamp = localStorage.getItem("auth_timestamp");
        if (!authTimestamp) return false;
        
        // Check if session is older than 24 hours (86400000 ms)
        const sessionAge = Date.now() - parseInt(authTimestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > maxAge) {
            console.log(`[ACCESS_CONTROL] Session expired`);
            this.clearAuthData();
            return false;
        }
        
        return true;
    },
    
    /**
     * Initialize access control for a page
     * @param {string} requiredRole - Required role for the page
     * @param {string} pageName - Name of the page for logging
     */
    initPageAccess: function(requiredRole, pageName) {
        // Check session validity first
        if (!this.isSessionValid()) {
            this.redirectToLogin("Your session has expired. Please log in again.");
            return false;
        }
        
        // Check access permissions
        return this.checkAccess(requiredRole, pageName);
    },
    
    /**
     * Handle post-login redirect
     */
    handlePostLoginRedirect: function(userRole) {
        const intendedDestination = localStorage.getItem("redirect_after_login");
        localStorage.removeItem("redirect_after_login");
        
        // Default redirects based on role
        if (userRole === "admin") {
            window.location.href = intendedDestination || "admin_dashboard.html";
        } else if (userRole === "user") {
            window.location.href = intendedDestination || "user_dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    },
    
    /**
     * Logout function with proper cleanup
     */
    logout: function() {
        this.clearAuthData();
        alert("You have been logged out successfully.");
        window.location.href = "login.html";
    }
};

// Make it globally available
window.ACCESS_CONTROL = ACCESS_CONTROL;