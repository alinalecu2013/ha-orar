# 🗓️ ORAR – orar școlar interactiv pentru Home Assistant

Integrare Home Assistant inspirată din `orar_1.jpg`: un orar colorat cu temă spațială, zilele **Luni–Vineri**,
ore de început și de sfârșit pentru fiecare materie, editor complet direct din Home Assistant și senzori pentru automatizări.

## ✨ Ce conține

| | |
|---|---|
| **Panou „Orar” în bara laterală** | Tabla de orar plus un editor complet, organizat pe taburi |
| **🗓️ Orar** | Mod de editare: tragi materiile pe celule, folosești „pensula” și „radiera” sau atingi o celulă pentru meniul complet (materie, oră de început și de sfârșit, notiță). Poți trage și o celulă peste alta ca să le schimbi între ele. |
| **✏️ Zile** | Meniu pe fiecare zi: alegi materia din baza de date, setezi orele, muți rândurile, copiezi o zi în alta |
| **📚 Materii** | Baza de date de materii: nume, prescurtare, culoare, iconiță, profesor, sală, ce iei în ghiozdan, observații |
| **🔔 Clopoțel** | Orele standard, plus un generator (prima oră, durata, pauze, pauza mare) |
| **🎨 Themes** | 8 teme rapide, fundal (8 fundaluri predefinite, **imaginea ta** sau o culoare), întunecare și estompare a fundalului, stele animate, **culoarea antetului, a ferestrei și a textului, plus transparența ferestrei, separat pentru fiecare zi**, efect de sticlă, colțuri, fonturi, titlu, subtitlu, motto, mod „Rânduri” sau „Cronologic” (cu linia „acum”) |
| **🏖️ Vacanțe** | Intervale în care orarul nu se aplică |
| **⚙️ Setări** | Export și import JSON, exemple de automatizări |

Tabla evidențiază ziua de azi și ora în curs (cu bară de progres), afișează un ceas cu numărătoare inversă,
estompează orele trecute și devine un carusel pe telefon.

### Entități (pentru fiecare orar)
- `sensor.<orar>_materia_curenta`: materia de acum, „Pauză” sau „Liber” (atribute: minute rămase, progres, sală…)
- `sensor.<orar>_urmatoarea_materie`: următoarea materie și în câte minute începe
- `sensor.<orar>_ore_azi`: numărul de ore de azi și lista lor
- `sensor.<orar>_final_ore_azi`: ora la care se termină școala azi (timestamp)
- `sensor.<orar>_ghiozdan`: materiile și lucrurile de luat pentru următoarea zi de școală
- `binary_sensor.<orar>_la_scoala`
- `calendar.<orar>_orar`: toate orele ca evenimente (apar și în calendarul HA)

### Evenimente și servicii
- `orar_lesson_start` / `orar_lesson_end`: date despre materie, oră, sală, `is_first`, `is_last`
- `orar.set_lesson` (zi, număr, materie, început, sfârșit, notiță) și `orar.clear_lesson`

### Card Lovelace (disponibil automat, fără resursă manuală)
```yaml
type: custom:orar-card
mode: week      # week | today | now | backpack
# entry_id: ...  # opțional, dacă ai mai multe orare
# buttons: true  # butoanele Themes / Materii / Orar (implicit doar în modul week)
```
`backpack` afișează o listă bifabilă cu ce trebuie pus în ghiozdan pentru ziua următoare.

#### Butoanele din card: Themes · Materii · Orar
Pentru administratori, cardul are sus, peste imaginea de fundal, trei butoane care deschid editorul direct în card, fără să mai intri în panou. Lângă titlul **ORAR** e caseta cu **numele clasei**: o atingi, scrii (ex: „a V-a B”) și apeși Enter.

| Buton | Ce face |
|---|---|
| 🎨 **Themes** | Teme rapide, fundal (imaginea ta, fundaluri predefinite sau o culoare), culoarea și transparența ferestrei pentru fiecare zi, fonturi, afișare |
| 📚 **Materii** | Definești materiile care apar în orar: nume, prescurtare, culoare, iconiță, profesor, sală, ce iei în ghiozdan |
| 🕐 **Orar** | Pentru fiecare zi și fiecare oră: materia, **ora de început** și **ora de sfârșit**. Poți atinge și direct o celulă din tabla de deasupra |

Modificările se văd imediat în card și se salvează pe server, deci apar pe toate dispozitivele.
Un exemplu complet de dashboard e în [`dashboards/orar-dashboard.yaml`](dashboards/orar-dashboard.yaml).

## 📦 Instalare
1. Copiază folderul `custom_components/orar` în `config/custom_components/orar` din Home Assistant
   (sau prin HACS: *⋮ → Custom repositories* → `https://github.com/alinalecu2013/ha-orar`, tip *Integration*, apoi *Download*).
2. Repornește Home Assistant.
3. *Setări → Dispozitive și servicii → Adaugă integrare → **ORAR***. Alege un nume (de ex. „Orar Ana”).
   Poți adăuga câte un orar pentru fiecare copil.
4. Deschide **Orar** din bara laterală. Orarul pornește cu un exemplu pe care îl poți modifica sau goli.

> Ca să folosești chiar `orar_1.jpg` (sau orice altă poză) ca fundal: *Aspect → Fundal → 📷 Imagine → Încarcă imagine*.
> Imaginile mari sunt micșorate automat. Fișierele se salvează în `config/orar_media/`.

Ai nevoie de Home Assistant 2024.7 sau mai nou. Doar administratorii pot modifica orarul; ceilalți utilizatori îl pot doar vedea.
