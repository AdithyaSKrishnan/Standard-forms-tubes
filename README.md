# Standard Forms & Tubes — Web & Backend Application

Production-ready web platform for **Standard Forms & Tubes**, Calicut (Kerala) — authorized distributor of **K-Flex Insulations** and **Supreme Civil Accessories Division**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

---

## 🌐 URLs & Access

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Home** | `http://localhost:3000/` | Main website landing page |
| **Products** | `http://localhost:3000/products` | Complete catalog with live search & specs |
| **Projects** | `http://localhost:3000/projects` | Showcase gallery with interactive lightbox |
| **Why Us** | `http://localhost:3000/why-us` | Value proposition & certifications |
| **About Us** | `http://localhost:3000/about` | Company history, location & warehouse |
| **Contact** | `http://localhost:3000/contact` | Online quote enquiry form & Google map |
| **Admin Portal** | `http://localhost:3000/admin` | Management portal for leads, products & settings |
| **API Health** | `http://localhost:3000/api/health` | Server status check |

---

## 🔐 Default Admin Credentials

* **URL**: `http://localhost:3000/admin`
* **Username**: `admin`
* **Password**: `admin123`

*(You can change the admin password at any time inside the Admin Portal under Settings, or via `.env`)*

---

## 🛠️ Features & Architecture

### Backend & API
* **Runtime**: Node.js v20+ with Express.js.
* **Database**: Embedded SQLite (`data/site.db`) with WAL mode via `better-sqlite3`. Zero external database server required.
* **Authentication**: Secure JWT tokens with `bcryptjs` password hashing.
* **Image Uploads**: Handled via `multer` to `uploads/` for product images and showcase project photos.
* **Email Notifications**: Integrated via `nodemailer` (configurable SMTP credentials in `.env`, with automatic console logging in development).

### Leads & Quotation Engine
* Enquiries submitted through the website contact form are saved directly into the database.
* Provides real-time instant feedback on the website form while preserving WhatsApp and Email client compatibility.
* Leads can be filtered, reviewed, marked as (`New`, `Contacted`, `Quoted`, `Closed`), and exported to **CSV** for Excel/CRM.
* 1-click **WhatsApp Chat** button in the Admin Console pre-fills a personalized greeting to the customer with their requested product.

### Product & Project Catalog Management
* Pre-seeded with the company's full catalog (32 products) and 11 showcase acoustic projects.
* Full CRUD capabilities in the Admin Portal to add, edit, toggle in-stock status, or remove items without editing HTML files manually.

---

## 📁 Project Structure

```
standard-forms-tubes-website/
├── admin/                     # Admin Management Portal (SPA)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── assets/                    # Website Frontend Assets
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
├── database/                  # Database Layer
│   ├── db.js                  # SQLite schema & connection
│   └── seed.js                # Auto-seeder for products, projects & admin
├── data/                      # Persistent SQLite Database Storage
│   └── site.db
├── middleware/                # Express Middlewares
│   └── auth.js                # JWT token verification
├── routes/                    # REST API Endpoints
│   ├── auth.js
│   ├── enquiries.js
│   ├── products.js
│   ├── projects.js
│   ├── settings.js
│   ├── stats.js
│   └── upload.js
├── services/                  # Background Services
│   └── email.js               # Email notification dispatcher
├── uploads/                   # Uploaded media storage
├── .env                       # Environment configuration
├── .env.example               # Environment template
├── package.json
└── server.js                  # Application server entry point
```
