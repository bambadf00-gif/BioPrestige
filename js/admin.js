const SUPABASE_URL = 'https://odmlmwpdtvavhucvgrza.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWxtd3BkdHZhdmh1Y3ZncnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzczODUsImV4cCI6MjA5NTcxMzM4NX0.OaAQdnYM8vBSNcz4-c3EH3-3XDz1qfdLOm8yFqoMNMQ';

let allOrders = [];
let currentView = 'accueil';
let currentFilter = 'all';
let selectedOrderForModal = null;

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  switchView('accueil');
  loadOrders();
});

function switchView(viewName) {
  currentView = viewName;
  
  // Onglets de navigation sidebar
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.getElementById(`nav-${viewName}`);
  if (activeLink) activeLink.classList.add('active');

  // Conteneurs de vue
  document.querySelectorAll('.view-container').forEach(container => {
    container.classList.remove('active');
  });
  const activeContainer = document.getElementById(`view-${viewName}`);
  if (activeContainer) activeContainer.classList.add('active');

  // Titre topbar
  const titles = {
    accueil: 'Accueil',
    commandes: 'Commandes',
    produits: 'Produits'
  };
  document.getElementById('topbarTitle').textContent = titles[viewName] || 'Administration';

  // Rendu de la vue correspondante si les données sont déjà chargées
  if (allOrders.length > 0) {
    if (viewName === 'accueil') {
      loadHomeData();
    } else if (viewName === 'commandes') {
      updateStats(allOrders);
      renderTable(currentFilter);
    } else if (viewName === 'produits') {
      updateProductSales();
    }
  }
}

function refreshCurrentView() {
  loadOrders();
}

async function loadOrders() {
  // Afficher chargement
  if (document.getElementById('ordersBody')) {
    document.getElementById('ordersBody').innerHTML =
      '<tr><td colspan="8"><div class="loading-state"><span class="spinner"></span> Chargement…</div></td></tr>';
  }
  
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/orders?select=*&order=created_at.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    if (!res.ok) throw new Error('Erreur ' + res.status);
    allOrders = await res.json();
    
    // Mettre à jour le badge de commandes en attente dans la sidebar
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('pendingBadge').textContent = pendingCount;

    // Actualiser les données de la vue courante et des autres
    loadHomeData();
    updateStats(allOrders);
    renderTable(currentFilter);
    updateProductSales();
    
    const now = new Date();
    document.getElementById('lastUpdated').textContent =
      'Actualisé à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.error('Erreur lors du chargement des commandes :', err);
    if (document.getElementById('ordersBody')) {
      document.getElementById('ordersBody').innerHTML =
        '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Erreur de chargement — vérifiez votre connexion</div></div></td></tr>';
    }
    showToast('❌ Erreur de chargement');
  }
}

function loadHomeData() {
  const timeframe = document.getElementById('timeframeFilter').value;
  const channel = document.getElementById('channelFilter').value;

  // 1. Filtrage temporel
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let filtered = allOrders.filter(o => {
    const orderDate = new Date(o.created_at);
    if (timeframe === 'today') {
      return orderDate >= todayStart;
    } else if (timeframe === 'yesterday') {
      return orderDate >= yesterdayStart && orderDate < todayStart;
    } else if (timeframe === '7days') {
      return orderDate >= sevenDaysAgo;
    } else if (timeframe === '30days') {
      return orderDate >= thirtyDaysAgo;
    }
    return true; // all
  });

  // 2. Filtrage par canal simulé (déterminé par l'id de la commande pour rester stable)
  filtered = filtered.filter(o => {
    // Calculer un canal déterministe
    const orderIdNum = Number(String(o.id).replace(/\D/g, '')) || 0;
    const derivedChannel = (orderIdNum % 3 === 0) ? 'facebook' : (orderIdNum % 3 === 1) ? 'whatsapp' : 'direct';
    
    if (channel === 'all') return true;
    return derivedChannel === channel;
  });

  // 3. Calcul des statistiques
  const totalOrdersCount = filtered.length;
  
  // Ventes totales : montant cumulé des commandes livrées uniquement
  const totalRevenue = filtered
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  // Visites estimées stables
  const estimatedVisits = totalOrdersCount > 0 
    ? Math.round(totalOrdersCount * 38 + (totalOrdersCount * 3.5) + 42)
    : 0;

  // Taux de conversion
  const conversionRateStr = estimatedVisits > 0
    ? ((totalOrdersCount / estimatedVisits) * 100).toFixed(2) + '%'
    : '0.00%';

  // 4. Mise à jour de l'affichage
  document.getElementById('homeOrders').textContent = totalOrdersCount;
  document.getElementById('homeRevenue').textContent = totalRevenue.toLocaleString('fr-FR') + ' F';
  document.getElementById('homeVisits').textContent = estimatedVisits.toLocaleString('fr-FR');
  document.getElementById('homeConversion').textContent = conversionRateStr;

  // 5. Performances des packs (Meilleures ventes de bundles)
  renderBundlePerformance(filtered);

  // 6. Rendu des commandes récentes
  renderRecentOrders(filtered.slice(0, 5));
}

