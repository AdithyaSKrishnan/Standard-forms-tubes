// Standard Forms & Tubes — site scripts
(function () {
  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('nav.main');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.classList.remove('open'); });
    });
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Products: search filter + subnav highlight
  var search = document.getElementById('prodSearch');
  if (search) {
    var cards = document.querySelectorAll('[data-product]');
    var secs = document.querySelectorAll('.prod-sec');
    var none = document.querySelector('.noresult');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !q || c.textContent.toLowerCase().indexOf(q) > -1;
        c.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      secs.forEach(function (s) {
        var any = s.querySelectorAll('[data-product]');
        var vis = Array.prototype.some.call(any, function (c) { return c.style.display !== 'none'; });
        s.style.display = (!q || vis) ? '' : 'none';
      });
      if (none) none.style.display = shown ? 'none' : 'block';
    });
  }
  var sublinks = document.querySelectorAll('.subnav a');
  if (sublinks.length && 'IntersectionObserver' in window) {
    var map = {};
    sublinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          sublinks.forEach(function (a) { a.classList.remove('on'); });
          map[e.target.id].classList.add('on');
          map[e.target.id].scrollIntoView({ block: 'nearest', inline: 'center' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.prod-sec').forEach(function (s) { so.observe(s); });
  }

  // Gallery filter + lightbox
  var gal = document.querySelector('.gallery');
  if (gal) {
    var figs = Array.prototype.slice.call(gal.querySelectorAll('figure'));
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.filters button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var f = b.dataset.filter;
        figs.forEach(function (fig) { fig.classList.toggle('hide', f !== 'all' && fig.dataset.cat !== f); });
      });
    });
    var lb = document.querySelector('.lightbox');
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('p');
    var idx = 0;
    function visible() { return figs.filter(function (f) { return !f.classList.contains('hide'); }); }
    function show(i) {
      var v = visible(); if (!v.length) return;
      idx = (i + v.length) % v.length;
      var im = v[idx].querySelector('img');
      lbImg.src = im.src; lbImg.alt = im.alt;
      lbCap.textContent = v[idx].querySelector('figcaption').firstChild.textContent.trim();
      lb.classList.add('open');
    }
    figs.forEach(function (f) { f.addEventListener('click', function () { show(visible().indexOf(f)); }); });
    lb.querySelector('.x').onclick = function () { lb.classList.remove('open'); };
    lb.querySelector('.prev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('.next').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Contact form: prefill product from ?product= and send via email client
  var form = document.getElementById('enquiryForm');
  if (form) {
    var p = new URLSearchParams(location.search).get('product');
    if (p) {
      var sel = form.querySelector('#fProduct');
      var opt = Array.prototype.find.call(sel.options, function (o) { return o.text === p || o.value === p; });
      if (!opt) { opt = new Option(p, p); sel.add(opt, 1); }
      sel.value = opt.value;
      form.querySelector('#fMsg').value = 'Please share price and availability for: ' + p + '\nQuantity / size: ';
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var isWa = e.submitter && e.submitter.dataset.via === 'wa';
      var body = 'Name: ' + d.get('name') + '\nPhone: ' + d.get('phone') + '\nEmail: ' + (d.get('email') || '-') +
        '\nCompany / Site: ' + (d.get('company') || '-') + '\nProduct: ' + (d.get('product') || '-') + '\n\n' + d.get('message');
      var subj = 'Enquiry: ' + (d.get('product') || 'General') + ' — ' + d.get('name');

      var payload = {
        name: d.get('name'),
        phone: d.get('phone'),
        email: d.get('email') || null,
        company: d.get('company') || null,
        product: d.get('product') || null,
        message: d.get('message'),
        channel: isWa ? 'whatsapp' : 'web'
      };

      // Record lead in backend database
      try {
        fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function (err) { console.warn('Backend sync error:', err); });
      } catch (err) {}

      if (isWa) {
        window.open('https://wa.me/917994338833?text=' + encodeURIComponent(subj + '\n' + body), '_blank');
      } else {
        var submitBtn = form.querySelector('button[data-via="mail"]');
        var originalText = submitBtn ? submitBtn.textContent : 'Send by Email';
        if (submitBtn) { submitBtn.textContent = 'Sending...'; submitBtn.disabled = true; }

        try {
          var response = await fetch('/api/enquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          var resData = await response.json();
          if (response.ok && resData.success) {
            form.innerHTML = '<div style="background:#1a202c;border:1px solid #22c55e;color:#fff;padding:28px;border-radius:8px;text-align:center">' +
              '<div style="font-size:36px;color:#22c55e;margin-bottom:10px">✓</div>' +
              '<h3 style="color:#22c55e;margin-bottom:8px;font-size:20px">Enquiry Received!</h3>' +
              '<p style="color:#d3d7dc;line-height:1.5">Thank you, <b>' + (d.get('name') || '') + '</b>. Our sales team has received your requirement and will contact you shortly.</p>' +
              '<div style="margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
                '<a class="btn btn-red btn-sm" href="products.html">Explore Products</a>' +
                '<a class="btn btn-line btn-sm" href="https://wa.me/917994338833?text=' + encodeURIComponent(subj + '\n' + body) + '" target="_blank" style="border-color:#25d366;color:#25d366">Also chat on WhatsApp</a>' +
              '</div>' +
            '</div>';
            return;
          }
        } catch (postErr) {
          console.warn('API error, falling back to mail client:', postErr);
        }

        // Fallback to mailto if offline or API unavailable
        location.href = 'mailto:standardformsclt@gmail.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
      }
    });
  }
})();
