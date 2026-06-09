// ────────────────────────────────────────────────────────────────────────
// BioPrestige1 – Main JavaScript
// MISE À JOUR : envoi des commandes vers Supabase
// ────────────────────────────────────────────────────────────────────────

/* ---------------------------------------------------------------
   Configuration Supabase
   --------------------------------------------------------------- */
const SUPABASE_URL = 'https://odmlmwpdtvavhucvgrza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWxtd3BkdHZhdmh1Y3ZncnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzczODUsImV4cCI6MjA5NTcxMzM4NX0.OaAQdnYM8vBSNcz4-c3EH3-3XDz1qfdLOm8yFqoMNMQ'; // ← Clé anon depuis Paramètres → Clés API

/* ---------------------------------------------------------------
   Navigation bar scroll handling
   --------------------------------------------------------------- */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

/* ---------------------------------------------------------------
   Mobile burger menu
   --------------------------------------------------------------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
}
function closeMobile() {
  mobileMenu && mobileMenu.classList.add('hidden');
}

/* ---------------------------------------------------------------
   Image gallery (thumbnail interaction)
   --------------------------------------------------------------- */
document.querySelectorAll('.thumb').forEach((thumb) => {
  thumb.addEventListener('click', function () {
    const mainImg = document.getElementById('main-img');
    if (mainImg) mainImg.src = this.dataset.full;
    document.querySelectorAll('.thumb').forEach((t) => t.classList.remove('thumb-active'));
    this.classList.add('thumb-active');
  });
});

/* ---------------------------------------------------------------
   Bundle (offer) selection and popup synchronization
   --------------------------------------------------------------- */
function selectBundle(el) {
  document.querySelectorAll('.bundle-card').forEach((c) => {
    c.classList.remove('selected');
    c.querySelector('.bundle-inner').style.background = 'transparent';
    c.querySelector('.bundle-dot').style.borderColor = '#d1d5db';
  });
  el.classList.add('selected');
  el.querySelector('.bundle-inner').style.background = '#9333ea';
  el.querySelector('.bundle-dot').style.borderColor = '#9333ea';

  const qty = parseInt(el.dataset.qty);
  const label = el.dataset.label;
  const popupLabel = document.getElementById('popupBundleLabel');
  const popupQty = document.getElementById('popupBundleQty');
  if (popupLabel) popupLabel.textContent = label;
  if (popupQty) popupQty.textContent = `× ${qty * 2} sachets`;
}

/* ---------------------------------------------------------------
   Order popup (open/close logic)
   --------------------------------------------------------------- */
const overlay = document.getElementById('popupOverlay');
function openPopup() {
  const sel = document.querySelector('.bundle-card.selected');
  if (sel) {
    const qty = parseInt(sel.dataset.qty);
    const label = sel.dataset.label;
    document.getElementById('popupBundleLabel').textContent = label;
    document.getElementById('popupBundleQty').textContent = `× ${qty * 2} sachets`;
  }
  overlay && overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closePopup() {
  overlay && overlay.classList.remove('visible');
  document.body.style.overflow = '';
}
const ctaBtn = document.querySelector('.cta-btn');
ctaBtn && ctaBtn.addEventListener('click', openPopup);
const closeBtn = document.getElementById('popupClose');
closeBtn && closeBtn.addEventListener('click', closePopup);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
});

/* ---------------------------------------------------------------
   Toast helper (client-side feedback)
   --------------------------------------------------------------- */
function showToast(msg, type = 'error') {
  const containerId = 'popupMessage';
  const existing = document.getElementById(containerId);
  if (existing) existing.remove();
  const container = document.createElement('div');
  container.id = containerId;
  container.textContent = msg;
  container.style.margin = '0.5rem 0';
  container.style.padding = '0.5rem 1rem';
  container.style.borderRadius = '0.375rem';
  container.style.fontSize = '0.875rem'; 
  container.style.fontWeight = '500';
  container.style.backgroundColor = type === 'error' ? '#fecaca' : '#bbf7d0';
  container.style.color = type === 'error' ? '#991b1b' : '#14532d';
  const body = document.getElementById('popupBody');
  if (body) body.prepend(container);
}

/* ---------------------------------------------------------------
   Form validation utilities
   --------------------------------------------------------------- */
const isNameValid = (n) => /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]{2,}$/.test(n);
const isPhoneValid = (t) => {
  const cleaned = t.replace(/\s+/g, '');
  const withoutPrefix = cleaned.replace(/^(\+?221|00221)/, '');
  return /^(70|71|76|77|78)\d{7}$/.test(withoutPrefix);
};
const isAddressValid = (a, n) => {
  const pattern = /^[A-Za-z0-9\s,.-]{5,}$/;
  return pattern.test(a) && a.toLowerCase() !== n.toLowerCase();
};

