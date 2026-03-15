# Audit stocuri și legături — proiect curățat

## Surse master după curățare

### 1. INVENTAR OȚEL
- Pagina master unică: `inventar-otel.html`
- Salvare cloud pe ani:
  - `inventar-otel:index`
  - `inventar-otel:AN`
- Compatibilitate de citire păstrată și pentru chei vechi:
  - `stoc-initial-otel`
  - `stoc_initial_otel`
  - aliasurile vechi de index/an

### 2. INVENTAR DEBITAT
- Pagina master: `inventar-debitat.html`
- Salvare cloud pe ani:
  - `inventar-debitat:index`
  - `inventar-debitat:AN`

### 3. INVENTAR FORJAT
- Pagina master: `inventar-forjat.html`
- Salvare cloud pe ani:
  - `inventar-forjat:index`
  - `inventar-forjat:AN`

## Pagini operaționale și documentele lor

### 4. INTRĂRI OȚEL
- `intrari-otel:index`
- `intrari-otel:AN`

### 5. DEBITATE
- `debitate:index`
- `debitate:AN`

### 6. FORJATE
- `forjate:index`
- `forjate:AN`

### 7. PLANIFICARE FORJĂ
- plan propriu:
  - `planificare-forja`
- helper:
  - `rf_helper_repere_forjate`
  - `rf_helper_repere_debitare`
- realizări:
  - `forjate:AN`
  - fallback `forjate`
- stocuri live folosite în calculul de lipsă:
  - `inventar-otel`
  - `inventar-debitat`

### 8. PLANIFICARE CALC
- citește același plan:
  - `planificare-forja`
- helper:
  - `rf_helper_repere_forjate`
  - `rf_helper_repere_debitare`
- realizări:
  - `forjate:AN`
  - fallback `forjate`
- stocuri live:
  - `inventar-otel`
  - `inventar-debitat`

## Flux clar de lucru după curățare

1. Stoc oțel se ține doar în `inventar-otel.html`
2. Stoc debitat se ține doar în `inventar-debitat.html`
3. Stoc forjat se ține doar în `inventar-forjat.html`
4. Planificarea citește direct stocurile master
5. `stoc-initial-otel.html` nu mai este pagină activă separată; redirecționează către `inventar-otel.html`

## Observații
- Am păstrat compatibilitate de citire pentru cheile vechi, ca să nu se rupă datele deja existente în cloud.
- Logica a fost simplificată ca să reducă numărul de surse citite la planificare.
- Pentru oțel nu mai există două pagini active cu roluri diferite.
