// Search, filters and sort for the hub's Explore page. Plain JavaScript from this site, no libraries.
// Without it the page still shows every cell, latest update first, and the Browse pages still work.
(function () {
  var grid = document.getElementById('grid');
  if (!grid) return;
  document.documentElement.className += ' js';
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var q = document.getElementById('q'), sort = document.getElementById('sort');
  var count = document.getElementById('count'), none = document.getElementById('none');
  var facets = document.getElementById('facets'), nfilters = document.getElementById('nfilters');
  var boxes = Array.prototype.slice.call(facets.querySelectorAll('input[type=checkbox]'));
  if (window.matchMedia('(min-width: 60rem)').matches) facets.open = true;

  var params = new URLSearchParams(location.search);
  q.value = params.get('q') || '';
  if (params.get('sort')) sort.value = params.get('sort');
  boxes.forEach(function (b) { if ((params.get(b.name) || '').split(',').indexOf(b.value) !== -1) b.checked = true; });

  // Relative times ("3 hours ago") from the build times in the page; the date stays in the datetime attribute.
  var now = Date.now();
  Array.prototype.forEach.call(document.querySelectorAll('.card time'), function (t) {
    var d = Date.parse(t.getAttribute('datetime'));
    if (isNaN(d) || t.getAttribute('datetime').length < 11) return;
    var m = Math.round((now - d) / 60000), s;
    if (m < 0) return;
    if (m < 60) s = m + ' min ago'; else if (m < 1440) s = Math.round(m / 60) + ' h ago'; else s = Math.round(m / 1440) + ' days ago';
    t.title = t.textContent; t.textContent = s;
  });

  function picked(name) {
    return boxes.filter(function (b) { return b.name === name && b.checked; }).map(function (b) { return b.value; });
  }
  function matches(card, name, values) {
    if (!values.length) return true;
    var have = (card.dataset[name] || '').split(' ');
    return values.some(function (v) { return have.indexOf(v) !== -1; });
  }
  var keys = { latest: function (c) { return c.dataset.built || ''; }, made: function (c) { return c.dataset.made || ''; }, name: function (c) { return c.dataset.name; } };
  function apply() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    var sel = {}, nsel = 0;
    ['collection', 'topics', 'caps', 'features', 'owner', 'status'].forEach(function (n) { sel[n] = picked(n); nsel += sel[n].length; });
    cards.forEach(function (c) {
      var ok = Object.keys(sel).every(function (n) { return matches(c, n, sel[n]); }) &&
        words.every(function (w) { return c.dataset.text.indexOf(w) !== -1; });
      c.hidden = !ok;
      if (ok) shown++;
    });
    var k = keys[sort.value] || keys.latest, asc = sort.value === 'name';
    cards.slice().sort(function (a, b) {
      var x = k(a), y = k(b);
      return asc ? x.localeCompare(y) : (y.localeCompare(x) || (b.dataset.made || '').localeCompare(a.dataset.made || ''));
    }).forEach(function (c) { grid.appendChild(c); });
    count.textContent = shown === cards.length ? cards.length + ' cells' : 'Showing ' + shown + ' of ' + cards.length + ' cells';
    none.hidden = shown !== 0;
    nfilters.textContent = nsel ? '(' + nsel + ')' : '';
    var p = new URLSearchParams();
    if (q.value) p.set('q', q.value);
    Object.keys(sel).forEach(function (n) { if (sel[n].length) p.set(n, sel[n].join(',')); });
    if (sort.value !== 'latest') p.set('sort', sort.value);
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {}
  }
  q.addEventListener('input', apply);
  sort.addEventListener('change', apply);
  boxes.forEach(function (b) { b.addEventListener('change', apply); });
  document.getElementById('clear').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); q.value = ''; apply(); });
  apply();
})();