/* ---------------------------------------------------------------
   ✅ Order form submission — envoi vers Supabase
   --------------------------------------------------------------- */
const submitBtn = document.getElementById('popupSubmit');
submitBtn && submitBtn.addEventListener('click', async () => {
  const nom = document.getElementById('popup-nom').value.trim();
  const tel = document.getElementById('popup-tel').value.trim();
  const adresse = document.getElementById('popup-adresse').value.trim();

  // Vérification champs vides
  if (!nom || !tel || !adresse) {
    showToast('Veuillez remplir tous les champs obligatoires.');
    return;
  }
  // Validation nom
  if (!isNameValid(nom)) {
    showToast("Le nom est invalide. Utilisez uniquement des lettres, espaces, apostrophes ou tirets.");
    return;
  }
  // Validation téléphone
  if (!isPhoneValid(tel)) {
    showToast('Numéro de téléphone invalide. Il doit commencer par 70, 71, 76, 77 ou 78 et contenir 9 chiffres.');
    return;
  }
  // Validation adresse
  if (!isAddressValid(adresse, nom)) {
    showToast('Adresse invalide ou identique au nom. Veuillez corriger.');
    return;
  }

  // Bundle sélectionné
  const sel = document.querySelector('.bundle-card.selected');
  const bundle = sel ? sel.dataset.label : '1 Acheté = 1 Offert';
  const selectedQty = sel ? parseInt(sel.dataset.qty) * 2 : 2;

  // Calculer le montant total selon le bundle
  const totalAmount = sel ? parseInt(sel.dataset.price) : 14990;

  // Désactiver le bouton pendant l'envoi
  submitBtn.textContent = '⏳ Envoi en cours…';
  submitBtn.disabled = true;

  try {
    // ✅ Envoi vers Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        customer_name: nom,
        customer_phone: tel,
        address: adresse,
        bundle: bundle,
        quantity: selectedQty,
        total_amount: totalAmount,
        status: 'pending'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur Supabase');
    }

    // ✅ Succès
    document.getElementById('popupBody').innerHTML = `
      <div class="popup-success">
        <div class="icon">✅</div>
        <h3>Commande validée !</h3>
        <p>Merci <strong>${nom}</strong> !<br>
        Quantité commandée : <strong>${selectedQty} sachets</strong>.<br>
        Nous vous contacterons bientôt au<br>
        <strong>+221 ${tel}</strong> pour la livraison.
        </p>
      </div>`;
    setTimeout(closePopup, 3200);

  } catch (err) {
    submitBtn.textContent = '✅  Valider ma commande';
    submitBtn.disabled = false;
    showToast('Erreur réseau. Vérifiez votre connexion ou contactez-nous sur WhatsApp.', 'error');
    console.error('Submission error:', err);
  }
});

/* ---------------------------------------------------------------
   FAQ toggle functionality
   --------------------------------------------------------------- */
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach((a) => a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach((i) => {
    i.classList.remove('open');
    i.textContent = '+';
  });
  if (!isOpen) {
    answer.classList.add('open');
    icon.classList.add('open');
    icon.textContent = '×';
  }
}

/* ---------------------------------------------------------------
   WhatsApp integration
   --------------------------------------------------------------- */
function sendWhatsApp() {
  const input = document.querySelector('input[type="tel"]');
  const num = (input?.value || '').replace(/\s/g, '');
  if (!num) {
    input && input.focus();
    return;
  }
  const msg = encodeURIComponent(`Bonjour BioPrestige, je souhaite commander la Poudre d'Ube Premium. Mon numéro : +221${num}`);
  window.open(`https://wa.me/221XXXXXXXX?text=${msg}`, '_blank');
}

/* ---------------------------------------------------------------
   Scroll-reveal
   --------------------------------------------------------------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

/* ---------------------------------------------------------------
   HLS video handling
   --------------------------------------------------------------- */
const videos = [
  { id: 'v1', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/bd113e07362a43d6a7a157ac91cd55a9/bd113e07362a43d6a7a157ac91cd55a9.m3u8' },
  { id: 'v2', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/7e18f582d1fe4ee09d3e34a21a39b60a/7e18f582d1fe4ee09d3e34a21a39b60a.m3u8' },
  { id: 'v3', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/e77ce927c5454680aeb65ae2735f858a/e77ce927c5454680aeb65ae2735f858a.m3u8' },
];
videos.forEach(({ id, src }) => {
  const video = document.getElementById(id);
  if (!video) return;
  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls({ enableWorker: false });
    hls.loadSource(src);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
  }
});

// ────────────────────────────────────────────────────────────────────────
// End of main.js
// ────────────────────────────────────────────────────────────────────────