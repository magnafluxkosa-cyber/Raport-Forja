(function(){
  try{
    var names = ['robots','googlebot','bingbot'];
    names.forEach(function(name){
      var m = document.querySelector('meta[name="'+name+'"]');
      if(!m){
        m = document.createElement('meta');
        m.setAttribute('name', name);
        document.head.appendChild(m);
      }
      m.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
    });
  }catch(e){}
})();
