# TeenPlanner — Mājaslapas prototips

## Uzdevuma apraksts
Šis ir funkcionāls HTML un CSS prototips tīmekļa lapai "TeenPlanner" — jauniešu plānotāja aplikācijai. Mājaslapa ir izstrādāta atbilstoši uzdevuma prasībām ar semantisko HTML struktūru, responsīvo dizainu un interaktīviem elementiem.

## Saitņu un lapas (5+ lapas)
1. **index.html** — Sākuma lapa / Dashboard
2. **tasks.html** — Uzdevumu pārvaldīšana
3. **calendar.html** — Notikumu kalendārs
4. **focus.html** — Pomodoro taimeris
5. **profile.html** — Lietotāja profils un iestatījumi
6. **shop.html** — Efektu veikals

## Atbilstība prasībām

### 1. Struktūra ✓
- Semantiski HTML elementi (`<header>`, `<section>`, `<div>`, `<form>` u.tml.)
- Loģiska un saprotama lapu izkārtojuma struktūra
- Skaidras navigācijas saites visās lapās

### 2. Dizains ✓
- Modernus krāsu shēma (gaiša/tumša tēma)
- Inter un Poppins fonti no Google Fonts (licencēti)
- Vienveidīgs vizuālais stils visās lapās
- Mājaslapas log: "TP" ar gradientu fonu

### 3. Responsivitāte ✓
- Mobilam-centrēts dizains (max-width: 420px)
- Elastīgs Flexbox un Grid izkārtojums
- Darbojas uz mobilajiem telefoniem, planšetēm un galddatoriem
- Media queries pielāgošana lielākiem ekrāniem

### 4. Navigācija ✓
- 6 lapas ar funkcionālajām saitēm
- Header navigācija katrā lapā (logo ar saiti uz sākumu)
- Menu grid uz sākumlapas

### 5. Funkcionalitāte ✓
- **Pomodoro taimeris** — 25 minūšu sesijas ar Start/Pause/Reset pogām
- **Dinamiskās animācijas** — konfeti, salūts, zvaigžņu efekti (Canvas animācijas)
- **Lietotāja sistēma** — pieslēgšanās, segvārda maiņa, datu atjaunošana
- **Uzdevumu pārvaldīšana** — pievienot, atzīmēt kā pabeigtu, dzēst
- **Notikumu kalendārs** — pievienot notikumus konkrētajiem datumiem
- **Punktu sistēma** — iegūst punktus par uzdevumiem un fokusa sesijām
- **Sasniegumi** — progresa iesekošana (noslēgti uzdevumi, fokusa sesijas, punkti)
- **Tēmas pārslēgšana** — gaiša/tumša tēma ar localStorage saglabāšanu

### 6. Autortiesības ✓
- Fonti: Google Fonts (licencēti — OFL)
- Krāsas un ikonas: oriģināli dizainēti
- Bez trešo pušu attēliem (brīvi dizaini)

## Tehniskā informācija

### Fails: `app.js`
- **localStorage** datu glabāšana per lietotāju
- Lietotāju autentifikācija (vienkārša: tikai segvārds)
- Dinamiska HTML ģenerēšana ar JavaScript
- Pomodoro taimeris ar valsts vadību

### Fails: `style.css`
- CSS mainīgie (`--bg`, `--primary`, `--accent` u.tml.)
- Dark mode atbalsts (`:root.dark` klase)
- Flexbox un Grid izkārtojums
- Box shadows un gradients vizuālajiem efektiem

### Fails: `calendar.html`
- Dinamiska mēneša atspoguļošana
- Notikumi pēc datuma saglabāšana
- Modal logā notikuma pievienošana

### Fails: `focus.html`
- Pomodoro taimeris (25 minūtes)
- Sesijas skaita iesekošana
- Punktu piešķiršana par pabeigtu sesiju

## Kā lietot lokāli

```bash
cd /workspaces/danielsM
python3 -m http.server 8000
# Atvērt http://localhost:8000
```

## Kā apskatīt tiešsaistē

Mājaslapa ir pieejama GitHub Pages:
**https://danyakas.github.io/danielsM/**

## Atvērtais repozitorijs

GitHub repozitorijs: https://github.com/Danyakas/danielsM

Autors: Daniels Mironovs — 12b klase, Rīgas Ostvalda Vidusskola
