(function(){
  'use strict';

  var STORAGE_KEY = 'kad_language';
  var LEGACY_KEYS = ['rf_language','kad_lang','KAD_LANGUAGE','rf_i18n_lang'];
  var SUPPORTED = ['ro','en','fr','it','de','hu'];
  var LANG_NAMES = {
    ro:'Română', en:'English', fr:'Français', it:'Italiano', de:'Deutsch', hu:'Magyar'
  };

  // Performance: cache traducerile pe text + limbă.
  // Paginile mari de pontaj au mii de celule identice, iar fără cache traducerea reface
  // aceleași regex-uri de foarte multe ori.
  var TEXT_CACHE = Object.create(null);
  var TEXT_CACHE_COUNT = 0;
  var TEXT_CACHE_LIMIT = 6000;
  function cacheGet(k){ return Object.prototype.hasOwnProperty.call(TEXT_CACHE, k) ? TEXT_CACHE[k] : null; }
  function cacheSet(k, v){
    if(TEXT_CACHE_COUNT > TEXT_CACHE_LIMIT){ TEXT_CACHE = Object.create(null); TEXT_CACHE_COUNT = 0; }
    if(!Object.prototype.hasOwnProperty.call(TEXT_CACHE, k)) TEXT_CACHE_COUNT++;
    TEXT_CACHE[k] = v;
    return v;
  }

  function normalizeLang(v){
    v = String(v || '').toLowerCase().trim();
    if(v.indexOf('rom') === 0 || v === 'ro-ro') return 'ro';
    if(v.indexOf('eng') === 0 || v === 'en-us' || v === 'en-gb') return 'en';
    if(v.indexOf('fra') === 0 || v.indexOf('fre') === 0 || v === 'fr-fr') return 'fr';
    if(v.indexOf('ita') === 0 || v === 'it-it') return 'it';
    if(v.indexOf('ger') === 0 || v.indexOf('deu') === 0 || v === 'de-de') return 'de';
    if(v.indexOf('hun') === 0 || v.indexOf('mag') === 0 || v === 'hu-hu') return 'hu';
    return SUPPORTED.indexOf(v) >= 0 ? v : 'ro';
  }

  function getLang(){
    try{
      var v = localStorage.getItem(STORAGE_KEY);
      if(v) return normalizeLang(v);
      for(var i=0;i<LEGACY_KEYS.length;i++){
        v = localStorage.getItem(LEGACY_KEYS[i]);
        if(v) return normalizeLang(v);
      }
    }catch(_){ }
    return 'ro';
  }

  function setLang(lang){
    lang = normalizeLang(lang);
    try{
      localStorage.setItem(STORAGE_KEY, lang);
      for(var i=0;i<LEGACY_KEYS.length;i++) localStorage.setItem(LEGACY_KEYS[i], lang);
    }catch(_){ }
    window.KAD_CURRENT_LANGUAGE = lang;
    try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
    translatePage();
    updateSelector(lang);
  }

  var MONTHS = {
    ro:{long:['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'], short:['IAN','FEB','MAR','APR','MAI','IUN','IUL','AUG','SEP','OCT','NOI','DEC']},
    en:{long:['January','February','March','April','May','June','July','August','September','October','November','December'], short:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']},
    fr:{long:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'], short:['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC']},
    it:{long:['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'], short:['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC']},
    de:{long:['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'], short:['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ']},
    hu:{long:['Január','Február','Március','Április','Május','Június','Július','Augusztus','Szeptember','Október','November','December'], short:['JAN','FEB','MÁR','ÁPR','MÁJ','JÚN','JÚL','AUG','SZE','OKT','NOV','DEC']}
  };

  var DAYS = {
    ro:['luni','marți','miercuri','joi','vineri','sâmbătă','duminică'],
    en:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    fr:['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
    it:['lunedì','martedì','mercoledì','giovedì','venerdì','sabato','domenica'],
    de:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
    hu:['hétfő','kedd','szerda','csütörtök','péntek','szombat','vasárnap']
  };

  var EXACT = Object.create(null);
  function key(s){ return String(s == null ? '' : s).replace(/\s+/g,' ').trim().toLowerCase(); }
  function addExact(source, ro,en,fr,it,de,hu){
    var vals = {ro:ro,en:en,fr:fr,it:it,de:de,hu:hu};
    if(source) EXACT[key(source)] = vals;
    Object.keys(vals).forEach(function(lang){
      if(vals[lang]) EXACT[key(vals[lang])] = vals;
    });
  }

  // Core UI exact phrases used across all ERP pages.
  addExact('Înapoi la Dashboard','Înapoi la Dashboard','Back to Dashboard','Retour au tableau de bord','Torna alla dashboard','Zurück zum Dashboard','Vissza a vezérlőpulthoz');
  addExact('Dashboard','Dashboard','Dashboard','Tableau de bord','Dashboard','Dashboard','Vezérlőpult');
  addExact('Înapoi la Index','Înapoi la Index','Back to Index','Retour à l’index','Torna all’indice','Zurück zum Index','Vissza az indexhez');
  addExact('← Dashboard','← Dashboard','← Dashboard','← Tableau de bord','← Dashboard','← Dashboard','← Vezérlőpult');
  addExact('⬅ Dashboard','⬅ Dashboard','⬅ Dashboard','⬅ Tableau de bord','⬅ Dashboard','⬅ Dashboard','⬅ Vezérlőpult');
  addExact('Logout','Deconectare','Logout','Déconnexion','Disconnetti','Abmelden','Kijelentkezés');
  addExact('Login','Autentificare','Login','Connexion','Accesso','Anmeldung','Bejelentkezés');
  addExact('Autentificare','Autentificare','Authentication','Authentification','Autenticazione','Authentifizierung','Hitelesítés');
  addExact('Autentificare / rol','Autentificare / rol','Authentication / role','Authentification / rôle','Autenticazione / ruolo','Authentifizierung / Rolle','Hitelesítés / szerepkör');
  addExact('Verificare...','Verificare...','Checking...','Vérification...','Verifica...','Prüfung...','Ellenőrzés...');
  addExact('Se verifică sesiunea...','Se verifică sesiunea...','Checking session...','Vérification de la session...','Verifica sessione...','Sitzung wird geprüft...','Munkamenet ellenőrzése...');
  addExact('Se citește sesiunea curentă.','Se citește sesiunea curentă.','Reading current session.','Lecture de la session actuelle.','Lettura della sessione corrente.','Aktuelle Sitzung wird gelesen.','Jelenlegi munkamenet olvasása.');
  addExact('Se citește sesiunea Supabase.','Se citește sesiunea Supabase.','Reading Supabase session.','Lecture de la session Supabase.','Lettura della sessione Supabase.','Supabase-Sitzung wird gelesen.','Supabase munkamenet olvasása.');
  addExact('Acces restricționat','Acces restricționat','Restricted access','Accès restreint','Accesso limitato','Eingeschränkter Zugriff','Korlátozott hozzáférés');
  addExact('Nu ai acces la această pagină.','Nu ai acces la această pagină.','You do not have access to this page.','Vous n’avez pas accès à cette page.','Non hai accesso a questa pagina.','Sie haben keinen Zugriff auf diese Seite.','Nincs hozzáférésed ehhez az oldalhoz.');
  addExact('Nu ai acces de vizualizare pe această pagină.','Nu ai acces de vizualizare pe această pagină.','You do not have view access to this page.','Vous n’avez pas le droit de consulter cette page.','Non hai accesso in visualizzazione a questa pagina.','Sie haben keine Anzeigeberechtigung für diese Seite.','Nincs megtekintési jogod ehhez az oldalhoz.');
  addExact('Nu ai acces de editare, ai drept doar de vizualizare!','Nu ai acces de editare, ai drept doar de vizualizare!','You do not have edit access, view-only rights!','Vous n’avez pas le droit de modifier, lecture seule !','Non hai accesso in modifica, solo visualizzazione!','Sie haben keine Bearbeitungsrechte, nur Ansicht!','Nincs szerkesztési jogod, csak megtekintés!');
  addExact('Doar vizualizare','Doar vizualizare','View only','Lecture seule','Sola visualizzazione','Nur Ansicht','Csak megtekintés');
  addExact('Selectează o categorie.','Selectează o categorie.','Select a category.','Sélectionnez une catégorie.','Seleziona una categoria.','Kategorie auswählen.','Válassz egy kategóriát.');
  addExact('Limba','Limba','Language','Langue','Lingua','Sprache','Nyelv');

  addExact('Salvează','Salvează','Save','Enregistrer','Salva','Speichern','Mentés');
  addExact('Salvează în cloud','Salvează în cloud','Save to cloud','Enregistrer dans le cloud','Salva nel cloud','In Cloud speichern','Mentés a felhőbe');
  addExact('Salvează acum','Salvează acum','Save now','Enregistrer maintenant','Salva ora','Jetzt speichern','Mentés most');
  addExact('Salvează rând','Salvează rând','Save row','Enregistrer la ligne','Salva riga','Zeile speichern','Sor mentése');
  addExact('Ultima salvare','Ultima salvare','Last save','Dernier enregistrement','Ultimo salvataggio','Letzte Speicherung','Utolsó mentés');
  addExact('Nu există salvări în sesiunea curentă.','Nu există salvări în sesiunea curentă.','No saves in the current session.','Aucun enregistrement dans la session actuelle.','Nessun salvataggio nella sessione corrente.','Keine Speicherungen in der aktuellen Sitzung.','Nincs mentés az aktuális munkamenetben.');
  addExact('Anulează','Anulează','Cancel','Annuler','Annulla','Abbrechen','Mégse');
  addExact('Renunță','Renunță','Cancel','Annuler','Annulla','Abbrechen','Mégse');
  addExact('Închide','Închide','Close','Fermer','Chiudi','Schließen','Bezárás');
  addExact('Adaugă','Adaugă','Add','Ajouter','Aggiungi','Hinzufügen','Hozzáadás');
  addExact('Adaugă rând','Adaugă rând','Add row','Ajouter une ligne','Aggiungi riga','Zeile hinzufügen','Sor hozzáadása');
  addExact('Adaugă rând ambalare','Adaugă rând ambalare','Add packing row','Ajouter une ligne d’emballage','Aggiungi riga imballaggio','Verpackungszeile hinzufügen','Csomagolási sor hozzáadása');
  addExact('Adaugă camion complet','Adaugă camion complet','Add full truck','Ajouter un camion complet','Aggiungi camion completo','Vollen LKW hinzufügen','Teljes kamion hozzáadása');
  addExact('Adaugă operator','Adaugă operator','Add operator','Ajouter un opérateur','Aggiungi operatore','Bediener hinzufügen','Operátor hozzáadása');
  addExact('Adaugă acțiune','Adaugă acțiune','Add action','Ajouter une action','Aggiungi azione','Aktion hinzufügen','Művelet hozzáadása');
  addExact('Adaugă reper','Adaugă reper','Add part','Ajouter une référence','Aggiungi codice pezzo','Teil hinzufügen','Cikkszám hozzáadása');
  addExact('Adaugă săptămână','Adaugă săptămână','Add week','Ajouter une semaine','Aggiungi settimana','Woche hinzufügen','Hét hozzáadása');
  addExact('Șterge','Șterge','Delete','Supprimer','Elimina','Löschen','Törlés');
  addExact('Șterge rând','Șterge rând','Delete row','Supprimer la ligne','Elimina riga','Zeile löschen','Sor törlése');
  addExact('Șterge rândul selectat','Șterge rândul selectat','Delete selected row','Supprimer la ligne sélectionnée','Elimina la riga selezionata','Ausgewählte Zeile löschen','Kijelölt sor törlése');
  addExact('Șterge selectatul','Șterge selectatul','Delete selected','Supprimer la sélection','Elimina selezionato','Auswahl löschen','Kijelölt törlése');
  addExact('Șterge operator selectat','Șterge operator selectat','Delete selected operator','Supprimer l’opérateur sélectionné','Elimina operatore selezionato','Ausgewählten Bediener löschen','Kijelölt operátor törlése');
  addExact('Curăță','Curăță','Clear','Effacer','Pulisci','Leeren','Törlés');
  addExact('Reset','Reset','Reset','Réinitialiser','Ripristina','Zurücksetzen','Visszaállítás');
  addExact('Reset filtre','Reset filtre','Reset filters','Réinitialiser les filtres','Ripristina filtri','Filter zurücksetzen','Szűrők visszaállítása');
  addExact('Reset filters','Reset filtre','Reset filters','Réinitialiser les filtres','Ripristina filtri','Filter zurücksetzen','Szűrők visszaállítása');
  addExact('Refresh','Reîmprospătează','Refresh','Actualiser','Aggiorna','Aktualisieren','Frissítés');
  addExact('Reîncarcă','Reîncarcă','Reload','Recharger','Ricarica','Neu laden','Újratöltés');
  addExact('Refresh cloud','Refresh cloud','Refresh cloud','Actualiser le cloud','Aggiorna cloud','Cloud aktualisieren','Felhő frissítése');
  addExact('Sync cloud','Sync cloud','Cloud sync','Synchronisation cloud','Sincronizzazione cloud','Cloud-Sync','Felhő szinkron');
  addExact('Sync','Sync','Sync','Synchronisation','Sincronizza','Sync','Szinkron');
  addExact('Import','Import','Import','Importer','Importa','Importieren','Importálás');
  addExact('Export','Export','Export','Exporter','Esporta','Exportieren','Exportálás');
  addExact('Import Excel','Import Excel','Import Excel','Importer Excel','Importa Excel','Excel importieren','Excel importálás');
  addExact('Export Excel','Export Excel','Export Excel','Exporter Excel','Esporta Excel','Excel exportieren','Excel exportálás');
  addExact('Generează PDF','Generează PDF','Generate PDF','Générer PDF','Genera PDF','PDF generieren','PDF generálása');
  addExact('Generează etichete','Generează etichete','Generate labels','Générer des étiquettes','Genera etichette','Etiketten generieren','Címkék generálása');
  addExact('Generează camion','Generează camion','Generate truck','Générer camion','Genera camion','LKW generieren','Kamion generálása');
  addExact('Generează etichete livrare','Generează etichete livrare','Generate delivery labels','Générer les étiquettes de livraison','Genera etichette di consegna','Lieferetiketten generieren','Szállítási címkék generálása');
  addExact('Print','Print','Print','Imprimer','Stampa','Drucken','Nyomtatás');
  addExact('Caută','Caută','Search','Rechercher','Cerca','Suchen','Keresés');
  addExact('Căutare','Căutare','Search','Recherche','Ricerca','Suche','Keresés');
  addExact('Filtru','Filtru','Filter','Filtre','Filtro','Filter','Szűrő');
  addExact('Filtre','Filtre','Filters','Filtres','Filtri','Filter','Szűrők');
  addExact('Filtrează','Filtrează','Filter','Filtrer','Filtra','Filtern','Szűrés');
  addExact('Filtrare live','Filtrare live','Live filter','Filtre en direct','Filtro live','Live-Filter','Élő szűrés');

  addExact('An','An','Year','Année','Anno','Jahr','Év');
  addExact('Anul','Anul','Year','Année','Anno','Jahr','Év');
  addExact('ANUL','ANUL','YEAR','ANNÉE','ANNO','JAHR','ÉV');
  addExact('AN','AN','YEAR','ANNÉE','ANNO','JAHR','ÉV');
  addExact('Luna','Luna','Month','Mois','Mese','Monat','Hónap');
  addExact('Lună','Lună','Month','Mois','Mese','Monat','Hónap');
  addExact('LUNA','LUNA','MONTH','MOIS','MESE','MONAT','HÓNAP');
  addExact('LUNĂ','LUNĂ','MONTH','MOIS','MESE','MONAT','HÓNAP');
  addExact('Data','Data','Date','Date','Data','Datum','Dátum');
  addExact('DATA','DATA','DATE','DATE','DATA','DATUM','DÁTUM');
  addExact('Dată livrare','Dată livrare','Delivery date','Date de livraison','Data consegna','Lieferdatum','Szállítás dátuma');
  addExact('Data livrării','Data livrării','Delivery date','Date de livraison','Data di consegna','Lieferdatum','Szállítás dátuma');
  addExact('DATA LIVRĂRII','DATA LIVRĂRII','DELIVERY DATE','DATE DE LIVRAISON','DATA DI CONSEGNA','LIEFERDATUM','SZÁLLÍTÁS DÁTUMA');
  addExact('Nr. transport','Nr. transport','Transport no.','N° transport','N. trasporto','Transport-Nr.','Szállítás száma');
  addExact('Nr. Transport','Nr. Transport','Transport no.','N° transport','N. trasporto','Transport-Nr.','Szállítás száma');
  addExact('Nr Transp','Nr Transp','Transport no.','N° transport','N. trasporto','Transport-Nr.','Szállítás száma');
  addExact('NR. TRANSPORT','NR. TRANSPORT','TRANSPORT NO.','N° TRANSPORT','N. TRASPORTO','TRANSPORT-NR.','SZÁLLÍTÁS SZÁMA');
  addExact('Transporturi','Transporturi','Transports','Transports','Trasporti','Transporte','Szállítások');
  addExact('Transports','Transporturi','Transports','Transports','Trasporti','Transporte','Szállítások');
  addExact('Reper','Reper','Part','Référence','Codice pezzo','Teil','Cikkszám');
  addExact('REPER','REPER','PART','RÉFÉRENCE','CODICE PEZZO','TEIL','CIKKSZÁM');
  addExact('Repere','Repere','Parts','Références','Codici pezzo','Teile','Cikkszámok');
  addExact('Operator','Operator','Operator','Opérateur','Operatore','Bediener','Operátor');
  addExact('OPERATOR','OPERATOR','OPERATOR','OPÉRATEUR','OPERATORE','BEDIENER','OPERÁTOR');
  addExact('Utilaj','Utilaj','Machine','Machine','Macchina','Maschine','Gép');
  addExact('UTILAJ','UTILAJ','MACHINE','MACHINE','MACCHINA','MASCHINE','GÉP');
  addExact('Linie / utilaj','Linie / utilaj','Line / machine','Ligne / machine','Linea / macchina','Linie / Maschine','Sor / gép');
  addExact('Echipament','Echipament','Equipment','Équipement','Attrezzatura','Ausrüstung','Berendezés');
  addExact('Schimbul','Schimbul','Shift','Équipe','Turno','Schicht','Műszak');
  addExact('SCHIMBUL','SCHIMBUL','SHIFT','ÉQUIPE','TURNO','SCHICHT','MŰSZAK');
  addExact('Schimburi','Schimburi','Shifts','Équipes','Turni','Schichten','Műszakok');
  addExact('Sch.','Sch.','Shift','Équipe','Turno','Schicht','Műszak');
  addExact('Compartiment','Compartiment','Department','Département','Reparto','Abteilung','Részleg');
  addExact('Departament','Departament','Department','Département','Reparto','Abteilung','Részleg');
  addExact('Responsabil','Responsabil','Responsible','Responsable','Responsabile','Verantwortlich','Felelős');
  addExact('Prioritate','Prioritate','Priority','Priorité','Priorità','Priorität','Prioritás');
  addExact('Status','Status','Status','Statut','Stato','Status','Állapot');
  addExact('Stadiu','Stadiu','Stage','Stade','Fase','Stufe','Állapot');
  addExact('Observații','Observații','Notes','Observations','Note','Bemerkungen','Megjegyzések');
  addExact('OBSERVAȚII','OBSERVAȚII','NOTES','OBSERVATIONS','NOTE','BEMERKUNGEN','MEGJEGYZÉSEK');
  addExact('Observatii','Observații','Notes','Observations','Note','Bemerkungen','Megjegyzések');
  addExact('OBSERVATII','OBSERVAȚII','NOTES','OBSERVATIONS','NOTE','BEMERKUNGEN','MEGJEGYZÉSEK');
  addExact('Nume','Nume','Name','Nom','Nome','Name','Név');
  addExact('OK','OK','OK','OK','OK','OK','OK');

  addExact('Cantitate','Cantitate','Quantity','Quantité','Quantità','Menge','Mennyiség');
  addExact('CANTITATE','CANTITATE','QUANTITY','QUANTITÉ','QUANTITÀ','MENGE','MENNYISÉG');
  addExact('Cantitate (kg)','Cantitate (kg)','Quantity (kg)','Quantité (kg)','Quantità (kg)','Menge (kg)','Mennyiség (kg)');
  addExact('Buc','Buc','Pcs','Pcs','Pz','Stk','Db');
  addExact('Bucăți','Bucăți','Pieces','Pièces','Pezzi','Stück','Darab');
  addExact('Buc realizate','Buc realizate','Produced pcs','Pièces réalisées','Pezzi prodotti','Produzierte Stk.','Gyártott db');
  addExact('BUC. TOTAL','BUC. TOTAL','TOTAL PCS','PCS TOTAL','PZ TOTALI','STK. GESAMT','ÖSSZES DB');
  addExact('TOTAL BUC. REALIZATE AFIȘATE','TOTAL BUC. REALIZATE AFIȘATE','TOTAL DISPLAYED PRODUCED PCS','TOTAL PIÈCES RÉALISÉES AFFICHÉES','TOTALE PEZZI PRODOTTI VISUALIZZATI','GESAMT ANGEZEIGTE PRODUZIERTE STK.','ÖSSZES MEGJELENÍTETT GYÁRTOTT DB');
  addExact('Total buc','Total buc','Total pcs','Total pcs','Totale pz','Gesamt Stk.','Összes db');
  addExact('Total kg','Total kg','Total kg','Total kg','Totale kg','Gesamt kg','Összes kg');
  addExact('TOTAL','TOTAL','TOTAL','TOTAL','TOTALE','GESAMT','ÖSSZESEN');
  addExact('Total','Total','Total','Total','Totale','Gesamt','Összesen');
  addExact('Media','Media','Average','Moyenne','Media','Durchschnitt','Átlag');
  addExact('MEDIA REALIZATE','MEDIA REALIZATE','AVERAGE PRODUCED','MOYENNE RÉALISÉE','MEDIA PRODOTTA','DURCHSCHNITT PRODUZIERT','ÁTLAG GYÁRTOTT');
  addExact('Minute','Minute','Minutes','Minutes','Minuti','Minuten','Percek');
  addExact('Ore lucrate','Ore lucrate','Hours worked','Heures travaillées','Ore lavorate','Geleistete Stunden','Ledolgozott órák');
  addExact('ORE LUCRATE','ORE LUCRATE','HOURS WORKED','HEURES TRAVAILLÉES','ORE LAVORATE','GELEISTETE STUNDEN','LEDOLGOZOTT ÓRÁK');
  addExact('Timp Minute Pierdute','Timp Minute Pierdute','Lost time minutes','Minutes perdues','Minuti persi','Verlorene Minuten','Elveszett percek');
  addExact('Opriri neplanificate (min)','Opriri neplanificate (min)','Unplanned stops (min)','Arrêts non planifiés (min)','Fermi non pianificati (min)','Ungeplante Stillstände (min)','Nem tervezett leállások (perc)');
  addExact('Pauză de masă (min)','Pauză de masă (min)','Lunch break (min)','Pause déjeuner (min)','Pausa pranzo (min)','Mittagspause (min)','Ebédszünet (perc)');
  addExact('Reglaj (min)','Reglaj (min)','Adjustment (min)','Réglage (min)','Regolazione (min)','Einstellung (min)','Beállítás (perc)');
  addExact('Schimbare reper (min)','Schimbare reper (min)','Part changeover (min)','Changement de référence (min)','Cambio pezzo (min)','Teilewechsel (min)','Cikkszámváltás (perc)');
  addExact('Încălzire SDV (min)','Încălzire SDV (min)','Tool heating (min)','Chauffage outillage (min)','Riscaldamento utensili (min)','Werkzeugerwärmung (min)','Szerszámmelegítés (perc)');
  addExact('Tact (sec.)','Tact (sec.)','Cycle time (sec.)','Temps de cycle (sec.)','Tempo ciclo (sec.)','Taktzeit (Sek.)','Ciklusidő (mp)');
  addExact('Planificat','Planificat','Planned','Planifié','Pianificato','Geplant','Tervezett');
  addExact('Planificat (DA/NU)','Planificat (DA/NU)','Planned (YES/NO)','Planifié (OUI/NON)','Pianificato (SÌ/NO)','Geplant (JA/NEIN)','Tervezett (IGEN/NEM)');
  addExact('Rebut','Rebut','Scrap','Rebut','Scarto','Ausschuss','Selejt');
  addExact('REBUT TOTAL','REBUT TOTAL','TOTAL SCRAP','REBUT TOTAL','SCARTO TOTALE','AUSSCHUSS GESAMT','ÖSSZES SELEJT');
  addExact('% REBUT','% REBUT','% SCRAP','% REBUT','% SCARTO','% AUSSCHUSS','% SELEJT');
  addExact('% REALIZAT','% REALIZAT','% ACHIEVED','% RÉALISÉ','% REALIZZATO','% ERREICHT','% TELJESÍTVE');
  addExact('Disponibilitate','Disponibilitate','Availability','Disponibilité','Disponibilità','Verfügbarkeit','Rendelkezésre állás');
  addExact('Performanță','Performanță','Performance','Performance','Prestazione','Leistung','Teljesítmény');
  addExact('Calitate','Calitate','Quality','Qualité','Qualità','Qualität','Minőség');
  addExact('CALITATE','CALITATE','QUALITY','QUALITÉ','QUALITÀ','QUALITÄT','MINŐSÉG');
  addExact('Calitate oțel','Calitate oțel','Steel grade','Qualité acier','Qualità acciaio','Stahlqualität','Acélminőség');
  addExact('Calitate Otel','Calitate Oțel','Steel grade','Qualité acier','Qualità acciaio','Stahlqualität','Acélminőség');
  addExact('CALITATE (Grade)','CALITATE (Grade)','GRADE','QUALITÉ','QUALITÀ','GÜTE','MINŐSÉG');
  addExact('Diametru','Diametru','Diameter','Diamètre','Diametro','Durchmesser','Átmérő');
  addExact('Diametru oțel','Diametru oțel','Steel diameter','Diamètre acier','Diametro acciaio','Stahldurchmesser','Acél átmérő');
  addExact('Dimensiune','Dimensiune','Size','Dimension','Dimensione','Größe','Méret');
  addExact('Dimensiune oțel','Dimensiune oțel','Steel size','Dimension acier','Dimensione acciaio','Stahlgröße','Acélméret');
  addExact('Dimensiune OTEL','Dimensiune OȚEL','STEEL size','Dimension ACIER','Dimensione ACCIAIO','STAHL-Größe','ACÉL méret');
  addExact('DIMENSIUNE MATERIAL','DIMENSIUNE MATERIAL','MATERIAL SIZE','DIMENSION MATIÈRE','DIMENSIONE MATERIALE','MATERIALABMESSUNG','ANYAGMÉRET');
  addExact('Material','Material','Material','Matière','Materiale','Material','Anyag');
  addExact('Furnizor','Furnizor','Supplier','Fournisseur','Fornitore','Lieferant','Beszállító');
  addExact('Cod intern','Cod intern','Internal code','Code interne','Codice interno','Interner Code','Belső kód');
  addExact('Cod intern oțel','Cod intern oțel','Internal steel code','Code interne acier','Codice interno acciaio','Interner Stahlcode','Belső acélkód');
  addExact('Cod / nume art. / document','Cod / nume art. / document','Code / item name / document','Code / nom art. / document','Codice / nome art. / documento','Code / Artikelname / Dokument','Kód / cikk neve / dokumentum');
  addExact('Cod Matriță','Cod Matriță','Die code','Code matrice','Codice matrice','Matrizencode','Szerszámkód');
  addExact('Marcaj matriță','Marcaj matriță','Die mark','Marquage matrice','Marcatura matrice','Matrizenmarkierung','Szerszámjelölés');
  addExact('Matriță SUPERIOARĂ','Matriță SUPERIOARĂ','UPPER die','Matrice SUPÉRIEURE','Matrice SUPERIORE','OBERE Matrize','FELSŐ szerszám');
  addExact('Matriță INFERIOARĂ','Matriță INFERIOARĂ','LOWER die','Matrice INFÉRIEURE','Matrice INFERIORE','UNTERE Matrize','ALSÓ szerszám');
  addExact('Înălțime MF SUP (mm)','Înălțime MF SUP (mm)','Upper die height (mm)','Hauteur MF SUP (mm)','Altezza matrice SUP (mm)','Höhe obere Matrize (mm)','Felső szerszám magasság (mm)');
  addExact('Înălțime MF INF (mm)','Înălțime MF INF (mm)','Lower die height (mm)','Hauteur MF INF (mm)','Altezza matrice INF (mm)','Höhe untere Matrize (mm)','Alsó szerszám magasság (mm)');
  addExact('Stoc Matrițe','Stoc Matrițe','Die stock','Stock matrices','Stock matrici','Matrizenbestand','Szerszámkészlet');
  addExact('Matrițe: 0','Matrițe: 0','Dies: 0','Matrices : 0','Matrici: 0','Matrizen: 0','Szerszámok: 0');

  addExact('Cloud','Cloud','Cloud','Cloud','Cloud','Cloud','Felhő');
  addExact('Cloud: local','Cloud: local','Cloud: local','Cloud : local','Cloud: locale','Cloud: lokal','Felhő: helyi');
  addExact('Cloud: pregătit','Cloud: pregătit','Cloud: ready','Cloud : prêt','Cloud: pronto','Cloud: bereit','Felhő: kész');
  addExact('Cloud: conectat','Cloud: conectat','Cloud: connected','Cloud : connecté','Cloud: connesso','Cloud: verbunden','Felhő: csatlakoztatva');
  addExact('Cloud: în așteptare','Cloud: în așteptare','Cloud: pending','Cloud : en attente','Cloud: in attesa','Cloud: ausstehend','Felhő: függőben');
  addExact('Cloud: verificare...','Cloud: verificare...','Cloud: checking...','Cloud : vérification...','Cloud: verifica...','Cloud: Prüfung...','Felhő: ellenőrzés...');
  addExact('Cont: verificare...','Cont: verificare...','Account: checking...','Compte : vérification...','Account: verifica...','Konto: Prüfung...','Fiók: ellenőrzés...');
  addExact('Cont: Viewer','Cont: Viewer','Account: Viewer','Compte : Viewer','Account: Viewer','Konto: Viewer','Fiók: Viewer');
  addExact('Cont: viewer','Cont: viewer','Account: viewer','Compte : viewer','Account: viewer','Konto: viewer','Fiók: viewer');
  addExact('Cont: —','Cont: —','Account: —','Compte : —','Account: —','Konto: —','Fiók: —');
  addExact('Cont: -','Cont: -','Account: -','Compte : -','Account: -','Konto: -','Fiók: -');
  addExact('Rol activ','Rol activ','Active role','Rôle actif','Ruolo attivo','Aktive Rolle','Aktív szerepkör');
  addExact('Rol cont','Rol cont','Account role','Rôle du compte','Ruolo account','Kontorolle','Fiók szerepkör');
  addExact('Rol curent','Rol curent','Current role','Rôle actuel','Ruolo corrente','Aktuelle Rolle','Jelenlegi szerepkör');
  addExact('Status cont','Status cont','Account status','Statut du compte','Stato account','Kontostatus','Fiók állapota');
  addExact('Status curent','Status curent','Current status','Statut actuel','Stato corrente','Aktueller Status','Jelenlegi állapot');
  addExact('Activ','Activ','Active','Actif','Attivo','Aktiv','Aktív');
  addExact('Blocat','Blocat','Blocked','Bloqué','Bloccato','Gesperrt','Blokkolt');
  addExact('Banat','Banat','Banned','Banni','Bannato','Gebannt','Kitiltva');
  addExact('Online acum','Online acum','Online now','En ligne maintenant','Online ora','Jetzt online','Most online');
  addExact('Pagina curentă','Pagina curentă','Current page','Page actuelle','Pagina corrente','Aktuelle Seite','Jelenlegi oldal');
  addExact('Ultimul semnal','Ultimul semnal','Last signal','Dernier signal','Ultimo segnale','Letztes Signal','Utolsó jel');

  addExact('FORJĂ','FORJĂ','FORGING','FORGE','FORGIATURA','SCHMIEDE','KOVÁCSOLÁS');
  addExact('FORJA','FORJA','FORGING','FORGE','FORGIATURA','SCHMIEDE','KOVÁCSOLÁS');
  addExact('Forja','Forja','Forging','Forge','Forgiatura','Schmiede','Kovácsolás');
  addExact('PRELUCRĂRI MECANICE','PRELUCRĂRI MECANICE','MACHINING','USINAGE MÉCANIQUE','LAVORAZIONI MECCANICHE','MECHANISCHE BEARBEITUNG','MECHANIKAI MEGMUNKÁLÁS');
  addExact('Prelucrări mecanice','Prelucrări mecanice','Machining','Usinage mécanique','Lavorazioni meccaniche','Mechanische Bearbeitung','Mechanikai megmunkálás');
  addExact('Prelucrări','Prelucrări','Machining','Usinage','Lavorazioni','Bearbeitung','Megmunkálás');
  addExact('TRATAMENT TERMIC','TRATAMENT TERMIC','HEAT TREATMENT','TRAITEMENT THERMIQUE','TRATTAMENTO TERMICO','WÄRMEBEHANDLUNG','HŐKEZELÉS');
  addExact('Heat Treatment','TRATAMENT TERMIC','HEAT TREATMENT','TRAITEMENT THERMIQUE','TRATTAMENTO TERMICO','WÄRMEBEHANDLUNG','HŐKEZELÉS');
  addExact('CALITATE','CALITATE','QUALITY','QUALITÉ','QUALITÀ','QUALITÄT','MINŐSÉG');
  addExact('PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII','PROBLEMS, IMPROVEMENTS AND INVESTMENTS','PROBLÈMES, AMÉLIORATIONS ET INVESTISSEMENTS','PROBLEMI, MIGLIORAMENTI E INVESTIMENTI','PROBLEME, VERBESSERUNGEN UND INVESTITIONEN','PROBLÉMÁK, FEJLESZTÉSEK ÉS BERUHÁZÁSOK');
  addExact('PLANIFICĂRI','PLANIFICĂRI','PLANNING','PLANIFICATIONS','PIANIFICAZIONI','PLANUNGEN','TERVEZÉSEK');
  addExact('PLANIFICARE FORJĂ','PLANIFICARE FORJĂ','FORGING PLANNING','PLANIFICATION FORGE','PIANIFICAZIONE FORGIATURA','SCHMIEDEPLANUNG','KOVÁCSOLÁSI TERVEZÉS');
  addExact('PLANIFICARE PRELUCRĂRI','PLANIFICARE PRELUCRĂRI','MACHINING PLANNING','PLANIFICATION USINAGE','PIANIFICAZIONE LAVORAZIONI','BEARBEITUNGSPLANUNG','MEGMUNKÁLÁSI TERVEZÉS');
  addExact('PLAN LIVRĂRI','PLAN LIVRĂRI','DELIVERY PLAN','PLAN DE LIVRAISON','PIANO CONSEGNE','LIEFERPLAN','SZÁLLÍTÁSI TERV');
  addExact('RESURSE UMANE','RESURSE UMANE','HUMAN RESOURCES','RESSOURCES HUMAINES','RISORSE UMANE','PERSONALWESEN','EMBERI ERŐFORRÁS');
  addExact('SDV','SDV','TOOLS','OUTILLAGE','UTENSILI','WERKZEUGE','SZERSZÁMOK');
  addExact('HELPER-DATA','HELPER-DATA','HELPER DATA','DONNÉES AIDE','DATI HELPER','HILFSDATEN','SEGÉDADATOK');
  addExact('HELPER-ACL','HELPER-ACL','HELPER ACL','ACL AIDE','ACL HELPER','HILFS-ACL','SEGÉD ACL');
  addExact('RAPOARTE','RAPOARTE','REPORTS','RAPPORTS','REPORT','BERICHTE','JELENTÉSEK');
  addExact('Raport','Raport','Report','Rapport','Rapporto','Bericht','Jelentés');
  addExact('Rapoarte T.T','Rapoarte T.T','H.T. reports','Rapports T.T','Report T.T','W.B.-Berichte','H.K. jelentések');
  addExact('Probleme T.T','Probleme T.T','H.T. problems','Problèmes T.T','Problemi T.T','W.B.-Probleme','H.K. problémák');
  addExact('FIȘE TEHNOLOGICE','FIȘE TEHNOLOGICE','TECHNOLOGICAL SHEETS','FICHES TECHNOLOGIQUES','SCHEDE TECNOLOGICHE','TECHNOLOGISCHE BLÄTTER','TECHNOLÓGIAI LAPOK');
  addExact('RAPOARTE EXCEL / WORD','RAPOARTE EXCEL / WORD','EXCEL / WORD REPORTS','RAPPORTS EXCEL / WORD','REPORT EXCEL / WORD','EXCEL-/WORD-BERICHTE','EXCEL / WORD JELENTÉSEK');
  addExact('INTRĂRI OȚEL','INTRĂRI OȚEL','STEEL ENTRIES','ENTRÉES ACIER','ENTRATE ACCIAIO','STAHLEINGÄNGE','ACÉL BEVÉTELEK');
  addExact('DEBITATE','DEBITATE','CUT PARTS','DÉBITÉS','TAGLIATI','GESCHNITTEN','DARABOLT');
  addExact('FORJATE','FORJATE','FORGED','FORGÉS','FORGIATI','GESCHMIEDET','KOVÁCSOLT');
  addExact('MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX');
  addExact('LIVRĂRI','LIVRĂRI','DELIVERIES','LIVRAISONS','CONSEGNE','LIEFERUNGEN','SZÁLLÍTÁSOK');
  addExact('Livrări zale','Livrări zale','Link deliveries','Livraisons maillons','Consegne maglie','Kettenglieder-Lieferungen','Láncszem szállítások');
  addExact('Comenzi Livrare','Comenzi Livrare','Delivery orders','Commandes de livraison','Ordini di consegna','Lieferaufträge','Szállítási rendelések');
  addExact('Comenzi oțel','Comenzi oțel','Steel orders','Commandes acier','Ordini acciaio','Stahlbestellungen','Acél rendelések');
  addExact('MRC / NECESAR OȚEL','MRC / NECESAR OȚEL','MRC / STEEL REQUIREMENT','MRC / BESOIN ACIER','MRC / FABBISOGNO ACCIAIO','MRC / STAHLBEDARF','MRC / ACÉLIGÉNY');
  addExact('ORE OPERATORI FORJĂ','ORE OPERATORI FORJĂ','FORGING OPERATOR HOURS','HEURES OPÉRATEURS FORGE','ORE OPERATORI FORGIATURA','STUNDEN SCHMIEDEBEDIENER','KOVÁCSOLÁSI OPERÁTOR ÓRÁK');
  addExact('URMĂRIRE MATRIȚE','URMĂRIRE MATRIȚE','DIE TRACKING','SUIVI MATRICES','TRACCIAMENTO MATRICI','MATRIZENVERFOLGUNG','SZERSZÁMKÖVETÉS');
  addExact('PROGRES MATRIȚE','PROGRES MATRIȚE','DIE PROGRESS','PROGRÈS MATRICES','PROGRESSO MATRICI','MATRIZENFORTSCHRITT','SZERSZÁM HALADÁS');
  addExact('UTILAJE MATRIȚE','UTILAJE MATRIȚE','DIE MACHINES','MACHINES MATRICES','MACCHINE MATRICI','MATRIZENMASCHINEN','SZERSZÁMGÉPEK');
  addExact('REPERE MATRIȚE','REPERE MATRIȚE','DIE PARTS','RÉFÉRENCES MATRICES','CODICI MATRICI','MATRIZENTEILE','SZERSZÁM CIKKEK');
  addExact('INVENTAR OȚEL','INVENTAR OȚEL','STEEL INVENTORY','INVENTAIRE ACIER','INVENTARIO ACCIAIO','STAHLINVENTAR','ACÉLKÉSZLET');
  addExact('INVENTAR FORJAT','INVENTAR FORJAT','FORGED INVENTORY','INVENTAIRE FORGÉ','INVENTARIO FORGIATO','SCHMIEDEINVENTAR','KOVÁCSOLT KÉSZLET');
  addExact('INVENTAR PRELUCRĂRI','INVENTAR PRELUCRĂRI','MACHINING INVENTORY','INVENTAIRE USINAGE','INVENTARIO LAVORAZIONI','BEARBEITUNGSINVENTAR','MEGMUNKÁLÁSI KÉSZLET');
  addExact('AMBALARE','AMBALARE','PACKING','EMBALLAGE','IMBALLAGGIO','VERPACKUNG','CSOMAGOLÁS');
  addExact('Ambalare','Ambalare','Packing','Emballage','Imballaggio','Verpackung','Csomagolás');

  addExact('Stock calculat','Stoc calculat','Calculated stock','Stock calculé','Stock calcolato','Berechneter Bestand','Számított készlet');
  addExact('Stoc calculat','Stoc calculat','Calculated stock','Stock calculé','Stock calcolato','Berechneter Bestand','Számított készlet');
  addExact('Stoc inițial','Stoc inițial','Initial stock','Stock initial','Stock iniziale','Anfangsbestand','Kezdő készlet');
  addExact('Intrări','Intrări','Entries','Entrées','Entrate','Eingänge','Bevételek');
  addExact('Debitat','Debitat','Cut','Débité','Tagliato','Geschnitten','Darabolt');
  addExact('Lipsă','Lipsă','Shortage','Manquant','Mancanza','Fehlmenge','Hiány');
  addExact('Stoc Otel (Kg)','Stoc Oțel (Kg)','Steel stock (kg)','Stock acier (kg)','Stock acciaio (kg)','Stahlbestand (kg)','Acél készlet (kg)');
  addExact('STOC OTEL (KG)','STOC OȚEL (KG)','STEEL STOCK (KG)','STOCK ACIER (KG)','STOCK ACCIAIO (KG)','STAHLBESTAND (KG)','ACÉLKÉSZLET (KG)');
  addExact('STOC FORJA (BUC)','STOC FORJĂ (BUC)','FORGING STOCK (PCS)','STOCK FORGE (PCS)','STOCK FORGIATURA (PZ)','SCHMIEDEBESTAND (STK)','KOVÁCSOLÁSI KÉSZLET (DB)');
  addExact('STOC DEBITAT (BUC)','STOC DEBITAT (BUC)','CUT STOCK (PCS)','STOCK DÉBITÉ (PCS)','STOCK TAGLIATO (PZ)','GESCHNITTENER BESTAND (STK)','DARABOLT KÉSZLET (DB)');
  addExact('STOC AMBALAT (PACKED PCS)','STOC AMBALAT (BUC AMBALATE)','PACKED STOCK (PACKED PCS)','STOCK EMBALLÉ (PCS EMBALLÉES)','STOCK IMBALLATO (PZ IMBALLATI)','VERPACKTER BESTAND (VERPACKTE STK)','CSOMAGOLT KÉSZLET (CSOMAGOLT DB)');
  addExact('STOC FINITE PRELUCRARI (FINISHED PCS)','STOC FINIT PRELUCRĂRI (BUC FINITE)','FINISHED MACHINING STOCK (FINISHED PCS)','STOCK FINI USINAGE (PCS FINIES)','STOCK FINITO LAVORAZIONI (PZ FINITI)','FERTIGBESTAND BEARBEITUNG (FERTIGE STK)','KÉSZ MEGMUNKÁLÁSI KÉSZLET (KÉSZ DB)');
  addExact('STOC WIP (WORK IN PROCESS PCS)','STOC WIP (BUC ÎN LUCRU)','WIP STOCK (WORK IN PROCESS PCS)','STOCK WIP (PCS EN COURS)','STOCK WIP (PZ IN LAVORAZIONE)','WIP-BESTAND (STK IN ARBEIT)','WIP KÉSZLET (FOLYAMATBAN LÉVŐ DB)');
  addExact('Stoc FINAL Piese Forjate (buc)','Stoc FINAL Piese Forjate (buc)','FINAL forged parts stock (pcs)','Stock FINAL pièces forgées (pcs)','Stock FINALE pezzi forgiati (pz)','ENDbestand Schmiedeteile (Stk)','VÉGSŐ kovácsolt alkatrész készlet (db)');
  addExact('STOC DEBITATE FINAL (buc)','STOC DEBITATE FINAL (buc)','FINAL cut stock (pcs)','Stock débité FINAL (pcs)','Stock tagliato FINALE (pz)','ENDbestand geschnitten (Stk)','VÉGSŐ darabolt készlet (db)');
  addExact('Propunere din stoc','Propunere din stoc','Stock proposal','Proposition depuis stock','Proposta da stock','Vorschlag aus Bestand','Javaslat készletből');

  addExact('Total transport','Total transport','Transport total','Total transport','Totale trasporto','Transport gesamt','Szállítás összesen');
  addExact('Rezumat transport selectat','Rezumat transport selectat','Selected transport summary','Résumé du transport sélectionné','Riepilogo trasporto selezionato','Zusammenfassung ausgewählter Transport','Kiválasztott szállítás összesítő');
  addExact('Nu ai selectat niciun rând.','Nu ai selectat niciun rând.','No row selected.','Aucune ligne sélectionnée.','Nessuna riga selezionata.','Keine Zeile ausgewählt.','Nincs kijelölt sor.');
  addExact('Lada','Lada','Box','Caisse','Cassa','Kiste','Láda');
  addExact('Lăzi','Lăzi','Boxes','Caisses','Casse','Kisten','Ládák');
  addExact('Lăzi unice','Lăzi unice','Unique boxes','Caisses uniques','Casse uniche','Eindeutige Kisten','Egyedi ládák');
  addExact('Ambalate','Ambalate','Packed','Emballés','Imballati','Verpackt','Csomagolt');
  addExact('AMBALAT','AMBALAT','PACKED','EMBALLÉ','IMBALLATO','VERPACKT','CSOMAGOLT');
  addExact('Total ambalat','Total ambalat','Total packed','Total emballé','Totale imballato','Gesamt verpackt','Összes csomagolt');
  addExact('FORJAT','FORJAT','FORGED','FORGÉ','FORGIATO','GESCHMIEDET','KOVÁCSOLT');
  addExact('Tratate','Tratate','Treated','Traités','Trattati','Behandelt','Kezelt');
  addExact('Fără T.T','Fără T.T','Without H.T.','Sans T.T','Senza T.T','Ohne W.B.','H.K. nélkül');
  addExact('Diferență','Diferență','Difference','Différence','Differenza','Differenz','Különbség');
  addExact('Rezumat și logică','Rezumat și logică','Summary and logic','Résumé et logique','Riepilogo e logica','Zusammenfassung und Logik','Összegzés és logika');
  addExact('Logică folosită','Logică folosită','Logic used','Logique utilisée','Logica utilizzata','Verwendete Logik','Használt logika');
  addExact('Structură preluată din foaia Excel: transporturi, forjat, tratate, ambalat, fără T.T și diferență.','Structură preluată din foaia Excel: transporturi, forjat, tratate, ambalat, fără T.T și diferență.','Structure taken from the Excel sheet: transports, forged, treated, packed, without H.T. and difference.','Structure reprise de la feuille Excel : transports, forgé, traités, emballé, sans T.T et différence.','Struttura presa dal foglio Excel: trasporti, forgiato, trattati, imballato, senza T.T e differenza.','Struktur aus dem Excel-Blatt übernommen: Transporte, geschmiedet, behandelt, verpackt, ohne W.B. und Differenz.','Az Excel-lapból átvett struktúra: szállítások, kovácsolt, kezelt, csomagolt, H.K. nélkül és különbség.');
  addExact('Seed importat din Excel. Salvare economică în cloud și backup local.','Seed importat din Excel. Salvare economică în cloud și backup local.','Seed imported from Excel. Economical cloud save and local backup.','Seed importé d’Excel. Sauvegarde cloud économique et sauvegarde locale.','Seed importato da Excel. Salvataggio cloud economico e backup locale.','Aus Excel importierter Seed. Sparsame Cloud-Speicherung und lokales Backup.','Excelből importált alapadat. Takarékos felhőmentés és helyi biztonsági mentés.');

  addExact('Toate','Toate','All','Tous','Tutti','Alle','Összes');
  addExact('Toți','Toți','All','Tous','Tutti','Alle','Összes');
  addExact('TOATE','TOATE','ALL','TOUS','TUTTI','ALLE','ÖSSZES');
  addExact('Toate lunile','Toate lunile','All months','Tous les mois','Tutti i mesi','Alle Monate','Minden hónap');
  addExact('(toate lunile)','(toate lunile)','(all months)','(tous les mois)','(tutti i mesi)','(alle Monate)','(minden hónap)');
  addExact('(toți anii)','(toți anii)','(all years)','(toutes les années)','(tutti gli anni)','(alle Jahre)','(minden év)');
  addExact('Alege','Alege','Choose','Choisir','Scegli','Wählen','Válassz');
  addExact('Alege luna și anul pentru a vedea câte piese a verificat fiecare operator în fiecare zi.','Alege luna și anul pentru a vedea câte piese a verificat fiecare operator în fiecare zi.','Choose the month and year to see how many parts each operator checked each day.','Choisissez le mois et l’année pour voir combien de pièces chaque opérateur a contrôlées chaque jour.','Scegli mese e anno per vedere quanti pezzi ha controllato ogni operatore ogni giorno.','Wählen Sie Monat und Jahr, um zu sehen, wie viele Teile jeder Bediener pro Tag geprüft hat.','Válaszd ki a hónapot és évet, hogy lásd, hány darabot ellenőrzött minden operátor naponta.');
  addExact('Nu există date pentru filtrul selectat.','Nu există date pentru filtrul selectat.','No data for the selected filter.','Aucune donnée pour le filtre sélectionné.','Nessun dato per il filtro selezionato.','Keine Daten für den ausgewählten Filter.','Nincs adat a kiválasztott szűrőhöz.');
  addExact('Nu există date pentru grafic.','Nu există date pentru grafic.','No data for the chart.','Aucune donnée pour le graphique.','Nessun dato per il grafico.','Keine Daten für das Diagramm.','Nincs adat a diagramhoz.');
  addExact('Nu există date pentru selecția curentă.','Nu există date pentru selecția curentă.','No data for the current selection.','Aucune donnée pour la sélection actuelle.','Nessun dato per la selezione corrente.','Keine Daten für die aktuelle Auswahl.','Nincs adat az aktuális kiválasztáshoz.');
  addExact('Nu există totaluri pe utilaje pentru filtrul selectat.','Nu există totaluri pe utilaje pentru filtrul selectat.','No machine totals for the selected filter.','Aucun total par machine pour le filtre sélectionné.','Nessun totale per macchina per il filtro selezionato.','Keine Maschinensummen für den ausgewählten Filter.','Nincs gépösszesítő a kiválasztott szűrőhöz.');
  addExact('Pregătire...','Pregătire...','Preparing...','Préparation...','Preparazione...','Vorbereitung...','Előkészítés...');
  addExact('Pregătire','Pregătire','Preparation','Préparation','Preparazione','Vorbereitung','Előkészítés');
  addExact('Pregătit.','Pregătit.','Ready.','Prêt.','Pronto.','Bereit.','Kész.');
  addExact('Se încarcă...','Se încarcă...','Loading...','Chargement...','Caricamento...','Wird geladen...','Betöltés...');
  addExact('Se încarcă datele...','Se încarcă datele...','Loading data...','Chargement des données...','Caricamento dati...','Daten werden geladen...','Adatok betöltése...');
  addExact('Se încarcă datele din cloud…','Se încarcă datele din cloud…','Loading data from cloud…','Chargement des données depuis le cloud…','Caricamento dati dal cloud…','Daten werden aus der Cloud geladen…','Adatok betöltése a felhőből…');
  addExact('Sursă','Sursă','Source','Source','Fonte','Quelle','Forrás');
  addExact('Sursă: local','Sursă: local','Source: local','Source : locale','Fonte: locale','Quelle: lokal','Forrás: helyi');
  addExact('Sursă: seed local','Sursă: seed local','Source: local seed','Source : seed local','Fonte: seed locale','Quelle: lokaler Seed','Forrás: helyi alapadat');
  addExact('Sursă: document cloud / model gol','Sursă: document cloud / model gol','Source: cloud document / empty model','Source : document cloud / modèle vide','Fonte: documento cloud / modello vuoto','Quelle: Cloud-Dokument / leeres Modell','Forrás: felhődokumentum / üres modell');
  addExact('Rânduri','Rânduri','Rows','Lignes','Righe','Zeilen','Sorok');
  addExact('rânduri','rânduri','rows','lignes','righe','Zeilen','sor');
  addExact('0 rânduri','0 rânduri','0 rows','0 lignes','0 righe','0 Zeilen','0 sor');
  addExact('Rânduri afișate','Rânduri afișate','Displayed rows','Lignes affichées','Righe visualizzate','Angezeigte Zeilen','Megjelenített sorok');
  addExact('Total rânduri','Total rânduri','Total rows','Total lignes','Totale righe','Zeilen gesamt','Összes sor');
  addExact('Rând nou','Rând nou','New row','Nouvelle ligne','Nuova riga','Neue Zeile','Új sor');
  addExact('+ Rând nou','+ Rând nou','+ New row','+ Nouvelle ligne','+ Nuova riga','+ Neue Zeile','+ Új sor');

  addExact('Admin','Admin','Admin','Admin','Admin','Admin','Admin');
  addExact('Editor','Editor','Editor','Éditeur','Editor','Editor','Szerkesztő');
  addExact('Viewer','Viewer','Viewer','Lecteur','Visualizzatore','Betrachter','Megtekintő');
  addExact('Conturi create','Conturi create','Created accounts','Comptes créés','Account creati','Erstellte Konten','Létrehozott fiókok');
  addExact('Conturi găsite','Conturi găsite','Accounts found','Comptes trouvés','Account trovati','Gefundene Konten','Talált fiókok');
  addExact('Cont selectat','Cont selectat','Selected account','Compte sélectionné','Account selezionato','Ausgewähltes Konto','Kiválasztott fiók');
  addExact('Alege un cont din stânga.','Alege un cont din stânga.','Choose an account on the left.','Choisissez un compte à gauche.','Scegli un account a sinistra.','Wählen Sie links ein Konto.','Válassz egy fiókot balról.');
  addExact('Niciun cont selectat','Niciun cont selectat','No account selected','Aucun compte sélectionné','Nessun account selezionato','Kein Konto ausgewählt','Nincs kiválasztott fiók');
  addExact('Permisiuni cont selectat','Permisiuni cont selectat','Selected account permissions','Permissions du compte sélectionné','Permessi account selezionato','Berechtigungen des ausgewählten Kontos','Kiválasztott fiók jogosultságai');
  addExact('Vizualizare și editare pe foi','Vizualizare și editare pe foi','View and edit on pages','Affichage et édition sur les pages','Visualizzazione e modifica sulle pagine','Anzeigen und Bearbeiten auf Seiten','Megtekintés és szerkesztés az oldalakon');
  addExact('Vizualizare + editare peste tot','Vizualizare + editare peste tot','View + edit everywhere','Affichage + édition partout','Visualizzazione + modifica ovunque','Anzeigen + Bearbeiten überall','Megtekintés + szerkesztés mindenhol');
  addExact('Doar vizualizare peste tot','Doar vizualizare peste tot','View only everywhere','Lecture seule partout','Sola visualizzazione ovunque','Nur Ansicht überall','Csak megtekintés mindenhol');
  addExact('Butoane index','Butoane index','Index buttons','Boutons index','Pulsanti index','Index-Schaltflächen','Index gombok');
  addExact('Arată tot','Arată tot','Show all','Tout afficher','Mostra tutto','Alles anzeigen','Összes mutatása');
  addExact('Ascunde tot','Ascunde tot','Hide all','Tout masquer','Nascondi tutto','Alles ausblenden','Összes elrejtése');
  addExact('Reset MFA','Reset MFA','Reset MFA','Réinitialiser MFA','Reset MFA','MFA zurücksetzen','MFA visszaállítása');
  addExact('Șterge cont fantomă','Șterge cont fantomă','Delete ghost account','Supprimer le compte fantôme','Elimina account fantasma','Geisterkonto löschen','Szellem fiók törlése');

  addExact('Centralizator pe reper','Centralizator pe reper','Summary by part','Centralisateur par référence','Riepilogo per codice pezzo','Zusammenfassung nach Teil','Összesítő cikkszám szerint');
  addExact('Centralizator lunar','Centralizator lunar','Monthly summary','Résumé mensuel','Riepilogo mensile','Monatliche Zusammenfassung','Havi összesítő');
  addExact('Centralizator pe utilaj','Centralizator pe utilaj','Summary by machine','Centralisateur par machine','Riepilogo per macchina','Zusammenfassung nach Maschine','Összesítő gép szerint');
  addExact('Centralizator pe utilaj și reper','Centralizator pe utilaj și reper','Summary by machine and part','Centralisateur par machine et référence','Riepilogo per macchina e codice pezzo','Zusammenfassung nach Maschine und Teil','Összesítő gép és cikkszám szerint');
  addExact('Centralizator operatori Magnaflux','Centralizator operatori Magnaflux','Magnaflux operator summary','Centralisateur opérateurs Magnaflux','Riepilogo operatori Magnaflux','Magnaflux-Bedienerzusammenfassung','Magnaflux operátor összesítő');
  addExact('Calendar operatori Magnaflux','Calendar operatori Magnaflux','Magnaflux operator calendar','Calendrier opérateurs Magnaflux','Calendario operatori Magnaflux','Magnaflux-Bedienerkalender','Magnaflux operátor naptár');
  addExact('Total piese pe operator','Total piese pe operator','Total parts per operator','Total pièces par opérateur','Totale pezzi per operatore','Teile gesamt pro Bediener','Összes darab operátoronként');
  addExact('Zile active pe operator','Zile active pe operator','Active days per operator','Jours actifs par opérateur','Giorni attivi per operatore','Aktive Tage pro Bediener','Aktív napok operátoronként');
  addExact('Total piese controlate pe zile','Total piese controlate pe zile','Total checked parts by day','Total pièces contrôlées par jour','Totale pezzi controllati per giorno','Gesamt geprüfte Teile pro Tag','Összes ellenőrzött darab naponta');
  addExact('Total piese: 0','Total piese: 0','Total parts: 0','Total pièces : 0','Totale pezzi: 0','Teile gesamt: 0','Összes darab: 0');
  addExact('Operatori activi: 0','Operatori activi: 0','Active operators: 0','Opérateurs actifs : 0','Operatori attivi: 0','Aktive Bediener: 0','Aktív operátorok: 0');

  // Dynamic exact phrase patterns with values handled by regex later.
  var TERMS = {};
  function addTerm(src, ro,en,fr,it,de,hu){
    var vals = {ro:ro,en:en,fr:fr,it:it,de:de,hu:hu};
    ['ro','en'].forEach(function(l){ var v = vals[l]; if(v) addSource(v, vals); });
    addSource(src, vals);
  }
  function addSource(src, vals){
    if(!src) return;
    Object.keys(vals).forEach(function(lang){ if(!TERMS[lang]) TERMS[lang] = []; });
    SUPPORTED.forEach(function(lang){ TERMS[lang].push({source:String(src), target:vals[lang], ro:vals.ro || String(src)}); });
  }

  var termRows = [
    ['Back to Dashboard','Înapoi la Dashboard','Back to Dashboard','Retour au tableau de bord','Torna alla dashboard','Zurück zum Dashboard','Vissza a vezérlőpulthoz'],
    ['Add row','Adaugă rând','Add row','Ajouter une ligne','Aggiungi riga','Zeile hinzufügen','Sor hozzáadása'],
    ['Refresh','Reîmprospătează','Refresh','Actualiser','Aggiorna','Aktualisieren','Frissítés'],
    ['Delete selected','Șterge selectatul','Delete selected','Supprimer la sélection','Elimina selezionato','Auswahl löschen','Kijelölt törlése'],
    ['Cloud connected','Cloud conectat','Cloud connected','Cloud connecté','Cloud connesso','Cloud verbunden','Felhő csatlakoztatva'],
    ['Cloud: connected','Cloud: conectat','Cloud: connected','Cloud : connecté','Cloud: connesso','Cloud: verbunden','Felhő: csatlakoztatva'],
    ['Year','An','Year','Année','Anno','Jahr','Év'],
    ['Month','Lună','Month','Mois','Mese','Monat','Hónap'],
    ['Delivery date','Dată livrare','Delivery date','Date de livraison','Data consegna','Lieferdatum','Szállítás dátuma'],
    ['Transport no.','Nr. transport','Transport no.','N° transport','N. trasporto','Transport-Nr.','Szállítás száma'],
    ['Part','Reper','Part','Référence','Codice pezzo','Teil','Cikkszám'],
    ['Machine','Utilaj','Machine','Machine','Macchina','Maschine','Gép'],
    ['Supplier','Furnizor','Supplier','Fournisseur','Fornitore','Lieferant','Beszállító'],
    ['Operator','Operator','Operator','Opérateur','Operatore','Bediener','Operátor'],
    ['Status','Status','Status','Statut','Stato','Status','Állapot'],
    ['Notes','Observații','Notes','Observations','Note','Bemerkungen','Megjegyzések'],
    ['Quality','Calitate','Quality','Qualité','Qualità','Qualität','Minőség'],
    ['Diameter','Diametru','Diameter','Diamètre','Diametro','Durchmesser','Átmérő'],
    ['Quantity','Cantitate','Quantity','Quantité','Quantità','Menge','Mennyiség'],
    ['Stock','Stoc','Stock','Stock','Stock','Bestand','Készlet'],
    ['Calculated stock','Stoc calculat','Calculated stock','Stock calculé','Stock calcolato','Berechneter Bestand','Számított készlet'],
    ['Packed','Ambalat','Packed','Emballé','Imballato','Verpackt','Csomagolt'],
    ['Forged','Forjat','Forged','Forgé','Forgiato','Geschmiedet','Kovácsolt'],
    ['Treated','Tratate','Treated','Traités','Trattati','Behandelt','Kezelt'],
    ['Without H.T.','Fără T.T','Without H.T.','Sans T.T','Senza T.T','Ohne W.B.','H.K. nélkül'],
    ['Difference','Diferență','Difference','Différence','Differenza','Differenz','Különbség'],
    ['Summary and logic','Rezumat și logică','Summary and logic','Résumé et logique','Riepilogo e logica','Zusammenfassung und Logik','Összegzés és logika'],
    ['All months','Toate lunile','All months','Tous les mois','Tutti i mesi','Alle Monate','Minden hónap'],
    ['All','Toate','All','Tous','Tutti','Alle','Összes'],
    ['Open','Deschise','Open','Ouvertes','Aperte','Offen','Nyitott'],
    ['Closed','Finalizate','Closed','Terminées','Completate','Abgeschlossen','Lezárt'],
    ['Late','Întârziate','Late','En retard','In ritardo','Verspätet','Késésben'],
    ['Active','Activ','Active','Actif','Attivo','Aktiv','Aktív'],
    ['Blocked','Blocat','Blocked','Bloqué','Bloccato','Gesperrt','Blokkolt'],
    ['Banned','Banat','Banned','Banni','Bannato','Gebannt','Kitiltva'],
    ['View','Vizualizare','View','Affichage','Visualizzazione','Ansicht','Megtekintés'],
    ['Edit','Editare','Edit','Édition','Modifica','Bearbeiten','Szerkesztés'],
    ['Page','Pagină','Page','Page','Pagina','Seite','Oldal'],
    ['Pages','Pagini','Pages','Pages','Pagine','Seiten','Oldalak'],
    ['Report','Raport','Report','Rapport','Rapporto','Bericht','Jelentés'],
    ['Reports','Rapoarte','Reports','Rapports','Report','Berichte','Jelentések'],
    ['Problem','Problemă','Problem','Problème','Problema','Problem','Probléma'],
    ['Problems','Probleme','Problems','Problèmes','Problemi','Probleme','Problémák'],
    ['Improvement','Îmbunătățire','Improvement','Amélioration','Miglioramento','Verbesserung','Fejlesztés'],
    ['Improvements','Îmbunătățiri','Improvements','Améliorations','Miglioramenti','Verbesserungen','Fejlesztések'],
    ['Investments','Investiții','Investments','Investissements','Investimenti','Investitionen','Beruházások'],
    ['Planning','Planificare','Planning','Planification','Pianificazione','Planung','Tervezés'],
    ['Deliveries','Livrări','Deliveries','Livraisons','Consegne','Lieferungen','Szállítások'],
    ['Delivery','Livrare','Delivery','Livraison','Consegna','Lieferung','Szállítás'],
    ['Steel','Oțel','Steel','Acier','Acciaio','Stahl','Acél'],
    ['Forge','Forjă','Forge','Forge','Forgiatura','Schmiede','Kovácsolás'],
    ['Forging','Forjă','Forging','Forge','Forgiatura','Schmiede','Kovácsolás'],
    ['Machining','Prelucrări','Machining','Usinage','Lavorazioni','Bearbeitung','Megmunkálás'],
    ['Heat treatment','Tratament termic','Heat treatment','Traitement thermique','Trattamento termico','Wärmebehandlung','Hőkezelés'],
    ['Human resources','Resurse umane','Human resources','Ressources humaines','Risorse umane','Personalwesen','Emberi erőforrás'],
    ['Die','Matriță','Die','Matrice','Matrice','Matrize','Szerszám'],
    ['Dies','Matrițe','Dies','Matrices','Matrici','Matrizen','Szerszámok'],
    ['Action','Acțiune','Action','Action','Azione','Aktion','Művelet'],
    ['Actions','Acțiuni','Actions','Actions','Azioni','Aktionen','Műveletek'],
    ['Current','Curent','Current','Actuel','Corrente','Aktuell','Jelenlegi'],
    ['Last','Ultim','Last','Dernier','Ultimo','Letzter','Utolsó'],
    ['Total','Total','Total','Total','Totale','Gesamt','Összesen'],
    ['Average','Medie','Average','Moyenne','Media','Durchschnitt','Átlag'],
    ['Filter','Filtru','Filter','Filtre','Filtro','Filter','Szűrő'],
    ['Search','Căutare','Search','Recherche','Ricerca','Suche','Keresés'],
    ['Choose','Alege','Choose','Choisir','Scegli','Wählen','Válassz'],
    ['Select','Selectează','Select','Sélectionner','Seleziona','Auswählen','Kiválasztás'],
    ['Selected','Selectat','Selected','Sélectionné','Selezionato','Ausgewählt','Kiválasztott'],
    ['Displayed','Afișate','Displayed','Affichées','Visualizzate','Angezeigt','Megjelenített'],
    ['Rows','Rânduri','Rows','Lignes','Righe','Zeilen','Sorok'],
    ['Row','Rând','Row','Ligne','Riga','Zeile','Sor'],
    ['Local','Local','Local','Local','Locale','Lokal','Helyi'],
    ['Ready','Pregătit','Ready','Prêt','Pronto','Bereit','Kész'],
    ['Loading','Se încarcă','Loading','Chargement','Caricamento','Wird geladen','Betöltés'],
    ['Checking','Verificare','Checking','Vérification','Verifica','Prüfung','Ellenőrzés'],
    ['Error','Eroare','Error','Erreur','Errore','Fehler','Hiba'],
    ['Warning','Avertizare','Warning','Avertissement','Avviso','Warnung','Figyelmeztetés']
  ];
  termRows.forEach(function(r){ addTerm.apply(null,r); });

  function buildTerms(){
    SUPPORTED.forEach(function(lang){
      TERMS[lang] = (TERMS[lang] || [])
        .filter(function(it, idx, arr){
          var k = key(it.source) + '|' + lang;
          for(var j=0;j<idx;j++) if(key(arr[j].source)+'|'+lang === k) return false;
          return true;
        })
        .sort(function(a,b){ return b.source.length - a.source.length; })
        .map(function(it){
          try{
            it.isSingle = /^[\p{L}]+$/u.test(it.source);
            var pattern = it.isSingle ? '(^|[^\\p{L}])(' + escapeRe(it.source) + ')(?=$|[^\\p{L}])' : '(' + escapeRe(it.source) + ')';
            it.re = new RegExp(pattern, 'giu');
          }catch(_){
            it.isSingle = false;
            it.re = null;
          }
          return it;
        });
    });
    TEXT_CACHE = Object.create(null);
    TEXT_CACHE_COUNT = 0;
  }

  // Additional high-frequency fixed texts from ERP pages.
  addExact('Deconectare','Deconectare','Logout','Déconnexion','Disconnessione','Abmelden','Kijelentkezés');
  addExact('FORJA','FORJĂ','FORGING','FORGE','FORGIATURA','SCHMIEDE','KOVÁCSOLÁS');
  addExact('PRELUCRARI MECANICE','PRELUCRĂRI MECANICE','MACHINING','USINAGE MÉCANIQUE','LAVORAZIONI MECCANICHE','MECHANISCHE BEARBEITUNG','MECHANIKAI MEGMUNKÁLÁS');
  addExact('TRATAMENT TERMIC','TRATAMENT TERMIC','HEAT TREATMENT','TRAITEMENT THERMIQUE','TRATTAMENTO TERMICO','WÄRMEBEHANDLUNG','HŐKEZELÉS');
  addExact('PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII','PROBLEMS, IMPROVEMENTS AND INVESTMENTS','PROBLÈMES, AMÉLIORATIONS ET INVESTISSEMENTS','PROBLEMI, MIGLIORAMENTI E INVESTIMENTI','PROBLEME, VERBESSERUNGEN UND INVESTITIONEN','PROBLÉMÁK, FEJLESZTÉSEK ÉS BERUHÁZÁSOK');
  addExact('RESURSE UMANE','RESURSE UMANE','HUMAN RESOURCES','RESSOURCES HUMAINES','RISORSE UMANE','PERSONALWESEN','EMBERI ERŐFORRÁS');
  addExact('HELPER-DATA','HELPER-DATA','HELPER DATA','DONNÉES D’AIDE','DATI DI SUPPORTO','HILFSDATEN','SEGÉDADATOK');
  addExact('HELPER-ACL','HELPER-ACL','HELPER ACL','ACL D’AIDE','ACL DI SUPPORTO','HILFS-ACL','SEGÉD ACL');
  addExact('Selectează o categorie','Selectează o categorie','Select a category','Sélectionnez une catégorie','Seleziona una categoria','Kategorie auswählen','Válassz egy kategóriát');
  addExact('Selectează o categorie din Forjă.','Selectează o categorie din Forjă.','Select a category from Forging.','Sélectionnez une catégorie dans Forge.','Seleziona una categoria da Forgiatura.','Wählen Sie eine Kategorie aus Schmiede.','Válassz kategóriát a Kovácsolásból.');
  addExact('Selectează o categorie din Resurse Umane.','Selectează o categorie din Resurse Umane.','Select a category from Human Resources.','Sélectionnez une catégorie dans Ressources humaines.','Seleziona una categoria da Risorse umane.','Wählen Sie eine Kategorie aus Personalwesen.','Válassz kategóriát az Emberi erőforrásból.');
  addExact('Toate lunile','Toate lunile','All months','Tous les mois','Tutti i mesi','Alle Monate','Összes hónap');
  addExact('toate lunile','toate lunile','all months','tous les mois','tutti i mesi','alle Monate','összes hónap');
  addExact('toți anii','toți anii','all years','toutes les années','tutti gli anni','alle Jahre','összes év');
  addExact('toate','toate','all','tous','tutti','alle','összes');
  addExact('toți','toți','all','tous','tutti','alle','összes');
  addExact('Șterge selectatul','Șterge selectatul','Delete selected','Supprimer la sélection','Elimina selezionato','Ausgewähltes löschen','Kijelölt törlése');
  addExact('Cloud: conectat','Cloud: conectat','Cloud: connected','Cloud : connecté','Cloud: connesso','Cloud: verbunden','Felhő: csatlakoztatva');
  addExact('Cloud: pregătit','Cloud: pregătit','Cloud: ready','Cloud : prêt','Cloud: pronto','Cloud: bereit','Felhő: kész');
  addExact('Cloud: local','Cloud: local','Cloud: local','Cloud : local','Cloud: locale','Cloud: lokal','Felhő: helyi');
  addExact('Cont: Viewer','Cont: Viewer','Account: Viewer','Compte : lecteur','Account: Viewer','Konto: Viewer','Fiók: megtekintő');
  addExact('Cont: viewer','Cont: viewer','Account: viewer','Compte : lecteur','Account: viewer','Konto: Betrachter','Fiók: megtekintő');
  addExact('Cont: verificare...','Cont: verificare...','Account: checking...','Compte : vérification...','Account: verifica...','Konto: Prüfung...','Fiók: ellenőrzés...');
  addExact('Cloud: verificare...','Cloud: verificare...','Cloud: checking...','Cloud : vérification...','Cloud: verifica...','Cloud: Prüfung...','Felhő: ellenőrzés...');
  addExact('Alege','Alege','Choose','Choisir','Scegli','Auswählen','Válassz');
  addExact('Alege furnizorul, anul și luna.','Alege furnizorul, anul și luna.','Choose the supplier, year and month.','Choisissez le fournisseur, l’année et le mois.','Scegli il fornitore, l’anno e il mese.','Wählen Sie Lieferant, Jahr und Monat.','Válaszd ki a beszállítót, az évet és a hónapot.');

  buildTerms();

  // Strict extra translation coverage added for all pages.
  (function(){
    var extraExact = [["Data constatării acțiunii", "Data constatării acțiunii", "Action finding date", "Date de constatation de l’action", "Data constatazione azione", "Feststellungsdatum der Maßnahme", "Intézkedés megállapításának dátuma"], ["Data finalizării 100%", "Data finalizării 100%", "100% completion date", "Date de finalisation 100 %", "Data completamento 100%", "Datum der 100%-Fertigstellung", "100%-os befejezés dátuma"], ["Bază inițială importată din Excel. Tabelul păstrează culorile, dimensiunile și înghețarea zonelor din foaia sursă.", "Bază inițială importată din Excel. Tabelul păstrează culorile, dimensiunile și înghețarea zonelor din foaia sursă.", "Initial base imported from Excel. The table keeps the colors, dimensions and frozen areas from the source sheet.", "Base initiale importée depuis Excel. Le tableau conserve les couleurs, dimensions et zones figées de la feuille source.", "Base iniziale importata da Excel. La tabella mantiene colori, dimensioni e aree bloccate dal foglio origine.", "Aus Excel importierte Anfangsbasis. Die Tabelle behält Farben, Abmessungen und fixierte Bereiche des Quellblatts.", "Excelből importált kezdeti alap. A táblázat megtartja a forráslap színeit, méreteit és rögzített területeit."], ["Caută rapid...", "Caută rapid...", "Quick search...", "Recherche rapide...", "Ricerca rapida...", "Schnellsuche...", "Gyors keresés..."], ["Completează numele ca să poți continua.", "Completează numele ca să poți continua.", "Fill in the name to continue.", "Renseignez le nom pour continuer.", "Compila il nome per continuare.", "Geben Sie den Namen ein, um fortzufahren.", "Add meg a nevet a folytatáshoz."], ["De la luna", "De la luna", "From month", "Du mois", "Dal mese", "Ab Monat", "Hónaptól"], ["Până la luna", "Până la luna", "To month", "Au mois", "Al mese", "Bis Monat", "Hónapig"], ["Sarjă", "Sarjă", "Batch", "Coulée", "Colata", "Charge", "Adag"], ["SARJĂ", "SARJĂ", "BATCH", "COULÉE", "COLATA", "CHARGE", "ADAG"], ["Se verifică sesiunea.", "Se verifică sesiunea.", "Checking session.", "Vérification de la session.", "Verifica sessione.", "Sitzung wird geprüft.", "Munkamenet ellenőrzése."], ["Actualizează schimburile", "Actualizează schimburile", "Update shifts", "Mettre à jour les équipes", "Aggiorna turni", "Schichten aktualisieren", "Műszakok frissítése"], ["Adaugă primul operator pentru a începe pontajul.", "Adaugă primul operator pentru a începe pontajul.", "Add the first operator to start the timesheet.", "Ajoutez le premier opérateur pour démarrer le pointage.", "Aggiungi il primo operatore per iniziare il cartellino.", "Fügen Sie den ersten Bediener hinzu, um die Zeiterfassung zu starten.", "Add hozzá az első operátort a jelenléti ív indításához."], ["Golește luna", "Golește luna", "Clear month", "Vider le mois", "Svuota mese", "Monat leeren", "Hónap ürítése"], ["Sărbătoare legală", "Sărbătoare legală", "Legal holiday", "Jour férié légal", "Festività legale", "Gesetzlicher Feiertag", "Hivatalos ünnepnap"], ["Alege luna și anul pentru a vedea câte piese a verificat fiecare operator în fiecare zi.", "Alege luna și anul pentru a vedea câte piese a verificat fiecare operator în fiecare zi.", "Choose the month and year to see how many parts each operator checked each day.", "Choisissez le mois et l’année pour voir combien de pièces chaque opérateur a contrôlées chaque jour.", "Scegli mese e anno per vedere quanti pezzi ha controllato ogni operatore ogni giorno.", "Wählen Sie Monat und Jahr, um zu sehen, wie viele Teile jeder Bediener pro Tag geprüft hat.", "Válaszd ki a hónapot és az évet, hogy lásd, hány darabot ellenőrzött minden operátor naponta."], ["CENTRALIZATOR OPERATORI PE LUNA SELECTATĂ", "CENTRALIZATOR OPERATORI PE LUNA SELECTATĂ", "OPERATOR SUMMARY FOR SELECTED MONTH", "CENTRALISATEUR OPÉRATEURS POUR LE MOIS SÉLECTIONNÉ", "RIEPILOGO OPERATORI PER IL MESE SELEZIONATO", "BEDIENERZUSAMMENFASSUNG FÜR DEN GEWÄHLTEN MONAT", "OPERÁTOR ÖSSZESÍTŐ A KIVÁLASZTOTT HÓNAPRA"], ["Cum se distribuie volumul pe fiecare zi din luna selectată.", "Cum se distribuie volumul pe fiecare zi din luna selectată.", "How the volume is distributed across each day of the selected month.", "Répartition du volume sur chaque jour du mois sélectionné.", "Come si distribuisce il volume su ogni giorno del mese selezionato.", "Wie sich das Volumen auf jeden Tag des ausgewählten Monats verteilt.", "Hogyan oszlik meg a mennyiség a kiválasztott hónap napjai között."], ["MAGNAFLUX · SUMA PIESELOR CONTROLATE PE ZILE ȘI OPERATORI", "MAGNAFLUX · SUMA PIESELOR CONTROLATE PE ZILE ȘI OPERATORI", "MAGNAFLUX · SUM OF CHECKED PARTS BY DAYS AND OPERATORS", "MAGNAFLUX · SOMME DES PIÈCES CONTRÔLÉES PAR JOUR ET OPÉRATEUR", "MAGNAFLUX · SOMMA PEZZI CONTROLLATI PER GIORNI E OPERATORI", "MAGNAFLUX · SUMME GEPRÜFTER TEILE NACH TAGEN UND BEDIENERN", "MAGNAFLUX · ELLENŐRZÖTT DARABOK ÖSSZEGE NAPOK ÉS OPERÁTOROK SZERINT"], ["MEDIA / ZI ACTIVĂ", "MEDIA / ZI ACTIVĂ", "AVERAGE / ACTIVE DAY", "MOYENNE / JOUR ACTIF", "MEDIA / GIORNO ATTIVO", "DURCHSCHNITT / AKTIVER TAG", "ÁTLAG / AKTÍV NAP"], ["Numărul de zile în care operatorul a avut piese controlate.", "Numărul de zile în care operatorul a avut piese controlate.", "Number of days when the operator had checked parts.", "Nombre de jours où l’opérateur a eu des pièces contrôlées.", "Numero di giorni in cui l’operatore ha avuto pezzi controllati.", "Anzahl der Tage, an denen der Bediener geprüfte Teile hatte.", "Azon napok száma, amikor az operátornak ellenőrzött darabjai voltak."], ["Topul lunar după CONTROLATE.", "Topul lunar după CONTROLATE.", "Monthly ranking by CHECKED.", "Classement mensuel par CONTRÔLÉES.", "Classifica mensile per CONTROLLATI.", "Monatsranking nach GEPRÜFT.", "Havi rangsor az ELLENŐRZÖTT alapján."], ["Toți operatorii din luna curentă, ordonați după totalul CONTROLATE.", "Toți operatorii din luna curentă, ordonați după totalul CONTROLATE.", "All operators from the current month, sorted by total CHECKED.", "Tous les opérateurs du mois courant, triés par total CONTRÔLÉ.", "Tutti gli operatori del mese corrente, ordinati per totale CONTROLLATI.", "Alle Bediener des aktuellen Monats, sortiert nach Gesamt GEPRÜFT.", "Az aktuális hónap összes operátora, az összes ELLENŐRZÖTT szerint rendezve."], ["Înapoi la MRC", "Înapoi la MRC", "Back to MRC", "Retour à MRC", "Torna a MRC", "Zurück zu MRC", "Vissza az MRC-hez"], ["Activează MFA", "Activează MFA", "Enable MFA", "Activer MFA", "Attiva MFA", "MFA aktivieren", "MFA aktiválása"], ["Așteaptă generarea codului QR.", "Așteaptă generarea codului QR.", "Wait for the QR code to be generated.", "Attendez la génération du code QR.", "Attendi la generazione del codice QR.", "Warten Sie, bis der QR-Code erzeugt wird.", "Várd meg a QR-kód létrehozását."], ["Cod de 6 cifre din aplicația Authenticator", "Cod de 6 cifre din aplicația Authenticator", "6-digit code from the Authenticator app", "Code à 6 chiffres de l’application Authenticator", "Codice a 6 cifre dall’app Authenticator", "6-stelliger Code aus der Authenticator-App", "6 jegyű kód az Authenticator alkalmazásból"], ["Scanează codul QR cu Google Authenticator, Microsoft Authenticator, Authy sau 2FAS.", "Scanează codul QR cu Google Authenticator, Microsoft Authenticator, Authy sau 2FAS.", "Scan the QR code with Google Authenticator, Microsoft Authenticator, Authy or 2FAS.", "Scannez le code QR avec Google Authenticator, Microsoft Authenticator, Authy ou 2FAS.", "Scansiona il codice QR con Google Authenticator, Microsoft Authenticator, Authy o 2FAS.", "Scannen Sie den QR-Code mit Google Authenticator, Microsoft Authenticator, Authy oder 2FAS.", "Olvasd be a QR-kódot Google Authenticator, Microsoft Authenticator, Authy vagy 2FAS alkalmazással."], ["Introdu codul de 6 cifre din aplicația Authenticator.", "Introdu codul de 6 cifre din aplicația Authenticator.", "Enter the 6-digit code from the Authenticator app.", "Saisissez le code à 6 chiffres de l’application Authenticator.", "Inserisci il codice a 6 cifre dall’app Authenticator.", "Geben Sie den 6-stelligen Code aus der Authenticator-App ein.", "Írd be a 6 jegyű kódot az Authenticator alkalmazásból."], ["Verifică și intră", "Verifică și intră", "Verify and enter", "Vérifier et entrer", "Verifica ed entra", "Prüfen und eintreten", "Ellenőrzés és belépés"], ["Autentificare cu ID și parolă", "Autentificare cu ID și parolă", "Login with ID and password", "Connexion avec ID et mot de passe", "Accesso con ID e password", "Anmeldung mit ID und Passwort", "Bejelentkezés azonosítóval és jelszóval"], ["Introdu ID și parolă", "Introdu ID și parolă", "Enter ID and password", "Saisissez l’ID et le mot de passe", "Inserisci ID e password", "ID und Passwort eingeben", "Add meg az azonosítót és a jelszót"], ["Parolă", "Parolă", "Password", "Mot de passe", "Password", "Passwort", "Jelszó"], ["Atenție", "Atenție", "Attention", "Attention", "Attenzione", "Achtung", "Figyelem"], ["Atenție:", "Atenție:", "Attention:", "Attention :", "Attenzione:", "Achtung:", "Figyelem:"], ["dacă introduci ID-ul sau parola greșit de 3 ori, accesul la login se blochează 15 minute.", "dacă introduci ID-ul sau parola greșit de 3 ori, accesul la login se blochează 15 minute.", "if you enter the wrong ID or password 3 times, login access is blocked for 15 minutes.", "si vous saisissez 3 fois un ID ou mot de passe incorrect, l’accès est bloqué pendant 15 minutes.", "se inserisci ID o password errati 3 volte, l’accesso viene bloccato per 15 minuti.", "wenn Sie ID oder Passwort 3-mal falsch eingeben, wird der Login für 15 Minuten gesperrt.", "ha háromszor rossz azonosítót vagy jelszót adsz meg, a belépés 15 percre blokkolódik."], ["fiecare cont trebuie să confirme codul de 6 cifre din aplicația Authenticator după login.", "fiecare cont trebuie să confirme codul de 6 cifre din aplicația Authenticator după login.", "each account must confirm the 6-digit code from the Authenticator app after login.", "chaque compte doit confirmer le code à 6 chiffres de l’application Authenticator après connexion.", "ogni account deve confermare il codice a 6 cifre dall’app Authenticator dopo il login.", "jedes Konto muss nach der Anmeldung den 6-stelligen Code aus der Authenticator-App bestätigen.", "minden fióknak bejelentkezés után meg kell erősítenie a 6 jegyű Authenticator-kódot."], ["Culoare interfață", "Culoare interfață", "Interface color", "Couleur interface", "Colore interfaccia", "Oberflächenfarbe", "Felület színe"], ["Arată", "Arată", "Show", "Afficher", "Mostra", "Anzeigen", "Mutat"], ["Ascunde/Arată săptămână", "Ascunde/Arată săptămână", "Hide/Show week", "Masquer/Afficher semaine", "Nascondi/Mostra settimana", "Woche ausblenden/anzeigen", "Hét elrejtése/megjelenítése"], ["Aștept autentificarea...", "Aștept autentificarea...", "Waiting for authentication...", "En attente d’authentification...", "In attesa di autenticazione...", "Warte auf Authentifizierung...", "Hitelesítésre vár..."], ["caută text", "caută text", "search text", "rechercher texte", "cerca testo", "Text suchen", "szöveg keresése"], ["Niciun fișier ales", "Niciun fișier ales", "No file chosen", "Aucun fichier choisi", "Nessun file scelto", "Keine Datei ausgewählt", "Nincs fájl kiválasztva"], ["Observație nouă", "Observație nouă", "New note", "Nouvelle observation", "Nuova nota", "Neue Bemerkung", "Új megjegyzés"], ["opțional", "opțional", "optional", "facultatif", "opzionale", "optional", "opcionális"], ["Pagina salvează în cloud pe ani, pe chei de forma", "Pagina salvează în cloud pe ani, pe chei de forma", "The page saves to cloud by years using keys like", "La page enregistre dans le cloud par années avec des clés de type", "La pagina salva nel cloud per anni usando chiavi tipo", "Die Seite speichert in der Cloud nach Jahren mit Schlüsseln wie", "Az oldal évek szerint ment a felhőbe ilyen kulcsokkal"], ["Textul nou se adaugă dedesubt, fără să șteargă observațiile existente.", "Textul nou se adaugă dedesubt, fără să șteargă observațiile existente.", "The new text is added below without deleting existing notes.", "Le nouveau texte est ajouté en dessous sans supprimer les observations existantes.", "Il nuovo testo viene aggiunto sotto senza eliminare le note esistenti.", "Der neue Text wird darunter hinzugefügt, ohne vorhandene Bemerkungen zu löschen.", "Az új szöveg alulra kerül a meglévő megjegyzések törlése nélkül."], ["La salvare, observația nouă se adaugă pe linie nouă în același câmp, cu dată, oră și nume.", "La salvare, observația nouă se adaugă pe linie nouă în același câmp, cu dată, oră și nume.", "On save, the new note is added on a new line in the same field, with date, time and name.", "À l’enregistrement, la nouvelle observation est ajoutée sur une nouvelle ligne dans le même champ, avec date, heure et nom.", "Al salvataggio, la nuova nota viene aggiunta su una nuova riga nello stesso campo, con data, ora e nome.", "Beim Speichern wird die neue Bemerkung in einer neuen Zeile im selben Feld mit Datum, Uhrzeit und Name hinzugefügt.", "Mentéskor az új megjegyzés új sorba kerül ugyanabban a mezőben dátummal, idővel és névvel."], ["EFICIENȚĂ", "EFICIENȚĂ", "EFFICIENCY", "EFFICACITÉ", "EFFICIENZA", "EFFIZIENZ", "HATÉKONYSÁG"], ["EFICIENȚĂ PER UTILAJE", "EFICIENȚĂ PER UTILAJE", "EFFICIENCY BY MACHINE", "EFFICACITÉ PAR MACHINE", "EFFICIENZA PER MACCHINE", "EFFIZIENZ NACH MASCHINEN", "HATÉKONYSÁG GÉPENKÉNT"], ["Eficiență - K.A.D", "Eficiență - K.A.D", "Efficiency - K.A.D", "Efficacité - K.A.D", "Efficienza - K.A.D", "Effizienz - K.A.D", "Hatékonyság - K.A.D"], ["Logică folosită:", "Logică folosită:", "Logic used:", "Logique utilisée :", "Logica utilizzata:", "Verwendete Logik:", "Használt logika:"], ["media KPI pe zi + schimb", "media KPI pe zi + schimb", "KPI average by day + shift", "moyenne KPI par jour + équipe", "media KPI per giorno + turno", "KPI-Durchschnitt nach Tag + Schicht", "KPI átlag nap + műszak szerint"], ["REBUT FĂRĂ FL/FTT", "REBUT FĂRĂ FL/FTT", "SCRAP WITHOUT FL/FTT", "REBUT SANS FL/FTT", "SCARTO SENZA FL/FTT", "AUSSCHUSS OHNE FL/FTT", "SELEJT FL/FTT NÉLKÜL"], ["BUC. REALIZATE", "BUC. REALIZATE", "PRODUCED PCS", "PCS RÉALISÉES", "PZ PRODOTTI", "PRODUZIERTE STK.", "GYÁRTOTT DB"], ["Exclude Incalzire SDV și Pauza de masă", "Exclude Incalzire SDV și Pauza de masă", "Exclude tool heating and lunch break", "Exclure chauffage SDV et pause déjeuner", "Esclude riscaldamento SDV e pausa pranzo", "SDV-Erwärmung und Mittagspause ausschließen", "SDV-melegítés és ebédszünet kizárása"], ["Minute pierdute pe operațiuni", "Minute pierdute pe operațiuni", "Lost minutes by operations", "Minutes perdues par opérations", "Minuti persi per operazioni", "Verlorene Minuten nach Vorgängen", "Elveszett percek műveletenként"], ["Timpi pierduți pe departamente, lunar", "Timpi pierduți pe departamente, lunar", "Lost time by departments, monthly", "Temps perdu par départements, mensuel", "Tempi persi per reparti, mensile", "Verlorene Zeit nach Abteilungen, monatlich", "Elveszett idők részlegenként, havonta"], ["Timpi pierduți pe linii și departamente", "Timpi pierduți pe linii și departamente", "Lost time by lines and departments", "Temps perdu par lignes et départements", "Tempi persi per linee e reparti", "Verlorene Zeit nach Linien und Abteilungen", "Elveszett idők sorok és részlegek szerint"], ["Top operațiuni", "Top operațiuni", "Top operations", "Top opérations", "Top operazioni", "Top Vorgänge", "Top műveletek"], ["Evoluție lunară", "Evoluție lunară", "Monthly evolution", "Évolution mensuelle", "Evoluzione mensile", "Monatliche Entwicklung", "Havi alakulás"], ["Local instant. Cloud sync economic: salvare cu debounce și refresh la focus / manual / la 45 secunde cât pagina este vizibilă.", "Local instant. Cloud sync economic: salvare cu debounce și refresh la focus / manual / la 45 secunde cât pagina este vizibilă.", "Instant local. Economic cloud sync: debounced save and refresh on focus / manual / every 45 seconds while the page is visible.", "Local instantané. Synchronisation cloud économique : enregistrement avec délai et actualisation au focus / manuelle / toutes les 45 secondes tant que la page est visible.", "Locale immediato. Sync cloud economico: salvataggio con debounce e refresh al focus / manuale / ogni 45 secondi mentre la pagina è visibile.", "Sofort lokal. Sparsame Cloud-Synchronisierung: verzögertes Speichern und Aktualisierung bei Fokus / manuell / alle 45 Sekunden, solange die Seite sichtbar ist.", "Azonnali helyi. Takarékos felhőszinkron: késleltetett mentés és frissítés fókuszkor / kézzel / 45 másodpercenként, amíg az oldal látható."], ["Structură fidelă foii Excel, stocare economică pentru planul free, import/export Excel și sincronizare în cloud fără realtime agresiv.", "Structură fidelă foii Excel, stocare economică pentru planul free, import/export Excel și sincronizare în cloud fără realtime agresiv.", "Structure faithful to the Excel sheet, economical storage for the free plan, Excel import/export and cloud sync without aggressive realtime.", "Structure fidèle à la feuille Excel, stockage économique pour le plan gratuit, import/export Excel et synchronisation cloud sans temps réel agressif.", "Struttura fedele al foglio Excel, archiviazione economica per il piano free, import/export Excel e sincronizzazione cloud senza realtime aggressivo.", "Excel-getreue Struktur, sparsame Speicherung für den Free-Plan, Excel-Import/Export und Cloud-Sync ohne aggressives Realtime.", "Az Excel laphoz hű szerkezet, takarékos tárolás az ingyenes csomaghoz, Excel import/export és felhőszinkron agresszív realtime nélkül."], ["URMĂRIRE ZALE", "URMĂRIRE ZALE", "CHAIN LINK TRACKING", "SUIVI MAILLONS", "TRACCIAMENTO MAGLIE", "KETTENGLIEDVERFOLGUNG", "LÁNCSZEM KÖVETÉS"], ["Urmărire zale", "Urmărire zale", "Chain link tracking", "Suivi maillons", "Tracciamento maglie", "Kettengliedverfolgung", "Láncszem követés"], ["COMENZI SĂPTĂMÂNALE", "COMENZI SĂPTĂMÂNALE", "WEEKLY ORDERS", "COMMANDES HEBDOMADAIRES", "ORDINI SETTIMANALI", "WÖCHENTLICHE BESTELLUNGEN", "HETI RENDELÉSEK"], ["MRC / COMENZI SĂPTĂMÂNALE", "MRC / COMENZI SĂPTĂMÂNALE", "MRC / WEEKLY ORDERS", "MRC / COMMANDES HEBDOMADAIRES", "MRC / ORDINI SETTIMANALI", "MRC / WÖCHENTLICHE BESTELLUNGEN", "MRC / HETI RENDELÉSEK"], ["MRC / Comenzi săptămânale - K.A.D", "MRC / Comenzi săptămânale - K.A.D", "MRC / Weekly orders - K.A.D", "MRC / Commandes hebdomadaires - K.A.D", "MRC / Ordini settimanali - K.A.D", "MRC / Wöchentliche Bestellungen - K.A.D", "MRC / Heti rendelések - K.A.D"], ["Comenzi pe săptămâni", "Comenzi pe săptămâni", "Orders by weeks", "Commandes par semaines", "Ordini per settimane", "Bestellungen nach Wochen", "Rendelések hetek szerint"], ["Vedere săptămânală", "Vedere săptămânală", "Weekly view", "Vue hebdomadaire", "Vista settimanale", "Wochenansicht", "Heti nézet"], ["Export comenzi", "Export comenzi", "Export orders", "Exporter commandes", "Esporta ordini", "Bestellungen exportieren", "Rendelések exportálása"], ["Import comenzi piese", "Import comenzi piese", "Import part orders", "Importer commandes pièces", "Importa ordini pezzi", "Teilebestellungen importieren", "Cikkszám rendelések importálása"], ["Comandat kg - Intrat din comandă kg", "Comandat kg - Intrat din comandă kg", "Ordered kg - Received from order kg", "Kg commandés - Kg reçus de la commande", "Kg ordinati - Kg entrati da ordine", "Bestellte kg - Eingegangene kg aus Bestellung", "Rendelt kg - Beérkezett rendelésből kg"], ["Intrat din comandă kg", "Intrat din comandă kg", "Received from order kg", "Kg reçus de la commande", "Kg entrati da ordine", "Eingegangene kg aus Bestellung", "Beérkezett rendelésből kg"], ["Rămas kg", "Rămas kg", "Remaining kg", "Kg restant", "Kg rimanenti", "Rest-kg", "Maradó kg"], ["Doar rămase", "Doar rămase", "Only remaining", "Seulement restants", "Solo rimanenti", "Nur verbleibende", "Csak maradó"], ["Toți furnizorii", "Toți furnizorii", "All suppliers", "Tous les fournisseurs", "Tutti i fornitori", "Alle Lieferanten", "Összes beszállító"], ["Nr comandă", "Nr comandă", "Order no.", "N° commande", "N. ordine", "Bestell-Nr.", "Rendelés száma"], ["Săptămână", "Săptămână", "Week", "Semaine", "Settimana", "Woche", "Hét"], ["Repere nemapate din comenzi", "Repere nemapate din comenzi", "Unmapped parts from orders", "Références non mappées des commandes", "Codici pezzo non mappati dagli ordini", "Nicht zugeordnete Teile aus Bestellungen", "Nem párosított cikkszámok a rendelésekből"], ["Date încărcate", "Date încărcate", "Data loaded", "Données chargées", "Dati caricati", "Daten geladen", "Adatok betöltve"], ["Centralizare anuală din foaia", "Centralizare anuală din foaia", "Annual summary from sheet", "Centralisation annuelle depuis la feuille", "Riepilogo annuale dal foglio", "Jahreszusammenfassung aus Blatt", "Éves összesítés a lapból"], ["Comparație între ani după suma totală a pieselor livrate.", "Comparație între ani după suma totală a pieselor livrate.", "Comparison between years by total delivered parts.", "Comparaison entre années selon le total des pièces livrées.", "Confronto tra anni per somma totale dei pezzi consegnati.", "Vergleich zwischen Jahren nach Gesamtzahl gelieferter Teile.", "Évek összehasonlítása az összes szállított darab alapján."], ["Deschide foaia sursă", "Deschide foaia sursă", "Open source sheet", "Ouvrir la feuille source", "Apri foglio origine", "Quellblatt öffnen", "Forráslap megnyitása"], ["TOTAL AFIȘAT", "TOTAL AFIȘAT", "DISPLAYED TOTAL", "TOTAL AFFICHÉ", "TOTALE VISUALIZZATO", "ANGEZEIGTE SUMME", "MEGJELENÍTETT ÖSSZESEN"], ["Total afișat", "Total afișat", "Displayed total", "Total affiché", "Totale visualizzato", "Angezeigte Summe", "Megjelenített összesen"], ["Filtrarea modifică doar afișarea. Datele rămân în cloud exact cum sunt salvate.", "Filtrarea modifică doar afișarea. Datele rămân în cloud exact cum sunt salvate.", "Filtering only changes the display. The data remains in cloud exactly as saved.", "Le filtrage modifie uniquement l’affichage. Les données restent dans le cloud exactement comme enregistrées.", "Il filtro modifica solo la visualizzazione. I dati restano nel cloud esattamente come salvati.", "Die Filterung ändert nur die Anzeige. Die Daten bleiben in der Cloud genau wie gespeichert.", "A szűrés csak a megjelenítést módosítja. Az adatok pontosan mentett formában maradnak a felhőben."], ["Caută transport / dată", "Caută transport / dată", "Search transport / date", "Rechercher transport / date", "Cerca trasporto / data", "Transport / Datum suchen", "Szállítás / dátum keresése"], ["Sursă: seed din Excel.", "Sursă: seed din Excel.", "Source: seed from Excel.", "Source : seed depuis Excel.", "Fonte: seed da Excel.", "Quelle: Seed aus Excel.", "Forrás: Excel alapadat."], ["Fallback fișier Excel", "Fallback fișier Excel", "Excel file fallback", "Fallback fichier Excel", "Fallback file Excel", "Excel-Datei-Fallback", "Excel fájl tartalék"], ["Afișare", "Afișare", "Display", "Affichage", "Visualizzazione", "Anzeige", "Megjelenítés"], ["Paletă celule", "Paletă celule", "Cell palette", "Palette cellules", "Tavolozza celle", "Zellpalette", "Cella paletta"], ["Roșu", "Roșu", "Red", "Rouge", "Rosso", "Rot", "Piros"], ["CANT. CERUTĂ", "CANT. CERUTĂ", "REQUIRED QTY", "QTÉ DEMANDÉE", "Q.TÀ RICHIESTA", "ERFORDERLICHE MENGE", "KÉRT MENNYISÉG"], ["Adaugă comandă", "Adaugă comandă", "Add order", "Ajouter commande", "Aggiungi ordine", "Bestellung hinzufügen", "Rendelés hozzáadása"], ["Data de la", "Data de la", "Date from", "Date du", "Data da", "Datum von", "Dátumtól"], ["Data până la", "Data până la", "Date to", "Date au", "Data a", "Datum bis", "Dátumig"], ["Rezumat și avertizări", "Rezumat și avertizări", "Summary and warnings", "Résumé et avertissements", "Riepilogo e avvisi", "Zusammenfassung und Warnungen", "Összegzés és figyelmeztetések"], ["Draft propus înainte de aplicare", "Draft propus înainte de aplicare", "Proposed draft before applying", "Brouillon proposé avant application", "Bozza proposta prima dell’applicazione", "Vorgeschlagener Entwurf vor Anwendung", "Javasolt vázlat alkalmazás előtt"], ["Generează planificarea", "Generează planificarea", "Generate planning", "Générer la planification", "Genera pianificazione", "Planung erzeugen", "Tervezés generálása"], ["Nu am citit încă documentul.", "Nu am citit încă documentul.", "I have not read the document yet.", "Je n’ai pas encore lu le document.", "Non ho ancora letto il documento.", "Ich habe das Dokument noch nicht gelesen.", "Még nem olvastam a dokumentumot."], ["Data adaugarii", "Data adăugării", "Addition date", "Date d’ajout", "Data aggiunta", "Hinzufügedatum", "Hozzáadás dátuma"], ["Data adăugării", "Data adăugării", "Addition date", "Date d’ajout", "Data aggiunta", "Hinzufügedatum", "Hozzáadás dátuma"], ["Descriere prioritate", "Descriere prioritate", "Priority description", "Description priorité", "Descrizione priorità", "Prioritätsbeschreibung", "Prioritás leírása"], ["Descriere stadiu", "Descriere stadiu", "Stage description", "Description du stade", "Descrizione fase", "Statusbeschreibung", "Állapot leírása"], ["Foaie activă: Forja", "Foaie activă: Forja", "Active sheet: Forging", "Feuille active : Forge", "Foglio attivo: Forgiatura", "Aktives Blatt: Schmiede", "Aktív lap: Kovácsolás"], ["Nume pentru observația nouă", "Nume pentru observația nouă", "Name for new note", "Nom pour la nouvelle observation", "Nome per nuova nota", "Name für neue Bemerkung", "Név az új megjegyzéshez"], ["Introdu numele care va apărea lângă observația nouă.", "Introdu numele care va apărea lângă observația nouă.", "Enter the name that will appear next to the new note.", "Saisissez le nom qui apparaîtra à côté de la nouvelle observation.", "Inserisci il nome che apparirà accanto alla nuova nota.", "Geben Sie den Namen ein, der neben der neuen Bemerkung angezeigt wird.", "Add meg a nevet, amely az új megjegyzés mellett jelenik meg."], ["Descriere", "Descriere", "Description", "Description", "Descrizione", "Beschreibung", "Leírás"], ["Denumire investiție", "Denumire investiție", "Investment name", "Nom investissement", "Nome investimento", "Investitionsbezeichnung", "Beruházás neve"], ["Responsabil investiție", "Responsabil investiție", "Investment responsible", "Responsable investissement", "Responsabile investimento", "Investitionsverantwortlicher", "Beruházás felelőse"], ["Motiv / beneficii / observație nouă", "Motiv / beneficii / observație nouă", "Reason / benefits / new note", "Motif / bénéfices / nouvelle observation", "Motivo / benefici / nuova nota", "Grund / Nutzen / neue Bemerkung", "Ok / előnyök / új megjegyzés"], ["Poți scrie justificarea investiției, beneficiul așteptat, stadiul ofertelor sau orice observație nouă. Textul se adaugă dedesubt, fără să șteargă observațiile existente.", "Poți scrie justificarea investiției, beneficiul așteptat, stadiul ofertelor sau orice observație nouă. Textul se adaugă dedesubt, fără să șteargă observațiile existente.", "You can write the investment justification, expected benefit, offer stage or any new note. The text is added below without deleting existing notes.", "Vous pouvez écrire la justification de l’investissement, le bénéfice attendu, le stade des offres ou toute nouvelle observation. Le texte est ajouté en dessous sans supprimer les observations existantes.", "Puoi scrivere la giustificazione dell’investimento, il beneficio atteso, lo stato delle offerte o qualsiasi nuova nota. Il testo viene aggiunto sotto senza eliminare le note esistenti.", "Sie können Investitionsbegründung, erwarteten Nutzen, Angebotsstatus oder jede neue Bemerkung schreiben. Der Text wird unten hinzugefügt, ohne vorhandene Bemerkungen zu löschen.", "Megadhatod a beruházás indoklását, a várható előnyt, az ajánlatok állapotát vagy bármilyen új megjegyzést. A szöveg alulra kerül a meglévők törlése nélkül."], ["La salvare, textul nou se adaugă pe linie nouă în același câmp, cu dată, oră și nume.", "La salvare, textul nou se adaugă pe linie nouă în același câmp, cu dată, oră și nume.", "On save, the new text is added on a new line in the same field, with date, time and name.", "À l’enregistrement, le nouveau texte est ajouté sur une nouvelle ligne dans le même champ, avec date, heure et nom.", "Al salvataggio, il nuovo testo viene aggiunto su una nuova riga nello stesso campo, con data, ora e nome.", "Beim Speichern wird der neue Text in einer neuen Zeile im selben Feld mit Datum, Uhrzeit und Name hinzugefügt.", "Mentéskor az új szöveg új sorba kerül ugyanabban a mezőben dátummal, idővel és névvel."], ["Adaugă acțiune", "Adaugă acțiune", "Add action", "Ajouter action", "Aggiungi azione", "Aktion hinzufügen", "Művelet hozzáadása"], ["Șterge rând", "Șterge rând", "Delete row", "Supprimer ligne", "Elimina riga", "Zeile löschen", "Sor törlése"], ["Anulează", "Anulează", "Cancel", "Annuler", "Annulla", "Abbrechen", "Mégse"], ["Salvează", "Salvează", "Save", "Enregistrer", "Salva", "Speichern", "Mentés"], ["Întârziate", "Întârziate", "Late", "En retard", "In ritardo", "Verspätet", "Késésben"], ["Mentenanță", "Mentenanță", "Maintenance", "Maintenance", "Manutenzione", "Wartung", "Karbantartás"], ["MENTENANȚĂ", "MENTENANȚĂ", "MAINTENANCE", "MAINTENANCE", "MANUTENZIONE", "WARTUNG", "KARBANTARTÁS"], ["ÎNCĂLZIRE", "ÎNCĂLZIRE", "HEATING", "CHAUFFAGE", "RISCALDAMENTO", "ERWÄRMUNG", "MELEGÍTÉS"], ["Încălzire", "Încălzire", "Heating", "Chauffage", "Riscaldamento", "Erwärmung", "Melegítés"], ["Ore lucrate și timpi pierduți", "Ore lucrate și timpi pierduți", "Worked hours and lost time", "Heures travaillées et temps perdu", "Ore lavorate e tempi persi", "Arbeitsstunden und Verlustzeiten", "Ledolgozott órák és elveszett idők"], ["Acceptă fișiere Excel și Microsoft Word. La salvare, fișierul intră în cloud și se poate deschide sau exporta din tabel.", "Acceptă fișiere Excel și Microsoft Word. La salvare, fișierul intră în cloud și se poate deschide sau exporta din tabel.", "Accepts Excel and Microsoft Word files. On save, the file goes to cloud and can be opened or exported from the table.", "Accepte les fichiers Excel et Microsoft Word. À l’enregistrement, le fichier va dans le cloud et peut être ouvert ou exporté depuis le tableau.", "Accetta file Excel e Microsoft Word. Al salvataggio, il file va nel cloud e può essere aperto o esportato dalla tabella.", "Akzeptiert Excel- und Microsoft-Word-Dateien. Beim Speichern geht die Datei in die Cloud und kann aus der Tabelle geöffnet oder exportiert werden.", "Excel és Microsoft Word fájlokat fogad. Mentéskor a fájl a felhőbe kerül, és a táblázatból megnyitható vagy exportálható."], ["Fișier Excel / Word", "Fișier Excel / Word", "Excel / Word file", "Fichier Excel / Word", "File Excel / Word", "Excel-/Word-Datei", "Excel / Word fájl"], ["FIȘIER", "FIȘIER", "FILE", "FICHIER", "FILE", "DATEI", "FÁJL"], ["Fișier PDF", "Fișier PDF", "PDF file", "Fichier PDF", "File PDF", "PDF-Datei", "PDF fájl"], ["FIȘIER PDF", "FIȘIER PDF", "PDF FILE", "FICHIER PDF", "FILE PDF", "PDF-DATEI", "PDF FÁJL"], ["Fișe salvate", "Fișe salvate", "Saved sheets", "Fiches enregistrées", "Schede salvate", "Gespeicherte Blätter", "Mentett lapok"], ["Fișă selectată: niciuna", "Fișă selectată: niciuna", "Selected sheet: none", "Fiche sélectionnée : aucune", "Scheda selezionata: nessuna", "Ausgewähltes Blatt: keines", "Kiválasztott lap: nincs"], ["Salvează documentul", "Salvează documentul", "Save document", "Enregistrer document", "Salva documento", "Dokument speichern", "Dokumentum mentése"], ["Salvează fișa PDF", "Salvează fișa PDF", "Save PDF sheet", "Enregistrer fiche PDF", "Salva scheda PDF", "PDF-Blatt speichern", "PDF lap mentése"], ["Șterge documentul", "Șterge documentul", "Delete document", "Supprimer document", "Elimina documento", "Dokument löschen", "Dokumentum törlése"], ["Șterge fișa", "Șterge fișa", "Delete sheet", "Supprimer fiche", "Elimina scheda", "Blatt löschen", "Lap törlése"], ["Ex: Cuptor oprit, așteptare material, reglaj temperatură...", "Ex: Cuptor oprit, așteptare material, reglaj temperatură...", "Ex: Furnace stopped, waiting for material, temperature adjustment...", "Ex : four arrêté, attente matière, réglage température...", "Es: forno fermo, attesa materiale, regolazione temperatura...", "Bsp.: Ofen gestoppt, Warten auf Material, Temperatureinstellung...", "Pl.: kemence áll, anyagra várás, hőmérséklet beállítás..."], ["Sarjă (opțional)", "Sarjă (opțional)", "Batch (optional)", "Coulée (facultatif)", "Colata (opzionale)", "Charge (optional)", "Adag (opcionális)"], ["Val Electrică", "Val Electrică", "Electric wave", "Onde électrique", "Onda elettrica", "Elektrische Welle", "Elektromos hullám"], ["Val Magnetică", "Val Magnetică", "Magnetic wave", "Onde magnétique", "Onda magnetica", "Magnetische Welle", "Mágneses hullám"], ["Scrie defectul și tabelul calculează automat totalul.", "Scrie defectul și tabelul calculează automat totalul.", "Enter the defect and the table automatically calculates the total.", "Saisissez le défaut et le tableau calcule automatiquement le total.", "Scrivi il difetto e la tabella calcola automaticamente il totale.", "Geben Sie den Fehler ein und die Tabelle berechnet automatisch die Summe.", "Írd be a hibát, és a táblázat automatikusan kiszámolja az összesent."], ["Graficul urmează exact tabelul 1.", "Graficul urmează exact tabelul 1.", "The chart follows table 1 exactly.", "Le graphique suit exactement le tableau 1.", "Il grafico segue esattamente la tabella 1.", "Das Diagramm folgt genau Tabelle 1.", "A grafikon pontosan az 1. táblázatot követi."], ["Graficul urmează exact tabelul 2.", "Graficul urmează exact tabelul 2.", "The chart follows table 2 exactly.", "Le graphique suit exactement le tableau 2.", "Il grafico segue esattamente la tabella 2.", "Das Diagramm folgt genau Tabelle 2.", "A grafikon pontosan a 2. táblázatot követi."], ["Nu există coduri pentru selecția curentă.", "Nu există coduri pentru selecția curentă.", "No codes for the current selection.", "Aucun code pour la sélection actuelle.", "Nessun codice per la selezione corrente.", "Keine Codes für die aktuelle Auswahl.", "Nincs kód az aktuális kiválasztáshoz."], ["Nu există date încă.", "Nu există date încă.", "No data yet.", "Aucune donnée pour le moment.", "Nessun dato ancora.", "Noch keine Daten.", "Még nincs adat."], ["Poate prelua automat COD CAT și Numeral KOD din helper-data dacă există mapare.", "Poate prelua automat COD CAT și Numeral KOD din helper-data dacă există mapare.", "Can automatically retrieve CAT CODE and Numeral KOD from helper-data if a mapping exists.", "Peut récupérer automatiquement le CODE CAT et Numeral KOD depuis helper-data s’il existe un mappage.", "Può recuperare automaticamente COD CAT e Numeral KOD da helper-data se esiste una mappatura.", "Kann CAT-CODE und Numeral KOD automatisch aus helper-data abrufen, wenn eine Zuordnung existiert.", "Automatikusan átveheti a CAT KÓDOT és Numeral KOD-ot a helper-data-ból, ha van párosítás."], ["Aceeași logică ERP · local + cloud · helper-data", "Aceeași logică ERP · local + cloud · helper-data", "Same ERP logic · local + cloud · helper-data", "Même logique ERP · local + cloud · helper-data", "Stessa logica ERP · locale + cloud · helper-data", "Gleiche ERP-Logik · lokal + Cloud · helper-data", "Ugyanaz az ERP logika · helyi + felhő · helper-data"], ["Adaugă înregistrare MAGNAFLUX", "Adaugă înregistrare MAGNAFLUX", "Add MAGNAFLUX record", "Ajouter enregistrement MAGNAFLUX", "Aggiungi registrazione MAGNAFLUX", "MAGNAFLUX-Datensatz hinzufügen", "MAGNAFLUX bejegyzés hozzáadása"], ["Defecte grup 1 · influențează PROCENT REMEDIERI", "Defecte grup 1 · influențează PROCENT REMEDIERI", "Group 1 defects · affect REWORK PERCENT", "Défauts groupe 1 · influencent POURCENTAGE RETOUCHES", "Difetti gruppo 1 · influenzano PERCENTUALE RIPARAZIONI", "Fehler Gruppe 1 · beeinflussen NACHARBEITSANTEIL", "1. csoport hibák · befolyásolják a JAVÍTÁSI SZÁZALÉKOT"], ["Defecte rebut · influențează PROCENT REBUT și Total rebut", "Defecte rebut · influențează PROCENT REBUT și Total rebut", "Scrap defects · affect SCRAP PERCENT and Total scrap", "Défauts rebut · influencent POURCENTAGE REBUT et total rebut", "Difetti scarto · influenzano PERCENTUALE SCARTO e totale scarto", "Ausschussfehler · beeinflussen AUSSCHUSSANTEIL und Gesamtausschuss", "Selejt hibák · befolyásolják a SELEJT SZÁZALÉKOT és összes selejtet"], ["Lista Vânzări", "Lista Vânzări", "Sales list", "Liste ventes", "Lista vendite", "Verkaufsliste", "Értékesítési lista"], ["Lista Vânzări - K.A.D", "Lista Vânzări - K.A.D", "Sales list - K.A.D", "Liste ventes - K.A.D", "Lista vendite - K.A.D", "Verkaufsliste - K.A.D", "Értékesítési lista - K.A.D"], ["Listă vânzări cu import și export Excel, după modelul fișierului trimis.", "Listă vânzări cu import și export Excel, după modelul fișierului trimis.", "Sales list with Excel import and export, based on the provided file model.", "Liste de ventes avec import et export Excel, selon le modèle du fichier transmis.", "Lista vendite con import ed export Excel, secondo il modello del file inviato.", "Verkaufsliste mit Excel-Import und -Export nach dem Modell der gesendeten Datei.", "Értékesítési lista Excel importtal és exporttal, a küldött fájl mintája szerint."], ["Data emiterii", "Data emiterii", "Issue date", "Date d’émission", "Data emissione", "Ausgabedatum", "Kiadás dátuma"], ["Firmă", "Firmă", "Company", "Société", "Azienda", "Firma", "Cég"], ["Nume art.", "Nume art.", "Item name", "Nom article", "Nome articolo", "Artikelname", "Cikk neve"], ["Număr document", "Număr document", "Document number", "Numéro document", "Numero documento", "Dokumentnummer", "Dokumentumszám"], ["Cauză", "Cauză", "Cause", "Cause", "Causa", "Ursache", "Ok"], ["Descriere neconformitate", "Descriere neconformitate", "Nonconformity description", "Description non-conformité", "Descrizione non conformità", "Beschreibung der Nichtkonformität", "Nem megfelelőség leírása"], ["Piese conforme după remaniere", "Piese conforme după remaniere", "Conforming parts after rework", "Pièces conformes après retouche", "Pezzi conformi dopo rilavorazione", "Konforme Teile nach Nacharbeit", "Megfelelő darabok javítás után"], ["Piese neconforme", "Piese neconforme", "Nonconforming parts", "Pièces non conformes", "Pezzi non conformi", "Nichtkonforme Teile", "Nem megfelelő darabok"], ["Piese Neconforme", "Piese Neconforme", "Nonconforming parts", "Pièces non conformes", "Pezzi non conformi", "Nichtkonforme Teile", "Nem megfelelő darabok"], ["Piese rebut final", "Piese rebut final", "Final scrap parts", "Pièces rebut final", "Pezzi scarto finale", "Endgültige Ausschussteile", "Végleges selejt darabok"], ["Piese remaniabile", "Piese remaniabile", "Reworkable parts", "Pièces retouchables", "Pezzi rilavorabili", "Nacharbeitbare Teile", "Javítható darabok"], ["Piese Remaniabile", "Piese Remaniabile", "Reworkable parts", "Pièces retouchables", "Pezzi rilavorabili", "Nacharbeitbare Teile", "Javítható darabok"], ["Proveniență", "Proveniență", "Origin", "Provenance", "Provenienza", "Herkunft", "Eredet"], ["Fără filtre active", "Fără filtre active", "No active filters", "Aucun filtre actif", "Nessun filtro attivo", "Keine aktiven Filter", "Nincs aktív szűrő"], ["Detaliere pe categoriile LM, IBT, SM, FTT, FL, LMC, DES, AS și DIV.", "Detaliere pe categoriile LM, IBT, SM, FTT, FL, LMC, DES, AS și DIV.", "Breakdown by categories LM, IBT, SM, FTT, FL, LMC, DES, AS and DIV.", "Détail par catégories LM, IBT, SM, FTT, FL, LMC, DES, AS et DIV.", "Dettaglio per categorie LM, IBT, SM, FTT, FL, LMC, DES, AS e DIV.", "Aufschlüsselung nach Kategorien LM, IBT, SM, FTT, FL, LMC, DES, AS und DIV.", "Részletezés LM, IBT, SM, FTT, FL, LMC, DES, AS és DIV kategóriák szerint."], ["Foaia 1: sumar automat după modelul din Excel. Datele vin din Forjate, Magnaflux și, dacă există import, din Rebut PM.", "Foaia 1: sumar automat după modelul din Excel. Datele vin din Forjate, Magnaflux și, dacă există import, din Rebut PM.", "Sheet 1: automatic summary based on the Excel model. Data comes from Forjate, Magnaflux and, if imported, from Rebut PM.", "Feuille 1 : résumé automatique selon le modèle Excel. Les données viennent de Forjate, Magnaflux et, s’il existe un import, de Rebut PM.", "Foglio 1: riepilogo automatico secondo il modello Excel. I dati arrivano da Forjate, Magnaflux e, se importati, da Rebut PM.", "Blatt 1: automatische Zusammenfassung nach Excel-Modell. Daten kommen aus Forjate, Magnaflux und, falls importiert, aus Rebut PM.", "1. lap: automatikus összesítő az Excel minta szerint. Az adatok a Forjate, Magnaflux és import esetén a Rebut PM lapból jönnek."], ["Foaia 2 după modelul din Excel. Aici imporți datele primite din alte compartimente.", "Foaia 2 după modelul din Excel. Aici imporți datele primite din alte compartimente.", "Sheet 2 based on the Excel model. Here you import data received from other departments.", "Feuille 2 selon le modèle Excel. Ici vous importez les données reçues d’autres départements.", "Foglio 2 secondo il modello Excel. Qui importi i dati ricevuti da altri reparti.", "Blatt 2 nach dem Excel-Modell. Hier importieren Sie Daten aus anderen Abteilungen.", "2. lap az Excel minta szerint. Ide importálod a más részlegektől kapott adatokat."], ["Înapoi la Rebut", "Înapoi la Rebut", "Back to Scrap", "Retour à Rebut", "Torna a Scarto", "Zurück zu Ausschuss", "Vissza a Selejthez"], ["Înapoi la Rebut PM", "Înapoi la Rebut PM", "Back to Rebut PM", "Retour à Rebut PM", "Torna a Rebut PM", "Zurück zu Rebut PM", "Vissza a Rebut PM-hez"], ["Adaugă cod defect", "Adaugă cod defect", "Add defect code", "Ajouter code défaut", "Aggiungi codice difetto", "Fehlercode hinzufügen", "Hibakód hozzáadása"], ["Resetează implicit", "Resetează implicit", "Reset default", "Réinitialiser par défaut", "Ripristina predefinito", "Standard zurücksetzen", "Alapértelmezett visszaállítása"], ["Salvează helper", "Salvează helper", "Save helper", "Enregistrer helper", "Salva helper", "Helper speichern", "Segéd mentése"], ["Liste auxiliare pentru formularul de adăugare: repere, coduri defect, operatori și locuri de depistare.", "Liste auxiliare pentru formularul de adăugare: repere, coduri defect, operatori și locuri de depistare.", "Auxiliary lists for the add form: parts, defect codes, operators and detection locations.", "Listes auxiliaires pour le formulaire d’ajout : références, codes défaut, opérateurs et lieux de détection.", "Liste ausiliarie per il modulo di aggiunta: codici pezzo, codici difetto, operatori e luoghi di rilevamento.", "Hilfslisten für das Hinzufügen-Formular: Teile, Fehlercodes, Bediener und Fundorte.", "Segédlisták a hozzáadó űrlaphoz: cikkszámok, hibakódok, operátorok és észlelési helyek."], ["Datele implicite sunt încărcate din Excel + lista VBA.", "Datele implicite sunt încărcate din Excel + lista VBA.", "Default data is loaded from Excel + VBA list.", "Les données par défaut sont chargées depuis Excel + liste VBA.", "I dati predefiniti sono caricati da Excel + lista VBA.", "Standarddaten werden aus Excel + VBA-Liste geladen.", "Az alapértelmezett adatok Excelből + VBA listából töltődnek be."], ["Setări pentru ALTE REPERE (aceleași reguli, listă separată).", "Setări pentru ALTE REPERE (aceleași reguli, listă separată).", "Settings for OTHER PARTS (same rules, separate list).", "Paramètres pour AUTRES RÉFÉRENCES (mêmes règles, liste séparée).", "Impostazioni per ALTRI CODICI PEZZO (stesse regole, lista separata).", "Einstellungen für ANDERE TEILE (gleiche Regeln, separate Liste).", "Beállítások MÁS CIKKSZÁMOKHOZ (azonos szabályok, külön lista)."], ["Orice cod introdus în", "Orice cod introdus în", "Any code entered in", "Tout code saisi dans", "Qualsiasi codice inserito in", "Jeder in eingegebene Code", "Bármely beírt kód ebben"], ["SARJA OTEL", "SARJA OȚEL", "STEEL BATCH", "COULÉE ACIER", "COLATA ACCIAIO", "STAHLCHARGE", "ACÉL ADAG"], ["Reset (păstrează doar N1 în ZALE)", "Reset (păstrează doar N1 în ZALE)", "Reset (keep only N1 in CHAIN LINKS)", "Reset (garder seulement N1 dans MAILLONS)", "Reset (mantieni solo N1 in MAGLIE)", "Reset (nur N1 in KETTENGLIEDER behalten)", "Reset (csak N1 marad a LÁNCSZEMEKBEN)"], ["➕ Adaugă COD rezervat", "➕ Adaugă COD rezervat", "➕ Add reserved CODE", "➕ Ajouter CODE réservé", "➕ Aggiungi CODICE riservato", "➕ Reservierten CODE hinzufügen", "➕ Fenntartott KÓD hozzáadása"], ["➕ Adaugă SERIA în ALTE REPERE", "➕ Adaugă SERIA în ALTE REPERE", "➕ Add SERIES to OTHER PARTS", "➕ Ajouter SÉRIE dans AUTRES RÉFÉRENCES", "➕ Aggiungi SERIE in ALTRI CODICI", "➕ SERIE zu ANDERE TEILE hinzufügen", "➕ SZÉRIA hozzáadása MÁS CIKKSZÁMOKHOZ"], ["➕ Adaugă SERIA în ZALE", "➕ Adaugă SERIA în ZALE", "➕ Add SERIES to CHAIN LINKS", "➕ Ajouter SÉRIE dans MAILLONS", "➕ Aggiungi SERIE in MAGLIE", "➕ SERIE zu KETTENGLIEDER hinzufügen", "➕ SZÉRIA hozzáadása LÁNCSZEMEKHEZ"], ["🗑 Șterge SERIA", "🗑 Șterge SERIA", "🗑 Delete SERIES", "🗑 Supprimer SÉRIE", "🗑 Elimina SERIE", "🗑 SERIE löschen", "🗑 SZÉRIA törlése"], ["🗑️ Șterge Auto‑Save", "🗑️ Șterge Auto‑Save", "🗑️ Delete Auto-Save", "🗑️ Supprimer Auto-Save", "🗑️ Elimina Auto-Save", "🗑️ Auto-Save löschen", "🗑️ Auto-Save törlése"], ["☁️ Sync Cloud", "☁️ Sync Cloud", "☁️ Cloud Sync", "☁️ Sync Cloud", "☁️ Sync Cloud", "☁️ Cloud-Sync", "☁️ Felhő szinkron"], ["Continuă", "Continuă", "Continue", "Continuer", "Continua", "Weiter", "Folytatás"], ["Șterge accesul", "Șterge accesul", "Clear access", "Effacer accès", "Cancella accesso", "Zugriff löschen", "Hozzáférés törlése"], ["Șterge filtrele", "Șterge filtrele", "Clear filters", "Effacer filtres", "Cancella filtri", "Filter löschen", "Szűrők törlése"], ["Curăță formular", "Curăță formular", "Clear form", "Vider formulaire", "Pulisci modulo", "Formular leeren", "Űrlap törlése"], ["Salvează tot", "Salvează tot", "Save all", "Tout enregistrer", "Salva tutto", "Alles speichern", "Összes mentése"], ["Actualizează", "Actualizează", "Update", "Mettre à jour", "Aggiorna", "Aktualisieren", "Frissítés"], ["Reîncarcă", "Reîncarcă", "Reload", "Recharger", "Ricarica", "Neu laden", "Újratöltés"], ["↻ Reîncarcă", "↻ Reîncarcă", "↻ Reload", "↻ Recharger", "↻ Ricarica", "↻ Neu laden", "↻ Újratöltés"], ["Refresh cloud", "Refresh cloud", "Refresh cloud", "Actualiser cloud", "Aggiorna cloud", "Cloud aktualisieren", "Felhő frissítése"], ["Cloud: local only", "Cloud: local only", "Cloud: local only", "Cloud : local uniquement", "Cloud: solo locale", "Cloud: nur lokal", "Felhő: csak helyi"], ["Cloud încărcat", "Cloud încărcat", "Cloud loaded", "Cloud chargé", "Cloud caricato", "Cloud geladen", "Felhő betöltve"], ["Sursă: cloud", "Sursă: cloud", "Source: cloud", "Source : cloud", "Fonte: cloud", "Quelle: Cloud", "Forrás: felhő"], ["Config Supabase lipsă", "Config Supabase lipsă", "Supabase config missing", "Configuration Supabase manquante", "Configurazione Supabase mancante", "Supabase-Konfiguration fehlt", "Supabase konfiguráció hiányzik"], ["Nu ești autentificat / Cloud indisponibil", "Nu ești autentificat / Cloud indisponibil", "You are not authenticated / Cloud unavailable", "Vous n’êtes pas authentifié / Cloud indisponible", "Non sei autenticato / Cloud non disponibile", "Nicht authentifiziert / Cloud nicht verfügbar", "Nem vagy hitelesítve / Felhő nem elérhető"], ["Pagina FORJATE rulează doar conectată la Supabase (fără mod local). Revino în Dashboard și autentifică-te.", "Pagina FORJATE rulează doar conectată la Supabase (fără mod local). Revino în Dashboard și autentifică-te.", "The FORJATE page runs only connected to Supabase (no local mode). Return to Dashboard and authenticate.", "La page FORJATE fonctionne uniquement connectée à Supabase (sans mode local). Revenez au tableau de bord et authentifiez-vous.", "La pagina FORJATE funziona solo collegata a Supabase (senza modalità locale). Torna alla dashboard e autenticati.", "Die FORJATE-Seite läuft nur mit Supabase-Verbindung (kein lokaler Modus). Zurück zum Dashboard und anmelden.", "A FORJATE oldal csak Supabase kapcsolattal működik (nincs helyi mód). Térj vissza a vezérlőpultra és jelentkezz be."], ["Adaugă FORJATE (doar câmpurile de intrare — restul se calculează automat)", "Adaugă FORJATE (doar câmpurile de intrare — restul se calculează automat)", "Add FORJATE (input fields only — the rest is calculated automatically)", "Ajouter FORJATE (uniquement les champs de saisie — le reste est calculé automatiquement)", "Aggiungi FORJATE (solo campi di input — il resto viene calcolato automaticamente)", "FORJATE hinzufügen (nur Eingabefelder — der Rest wird automatisch berechnet)", "FORJATE hozzáadása (csak bemeneti mezők — a többi automatikusan számolódik)"], ["Bucăți totale și media pe înregistrare", "Bucăți totale și media pe înregistrare", "Total pieces and average per record", "Pièces totales et moyenne par enregistrement", "Pezzi totali e media per registrazione", "Gesamtstücke und Durchschnitt pro Datensatz", "Összes darab és átlag bejegyzésenként"], ["Media OEE calculată din foaia FORJATE", "Media OEE calculată din foaia FORJATE", "Average OEE calculated from the FORJATE sheet", "Moyenne OEE calculée depuis la feuille FORJATE", "Media OEE calcolata dal foglio FORJATE", "Durchschnitts-OEE aus dem FORJATE-Blatt berechnet", "Átlag OEE a FORJATE lapból számítva"], ["Top repere după realizat", "Top repere după realizat", "Top parts by produced quantity", "Top références par réalisé", "Top codici per prodotto", "Top Teile nach produzierter Menge", "Top cikkszámok gyártott mennyiség szerint"], ["Primele repere din selecție după bucăți realizate", "Primele repere din selecție după bucăți realizate", "Top selected parts by produced pieces", "Premières références de la sélection par pièces réalisées", "Primi codici della selezione per pezzi prodotti", "Erste Teile der Auswahl nach produzierten Stücken", "A kiválasztás első cikkszámai gyártott darab szerint"], ["Statistici FORJATE pe anul și luna selectate: repere, utilaje, medii și grafice.", "Statistici FORJATE pe anul și luna selectate: repere, utilaje, medii și grafice.", "FORJATE statistics for selected year and month: parts, machines, averages and charts.", "Statistiques FORJATE pour l’année et le mois sélectionnés : références, machines, moyennes et graphiques.", "Statistiche FORJATE per anno e mese selezionati: codici, macchine, medie e grafici.", "FORJATE-Statistiken für ausgewähltes Jahr und Monat: Teile, Maschinen, Durchschnitte und Diagramme.", "FORJATE statisztikák a kiválasztott évre és hónapra: cikkszámok, gépek, átlagok és grafikonok."], ["Reguli de calcul (ca în poză):", "Reguli de calcul (ca în poză):", "Calculation rules (as in the picture):", "Règles de calcul (comme sur l’image) :", "Regole di calcolo (come nell’immagine):", "Berechnungsregeln (wie im Bild):", "Számítási szabályok (mint a képen):"], ["Filtrarea nu modifică datele din cloud. Doar afișarea.", "Filtrarea nu modifică datele din cloud. Doar afișarea.", "Filtering does not modify cloud data. Only the display.", "Le filtrage ne modifie pas les données cloud. Seulement l’affichage.", "Il filtro non modifica i dati cloud. Solo la visualizzazione.", "Filterung ändert keine Cloud-Daten. Nur die Anzeige.", "A szűrés nem módosítja a felhőadatokat. Csak a megjelenítést."], ["Zoom tabel (fără scroll stânga-dreapta)", "Zoom tabel (fără scroll stânga-dreapta)", "Table zoom (without left-right scroll)", "Zoom tableau (sans défilement gauche-droite)", "Zoom tabella (senza scroll sinistra-destra)", "Tabellenzoom (ohne Links-Rechts-Scroll)", "Táblázat nagyítás (bal-jobb görgetés nélkül)"], ["MEDIA / ÎNREG.", "MEDIA / ÎNREG.", "AVERAGE / RECORD", "MOYENNE / ENREG.", "MEDIA / REG.", "DURCHSCHNITT / DATENSATZ", "ÁTLAG / BEJEGYZÉS"], ["KG SEMIF. DEBIT", "KG SEMIF. DEBIT", "SEMIFINISHED CUT KG", "KG SEMI-FINI DÉBITÉ", "KG SEMILAVORATO TAGLIATO", "KG HALBZEUG GESCHNITTEN", "VÁGOTT FÉLKÉSZ KG"], ["KG SEMIF. DEBIT TOTAL", "KG SEMIF. DEBIT TOTAL", "TOTAL SEMIFINISHED CUT KG", "TOTAL KG SEMI-FINI DÉBITÉ", "TOTALE KG SEMILAVORATO TAGLIATO", "GESAMT KG HALBZEUG GESCHNITTEN", "ÖSSZES VÁGOTT FÉLKÉSZ KG"], ["Adaugă șef echipă", "Adaugă șef echipă", "Add team leader", "Ajouter chef d’équipe", "Aggiungi capo squadra", "Teamleiter hinzufügen", "Csoportvezető hozzáadása"], ["Nume șef echipă", "Nume șef echipă", "Team leader name", "Nom chef d’équipe", "Nome capo squadra", "Name des Teamleiters", "Csoportvezető neve"], ["Orele se împart automat din 8 ore pe fiecare post completat. Orele pot fi corectate manual înainte de salvare.", "Orele se împart automat din 8 ore pe fiecare post completat. Orele pot fi corectate manual înainte de salvare.", "Hours are automatically split from 8 hours across each completed station. Hours can be corrected manually before saving.", "Les heures sont réparties automatiquement sur 8 heures pour chaque poste rempli. Elles peuvent être corrigées manuellement avant enregistrement.", "Le ore vengono divise automaticamente da 8 ore su ogni postazione compilata. Le ore possono essere corrette manualmente prima del salvataggio.", "Die Stunden werden automatisch aus 8 Stunden auf jede ausgefüllte Station verteilt. Stunden können vor dem Speichern manuell korrigiert werden.", "Az órák automatikusan 8 órából oszlanak meg minden kitöltött posztra. Mentés előtt kézzel javíthatók."], ["Poți scrie ore întregi sau cu zecimale. KPI le transformă automat în minute.", "Poți scrie ore întregi sau cu zecimale. KPI le transformă automat în minute.", "You can enter whole or decimal hours. KPI automatically converts them to minutes.", "Vous pouvez saisir des heures entières ou décimales. KPI les transforme automatiquement en minutes.", "Puoi inserire ore intere o decimali. KPI le converte automaticamente in minuti.", "Sie können ganze oder dezimale Stunden eingeben. KPI wandelt sie automatisch in Minuten um.", "Egész vagy tizedes órákat adhatsz meg. A KPI automatikusan percekre váltja."], ["Reîncarcă helperele din cloud (instant)", "Reîncarcă helperele din cloud (instant)", "Reload helpers from cloud (instant)", "Recharger helpers depuis le cloud (instantané)", "Ricarica helper dal cloud (istantaneo)", "Helper aus der Cloud neu laden (sofort)", "Segédek újratöltése felhőből (azonnali)"], ["Filtre și sumar", "Filtre și sumar", "Filters and summary", "Filtres et résumé", "Filtri e riepilogo", "Filter und Zusammenfassung", "Szűrők és összegzés"], ["Filtrarea de aici este separată de sumar. Verificarea este pe combinația", "Filtrarea de aici este separată de sumar. Verificarea este pe combinația", "Filtering here is separate from the summary. The check is based on the combination", "Le filtrage ici est séparé du résumé. La vérification se fait sur la combinaison", "Il filtro qui è separato dal riepilogo. La verifica è sulla combinazione", "Die Filterung hier ist von der Zusammenfassung getrennt. Die Prüfung basiert auf der Kombination", "Az itteni szűrés külön van az összesítőtől. Az ellenőrzés a kombináció alapján történik"], ["debitatul depășește disponibilul", "debitatul depășește disponibilul", "cut quantity exceeds available stock", "le débit dépasse le disponible", "il tagliato supera il disponibile", "Schnittmenge überschreitet Bestand", "a vágott mennyiség meghaladja az elérhetőt"], ["intrări în luna selectată", "intrări în luna selectată", "entries in the selected month", "entrées dans le mois sélectionné", "entrate nel mese selezionato", "Eingänge im gewählten Monat", "bevételek a kiválasztott hónapban"], ["Adaugă debitare", "Adaugă debitare", "Add cutting", "Ajouter débitage", "Aggiungi taglio", "Schnitt hinzufügen", "Vágás hozzáadása"], ["Kg/buc.", "Kg/buc.", "Kg/pc", "Kg/pc", "Kg/pz", "Kg/Stk.", "Kg/db"], ["Kg/buc", "Kg/buc", "Kg/pc", "Kg/pc", "Kg/pz", "Kg/Stk.", "Kg/db"], ["cod intern otel 3 litere", "cod intern oțel 3 litere", "3-letter internal steel code", "code interne acier 3 lettres", "codice interno acciaio 3 lettere", "3-stelliger interner Stahlcode", "3 betűs belső acélkód"], ["Cod intern otel (3 litere)", "Cod intern oțel (3 litere)", "Internal steel code (3 letters)", "Code interne acier (3 lettres)", "Codice interno acciaio (3 lettere)", "Interner Stahlcode (3 Buchstaben)", "Belső acélkód (3 betű)"], ["Data Intrare", "Data Intrare", "Entry date", "Date entrée", "Data entrata", "Eingangsdatum", "Bevétel dátuma"], ["Data intrare", "Data intrare", "Entry date", "Date entrée", "Data entrata", "Eingangsdatum", "Bevétel dátuma"], ["Salvează fișiere pretest", "Salvează fișiere pretest", "Save pretest files", "Enregistrer fichiers prétest", "Salva file pretest", "Pretest-Dateien speichern", "Pretest fájlok mentése"], ["Fișiere PDF / Excel", "Fișiere PDF / Excel", "PDF / Excel files", "Fichiers PDF / Excel", "File PDF / Excel", "PDF-/Excel-Dateien", "PDF / Excel fájlok"], ["Pretest: fără fișiere încărcate", "Pretest: fără fișiere încărcate", "Pretest: no files uploaded", "Prétest : aucun fichier chargé", "Pretest: nessun file caricato", "Pretest: keine Dateien hochgeladen", "Pretest: nincs feltöltött fájl"], ["Reîncarcă fișiere", "Reîncarcă fișiere", "Reload files", "Recharger fichiers", "Ricarica file", "Dateien neu laden", "Fájlok újratöltése"], ["Nu există fișiere pentru combinația selectată.", "Nu există fișiere pentru combinația selectată.", "No files for the selected combination.", "Aucun fichier pour la combinaison sélectionnée.", "Nessun file per la combinazione selezionata.", "Keine Dateien für die ausgewählte Kombination.", "Nincs fájl a kiválasztott kombinációhoz."], ["Grupare pentru luna selectată după", "Grupare pentru luna selectată după", "Grouping for the selected month by", "Regroupement pour le mois sélectionné par", "Raggruppamento per il mese selezionato per", "Gruppierung für den ausgewählten Monat nach", "Csoportosítás a kiválasztott hónapra ez alapján"], ["Pentru luna selectată vezi combinațiile de", "Pentru luna selectată vezi combinațiile de", "For the selected month you see the combinations of", "Pour le mois sélectionné, vous voyez les combinaisons de", "Per il mese selezionato vedi le combinazioni di", "Für den ausgewählten Monat sehen Sie die Kombinationen von", "A kiválasztott hónapra a kombinációkat látod ebből"], ["și suma kilogramelor aferente.", "și suma kilogramelor aferente.", "and the sum of the related kilograms.", "et la somme des kilogrammes correspondants.", "e la somma dei chilogrammi relativi.", "und die Summe der zugehörigen Kilogramm.", "és a kapcsolódó kilogrammok összege."], ["după salvare. Îl închizi manual.", "după salvare. Îl închizi manual.", "after saving. You close it manually.", "après enregistrement. Vous le fermez manuellement.", "dopo il salvataggio. Lo chiudi manualmente.", "nach dem Speichern. Sie schließen es manuell.", "mentés után. Kézzel zárod be."], ["nu se închide", "nu se închide", "does not close", "ne se ferme pas", "non si chiude", "schließt sich nicht", "nem záródik be"], ["Platformă ERP industrială", "Platformă ERP industrială", "Industrial ERP platform", "Plateforme ERP industrielle", "Piattaforma ERP industriale", "Industrielle ERP-Plattform", "Ipari ERP platform"], ["Dashboard operațional", "Dashboard operațional", "Operational dashboard", "Tableau de bord opérationnel", "Dashboard operativo", "Operatives Dashboard", "Operatív vezérlőpult"], ["Control clar. Producție organizată. Decizii rapide.", "Control clar. Producție organizată. Decizii rapide.", "Clear control. Organized production. Fast decisions.", "Contrôle clair. Production organisée. Décisions rapides.", "Controllo chiaro. Produzione organizzata. Decisioni rapide.", "Klare Kontrolle. Organisierte Produktion. Schnelle Entscheidungen.", "Átlátható kontroll. Szervezett termelés. Gyors döntések."], ["Descoperă platforma", "Descoperă platforma", "Discover the platform", "Découvrez la plateforme", "Scopri la piattaforma", "Plattform entdecken", "Platform felfedezése"], ["Acoperire funcțională", "Acoperire funcțională", "Functional coverage", "Couverture fonctionnelle", "Copertura funzionale", "Funktionale Abdeckung", "Funkcionális lefedettség"], ["Vizibilitate în timp real", "Vizibilitate în timp real", "Real-time visibility", "Visibilité en temps réel", "Visibilità in tempo reale", "Echtzeit-Sichtbarkeit", "Valós idejű láthatóság"], ["Un site de prezentare pentru o platformă construită să simplifice gestionarea producției, a stocurilor, a comenzilor și a accesului utilizatorilor într-un mediu industrial modern.", "Un site de prezentare pentru o platformă construită să simplifice gestionarea producției, a stocurilor, a comenzilor și a accesului utilizatorilor într-un mediu industrial modern.", "A presentation site for a platform built to simplify production, stock, order and user access management in a modern industrial environment.", "Un site de présentation pour une plateforme conçue pour simplifier la gestion de la production, des stocks, des commandes et des accès utilisateurs dans un environnement industriel moderne.", "Un sito di presentazione per una piattaforma creata per semplificare la gestione di produzione, stock, ordini e accesso utenti in un ambiente industriale moderno.", "Eine Präsentationsseite für eine Plattform, die Produktion, Bestände, Bestellungen und Benutzerzugriff in einer modernen Industrieumgebung vereinfacht.", "Bemutató oldal egy platformhoz, amely egyszerűsíti a termelés, készlet, rendelések és felhasználói hozzáférés kezelését modern ipari környezetben."]];
    extraExact.forEach(function(r){ addExact.apply(null, r); });
    var extraTerms = [["și", "și", "and", "et", "e", "und", "és"], ["din", "din", "from", "de", "da", "aus", "ból"], ["în", "în", "in", "dans", "in", "in", "ban"], ["pe", "pe", "on", "sur", "su", "auf", "on"], ["cu", "cu", "with", "avec", "con", "mit", "val"], ["fără", "fără", "without", "sans", "senza", "ohne", "nélkül"], ["după", "după", "after", "après", "dopo", "nach", "után"], ["pentru", "pentru", "for", "pour", "per", "für", "számára"], ["până", "până", "until", "jusqu’à", "fino a", "bis", "ig"], ["la", "la", "to", "à", "a", "zu", "hoz"], ["de", "de", "of", "de", "di", "von", "of"], ["acțiune", "acțiune", "action", "action", "azione", "Aktion", "művelet"], ["acțiunii", "acțiunii", "action", "action", "azione", "Aktion", "művelet"], ["afișare", "afișare", "display", "affichage", "visualizzazione", "Anzeige", "megjelenítés"], ["afișat", "afișat", "displayed", "affiché", "visualizzato", "angezeigt", "megjelenített"], ["afișate", "afișate", "displayed", "affichées", "visualizzate", "angezeigt", "megjelenített"], ["actualizează", "actualizează", "update", "mettre à jour", "aggiorna", "aktualisieren", "frissítés"], ["adaugă", "adaugă", "add", "ajouter", "aggiungi", "hinzufügen", "hozzáadás"], ["alege", "alege", "choose", "choisir", "scegli", "wählen", "válassz"], ["anul", "anul", "year", "année", "anno", "Jahr", "év"], ["an", "an", "year", "année", "anno", "Jahr", "év"], ["luna", "luna", "month", "mois", "mese", "Monat", "hónap"], ["dată", "dată", "date", "date", "data", "Datum", "dátum"], ["data", "data", "date", "date", "data", "Datum", "dátum"], ["nume", "nume", "name", "nom", "nome", "Name", "név"], ["descriere", "descriere", "description", "description", "descrizione", "Beschreibung", "leírás"], ["observație", "observație", "note", "observation", "nota", "Bemerkung", "megjegyzés"], ["observații", "observații", "notes", "observations", "note", "Bemerkungen", "megjegyzések"], ["nouă", "nouă", "new", "nouvelle", "nuova", "neu", "új"], ["nou", "nou", "new", "nouveau", "nuovo", "neu", "új"], ["existente", "existente", "existing", "existantes", "esistenti", "vorhanden", "meglévő"], ["finalizare", "finalizare", "completion", "finalisation", "completamento", "Fertigstellung", "befejezés"], ["finalizării", "finalizării", "completion", "finalisation", "completamento", "Fertigstellung", "befejezés"], ["cantitate", "cantitate", "quantity", "quantité", "quantità", "Menge", "mennyiség"], ["bucăți", "bucăți", "pieces", "pièces", "pezzi", "Stück", "darab"], ["buc", "buc", "pcs", "pcs", "pz", "Stk", "db"], ["piese", "piese", "parts", "pièces", "pezzi", "Teile", "darabok"], ["total", "total", "total", "total", "totale", "gesamt", "összesen"], ["media", "media", "average", "moyenne", "media", "Durchschnitt", "átlag"], ["rămase", "rămase", "remaining", "restantes", "rimanenti", "verbleibend", "maradó"], ["rămas", "rămas", "remaining", "restant", "rimanente", "verbleibend", "maradó"], ["stoc", "stoc", "stock", "stock", "stock", "Bestand", "készlet"], ["calculat", "calculat", "calculated", "calculé", "calcolato", "berechnet", "számított"], ["inițială", "inițială", "initial", "initiale", "iniziale", "anfänglich", "kezdeti"], ["importată", "importată", "imported", "importée", "importata", "importiert", "importált"], ["tabelul", "tabelul", "table", "tableau", "tabella", "Tabelle", "táblázat"], ["tabel", "tabel", "table", "tableau", "tabella", "Tabelle", "táblázat"], ["păstrează", "păstrează", "keeps", "conserve", "mantiene", "behält", "megtartja"], ["culorile", "culorile", "colors", "couleurs", "colori", "Farben", "színek"], ["dimensiunile", "dimensiunile", "dimensions", "dimensions", "dimensioni", "Abmessungen", "méretek"], ["foaia", "foaia", "sheet", "feuille", "foglio", "Blatt", "lap"], ["sursă", "sursă", "source", "source", "origine", "Quelle", "forrás"], ["reper", "reper", "part", "référence", "codice pezzo", "Teil", "cikkszám"], ["repere", "repere", "parts", "références", "codici pezzo", "Teile", "cikkszámok"], ["utilaj", "utilaj", "machine", "machine", "macchina", "Maschine", "gép"], ["utilaje", "utilaje", "machines", "machines", "macchine", "Maschinen", "gépek"], ["operator", "operator", "operator", "opérateur", "operatore", "Bediener", "operátor"], ["operatori", "operatori", "operators", "opérateurs", "operatori", "Bediener", "operátorok"], ["schimb", "schimb", "shift", "équipe", "turno", "Schicht", "műszak"], ["schimburi", "schimburi", "shifts", "équipes", "turni", "Schichten", "műszakok"], ["departament", "departament", "department", "département", "reparto", "Abteilung", "részleg"], ["departamente", "departamente", "departments", "départements", "reparti", "Abteilungen", "részlegek"], ["responsabil", "responsabil", "responsible", "responsable", "responsabile", "Verantwortlicher", "felelős"], ["salvează", "salvează", "save", "enregistrer", "salva", "speichern", "mentés"], ["șterge", "șterge", "delete", "supprimer", "elimina", "löschen", "törlés"], ["ștergi", "ștergi", "delete", "supprimer", "elimina", "löschen", "törlés"], ["curăță", "curăță", "clear", "vider", "pulisci", "leeren", "törlés"], ["filtru", "filtru", "filter", "filtre", "filtro", "Filter", "szűrő"], ["filtre", "filtre", "filters", "filtres", "filtri", "Filter", "szűrők"], ["filtrarea", "filtrarea", "filtering", "filtrage", "filtro", "Filterung", "szűrés"], ["caută", "caută", "search", "rechercher", "cerca", "suchen", "keresés"], ["căutare", "căutare", "search", "recherche", "ricerca", "Suche", "keresés"], ["deschide", "deschide", "open", "ouvrir", "apri", "öffnen", "megnyitás"], ["închide", "închide", "close", "fermer", "chiudi", "schließen", "bezárás"], ["reîncarcă", "reîncarcă", "reload", "recharger", "ricarica", "neu laden", "újratöltés"], ["export", "export", "export", "export", "export", "Export", "export"], ["import", "import", "import", "import", "import", "Import", "import"], ["parolă", "parolă", "password", "mot de passe", "password", "Passwort", "jelszó"], ["cod", "cod", "code", "code", "codice", "Code", "kód"], ["cont", "cont", "account", "compte", "account", "Konto", "fiók"], ["conturi", "conturi", "accounts", "comptes", "account", "Konten", "fiókok"], ["acces", "acces", "access", "accès", "accesso", "Zugriff", "hozzáférés"], ["autentificare", "autentificare", "authentication", "authentification", "autenticazione", "Authentifizierung", "hitelesítés"], ["sesiune", "sesiune", "session", "session", "sessione", "Sitzung", "munkamenet"], ["verifică", "verifică", "verify", "vérifier", "verifica", "prüfen", "ellenőrzés"], ["verificare", "verificare", "checking", "vérification", "verifica", "Prüfung", "ellenőrzés"], ["comenzi", "comenzi", "orders", "commandes", "ordini", "Bestellungen", "rendelések"], ["comandă", "comandă", "order", "commande", "ordine", "Bestellung", "rendelés"], ["livrare", "livrare", "delivery", "livraison", "consegna", "Lieferung", "szállítás"], ["livrării", "livrării", "delivery", "livraison", "consegna", "Lieferung", "szállítás"], ["transport", "transport", "transport", "transport", "trasporto", "Transport", "szállítás"], ["transporturi", "transporturi", "transports", "transports", "trasporti", "Transporte", "szállítások"], ["săptămână", "săptămână", "week", "semaine", "settimana", "Woche", "hét"], ["săptămâni", "săptămâni", "weeks", "semaines", "settimane", "Wochen", "hetek"], ["săptămânale", "săptămânale", "weekly", "hebdomadaires", "settimanali", "wöchentlich", "heti"], ["matriță", "matriță", "die", "matrice", "matrice", "Matrize", "szerszám"], ["matrițe", "matrițe", "dies", "matrices", "matrici", "Matrizen", "szerszámok"], ["înălțime", "înălțime", "height", "hauteur", "altezza", "Höhe", "magasság"], ["înălțimea", "înălțimea", "height", "hauteur", "altezza", "Höhe", "magasság"], ["superioară", "superioară", "upper", "supérieure", "superiore", "obere", "felső"], ["inferioară", "inferioară", "lower", "inférieure", "inferiore", "untere", "alsó"], ["minimă", "minimă", "minimum", "minimale", "minima", "minimal", "minimum"], ["maximă", "maximă", "maximum", "maximale", "massima", "maximal", "maximum"], ["limită", "limită", "limit", "limite", "limite", "Grenze", "határ"], ["regrăvare", "regrăvare", "re-engraving", "regravure", "reincisione", "Nachgravur", "újravésés"], ["otel", "oțel", "steel", "acier", "acciaio", "Stahl", "acél"], ["oțel", "oțel", "steel", "acier", "acciaio", "Stahl", "acél"], ["sarjă", "sarjă", "batch", "coulée", "colata", "Charge", "adag"], ["diametru", "diametru", "diameter", "diamètre", "diametro", "Durchmesser", "átmérő"], ["calitate", "calitate", "quality", "qualité", "qualità", "Qualität", "minőség"], ["furnizor", "furnizor", "supplier", "fournisseur", "fornitore", "Lieferant", "beszállító"], ["pretest", "pretest", "pretest", "prétest", "pretest", "Pretest", "pretest"], ["forjate", "forjate", "forged", "forgées", "forgiati", "geschmiedet", "kovácsolt"], ["forjat", "forjat", "forged", "forgé", "forgiato", "geschmiedet", "kovácsolt"], ["debitat", "debitat", "cut", "débité", "tagliato", "geschnitten", "vágott"], ["debitate", "debitate", "cut", "débitées", "tagliate", "geschnitten", "vágott"], ["debitare", "debitare", "cutting", "débitage", "taglio", "Schnitt", "vágás"], ["ambalare", "ambalare", "packing", "emballage", "imballaggio", "Verpackung", "csomagolás"], ["ambalat", "ambalat", "packed", "emballé", "imballato", "verpackt", "csomagolt"], ["tratate", "tratate", "treated", "traitées", "trattate", "behandelt", "kezelt"], ["încălzire", "încălzire", "heating", "chauffage", "riscaldamento", "Erwärmung", "melegítés"], ["mentenanță", "mentenanță", "maintenance", "maintenance", "manutenzione", "Wartung", "karbantartás"], ["probleme", "probleme", "problems", "problèmes", "problemi", "Probleme", "problémák"], ["problemă", "problemă", "problem", "problème", "problema", "Problem", "probléma"], ["îmbunătățiri", "îmbunătățiri", "improvements", "améliorations", "miglioramenti", "Verbesserungen", "fejlesztések"], ["investiții", "investiții", "investments", "investissements", "investimenti", "Investitionen", "beruházások"], ["prioritate", "prioritate", "priority", "priorité", "priorità", "Priorität", "prioritás"], ["stadiu", "stadiu", "stage", "stade", "fase", "Status", "állapot"], ["întârziate", "întârziate", "late", "en retard", "in ritardo", "verspätet", "késésben"], ["active", "active", "active", "actives", "attive", "aktiv", "aktív"], ["activă", "activă", "active", "active", "attiva", "aktiv", "aktív"], ["document", "document", "document", "document", "documento", "Dokument", "dokumentum"], ["documentul", "documentul", "document", "document", "documento", "Dokument", "dokumentum"], ["fișier", "fișier", "file", "fichier", "file", "Datei", "fájl"], ["fișiere", "fișiere", "files", "fichiers", "file", "Dateien", "fájlok"], ["fișă", "fișă", "sheet", "fiche", "scheda", "Blatt", "lap"], ["fișe", "fișe", "sheets", "fiches", "schede", "Blätter", "lapok"], ["pdf", "pdf", "PDF", "PDF", "PDF", "PDF", "PDF"], ["excel", "excel", "Excel", "Excel", "Excel", "Excel", "Excel"], ["eroare", "eroare", "error", "erreur", "errore", "Fehler", "hiba"], ["aștept", "aștept", "waiting", "attente", "attesa", "warte", "várok"], ["așteptare", "așteptare", "waiting", "attente", "attesa", "Warten", "várakozás"], ["încărcare", "încărcare", "loading", "chargement", "caricamento", "Laden", "betöltés"], ["încărcat", "încărcat", "loaded", "chargé", "caricato", "geladen", "betöltve"], ["încărcate", "încărcate", "loaded", "chargées", "caricate", "geladen", "betöltve"], ["inițializare", "inițializare", "initialization", "initialisation", "inizializzazione", "Initialisierung", "inicializálás"], ["remaniabile", "remaniabile", "reworkable", "retouchables", "rilavorabili", "nacharbeitbar", "javítható"], ["neconforme", "neconforme", "nonconforming", "non conformes", "non conformi", "nichtkonform", "nem megfelelő"], ["conforme", "conforme", "conforming", "conformes", "conformi", "konform", "megfelelő"], ["rebut", "rebut", "scrap", "rebut", "scarto", "Ausschuss", "selejt"], ["defecte", "defecte", "defects", "défauts", "difetti", "Fehler", "hibák"], ["defect", "defect", "defect", "défaut", "difetto", "Fehler", "hiba"], ["cauză", "cauză", "cause", "cause", "causa", "Ursache", "ok"], ["română", "română", "Romanian", "Roumain", "Rumeno", "Rumänisch", "román"], ["engleză", "engleză", "English", "Anglais", "Inglese", "Englisch", "angol"], ["franceză", "franceză", "French", "Français", "Francese", "Französisch", "francia"], ["italiană", "italiană", "Italian", "Italien", "Italiano", "Italienisch", "olasz"], ["germană", "germană", "German", "Allemand", "Tedesco", "Deutsch", "német"], ["maghiară", "maghiară", "Hungarian", "Hongrois", "Ungherese", "Ungarisch", "magyar"]];
    extraTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();



  // Final coverage layer: untranslated Romanian UI texts + K.A.D brand lock.
  (function(){
    var finalExact = [
      ['KAD','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D'],
      ['K.A.D','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D'],
      ['Depozit de vechituri','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D','K.A.D'],
      ['Adaugă problemă raportată','Adaugă problemă raportată','Add reported problem','Ajouter problème signalé','Aggiungi problema segnalato','Gemeldetes Problem hinzufügen','Jelentett probléma hozzáadása'],
      ['Analiză probleme raportate','Analiză probleme raportate','Reported problems analysis','Analyse des problèmes signalés','Analisi problemi segnalati','Analyse gemeldeter Probleme','Jelentett problémák elemzése'],
      ['An analiză','An analiză','Analysis year','Année d’analyse','Anno analisi','Analysejahr','Elemzési év'],
      ['Denumire operațiune','Denumire operațiune','Operation name','Nom de l’opération','Nome operazione','Vorgangsbezeichnung','Művelet neve'],
      ['Cantitate totală','Cantitate totală','Total quantity','Quantité totale','Quantità totale','Gesamtmenge','Összes mennyiség'],
      ['Avertizare pe Sarjă (Stoc inițial + Intrări vs Debitate)','Avertizare pe Sarjă (Stoc inițial + Intrări vs Debitate)','Batch warning (Initial stock + Entries vs Cut parts)','Avertissement par coulée (Stock initial + Entrées vs Débités)','Avviso per colata (Stock iniziale + Entrate vs Tagliati)','Warnung nach Charge (Anfangsbestand + Eingänge vs Geschnitten)','Adag figyelmeztetés (Kezdő készlet + Bevételek vs Darabolt)'],
      ['Corelare Numeral KOD din Magnaflux cu Intrări Oțel.','Corelare Numeral KOD din Magnaflux cu Intrări Oțel.','Numeral KOD correlation from Magnaflux with Steel Entries.','Corrélation Numeral KOD de Magnaflux avec les entrées acier.','Correlazione Numeral KOD da Magnaflux con Entrate acciaio.','Numeral-KOD-Abgleich aus Magnaflux mit Stahleingängen.','Numeral KOD összekapcsolás Magnafluxból az acél bevételekkel.'],
      ['ALTĂ PROBLEMĂ','ALTĂ PROBLEMĂ','OTHER PROBLEM','AUTRE PROBLÈME','ALTRO PROBLEMA','ANDERES PROBLEM','MÁS PROBLÉMA'],
      ['Dublu click pe rând pentru editare. Importul adaugă doar rândurile noi și ignoră dublurile identice.','Dublu click pe rând pentru editare. Importul adaugă doar rândurile noi și ignoră dublurile identice.','Double-click a row to edit. Import adds only new rows and ignores identical duplicates.','Double-cliquez sur une ligne pour modifier. L’import ajoute seulement les nouvelles lignes et ignore les doublons identiques.','Doppio clic sulla riga per modificare. L’import aggiunge solo le righe nuove e ignora i duplicati identici.','Doppelklick auf eine Zeile zum Bearbeiten. Der Import fügt nur neue Zeilen hinzu und ignoriert identische Duplikate.','Dupla kattintás a soron a szerkesztéshez. Az import csak az új sorokat adja hozzá, és figyelmen kívül hagyja az azonos duplikátumokat.'],
      ['Aici gestionezi comenzile de oțel. În MRC intră automat doar cantitatea rămasă din fiecare comandă:','Aici gestionezi comenzile de oțel. În MRC intră automat doar cantitatea rămasă din fiecare comandă:','Here you manage steel orders. Only the remaining quantity from each order automatically enters MRC:','Ici vous gérez les commandes d’acier. Seule la quantité restante de chaque commande entre automatiquement dans MRC :','Qui gestisci gli ordini di acciaio. In MRC entra automaticamente solo la quantità rimanente di ogni ordine:','Hier verwalten Sie Stahlbestellungen. In MRC fließt automatisch nur die Restmenge jeder Bestellung ein:','Itt kezeled az acél rendeléseket. Az MRC-be automatikusan csak az egyes rendelések fennmaradó mennyisége kerül:'],
      ['Aici setezi minimele și limita de piese până la regrăvare. Pragul de avertizare este procentul la care matrița trebuie planificată.','Aici setezi minimele și limita de piese până la regrăvare. Pragul de avertizare este procentul la care matrița trebuie planificată.','Here you set the minimums and the part limit until re-engraving. The warning threshold is the percentage at which the die must be planned.','Ici vous définissez les minimums et la limite de pièces jusqu’à la regravure. Le seuil d’avertissement est le pourcentage auquel la matrice doit être planifiée.','Qui imposti i minimi e il limite pezzi fino alla reincisione. La soglia di avviso è la percentuale alla quale la matrice deve essere pianificata.','Hier legen Sie Mindestwerte und Teilegrenze bis zur Nachgravur fest. Die Warnschwelle ist der Prozentsatz, bei dem die Matrize geplant werden muss.','Itt állítod be a minimumokat és az újravésésig engedett darabszámot. A figyelmeztetési küszöb az a százalék, ahol a szerszámot tervezni kell.'],
      ['Aici introduci stocul fizic debitat, în structură exactă ca în Excel, păstrând aceleași reguli de lucru ca la STOC INIȚIAL OȚEL.','Aici introduci stocul fizic debitat, în structură exactă ca în Excel, păstrând aceleași reguli de lucru ca la STOC INIȚIAL OȚEL.','Here you enter the physical cut stock, in the exact Excel structure, keeping the same working rules as INITIAL STEEL STOCK.','Ici vous saisissez le stock physique débité, dans la structure exacte d’Excel, en conservant les mêmes règles de travail que pour le STOCK INITIAL ACIER.','Qui inserisci lo stock fisico tagliato, nella struttura esatta di Excel, mantenendo le stesse regole di lavoro dello STOCK INIZIALE ACCIAIO.','Hier erfassen Sie den physischen Schnittbestand in der exakten Excel-Struktur und mit denselben Arbeitsregeln wie beim ANFANGSBESTAND STAHL.','Itt adod meg a fizikai darabolt készletet, pontos Excel-szerkezetben, ugyanazokkal a munkaszabályokkal, mint a KEZDŐ ACÉLKÉSZLETNÉL.'],
      ['Aici introduci stocul fizic pentru piesele forjate, cu aceleași reguli de lucru ca la STOC INIȚIAL OȚEL: grupare pe ani, deschidere pe ultimul rând și import/export Excel.','Aici introduci stocul fizic pentru piesele forjate, cu aceleași reguli de lucru ca la STOC INIȚIAL OȚEL: grupare pe ani, deschidere pe ultimul rând și import/export Excel.','Here you enter the physical stock for forged parts, with the same working rules as INITIAL STEEL STOCK: grouping by years, opening on the last row and Excel import/export.','Ici vous saisissez le stock physique des pièces forgées, avec les mêmes règles que le STOCK INITIAL ACIER : regroupement par années, ouverture sur la dernière ligne et import/export Excel.','Qui inserisci lo stock fisico dei pezzi forgiati, con le stesse regole dello STOCK INIZIALE ACCIAIO: raggruppamento per anni, apertura sull’ultima riga e import/export Excel.','Hier erfassen Sie den physischen Bestand der Schmiedeteile mit denselben Regeln wie beim ANFANGSBESTAND STAHL: Gruppierung nach Jahren, Öffnen in der letzten Zeile und Excel-Import/Export.','Itt adod meg a kovácsolt alkatrészek fizikai készletét, ugyanazokkal a szabályokkal, mint a KEZDŐ ACÉLKÉSZLETNÉL: évek szerinti csoportosítás, utolsó sorra nyitás és Excel import/export.'],
      ['Aici apar doar reperele din comenzile importate care nu au încă mapare completă în Helper Data. Nu intră în calculul principal până nu au reper intern, material, diametru și kg/buc.','Aici apar doar reperele din comenzile importate care nu au încă mapare completă în Helper Data. Nu intră în calculul principal până nu au reper intern, material, diametru și kg/buc.','Only parts from imported orders that do not yet have complete mapping in Helper Data appear here. They do not enter the main calculation until they have internal part, material, diameter and kg/pc.','Seules les références des commandes importées qui n’ont pas encore de mappage complet dans Helper Data apparaissent ici. Elles n’entrent pas dans le calcul principal tant qu’elles n’ont pas référence interne, matière, diamètre et kg/pièce.','Qui appaiono solo i codici pezzo degli ordini importati che non hanno ancora una mappatura completa in Helper Data. Non entrano nel calcolo principale finché non hanno codice interno, materiale, diametro e kg/pz.','Hier erscheinen nur Teile aus importierten Bestellungen, die noch keine vollständige Zuordnung in Helper Data haben. Sie gehen erst in die Hauptberechnung ein, wenn internes Teil, Material, Durchmesser und kg/Stk. vorhanden sind.','Itt csak azok az importált rendelésekből származó cikkszámok jelennek meg, amelyeknek még nincs teljes párosítása a Helper Data-ban. Nem kerülnek a fő számításba, amíg nincs belső cikkszám, anyag, átmérő és kg/db.'],
      ['Atenție: Browserul a blocat salvarea automată (localStorage) pentru fișiere locale. Datele NU vor rămâne după închidere.','Atenție: Browserul a blocat salvarea automată (localStorage) pentru fișiere locale. Datele NU vor rămâne după închidere.','Warning: The browser blocked automatic saving (localStorage) for local files. Data will NOT remain after closing.','Attention : le navigateur a bloqué l’enregistrement automatique (localStorage) pour les fichiers locaux. Les données NE resteront PAS après la fermeture.','Attenzione: il browser ha bloccato il salvataggio automatico (localStorage) per i file locali. I dati NON resteranno dopo la chiusura.','Warnung: Der Browser hat das automatische Speichern (localStorage) für lokale Dateien blockiert. Die Daten bleiben nach dem Schließen NICHT erhalten.','Figyelem: a böngésző blokkolta az automatikus mentést (localStorage) helyi fájloknál. Az adatok bezárás után NEM maradnak meg.'],
      ['Contul curent este doar pentru vizualizare. Poți deschide și exporta documentele, dar nu poți încărca, înlocui sau șterge fișiere.','Contul curent este doar pentru vizualizare. Poți deschide și exporta documentele, dar nu poți încărca, înlocui sau șterge fișiere.','The current account is view-only. You can open and export documents, but you cannot upload, replace or delete files.','Le compte actuel est en lecture seule. Vous pouvez ouvrir et exporter les documents, mais vous ne pouvez pas charger, remplacer ou supprimer des fichiers.','L’account corrente è solo in visualizzazione. Puoi aprire ed esportare i documenti, ma non puoi caricare, sostituire o eliminare file.','Das aktuelle Konto ist nur zur Ansicht. Sie können Dokumente öffnen und exportieren, aber keine Dateien hochladen, ersetzen oder löschen.','A jelenlegi fiók csak megtekintésre jogosult. Megnyithatod és exportálhatod a dokumentumokat, de nem tölthetsz fel, cserélhetsz vagy törölhetsz fájlokat.'],
      ['Contul curent este doar pentru vizualizare. Poți deschide și exporta fișele PDF, dar nu poți încărca, înlocui sau șterge fișiere.','Contul curent este doar pentru vizualizare. Poți deschide și exporta fișele PDF, dar nu poți încărca, înlocui sau șterge fișiere.','The current account is view-only. You can open and export PDF sheets, but you cannot upload, replace or delete files.','Le compte actuel est en lecture seule. Vous pouvez ouvrir et exporter les fiches PDF, mais vous ne pouvez pas charger, remplacer ou supprimer des fichiers.','L’account corrente è solo in visualizzazione. Puoi aprire ed esportare le schede PDF, ma non puoi caricare, sostituire o eliminare file.','Das aktuelle Konto ist nur zur Ansicht. Sie können PDF-Blätter öffnen und exportieren, aber keine Dateien hochladen, ersetzen oder löschen.','A jelenlegi fiók csak megtekintésre jogosult. Megnyithatod és exportálhatod a PDF lapokat, de nem tölthetsz fel, cserélhetsz vagy törölhetsz fájlokat.'],
      ['Adaugă PDF sau Excel. Toate rândurile cu aceeași sarjă, același diametru și aceeași calitate vor primi automat „Are pretest”.','Adaugă PDF sau Excel. Toate rândurile cu aceeași sarjă, același diametru și aceeași calitate vor primi automat „Are pretest”.','Add PDF or Excel. All rows with the same batch, same diameter and same grade will automatically receive “Has pretest”.','Ajoutez PDF ou Excel. Toutes les lignes avec la même coulée, le même diamètre et la même qualité recevront automatiquement « A un prétest ».','Aggiungi PDF o Excel. Tutte le righe con la stessa colata, lo stesso diametro e la stessa qualità riceveranno automaticamente “Ha pretest”.','PDF oder Excel hinzufügen. Alle Zeilen mit derselben Charge, demselben Durchmesser und derselben Qualität erhalten automatisch „Hat Pretest“.','PDF vagy Excel hozzáadása. Az azonos adaggal, átmérővel és minőséggel rendelkező sorok automatikusan „Van pretest” jelölést kapnak.']
    ];
    finalExact.forEach(function(r){ addExact.apply(null, r); });

    var finalTerms = [
      ['aici','aici','here','ici','qui','hier','itt'],
      ['gestionezi','gestionezi','manage','gérez','gestisci','verwalten','kezeled'],
      ['introduci','introduci','enter','saisissez','inserisci','eingeben','beírod'],
      ['setări','setări','settings','paramètres','impostazioni','Einstellungen','beállítások'],
      ['setezi','setezi','set','définissez','imposti','festlegen','beállítod'],
      ['intră','intră','enters','entre','entra','geht ein','belép'],
      ['primi','primi','receive','recevoir','ricevere','erhalten','kap'],
      ['primește','primește','receives','reçoit','riceve','erhält','kap'],
      ['raportată','raportată','reported','signalée','segnalata','gemeldet','jelentett'],
      ['raportate','raportate','reported','signalées','segnalate','gemeldet','jelentett'],
      ['analiză','analiză','analysis','analyse','analisi','Analyse','elemzés'],
      ['operațiune','operațiune','operation','opération','operazione','Vorgang','művelet'],
      ['denumire','denumire','name','nom','nome','Bezeichnung','megnevezés'],
      ['totală','totală','total','totale','totale','gesamt','összes'],
      ['inițial','inițial','initial','initial','iniziale','anfänglich','kezdeti'],
      ['inițială','inițială','initial','initiale','iniziale','anfänglich','kezdeti'],
      ['dublu','dublu','double','double','doppio','Doppel','dupla'],
      ['click','click','click','clic','clic','Klick','kattintás'],
      ['ignoră','ignoră','ignores','ignore','ignora','ignoriert','figyelmen kívül hagyja'],
      ['dublurile','dublurile','duplicates','doublons','duplicati','Duplikate','duplikátumok'],
      ['identice','identice','identical','identiques','identici','identisch','azonos'],
      ['aceea','aceea','that','cela','quello','das','az'],
      ['după aceea','după aceea','after that','après cela','dopo di ciò','danach','ezután'],
      ['despica','despica','split','diviser','dividere','aufteilen','szétosztani'],
      ['câte','câte','each','chacun','ciascuno','jeweils','egyenként'],
      ['lada','lada','box','caisse','cassa','Kiste','láda'],
      ['aceeași','aceeași','same','même','stessa','gleiche','ugyanaz'],
      ['același','același','same','même','stesso','gleiche','ugyanaz'],
      ['corespunzător','corespunzător','corresponding','correspondant','corrispondente','entsprechend','megfelelő'],
      ['completează','completează','fills','remplit','compila','füllt','kitölti'],
      ['completă','completă','complete','complète','completa','vollständig','teljes'],
      ['până nu','până nu','until','tant que','finché','bis','amíg'],
      ['fizic','fizic','physical','physique','fisico','physisch','fizikai'],
      ['fizică','fizică','physical','physique','fisica','physisch','fizikai'],
      ['grupare','grupare','grouping','regroupement','raggruppamento','Gruppierung','csoportosítás'],
      ['deschidere','deschidere','opening','ouverture','apertura','Öffnen','megnyitás'],
      ['ultimul','ultimul','last','dernier','ultimo','letzte','utolsó'],
      ['ultim','ultim','last','dernier','ultimo','letzte','utolsó'],
      ['jos','jos','bottom','bas','basso','unten','lent'],
      ['înlocui','înlocui','replace','remplacer','sostituire','ersetzen','cserélni'],
      ['încărca','încărca','upload','charger','caricare','hochladen','feltölteni'],
      ['documentele','documentele','documents','documents','documenti','Dokumente','dokumentumok'],
      ['fișele','fișele','sheets','fiches','schede','Blätter','lapok'],
      ['browserul','browserul','browser','navigateur','browser','Browser','böngésző'],
      ['salvarea automată','salvarea automată','automatic saving','enregistrement automatique','salvataggio automatico','automatisches Speichern','automatikus mentés'],
      ['fișiere locale','fișiere locale','local files','fichiers locaux','file locali','lokale Dateien','helyi fájlok'],
      ['închidere','închidere','closing','fermeture','chiusura','Schließen','bezárás'],
      ['localstorage','localStorage','localStorage','localStorage','localStorage','localStorage','localStorage']
    ];
    finalTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();


  // Timesheet / pontaj coverage: departments, day abbreviations and totals.
  (function(){
    var pontajExact = [
      ['DEBITARI','DEBITARI','CUTTING','DÉBITAGE','TAGLIO','ZUSCHNITT','DARABOLÁS'],
      ['Debitari','Debitari','Cutting','Débitage','Taglio','Zuschnitt','Darabolás'],
      ['debitari','debitari','cutting','débitage','taglio','Zuschnitt','darabolás'],
      ['DEBITARE','DEBITARE','CUTTING','DÉBITAGE','TAGLIO','ZUSCHNITT','DARABOLÁS'],
      ['Debitare','Debitare','Cutting','Débitage','Taglio','Zuschnitt','Darabolás'],
      ['SCULARIE','SCULĂRIE','TOOLROOM','OUTILLAGE','ATTREZZERIA','WERKZEUGBAU','SZERSZÁMMŰHELY'],
      ['Sculărie','Sculărie','Toolroom','Outillage','Attrezzeria','Werkzeugbau','Szerszámműhely'],
      ['Scularie','Sculărie','Toolroom','Outillage','Attrezzeria','Werkzeugbau','Szerszámműhely'],
      ['CTC','CTC','QC','CQ','CQ','QS','MEO'],
      ['CONTROL CALITATE','CONTROL CALITATE','QUALITY CONTROL','CONTRÔLE QUALITÉ','CONTROLLO QUALITÀ','QUALITÄTSKONTROLLE','MINŐSÉGELLENŐRZÉS'],
      ['CONTROL TEHNIC DE CALITATE','CONTROL TEHNIC DE CALITATE','TECHNICAL QUALITY CONTROL','CONTRÔLE TECHNIQUE QUALITÉ','CONTROLLO TECNICO QUALITÀ','TECHNISCHE QUALITÄTSKONTROLLE','MŰSZAKI MINŐSÉGELLENŐRZÉS'],
      ['MENTENANTA','MENTENANȚĂ','MAINTENANCE','MAINTENANCE','MANUTENZIONE','WARTUNG','KARBANTARTÁS'],
      ['Mentenanta','Mentenanță','Maintenance','Maintenance','Manutenzione','Wartung','Karbantartás'],
      ['AMBALARE','AMBALARE','PACKING','EMBALLAGE','IMBALLAGGIO','VERPACKUNG','CSOMAGOLÁS'],
      ['MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX','MAGNAFLUX'],
      ['Operators','Operatori','Operators','Opérateurs','Operatori','Bediener','Operátorok'],
      ['Operatori','Operatori','Operators','Opérateurs','Operatori','Bediener','Operátorok'],
      ['OPERATORS','OPERATORI','OPERATORS','OPÉRATEURS','OPERATORI','BEDIENER','OPERÁTOROK'],
      ['Sch','Schimb','Shift','Équipe','Turno','Schicht','Műszak'],
      ['SCH','SCHIMB','SHIFT','ÉQUIPE','TURNO','SCHICHT','MŰSZAK'],
      ['Sch.','Sch.','Shift','Équipe','Turno','Schicht','Műszak'],
      ['Total ore lucrate','Total ore lucrate','Total hours worked','Total heures travaillées','Totale ore lavorate','Geleistete Stunden gesamt','Összes ledolgozott óra'],
      ['TOTAL ORE LUCRATE','TOTAL ORE LUCRATE','TOTAL HOURS WORKED','TOTAL HEURES TRAVAILLÉES','TOTALE ORE LAVORATE','GELEISTETE STUNDEN GESAMT','ÖSSZES LEDOLGOZOTT ÓRA'],
      ['Ore suplimentare','Ore suplimentare','Overtime hours','Heures supplémentaires','Ore straordinarie','Überstunden','Túlórák'],
      ['ORE SUPLIMENTARE','ORE SUPLIMENTARE','OVERTIME HOURS','HEURES SUPPLÉMENTAIRES','ORE STRAORDINARIE','ÜBERSTUNDEN','TÚLÓRÁK'],
      ['Total ore suplimentare','Total ore suplimentare','Total overtime hours','Total heures supplémentaires','Totale ore straordinarie','Überstunden gesamt','Összes túlóra'],
      ['TOTAL ORE SUPLIMENTARE','TOTAL ORE SUPLIMENTARE','TOTAL OVERTIME HOURS','TOTAL HEURES SUPPLÉMENTAIRES','TOTALE ORE STRAORDINARIE','ÜBERSTUNDEN GESAMT','ÖSSZES TÚLÓRA'],
      ['Total ore schimb 1','Total ore schimb 1','Total shift 1 hours','Total heures équipe 1','Totale ore turno 1','Stunden Schicht 1 gesamt','1. műszak összes óra'],
      ['Total ore schimb 2','Total ore schimb 2','Total shift 2 hours','Total heures équipe 2','Totale ore turno 2','Stunden Schicht 2 gesamt','2. műszak összes óra'],
      ['Total ore schimb 3','Total ore schimb 3','Total shift 3 hours','Total heures équipe 3','Totale ore turno 3','Stunden Schicht 3 gesamt','3. műszak összes óra'],
      ['Total ore sch. 1','Total ore sch. 1','Total shift 1 hours','Total heures équipe 1','Totale ore turno 1','Stunden Schicht 1 gesamt','1. műszak összes óra'],
      ['Total ore sch. 2','Total ore sch. 2','Total shift 2 hours','Total heures équipe 2','Totale ore turno 2','Stunden Schicht 2 gesamt','2. műszak összes óra'],
      ['Total ore sch. 3','Total ore sch. 3','Total shift 3 hours','Total heures équipe 3','Totale ore turno 3','Stunden Schicht 3 gesamt','3. műszak összes óra'],
      ['luni','luni','Monday','lundi','lunedì','Montag','hétfő'],
      ['marți','marți','Tuesday','mardi','martedì','Dienstag','kedd'],
      ['miercuri','miercuri','Wednesday','mercredi','mercoledì','Mittwoch','szerda'],
      ['joi','joi','Thursday','jeudi','giovedì','Donnerstag','csütörtök'],
      ['vineri','vineri','Friday','vendredi','venerdì','Freitag','péntek'],
      ['sâmbătă','sâmbătă','Saturday','samedi','sabato','Samstag','szombat'],
      ['duminică','duminică','Sunday','dimanche','domenica','Sonntag','vasárnap'],
      ['lun','lun','Mon','lun','lun','Mo','hét'],
      ['mar','mar','Tue','mar','mar','Di','ked'],
      ['mie','mie','Wed','mer','mer','Mi','sze'],
      ['joi','joi','Thu','jeu','gio','Do','csü'],
      ['vin','vin','Fri','ven','ven','Fr','pén'],
      ['sâm','sâm','Sat','sam','sab','Sa','szo'],
      ['sam','sâm','Sat','sam','sab','Sa','szo'],
      ['dum','dum','Sun','dim','dom','So','vas'],
      ['thu','joi','Thu','jeu','gio','Do','csü'],
      ['thurs','joi','Thu','jeu','gio','Do','csü'],
      ['thur','joi','Thu','jeu','gio','Do','csü'],
      ['mon','lun','Mon','lun','lun','Mo','hét'],
      ['tue','mar','Tue','mar','mar','Di','ked'],
      ['wed','mie','Wed','mer','mer','Mi','sze'],
      ['fri','vin','Fri','ven','ven','Fr','pén'],
      ['sat','sâm','Sat','sam','sab','Sa','szo'],
      ['sun','dum','Sun','dim','dom','So','vas'],
      ['Total CO','Total CO','Total CO','Total CO','Totale CO','CO gesamt','Összes CO'],
      ['Total CM','Total CM','Total CM','Total CM','Totale CM','CM gesamt','Összes CM'],
      ['Total CFS','Total CFS','Total CFS','Total CFS','Totale CFS','CFS gesamt','Összes CFS'],
      ['Total AN','Total AN','Total AN','Total AN','Totale AN','AN gesamt','Összes AN'],
      ['Total LP','Total LP','Total LP','Total LP','Totale LP','LP gesamt','Összes LP']
    ];
    pontajExact.forEach(function(r){ addExact.apply(null, r); });
    var pontajTerms = [
      ['debitari','debitari','cutting','débitage','taglio','Zuschnitt','darabolás'],
      ['scularie','sculărie','toolroom','outillage','attrezzeria','Werkzeugbau','szerszámműhely'],
      ['operatori','operatori','operators','opérateurs','operatori','Bediener','operátorok'],
      ['operators','operatori','operators','opérateurs','operatori','Bediener','operátorok'],
      ['schimb','schimb','shift','équipe','turno','Schicht','műszak'],
      ['ore lucrate','ore lucrate','hours worked','heures travaillées','ore lavorate','geleistete Stunden','ledolgozott órák'],
      ['ore suplimentare','ore suplimentare','overtime hours','heures supplémentaires','ore straordinarie','Überstunden','túlórák']
    ];
    pontajTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();


  // Planificare Forja tooltip / stock-check coverage.
  // Strict translation-only additions. Product codes, machine codes and numeric values stay unchanged.
  (function(){
    var planExact = [
      ['Date to','Dată până la','Date to','Date jusqu’à','Data fino a','Datum bis','Dátumig'],
      ['CHECKING STOCK','VERIFICARE STOC','CHECKING STOCK','VÉRIFICATION STOCK','CONTROLLO STOCK','BESTANDSPRÜFUNG','KÉSZLET ELLENŐRZÉS'],
      ['Checking Stock','Verificare stoc','Checking stock','Vérification stock','Controllo stock','Bestandsprüfung','Készlet ellenőrzés'],
      ['Verificare stoc','Verificare stoc','Checking stock','Vérification stock','Controllo stock','Bestandsprüfung','Készlet ellenőrzés'],
      ['IDENTIFICARE','IDENTIFICARE','IDENTIFICATION','IDENTIFICATION','IDENTIFICAZIONE','IDENTIFIKATION','AZONOSÍTÁS'],
      ['Identificare','Identificare','Identification','Identification','Identificazione','Identifikation','Azonosítás'],
      ['Part Forged','Reper forjat','Forged part','Référence forgée','Codice pezzo forgiato','Geschmiedetes Teil','Kovácsolt cikkszám'],
      ['Part forged','Reper forjat','Forged part','Référence forgée','Codice pezzo forgiato','Geschmiedetes Teil','Kovácsolt cikkszám'],
      ['Reper forjat','Reper forjat','Forged part','Référence forgée','Codice pezzo forgiato','Geschmiedetes Teil','Kovácsolt cikkszám'],
      ['Part cut','Reper debitat','Cut part','Référence débitée','Codice pezzo tagliato','Geschnittenes Teil','Darabolt cikkszám'],
      ['Reper debitat','Reper debitat','Cut part','Référence débitée','Codice pezzo tagliato','Geschnittenes Teil','Darabolt cikkszám'],
      ['Specification','Specificație','Specification','Spécification','Specifica','Spezifikation','Specifikáció'],
      ['Specificație','Specificație','Specification','Spécification','Specifica','Spezifikation','Specifikáció'],
      ['Specificație material','Specificație material','Material specification','Spécification matière','Specifica materiale','Materialspezifikation','Anyag specifikáció'],
      ['Mod','Mod','Mode','Mode','Modalità','Modus','Mód'],
      ['Simulare with missing material calculation','Simulare cu calcul material lipsă','Simulation with missing material calculation','Simulation avec calcul de matière manquante','Simulazione con calcolo materiale mancante','Simulation mit Berechnung fehlenden Materials','Szimuláció hiányzó anyag számításával'],
      ['Simulare cu calcul material lipsă','Simulare cu calcul material lipsă','Simulation with missing material calculation','Simulation avec calcul de matière manquante','Simulazione con calcolo materiale mancante','Simulation mit Berechnung fehlenden Materials','Szimuláció hiányzó anyag számításával'],
      ['Source Quantity','Cantitate sursă','Source quantity','Quantité source','Quantità sorgente','Quellmenge','Forrás mennyiség'],
      ['Cantitate sursă','Cantitate sursă','Source quantity','Quantité source','Quantità sorgente','Quellmenge','Forrás mennyiség'],
      ['Quantity used','Cantitate folosită','Quantity used','Quantité utilisée','Quantità usata','Verwendete Menge','Felhasznált mennyiség'],
      ['Cantitate folosită','Cantitate folosită','Quantity used','Quantité utilisée','Quantità usata','Verwendete Menge','Felhasznált mennyiség'],
      ['STOCK INAINTE','STOC ÎNAINTE','STOCK BEFORE','STOCK AVANT','STOCK PRIMA','BESTAND VORHER','KÉSZLET ELŐTTE'],
      ['STOC INAINTE','STOC ÎNAINTE','STOCK BEFORE','STOCK AVANT','STOCK PRIMA','BESTAND VORHER','KÉSZLET ELŐTTE'],
      ['STOC ÎNAINTE','STOC ÎNAINTE','STOCK BEFORE','STOCK AVANT','STOCK PRIMA','BESTAND VORHER','KÉSZLET ELŐTTE'],
      ['Stock înainte','Stoc înainte','Stock before','Stock avant','Stock prima','Bestand vorher','Készlet előtte'],
      ['Cut disponibil','Debitat disponibil','Cut available','Débit disponible','Tagliato disponibile','Schnittbestand verfügbar','Darabolt elérhető'],
      ['Debitat disponibil','Debitat disponibil','Cut available','Débit disponible','Tagliato disponibile','Schnittbestand verfügbar','Darabolt elérhető'],
      ['Steel disponibil','Oțel disponibil','Steel available','Acier disponible','Acciaio disponibile','Stahl verfügbar','Elérhető acél'],
      ['Oțel disponibil','Oțel disponibil','Steel available','Acier disponible','Acciaio disponibile','Stahl verfügbar','Elérhető acél'],
      ['Echivalent part','Echivalent reper','Equivalent part','Référence équivalente','Codice pezzo equivalente','Äquivalentes Teil','Egyenértékű cikkszám'],
      ['Echivalent reper','Echivalent reper','Equivalent part','Référence équivalente','Codice pezzo equivalente','Äquivalentes Teil','Egyenértékű cikkszám'],
      ['NECESAR ANA ACOPERIRE','NECESAR ÎN ACOPERIRE','REQUIRED FOR COVERAGE','NÉCESSAIRE POUR COUVERTURE','NECESSARIO PER COPERTURA','ERFORDERLICH FÜR ABDECKUNG','SZÜKSÉGES FEDEZETHEZ'],
      ['NECESAR IN ACOPERIRE','NECESAR ÎN ACOPERIRE','REQUIRED FOR COVERAGE','NÉCESSAIRE POUR COUVERTURE','NECESSARIO PER COPERTURA','ERFORDERLICH FÜR ABDECKUNG','SZÜKSÉGES FEDEZETHEZ'],
      ['NECESAR ÎN ACOPERIRE','NECESAR ÎN ACOPERIRE','REQUIRED FOR COVERAGE','NÉCESSAIRE POUR COUVERTURE','NECESSARIO PER COPERTURA','ERFORDERLICH FÜR ABDECKUNG','SZÜKSÉGES FEDEZETHEZ'],
      ['NECESAR DIN ACOPERIRE','NECESAR DIN ACOPERIRE','REQUIRED FROM COVERAGE','NÉCESSAIRE DE LA COUVERTURE','NECESSARIO DALLA COPERTURA','ERFORDERLICH AUS ABDECKUNG','SZÜKSÉGES A FEDEZETBŐL'],
      ['NECESAR ACOPERIRE','NECESAR ACOPERIRE','COVERAGE REQUIREMENT','BESOIN DE COUVERTURE','FABBISOGNO COPERTURA','ABDECKUNGSBEDARF','FEDEZETI IGÉNY'],
      ['Realizat','Realizat','Produced','Réalisé','Realizzato','Produziert','Gyártott'],
      ['REALIZAT','REALIZAT','PRODUCED','RÉALISÉ','REALIZZATO','PRODUZIERT','GYÁRTOTT'],
      ['Necesar from Steel','Necesar din oțel','Required from steel','Nécessaire depuis acier','Necessario da acciaio','Erforderlich aus Stahl','Szükséges acélból'],
      ['Necesar din oțel','Necesar din oțel','Required from steel','Nécessaire depuis acier','Necessario da acciaio','Erforderlich aus Stahl','Szükséges acélból'],
      ['Deficit cut','Deficit debitat','Cut shortage','Déficit débit','Deficit tagliato','Schnittdefizit','Darabolt hiány'],
      ['Deficit debitat','Deficit debitat','Cut shortage','Déficit débit','Deficit tagliato','Schnittdefizit','Darabolt hiány'],
      ['Deficit Steel','Deficit oțel','Steel shortage','Déficit acier','Deficit acciaio','Stahldefizit','Acélhiány'],
      ['Deficit steel','Deficit oțel','Steel shortage','Déficit acier','Deficit acciaio','Stahldefizit','Acélhiány'],
      ['Deficit oțel','Deficit oțel','Steel shortage','Déficit acier','Deficit acciaio','Stahldefizit','Acélhiány'],
      ['Acoperire','Acoperire','Coverage','Couverture','Copertura','Abdeckung','Fedezet'],
      ['STOCK AFTER','STOC DUPĂ','STOCK AFTER','STOCK APRÈS','STOCK DOPO','BESTAND NACHHER','KÉSZLET UTÁNA'],
      ['STOC DUPĂ','STOC DUPĂ','STOCK AFTER','STOCK APRÈS','STOCK DOPO','BESTAND NACHHER','KÉSZLET UTÁNA'],
      ['Stock după','Stoc după','Stock after','Stock après','Stock dopo','Bestand nachher','Készlet utána'],
      ['Cut remaining','Debitat rămas','Cut remaining','Débit restant','Tagliato rimanente','Schnittbestand verbleibend','Maradó darabolt'],
      ['Debitat rămas','Debitat rămas','Cut remaining','Débit restant','Tagliato rimanente','Schnittbestand verbleibend','Maradó darabolt'],
      ['Steel remaining','Oțel rămas','Steel remaining','Acier restant','Acciaio rimanente','Stahl verbleibend','Maradó acél'],
      ['Oțel rămas','Oțel rămas','Steel remaining','Acier restant','Acciaio rimanente','Stahl verbleibend','Maradó acél'],
      ['Echivalent remaining','Echivalent rămas','Equivalent remaining','Équivalent restant','Equivalente rimanente','Äquivalent verbleibend','Maradó egyenérték'],
      ['Echivalent rămas','Echivalent rămas','Equivalent remaining','Équivalent restant','Equivalente rimanente','Äquivalent verbleibend','Maradó egyenérték'],
      ['NOTE','NOTĂ','NOTE','NOTE','NOTA','HINWEIS','MEGJEGYZÉS'],
      ['NOTĂ','NOTĂ','NOTE','NOTE','NOTA','HINWEIS','MEGJEGYZÉS'],
      ['Details','Detalii','Details','Détails','Dettagli','Details','Részletek'],
      ['Detalii','Detalii','Details','Détails','Dettagli','Details','Részletek'],
      ['Not exists realizări reale; simulează planul from VBA. Missing material','Nu există realizări reale; simulează planul din VBA. Material lipsă','No real produced quantities exist; simulates the VBA plan. Missing material','Aucune réalisation réelle; simule le plan VBA. Matière manquante','Non esistono realizzazioni reali; simula il piano VBA. Materiale mancante','Keine realen Ist-Mengen vorhanden; simuliert den VBA-Plan. Fehlendes Material','Nincs valós teljesítés; a VBA tervet szimulálja. Hiányzó anyag'],
      ['Not exists realizări reale; simulează planul from VBA.','Nu există realizări reale; simulează planul din VBA.','No real produced quantities exist; simulates the VBA plan.','Aucune réalisation réelle; simule le plan VBA.','Non esistono realizzazioni reali; simula il piano VBA.','Keine realen Ist-Mengen vorhanden; simuliert den VBA-Plan.','Nincs valós teljesítés; a VBA tervet szimulálja.'],
      ['Nu există realizări reale; simulează planul din VBA.','Nu există realizări reale; simulează planul din VBA.','No real produced quantities exist; simulates the VBA plan.','Aucune réalisation réelle; simule le plan VBA.','Non esistono realizzazioni reali; simula il piano VBA.','Keine realen Ist-Mengen vorhanden; simuliert den VBA-Plan.','Nincs valós teljesítés; a VBA tervet szimulálja.'],
      ['Missing material','Material lipsă','Missing material','Matière manquante','Materiale mancante','Fehlendes Material','Hiányzó anyag'],
      ['Material lipsă','Material lipsă','Missing material','Matière manquante','Materiale mancante','Fehlendes Material','Hiányzó anyag'],
      ['deficit cut','deficit debitat','cut shortage','déficit débit','deficit tagliato','Schnittdefizit','darabolt hiány'],
      ['deficit debitat','deficit debitat','cut shortage','déficit débit','deficit tagliato','Schnittdefizit','darabolt hiány'],
      ['pcs','buc','pcs','pcs','pz','Stk.','db'],
      ['Pcs','Buc','Pcs','Pcs','Pz','Stk.','Db'],
      ['PART','REPER','PART','RÉFÉRENCE','CODICE PEZZO','TEIL','CIKKSZÁM'],
      ['Part','Reper','Part','Référence','Codice pezzo','Teil','Cikkszám'],
      ['Planned','Planificat','Planned','Planifié','Pianificato','Geplant','Tervezett'],
      ['PLANIFICAT','PLANIFICAT','PLANNED','PLANIFIÉ','PIANIFICATO','GEPLANT','TERVEZETT']
    ];
    planExact.forEach(function(r){ addExact.apply(null, r); });

    var planTerms = [
      ['verificare stoc','verificare stoc','checking stock','vérification stock','controllo stock','Bestandsprüfung','készlet ellenőrzés'],
      ['stoc înainte','stoc înainte','stock before','stock avant','stock prima','Bestand vorher','készlet előtte'],
      ['stoc după','stoc după','stock after','stock après','stock dopo','Bestand nachher','készlet utána'],
      ['disponibil','disponibil','available','disponible','disponibile','verfügbar','elérhető'],
      ['rămas','rămas','remaining','restant','rimanente','verbleibend','maradó'],
      ['rămasă','rămasă','remaining','restante','rimanente','verbleibend','maradó'],
      ['lipsă','lipsă','missing','manquant','mancante','fehlend','hiányzó'],
      ['simulare','simulare','simulation','simulation','simulazione','Simulation','szimuláció'],
      ['calculation','calcul','calculation','calcul','calcolo','Berechnung','számítás'],
      ['calculație','calculație','calculation','calcul','calcolo','Berechnung','számítás']
    ];
    planTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();

  function escapeRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  function hasLower(s){ return /[a-zăâîșțéèêëàáâäçôöûüùúìíòóñáéíóúőű]/.test(String(s)); }
  function hasUpper(s){ return /[A-ZĂÂÎȘȚÉÈÊËÀÁÂÄÇÔÖÛÜÙÚÌÍÒÓÑÁÉÍÓÚŐŰ]/.test(String(s)); }
  function isAllUpper(s){
    s = String(s || '').replace(/[\d\s\-_/.,:;()\[\]{}+%#&–—]/g,'');
    return s && hasUpper(s) && !hasLower(s);
  }
  function matchCase(source, target){
    if(!source || !target) return target;
    if(isAllUpper(source)) return String(target).toUpperCase();
    if(source.charAt(0) === source.charAt(0).toUpperCase() && source.charAt(0) !== source.charAt(0).toLowerCase()){
      return String(target).charAt(0).toUpperCase() + String(target).slice(1);
    }
    return target;
  }

  function normalizeBrand(text){
    var s = String(text == null ? '' : text);
    s = s.replace(/\bDepozit\s+de\s+vechituri\b/gi, 'K.A.D');
    s = s.replace(/(^|[^A-Za-z0-9])K\s*\.?\s*A\s*\.?\s*D(?=$|[^A-Za-z0-9.-])/gi, function(full, prefix){
      return (prefix || '') + 'K.A.D';
    });
    return s;
  }

  function canonicalizeToRomanian(text){
    var t = String(text == null ? '' : text);
    var leading = (t.match(/^\s*/) || [''])[0];
    var trailing = (t.match(/\s*$/) || [''])[0];
    var core = t.trim().replace(/\s+/g,' ');
    var found = EXACT[key(core)];
    if(found && found.ro) return leading + found.ro + trailing;
    return t;
  }


  // Additional Romanian vocabulary for remaining static texts.
  (function(){
    var moreTerms = [["ladă", "ladă", "box", "caisse", "cassa", "Kiste", "láda"], ["ladă", "ladă", "box", "caisse", "cassa", "Kiste", "láda"], ["etichetă", "etichetă", "label", "étiquette", "etichetta", "Etikett", "címke"], ["fiecare", "fiecare", "each", "chaque", "ogni", "jede", "minden"], ["legătura", "legătura", "link", "lien", "collegamento", "Verknüpfung", "kapcsolat"], ["legătură", "legătură", "link", "lien", "collegamento", "Verknüpfung", "kapcsolat"], ["intern", "intern", "internal", "interne", "interno", "intern", "belső"], ["client", "client", "client", "client", "cliente", "Kunde", "ügyfél"], ["destinație", "destinație", "destination", "destination", "destinazione", "Ziel", "célállomás"], ["terminația", "terminația", "suffix", "suffixe", "suffisso", "Endung", "végződés"], ["terminație", "terminație", "suffix", "suffixe", "suffisso", "Endung", "végződés"], ["generează", "generează", "generates", "génère", "genera", "erzeugt", "generál"], ["afișează", "afișează", "displays", "affiche", "visualizza", "zeigt an", "megjelenít"], ["rămân", "rămân", "remain", "restent", "restano", "bleiben", "maradnak"], ["acestea", "acestea", "these", "ceux-ci", "questi", "diese", "ezek"], ["câmpul", "câmpul", "field", "champ", "campo", "Feld", "mező"], ["fixe", "fixe", "fixed", "fixes", "fissi", "fest", "fix"], ["franceză", "franceză", "French", "français", "francese", "Französisch", "francia"], ["sau", "sau", "or", "ou", "o", "oder", "vagy"], ["două", "două", "two", "deux", "due", "zwei", "két"], ["trei", "trei", "three", "trois", "tre", "drei", "három"], ["poți", "poți", "you can", "vous pouvez", "puoi", "Sie können", "tudsz"], ["introduce", "introduce", "enter", "saisir", "inserire", "eingeben", "beírni"], ["rânduri", "rânduri", "rows", "lignes", "righe", "Zeilen", "sorok"], ["rândul", "rândul", "row", "ligne", "riga", "Zeile", "sor"], ["rând", "rând", "row", "ligne", "riga", "Zeile", "sor"], ["suplimentare", "suplimentare", "additional", "supplémentaires", "aggiuntive", "zusätzlich", "további"], ["aceeași", "aceeași", "same", "même", "stessa", "gleiche", "ugyanaz"], ["același", "același", "same", "même", "stesso", "gleiche", "ugyanaz"], ["vrei", "vrei", "you want", "vous voulez", "vuoi", "Sie möchten", "akarod"], ["împarți", "împarți", "split", "répartir", "dividere", "aufteilen", "felosztani"], ["coduri", "coduri", "codes", "codes", "codici", "Codes", "kódok"], ["codul", "codul", "code", "code", "codice", "Code", "kód"], ["texte", "texte", "texts", "textes", "testi", "Texte", "szövegek"], ["textele", "textele", "texts", "textes", "testi", "Texte", "szövegek"], ["curentă", "curentă", "current", "actuelle", "corrente", "aktuell", "aktuális"], ["curent", "curent", "current", "actuel", "corrente", "aktuell", "aktuális"], ["contul", "contul", "account", "compte", "account", "Konto", "fiók"], ["este", "este", "is", "est", "è", "ist", "van"], ["doar", "doar", "only", "seulement", "solo", "nur", "csak"], ["vezi", "vezi", "you see", "vous voyez", "vedi", "Sie sehen", "látod"], ["vedea", "vedea", "see", "voir", "vedere", "sehen", "látni"], ["datele", "datele", "data", "données", "dati", "Daten", "adatok"], ["date", "date", "data", "données", "dati", "Daten", "adatok"], ["dar", "dar", "but", "mais", "ma", "aber", "de"], ["edita", "edita", "edit", "modifier", "modificare", "bearbeiten", "szerkeszteni"], ["adăuga", "adăuga", "add", "ajouter", "aggiungere", "hinzufügen", "hozzáadni"], ["pagină", "pagină", "page", "page", "pagina", "Seite", "oldal"], ["pagina", "pagina", "page", "page", "pagina", "Seite", "oldal"], ["pagini", "pagini", "pages", "pages", "pagine", "Seiten", "oldalak"], ["paginile", "paginile", "pages", "pages", "pagine", "Seiten", "oldalak"], ["construită", "construită", "built", "construite", "costruita", "erstellt", "épített"], ["excelul", "excelul", "Excel", "Excel", "Excel", "Excel", "Excel"], ["încărcat", "încărcat", "loaded", "chargé", "caricato", "geladen", "betöltött"], ["încărcată", "încărcată", "loaded", "chargée", "caricata", "geladen", "betöltött"], ["foi", "foi", "sheets", "feuilles", "fogli", "Blätter", "lapok"], ["vizualizare", "vizualizare", "view", "visualisation", "visualizzazione", "Ansicht", "megtekintés"], ["compactă", "compactă", "compact", "compacte", "compatta", "kompakt", "kompakt"], ["zile", "zile", "days", "jours", "giorni", "Tage", "napok"], ["zi", "zi", "day", "jour", "giorno", "Tag", "nap"], ["selectată", "selectată", "selected", "sélectionnée", "selezionata", "ausgewählt", "kiválasztott"], ["selectat", "selectat", "selected", "sélectionné", "selezionato", "ausgewählt", "kiválasztott"], ["apare", "apare", "appears", "apparaît", "appare", "erscheint", "megjelenik"], ["clar", "clar", "clear", "clair", "chiaro", "klar", "egyértelmű"], ["combinație", "combinație", "combination", "combinaison", "combinazione", "Kombination", "kombináció"], ["combinații", "combinații", "combinations", "combinaisons", "combinazioni", "Kombinationen", "kombinációk"], ["combinațiile", "combinațiile", "combinations", "combinaisons", "combinazioni", "Kombinationen", "kombinációk"], ["ca", "ca", "as", "comme", "come", "als", "mint"], ["optimizate", "optimizate", "optimized", "optimisées", "ottimizzate", "optimiert", "optimalizált"], ["economic", "economic", "economical", "économique", "economico", "sparsam", "takarékos"], ["importul", "importul", "import", "import", "import", "Import", "import"], ["exportul", "exportul", "export", "export", "export", "Export", "export"], ["folosesc", "folosesc", "use", "utilisent", "usano", "verwenden", "használnak"], ["folosește", "folosește", "uses", "utilise", "usa", "verwendet", "használ"], ["structura", "structura", "structure", "structure", "struttura", "Struktur", "szerkezet"], ["exactă", "exactă", "exact", "exacte", "esatta", "genau", "pontos"], ["exact", "exact", "exact", "exact", "esatto", "genau", "pontos"], ["fișierul", "fișierul", "file", "fichier", "file", "Datei", "fájl"], ["tău", "tău", "your", "votre", "tuo", "Ihr", "saját"], ["rebut", "rebut", "scrap", "rebut", "scarto", "Ausschuss", "selejt"], ["analiza", "analiza", "analysis", "analyse", "analisi", "Analyse", "elemzés"], ["sold", "sold", "balance", "solde", "saldo", "Saldo", "egyenleg"], ["final", "final", "final", "final", "finale", "End", "végső"], ["arată", "arată", "shows", "affiche", "mostra", "zeigt", "mutatja"], ["acoperirea", "acoperirea", "coverage", "couverture", "copertura", "Abdeckung", "fedezet"], ["capătul", "capătul", "end", "fin", "fine", "Ende", "vége"], ["orizontului", "orizontului", "horizon", "horizon", "orizzonte", "Horizont", "horizont"], ["dacă", "dacă", "if", "si", "se", "wenn", "ha"], ["trecut", "trecut", "past", "passé", "passato", "Vergangenheit", "múlt"], ["încă", "încă", "still", "encore", "ancora", "noch", "még"], ["deschisă", "deschisă", "open", "ouverte", "aperta", "offen", "nyitott"], ["deschise", "deschise", "open", "ouvertes", "aperte", "offen", "nyitott"], ["mută", "mută", "moves", "déplace", "sposta", "verschiebt", "áthelyezi"], ["automat", "automat", "automatically", "automatiquement", "automaticamente", "automatisch", "automatikusan"], ["prima", "prima", "first", "première", "prima", "erste", "első"], ["vizibilă", "vizibilă", "visible", "visible", "visibile", "sichtbar", "látható"], ["tratează", "tratează", "treats", "traite", "tratta", "behandelt", "kezeli"], ["restanță", "restanță", "overdue", "retard", "arretrato", "Rückstand", "hátralék"], ["nicio", "nicio", "no", "aucune", "nessuna", "keine", "nincs"], ["niciuna", "niciuna", "none", "aucune", "nessuna", "keine", "nincs"], ["gol", "gol", "empty", "vide", "vuoto", "leer", "üres"], ["prin", "prin", "through", "par", "tramite", "durch", "keresztül"], ["treci", "treci", "move", "passez", "passi", "wechseln", "átlépsz"], ["următoare", "următoare", "next", "suivante", "successiva", "nächste", "következő"], ["continuare", "continuare", "continuation", "suite", "continuazione", "Fortsetzung", "folytatás"], ["calcul", "calcul", "calculation", "calcul", "calcolo", "Berechnung", "számítás"], ["calcule", "calcule", "calculations", "calculs", "calcoli", "Berechnungen", "számítások"], ["clare", "clare", "clear", "clairs", "chiari", "klar", "egyértelmű"], ["flux", "flux", "flow", "flux", "flusso", "Fluss", "folyamat"], ["început", "început", "start", "début", "inizio", "Anfang", "kezdet"], ["consum", "consum", "consumption", "consommation", "consumo", "Verbrauch", "fogyasztás"], ["normă", "normă", "standard", "norme", "norma", "Norm", "norma"], ["procentele", "procentele", "percentages", "pourcentages", "percentuali", "Prozentsätze", "százalékok"], ["urmează", "urmează", "follow", "suivent", "seguono", "folgen", "követik"], ["intern", "intern", "internal", "interne", "interno", "intern", "belső"], ["afișată", "afișată", "displayed", "affichée", "visualizzata", "angezeigt", "megjelenített"], ["mare", "mare", "large", "grand", "grande", "groß", "nagy"], ["pozițiile", "pozițiile", "positions", "positions", "posizioni", "Positionen", "pozíciók"], ["unde", "unde", "where", "où", "dove", "wo", "ahol"], ["duplicatele", "duplicatele", "duplicates", "doublons", "duplicati", "Duplikate", "duplikátumok"], ["blocate", "blocate", "blocked", "bloquées", "bloccate", "gesperrt", "blokkolt"], ["între", "între", "between", "entre", "tra", "zwischen", "között"], ["pivot", "pivot", "pivot", "pivot", "pivot", "Pivot", "pivot"], ["grafice", "grafice", "charts", "graphiques", "grafici", "Diagramme", "grafikonok"], ["mici", "mici", "small", "petits", "piccoli", "klein", "kicsi"], ["livrările", "livrările", "deliveries", "livraisons", "consegne", "Lieferungen", "szállítások"], ["lunare", "lunare", "monthly", "mensuelles", "mensili", "monatlich", "havi"], ["totalurile", "totalurile", "totals", "totaux", "totali", "Summen", "összesítések"], ["anuale", "anuale", "annual", "annuels", "annuali", "jährlich", "éves"], ["selecția", "selecția", "selection", "sélection", "selezione", "Auswahl", "kiválasztás"], ["curentă", "curentă", "current", "actuelle", "corrente", "aktuell", "aktuális"]];
    moreTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();


  // Extended common words for more complete automatic translation.
  (function(){
    var commonRoTerms = [["să", "să", "to", "à", "a", "zu", "hogy"], ["nu", "nu", "not", "ne pas", "non", "nicht", "nem"], ["un", "un", "a", "un", "un", "ein", "egy"], ["o", "o", "a", "une", "una", "eine", "egy"], ["e", "e", "is", "est", "è", "ist", "van"], ["are", "are", "has", "a", "ha", "hat", "van"], ["au", "au", "have", "ont", "hanno", "haben", "van"], ["ai", "ai", "you have", "vous avez", "hai", "Sie haben", "van"], ["vor", "vor", "will", "vont", "saranno", "werden", "fognak"], ["se", "se", "is", "se", "si", "sich", ""], ["care", "care", "which", "qui", "che", "der/die", "amely"], ["că", "că", "that", "que", "che", "dass", "hogy"], ["acest", "acest", "this", "ce", "questo", "dieser", "ez"], ["această", "această", "this", "cette", "questa", "diese", "ez"], ["aceste", "aceste", "these", "ces", "queste", "diese", "ezek"], ["acele", "acele", "those", "ces", "quelle", "jene", "azok"], ["aceleași", "aceleași", "same", "mêmes", "stesse", "gleichen", "ugyanazok"], ["acel", "acel", "that", "ce", "quello", "jener", "az"], ["ea", "ea", "it", "elle", "essa", "sie", "az"], ["îl", "îl", "it", "le", "lo", "ihn", "azt"], ["îți", "îți", "you", "vous", "ti", "Ihnen", "neked"], ["își", "își", "its", "son", "suo", "sein", "saját"], ["există", "există", "exists", "existe", "esiste", "existiert", "létezik"], ["rămâne", "rămâne", "remains", "reste", "rimane", "bleibt", "marad"], ["rămasă", "rămasă", "remaining", "restante", "rimanente", "verbleibend", "maradó"], ["creează", "creează", "creates", "crée", "crea", "erstellt", "létrehoz"], ["lăzi", "lăzi", "boxes", "caisses", "casse", "Kisten", "ládák"], ["lăzii", "lăzii", "box", "caisse", "cassa", "Kiste", "láda"], ["adăugând", "adăugând", "adding", "en ajoutant", "aggiungendo", "hinzufügend", "hozzáadva"], ["calculează", "calculează", "calculates", "calcule", "calcola", "berechnet", "számolja"], ["completează", "completează", "fills", "remplit", "compila", "füllt", "kitölti"], ["completă", "completă", "complete", "complète", "completa", "vollständig", "teljes"], ["completări", "completări", "additions", "compléments", "completamenti", "Ergänzungen", "kiegészítések"], ["păstrat", "păstrat", "kept", "conservé", "mantenuto", "beibehalten", "megtartott"], ["păstrând", "păstrând", "keeping", "en conservant", "mantenendo", "beibehaltend", "megtartva"], ["preluată", "preluată", "taken", "reprise", "prelevata", "übernommen", "átvett"], ["preia", "preia", "takes", "reprend", "preleva", "übernimmt", "átveszi"], ["preiau", "preiau", "take", "reprennent", "prelevano", "übernehmen", "átvesznek"], ["urmărire", "urmărire", "tracking", "suivi", "tracciamento", "Verfolgung", "követés"], ["urmărirea", "urmărirea", "tracking", "suivi", "tracciamento", "Verfolgung", "követés"], ["următor", "următor", "next", "suivant", "successivo", "nächster", "következő"], ["stânga", "stânga", "left", "gauche", "sinistra", "links", "bal"], ["față", "față", "front", "avant", "fronte", "Vorderseite", "elülső"], ["jos", "jos", "bottom", "bas", "basso", "unten", "lent"], ["sus", "sus", "top", "haut", "alto", "oben", "fent"], ["manuală", "manuală", "manual", "manuelle", "manuale", "manuell", "kézi"], ["automat", "automat", "automatic", "automatique", "automatico", "automatisch", "automatikus"], ["automată", "automată", "automatic", "automatique", "automatica", "automatisch", "automatikus"], ["adăugarea", "adăugarea", "adding", "ajout", "aggiunta", "Hinzufügen", "hozzáadás"], ["listă", "listă", "list", "liste", "lista", "Liste", "lista"], ["lista", "lista", "list", "liste", "lista", "Liste", "lista"], ["liste", "liste", "lists", "listes", "liste", "Listen", "listák"], ["implicită", "implicită", "default", "par défaut", "predefinita", "standard", "alapértelmezett"], ["principal", "principal", "main", "principal", "principale", "Haupt", "fő"], ["principală", "principală", "main", "principale", "principale", "Haupt", "fő"], ["secțiune", "secțiune", "section", "section", "sezione", "Abschnitt", "szekció"], ["secțiunea", "secțiunea", "section", "section", "sezione", "Abschnitt", "szekció"], ["secțiuni", "secțiuni", "sections", "sections", "sezioni", "Abschnitte", "szekciók"], ["câmp", "câmp", "field", "champ", "campo", "Feld", "mező"], ["câmpuri", "câmpuri", "fields", "champs", "campi", "Felder", "mezők"], ["câmpurile", "câmpurile", "fields", "champs", "campi", "Felder", "mezők"], ["valoare", "valoare", "value", "valeur", "valore", "Wert", "érték"], ["valoarea", "valoarea", "value", "valeur", "valore", "Wert", "érték"], ["valori", "valori", "values", "valeurs", "valori", "Werte", "értékek"], ["fișa", "fișa", "sheet", "fiche", "scheda", "Blatt", "lap"], ["fișele", "fișele", "sheets", "fiches", "schede", "Blätter", "lapok"], ["fișierele", "fișierele", "files", "fichiers", "file", "Dateien", "fájlok"], ["încărca", "încărca", "load", "charger", "caricare", "laden", "betölteni"], ["încărcarea", "încărcarea", "loading", "chargement", "caricamento", "Laden", "betöltés"], ["salvarea", "salvarea", "saving", "enregistrement", "salvataggio", "Speichern", "mentés"], ["salvați", "salvați", "saved", "enregistrés", "salvati", "gespeichert", "mentett"], ["sincronizează", "sincronizează", "syncs", "synchronise", "sincronizza", "synchronisiert", "szinkronizál"], ["modificări", "modificări", "changes", "modifications", "modifiche", "Änderungen", "módosítások"], ["modifică", "modifică", "modifies", "modifie", "modifica", "ändert", "módosít"], ["modifici", "modifici", "modify", "modifiez", "modifichi", "ändern", "módosítasz"], ["șterse", "șterse", "deleted", "supprimées", "eliminate", "gelöscht", "törölt"], ["aplică", "aplică", "apply", "appliquer", "applica", "anwenden", "alkalmaz"], ["blocată", "blocată", "blocked", "bloquée", "bloccata", "gesperrt", "blokkolt"], ["blochează", "blochează", "blocks", "bloque", "blocca", "blockiert", "blokkol"], ["browserul", "browserul", "browser", "navigateur", "browser", "Browser", "böngésző"], ["localstorage", "localStorage", "localStorage", "localStorage", "localStorage", "localStorage", "localStorage"], ["locale", "locale", "local", "locaux", "locali", "lokal", "helyi"], ["rămână", "rămână", "remain", "restent", "rimangano", "bleiben", "maradjanak"], ["folosește", "folosește", "use", "utiliser", "usa", "verwenden", "használ"], ["confirmat", "confirmat", "confirmed", "confirmé", "confermato", "bestätigt", "megerősített"], ["reper", "reper", "reference", "référence", "codice", "Teil", "cikkszám"], ["reperul", "reperul", "part", "référence", "codice pezzo", "Teil", "cikkszám"], ["reperele", "reperele", "parts", "références", "codici pezzo", "Teile", "cikkszámok"], ["mapare", "mapare", "mapping", "mappage", "mappatura", "Zuordnung", "párosítás"], ["mapate", "mapate", "mapped", "mappées", "mappate", "zugeordnet", "párosított"], ["material", "material", "material", "matière", "materiale", "Material", "anyag"], ["kg", "kg", "kg", "kg", "kg", "kg", "kg"], ["comenzile", "comenzile", "orders", "commandes", "ordini", "Bestellungen", "rendelések"], ["cantitatea", "cantitatea", "quantity", "quantité", "quantità", "Menge", "mennyiség"], ["cantitățile", "cantitățile", "quantities", "quantités", "quantità", "Mengen", "mennyiségek"], ["rămasă", "rămasă", "remaining", "restante", "rimanente", "verbleibend", "maradó"], ["lucru", "lucru", "work", "travail", "lavoro", "Arbeit", "munka"], ["reguli", "reguli", "rules", "règles", "regole", "Regeln", "szabályok"], ["regulă", "regulă", "rule", "règle", "regola", "Regel", "szabály"], ["minimele", "minimele", "minimums", "minimums", "minimi", "Mindestwerte", "minimumok"], ["pragul", "pragul", "threshold", "seuil", "soglia", "Schwelle", "küszöb"], ["procentul", "procentul", "percentage", "pourcentage", "percentuale", "Prozentsatz", "százalék"], ["planificată", "planificată", "planned", "planifiée", "pianificata", "geplant", "tervezett"], ["planificare", "planificare", "planning", "planification", "pianificazione", "Planung", "tervezés"], ["avertizare", "avertizare", "warning", "avertissement", "avviso", "Warnung", "figyelmeztetés"], ["avertizări", "avertizări", "warnings", "avertissements", "avvisi", "Warnungen", "figyelmeztetések"], ["termen", "termen", "deadline", "délai", "termine", "Frist", "határidő"], ["livrare", "livrare", "delivery", "livraison", "consegna", "Lieferung", "szállítás"], ["barele", "barele", "bars", "barres", "barre", "Balken", "sávok"], ["dimensionează", "dimensionează", "scale", "dimensionnent", "dimensionano", "skalieren", "méreteződnek"], ["numărul", "numărul", "number", "nombre", "numero", "Anzahl", "szám"], ["celulă", "celulă", "cell", "cellule", "cella", "Zelle", "cella"], ["apeși", "apeși", "press", "appuyez", "premi", "drücken", "megnyomod"], ["ieși", "ieși", "leave", "quittez", "esci", "verlassen", "kilépsz"], ["memorie", "memorie", "memory", "mémoire", "memoria", "Speicher", "memória"], ["perioadă", "perioadă", "period", "période", "periodo", "Zeitraum", "időszak"], ["sfârșitul", "sfârșitul", "end", "fin", "fine", "Ende", "vége"], ["anuală", "anuală", "annual", "annuelle", "annuale", "jährlich", "éves"], ["finală", "finală", "final", "finale", "finale", "endgültig", "végső"], ["produsă", "produsă", "produced", "produite", "prodotta", "produziert", "gyártott"], ["centralizarea", "centralizarea", "summary", "centralisation", "riepilogo", "Zusammenfassung", "összesítés"], ["centralizări", "centralizări", "summaries", "centralisations", "riepiloghi", "Zusammenfassungen", "összesítések"], ["citește", "citește", "reads", "lit", "legge", "liest", "olvassa"], ["însumează", "însumează", "sums", "additionne", "somma", "summiert", "összegzi"], ["operații", "operații", "operations", "opérations", "operazioni", "Vorgänge", "műveletek"], ["operațiuni", "operațiuni", "operations", "opérations", "operazioni", "Vorgänge", "műveletek"], ["recurente", "recurente", "recurring", "récurrentes", "ricorrenti", "wiederkehrend", "visszatérő"], ["comparație", "comparație", "comparison", "comparaison", "confronto", "Vergleich", "összehasonlítás"], ["compară", "compară", "compares", "compare", "confronta", "vergleicht", "összehasonlít"], ["contribuția", "contribuția", "contribution", "contribution", "contributo", "Beitrag", "hozzájárulás"], ["înregistrării", "înregistrării", "record", "enregistrement", "registrazione", "Datensatz", "bejegyzés"], ["înregistrare", "înregistrare", "record", "enregistrement", "registrazione", "Datensatz", "bejegyzés"], ["portmatriță", "portmatriță", "die holder", "porte-matrice", "porta matrice", "Matrizenhalter", "szerszámtartó"], ["performanță", "performanță", "performance", "performance", "prestazione", "Leistung", "teljesítmény"], ["încadrat", "încadrat", "fitted", "encadré", "inquadrato", "eingepasst", "illesztett"], ["duplică", "duplică", "duplicate", "dupliquer", "duplica", "duplizieren", "duplikálás"], ["directă", "directă", "direct", "directe", "diretta", "direkt", "közvetlen"], ["dedicată", "dedicată", "dedicated", "dédiée", "dedicata", "dediziert", "dedikált"], ["evoluția", "evoluția", "evolution", "évolution", "evoluzione", "Entwicklung", "alakulás"], ["lunară", "lunară", "monthly", "mensuelle", "mensile", "monatlich", "havi"], ["recepție", "recepție", "reception", "réception", "ricezione", "Empfang", "átvétel"], ["restrânge", "restrânge", "narrows", "réduit", "restringe", "grenzt ein", "szűkít"], ["filtrează", "filtrează", "filters", "filtre", "filtra", "filtert", "szűr"], ["existentă", "existentă", "existing", "existante", "esistente", "vorhanden", "meglévő"], ["adăugare", "adăugare", "adding", "ajout", "aggiunta", "Hinzufügen", "hozzáadás"], ["importă", "importă", "import", "importer", "importa", "importieren", "importál"], ["poziții", "poziții", "positions", "positions", "posizioni", "Positionen", "pozíciók"], ["opțională", "opțională", "optional", "facultative", "opzionale", "optional", "opcionális"], ["lași", "lași", "leave", "laissez", "lasci", "lassen", "hagysz"], ["goală", "goală", "empty", "vide", "vuota", "leer", "üres"], ["estimată", "estimată", "estimated", "estimée", "stimata", "geschätzt", "becsült"], ["lipsă", "lipsă", "missing", "manquante", "mancante", "fehlend", "hiányzó"], ["listează", "listează", "lists", "liste", "elenca", "listet", "listáz"], ["lucrează", "lucrează", "works", "fonctionne", "lavora", "arbeitet", "dolgozik"], ["vânzări", "vânzări", "sales", "ventes", "vendite", "Verkäufe", "értékesítés"], ["vânzare", "vânzare", "sale", "vente", "vendita", "Verkauf", "értékesítés"], ["prelucrări", "prelucrări", "machining", "usinage", "lavorazioni", "Bearbeitung", "megmunkálás"], ["pornește", "pornește", "starts", "démarre", "avvia", "startet", "indul"], ["începutul", "începutul", "beginning", "début", "inizio", "Anfang", "kezdete"], ["fiecărei", "fiecărei", "each", "chaque", "ogni", "jeder", "minden"], ["aprobări", "aprobări", "approvals", "approbations", "approvazioni", "Genehmigungen", "jóváhagyások"], ["investițiilor", "investițiilor", "investments", "investissements", "investimenti", "Investitionen", "beruházások"], ["lăsa", "lăsa", "leave", "laisser", "lasciare", "lassen", "hagyni"], ["referință", "referință", "reference", "référence", "riferimento", "Referenz", "hivatkozás"], ["puțin", "puțin", "little", "peu", "poco", "wenig", "kevés"], ["agregă", "agregă", "aggregates", "agrège", "aggrega", "aggregiert", "összesít"], ["prezență", "prezență", "presence", "présence", "presenza", "Anwesenheit", "jelenlét"], ["introdusă", "introdusă", "entered", "saisie", "inserita", "eingegeben", "beírt"], ["generală", "generală", "general", "générale", "generale", "allgemein", "általános"], ["repartizează", "repartizează", "distributes", "répartit", "distribuisce", "verteilt", "elosztja"]];
    commonRoTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();


  // Final Romanian word coverage pass.
  (function(){
    var finalRoTerms = [["aici", "aici", "here", "ici", "qui", "hier", "itt"], ["iar", "iar", "and", "et", "e", "und", "és"], ["mai", "mai", "more", "plus", "più", "mehr", "még"], ["câte", "câte", "each", "chaque", "ciascuna", "jeweils", "egyenként"], ["când", "când", "when", "quand", "quando", "wenn", "amikor"], ["cât", "cât", "while", "pendant", "mentre", "während", "amíg"], ["închidere", "închidere", "closing", "fermeture", "chiusura", "Schließen", "bezárás"], ["înlocui", "înlocui", "replace", "remplacer", "sostituire", "ersetzen", "cserélni"], ["înlocuiește", "înlocuiește", "replace", "remplacer", "sostituisce", "ersetzt", "cseréli"], ["exporta", "exporta", "export", "exporter", "esportare", "exportieren", "exportálni"], ["importa", "importa", "import", "importer", "importare", "importieren", "importálni"], ["despica", "despica", "split", "diviser", "dividere", "aufteilen", "szétosztani"], ["fereastra", "fereastra", "window", "fenêtre", "finestra", "Fenster", "ablak"], ["dimensiune", "dimensiune", "size", "dimension", "dimensione", "Größe", "méret"], ["denumire", "denumire", "name", "nom", "denominazione", "Bezeichnung", "megnevezés"], ["operațiune", "operațiune", "operation", "opération", "operazione", "Vorgang", "művelet"], ["raportată", "raportată", "reported", "rapportée", "segnalata", "gemeldet", "jelentett"], ["raportate", "raportate", "reported", "rapportées", "segnalate", "gemeldet", "jelentett"], ["analiză", "analiză", "analysis", "analyse", "analisi", "Analyse", "elemzés"], ["cerută", "cerută", "required", "demandée", "richiesta", "erforderlich", "kért"], ["structură", "structură", "structure", "structure", "struttura", "Struktur", "szerkezet"], ["structură", "structură", "structure", "structure", "struttura", "Struktur", "szerkezet"], ["păstrate", "păstrate", "kept", "conservées", "mantenute", "beibehalten", "megtartott"], ["opționale", "opționale", "optional", "facultatives", "opzionali", "optional", "opcionális"], ["anterioară", "anterioară", "previous", "précédente", "precedente", "vorherige", "előző"], ["șef", "șef", "leader", "chef", "capo", "Leiter", "vezető"], ["echipă", "echipă", "team", "équipe", "squadra", "Team", "csapat"], ["forjată", "forjată", "forged", "forgée", "forgiata", "geschmiedet", "kovácsolt"], ["setări", "setări", "settings", "paramètres", "impostazioni", "Einstellungen", "beállítások"], ["descrescător", "descrescător", "descending", "décroissant", "decrescente", "absteigend", "csökkenő"], ["diferență", "diferență", "difference", "différence", "differenza", "Differenz", "különbség"], ["bază", "bază", "base", "base", "base", "Basis", "alap"], ["înghețarea", "înghețarea", "freezing", "figeage", "blocco", "Fixierung", "rögzítés"], ["zona", "zona", "area", "zone", "area", "Bereich", "terület"], ["zone", "zone", "areas", "zones", "aree", "Bereiche", "területek"], ["zonele", "zonele", "areas", "zones", "aree", "Bereiche", "területek"], ["săptămână", "săptămână", "week", "semaine", "settimana", "Woche", "hét"], ["săptămâna", "săptămâna", "week", "semaine", "settimana", "Woche", "hét"], ["folosită", "folosită", "used", "utilisée", "usata", "verwendet", "használt"], ["urmează", "urmează", "follows", "suit", "segue", "folgt", "követi"], ["matrița", "matrița", "die", "matrice", "matrice", "Matrize", "szerszám"], ["alta", "altă", "other", "autre", "altra", "andere", "más"], ["altă", "altă", "other", "autre", "altra", "andere", "más"], ["problemă", "problemă", "problem", "problème", "problema", "Problem", "probléma"], ["filtrează", "filtrează", "filters", "filtre", "filtra", "filtert", "szűr"], ["existentă", "existentă", "existing", "existante", "esistente", "vorhanden", "meglévő"], ["următor", "următor", "next", "suivant", "successivo", "nächster", "következő"], ["lasă", "lasă", "leaves", "laisse", "lascia", "lässt", "hagy"], ["citește", "citește", "reads", "lit", "legge", "liest", "olvassa"], ["întâi", "întâi", "first", "d’abord", "prima", "zuerst", "először"], ["închide", "închide", "close", "fermer", "chiudi", "schließen", "bezár"], ["dată", "dată", "date", "date", "data", "Datum", "dátum"], ["estimată", "estimată", "estimated", "estimée", "stimata", "geschätzt", "becsült"], ["observații", "observații", "notes", "observations", "note", "Bemerkungen", "megjegyzések"], ["tabelului", "tabelului", "table", "tableau", "tabella", "Tabelle", "táblázat"], ["totală", "totală", "total", "totale", "totale", "gesamt", "összes"], ["inițial", "inițial", "initial", "initial", "iniziale", "anfänglich", "kezdeti"], ["inițiale", "inițiale", "initial", "initiales", "iniziali", "anfänglich", "kezdeti"], ["intrări", "intrări", "entries", "entrées", "entrate", "Eingänge", "bevételek"], ["intrare", "intrare", "entry", "entrée", "entrata", "Eingang", "bevétel"], ["intră", "intră", "enters", "entre", "entra", "geht ein", "belép"], ["intrate", "intrate", "entered", "entrées", "entrate", "eingegangen", "beérkezett"], ["preluată", "preluată", "taken", "reprise", "prelevata", "übernommen", "átvett"], ["prelucrate", "prelucrate", "processed", "traitées", "lavorate", "bearbeitet", "feldolgozott"], ["recepție", "recepție", "reception", "réception", "ricezione", "Empfang", "átvétel"], ["codurile", "codurile", "codes", "codes", "codici", "Codes", "kódok"], ["grupare", "grupare", "grouping", "regroupement", "raggruppamento", "Gruppierung", "csoportosítás"], ["grupate", "grupate", "grouped", "regroupées", "raggruppate", "gruppiert", "csoportosított"], ["deschidere", "deschidere", "opening", "ouverture", "apertura", "Öffnen", "megnyitás"], ["ultimul", "ultimul", "last", "dernier", "ultimo", "letzter", "utolsó"], ["privat", "privat", "private", "privé", "privato", "privat", "privát"], ["public", "public", "public", "public", "pubblico", "öffentlich", "nyilvános"], ["nevoie", "nevoie", "need", "besoin", "bisogno", "Bedarf", "szükség"], ["poate", "poate", "can", "peut", "può", "kann", "lehet"], ["va", "va", "will", "va", "sarà", "wird", "fog"], ["trebuie", "trebuie", "must", "doit", "deve", "muss", "kell"], ["permis", "permis", "allowed", "autorisé", "consentito", "erlaubt", "engedélyezett"], ["formular", "formular", "form", "formulaire", "modulo", "Formular", "űrlap"], ["sugestii", "sugestii", "suggestions", "suggestions", "suggerimenti", "Vorschläge", "javaslatok"], ["celelate", "celelalte", "other", "autres", "altre", "andere", "egyéb"], ["celelalte", "celelalte", "other", "autres", "altre", "andere", "egyéb"], ["gestionezi", "gestionezi", "manage", "gérer", "gestisci", "verwalten", "kezeled"], ["setezi", "setezi", "set", "définir", "imposti", "einstellen", "beállítod"], ["primi", "primi", "receive", "recevoir", "ricevere", "erhalten", "kapni"], ["primește", "primește", "receives", "reçoit", "riceve", "erhält", "kap"], ["incalzire", "încălzire", "heating", "chauffage", "riscaldamento", "Erwärmung", "melegítés"], ["pausa", "pauză", "break", "pause", "pausa", "Pause", "szünet"], ["masă", "masă", "meal", "repas", "pasto", "Mahlzeit", "étkezés"], ["automat", "automat", "automatic", "automatique", "automatico", "automatisch", "automatikus"]];
    finalRoTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();



  // Human Resources / timesheet labels exact coverage.
  (function(){
    var hrExact = [
      ['PONTAJE','PONTAJE','TIMESHEETS','POINTAGES','CARTELLINI','ZEITERFASSUNGEN','JELENLÉTI ÍVEK'],
      ['Pontaje','Pontaje','Timesheets','Pointages','Cartellini','Zeiterfassungen','Jelenléti ívek'],
      ['Pontaj','Pontaj','Timesheet','Pointage','Cartellino','Zeiterfassung','Jelenléti ív'],
      ['PONTAJ','PONTAJ','TIMESHEET','POINTAGE','CARTELLINO','ZEITERFASSUNG','JELENLÉTI ÍV'],
      ['PONTAJ FORJA','PONTAJ FORJĂ','FORGING TIMESHEET','POINTAGE FORGE','CARTELLINO FORGIATURA','SCHMIEDE-ZEITERFASSUNG','KOVÁCSOLÁSI JELENLÉTI ÍV'],
      ['PONTAJ FORJĂ','PONTAJ FORJĂ','FORGING TIMESHEET','POINTAGE FORGE','CARTELLINO FORGIATURA','SCHMIEDE-ZEITERFASSUNG','KOVÁCSOLÁSI JELENLÉTI ÍV'],
      ['Pontaj Forja','Pontaj Forjă','Forging timesheet','Pointage forge','Cartellino forgiatura','Schmiede-Zeiterfassung','Kovácsolási jelenléti ív'],
      ['Pontaj Forjă','Pontaj Forjă','Forging timesheet','Pointage forge','Cartellino forgiatura','Schmiede-Zeiterfassung','Kovácsolási jelenléti ív'],
      ['PONTAJ CTC','PONTAJ CTC','CTC TIMESHEET','POINTAGE CTC','CARTELLINO CTC','CTC-ZEITERFASSUNG','CTC JELENLÉTI ÍV'],
      ['Pontaj CTC','Pontaj CTC','CTC timesheet','Pointage CTC','Cartellino CTC','CTC-Zeiterfassung','CTC jelenléti ív'],
      ['PONTAJ PRELUCRARI MECANICE','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['PONTAJ PRELUCRĂRI MECANICE','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['Pontaj Prelucrari Mecanice','Pontaj Prelucrări Mecanice','Machining timesheet','Pointage usinage mécanique','Cartellino lavorazioni meccaniche','Bearbeitungs-Zeiterfassung','Megmunkálási jelenléti ív'],
      ['Pontaj Prelucrări Mecanice','Pontaj Prelucrări Mecanice','Machining timesheet','Pointage usinage mécanique','Cartellino lavorazioni meccaniche','Bearbeitungs-Zeiterfassung','Megmunkálási jelenléti ív'],
      ['PONTAJ MACHINING MECANICE','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['PONTAJ MACHINING MECHANICE','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['PONTAJ MACHINING','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['PONTAJ PRELUCRĂRI','PONTAJ PRELUCRĂRI MECANICE','MACHINING TIMESHEET','POINTAGE USINAGE MÉCANIQUE','CARTELLINO LAVORAZIONI MECCANICHE','BEARBEITUNGS-ZEITERFASSUNG','MEGMUNKÁLÁSI JELENLÉTI ÍV'],
      ['PONTARE FORJA','PONTARE FORJĂ','FORGING TIMEKEEPING','POINTAGE FORGE','RILEVAZIONE PRESENZE FORGIATURA','SCHMIEDE-ZEITERFASSUNG','KOVÁCSOLÁSI IDŐNYILVÁNTARTÁS'],
      ['PONTARE FORJĂ','PONTARE FORJĂ','FORGING TIMEKEEPING','POINTAGE FORGE','RILEVAZIONE PRESENZE FORGIATURA','SCHMIEDE-ZEITERFASSUNG','KOVÁCSOLÁSI IDŐNYILVÁNTARTÁS'],
      ['PONTARE CTC','PONTARE CTC','CTC TIMEKEEPING','POINTAGE CTC','RILEVAZIONE PRESENZE CTC','CTC-ZEITERFASSUNG','CTC IDŐNYILVÁNTARTÁS'],
      ['MACHINING MECANICE','PRELUCRĂRI MECANICE','MACHINING','USINAGE MÉCANIQUE','LAVORAZIONI MECCANICHE','MECHANISCHE BEARBEITUNG','MECHANIKAI MEGMUNKÁLÁS'],
      ['MACHINING MECHANICE','PRELUCRĂRI MECANICE','MACHINING','USINAGE MÉCANIQUE','LAVORAZIONI MECCANICHE','MECHANISCHE BEARBEITUNG','MECHANIKAI MEGMUNKÁLÁS']
    ];
    hrExact.forEach(function(r){ addExact.apply(null, r); });
    var hrTerms = [
      ['pontaj','pontaj','timesheet','pointage','cartellino','Zeiterfassung','jelenléti ív'],
      ['pontaje','pontaje','timesheets','pointages','cartellini','Zeiterfassungen','jelenléti ívek'],
      ['pontare','pontare','timekeeping','pointage','rilevazione presenze','Zeiterfassung','időnyilvántartás'],
      ['mecanice','mecanice','mechanical','mécaniques','meccaniche','mechanische','mechanikai']
    ];
    hrTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();



  // Planificare Forja remaining visible labels and mixed generated texts.
  // This block is translation-only and keeps part codes, machine codes, numbers and K.A.D unchanged.
  (function(){
    var planMoreExact = [
      ['FORGING PLANNING','PLANIFICARE FORJĂ','FORGING PLANNING','PLANIFICATION FORGE','PIANIFICAZIONE FORGIATURA','SCHMIEDEPLANUNG','KOVÁCSOLÁSI TERVEZÉS'],
      ['Forging Planning','Planificare Forjă','Forging planning','Planification forge','Pianificazione forgiatura','Schmiedeplanung','Kovácsolási tervezés'],
      ['Realizat live','Realizat live','Produced live','Réalisé en direct','Prodotto live','Produziert live','Gyártott élő'],
      ['REALIZAT LIVE','REALIZAT LIVE','PRODUCED LIVE','RÉALISÉ EN DIRECT','PRODOTTO LIVE','PRODUZIERT LIVE','GYÁRTOTT ÉLŐ'],
      ['Refresh realizat','Refresh realizat','Refresh produced','Actualiser réalisé','Aggiorna prodotto','Produziert aktualisieren','Gyártott frissítése'],
      ['Refresh Realizat','Refresh realizat','Refresh produced','Actualiser réalisé','Aggiorna prodotto','Produziert aktualisieren','Gyártott frissítése'],
      ['Refresh produs','Refresh realizat','Refresh produced','Actualiser réalisé','Aggiorna prodotto','Produziert aktualisieren','Gyártott frissítése'],
      ['Generator plan propus','Generator plan propus','Proposed plan generator','Générateur de plan proposé','Generatore piano proposto','Generator vorgeschlagener Plan','Javasolt terv generátor'],
      ['Add sub row Selected','Adaugă subrând selectat','Add selected sub-row','Ajouter sous-ligne sélectionnée','Aggiungi sotto-riga selezionata','Ausgewählte Unterzeile hinzufügen','Kijelölt alsor hozzáadása'],
      ['Add sub row selected','Adaugă subrând selectat','Add selected sub-row','Ajouter sous-ligne sélectionnée','Aggiungi sotto-riga selezionata','Ausgewählte Unterzeile hinzufügen','Kijelölt alsor hozzáadása'],
      ['Add selected sub-row','Adaugă subrând selectat','Add selected sub-row','Ajouter sous-ligne sélectionnée','Aggiungi sotto-riga selezionata','Ausgewählte Unterzeile hinzufügen','Kijelölt alsor hozzáadása'],
      ['Add selected sub row','Adaugă subrând selectat','Add selected sub-row','Ajouter sous-ligne sélectionnée','Aggiungi sotto-riga selezionata','Ausgewählte Unterzeile hinzufügen','Kijelölt alsor hozzáadása'],
      ['Adaugă subrând selectat','Adaugă subrând selectat','Add selected sub-row','Ajouter sous-ligne sélectionnée','Aggiungi sotto-riga selezionata','Ausgewählte Unterzeile hinzufügen','Kijelölt alsor hozzáadása'],
      ['Delete selected row','Șterge rândul selectat','Delete selected row','Supprimer la ligne sélectionnée','Elimina riga selezionata','Ausgewählte Zeile löschen','Kijelölt sor törlése'],
      ['Save now','Salvează acum','Save now','Enregistrer maintenant','Salva ora','Jetzt speichern','Mentés most'],
      ['Search Part','Caută reper','Search part','Rechercher référence','Cerca codice pezzo','Teil suchen','Cikkszám keresése'],
      ['Search part','Caută reper','Search part','Rechercher référence','Cerca codice pezzo','Teil suchen','Cikkszám keresése'],
      ['Caută reper','Caută reper','Search part','Rechercher référence','Cerca codice pezzo','Teil suchen','Cikkszám keresése'],
      ['Date from','Data de la','Date from','Date de début','Data da','Datum von','Dátumtól'],
      ['Date to','Data până la','Date to','Date de fin','Data fino a','Datum bis','Dátumig'],
      ['Export Excel','Export Excel','Export Excel','Exporter Excel','Esporta Excel','Excel exportieren','Excel exportálás'],
      ['AN','AN','YEAR','ANNÉE','ANNO','JAHR','ÉV'],
      ['DATE','DATA','DATE','DATE','DATA','DATUM','DÁTUM'],
      ['DAY','ZI','DAY','JOUR','GIORNO','TAG','NAP'],
      ['Day','Zi','Day','Jour','Giorno','Tag','Nap'],
      ['Zi','Zi','Day','Jour','Giorno','Tag','Nap'],
      ['Part','Reper','Part','Référence','Codice pezzo','Teil','Cikkszám'],
      ['PLANNED','PLANIFICAT','PLANNED','PLANIFIÉ','PIANIFICATO','GEPLANT','TERVEZETT'],
      ['PRODUCED','REALIZAT','PRODUCED','RÉALISÉ','PRODOTTO','PRODUZIERT','GYÁRTOTT'],
      ['Produced','Realizat','Produced','Réalisé','Prodotto','Produziert','Gyártott'],
      ['Realizat','Realizat','Produced','Réalisé','Prodotto','Produziert','Gyártott'],
      ['PLANIFICAT','PLANIFICAT','PLANNED','PLANIFIÉ','PIANIFICATO','GEPLANT','TERVEZETT'],
      ['Neacoperite','Neacoperite','Uncovered','Non couvertes','Non coperte','Nicht gedeckt','Nem fedezett'],
      ['NEACOPERITE','NEACOPERITE','UNCOVERED','NON COUVERTES','NON COPERTE','NICHT GEDECKT','NEM FEDEZETT'],
      ['Replanificat','Replanificat','Rescheduled','Replanifié','Ripianificato','Neu geplant','Újratervezett'],
      ['replanificat','replanificat','rescheduled','replanifié','ripianificato','neu geplant','újratervezett'],
      ['De replanificat','De replanificat','To reschedule','À replanifier','Da ripianificare','Neu zu planen','Újratervezendő'],
      ['Livrări de replanificat','Livrări de replanificat','Deliveries to reschedule','Livraisons à replanifier','Consegne da ripianificare','Lieferungen neu zu planen','Újratervezendő szállítások'],
      ['Deliveries of replanificat','Livrări de replanificat','Deliveries to reschedule','Livraisons à replanifier','Consegne da ripianificare','Lieferungen neu zu planen','Újratervezendő szállítások'],
      ['Deliveries to reschedule','Livrări de replanificat','Deliveries to reschedule','Livraisons à replanifier','Consegne da ripianificare','Lieferungen neu zu planen','Újratervezendő szállítások'],
      ['Missing Steel','Oțel lipsă','Missing steel','Acier manquant','Acciaio mancante','Fehlender Stahl','Hiányzó acél'],
      ['Missing steel','Oțel lipsă','Missing steel','Acier manquant','Acciaio mancante','Fehlender Stahl','Hiányzó acél'],
      ['Oțel lipsă','Oțel lipsă','Missing steel','Acier manquant','Acciaio mancante','Fehlender Stahl','Hiányzó acél'],
      ['săpt.','săpt.','weeks','sem.','sett.','Wo.','hét'],
      ['săpt','săpt.','weeks','sem.','sett.','Wo.','hét'],
      ['pcs','buc','pcs','pcs','pz','Stk.','db'],
      ['parts','repere','parts','références','codici pezzo','Teile','cikkszámok'],
      ['part','reper','part','référence','codice pezzo','Teil','cikkszám']
    ];
    planMoreExact.forEach(function(r){ addExact.apply(null, r); });
    var planMoreTerms = [
      ['neacoperite','neacoperite','uncovered','non couvertes','non coperte','nicht gedeckt','nem fedezett'],
      ['neacoperit','neacoperit','uncovered','non couvert','non coperto','nicht gedeckt','nem fedezett'],
      ['replanificat','replanificat','rescheduled','replanifié','ripianificato','neu geplant','újratervezett'],
      ['realizat','realizat','produced','réalisé','prodotto','produziert','gyártott'],
      ['realizate','realizate','produced','réalisées','prodotte','produziert','gyártott'],
      ['produs','produs','produced','produit','prodotto','produziert','gyártott'],
      ['plan propus','plan propus','proposed plan','plan proposé','piano proposto','vorgeschlagener Plan','javasolt terv'],
      ['subrând','subrând','sub-row','sous-ligne','sotto-riga','Unterzeile','alsor'],
      ['lipsă','lipsă','missing','manquant','mancante','fehlend','hiányzó'],
      ['săpt.','săpt.','weeks','sem.','sett.','Wo.','hét']
    ];
    planMoreTerms.forEach(function(r){ addTerm.apply(null, r); });
    buildTerms();
  })();

  function replaceMonthsAndDays(text, lang){
    var out = String(text);
    SUPPORTED.forEach(function(srcLang){
      MONTHS[srcLang].long.forEach(function(m, idx){
        var re = new RegExp('(^|[^\\p{L}])' + escapeRe(m) + '(?=$|[^\\p{L}])','giu');
        out = out.replace(re, function(full,p){ return p + matchCase(m, MONTHS[lang].long[idx]); });
      });
      MONTHS[srcLang].short.forEach(function(m, idx){
        var re = new RegExp('(^|[^A-ZĂÂÎȘȚa-zăâîșț])' + escapeRe(m) + '(?=$|[^A-ZĂÂÎȘȚa-zăâîșț])','g');
        out = out.replace(re, function(full,p){ return p + MONTHS[lang].short[idx]; });
      });
      DAYS[srcLang].forEach(function(d, idx){
        var re = new RegExp('(^|[^\\p{L}])' + escapeRe(d) + '(?=$|[^\\p{L}])','giu');
        out = out.replace(re, function(full,p){ return p + matchCase(d, DAYS[lang][idx]); });
      });
    });
    return out;
  }

  function shouldSkipWholeText(text){
    var t = String(text || '').trim();
    if(!t) return true;
    // Codurile de pontaj nu se traduc niciodată.
    // Exemple: AN, CO, CM, CFS, LP trebuie să rămână exact așa în toate limbile.
    if(/^(AN|CO|CM|CFS|LP)$/i.test(t)) return true;
    if(t.length > 2200) return true;
    if(!/[A-Za-zĂÂÎȘȚăâîșțÀ-ž]/.test(t)) return true;
    if(/^(https?:|mailto:|tel:)/i.test(t)) return true;
    if(/^[A-Z]{1,4}\d+[A-Z0-9_\-/\. ]*$/i.test(t) && !/(STOC|TOTAL|MODEL|LUNA|DATA|AN|REPER|OTEL|OȚEL|BUC|KG|CALITATE|MATRIT|MATRȚ|FORJ|PRELUCR|TRAT|AMBAL|LIVR|PLAN|RAPORT|HELPER|INVENTAR|MAGNAFLUX|KPI)/i.test(t)) return true;
    var alnum = (t.match(/[A-Za-zĂÂÎȘȚăâîșțÀ-ž0-9]/g)||[]).length;
    var digits = (t.match(/\d/g)||[]).length;
    if(alnum > 0 && digits / alnum > 0.62 && t.length < 80) return true;
    return false;
  }

  function translateExact(text, lang){
    var t = String(text == null ? '' : text);
    var leading = (t.match(/^\s*/) || [''])[0];
    var trailing = (t.match(/\s*$/) || [''])[0];
    var core = t.trim().replace(/\s+/g,' ');
    var found = EXACT[key(core)];
    if(found && found[lang]) return leading + matchCase(core, found[lang]) + trailing;
    return null;
  }

  function applyTermReplacements(text, lang){
    var out = String(text);
    var terms = TERMS[lang] || [];
    terms.forEach(function(item){
      var src = item.source;
      var target = item.target;
      if(!src || !target || src === target || !item.re) return;
      if(item.ro && key(src) !== key(item.ro)) return;
      item.re.lastIndex = 0;
      out = out.replace(item.re, function(){
        if(item.isSingle){
          var prefix = arguments[1] || '';
          var original = arguments[2] || src;
          return prefix + matchCase(original, target);
        }
        var original2 = arguments[1] || src;
        return matchCase(original2, target);
      });
    });
    return out;
  }



  function translateDynamicPlanningText(text, lang){
    lang = normalizeLang(lang || getLang());
    var raw = String(text == null ? '' : text);
    var leading = (raw.match(/^\s*/) || [''])[0];
    var trailing = (raw.match(/\s*$/) || [''])[0];
    var core = raw.trim().replace(/\s+/g,' ');
    var m;
    var L = {
      ro:{uncovered:'Neacoperite', parts:'repere', pcs:'buc', deliveries:'Livrări de replanificat', missingSteel:'Oțel lipsă', weeks:'săpt.'},
      en:{uncovered:'Uncovered', parts:'parts', pcs:'pcs', deliveries:'Deliveries to reschedule', missingSteel:'Missing steel', weeks:'weeks'},
      fr:{uncovered:'Non couvertes', parts:'références', pcs:'pcs', deliveries:'Livraisons à replanifier', missingSteel:'Acier manquant', weeks:'sem.'},
      it:{uncovered:'Non coperte', parts:'codici pezzo', pcs:'pz', deliveries:'Consegne da ripianificare', missingSteel:'Acciaio mancante', weeks:'sett.'},
      de:{uncovered:'Nicht gedeckt', parts:'Teile', pcs:'Stk.', deliveries:'Lieferungen neu zu planen', missingSteel:'Fehlender Stahl', weeks:'Wo.'},
      hu:{uncovered:'Nem fedezett', parts:'cikkszámok', pcs:'db', deliveries:'Újratervezendő szállítások', missingSteel:'Hiányzó acél', weeks:'hét'}
    }[lang] || {};
    m = core.match(/^(?:Neacoperite|Uncovered|Non couvertes|Non coperte|Nicht gedeckt|Nem fedezett)\s*:\s*([0-9.,]+)\s*(?:parts|part|repere|reper|références|référence|codici pezzo|codice pezzo|Teile|Teil|cikkszámok|cikkszám)\s*[•\-–—]\s*([0-9.,]+)\s*(?:pcs|buc|pz|Stk\.?|db)$/i);
    if(m) return leading + L.uncovered + ': ' + m[1] + ' ' + L.parts + ' • ' + m[2] + ' ' + L.pcs + trailing;
    m = core.match(/^(?:Deliveries of replanificat|Deliveries to reschedule|Livrări de replanificat|Livrari de replanificat|Livraisons à replanifier|Consegne da ripianificare|Lieferungen neu zu planen|Újratervezendő szállítások)\s*:\s*([0-9.,]+)$/i);
    if(m) return leading + L.deliveries + ': ' + m[1] + trailing;
    m = core.match(/^(?:Missing Steel|Missing steel|Oțel lipsă|Otel lipsa|Acier manquant|Acciaio mancante|Fehlender Stahl|Hiányzó acél)\s*([0-9.,]+)\s*(?:săpt\.?|sapt\.?|weeks?|sem\.?|sett\.?|Wo\.?|hét)\s*:\s*([0-9.,]+)\s*kg$/i);
    if(m) return leading + L.missingSteel + ' ' + m[1] + ' ' + L.weeks + ': ' + m[2] + ' kg' + trailing;
    m = core.match(/^(?:Refresh realizat|Refresh produs|Refresh produced|Actualiser réalisé|Aggiorna prodotto|Produziert aktualisieren|Gyártott frissítése)$/i);
    if(m) return leading + ({ro:'Refresh realizat',en:'Refresh produced',fr:'Actualiser réalisé',it:'Aggiorna prodotto',de:'Produziert aktualisieren',hu:'Gyártott frissítése'}[lang] || core) + trailing;
    return null;
  }

  function translateText(text, lang){
    lang = normalizeLang(lang || getLang());
    var raw = String(text == null ? '' : text);
    var ck = lang + '\u001f' + raw;
    var cached = cacheGet(ck);
    if(cached != null) return cached;
    var base = canonicalizeToRomanian(raw);
    if(/^\s*AN\s*$/i.test(base) && /planificare/i.test(String(location.pathname || document.title || ''))){
      var anMap = {ro:'AN',en:'YEAR',fr:'ANNÉE',it:'ANNO',de:'JAHR',hu:'ÉV'};
      return cacheSet(ck, anMap[lang] || 'AN');
    }
    if(shouldSkipWholeText(base)) return cacheSet(ck, normalizeBrand(base));
    var exact = translateExact(base, lang);
    if(exact != null) return cacheSet(ck, normalizeBrand(exact));
    var dynamicPlanning = translateDynamicPlanningText(base, lang);
    if(dynamicPlanning != null) return cacheSet(ck, normalizeBrand(dynamicPlanning));
    var leading = (String(base).match(/^\s*/) || [''])[0];
    var trailing = (String(base).match(/\s*$/) || [''])[0];
    var core = String(base).trim();
    var translated = replaceMonthsAndDays(core, lang);
    translated = applyTermReplacements(translated, lang);
    return cacheSet(ck, normalizeBrand(leading + translated + trailing));
  }

  function shouldSkipNode(node){
    if(!node || !node.parentElement) return true;
    var p = node.parentElement;
    if(p.closest && p.closest('[data-i18n-skip], [translate="no"], .no-translate, .notranslate, code, pre, script, style, textarea')) return true;
    if(p.isContentEditable) return true;
    return false;
  }

  function translateTextNode(node, lang){
    if(shouldSkipNode(node)) return;
    var p = node.parentElement;
    var current = String(node.nodeValue == null ? '' : node.nodeValue);
    var original = node.__kadI18nOriginal;
    if(original == null || (node.__kadI18nLast != null && current !== node.__kadI18nLast && current.trim() !== '')){
      original = canonicalizeToRomanian(current);
      node.__kadI18nOriginal = original;
      try{
        if(p && p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', String(original).trim());
      }catch(_){ }
    } else {
      original = canonicalizeToRomanian(original);
      node.__kadI18nOriginal = original;
    }
    var next = translateText(original, lang);
    node.__kadI18nLast = next;
    if(node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(el, lang){
    if(!el || el.nodeType !== 1) return;
    if(el.closest && el.closest('[data-i18n-skip], [translate="no"], .no-translate, .notranslate, code, pre, script, style')) return;
    ['placeholder','title','aria-label','aria-description','alt','data-title','data-label','data-placeholder','data-tooltip','data-empty','data-status','data-original-title'].forEach(function(attr){
      if(!el.hasAttribute || !el.hasAttribute(attr)) return;
      var store = '__kadI18nAttr_' + attr;
      var curAttr = el.getAttribute(attr);
      var lastStore = store + '_last';
      if(el[store] == null || (el[lastStore] != null && curAttr !== el[lastStore] && String(curAttr || '').trim() !== '')) el[store] = canonicalizeToRomanian(curAttr);
      else el[store] = canonicalizeToRomanian(el[store]);
      var next = translateText(el[store], lang);
      el[lastStore] = next;
      if(el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
    if(el.tagName === 'INPUT'){
      var type = String(el.getAttribute('type') || '').toLowerCase();
      if((type === 'button' || type === 'submit' || type === 'reset') && el.value){
        if(el.__kadI18nValue == null || (el.__kadI18nValueLast != null && el.value !== el.__kadI18nValueLast && String(el.value || '').trim() !== '')) el.__kadI18nValue = canonicalizeToRomanian(el.value);
        else el.__kadI18nValue = canonicalizeToRomanian(el.__kadI18nValue);
        var v = translateText(el.__kadI18nValue, lang);
        el.__kadI18nValueLast = v;
        if(el.value !== v) el.value = v;
      }
    }
  }

  var translating = false;

  function translateSubtree(root, lang){
    if(!root) return;
    lang = normalizeLang(lang || getLang());
    try{
      if(root.nodeType === 3){
        translateTextNode(root, lang);
        return;
      }
      if(root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;

      if(root.nodeType === 1) translateAttributes(root, lang);

      var walkerRoot = root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11 ? root : (document.body || document.documentElement);
      var walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT, {
        acceptNode:function(node){
          if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if(shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(n){ translateTextNode(n, lang); });

      if(walkerRoot.querySelectorAll){
        var all = walkerRoot.querySelectorAll('*');
        for(var i=0;i<all.length;i++) translateAttributes(all[i], lang);
      }
    }catch(_){ }
  }

  function translatePage(){
    if(translating) return;
    translating = true;
    var lang = getLang();
    window.KAD_CURRENT_LANGUAGE = lang;
    try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
    translateSubtree(document.body || document.documentElement, lang);
    translating = false;
  }

  function updateSelector(lang){
    var s = document.getElementById('kadLanguageSelect');
    if(s && s.value !== lang) s.value = lang;
    var label = document.getElementById('kadLanguageLabel');
    if(label){
      var text = {ro:'Limba',en:'Language',fr:'Langue',it:'Lingua',de:'Sprache',hu:'Nyelv'}[lang] || 'Limba';
      if(label.textContent !== text) label.textContent = text;
    }
  }

  function bindSelector(){
    var select = document.getElementById('kadLanguageSelect');
    if(!select) return false;
    try{
      var box = document.getElementById('kadLanguageBox');
      if(box) box.setAttribute('data-i18n-skip','1');
    }catch(_){ }
    for(var i=0;i<select.options.length;i++){
      var opt = select.options[i];
      if(opt && SUPPORTED.indexOf(opt.value) >= 0) opt.textContent = LANG_NAMES[opt.value] || opt.textContent;
    }
    if(!select.__kadI18nBound){
      select.addEventListener('change', function(){ setLang(this.value); });
      select.__kadI18nBound = true;
    }
    updateSelector(getLang());
    return true;
  }

  function ensureSelector(){
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if(path && path !== 'index.html' && path !== '') return;
    if(bindSelector()) return;
    var holder = document.createElement('div');
    holder.id = 'kadLanguageBox';
    holder.className = 'kadLanguageBox';
    holder.setAttribute('data-i18n-skip','1');
    holder.innerHTML = '<span id="kadLanguageLabel">Limba</span><select id="kadLanguageSelect" aria-label="Limba"></select>';
    var select = holder.querySelector('select');
    SUPPORTED.forEach(function(code){
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = LANG_NAMES[code];
      select.appendChild(opt);
    });
    var css = document.createElement('style');
    css.textContent = '#kadLanguageBox,.kadLanguageBox{display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);font-weight:800;color:inherit;min-height:42px}#kadLanguageBox select,.kadLanguageBox select{border:0;background:transparent;color:inherit;font-weight:800;outline:0;cursor:pointer}#kadLanguageBox option,.kadLanguageBox option{color:#111;background:#fff}';
    document.head.appendChild(css);
    var target = document.querySelector('.topActions') || document.querySelector('.header .statusRow') || document.querySelector('.header') || document.querySelector('header') || document.body;
    if(target && target.appendChild){
      var logout = target.querySelector && target.querySelector('#btnLogout, .logoutOnly, [data-logout]');
      if(logout && logout.parentNode === target) target.insertBefore(holder, logout);
      else target.appendChild(holder);
    }
    bindSelector();
  }

  var scheduled = 0;
  var pendingRoots = [];
  function addPendingRoot(root){
    if(!root) return;
    if(root.nodeType === 3 || root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11) pendingRoots.push(root);
  }
  function schedule(root){
    addPendingRoot(root);
    if(scheduled) return;
    scheduled = setTimeout(function(){
      scheduled = 0;
      if(translating) return;
      translating = true;
      var lang = getLang();
      window.KAD_CURRENT_LANGUAGE = lang;
      try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
      var roots = pendingRoots.splice(0, pendingRoots.length);
      if(!roots.length) roots = [document.body || document.documentElement];
      for(var i=0;i<roots.length;i++){
        var r = roots[i];
        if(!r) continue;
        if(r.nodeType === 1 && r.id === 'kadLanguageBox') continue;
        if(r.nodeType === 1 && r.closest && r.closest('#kadLanguageBox')) continue;
        translateSubtree(r, lang);
      }
      translating = false;
    }, 140);
  }

  function boot(){
    try{ ensureSelector(); }catch(_){ }
    translatePage();
    try{
      var obs = new MutationObserver(function(mutations){
        if(translating) return;
        for(var i=0;i<mutations.length;i++){
          var m = mutations[i];
          if(m.target && (m.target.id === 'kadLanguageBox' || (m.target.closest && m.target.closest('#kadLanguageBox')))) continue;
          if(m.type === 'childList'){
            for(var j=0;j<m.addedNodes.length;j++) schedule(m.addedNodes[j]);
          }else if(m.type === 'characterData'){
            schedule(m.target);
          }else if(m.type === 'attributes'){
            schedule(m.target);
          }
        }
      });
      obs.observe(document.body || document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','title','aria-label','aria-description','alt','data-title','data-label','data-placeholder','data-tooltip','data-empty','data-status','data-original-title','value']});
    }catch(_){ }
    window.addEventListener('storage', function(e){
      if(e && ([STORAGE_KEY].concat(LEGACY_KEYS).indexOf(e.key) >= 0)) translatePage();
    });
  }

  window.KAD_I18N = {
    setLanguage:setLang,
    getLanguage:getLang,
    translate:translatePage,
    translateText:function(text, lang){ return translateText(text, normalizeLang(lang || getLang())); },
    languages:SUPPORTED.slice(),
    normalizeBrand:normalizeBrand
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
