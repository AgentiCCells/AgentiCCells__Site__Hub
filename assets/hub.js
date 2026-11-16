// Search and filters for the hub home page. Plain JavaScript from this site, no libraries.
// Without it the page still lists every cell.
(function () {
  var grid = document.getElementById('grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.children);
  var q = document.getElementById('q'), kind = document.getElementById('kind'), status = document.getElementById('status'), where = document.getElementById('where');
  var count = document.getElementById('count'), none = document.getElementById('none');
  var params = new URLSearchParams(location.search);
  q.value = params.get('q') || '';
  if (params.get('kind')) kind.value = params.get('kind');
  if (params.get('status')) status.value = params.get('status');
  if (params.get('where')) where.value = params.get('where');
  function apply() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    cards.forEach(function (c) {
      var ok = (!kind.value || c.dataset.kind === kind.value) && (!status.value || c.dataset.status === status.value) && (!where.value || c.dataset.live === where.value) &&
        words.every(function (w) { return c.dataset.text.indexOf(w) !== -1; });
      c.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown === cards.length ? cards.length + ' cells' : 'Showing ' + shown + ' of ' + cards.length + ' cells';
    none.hidden = shown !== 0;
    var p = new URLSearchParams();
    if (q.value) p.set('q', q.value);
    if (kind.value) p.set('kind', kind.value);
    if (status.value) p.set('status', status.value);
    if (where.value) p.set('where', where.value);
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {}
  }
  [q, kind, status, where].forEach(function (el) { el.addEventListener('input', apply); el.addEventListener('change', apply); });
  apply();
})();
