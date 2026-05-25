(function(){
  try{
    var existing = document.querySelector('meta[name="robots"]');
    if (!existing) {
      existing = document.createElement('meta');
      existing.setAttribute('name', 'robots');
      document.head.appendChild(existing);
    }
    existing.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
  } catch(e) {}
})();
