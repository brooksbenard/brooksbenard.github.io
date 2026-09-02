(function() {
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var icon = document.getElementById('theme-icon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }

  function initTheme() {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function() {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
      });
    }
  }

  var followToggle = document.querySelector('.follow-toggle');
  var urls = document.getElementById('author-urls');
  if (followToggle && urls) {
    followToggle.addEventListener('click', function() {
      var open = urls.classList.toggle('is-open');
      followToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  initTheme();

  var updated = document.getElementById('last-updated');
  if (updated) {
    fetch('https://api.github.com/repos/brooksbenard/brooksbenard.github.io/commits?per_page=1')
      .then(function(r) { return r.json(); })
      .then(function(commits) {
        if (commits && commits[0] && commits[0].commit && commits[0].commit.committer) {
          var d = new Date(commits[0].commit.committer.date);
          var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          updated.textContent = months[d.getMonth()] + ' ' + d.getFullYear();
        }
      })
      .catch(function() {});
  }

  var starIcon = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>';
  var forkIcon = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z"/></svg>';

  document.querySelectorAll('[data-repo]').forEach(function(link) {
    var repo = link.getAttribute('data-repo');
    var stats = link.closest('.project-links');
    if (!stats) return;
    var container = stats.querySelector('.github-stats');
    if (!container) return;

    fetch('https://api.github.com/repos/' + repo)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (typeof data.stargazers_count !== 'number') {
          container.textContent = '';
          return;
        }
        container.innerHTML =
          '<span class="stat">' + starIcon + ' ' + data.stargazers_count + '</span>' +
          '<span class="stat">' + forkIcon + ' ' + data.forks_count + '</span>';
      })
      .catch(function() {
        container.textContent = '';
      });
  });

  function initAbstracts() {
    document.querySelectorAll('.abstract[data-full]').forEach(function(abs) {
      abs.textContent = '';
      abs.hidden = true;
    });
  }

  document.querySelectorAll('.show-more').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var pub = btn.closest('.pub');
      if (!pub) return;
      var abs = pub.querySelector('.abstract');
      if (!abs) return;
      var full = abs.getAttribute('data-full');
      if (btn.textContent === 'Show more') {
        abs.hidden = false;
        abs.textContent = full;
        btn.textContent = 'Show less';
      } else {
        abs.textContent = '';
        abs.hidden = true;
        btn.textContent = 'Show more';
      }
    });
  });

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tag = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      document.querySelectorAll('.pub').forEach(function(pub) {
        var tags = (pub.getAttribute('data-tags') || '').split(/\s+/);
        pub.style.display = (tag === 'all' || tags.indexOf(tag) !== -1) ? '' : 'none';
      });
    });
  });

  initAbstracts();

  var SCHOLAR_METRICS_FALLBACK = {
    citations: 469,
    h_index: 10,
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    counts: [6, 14, 27, 39, 57, 73, 131, 116]
  };

  function renderScholarMetrics(data) {
    var widget = document.querySelector('.scholar-metrics');
    if (!widget || !data) return;

    var citations = widget.querySelector('[data-scholar="citations"]');
    var hIndex = widget.querySelector('[data-scholar="h-index"]');
    if (citations && typeof data.citations === 'number') {
      citations.textContent = String(data.citations);
    }
    if (hIndex && typeof data.h_index === 'number') {
      hIndex.textContent = String(data.h_index);
    }

    var bars = widget.querySelector('.scholar-metrics__bars');
    var counts = data.counts || [];
    if (!bars || !counts.length) return;

    while (bars.firstChild) bars.removeChild(bars.firstChild);

    var width = 160;
    var height = 68;
    var gap = 4;
    var barWidth = Math.max(8, (width - gap * (counts.length + 1)) / counts.length);
    var max = Math.max.apply(null, counts) || 1;
    var ns = 'http://www.w3.org/2000/svg';

    counts.forEach(function(count, i) {
      var h = Math.max(2, (count / max) * height);
      var rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', String(gap + i * (barWidth + gap)));
      rect.setAttribute('y', String(height - h));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '1');
      bars.appendChild(rect);
    });
  }

  renderScholarMetrics(SCHOLAR_METRICS_FALLBACK);

  fetch('scholar-metrics.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data) renderScholarMetrics(data);
    })
    .catch(function() {});

  function updateResearchTimeline() {
    var timeline = document.querySelector('.research-timeline');
    var line = document.querySelector('.research-timeline__line');
    var sections = document.querySelectorAll('.research-timeline > .research-section');
    if (!timeline || !line || !sections.length) return;

    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var timelineRect = timeline.getBoundingClientRect();
    var lastSection = sections[sections.length - 1];
    var lastRect = lastSection.getBoundingClientRect();
    var endY = lastRect.top - timelineRect.top + (0.4 + 0.4) * rem;
    var lineTop = 1.15 * rem;

    line.style.top = lineTop + 'px';
    line.style.height = Math.max(0, endY - lineTop) + 'px';

    var ns = 'http://www.w3.org/2000/svg';
    var gap = 4;

    document.querySelectorAll('.research-section--branched').forEach(function(section) {
      var svg = section.querySelector('.research-branches__curves');
      var dots = section.querySelectorAll('.research-branch__dot');
      if (!svg || !dots.length) return;

      var sectionRect = section.getBoundingClientRect();
      var width = Math.max(section.offsetWidth, 1);
      var height = Math.max(section.offsetHeight, 1);
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));

      while (svg.firstChild) svg.removeChild(svg.firstChild);

      var startX = (0.1 + 0.4) * rem;
      var startY = (0.4 + 0.4) * rem;

      Array.prototype.forEach.call(dots, function(dot) {
        var dotRect = dot.getBoundingClientRect();
        // Aim at the vertical midpoint of the open bullet; only inset on X
        // so the curve does not drift above the center.
        var endX = dotRect.left - sectionRect.left - gap;
        var endYDot = dotRect.top - sectionRect.top + dotRect.height / 2;

        var path = document.createElementNS(ns, 'path');
        var d = 'M ' + startX.toFixed(1) + ' ' + startY.toFixed(1) +
          ' C ' + startX.toFixed(1) + ' ' + endYDot.toFixed(1) +
          ', ' + startX.toFixed(1) + ' ' + endYDot.toFixed(1) +
          ', ' + endX.toFixed(1) + ' ' + endYDot.toFixed(1);
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
      });
    });
  }

  updateResearchTimeline();
  window.addEventListener('resize', updateResearchTimeline);
})();
