// ────────────────────────────────────────────────────────────────────────
// BioPrestige – Facebook Pixel (pixel.js)
// Pixel ID : 1979077993036338
// Événements trackés :
//   - PageView       → au chargement de la page
//   - ViewContent    → quand le produit est vu (page chargée)
//   - InitiateCheckout → quand le popup de commande s'ouvre
//   - Purchase       → quand la commande est validée avec succès
// ────────────────────────────────────────────────────────────────────────

/* ---------------------------------------------------------------
   1️⃣ Initialisation du Pixel Facebook
   --------------------------------------------------------------- */
!function(f,b,e,v,n,t,s){
  if(f.fbq) return;
  n = f.fbq = function() {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = '2.0';
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '1979077993036338');

/* ---------------------------------------------------------------
   2️⃣ PageView — déclenché au chargement de la page
   --------------------------------------------------------------- */
fbq('track', 'PageView');

/* ---------------------------------------------------------------
   3️⃣ ViewContent — déclenché au chargement (produit vu)
   --------------------------------------------------------------- */
fbq('track', 'ViewContent', {
  content_name: 'Poudre Ube Premium',
  content_category: 'Complément alimentaire',
  content_ids: ['ube-premium-001'],
  content_type: 'product',
  currency: 'XOF',
  value: 15000,
});

/* ---------------------------------------------------------------
   4️⃣ InitiateCheckout — déclenché quand le popup s'ouvre
   On surcharge openPopup() défini dans main.js
   --------------------------------------------------------------- */
const _originalOpenPopup = typeof openPopup === 'function' ? openPopup : null;

// On attend que le DOM soit prêt pour intercepter le bouton CTA
document.addEventListener('DOMContentLoaded', () => {

  // Intercepter le bouton CTA pour tracker InitiateCheckout
  const ctaButtons = document.querySelectorAll('.cta-btn');
  ctaButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Récupérer le bundle sélectionné pour enrichir l'événement
      const sel = document.querySelector('.bundle-card.selected');
      const qty = sel ? parseInt(sel.dataset.qty) * 2 : 2;
      const label = sel ? sel.dataset.label : '1 Acheté = 1 Offert';

      fbq('track', 'InitiateCheckout', {
        content_name: 'Poudre Ube Premium',
        content_ids: ['ube-premium-001'],
        content_type: 'product',
        num_items: qty,
        currency: 'XOF',
        value: 15000,
      });
    });
  });

  /* ---------------------------------------------------------------
     5️⃣ Purchase — déclenché après validation réussie de la commande
     On observe les mutations du DOM pour détecter le popup-success
     --------------------------------------------------------------- */
  const popupBody = document.getElementById('popupBody');
  if (popupBody) {
    const purchaseObserver = new MutationObserver(() => {
      const successDiv = popupBody.querySelector('.popup-success');
      if (successDiv && !successDiv.dataset.tracked) {
        // Marquer pour éviter un double-tracking
        successDiv.dataset.tracked = 'true';

        // Récupérer les infos du bundle sélectionné
        const sel = document.querySelector('.bundle-card.selected');
        const qty = sel ? parseInt(sel.dataset.qty) * 2 : 2;

        fbq('track', 'Purchase', {
          content_name: 'Poudre Ube Premium',
          content_ids: ['ube-premium-001'],
          content_type: 'product',
          num_items: qty,
          currency: 'XOF',
          value: 15000,
        });
      }
    });

    purchaseObserver.observe(popupBody, { childList: true, subtree: true });
  }
});

// ────────────────────────────────────────────────────────────────────────
// End of pixel.js
// ────────────────────────────────────────────────────────────────────────