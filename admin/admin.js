// Standard Forms & Tubes — Admin Dashboard Script
(function () {
  let token = localStorage.getItem('sf_token') || null;
  let currentTab = 'overview';
  let enquiriesFilter = 'all';
  let enquirySearchTerm = '';
  let projectsFilter = 'all';
  let products = [];
  let allEnquiries = [];

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');
  const pageTitle = document.getElementById('pageTitle');

  // Navigation Items
  const navItems = document.querySelectorAll('.side-nav .nav-item');

  // Initialization
  init();

  async function init() {
    if (token) {
      const valid = await verifyToken();
      if (valid) {
        showApp();
      } else {
        showLogin();
      }
    } else {
      showLogin();
    }
    setupEventListeners();
  }

  function setupEventListeners() {
    // Login
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
          if (res.ok && data.token) {
            token = data.token;
            localStorage.setItem('sf_token', token);
            localStorage.setItem('sf_user', JSON.stringify(data.user));
            showApp();
            showToast('Welcome back, ' + data.user.username + '!');
          } else {
            loginError.textContent = data.error || 'Invalid credentials';
            loginError.style.display = 'block';
          }
        } catch (err) {
          loginError.textContent = 'Server connection error. Please make sure the backend is running.';
          loginError.style.display = 'block';
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('sf_token');
        localStorage.removeItem('sf_user');
        token = null;
        showLogin();
        showToast('Logged out successfully.');
      });
    }

    // Nav tabs
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        switchTab(tab);
      });
    });

    // Enquiry status filter pills
    const pills = document.querySelectorAll('#enquiryStatusFilters .pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        enquiriesFilter = pill.dataset.status;
        renderEnquiriesTable();
      });
    });

    // Enquiry search input
    const searchInput = document.getElementById('enquirySearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        enquirySearchTerm = searchInput.value.trim().toLowerCase();
        renderEnquiriesTable();
      });
    }

    // Products Category Filter & Search
    const catFilter = document.getElementById('prodCatFilter');
    const prodSearch = document.getElementById('prodSearchInput');
    if (catFilter) catFilter.addEventListener('change', renderProductsTable);
    if (prodSearch) prodSearch.addEventListener('input', renderProductsTable);

    // Projects Category Filters
    const projPills = document.querySelectorAll('#projectFilters .pill');
    projPills.forEach(pill => {
      projPills.forEach(p => p.classList.remove('active'));
      pill.addEventListener('click', () => {
        projPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        projectsFilter = pill.dataset.cat;
        renderProjectsGrid();
      });
    });

    // Modals
    document.getElementById('btnOpenAddProduct').onclick = () => openAddProductModal();
    document.getElementById('btnOpenAddProject').onclick = () => openAddProjectModal();

    // Form Submissions
    document.getElementById('productForm').onsubmit = handleProductSubmit;
    document.getElementById('projectForm').onsubmit = handleProjectSubmit;
    document.getElementById('settingsForm').onsubmit = handleSettingsSubmit;
    document.getElementById('passwordForm').onsubmit = handlePasswordSubmit;

    // File Uploads
    setupFileUpload('prodFileInput', 'prodImg');
    setupFileUpload('projFileInput', 'projImg');
  }

  async function verifyToken() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        userBadge.textContent = data.user.username;
        return true;
      }
    } catch (err) {}
    return false;
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    appScreen.style.display = 'none';
  }

  function showApp() {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'flex';
    switchTab('overview');
  }

  window.switchTab = function (tabName) {
    currentTab = tabName;
    navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabName));

    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabName}`);
    });

    const titles = {
      overview: 'Overview & Analytics',
      enquiries: 'Customer Enquiries & Quotations',
      products: 'Products Catalog Management',
      projects: 'Showcase Projects Gallery',
      settings: 'System & Contact Settings'
    };
    pageTitle.textContent = titles[tabName] || 'Dashboard';

    // Load tab data
    if (tabName === 'overview') loadOverviewData();
    if (tabName === 'enquiries') loadEnquiries();
    if (tabName === 'products') loadProducts();
    if (tabName === 'projects') loadProjects();
    if (tabName === 'settings') loadSettings();
  };

  // OVERVIEW DATA
  async function loadOverviewData() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const s = data.stats;

      document.getElementById('statTotalLeads').textContent = s.enquiries.total;
      document.getElementById('statNewLeads').textContent = s.enquiries.new;
      document.getElementById('statProducts').textContent = s.products.total;
      document.getElementById('statProjects').textContent = s.projects.total;

      // Sidebar badge
      const sideBadge = document.getElementById('sideNewEnquiries');
      if (sideBadge) sideBadge.textContent = s.enquiries.new;

      // Recent leads table
      const tbody = document.getElementById('recentLeadsBody');
      if (!data.recentEnquiries || !data.recentEnquiries.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No enquiries received yet.</td></tr>';
        return;
      }

      tbody.innerHTML = data.recentEnquiries.map(e => `
        <tr>
          <td>${formatDate(e.created_at)}</td>
          <td><b>${escapeHtml(e.name)}</b>${e.company ? `<br><small class="text-muted">${escapeHtml(e.company)}</small>` : ''}</td>
          <td><a href="tel:${escapeHtml(e.phone)}" style="color:var(--yellow);text-decoration:none">${escapeHtml(e.phone)}</a></td>
          <td><span style="font-weight:600">${escapeHtml(e.product || 'General')}</span></td>
          <td><span class="status-badge ${e.status}">${e.status}</span></td>
          <td>
            <div class="action-btns">
              <a href="https://wa.me/${cleanPhone(e.phone)}?text=${encodeURIComponent('Hello ' + e.name + ', regarding your enquiry for ' + (e.product || 'our products') + '...')}" target="_blank" class="btn btn-sm btn-wa" title="Reply on WhatsApp">WA</a>
              <button class="btn btn-sm btn-outline" onclick="viewEnquiryDetails(${e.id})">View</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load overview stats', err);
    }
  }

  // ENQUIRIES
  async function loadEnquiries() {
    try {
      const exportBtn = document.getElementById('exportCsvBtn');
      if (exportBtn && token) {
        exportBtn.href = `/api/admin/enquiries/export?token=${encodeURIComponent(token)}`;
      }
      const res = await fetch('/api/admin/enquiries?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      allEnquiries = data.enquiries || [];
      updateEnquiryCounts();
      renderEnquiriesTable();
    } catch (err) {
      console.error('Error fetching enquiries', err);
    }
  }

  function updateEnquiryCounts() {
    document.getElementById('countAll').textContent = allEnquiries.length;
    document.getElementById('countNew').textContent = allEnquiries.filter(e => e.status === 'new').length;
    document.getElementById('countContacted').textContent = allEnquiries.filter(e => e.status === 'contacted').length;
    document.getElementById('countQuoted').textContent = allEnquiries.filter(e => e.status === 'quoted').length;
    document.getElementById('countClosed').textContent = allEnquiries.filter(e => e.status === 'closed').length;
  }

  function renderEnquiriesTable() {
    const tbody = document.getElementById('enquiriesTableBody');
    let filtered = allEnquiries;

    if (enquiriesFilter !== 'all') {
      filtered = filtered.filter(e => e.status === enquiriesFilter);
    }

    if (enquirySearchTerm) {
      filtered = filtered.filter(e => {
        const text = `${e.name} ${e.phone} ${e.email || ''} ${e.company || ''} ${e.product || ''} ${e.message}`.toLowerCase();
        return text.includes(enquirySearchTerm);
      });
    }

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--text-muted)">No enquiries match the selected filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(e => `
      <tr>
        <td>#${e.id}</td>
        <td>${formatDate(e.created_at)}</td>
        <td>
          <b>${escapeHtml(e.name)}</b>
          ${e.company ? `<div style="font-size:12px;color:var(--text-muted)">${escapeHtml(e.company)}</div>` : ''}
          <div style="font-size:13px;margin-top:2px">
            <a href="tel:${escapeHtml(e.phone)}" style="color:var(--yellow);text-decoration:none">${escapeHtml(e.phone)}</a>
            ${e.email ? ` · <a href="mailto:${escapeHtml(e.email)}" style="color:var(--text-muted);text-decoration:none">${escapeHtml(e.email)}</a>` : ''}
          </div>
        </td>
        <td>
          <span style="font-weight:600;color:#fff">${escapeHtml(e.product || 'General')}</span>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">${e.channel === 'whatsapp' ? 'WhatsApp Lead' : 'Web Form'}</div>
        </td>
        <td style="max-width:240px">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(e.message)}">
            ${escapeHtml(e.message)}
          </div>
        </td>
        <td>
          <select onchange="updateEnquiryStatus(${e.id}, this.value)" class="select-input" style="padding:4px 8px;font-size:12px">
            <option value="new" ${e.status === 'new' ? 'selected' : ''}>New</option>
            <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="quoted" ${e.status === 'quoted' ? 'selected' : ''}>Quoted</option>
            <option value="closed" ${e.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td>
          <div class="action-btns">
            <a href="https://wa.me/${cleanPhone(e.phone)}?text=${encodeURIComponent('Hello ' + e.name + ', regarding your enquiry for ' + (e.product || 'our products') + ' with Standard Forms & Tubes Calicut: ')}" target="_blank" class="btn btn-sm btn-wa" title="Open WhatsApp Chat">WhatsApp</a>
            <button class="btn btn-sm btn-outline" onclick="viewEnquiryDetails(${e.id})" title="View Details">View</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEnquiry(${e.id})" title="Delete">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.updateEnquiryStatus = async function (id, status) {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Enquiry #${id} marked as ${status}`);
        const item = allEnquiries.find(e => e.id === id);
        if (item) item.status = status;
        updateEnquiryCounts();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  window.deleteEnquiry = async function (id) {
    if (!confirm(`Are you sure you want to permanently delete enquiry #${id}?`)) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        allEnquiries = allEnquiries.filter(e => e.id !== id);
        updateEnquiryCounts();
        renderEnquiriesTable();
        showToast('Enquiry deleted');
      }
    } catch (err) {
      showToast('Failed to delete enquiry', 'error');
    }
  };

  window.viewEnquiryDetails = function (id) {
    const e = allEnquiries.find(item => item.id === id);
    if (!e) return;

    const modalBody = document.getElementById('enquiryModalBody');
    modalBody.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="font-size:18px;color:#fff">${escapeHtml(e.name)}</h4>
          <small style="color:var(--text-muted)">Submitted: ${new Date(e.created_at).toLocaleString()}</small>
        </div>
        <span class="status-badge ${e.status}">${e.status}</span>
      </div>
      <div style="background:var(--bg-input);padding:14px;border-radius:6px;margin-bottom:16px">
        <p><strong>Phone:</strong> <a href="tel:${escapeHtml(e.phone)}" style="color:var(--yellow)">${escapeHtml(e.phone)}</a></p>
        <p><strong>Email:</strong> ${e.email ? `<a href="mailto:${escapeHtml(e.email)}" style="color:#fff">${escapeHtml(e.email)}</a>` : 'Not provided'}</p>
        <p><strong>Company / Site:</strong> ${escapeHtml(e.company || 'Not provided')}</p>
        <p><strong>Product Requested:</strong> <span style="color:var(--yellow);font-weight:bold">${escapeHtml(e.product || 'General')}</span></p>
        <p><strong>Channel:</strong> ${e.channel === 'whatsapp' ? 'WhatsApp initiated' : 'Web Contact Form'}</p>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:12px;text-transform:uppercase;color:var(--text-muted);font-weight:600">Requirement Message:</label>
        <div style="background:#131722;padding:12px;border-radius:6px;margin-top:4px;white-space:pre-wrap;color:#e2e8f0;font-size:14px;line-height:1.5">${escapeHtml(e.message)}</div>
      </div>
      <div class="form-group">
        <label for="enquiryNoteInput">Internal Sales Notes:</label>
        <textarea id="enquiryNoteInput" rows="2" placeholder="Add follow-up notes, quotation amount, etc.">${escapeHtml(e.notes || '')}</textarea>
        <button class="btn btn-sm btn-outline" style="margin-top:6px" onclick="saveEnquiryNote(${e.id})">Save Notes</button>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-light)">
        <a href="https://wa.me/${cleanPhone(e.phone)}?text=${encodeURIComponent('Hello ' + e.name + ', regarding your enquiry for ' + (e.product || 'our products') + ' with Standard Forms & Tubes Calicut: ')}" target="_blank" class="btn btn-wa" style="flex:1">Chat on WhatsApp</a>
        <a href="tel:${escapeHtml(e.phone)}" class="btn btn-outline" style="flex:1">Call Customer</a>
      </div>
    `;
    openModal('enquiryModal');
  };

  window.saveEnquiryNote = async function (id) {
    const notes = document.getElementById('enquiryNoteInput').value;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        const item = allEnquiries.find(e => e.id === id);
        if (item) item.notes = notes;
        showToast('Notes saved successfully');
      }
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  // PRODUCTS
  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const data = await res.json();
      products = data.products || [];
      renderProductsTable();
    } catch (err) {
      console.error('Error fetching products', err);
    }
  }

  function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    const cat = document.getElementById('prodCatFilter').value;
    const search = document.getElementById('prodSearchInput').value.trim().toLowerCase();

    let filtered = products;
    if (cat) filtered = filtered.filter(p => p.category_id === cat);
    if (search) {
      filtered = filtered.filter(p => {
        return (p.title + ' ' + (p.tag || '') + ' ' + (p.description || '')).toLowerCase().includes(search);
      });
    }

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;color:var(--text-muted)">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${p.image_url}" alt="" class="thumb-img" onerror="this.src='assets/img/kflex-tubes-sheets.jpg'"></td>
        <td><b>${escapeHtml(p.title)}</b></td>
        <td><span style="color:var(--yellow)">${escapeHtml(p.category_name)}</span></td>
        <td><small class="text-muted">${escapeHtml(p.tag || '-')}</small></td>
        <td><span class="stock-badge ${p.in_stock ? 'instock' : 'outofstock'}">${p.in_stock ? 'In Stock' : 'Out of Stock'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    document.getElementById('prodEditId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('prodImg').value = 'assets/img/kflex-tubes-sheets.jpg';
    document.getElementById('prodInStock').checked = true;
    openModal('productModal');
  }

  window.editProduct = function (id) {
    const p = products.find(item => item.id === id);
    if (!p) return;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('prodEditId').value = p.id;
    document.getElementById('prodTitle').value = p.title;
    document.getElementById('prodCategory').value = p.category_id;
    document.getElementById('prodTag').value = p.tag || '';
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('prodImg').value = p.image_url || '';
    document.getElementById('prodInStock').checked = Boolean(p.in_stock);
    openModal('productModal');
  };

  async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prodEditId').value;
    const catId = document.getElementById('prodCategory').value;
    const catNames = {
      kflex: 'K-Flex Insulation',
      supreme: 'Supreme Accessories',
      wool: 'Insulation Wool',
      hvac: 'HVAC & Ducting',
      acoustic: 'Acoustic Solutions',
      civil: 'Waterproofing & Civil'
    };

    const payload = {
      category_id: catId,
      category_name: catNames[catId] || 'General',
      title: document.getElementById('prodTitle').value.trim(),
      tag: document.getElementById('prodTag').value.trim(),
      description: document.getElementById('prodDesc').value.trim(),
      image_url: document.getElementById('prodImg').value.trim(),
      in_stock: document.getElementById('prodInStock').checked ? 1 : 0
    };

    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(id ? 'Product updated successfully' : 'Product added successfully');
        closeModal('productModal');
        loadProducts();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save product', 'error');
      }
    } catch (err) {
      showToast('Network error while saving product', 'error');
    }
  }

  window.deleteProduct = async function (id) {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Product deleted');
        loadProducts();
      }
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  // PROJECTS
  let allProjects = [];
  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) return;
      const data = await res.json();
      allProjects = data.projects || [];
      renderProjectsGrid();
    } catch (err) {
      console.error('Error fetching projects', err);
    }
  }

  function renderProjectsGrid() {
    const grid = document.getElementById('projectsGrid');
    let filtered = allProjects;
    if (projectsFilter !== 'all') {
      filtered = filtered.filter(p => p.category === projectsFilter);
    }

    if (!filtered.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">No projects in this category.</p>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="project-admin-card">
        <img src="${p.image_url}" alt="" onerror="this.src='assets/img/g-home-theatre-1.jpg'">
        <div class="card-body">
          <small>${p.category}</small>
          <h4>${escapeHtml(p.title)}</h4>
          <p style="font-size:12px;color:var(--text-muted);flex:1">${escapeHtml(p.description || '')}</p>
          <div class="card-foot">
            <button class="btn btn-sm btn-danger" onclick="deleteProject(${p.id})">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function openAddProjectModal() {
    document.getElementById('projectForm').reset();
    document.getElementById('projImg').value = 'assets/img/g-home-theatre-1.jpg';
    openModal('projectModal');
  }

  async function handleProjectSubmit(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('projTitle').value.trim(),
      category: document.getElementById('projCategory').value,
      description: document.getElementById('projDesc').value.trim(),
      image_url: document.getElementById('projImg').value.trim()
    };

    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Showcase project added');
        closeModal('projectModal');
        loadProjects();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add project', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  }

  window.deleteProject = async function (id) {
    if (!confirm('Are you sure you want to delete this showcase project?')) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Project deleted');
        loadProjects();
      }
    } catch (err) {
      showToast('Failed to delete project', 'error');
    }
  };

  // SETTINGS
  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      const s = data.settings || {};

      document.getElementById('setCompanyName').value = s.company_name || 'Standard Forms & Tubes';
      document.getElementById('setPhone1').value = s.phone_primary || '+91 79943 38833';
      document.getElementById('setPhone2').value = s.phone_secondary || '+91 94978 81734';
      document.getElementById('setEmail').value = s.email || 'standardformsclt@gmail.com';
      document.getElementById('setWhatsapp').value = s.whatsapp || '917994338833';
      document.getElementById('setAddress').value = s.address || 'AM Complex, 7/179 A-13, Near Cherooty Road, Lorry Stand, Calicut – 673001, Kerala';
    } catch (err) {
      console.error('Error loading settings', err);
    }
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    const payload = {
      company_name: document.getElementById('setCompanyName').value.trim(),
      phone_primary: document.getElementById('setPhone1').value.trim(),
      phone_secondary: document.getElementById('setPhone2').value.trim(),
      email: document.getElementById('setEmail').value.trim(),
      whatsapp: document.getElementById('setWhatsapp').value.trim(),
      address: document.getElementById('setAddress').value.trim()
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Company settings updated successfully');
      } else {
        showToast('Failed to update settings', 'error');
      }
    } catch (err) {
      showToast('Network error while saving settings', 'error');
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('curPass').value;
    const newPassword = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;

    if (newPassword !== confirmPass) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password changed successfully');
        document.getElementById('passwordForm').reset();
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  }

  // FILE UPLOAD HELPER
  function setupFileUpload(fileInputId, targetInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput) return;

    fileInput.addEventListener('change', async () => {
      if (!fileInput.files.length) return;
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('image', file);

      showToast('Uploading image...');

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.url) {
          document.getElementById(targetInputId).value = data.url;
          showToast('Image uploaded successfully!');
        } else {
          showToast(data.error || 'Upload failed', 'error');
        }
      } catch (err) {
        showToast('Upload network error', 'error');
      }
    });
  }

  // UTILS
  window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  };

  window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  };

  window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function cleanPhone(p) {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
