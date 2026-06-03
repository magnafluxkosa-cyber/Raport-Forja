// K.A.D hotfix: filtrarea multiplă globală a fost dezactivată pentru a elimina blocarea la încărcare.
window.KAD_MULTI_FILTER = window.KAD_MULTI_FILTER || { __installed: true, values: function(){return [];}, matches: function(){return true;}, hasMulti: function(){return false;} };
