# Procedură internă - Arhivă Documente K.A.D / cerințe CAT

## 1. Scop
Această procedură definește modul de păstrare, protejare, regăsire, backup și eliminare controlată a documentelor arhivate în K.A.D.

## 2. Domeniu
Se aplică documentelor de calitate, inginerie, furnizori, logistică, trasabilitate, EHS și fișelor operatorilor.

## 3. Retenție documente
- PPAP, PSW, DFMEA, PFMEA, Control Plan, MSA, capabilitate, IMDS: viața piesei + 15 ani.
- FAI: viața piesei + 15 ani.
- Inspecții, teste, rapoarte dimensionale, NDT: 15 ani.
- CoC / MTR: 10 ani.
- Neconformități / 8D / acțiuni corective: 10 ani.
- Desene tehnice și ECN/ECO: permanent.
- Specificații și standarde: versiunea curentă + 10 ani.
- Contracte furnizori: 10 ani după expirare.
- PO: 7 ani.
- Documente furnizor: 10 ani.
- ASN / BOL / packing list: 7 ani.
- Trasabilitate lot / serie: viața piesei + 15 ani.
- SDS și rapoarte expunere: 30 ani.

## 4. Format și locație
Documentele se păstrează electronic în K.A.D/Supabase, preferabil PDF/Excel/imagini scanate/date digitale. Documentele critice care cer original fizic, cum ar fi MTR, NDT și trasabilitate, se păstrează și fizic dacă procedura internă o cere.

## 5. Acces controlat
Accesul la Arhivă Documente se face pe bază de autentificare și ACL: can_view, can_edit, can_delete, can_export. Drepturile se revizuiesc periodic, cel puțin trimestrial sau la schimbarea personalului.

## 6. Audit trail
Se loghează cel puțin: accesarea paginii, vizualizarea fișei, export PDF, descărcare fișier, creare, modificare, sincronizare, export listă, export audit și ștergere logică. Auditul server-side este append-only.

## 7. Backup și restaurare
Arhiva intră în politica de backup Supabase. Se verifică backup zilnic/săptămânal conform setărilor platformei și se face test de restaurare periodic.

Evidența testului de restaurare trebuie să conțină:
- data testului;
- persoana responsabilă;
- documentul/testul restaurat;
- rezultat OK/NOK;
- observații și acțiuni corective.

## 8. Regăsire în maximum 24 ore
La solicitare audit, documentele trebuie identificate după data documentului, tip, reper, cod CAT, lot/sarjă, furnizor sau operator. Se testează periodic căutarea pentru MTR, Magnaflux/NDT, fișe operatori și PPAP/FAI.

## 9. Eliminare controlată
După expirarea retenției, documentul nu se șterge direct. Se marchează pentru analiză, se aprobă de responsabilul desemnat, se face ștergere/distrugere controlată și se păstrează dovada acțiunii în audit.

Documentele permanente nu se distrug.

## 10. Responsabilități
- Administrator K.A.D: control tehnic, ACL, backup, audit.
- Calitate: validarea retenției și documentelor cerute la audit.
- Șef atelier / responsabil proces: confirmarea fișelor operaționale.
- IT / responsabil sistem: backup, restaurare, disponibilitate.
