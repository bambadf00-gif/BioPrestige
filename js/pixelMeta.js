// ────────────────────────────────────────────────────────────────────────
// BioPrestige – Facebook Pixel (pixel.js)
// Pixel ID : 1979077993036338
// Événements trackés :
//   - PageView       → au chargement de la page
//   - ViewContent    → quand le produit est vu (page chargée)
//   - InitiateCheckout → quand le popup de commande s'ouvre
//   - Purchase       → quand la commande est validée avec succès
// ────────────────────────────────────────────────────────────────────────

!function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
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

// 1️⃣ Événements de base (Chargement)
fbq('track', 'PageView');
fbq('track', 'ViewContent', {
  content_name: "Poudre d'Ube Premium",
  content_category: 'Complément alimentaire',
  content_ids: ['ube-premium-001'],
  content_type: 'product',
  currency: 'XOF',
  value: 15000,
});

// Attente du chargement de la page pour les clics et formulaires
document.addEventListener('DOMContentLoaded', () => {

  // 2️⃣ Événement : InitiateCheckout (Ouverture formulaire / Clic CTA)
  const ctaButtons = document.querySelectorAll('.cta-btn');
  ctaButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = document.querySelector('.bundle-card.selected');

      // Récupération dynamique des données du pack sélectionné
      const qty = sel && sel.dataset.qty ? parseInt(sel.dataset.qty) : 2; // Défaut à 2 articles
      const price = sel && sel.dataset.price ? parseFloat(sel.dataset.price) : 15000; // Prix dynamique

      fbq('track', 'InitiateCheckout', {
        content_name: "Poudre d'Ube Premium",
        content_ids: ['ube-premium-001'],
        content_type: 'product',
        num_items: qty,
        currency: 'XOF',
        value: price,
      });
    });
  });

  // 3️⃣ Événement : Purchase (Détection du message Succès)
  const popupBody = document.getElementById('popupBody');
  if (popupBody) {
    const purchaseObserver = new MutationObserver(() => {
      const successDiv = popupBody.querySelector('.popup-success');
      if (successDiv && !successDiv.dataset.tracked) {
        successDiv.dataset.tracked = 'true'; // Évite le double déclenchement

        const sel = document.querySelector('.bundle-card.selected');
        const qty = sel && sel.dataset.qty ? parseInt(sel.dataset.qty) : 2;
        const price = sel && sel.dataset.price ? parseFloat(sel.dataset.price) : 15000;

        fbq('track', 'Purchase', {
          content_name: "Poudre d'Ube Premium",
          content_ids: ['ube-premium-001'],
          content_type: 'product',
          num_items: qty,
          currency: 'XOF',
          value: price,
        });
      }
    });

    purchaseObserver.observe(popupBody, { childList: true, subtree: true });
  }
});

// ────────────────────────────────────────────────────────────────────────
// End of pixel.js
// ────────────────────────────────────────────────────────────────────────