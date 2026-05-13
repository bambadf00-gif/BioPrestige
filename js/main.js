    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    });

    // Mobile menu
    document.getElementById('burger').addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    function closeMobile() { document.getElementById('mobile-menu').classList.add('hidden'); }

    // Gallery thumbs
    document.querySelectorAll('.thumb').forEach(t => {
      t.addEventListener('click', function () {
        document.getElementById('main-img').src = this.dataset.full;
        document.querySelectorAll('.thumb').forEach(x => x.classList.remove('thumb-active'));
        this.classList.add('thumb-active');
      });
    });

    // Bundle selection
    function selectBundle(el) {
      document.querySelectorAll('.bundle-card').forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.bundle-inner').style.background = 'transparent';
        c.querySelector('.bundle-dot').style.borderColor = '#d1d5db';
      });
      el.classList.add('selected');
      el.querySelector('.bundle-inner').style.background = '#9333ea';
      el.querySelector('.bundle-dot').style.borderColor = '#9333ea';
    }

    // Add to cart
    function addToCart() {
      const sel = document.querySelector('.bundle-card.selected');
      const label = sel ? sel.dataset.label : '1 Acheté = 1 Offert';
      const toast = document.getElementById('toast');
      toast.style.opacity = '1';
      setTimeout(() => toast.style.opacity = '0', 3200);
    }

    // FAQ
    function toggleFaq(btn) {
      const answer = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-icon').forEach(i => { i.classList.remove('open'); i.textContent = '+'; });
      if (!isOpen) {
        answer.classList.add('open');
        icon.classList.add('open');
        icon.textContent = '×';
      }
    }

    // WhatsApp
    function sendWhatsApp() {
      const input = document.querySelector('input[type="tel"]');
      const num = (input.value || '').replace(/\s/g, '');
      if (!num) { input.focus(); return; }
      const msg = encodeURIComponent('Bonjour BioPrestige, je souhaite commander la Poudre d\'Ube Premium. Mon numéro : +221' + num);
      window.open('https://wa.me/221XXXXXXXX?text=' + msg, '_blank');
    }

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(r => obs.observe(r));

    // HLS Videos
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