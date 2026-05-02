(function(){
  'use strict';

  var STORAGE_KEY = 'rf_selected_language';
  var SUPPORTED = {
    ro: 'Română',
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    de: 'Deutsch',
    hu: 'Magyar'
  };

  var LANGUAGE_LABEL = {
    ro: 'Limba',
    en: 'Language',
    fr: 'Langue',
    it: 'Lingua',
    de: 'Sprache',
    hu: 'Nyelv'
  };

  var EXACT = {
    en: {
      'Limba':'Language','Română':'Romanian','Engleză':'English','Franceză':'French','Italiană':'Italian','Germană':'German','Maghiară':'Hungarian',
      'Neautentificat':'Not authenticated','Autentificat':'Authenticated','ID: —':'ID: —','Cont: —':'Account: —','Cloud: local':'Cloud: local','Logout':'Logout','Login':'Login',
      'Înapoi la Dashboard':'Back to Dashboard','Dashboard':'Dashboard','Închide':'Close','Anulează':'Cancel','Salvează':'Save','Salvează în cloud':'Save to cloud','Reîncarcă':'Reload','Refresh':'Refresh','Reset filtre':'Reset filters','Export Excel':'Export Excel','Import Excel':'Import Excel','Export PDF':'Export PDF','Print':'Print','Adaugă':'Add','Adaugă rând':'Add row','Șterge rând':'Delete row','Șterge':'Delete','Editează':'Edit','Modifică':'Modify','Caută':'Search','Filtrează':'Filter','Toate':'All','Alege':'Choose','Selectează':'Select',
      'An':'Year','Anul':'Year','Luna':'Month','Lună':'Month','Data':'Date','Data livrării':'Delivery date','Schimbul':'Shift','Schimb':'Shift','Utilaj':'Machine','Reper':'Part','REPER':'PART','Operator':'Operator','Observații':'Notes','Buc':'Pcs','Bucăți':'Pieces','Cantitate':'Quantity','Total':'Total','Total general':'Grand total','Furnizor':'Supplier','Diametru':'Diameter','Calitate':'Grade','Cod':'Code','Cod intern':'Internal code','Cod Matriță':'Die code','Cod-Cat':'CAT code','Sarja':'Heat / Batch','Pretest':'Pretest','Linie':'Line','Departament':'Department','Rol':'Role','Status':'Status','Activ':'Active','Blocat':'Blocked','Vizualizare':'View','Editare':'Edit','Admin':'Admin','Editor':'Editor','Viewer':'Viewer','Rânduri':'Rows','0 rânduri':'0 rows','Minute':'Minutes','Nr. transport':'Transport no.','Transporturi':'Transports','Lada':'Crate',
      'FORJĂ':'FORGING','PRELUCRĂRI MECANICE':'MACHINING','TRATAMENT TERMIC':'HEAT TREATMENT','CALITATE':'QUALITY','LOGISTICĂ':'LOGISTICS','RESURSE UMANE':'HUMAN RESOURCES','MENTENANȚĂ':'MAINTENANCE','ADMINISTRARE':'ADMINISTRATION','RAPOARTE':'REPORTS','STOCURI':'STOCKS','PLANIFICARE':'PLANNING','LIVRĂRI':'DELIVERIES','AMBALARE':'PACKAGING','Inventar':'Inventory','Forjate':'Forged parts','Debitate':'Cut pieces','Intrări Oțel':'Steel entries','Planificare Forjă':'Forging planning','Planificare Prelucrări':'Machining planning','Helper ACL':'Helper ACL','Helper Data':'Helper Data','Pontaj Forja':'Forging timesheet','Pontaj CTC':'CTC timesheet','Pontaj Prelucrări Mecanice':'Machining timesheet','KPI':'KPI',
      'PLANIFICĂRI':'PLANNING','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII':'ISSUES, IMPROVEMENTS AND INVESTMENTS','Selectează o categorie.':'Select a category.','Selectează o categorie din Forjă.':'Select a category from Forging.','Selectează o categorie din Resurse Umane.':'Select a category from Human Resources.','Forjă':'Forging','Prelucrări Mecanice':'Machining','Tratament Termic':'Heat Treatment','Calitate':'Quality','Probleme, Îmbunătățiri și Investiții':'Issues, Improvements and Investments','Planificări':'Planning','Resurse Umane':'Human Resources',
      'Ianuarie':'January','Februarie':'February','Martie':'March','Aprilie':'April','Mai':'May','Iunie':'June','Iulie':'July','August':'August','Septembrie':'September','Octombrie':'October','Noiembrie':'November','Decembrie':'December',
      'Configurare Authenticator':'Authenticator setup','Verificare Authenticator':'Authenticator verification','MFA ADMIN':'ADMIN MFA','Cod de 6 cifre din aplicația Authenticator':'6-digit code from the Authenticator app','Activează MFA':'Enable MFA','Confirmă MFA':'Confirm MFA','Așteaptă generarea codului QR.':'Waiting for QR code generation.','Se generează codul QR...':'Generating QR code...','Se verifică MFA...':'Verifying MFA...','Cod MFA invalid.':'Invalid MFA code.','Secret manual:':'Manual secret:',
      'Ai fost inactiv. Vei fi delogat automat în 60 secunde.':'You have been inactive. You will be logged out automatically in 60 seconds.','Rămân logat':'Stay logged in','Delogare automată':'Automatic logout'
    },
    fr: {
      'Limba':'Langue','Română':'Roumain','Engleză':'Anglais','Franceză':'Français','Italiană':'Italien','Germană':'Allemand','Maghiară':'Hongrois',
      'Neautentificat':'Non authentifié','Autentificat':'Authentifié','Cont: —':'Compte : —','Cloud: local':'Cloud : local','Logout':'Déconnexion','Login':'Connexion',
      'Înapoi la Dashboard':'Retour au tableau de bord','Dashboard':'Tableau de bord','Închide':'Fermer','Anulează':'Annuler','Salvează':'Enregistrer','Salvează în cloud':'Enregistrer dans le cloud','Reîncarcă':'Recharger','Refresh':'Actualiser','Reset filtre':'Réinitialiser les filtres','Export Excel':'Exporter Excel','Import Excel':'Importer Excel','Export PDF':'Exporter PDF','Print':'Imprimer','Adaugă':'Ajouter','Adaugă rând':'Ajouter une ligne','Șterge rând':'Supprimer la ligne','Șterge':'Supprimer','Editează':'Modifier','Modifică':'Modifier','Caută':'Rechercher','Filtrează':'Filtrer','Toate':'Tous','Alege':'Choisir','Selectează':'Sélectionner',
      'An':'Année','Anul':'Année','Luna':'Mois','Lună':'Mois','Data':'Date','Data livrării':'Date de livraison','Schimbul':'Équipe','Schimb':'Équipe','Utilaj':'Machine','Reper':'Référence','REPER':'RÉFÉRENCE','Operator':'Opérateur','Observații':'Observations','Buc':'Pcs','Bucăți':'Pièces','Cantitate':'Quantité','Total':'Total','Total general':'Total général','Furnizor':'Fournisseur','Diametru':'Diamètre','Calitate':'Qualité','Cod':'Code','Cod intern':'Code interne','Cod Matriță':'Code matrice','Cod-Cat':'Code CAT','Sarja':'Coulée / Lot','Pretest':'Prétest','Linie':'Ligne','Departament':'Département','Rol':'Rôle','Status':'Statut','Activ':'Actif','Blocat':'Bloqué','Vizualizare':'Vue','Editare':'Édition','Admin':'Admin','Editor':'Éditeur','Viewer':'Lecteur','Rânduri':'Lignes','0 rânduri':'0 ligne','Minute':'Minutes','Nr. transport':'N° transport','Transporturi':'Transports','Lada':'Caisse',
      'FORJĂ':'FORGE','PRELUCRĂRI MECANICE':'USINAGE','TRATAMENT TERMIC':'TRAITEMENT THERMIQUE','CALITATE':'QUALITÉ','LOGISTICĂ':'LOGISTIQUE','RESURSE UMANE':'RESSOURCES HUMAINES','MENTENANȚĂ':'MAINTENANCE','ADMINISTRARE':'ADMINISTRATION','RAPOARTE':'RAPPORTS','STOCURI':'STOCKS','PLANIFICARE':'PLANIFICATION','LIVRĂRI':'LIVRAISONS','AMBALARE':'EMBALLAGE','Inventar':'Inventaire','Forjate':'Pièces forgées','Debitate':'Pièces débitées','Intrări Oțel':'Entrées acier','Planificare Forjă':'Planification forge','Planificare Prelucrări':'Planification usinage','Pontaj Forja':'Pointage forge','Pontaj CTC':'Pointage CTC','Pontaj Prelucrări Mecanice':'Pointage usinage',
      'PLANIFICĂRI':'PLANIFICATIONS','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII':'PROBLÈMES, AMÉLIORATIONS ET INVESTISSEMENTS','Selectează o categorie.':'Sélectionnez une catégorie.','Selectează o categorie din Forjă.':'Sélectionnez une catégorie dans Forge.','Selectează o categorie din Resurse Umane.':'Sélectionnez une catégorie dans Ressources humaines.','Forjă':'Forge','Prelucrări Mecanice':'Usinage','Tratament Termic':'Traitement thermique','Calitate':'Qualité','Probleme, Îmbunătățiri și Investiții':'Problèmes, améliorations et investissements','Planificări':'Planifications','Resurse Umane':'Ressources humaines',
      'Ianuarie':'Janvier','Februarie':'Février','Martie':'Mars','Aprilie':'Avril','Mai':'Mai','Iunie':'Juin','Iulie':'Juillet','August':'Août','Septembrie':'Septembre','Octombrie':'Octobre','Noiembrie':'Novembre','Decembrie':'Décembre',
      'Configurare Authenticator':'Configuration Authenticator','Verificare Authenticator':'Vérification Authenticator','MFA ADMIN':'MFA ADMIN','Cod de 6 cifre din aplicația Authenticator':'Code à 6 chiffres de l’application Authenticator','Activează MFA':'Activer MFA','Confirmă MFA':'Confirmer MFA','Așteaptă generarea codului QR.':'Attente de la génération du QR.','Se generează codul QR...':'Génération du QR...','Se verifică MFA...':'Vérification MFA...','Cod MFA invalid.':'Code MFA invalide.','Secret manual:':'Secret manuel :',
      'Ai fost inactiv. Vei fi delogat automat în 60 secunde.':'Vous êtes inactif. Vous serez déconnecté automatiquement dans 60 secondes.','Rămân logat':'Rester connecté','Delogare automată':'Déconnexion automatique'
    },
    it: {
      'Limba':'Lingua','Română':'Rumeno','Engleză':'Inglese','Franceză':'Francese','Italiană':'Italiano','Germană':'Tedesco','Maghiară':'Ungherese',
      'Neautentificat':'Non autenticato','Autentificat':'Autenticato','Cont: —':'Account: —','Cloud: local':'Cloud: locale','Logout':'Logout','Login':'Login',
      'Înapoi la Dashboard':'Torna alla dashboard','Dashboard':'Dashboard','Închide':'Chiudi','Anulează':'Annulla','Salvează':'Salva','Salvează în cloud':'Salva nel cloud','Reîncarcă':'Ricarica','Refresh':'Aggiorna','Reset filtre':'Reimposta filtri','Export Excel':'Esporta Excel','Import Excel':'Importa Excel','Export PDF':'Esporta PDF','Print':'Stampa','Adaugă':'Aggiungi','Adaugă rând':'Aggiungi riga','Șterge rând':'Elimina riga','Șterge':'Elimina','Editează':'Modifica','Modifică':'Modifica','Caută':'Cerca','Filtrează':'Filtra','Toate':'Tutti','Alege':'Scegli','Selectează':'Seleziona',
      'An':'Anno','Anul':'Anno','Luna':'Mese','Lună':'Mese','Data':'Data','Data livrării':'Data consegna','Schimbul':'Turno','Schimb':'Turno','Utilaj':'Macchina','Reper':'Codice pezzo','REPER':'CODICE PEZZO','Operator':'Operatore','Observații':'Note','Buc':'Pz','Bucăți':'Pezzi','Cantitate':'Quantità','Total':'Totale','Total general':'Totale generale','Furnizor':'Fornitore','Diametru':'Diametro','Calitate':'Qualità','Cod':'Codice','Cod intern':'Codice interno','Cod Matriță':'Codice stampo','Cod-Cat':'Codice CAT','Sarja':'Colata / Lotto','Pretest':'Pretest','Linie':'Linea','Departament':'Reparto','Rol':'Ruolo','Status':'Stato','Activ':'Attivo','Blocat':'Bloccato','Vizualizare':'Visualizzazione','Editare':'Modifica','Admin':'Admin','Editor':'Editor','Viewer':'Visualizzatore','Rânduri':'Righe','0 rânduri':'0 righe','Minute':'Minuti','Nr. transport':'N. trasporto','Transporturi':'Trasporti','Lada':'Cassa',
      'FORJĂ':'FORGIA','PRELUCRĂRI MECANICE':'LAVORAZIONI MECCANICHE','TRATAMENT TERMIC':'TRATTAMENTO TERMICO','CALITATE':'QUALITÀ','LOGISTICĂ':'LOGISTICA','RESURSE UMANE':'RISORSE UMANE','MENTENANȚĂ':'MANUTENZIONE','ADMINISTRARE':'AMMINISTRAZIONE','RAPOARTE':'REPORT','STOCURI':'SCORTE','PLANIFICARE':'PIANIFICAZIONE','LIVRĂRI':'CONSEGNE','AMBALARE':'IMBALLAGGIO','Inventar':'Inventario','Forjate':'Pezzi forgiati','Debitate':'Pezzi tagliati','Intrări Oțel':'Entrate acciaio','Planificare Forjă':'Pianificazione forgia','Planificare Prelucrări':'Pianificazione lavorazioni','Pontaj Forja':'Presenze forgia','Pontaj CTC':'Presenze CTC','Pontaj Prelucrări Mecanice':'Presenze lavorazioni',
      'PLANIFICĂRI':'PIANIFICAZIONI','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII':'PROBLEMI, MIGLIORAMENTI E INVESTIMENTI','Selectează o categorie.':'Seleziona una categoria.','Selectează o categorie din Forjă.':'Seleziona una categoria da Forgia.','Selectează o categorie din Resurse Umane.':'Seleziona una categoria da Risorse umane.','Forjă':'Forgia','Prelucrări Mecanice':'Lavorazioni meccaniche','Tratament Termic':'Trattamento termico','Calitate':'Qualità','Probleme, Îmbunătățiri și Investiții':'Problemi, miglioramenti e investimenti','Planificări':'Pianificazioni','Resurse Umane':'Risorse umane',
      'Ianuarie':'Gennaio','Februarie':'Febbraio','Martie':'Marzo','Aprilie':'Aprile','Mai':'Maggio','Iunie':'Giugno','Iulie':'Luglio','August':'Agosto','Septembrie':'Settembre','Octombrie':'Ottobre','Noiembrie':'Novembre','Decembrie':'Dicembre',
      'Configurare Authenticator':'Configurazione Authenticator','Verificare Authenticator':'Verifica Authenticator','MFA ADMIN':'MFA ADMIN','Cod de 6 cifre din aplicația Authenticator':'Codice di 6 cifre dall’app Authenticator','Activează MFA':'Attiva MFA','Confirmă MFA':'Conferma MFA','Așteaptă generarea codului QR.':'Attesa generazione codice QR.','Se generează codul QR...':'Generazione codice QR...','Se verifică MFA...':'Verifica MFA...','Cod MFA invalid.':'Codice MFA non valido.','Secret manual:':'Segreto manuale:',
      'Ai fost inactiv. Vei fi delogat automat în 60 secunde.':'Sei stato inattivo. Verrai disconnesso automaticamente tra 60 secondi.','Rămân logat':'Rimani connesso','Delogare automată':'Logout automatico'
    },
    de: {
      'Limba':'Sprache','Română':'Rumänisch','Engleză':'Englisch','Franceză':'Französisch','Italiană':'Italienisch','Germană':'Deutsch','Maghiară':'Ungarisch',
      'Neautentificat':'Nicht authentifiziert','Autentificat':'Authentifiziert','Cont: —':'Konto: —','Cloud: local':'Cloud: lokal','Logout':'Abmelden','Login':'Anmelden',
      'Înapoi la Dashboard':'Zurück zum Dashboard','Dashboard':'Dashboard','Închide':'Schließen','Anulează':'Abbrechen','Salvează':'Speichern','Salvează în cloud':'In Cloud speichern','Reîncarcă':'Neu laden','Refresh':'Aktualisieren','Reset filtre':'Filter zurücksetzen','Export Excel':'Excel exportieren','Import Excel':'Excel importieren','Export PDF':'PDF exportieren','Print':'Drucken','Adaugă':'Hinzufügen','Adaugă rând':'Zeile hinzufügen','Șterge rând':'Zeile löschen','Șterge':'Löschen','Editează':'Bearbeiten','Modifică':'Ändern','Caută':'Suchen','Filtrează':'Filtern','Toate':'Alle','Alege':'Auswählen','Selectează':'Auswählen',
      'An':'Jahr','Anul':'Jahr','Luna':'Monat','Lună':'Monat','Data':'Datum','Data livrării':'Lieferdatum','Schimbul':'Schicht','Schimb':'Schicht','Utilaj':'Maschine','Reper':'Teil','REPER':'TEIL','Operator':'Bediener','Observații':'Bemerkungen','Buc':'Stk','Bucăți':'Stück','Cantitate':'Menge','Total':'Gesamt','Total general':'Gesamtsumme','Furnizor':'Lieferant','Diametru':'Durchmesser','Calitate':'Qualität','Cod':'Code','Cod intern':'Interner Code','Cod Matriță':'Werkzeugcode','Cod-Cat':'CAT-Code','Sarja':'Charge / Los','Pretest':'Vorprüfung','Linie':'Linie','Departament':'Abteilung','Rol':'Rolle','Status':'Status','Activ':'Aktiv','Blocat':'Gesperrt','Vizualizare':'Ansicht','Editare':'Bearbeitung','Admin':'Admin','Editor':'Editor','Viewer':'Betrachter','Rânduri':'Zeilen','0 rânduri':'0 Zeilen','Minute':'Minuten','Nr. transport':'Transport-Nr.','Transporturi':'Transporte','Lada':'Kiste',
      'FORJĂ':'SCHMIEDE','PRELUCRĂRI MECANICE':'MECHANISCHE BEARBEITUNG','TRATAMENT TERMIC':'WÄRMEBEHANDLUNG','CALITATE':'QUALITÄT','LOGISTICĂ':'LOGISTIK','RESURSE UMANE':'PERSONAL','MENTENANȚĂ':'INSTANDHALTUNG','ADMINISTRARE':'ADMINISTRATION','RAPOARTE':'BERICHTE','STOCURI':'BESTÄNDE','PLANIFICARE':'PLANUNG','LIVRĂRI':'LIEFERUNGEN','AMBALARE':'VERPACKUNG','Inventar':'Inventar','Forjate':'Schmiedeteile','Debitate':'Zuschnitte','Intrări Oțel':'Stahleingänge','Planificare Forjă':'Schmiedeplanung','Planificare Prelucrări':'Bearbeitungsplanung','Pontaj Forja':'Zeiterfassung Schmiede','Pontaj CTC':'Zeiterfassung CTC','Pontaj Prelucrări Mecanice':'Zeiterfassung Bearbeitung',
      'PLANIFICĂRI':'PLANUNGEN','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII':'PROBLEME, VERBESSERUNGEN UND INVESTITIONEN','Selectează o categorie.':'Wählen Sie eine Kategorie.','Selectează o categorie din Forjă.':'Wählen Sie eine Kategorie aus Schmiede.','Selectează o categorie din Resurse Umane.':'Wählen Sie eine Kategorie aus Personal.','Forjă':'Schmiede','Prelucrări Mecanice':'Mechanische Bearbeitung','Tratament Termic':'Wärmebehandlung','Calitate':'Qualität','Probleme, Îmbunătățiri și Investiții':'Probleme, Verbesserungen und Investitionen','Planificări':'Planungen','Resurse Umane':'Personal',
      'Ianuarie':'Januar','Februarie':'Februar','Martie':'März','Aprilie':'April','Mai':'Mai','Iunie':'Juni','Iulie':'Juli','August':'August','Septembrie':'September','Octombrie':'Oktober','Noiembrie':'November','Decembrie':'Dezember',
      'Configurare Authenticator':'Authenticator einrichten','Verificare Authenticator':'Authenticator-Prüfung','MFA ADMIN':'ADMIN MFA','Cod de 6 cifre din aplicația Authenticator':'6-stelliger Code aus der Authenticator-App','Activează MFA':'MFA aktivieren','Confirmă MFA':'MFA bestätigen','Așteaptă generarea codului QR.':'Warten auf QR-Code-Erstellung.','Se generează codul QR...':'QR-Code wird erstellt...','Se verifică MFA...':'MFA wird geprüft...','Cod MFA invalid.':'Ungültiger MFA-Code.','Secret manual:':'Manuelles Geheimnis:',
      'Ai fost inactiv. Vei fi delogat automat în 60 secunde.':'Sie waren inaktiv. Sie werden in 60 Sekunden automatisch abgemeldet.','Rămân logat':'Angemeldet bleiben','Delogare automată':'Automatische Abmeldung'
    },
    hu: {
      'Limba':'Nyelv','Română':'Román','Engleză':'Angol','Franceză':'Francia','Italiană':'Olasz','Germană':'Német','Maghiară':'Magyar',
      'Neautentificat':'Nincs bejelentkezve','Autentificat':'Bejelentkezve','Cont: —':'Fiók: —','Cloud: local':'Cloud: helyi','Logout':'Kijelentkezés','Login':'Bejelentkezés',
      'Înapoi la Dashboard':'Vissza az irányítópulthoz','Dashboard':'Irányítópult','Închide':'Bezárás','Anulează':'Mégse','Salvează':'Mentés','Salvează în cloud':'Mentés a felhőbe','Reîncarcă':'Újratöltés','Refresh':'Frissítés','Reset filtre':'Szűrők törlése','Export Excel':'Excel export','Import Excel':'Excel import','Export PDF':'PDF export','Print':'Nyomtatás','Adaugă':'Hozzáadás','Adaugă rând':'Sor hozzáadása','Șterge rând':'Sor törlése','Șterge':'Törlés','Editează':'Szerkesztés','Modifică':'Módosítás','Caută':'Keresés','Filtrează':'Szűrés','Toate':'Összes','Alege':'Válassz','Selectează':'Kiválasztás',
      'An':'Év','Anul':'Év','Luna':'Hónap','Lună':'Hónap','Data':'Dátum','Data livrării':'Szállítás dátuma','Schimbul':'Műszak','Schimb':'Műszak','Utilaj':'Gép','Reper':'Cikkszám','REPER':'CIKKSZÁM','Operator':'Operátor','Observații':'Megjegyzések','Buc':'Db','Bucăți':'Darab','Cantitate':'Mennyiség','Total':'Összesen','Total general':'Mindösszesen','Furnizor':'Beszállító','Diametru':'Átmérő','Calitate':'Minőség','Cod':'Kód','Cod intern':'Belső kód','Cod Matriță':'Szerszámkód','Cod-Cat':'CAT kód','Sarja':'Adag / Tétel','Pretest':'Előteszt','Linie':'Sor','Departament':'Osztály','Rol':'Szerep','Status':'Állapot','Activ':'Aktív','Blocat':'Blokkolt','Vizualizare':'Megtekintés','Editare':'Szerkesztés','Admin':'Admin','Editor':'Szerkesztő','Viewer':'Megtekintő','Rânduri':'Sorok','0 rânduri':'0 sor','Minute':'Perc','Nr. transport':'Szállítás sz.','Transporturi':'Szállítások','Lada':'Láda',
      'FORJĂ':'KOVÁCSOLÁS','PRELUCRĂRI MECANICE':'MECHANIKAI MEGMUNKÁLÁS','TRATAMENT TERMIC':'HŐKEZELÉS','CALITATE':'MINŐSÉG','LOGISTICĂ':'LOGISZTIKA','RESURSE UMANE':'EMBERI ERŐFORRÁS','MENTENANȚĂ':'KARBANTARTÁS','ADMINISTRARE':'ADMINISZTRÁCIÓ','RAPOARTE':'JELENTÉSEK','STOCURI':'KÉSZLETEK','PLANIFICARE':'TERVEZÉS','LIVRĂRI':'SZÁLLÍTÁSOK','AMBALARE':'CSOMAGOLÁS','Inventar':'Leltár','Forjate':'Kovácsolt darabok','Debitate':'Darabolt darabok','Intrări Oțel':'Acél bevételezés','Planificare Forjă':'Kovácsolási terv','Planificare Prelucrări':'Megmunkálási terv','Pontaj Forja':'Kovácsolás munkaidő','Pontaj CTC':'CTC munkaidő','Pontaj Prelucrări Mecanice':'Megmunkálás munkaidő',
      'PLANIFICĂRI':'TERVEZÉSEK','PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII':'PROBLÉMÁK, FEJLESZTÉSEK ÉS BERUHÁZÁSOK','Selectează o categorie.':'Válassz kategóriát.','Selectează o categorie din Forjă.':'Válassz kategóriát a Kovácsolásból.','Selectează o categorie din Resurse Umane.':'Válassz kategóriát az Emberi erőforrásból.','Forjă':'Kovácsolás','Prelucrări Mecanice':'Mechanikai megmunkálás','Tratament Termic':'Hőkezelés','Calitate':'Minőség','Probleme, Îmbunătățiri și Investiții':'Problémák, fejlesztések és beruházások','Planificări':'Tervezések','Resurse Umane':'Emberi erőforrás',
      'Ianuarie':'Január','Februarie':'Február','Martie':'Március','Aprilie':'Április','Mai':'Május','Iunie':'Június','Iulie':'Július','August':'Augusztus','Septembrie':'Szeptember','Octombrie':'Október','Noiembrie':'November','Decembrie':'December',
      'Configurare Authenticator':'Authenticator beállítása','Verificare Authenticator':'Authenticator ellenőrzés','MFA ADMIN':'ADMIN MFA','Cod de 6 cifre din aplicația Authenticator':'6 jegyű kód az Authenticator alkalmazásból','Activează MFA':'MFA aktiválása','Confirmă MFA':'MFA megerősítése','Așteaptă generarea codului QR.':'QR-kód generálása folyamatban.','Se generează codul QR...':'QR-kód generálása...','Se verifică MFA...':'MFA ellenőrzése...','Cod MFA invalid.':'Érvénytelen MFA-kód.','Secret manual:':'Kézi titok:',
      'Ai fost inactiv. Vei fi delogat automat în 60 secunde.':'Inaktív voltál. 60 másodperc múlva automatikusan kijelentkeztetünk.','Rămân logat':'Bejelentkezve maradok','Delogare automată':'Automatikus kijelentkezés'
    }
  };

  var REPLACE = {
    en: [
      ['PLANIFICĂRI','PLANNING'],['Planificări','Planning'],['Îmbunătățiri','Improvements'],['Investiții','Investments'],['îmbunătățiri','improvements'],['investiții','investments'],['Selectează o categorie din','Select a category from'],['Selectează o categorie','Select a category'],['Stoc','Stock'],['stoc','stock'],['Oțel','Steel'],['otel','steel'],['Matrițe','Dies'],['Matriță','Die'],['matrițe','dies'],['Regravare','Re-engraving'],['Regravări','Re-engravings'],['Comenzi','Orders'],['Livrare','Delivery'],['Livrări','Deliveries'],['Planificare','Planning'],['Raport','Report'],['Rapoarte','Reports'],['Probleme','Issues'],['Calitate','Quality'],['Cantitate','Quantity'],['Consum','Consumption'],['Necesare','Required'],['Necesar','Requirement'],['Operatori','Operators'],['Ore','Hours'],['Opriri','Stops'],['Pauză de masă','Meal break'],['Încălzire SDV','Tool heating'],['Schimbare reper','Part change'],['Reglaj','Adjustment'],['Total ore lucrate','Total hours worked'],['Ore suplimentare','Overtime hours'],['Fără acces','No access'],['Nu ai acces de editare','You do not have edit access'],['ai drept doar de vizualizare','you only have view rights'],['Salvare economică în cloud și backup local','Economic cloud save and local backup']
    ],
    fr: [
      ['PLANIFICĂRI','PLANIFICATIONS'],['Planificări','Planifications'],['Îmbunătățiri','Améliorations'],['Investiții','Investissements'],['îmbunătățiri','améliorations'],['investiții','investissements'],['Selectează o categorie din','Sélectionnez une catégorie dans'],['Selectează o categorie','Sélectionnez une catégorie'],['Stoc','Stock'],['stoc','stock'],['Oțel','Acier'],['otel','acier'],['Matrițe','Matrices'],['Matriță','Matrice'],['matrițe','matrices'],['Regravare','Regravure'],['Regravări','Regravures'],['Comenzi','Commandes'],['Livrare','Livraison'],['Livrări','Livraisons'],['Planificare','Planification'],['Raport','Rapport'],['Rapoarte','Rapports'],['Probleme','Problèmes'],['Calitate','Qualité'],['Cantitate','Quantité'],['Consum','Consommation'],['Necesare','Nécessaires'],['Necesar','Besoin'],['Operatori','Opérateurs'],['Ore','Heures'],['Opriri','Arrêts'],['Pauză de masă','Pause repas'],['Încălzire SDV','Chauffage outillage'],['Schimbare reper','Changement de référence'],['Reglaj','Réglage'],['Total ore lucrate','Total heures travaillées'],['Ore suplimentare','Heures supplémentaires'],['Fără acces','Accès interdit'],['Nu ai acces de editare','Vous n’avez pas d’accès en édition'],['ai drept doar de vizualizare','vous avez uniquement le droit de visualiser'],['Salvare economică în cloud și backup local','Sauvegarde économique dans le cloud et backup local']
    ],
    it: [
      ['PLANIFICĂRI','PIANIFICAZIONI'],['Planificări','Pianificazioni'],['Îmbunătățiri','Miglioramenti'],['Investiții','Investimenti'],['îmbunătățiri','miglioramenti'],['investiții','investimenti'],['Selectează o categorie din','Seleziona una categoria da'],['Selectează o categorie','Seleziona una categoria'],['Stoc','Stock'],['stoc','stock'],['Oțel','Acciaio'],['otel','acciaio'],['Matrițe','Stampi'],['Matriță','Stampo'],['matrițe','stampi'],['Regravare','Reincisione'],['Regravări','Reincisioni'],['Comenzi','Ordini'],['Livrare','Consegna'],['Livrări','Consegne'],['Planificare','Pianificazione'],['Raport','Report'],['Rapoarte','Report'],['Probleme','Problemi'],['Calitate','Qualità'],['Cantitate','Quantità'],['Consum','Consumo'],['Necesare','Necessari'],['Necesar','Fabbisogno'],['Operatori','Operatori'],['Ore','Ore'],['Opriri','Fermi'],['Pauză de masă','Pausa pranzo'],['Încălzire SDV','Riscaldamento attrezzatura'],['Schimbare reper','Cambio pezzo'],['Reglaj','Regolazione'],['Total ore lucrate','Totale ore lavorate'],['Ore suplimentare','Ore straordinarie'],['Fără acces','Accesso negato'],['Nu ai acces de editare','Non hai accesso in modifica'],['ai drept doar de vizualizare','hai solo diritto di visualizzazione'],['Salvare economică în cloud și backup local','Salvataggio economico nel cloud e backup locale']
    ],
    de: [
      ['PLANIFICĂRI','PLANUNGEN'],['Planificări','Planungen'],['Îmbunătățiri','Verbesserungen'],['Investiții','Investitionen'],['îmbunătățiri','Verbesserungen'],['investiții','Investitionen'],['Selectează o categorie din','Wählen Sie eine Kategorie aus'],['Selectează o categorie','Wählen Sie eine Kategorie'],['Stoc','Bestand'],['stoc','Bestand'],['Oțel','Stahl'],['otel','Stahl'],['Matrițe','Werkzeuge'],['Matriță','Werkzeug'],['matrițe','Werkzeuge'],['Regravare','Nachgravur'],['Regravări','Nachgravuren'],['Comenzi','Aufträge'],['Livrare','Lieferung'],['Livrări','Lieferungen'],['Planificare','Planung'],['Raport','Bericht'],['Rapoarte','Berichte'],['Probleme','Probleme'],['Calitate','Qualität'],['Cantitate','Menge'],['Consum','Verbrauch'],['Necesare','Erforderlich'],['Necesar','Bedarf'],['Operatori','Bediener'],['Ore','Stunden'],['Opriri','Stillstände'],['Pauză de masă','Essenspause'],['Încălzire SDV','Werkzeugerwärmung'],['Schimbare reper','Teilewechsel'],['Reglaj','Einstellung'],['Total ore lucrate','Gesamtarbeitsstunden'],['Ore suplimentare','Überstunden'],['Fără acces','Kein Zugriff'],['Nu ai acces de editare','Sie haben keinen Bearbeitungszugriff'],['ai drept doar de vizualizare','Sie haben nur Leserechte'],['Salvare economică în cloud și backup local','Sparsames Speichern in Cloud und lokales Backup']
    ],
    hu: [
      ['PLANIFICĂRI','TERVEZÉSEK'],['Planificări','Tervezések'],['Îmbunătățiri','Fejlesztések'],['Investiții','Beruházások'],['îmbunătățiri','fejlesztések'],['investiții','beruházások'],['Selectează o categorie din','Válassz kategóriát ebből'],['Selectează o categorie','Válassz kategóriát'],['Stoc','Készlet'],['stoc','készlet'],['Oțel','Acél'],['otel','acél'],['Matrițe','Szerszámok'],['Matriță','Szerszám'],['matrițe','szerszámok'],['Regravare','Újravésés'],['Regravări','Újravésések'],['Comenzi','Rendelések'],['Livrare','Szállítás'],['Livrări','Szállítások'],['Planificare','Tervezés'],['Raport','Jelentés'],['Rapoarte','Jelentések'],['Probleme','Problémák'],['Calitate','Minőség'],['Cantitate','Mennyiség'],['Consum','Fogyasztás'],['Necesare','Szükséges'],['Necesar','Szükséglet'],['Operatori','Operátorok'],['Ore','Óra'],['Opriri','Leállások'],['Pauză de masă','Étkezési szünet'],['Încălzire SDV','Szerszám melegítés'],['Schimbare reper','Cikkszám váltás'],['Reglaj','Beállítás'],['Total ore lucrate','Összes ledolgozott óra'],['Ore suplimentare','Túlóra'],['Fără acces','Nincs hozzáférés'],['Nu ai acces de editare','Nincs szerkesztési jogosultságod'],['ai drept doar de vizualizare','csak megtekintési jogod van'],['Salvare economică în cloud și backup local','Gazdaságos felhőmentés és helyi biztonsági mentés']
    ]
  };

  function normalizeLang(value){
    value = String(value || '').toLowerCase().trim();
    return SUPPORTED[value] ? value : 'ro';
  }
  function getLang(){
    try { return normalizeLang(localStorage.getItem(STORAGE_KEY) || 'ro'); }
    catch(_) { return 'ro'; }
  }
  function setLang(lang){
    lang = normalizeLang(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(_) {}
    document.documentElement.setAttribute('lang', lang);
    applyTranslations(document.body || document.documentElement);
  }
  function preserveSpace(original, translated){
    var leading = (String(original).match(/^\s*/) || [''])[0];
    var trailing = (String(original).match(/\s*$/) || [''])[0];
    return leading + translated + trailing;
  }
  function looksLikeTechnicalValue(t){
    if(!t) return true;
    if(/^[-+]?\d+([.,]\d+)?(%|\s*(kg|mm|buc|pcs|ore|min))?$/i.test(t)) return true;
    if(/^[A-Z0-9_\-/. ]{2,}$/.test(t) && !/[ĂÂÎȘȚăâîșț]/.test(t) && t.length <= 40) return true;
    return false;
  }
  function applyReplacements(lang, text){
    var out = text;
    var list = REPLACE[lang] || [];
    for(var i=0;i<list.length;i++){
      var from = list[i][0];
      var to = list[i][1];
      if(out.indexOf(from) !== -1) out = out.split(from).join(to);
    }
    return out;
  }
  function translateOriginal(original){
    var lang = getLang();
    if(lang === 'ro') return original;
    var trimmed = String(original || '').trim();
    if(!trimmed) return original;
    var exact = EXACT[lang] || {};
    if(Object.prototype.hasOwnProperty.call(exact, trimmed)) return preserveSpace(original, exact[trimmed]);
    if(looksLikeTechnicalValue(trimmed)) return original;
    var replaced = applyReplacements(lang, trimmed);
    if(replaced !== trimmed) return preserveSpace(original, replaced);
    return original;
  }
  function skipElement(el){
    if(!el || el.nodeType !== 1) return false;
    var tag = (el.tagName || '').toLowerCase();
    if(tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre' || tag === 'svg') return true;
    if(tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'option') return true;
    if(el.closest && el.closest('[data-rf-i18n-skip],.rf-i18n-skip,.rf-lang-selector,script,style,noscript,code,pre,svg')) return true;
    return false;
  }
  function translateTextNode(node){
    if(!node || node.nodeType !== 3 || !node.parentElement || skipElement(node.parentElement)) return;
    if(typeof node.__rfOriginalText !== 'string') node.__rfOriginalText = node.nodeValue;
    var next = translateOriginal(node.__rfOriginalText);
    if(node.nodeValue !== next) node.nodeValue = next;
  }
  function translateAttributes(el){
    if(!el || el.nodeType !== 1 || skipElement(el)) return;
    var attrs = ['title','aria-label','placeholder','data-title'];
    for(var i=0;i<attrs.length;i++){
      var a = attrs[i];
      if(!el.hasAttribute || !el.hasAttribute(a)) continue;
      var key = '__rfOriginalAttr_' + a;
      if(typeof el[key] !== 'string') el[key] = el.getAttribute(a) || '';
      var next = translateOriginal(el[key]);
      if(el.getAttribute(a) !== next) el.setAttribute(a, next);
    }
    var tag = (el.tagName || '').toLowerCase();
    if((tag === 'button' || (tag === 'input' && /^(button|submit|reset)$/i.test(el.type || ''))) && el.value){
      if(typeof el.__rfOriginalValue !== 'string') el.__rfOriginalValue = el.value;
      var nv = translateOriginal(el.__rfOriginalValue);
      if(el.value !== nv) el.value = nv;
    }
  }
  function walk(root){
    if(!root) return;
    if(root.nodeType === 3){ translateTextNode(root); return; }
    if(root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if(root.nodeType === 1){ if(skipElement(root)) return; translateAttributes(root); }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node){
        if(node.nodeType === 1) return skipElement(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        if(node.nodeType === 3) return (!node.parentElement || skipElement(node.parentElement)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });
    var current;
    while((current = walker.nextNode())){
      if(current.nodeType === 3) translateTextNode(current);
      else translateAttributes(current);
    }
  }
  var applying = false;
  function applyTranslations(root){
    if(applying) return;
    applying = true;
    try {
      document.documentElement.setAttribute('lang', getLang());
      walk(root || document.body || document.documentElement);
      syncSelector();
    } finally {
      applying = false;
    }
  }
  function isIndexPage(){
    var p = (location.pathname || '').split('/').pop().toLowerCase();
    return !p || p === 'index.html';
  }
  function injectStyles(){
    if(document.getElementById('rf-i18n-styles')) return;
    var st = document.createElement('style');
    st.id = 'rf-i18n-styles';
    st.textContent = '.rf-lang-selector{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:6px 10px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.14);color:inherit;font-weight:800;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.rf-lang-selector span{font-size:13px;opacity:.9}.rf-lang-selector select{height:28px;border:0;border-radius:999px;padding:0 10px;background:rgba(255,255,255,.92);color:#122033;font-weight:800;outline:none;cursor:pointer}.rf-lang-selector option{color:#122033}.rf-lang-selector-mini{position:fixed;right:12px;bottom:12px;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,.22)}@media(max-width:720px){.rf-lang-selector{width:100%;justify-content:space-between;border-radius:16px}.rf-lang-selector select{flex:1}.rf-lang-selector-mini{left:12px;right:12px}}';
    document.head.appendChild(st);
  }
  function buildSelector(mini){
    var label = document.createElement('label');
    label.className = 'rf-lang-selector' + (mini ? ' rf-lang-selector-mini' : '');
    label.setAttribute('data-rf-i18n-skip','1');
    var span = document.createElement('span');
    span.textContent = LANGUAGE_LABEL[getLang()] || 'Limba';
    var select = document.createElement('select');
    select.id = mini ? 'rfLangSelectMini' : 'rfLangSelect';
    Object.keys(SUPPORTED).forEach(function(code){
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = SUPPORTED[code];
      select.appendChild(opt);
    });
    select.value = getLang();
    select.addEventListener('change', function(){ setLang(select.value); });
    label.appendChild(span);
    label.appendChild(select);
    return label;
  }
  function injectSelector(){
    if(!isIndexPage()) return;
    if(document.getElementById('rfLangSelect')) return;
    injectStyles();
    var target = document.querySelector('.topActions') || document.querySelector('.header') || document.body;
    var selector = buildSelector(false);
    if(target && target.firstChild) target.insertBefore(selector, target.firstChild);
    else (target || document.body).appendChild(selector);
  }
  function syncSelector(){
    var lang = getLang();
    var one = document.getElementById('rfLangSelect');
    var two = document.getElementById('rfLangSelectMini');
    if(one && one.value !== lang) one.value = lang;
    if(two && two.value !== lang) two.value = lang;
    var labels = document.querySelectorAll('.rf-lang-selector span');
    for(var i=0;i<labels.length;i++){ labels[i].textContent = LANGUAGE_LABEL[lang] || 'Limba'; }
  }
  var pending = null;
  function schedule(root){
    if(pending) clearTimeout(pending);
    pending = setTimeout(function(){ pending = null; applyTranslations(root || document.body); }, 80);
  }
  function initObserver(){
    if(!document.body || !window.MutationObserver) return;
    var mo = new MutationObserver(function(mutations){
      if(applying) return;
      for(var i=0;i<mutations.length;i++){
        var m = mutations[i];
        if(m.type === 'childList'){
          for(var j=0;j<m.addedNodes.length;j++){
            var n = m.addedNodes[j];
            if(n && (n.nodeType === 1 || n.nodeType === 3)){ schedule(n); return; }
          }
        } else if(m.type === 'characterData') {
          var node = m.target;
          if(node && typeof node.__rfOriginalText !== 'string') node.__rfOriginalText = node.nodeValue;
          schedule(node);
          return;
        }
      }
    });
    mo.observe(document.body, { childList:true, subtree:true, characterData:true });
  }
  function init(){
    injectStyles();
    injectSelector();
    applyTranslations(document.body || document.documentElement);
    initObserver();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.RF_I18N = { getLang:getLang, setLang:setLang, apply:applyTranslations, supported:SUPPORTED };
})();