function renderBundlePerformance(orders) {
  // Compter le nombre de sachets par pack
  const bundleStats = {
    pack1: { count: 0, label: '1 Acheté = Livraison Gratuite', price: 14990 },
    pack2: { count: 0, label: '2 Achetés = 1 Offert', price: 24990 },
    pack3: { count: 0, label: '3 Achetés = 2 Offerts', price: 32990 }
  };

  orders.forEach(o => {
    const bundleText = String(o.bundle || '').toLowerCase();
    if (bundleText.includes('3 achetés') || bundleText.includes('3 acheté') || bundleText.includes('3achet') || bundleText.includes('6 sachet')) {
      bundleStats.pack3.count += Number(o.quantity) || 6;
    } else if (bundleText.includes('2 achetés') || bundleText.includes('2 acheté') || bundleText.includes('2achet') || bundleText.includes('4 sachet')) {
      bundleStats.pack2.count += Number(o.quantity) || 4;
    } else {
      bundleStats.pack1.count += Number(o.quantity) || 2;
    }
  });

  const totalSachets = bundleStats.pack1.count + bundleStats.pack2.count + bundleStats.pack3.count;

  const html = [
    { key: 'pack1', info: bundleStats.pack1, icon: '📦' },
    { key: 'pack2', info: bundleStats.pack2, icon: '🔥' },
    { key: 'pack3', info: bundleStats.pack3, icon: '👑' }
  ].map(item => {
    const count = item.info.count;
    const pct = totalSachets > 0 ? Math.round((count / totalSachets) * 100) : 0;
    return `
      <div class="perf-item">
        <div class="perf-info">
          <span class="perf-name">${item.icon} ${item.info.label}</span>
          <span class="perf-val">${count} sachets (${pct}%)</span>
        </div>
        <div class="perf-bar-bg">
          <div class="perf-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('bundlePerformanceList').innerHTML = html || '<div class="empty-state">Aucune vente enregistrée</div>';
}

function renderRecentOrders(recentOrders) {
  const badges = {
    pending: '<span class="badge badge-pending"><span class="badge-dot"></span>En attente</span>',
    confirmed: '<span class="badge badge-confirmed"><span class="badge-dot"></span>Confirmée</span>',
    delivered: '<span class="badge badge-delivered"><span class="badge-dot"></span>Livrée</span>',
    cancelled: '<span class="badge badge-cancelled"><span class="badge-dot"></span>Annulée</span>',
  };

  if (recentOrders.length === 0) {
    document.getElementById('recentOrdersBody').innerHTML =
      '<tr><td colspan="4" class="text-center" style="padding:20px; color:var(--gray-400);">Aucune commande récente</td></tr>';
    return;
  }

  document.getElementById('recentOrdersBody').innerHTML = recentOrders.map(o => {
    return `
      <tr class="clickable-row" onclick="openModal('${o.id}')">
        <td style="font-weight: 600;">${esc(o.customer_name || '—')}</td>
        <td><span class="td-bundle" style="font-size: 10px; padding: 2px 6px;">${esc(o.bundle || '—')}</span></td>
        <td style="font-weight: 700;">${o.total_amount ? Number(o.total_amount).toLocaleString('fr-FR') + ' F' : '—'}</td>
        <td>${badges[o.status] || o.status}</td>
      </tr>
    `;
  }).join('');
}

function updateProductSales() {
  const bundleCounts = { pack1: 0, pack2: 0, pack3: 0 };
  allOrders.forEach(o => {
    const bundleText = String(o.bundle || '').toLowerCase();
    if (bundleText.includes('3 achetés') || bundleText.includes('3 acheté') || bundleText.includes('3achet') || bundleText.includes('6 sachet')) {
      bundleCounts.pack3 += 1;
    } else if (bundleText.includes('2 achetés') || bundleText.includes('2 acheté') || bundleText.includes('2achet') || bundleText.includes('4 sachet')) {
      bundleCounts.pack2 += 1;
    } else {
      bundleCounts.pack1 += 1;
    }
  });

  const s1 = document.getElementById('sales-1');
  const s2 = document.getElementById('sales-2');
  const s3 = document.getElementById('sales-3');
  
  if (s1) s1.textContent = `${bundleCounts.pack1} commande${bundleCounts.pack1 > 1 ? 's' : ''}`;
  if (s2) s2.textContent = `${bundleCounts.pack2} commande${bundleCounts.pack2 > 1 ? 's' : ''}`;
  if (s3) s3.textContent = `${bundleCounts.pack3} commande${bundleCounts.pack3 > 1 ? 's' : ''}`;
}

function updateStats(orders) {
  document.getElementById('statTotal').textContent = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('statDelivered').textContent = orders.filter(o => o.status === 'delivered').length;
  const rev = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  document.getElementById('statRevenue').textContent = rev >= 1000 ? (rev / 1000).toFixed(0) + 'k F' : rev + ' F';
}

function renderTable(filter) {
  const rows = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);
  const n = rows.length;
  document.getElementById('tableCount').textContent = n + ' commande' + (n > 1 ? 's' : '');
  if (n === 0) {
    document.getElementById('ordersBody').innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">Aucune commande dans cette catégorie</div></div></td></tr>';
    return;
  }
  const badges = {
    pending: '<span class="badge badge-pending"><span class="badge-dot"></span>En attente</span>',
    confirmed: '<span class="badge badge-confirmed"><span class="badge-dot"></span>Confirmée</span>',
    delivered: '<span class="badge badge-delivered"><span class="badge-dot"></span>Livrée</span>',
    cancelled: '<span class="badge badge-cancelled"><span class="badge-dot"></span>Annulée</span>',
  };
  document.getElementById('ordersBody').innerHTML = rows.map(o => {
    const d = new Date(o.created_at);
    return `<tr class="clickable-row" onclick="event.target.tagName !== 'SELECT' && openModal('${o.id}')">` +
      '<td><div class="td-client-name">' + esc(o.customer_name || '—') + '</div><div class="td-client-phone">' + esc(o.customer_phone || '—') + '</div></td>' +
      '<td class="td-address" title="' + esc(o.address || '') + '">' + esc(o.address || '—') + '</td>' +
      '<td><span class="td-bundle">' + esc(o.bundle || '—') + '</span></td>' +
      '<td class="td-qty" style="text-align:center">' + (o.quantity || '—') + '</td>' +
      '<td class="td-amount">' + (o.total_amount ? Number(o.total_amount).toLocaleString('fr-FR') + ' F' : '—') + '</td>' +
      '<td>' + (badges[o.status] || o.status) + '</td>' +
      '<td><select class="status-select" onchange="updateStatus(\'' + o.id + '\', this.value)">' +
      '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>⏳ En attente</option>' +
      '<option value="confirmed"' + (o.status === 'confirmed' ? ' selected' : '') + '>✅ Confirmée</option>' +
      '<option value="delivered"' + (o.status === 'delivered' ? ' selected' : '') + '>📦 Livrée</option>' +
      '<option value="cancelled"' + (o.status === 'cancelled' ? ' selected' : '') + '>❌ Annulée</option>' +
      '</select></td>' +
      '<td><div class="td-date-main">' + d.toLocaleDateString('fr-FR') + '</div><div class="td-date-time">' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</div></td>' +
      '</tr>';
  }).join('');
}

function filterOrders(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderTable(filter);
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/orders?id=eq.' + id, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error();
    const o = allOrders.find(x => x.id === id);
    if (o) o.status = status;
    
    // Mettre à jour le badge de commandes en attente
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('pendingBadge').textContent = pendingCount;

    loadHomeData();
    updateStats(allOrders);
    renderTable(currentFilter);
    updateProductSales();
    
    // Si le modal est ouvert pour cette commande, actualiser le statut affiché
    if (selectedOrderForModal && selectedOrderForModal.id === id) {
      selectedOrderForModal.status = status;
      const badges = {
        pending: '<span class="badge badge-pending"><span class="badge-dot"></span>En attente</span>',
        confirmed: '<span class="badge badge-confirmed"><span class="badge-dot"></span>Confirmée</span>',
        delivered: '<span class="badge badge-delivered"><span class="badge-dot"></span>Livrée</span>',
        cancelled: '<span class="badge badge-cancelled"><span class="badge-dot"></span>Annulée</span>',
      };
      document.getElementById('modalStatus').innerHTML = badges[status] || status;
    }
    
    showToast('✓ Statut mis à jour');
  } catch { showToast('❌ Erreur lors de la mise à jour'); }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Gestion du Modal
function openModal(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  selectedOrderForModal = order;
  
  const badges = {
    pending: '<span class="badge badge-pending"><span class="badge-dot"></span>En attente</span>',
    confirmed: '<span class="badge badge-confirmed"><span class="badge-dot"></span>Confirmée</span>',
    delivered: '<span class="badge badge-delivered"><span class="badge-dot"></span>Livrée</span>',
    cancelled: '<span class="badge badge-cancelled"><span class="badge-dot"></span>Annulée</span>',
  };

  const d = new Date(order.created_at);
  const formattedDate = d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('modalClientName').textContent = order.customer_name || '—';
  document.getElementById('modalClientPhone').textContent = order.customer_phone || '—';
  document.getElementById('modalClientAddress').textContent = order.address || '—';
  document.getElementById('modalBundle').textContent = order.bundle || '—';
  document.getElementById('modalQuantity').textContent = order.quantity || '—';
  document.getElementById('modalTotalAmount').textContent = order.total_amount ? Number(order.total_amount).toLocaleString('fr-FR') + ' F CFA' : '—';
  document.getElementById('modalStatus').innerHTML = badges[order.status] || order.status;
  document.getElementById('modalDate').textContent = formattedDate;

  // Configuration WhatsApp
  const phoneRaw = String(order.customer_phone || '').replace(/\s+/g, '').replace(/^\+/, '');
  const cleanPhone = phoneRaw.startsWith('221') ? phoneRaw : '221' + phoneRaw;
  const msg = encodeURIComponent(`Bonjour ${order.customer_name}, je vous contacte concernant votre commande BioPrestige de "${order.bundle}".`);
  document.getElementById('btnWhatsApp').href = `https://wa.me/${cleanPhone}?text=${msg}`;

  document.getElementById('orderDetailModal').classList.add('active');
}

function closeModal() {
  document.getElementById('orderDetailModal').classList.remove('active');
  selectedOrderForModal = null;
}

function copyOrderDetails() {
  if (!selectedOrderForModal) return;
  const o = selectedOrderForModal;
  const text = `BioPrestige — Commande\n` +
               `Client: ${o.customer_name || '—'}\n` +
               `Téléphone: ${o.customer_phone || '—'}\n` +
               `Adresse: ${o.address || '—'}\n` +
               `Offre: ${o.bundle || '—'} (x${o.quantity || 1})\n` +
               `Montant: ${o.total_amount ? Number(o.total_amount).toLocaleString('fr-FR') + ' F' : '—'}\n` +
               `Statut: ${o.status || '—'}`;
               
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Infos copiées dans le presse-papier !'))
    .catch(() => showToast('❌ Erreur lors de la copie'));
}

// Actualisation automatique toutes les minutes
setInterval(() => {
  loadOrders();
}, 60000);