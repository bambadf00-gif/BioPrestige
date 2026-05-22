// ── Navbar scroll shadow ──────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

// ── Mobile menu ───────────────────────────────────────────────────────
document.getElementById('burger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});
function closeMobile() {
  document.getElementById('mobile-menu').classList.add('hidden');
}

// ── Gallery thumbs ────────────────────────────────────────────────────
document.querySelectorAll('.thumb').forEach(t => {
  t.addEventListener('click', function () {
    document.getElementById('main-img').src = this.dataset.full;
    document.querySelectorAll('.thumb').forEach(x => x.classList.remove('thumb-active'));
    this.classList.add('thumb-active');
  });
});

// ── Bundle selection (met à jour le popup aussi) ──────────────────────
function selectBundle(el) {
  document.querySelectorAll('.bundle-card').forEach(c => {
    c.classList.remove('selected');
    c.querySelector('.bundle-inner').style.background = 'transparent';
    c.querySelector('.bundle-dot').style.borderColor = '#d1d5db';
  });
  el.classList.add('selected');
  el.querySelector('.bundle-inner').style.background = '#9333ea';
  el.querySelector('.bundle-dot').style.borderColor = '#9333ea';

  // Met à jour l'affichage dans le popup
  const qty = parseInt(el.dataset.qty);
  const label = el.dataset.label;
  const popupLabel = document.getElementById('popupBundleLabel');
  const popupQty = document.getElementById('popupBundleQty');
  if (popupLabel) popupLabel.textContent = label;
  if (popupQty) popupQty.textContent = `× ${qty * 2} sachets`;
}

// ── Popup commande ────────────────────────────────────────────────────
const overlay = document.getElementById('popupOverlay');

function openPopup() {
  // Sync bundle au moment de l'ouverture
  const sel = document.querySelector('.bundle-card.selected');
  if (sel) {
    const qty = parseInt(sel.dataset.qty);
    const label = sel.dataset.label;
    document.getElementById('popupBundleLabel').textContent = label;
    document.getElementById('popupBundleQty').textContent = `× ${qty * 2} sachets`;
  }
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

// Bouton "Commander maintenant"
document.querySelector('.cta-btn').addEventListener('click', openPopup);

// Fermer avec le ✕
document.getElementById('popupClose').addEventListener('click', closePopup);

// Fermer au clic en dehors du modal
overlay.addEventListener('click', function (e) {
  if (e.target === this) closePopup();
});

// Fermer avec Échap
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePopup();
});

// ── Soumission du formulaire ──────────────────────────────────────────
document.getElementById('popupSubmit').addEventListener('click', async () => {
  const nom = document.getElementById('popup-nom').value.trim();
  const tel = document.getElementById('popup-tel').value.trim();
  const adresse = document.getElementById('popup-adresse').value.trim();
  const sel = document.querySelector('.bundle-card.selected');
  const bundle = sel ? sel.dataset.label : '1 Acheté = 1 Offert';

  if (!nom || !tel || !adresse) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const btn = document.getElementById('popupSubmit');
  btn.textContent = '⏳ Envoi en cours…';
  btn.disabled = true;

  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbzEswTVToiQG-Px_K5Zj2q8mGIHEjBdgiJsFvSylU7TAzsXF2gyTIH1y7k9IbwjjOcokA/exec',
      { method: 'POST', body: JSON.stringify({ nom, telephone: tel, adresse, bundle }) }
    );
    const data = await res.json();

    if (data.success) {
      document.getElementById('popupBody').innerHTML = `
        <div class="popup-success">
          <div class="icon">✅</div>
          <h3>Commande validée !</h3>
          <p>Merci <strong>${nom}</strong> !<br>
          Notre équipe vous contactera bientôt au<br>
          <strong>+221 ${tel}</strong> pour la livraison.</p>
        </div>
      `;
      setTimeout(closePopup, 3200);
    } else {
      throw new Error('Erreur serveur');
    }
  } catch {
    btn.textContent = '✅  Valider ma commande';
    btn.disabled = false;
    alert('Une erreur est survenue. Réessayez ou contactez-nous sur WhatsApp.');
  }
});

// ── FAQ ───────────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach(i => {
    i.classList.remove('open');
    i.textContent = '+';
  });
  if (!isOpen) {
    answer.classList.add('open');
    icon.classList.add('open');
    icon.textContent = '×';
  }
}

// ── WhatsApp ──────────────────────────────────────────────────────────
function sendWhatsApp() {
  const input = document.querySelector('input[type="tel"]');
  const num = (input.value || '').replace(/\s/g, '');
  if (!num) { input.focus(); return; }
  const msg = encodeURIComponent(
    "Bonjour BioPrestige, je souhaite commander la Poudre d'Ube Premium. Mon numéro : +221" + num
  );
  window.open('https://wa.me/221XXXXXXXX?text=' + msg, '_blank');
}

// ── Scroll reveal ─────────────────────────────────────────────────────
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(r => obs.observe(r));

// ── HLS Videos ───────────────────────────────────────────────────────
const videos = [
  { id: 'v1', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/bd113e07362a43d6a7a157ac91cd55a9/bd113e07362a43d6a7a157ac91cd55a9.m3u8' },
  { id: 'v2', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/7e18f582d1fe4ee09d3e34a21a39b60a/7e18f582d1fe4ee09d3e34a21a39b60a.m3u8' },
  { id: 'v3', src: 'https://bioprestige.shop/cdn/shop/videos/c/vp/e77ce927c5454680aeb65ae2735f858a/e77ce927c5454680aeb65ae2735f858a.m3u8' },
];
videos.forEach(({ id, src }) => {
  const video = document.getElementById(id);
  if (!video) return;
  if (Hls.isSupported()) {
    const hls = new Hls({ enableWorker: false });
    hls.loadSource(src);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
  }
});