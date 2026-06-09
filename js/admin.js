const SUPABASE_URL = 'https://odmlmwpdtvavhucvgrza.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWxtd3BkdHZhdmh1Y3ZncnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzczODUsImV4cCI6MjA5NTcxMzM4NX0.OaAQdnYM8vBSNcz4-c3EH3-3XDz1qfdLOm8yFqoMNMQ';
const ADMIN_PASS = 'biop2026';

let allOrders = [];
let currentFilter = 'all';

function doLogin() {
  if (document.getElementById('passwordInput').value === ADMIN_PASS) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadOrders(); 
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
}

function doLogout() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

async function loadOrders() {
  document.getElementById('ordersBody').innerHTML =
    '<tr><td colspan="8"><div class="loading-state"><span class="spinner"></span> Chargement…</div></td></tr>';
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/orders?select=*&order=created_at.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    if (!res.ok) throw new Error('Erreur ' + res.status);
    allOrders = await res.json();
    updateStats(allOrders);
    renderTable(currentFilter);
    const now = new Date();
    document.getElementById('lastUpdated').textContent =
      'Actualisé à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    document.getElementById('ordersBody').innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Erreur de chargement — vérifiez votre clé anon</div></div></td></tr>';
  }
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
    return '<tr>' +
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
    updateStats(allOrders);
    renderTable(currentFilter);
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

setInterval(() => {
  if (document.getElementById('dashboard').style.display !== 'none') loadOrders();
}, 60000);