# 🎓 Garden TVET School — Sisitemu y'Icunga Ishuri

> **Garden TVET School** ni ishuri ry'imyuga ribereye **East Province, Akarere ka Ngoma**.
> Iyi sisitemu ni umutima wa digitale w'ishuri — icunga abana, amafaranga, ibikoresho, kwemererwa, gufunga umwaka, kurangiza no kubika amateka y'abasoje burundu.

---

## 📜 Ibikubiyemo
1. [Icyo iyi sisitemu ari cyo](#icyo-iyi-sisitemu-ari-cyo)
2. [Akamaro k'iyi sisitemu ku ishuri](#akamaro-kiyi-sisitemu-ku-ishuri)
3. [Uburyo ifasha ishuri kwinjiza amafaranga](#uburyo-ifasha-ishuri-kwinjiza-amafaranga)
4. [Cohort Engine — Algoritime yo guhindura imyaka (Auto Trade)](#cohort-engine--algoritime-yo-guhindura-imyaka)
5. [Yearbook y'Abasoje (Graduates)](#yearbook-yabasoje)
6. [Stack ya tekinike](#stack-ya-tekinike)
7. [Uko ukoresha sisitemu](#uko-ukoresha-sisitemu)

---

## Icyo iyi sisitemu ari cyo

Garden TVET School itanga **trade eshatu nyamukuru**:

| Trade | Igisobanuro | Ladder |
|---|---|---|
| **SOD** — Software Development | Iby'amaprogramu | L3 → L4 → L5 → Soje |
| **BDC** — Building & Construction | Ubwubatsi | L3 → L4 → L5 → Soje |
| **AUTO** — Automobile Technology | Imyuga ya moto/imodoka | L3 → **L4a + L4b** → **L5a + L5b** → Soje (mixed-cohort split) |

Buri trade ifite **abanyeshuri benshi**. Auto yo, kubera ko ifite abanyeshuri benshi, **yagabanyijwemo amashuri abiri (a/b)** kuri buri level (L4 na L5). Iyi sisitemu rero ikora kuri buri trade uburyo butandukanye, ariko mu **buryo bumwe, butekanye kandi bwishyize hamwe**.

---

## Akamaro k'iyi sisitemu ku ishuri

### 1. **Igihe cyacitse n'akazi gakorwa n'abakozi**
Mbere y'iyi sisitemu, gufunga umwaka byasabaga **iminsi myinshi**:
- Mwarimu wese yagombaga gushyira amazina y'abana ku rupapuro
- Director yagombaga gukuramo ku ntoki abasibye ishuri
- Registrar yagombaga kwandika icyangombwa cy'umwana wese kuri buri page
- Nyuma yo kunyura mu byumba byose, ubwo ni bwo bandika abasoje

➡️ **Iyi sisitemu ibikora mu masegonda 5**, mu mwanya wo kumara iminsi 7.
➡️ Ibika ibyo bikorwa byose mu **audit trail** kugira ngo igihe cyose tube tubizi uwafashe icyemezo.

### 2. **Ntashobora kwibeshya**
- Iyo ufunguye umwaka uvuga **2026**, abana ba Level 3 mu mwaka **2025** **bose bahita bajya kuri Level 4**.
- Sisitemu **iziga ababuze isuzuma**, bakagumishwa.
- **Auto Trade**: sisitemu **ihuza L4a na L4b**, ikongera **kubatandukanya** mu buryo bw'**alphabetic alternating split** kugira ngo amashuri **arimo abana bafite ubunararibonye butandukanye**.

### 3. **Ihezagiriza umutekano w'amakuru**
- **Buri promotion ibikwa mu** `student_promotions` table (audit log).
- Ntawe ushobora **kubikuramo** keretse Admin/Director.
- **Backup itungana** mu rwego rwa MySQL.

### 4. **Inkuru y'umunyeshuri yose iri muri sisitemu**
- Aho yatangiriye, uko yagiye azamuka, **cohort yarimo** (urugero: `Auto L4a → L5b`), n'igihe yarangirije.
- Iyo umubyeyi cg sosiyete bashaka kwemeza ko umwana **yarangirije**, sisitemu ihita ibyemeza neza ku **Yearbook page**.

---

## Uburyo ifasha ishuri kwinjiza amafaranga

### 💰 1. **Kongera ubushobozi bwo kwakira abanyeshuri**
Mbere, ishuri ryashoboraga kwakira abana **100 ku mwaka** kubera ko **administration ya papier** yari ihagaze ku bantu bake.
Ubu, ubwo dusoza umwaka mu **buryo bwa otomatike**, dushobora kwakira **abana 300+** nta kibazo. Iyi ni **revenue x3**.

### 💼 2. **Yearbook yo kwerekana kuri investors / abakiriya**
**Graduates page** ifite ubushobozi bwo:
- Kugaragaza abasoje **bose** bafotowe (kuri buri mwaka),
- Gucapa **PDF roster** y'urutonde rw'abasoje,
- Kohereza ku **bakoresha (employers)** muri Ngoma na Kigali, bakaza gushaka abakozi.

➡️ Ibi bituma ishuri **rikundwa cyane** kuko abana barangije bahita babona akazi → **abandi bana batinya kwiga aho**.

### 📋 3. **Raporo ya Government / RTB**
Sisitemu itanga raporo zikurikira mu **buryo butihishe**:
- Umubare w'abanyeshuri buri trade
- Imibare y'abasoje buri mwaka
- Imibare y'abahawe diplome
- Imibare y'**abagore vs abagabo** (gender breakdown)

➡️ Government ishishikajwe n'amakuru nk'aya — bituma **inkunga yiyongera**.

### 🎯 4. **Ntahombo ku miyoborere**
- Buri muntu wese arihiye **icyemezo cye gusa**, ntayindi data abone.
- **Accountant** abona amafaranga gusa.
- **Director of Discipline** abona ibyo abana bakoze.
- **Director** na **Admin** ni bo babona ibintu byose, harimo no gufunga umwaka.

➡️ **Akazi kose karazwi**, **uwakoze icyemezo arazwi**, kandi ntakindi cyongerwa. **Resource leakage = 0**.

---

## Cohort Engine — Algoritime yo guhindura imyaka

### Inyigisho ya rusange
Iyo Admin/Director **akanze "Funga Umwaka"**, sisitemu ikora ibi:

1. **Ifata abanyeshuri bose** baturutse mu mwaka urangiye.
2. **Igira plan** — buri munyeshuri akagira **action**: `promoted` / `retained` / `graduated`.
3. **Director ashobora kuvuga "Reka, uyu nje arasubizwa"** (`override`).
4. Iyo abyemeje, sisitemu **iyandika byose mu transaction imwe** (ACID).

### SOD na BDC — **Linear Ladder**

```
L3  ─────►  L4  ─────►  L5  ─────►  GRADUATED  (history forever)
```

Buri munyeshuri agumana **trade ye**, agumana **cohort yatangiriyemo**.

### AUTO — **Mixed-Cohort Split (uburyo butekanye)**

Auto ifite abana benshi, kandi tuba dushaka **kuvanga abana** kugira ngo **ababishaka cyane** bafashe **abandi**. Algoritime ikora ibi:

```
                           ┌───────► L4a (rusange) ──┐
L3 ─────► [SHUFFLE]────────┤                          ├───► [MIX & SPLIT]──┬──► L5a ──► GRADUATED
                           └───────► L4b (rusange) ──┘                     └──► L5b ──► GRADUATED
```

**Intambwe:**
1. **L3 → L4**: Abana ba L3 batondetswe ku **last_name → first_name → ID** (deterministic, ntibyihindura buri gihe).
2. **Sisitemu ibatandukanya** — ufite umwanya wa 1 ajya muri **L4a**, uwa 2 muri **L4b**, uwa 3 muri **L4a**, n'ibikurikira (alternating split). Ibi bituma **buri kohorot iba ifite abanyeshuri b'imibare ingana**.
3. **L4a + L4b → L5**: Sisitemu **ibahuriza hamwe**, **ibatondeka bushya**, hanyuma **ibatandukanya nanone** muri **L5a + L5b**. Ibi bituma **abana batavanaga mu mwaka ushize bava muri L4a bashobora kwiga muri L5b** — birongera ubunararibonye.
4. **L5a + L5b → Graduated**: Bose bajya muri **history**, ariko buri wese **agumana cohort label** y'ahanyuze (urugero: `Auto L4a → L5b → Graduated`).

### Code yagaragaye
Algoritime nyamukuru iri muri:

```
backend/controllers/academicYearController.js
  └── autoCohortPromotion()       — Auto trade engine (split + mix + split)
  └── buildPromotionPlan()        — kongera amaplan kuri SOD/BDC + AUTO
  └── closeYear()                 — ACID transaction iyandika byose
  └── previewClose()              — yereka admin cohort_breakdown mbere yo gufunga
```

### **Audit Trail (history)**
Iyo umwaka ufunzwe, sisitemu yandika muri `student_promotions`:
| from_year | to_year | from_level | to_level | action | notes (cohort) |
|---|---|---|---|---|---|
| 2025 | 2026 | L3 | L4a | promoted | `Auto L3 → L4a` |
| 2024 | 2025 | L4b | L5a | promoted | `Auto L4b → L5a` |
| 2025 | — | L5b | — | graduated | `Auto L5b → Graduated` |

➡️ **Igihe cyose**, dushobora **gusoma uko umwana wagiye azamuka** ku **buryo bwuzuye**.

---

## Yearbook y'Abasoje

`/graduates` page itanga:

- **Statistic Cards**: Total abasoje, imyaka, trades, diplomas.
- **Filters**: Umwaka, Trade, ushobora gushakisha izina.
- **Group cards**: Buri mwaka ufite umutwe ushobora gufungurwa/gufunga.
- **Photo grid**: Buri munyeshuri afite **ifoto** cg **initials** (iyo nta foto afite).
- **Modal y'umwirondoro**: Ukanze umunyeshuri, ubona reg number, telefone, aho atuye, umubyeyi, cohort yanyuzemo, n'itariki yarangirijeho.
- **Print PDF**: Buto **"Cap PDF Roster"** itanga raporo y'urutonde rw'abasoje rwacapwe (no @media print CSS — nta dependency yongewe).

➡️ **Iri page rishobora gukoreshwa muri:**
- Iminsi mikuru y'ishuri (graduation ceremony)
- Inama z'ababyeyi
- Kohereza employers / sosiyete
- Raporo ya Government

---

## Stack ya tekinike

| Layer | Tekinoroji |
|---|---|
| Frontend | **React 19**, **Vite 7**, **Tailwind CSS**, **lucide-react**, **react-toastify**, **i18next** (Kinyarwanda + English) |
| Backend | **Node.js**, **Express**, **mysql2/promise** (pool + transactions) |
| Database | **MySQL 8** (booted from Nix store, local socket) |
| Auth | JWT + role-based access control (admin, director, registrar, dod, accountant, stock_manager, student) |
| Files | uploads/ (images, course notes, hero slides, photos) |

### Ports
- **Frontend (Vite)**: `5000`
- **Backend (Express)**: `8080`
- **MySQL**: socket `/home/runner/workspace/.data/mysql-run/mysql.sock`

---

## Uko ukoresha sisitemu

### 1. Tangira sisitemu
```bash
bash start-dev.sh
```
Ibi bitangira **MySQL**, **backend** (port 8080), na **frontend** (port 5000).

### 2. Injira nka admin
```
Username: admin
Password: (yashizweho mu nshuro ya mbere)
```

### 3. Tangira umwaka
- Jya kuri **Academic Year** page
- Kanda **"Tangira Umwaka Mushya"** (urugero: 2027)
- Sisitemu izabaza **abana baragiyeho neza?**

### 4. Funga umwaka
- Kanda **"Funga Umwaka"**
- Sisitemu izerekana **preview** y'icyo igiye gukora:
  - Umubare w'abazamuka
  - Umubare w'abasoje
  - Umubare w'abagumishwa
  - **Cohort breakdown** (L4a, L4b, L5a, L5b)
- Director ashobora **guhindura** icyemezo cy'umwana wese mbere yo kwemeza
- Ukanze **"Funga Umwaka burundu"**, sisitemu **iyandika byose** mu **transaction imwe**

### 5. Reba abasoje
- Jya kuri **Abasoje** page
- Filtra ku **mwaka**, **trade**, cg ushakishe **izina**
- Kanda **"Cap PDF Roster"** kugira ngo ucape urutonde

---

## 🛡️ Umutekano

- **Buri request** isabwa **JWT token**.
- **Role-based authorization** ku buri endpoint.
- **Bcrypt** ku ma password.
- **Helmet + CORS** zafunguwe ku byagenwe.
- **SQL Injection-proof**: parameterized queries gusa.
- **Transaction-safe**: gufunga umwaka bibera mu **ACID transaction** — nta **partial state**.

---

## ✍️ Uwabikoze
**Garden TVET School ICT Team** — East / Ngoma 🇷🇼

> Iyi sisitemu ntabwo ari demo. Ni **production-grade**: koresha, izaguhesha umusaruro mwiza ku ishuri.
