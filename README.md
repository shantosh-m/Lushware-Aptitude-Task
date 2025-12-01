# CMMS -- Work Order & Preventive Maintenance Modules

This repository contains the full-stack implementation of a
**Computerized Maintenance Management System (CMMS)** including:

-   **Work Order Management**
-   **Preventive Maintenance Scheduling**
-   **Asset Management**
-   **Technician Management**
-   **Role-based Dashboards (Admin, Technician, User)**

------------------------------------------------------------------------

## 🚀 Tech Stack

### **Frontend**

-   React.js (Vite)
-   Tailwind CSS
-   Material UI (MUI)

### **Backend**

-   Node.js (Express)
-   Mongoose (MongoDB ODM)

### **Database**

-   MongoDB Atlas / Local MongoDB

------------------------------------------------------------------------

# 📁 Project Structure

    cmms/
    │── backend/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── controllers/
    │   ├── uploads/
    │   ├── seed.js
    │   └── server.js
    │
    │── frontend/
    │   ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── App.jsx

------------------------------------------------------------------------

# 🔐 Authentication & Roles

The system includes JWT-based authentication with 3 main roles:

### **1. Admin**

-   Manage technicians
-   Manage assets
-   View all work orders
-   Assign technicians
-   Manage preventive maintenance tasks
-   Full dashboard & analytics

### **2. Technician**

-   View assigned work orders
-   Update work order status
-   Add technician notes
-   Complete preventive maintenance tasks
-   View assigned PM schedule

### **3. Normal User (Resident)**

-   Submit work orders
-   Track work order status
-   Upload images & attachments
-   Receive updates and notifications

------------------------------------------------------------------------

# 🧰 Work Order Management

### Features:

-   Create new work orders\
-   Categorize (HVAC, Electrical, Plumbing, Fire Safety...)
-   Priority levels (Low → Emergency)
-   Status workflow:\
    **Open → In Progress → Completed → Verified**
-   Assign technicians
-   Upload multiple images / files
-   Technician notes & updates
-   Automatic notifications (to be added)

### API Routes:

    GET     /api/workorders
    POST    /api/workorders
    GET     /api/workorders/:id
    PUT     /api/workorders/:id
    POST    /api/workorders/:id/status
    POST    /api/workorders/:id/notes

------------------------------------------------------------------------

# 🗓 Preventive Maintenance Scheduling (PM)

### Features:

-   Create scheduled maintenance
-   Daily / Weekly / Monthly / Quarterly recurring tasks
-   Asset-specific PM plans
-   Technician assignment
-   PM calendar view
-   Completion logging + notes

### API Routes:

    GET     /api/pm
    POST    /api/pm
    GET     /api/pm/:id
    POST    /api/pm/:id/complete
    GET     /api/pm/calendar/range?start=ISO&end=ISO

------------------------------------------------------------------------

# 🧑‍🔧 Asset Management

### Features:

-   Add & update assets
-   Link work orders & PM tasks
-   Store location, serial numbers, vendor, purchase info

### API Routes:

    GET     /api/assets
    POST    /api/assets
    PUT     /api/assets/:id
    DELETE  /api/assets/:id

------------------------------------------------------------------------

# 👨‍🔧 Technician Management

### Features:

-   Add technicians
-   Assign tasks
-   Disable/enable technicians

### API Routes:

    GET     /api/technicians
    POST    /api/technicians
    PUT     /api/technicians/:id
    DELETE  /api/technicians/:id

------------------------------------------------------------------------

# ⚙️ Setup Guide

## 1️⃣ Backend Setup

    cd backend
    npm install

Set environment variables:

    MONGO_URI=
    PORT=4000
    JWT_SECRET=yourSecret

Run optional seeder:

    node seed.js

Start server:

    node server.js

------------------------------------------------------------------------

## 2️⃣ Frontend Setup

    cd frontend
    npm install
    npm run dev

------------------------------------------------------------------------


# 💬 Author

**Shantosh Muraleetharan**\
AI/ML Engineer & Software Engineer\
GitHub: `shantosh-m`
