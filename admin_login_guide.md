# How to Login to the Admin Panel

This guide provides the exact steps needed to log in to the admin panel of your Exam Platform.

## Prerequisites
Ensure that both your **backend server** and **frontend development server** are currently running in your terminal. 

## Step-by-Step Login Instructions

1. **Open your Web Browser:**
   Open Chrome, Firefox, Edge, or any modern web browser.

2. **Navigate to the Admin Login URL:**
   Type the following URL into your address bar and press **Enter**:
   `http://localhost:5173/admin/login`
   *(Note: 5173 is the default port for Vite. If your frontend development server started on a different port, replace 5173 with your specific port).*

3. **Enter the Admin Credentials:**
   On the login screen, you will be prompted for an email and a password. Enter the default master credentials that have been configured in your system:
   
   - **Email:** `admin@example.com`
   - **Password:** `admin123`

4. **Submit the Login Form:**
   Click the **Login** button.

5. **Access the Dashboard:**
   Upon successful login, you will be automatically redirected to the Admin Dashboard (`/admin/dashboard`). From here, you have full access to:
   - Create and configure new exams
   - Manage and add exam questions
   - View student details and test results

> [!TIP]
> **Changing Credentials:** These credentials are automatically created when the backend starts for the first time. They are sourced from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables inside your `backend/.env` file.
