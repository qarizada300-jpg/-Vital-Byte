/* Vital Byte | Interactive layer */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 1) Live signal network inside the hero */
  function initNetwork(canvas) {
    var hero = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var nodes = [], pulses = [], w = 0, h = 0, dpr = 1;
    var mouse = { x: -9999, y: -9999 };
    var running = true, lastPulse = 0;
    var LINK = 150, MOUSE_R = 180;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(95, Math.round((w * h) / 15000));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.5 + 0.8
        });
      }
    }

    function step(t) {
      if (!running) { requestAnimationFrame(step); return; }
      ctx.clearRect(0, 0, w, h);

      // move nodes; bounce off edges; gently pushed by the mouse
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_R && d > 0) { var f = (MOUSE_R - d) / MOUSE_R * 0.6; n.vx += dx / d * f * 0.05; n.vy += dy / d * f * 0.05; }
        n.vx *= 0.99; n.vy *= 0.99;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // links between nearby nodes
      ctx.lineWidth = 1;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var p = nodes[a], q = nodes[b];
          var ex = p.x - q.x, ey = p.y - q.y, dist = Math.sqrt(ex * ex + ey * ey);
          if (dist < LINK) {
            ctx.strokeStyle = 'rgba(32,185,200,' + ((1 - dist / LINK) * 0.35).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }

      // links to the mouse
      for (var m = 0; m < nodes.length; m++) {
        var mn = nodes[m];
        var mx = mn.x - mouse.x, my = mn.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < MOUSE_R) {
          ctx.strokeStyle = 'rgba(143,243,249,' + ((1 - md / MOUSE_R) * 0.7).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(mn.x, mn.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      // nodes
      for (var k = 0; k < nodes.length; k++) {
        ctx.fillStyle = 'rgba(143,243,249,.85)';
        ctx.beginPath(); ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2); ctx.fill();
      }

      // light pulses travelling along links
      if (t - lastPulse > 260 && nodes.length > 1) {
        lastPulse = t;
        var s = Math.floor(Math.random() * nodes.length), src = nodes[s], best = -1, bd = LINK;
        for (var j = 0; j < nodes.length; j++) {
          if (j === s) continue;
          var ux = src.x - nodes[j].x, uy = src.y - nodes[j].y, ud = Math.sqrt(ux * ux + uy * uy);
          if (ud < bd) { bd = ud; best = j; }
        }
        if (best > -1) pulses.push({ a: s, b: best, t: 0 });
      }
      for (var pi = pulses.length - 1; pi >= 0; pi--) {
        var pl = pulses[pi];
        pl.t += 0.02;
        if (pl.t >= 1) { pulses.splice(pi, 1); continue; }
        var A = nodes[pl.a], B = nodes[pl.b];
        if (!A || !B) continue;
        var px = A.x + (B.x - A.x) * pl.t, py = A.y + (B.y - A.y) * pl.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 8);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(32,185,200,.8)');
        g.addColorStop(1, 'rgba(32,185,200,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      }

      requestAnimationFrame(step);
    }

    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { running = entries[0].isIntersecting; }).observe(hero);
    }
    resize();
    requestAnimationFrame(step);
  }

  /* 2) 3D tilt with glare on cards */
  function initTilt() {
    var els = document.querySelectorAll('.card, .package-card, .usage-card');
    Array.prototype.forEach.call(els, function (el) {
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) translateY(-6px) rotateX(' + ((0.5 - y) * 9).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 9).toFixed(2) + 'deg)';
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  var canvas = document.querySelector('.hero-canvas');
  if (canvas && !reduceMotion) initNetwork(canvas);
  if (canFine && !reduceMotion) initTilt();
})();
