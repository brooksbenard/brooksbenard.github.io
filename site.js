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
})();
