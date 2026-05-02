(function(){
  'use strict';

  var STORAGE_KEY = 'kad_language';
  var LEGACY_KEYS = ['rf_language','kad_lang','KAD_LANGUAGE','rf_i18n_lang'];
  var SUPPORTED = ['ro','en','fr','it','de','hu'];
  var LANG_NAMES = {
    ro:'Română', en:'English', fr:'Français', it:'Italiano', de:'Deutsch', hu:'Magyar'
  };

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
    EXACT[key(source)] = vals;
    if(ro) EXACT[key(ro)] = vals;
    if(en) EXACT[key(en)] = vals;
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
    SUPPORTED.forEach(function(lang){ TERMS[lang].push({source:String(src), target:vals[lang]}); });
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
        .sort(function(a,b){ return b.source.length - a.source.length; });
    });
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
    if(t.length > 600) return true;
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
      if(!src || !target || src === target) return;
      var isSingle = /^[\p{L}]+$/u.test(src);
      var pattern = isSingle ? '(^|[^\\p{L}])(' + escapeRe(src) + ')(?=$|[^\\p{L}])' : '(' + escapeRe(src) + ')';
      var re = new RegExp(pattern, 'giu');
      out = out.replace(re, function(){
        if(isSingle){
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

  function translateText(text, lang){
    if(lang === 'ro'){
      // Romanian mode still normalizes English UI strings that are hardcoded in some pages.
    }
    if(shouldSkipWholeText(text)) return text;
    var exact = translateExact(text, lang);
    if(exact != null) return exact;
    var leading = (String(text).match(/^\s*/) || [''])[0];
    var trailing = (String(text).match(/\s*$/) || [''])[0];
    var core = String(text).trim();
    var translated = replaceMonthsAndDays(core, lang);
    translated = applyTermReplacements(translated, lang);
    return leading + translated + trailing;
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
    var original = node.__kadI18nOriginal;
    if(original == null){
      original = node.nodeValue;
      node.__kadI18nOriginal = original;
      try{
        if(p && p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', String(original).trim());
      }catch(_){ }
    }
    var next = translateText(original, lang);
    if(node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttributes(el, lang){
    if(!el || el.nodeType !== 1) return;
    if(el.closest && el.closest('[data-i18n-skip], [translate="no"], .no-translate, .notranslate, code, pre, script, style')) return;
    ['placeholder','title','aria-label','data-title','data-label'].forEach(function(attr){
      if(!el.hasAttribute || !el.hasAttribute(attr)) return;
      var store = '__kadI18nAttr_' + attr;
      if(el[store] == null) el[store] = el.getAttribute(attr);
      var next = translateText(el[store], lang);
      if(el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
    if(el.tagName === 'INPUT'){
      var type = String(el.getAttribute('type') || '').toLowerCase();
      if((type === 'button' || type === 'submit' || type === 'reset') && el.value){
        if(el.__kadI18nValue == null) el.__kadI18nValue = el.value;
        var v = translateText(el.__kadI18nValue, lang);
        if(el.value !== v) el.value = v;
      }
    }
  }

  var translating = false;
  function translatePage(){
    if(translating) return;
    translating = true;
    var lang = getLang();
    window.KAD_CURRENT_LANGUAGE = lang;
    try{ document.documentElement.setAttribute('lang', lang); }catch(_){ }
    try{
      var walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, {
        acceptNode:function(node){
          if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if(shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(n){ translateTextNode(n, lang); });
      Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function(el){ translateAttributes(el, lang); });
    }catch(_){ }
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
      if(box) box.removeAttribute('data-i18n-skip');
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
  function schedule(){
    if(scheduled) return;
    scheduled = setTimeout(function(){ scheduled = 0; translatePage(); }, 80);
  }

  function boot(){
    try{ ensureSelector(); }catch(_){ }
    translatePage();
    try{
      var obs = new MutationObserver(function(mutations){
        if(translating) return;
        for(var i=0;i<mutations.length;i++){
          if(mutations[i].target && mutations[i].target.id === 'kadLanguageBox') continue;
          schedule();
          break;
        }
      });
      obs.observe(document.body || document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','title','aria-label','value']});
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
    languages:SUPPORTED.slice()
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
