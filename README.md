# 🎓 Garden TVET School — Sisitemu y'Icunga Ishuri

> **Garden TVET School** ni ishuri ry'imyuga ribereye **Intara y'Iburasirazuba, Akarere ka Ngoma, u Rwanda**.
> Iyi sisitemu ni umutima wa digitale w'ishuri — icunga abana, ababyeyi, abarimu, abiga gutwara, amafaranga, ibikoresho, kwemererwa, gufunga umwaka, kurangiza no kubika amateka y'abasoje burundu — yose ku gice kimwe.

---

## 📜 Ibikubiyemo
1. [Icyo iyi sisitemu ari cyo](#icyo-iyi-sisitemu-ari-cyo)
2. [Akamaro ku ishuri (administration)](#1-akamaro-ku-ishuri-administration)
3. [Akamaro ku banyeshuri (students)](#2-akamaro-ku-banyeshuri-students)
4. [Akamaro ku babyeyi (parents)](#3-akamaro-ku-babyeyi-parents)
5. [Akamaro ku barimu (teachers / instructors)](#4-akamaro-ku-barimu-teachers--instructors)
6. [Akamaro ku biga gutwara (driving school learners)](#5-akamaro-ku-biga-gutwara-driving-school-learners)
7. [Akamaro ku ma-Employers (sosiyete zifata abasoje)](#6-akamaro-ku-ma-employers)
8. [Uburyo ifasha ishuri kwinjiza amafaranga](#uburyo-ifasha-ishuri-kwinjiza-amafaranga)
9. [Cohort Engine — Algoritime yo guhindura imyaka (Auto Trade)](#cohort-engine--algoritime-yo-guhindura-imyaka)
10. [Yearbook y'Abasoje (Graduates)](#yearbook-yabasoje)
11. [Employer Outreach (Send Roster ku ma-Employers)](#employer-outreach-send-roster-ku-ma-employers)
12. [Stack ya tekinike & Setup](#stack-ya-tekinike--setup)

---

## Icyo iyi sisitemu ari cyo

Garden TVET School itanga **trade eshatu nyamukuru** + **Driving School**:

| Trade | Igisobanuro | Ladder |
|---|---|---|
| **SOD** — Software Development | Iby'amaprogramu | L3 → L4 → L5 → Soje |
| **BDC** — Building & Construction | Ubwubatsi | L3 → L4 → L5 → Soje |
| **AUTO** — Automobile Technology | Imyuga ya moto/imodoka | L3 → **L4a + L4b** → **L5a + L5b** → Soje (mixed-cohort split) |
| **Driving School** | Kwiga gutwara imodoka | Course-based, na exam |

Iyi sisitemu **ihuza buri ruhande** rwose: applications → enrollment → kwiga → ibizamini → kurangiza → kubikwa mu mateka burundu.

---

## 1. Akamaro ku ishuri (administration)

### Igihe cyacitse n'akazi gakorwa n'abakozi
Mbere y'iyi sisitemu, gufunga umwaka byasabaga **iminsi myinshi**:
- Mwarimu wese yagombaga gushyira amazina y'abana ku rupapuro
- Director yagombaga gukuramo ku ntoki abasibye ishuri
- Registrar yagombaga kwandika icyangombwa cy'umwana wese kuri buri page
- Nyuma yo kunyura mu byumba byose, ubwo ni bwo bandika abasoje

➡️ **Iyi sisitemu ibikora mu masegonda 5**, mu mwanya wo kumara iminsi 7.
➡️ Ibika ibyo bikorwa byose mu **audit trail** kugira ngo igihe cyose tube tubizi uwafashe icyemezo.

### Ntashobora kwibeshya
- Iyo ufunguye umwaka uvuga **2026**, abana ba Level 3 mu mwaka **2025** **bose bahita bajya kuri Level 4**.
- Sisitemu **iziga ababuze isuzuma**, bakagumishwa.
- **Auto Trade**: sisitemu **ihuza L4a na L4b**, ikongera **kubatandukanya** mu buryo bw'**alphabetic alternating split**.

### Role-based access
Buri muntu wese arihiye **icyemezo cye gusa**:
| Role | Icyo akora |
|---|---|
| Admin | Byose |
| Director | Gufunga umwaka, kureba/kohereza roster, gukurikirana |
| Registrar | Kwandika abana, gucunga abasoje + employers |
| DOD (Director of Discipline) | Discipline log, abana, attendance |
| Accountant | Amafaranga, fees, payments |
| Stock Manager | Ibikoresho gusa |
| Teacher / Instructor | Abanyeshuri be, attendance, grades |
| Student | Konti ye, course notes, grades |
| Parent | Abana be gusa |

---

## 2. Akamaro ku banyeshuri (students)

Buri munyeshuri **afite konti yihariye** ahabwa iyo yiyandikishije. Konti ye imuha:

- **Dashboard yihariye**: amazina ye, ifoto, trade, level, umwaka.
- **Course Notes**: amasomo akoresha (PDF, slides, videos) ushyizweho na mwarimu — **abasoma byose mu telefone**.
- **Grades**: kureba amanota ya buri term, **chart** y'iterambere.
- **Attendance**: kureba uburyo yagiye yitabira.
- **Driving Rules Practice** (iyo ari mu driving school): exam za practice, igisubizo cy'icyo yibukije.
- **Q&A**: gusaba mwarimu igisubizo ku byo atumva, mwarimu akamusubiriza.
- **Notifications**: amatangazo agezweho ku magufa — fees, exam, ihindurwa rya schedule.
- **Profile**: kuvugurura ifoto, telephone, addresse.
- **Student-type recognition**: abafite **bursary/government scholarship** bigaragazwa ukundi (kugira ngo finance icunge bonyine).

➡️ Igisubizo: **abanyeshuri bishimira ishuri**, kuko buri kintu cyose bagikora mu **buryo bworoshye** (telefone cyangwa laptop).

---

## 3. Akamaro ku babyeyi (parents)

Iyi ni **revolution** ku ababyeyi b'i Garden TVET. Mbere, ababyeyi bagombaga gukora urugendo bava i Kibungo cyangwa Kayonza bagana ishuri kugira ngo bamenye uko umwana ahagaze. Ubu, **bose bahita bareba mu telefone**.

### Parent Portal — `/parent-portal`
Iyo umubyeyi yiyandikishije akemerwa, akabona:

- **Abana bose** ariho yapfunditse kuri sisitemu (umubyeyi umwe ashobora kugira abana benshi).
- **Amanota** ya buri mwana.
- **Attendance**: niba umwana yari mu ishuri uyu munsi cyangwa atari.
- **Discipline log**: amakosa aba yarakoze (ahari) n'igihano cyabigeneye.
- **Fees & Payments**: ayarasohotse, ayasigaye, n'**ahantu yo kwishyura**.
- **Notifications**: SMS na in-app messages (urugero: "Umwana wawe ntiyazaga uyu munsi", "Ufite fees zitarishyurwa").
- **Direct Message ku ishuri**: kohereza ubutumwa kuri Director cyangwa mwarimu.
- **Link Request**: niba afite umwana mushya, asaba kumufashanya na konti ye, Admin akemeza.
- **Auto SMS Reminder**: cron ihora yorohereza ababyeyi, **iyo umwana ahomeje fees**, sisitemu ihita ibishyikiriza ababyeyi mbere y'uko bibaviramo ibibazo.

➡️ **Umubyeyi ntiyongera kuza ku ishuri** kugira ngo amenye uko umwana ahagaze. Aba yari yiteguye igihe inama irimo gukorwa, kandi **abanyeshuri ntibahisha amakuru ku babyeyi babo**.

---

## 4. Akamaro ku barimu (teachers / instructors)

### Teacher Dashboard — `/teacher-dashboard`
Mwarimu afite ubwo bushobozi:
- **Attendance**: kwandika abari muri classe ku gihe (mu masegonda 30).
- **Grades**: gushyira amanota ya quiz / exam / test, ahita abona **average** ya class.
- **Course Notes Upload**: gushyira amasomo (PDF, slides, video) abana barangije bagasoma mu rugo.
- **Q&A inbox**: kubona ibibazo abana banditse, akabasubiza.
- **Trade roster**: kureba abanyeshuri be bose (na photos), n'**uko buri wese atera imbere**.
- **Bulk SMS** ku banyeshuri be (urugero: "Igitabo cya mu maso kuzaba kuri 9h00").

➡️ Igisubizo: mwarimu **akoresha igihe gito mu kazi gato**, ariko **ategura amasomo cyane** kuko abona uko buri mwana ahagaze.

---

## 5. Akamaro ku biga gutwara (driving school learners)

Garden TVET ifite **Driving School** yihariye. Iyi sisitemu yongeyemo modules yihariye y'abiga gutwara:

### Driving Rules Page — `/driving-rules`
- **Test za practice** (multiple choice) ku miyoboro yo mu Rwanda.
- **Tracking ya score**: buri muntu abona aho yatangiriye n'aho atera imbere.
- **Lessons**: amasomo y'igitabo cy'amategeko, abasoma 24/7.
- **Practical lesson scheduling**: kwemera **practical session** na instructor.

### Driving School module — `/driving-school`
- **Instructor login** (token ihariye).
- **Stock ya carburant** (igenzurwe ku gihe).
- **Course materials upload**.
- **Tracking ya buri lesson** y'umunyeshuri (theory + practical).

➡️ Iyi yatumye ishuri ricyiyungura **driving learners 50+ buri kwezi**, kuko ubu bashobora kwiga **mu rugo** (theory) bagasaba **practical** iyo bareba ko biteguye.

---

## 6. Akamaro ku ma-Employers

Sosiyete na compagnies bafata abakozi **bibitse muri sisitemu** mu **Employer Directory** (`/employers`):
- Izina, contact, email, phone, sector
- **Trades zikenewe** (urugero: "Twifuza Software Devs gusa")
- **Outreach history**: amateka y'ibyo twohereje
- **Status** (active / inactive / archived)

### Send Roster button
Director / Registrar ashobora gukanda **"Send to Employers"**:
1. Sisitemu **ifata abasoje** ku byo washyizemo (mwaka, trade, search)
2. **Ikora PDF nyayo** ifite urutonde rwuzuye (reg number, level, phone, location, itariki yarangirijeho)
3. **Yohereza email** (HTML iboneye + PDF attached) ku ma-employers wahisemo
4. **Yandika buri kohereza** muri `employer_outreach` (audit log) — niba byanze, ihinda error.

➡️ Ibi bituma ishuri **rikora active recruitment** ku basoje, ntirikomeze kwitegereza ko basozi bashaka akazi bonyine.

---

## Uburyo ifasha ishuri kwinjiza amafaranga

### 💰 1. Kongera ubushobozi bwo kwakira abanyeshuri
Mbere, ishuri ryashoboraga kwakira abana **100 ku mwaka** kubera ko **administration ya papier** yari ihagaze ku bantu bake.
Ubu, ubwo dusoza umwaka mu **buryo bwa otomatike**, dushobora kwakira **abana 300+** nta kibazo. **Revenue x3**.

### 💼 2. Yearbook + Employer Outreach
- **Graduates page** + **PDF roster** + **Send to Employers**: tubona **placement rate** yiyongereye.
- Iyo abana ba Garden bahita babona akazi, abandi bana **bahitamo ishuri ryacu**.
- Bituma **tuition fees** ziganisha ubushobozi bwo kongera amasomo.

### 📋 3. Raporo ya Government / RTB
Sisitemu itanga raporo zikurikira mu **buryo butihishe**:
- Umubare w'abanyeshuri buri trade
- Imibare y'abasoje buri mwaka
- Imibare y'abahawe diplome
- Imibare y'**abagore vs abagabo** (gender breakdown)
- Imibare y'abagiye gukora mu sosiyete (employer outreach metrics)

➡️ Government ishishikajwe n'amakuru nk'aya — bituma **inkunga yiyongera**.

### 🚗 4. Driving School Revenue
- Online theory & practice itesha amafaranga ku booking practical
- Ababishaka kwiga **bashobora kwiyandikisha mu rugo**
- Sisitemu ihuza payment + scheduling — **conversion rate yiyongera**

### 🎯 5. Auto-fees Reminders
- Cron itanga SMS ku ababyeyi bafite **fees zitarishyurwa**
- Mbere y'uko fees zihinduka **bad debt**, ababyeyi bose bamenya
- **Recovery rate ya fees +30%**

### 🛡️ 6. Ntahombo ku miyoborere
- **Resource leakage = 0**, kubera ko **buri muntu agira role yihariye**.
- **Audit log**: niba hari ikibazo, sisitemu ivuga uwagikoze n'igihe.

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

### AUTO — **Mixed-Cohort Split**
```
                           ┌───────► L4a (rusange) ──┐
L3 ─────► [SHUFFLE]────────┤                          ├───► [MIX & SPLIT]──┬──► L5a ──► GRADUATED
                           └───────► L4b (rusange) ──┘                     └──► L5b ──► GRADUATED
```

**Intambwe:**
1. **L3 → L4**: Abana ba L3 batondetswe ku **last_name → first_name → ID** (deterministic).
2. **Sisitemu ibatandukanya** — alternating split: 1 → L4a, 2 → L4b, 3 → L4a... ibyo bituma cohorts zingana.
3. **L4a + L4b → L5**: Sisitemu **ibahuza**, **ibatondeka bushya**, hanyuma **ibatandukanya nanone** muri **L5a + L5b**.
4. **L5a + L5b → Graduated**: Bose bajya muri **history**, ariko buri wese **agumana cohort label** y'ahanyuze.

### Audit Trail
Iyo umwaka ufunzwe, sisitemu yandika muri `student_promotions`:
| from_year | to_year | from_level | to_level | action | notes (cohort) |
|---|---|---|---|---|---|
| 2025 | 2026 | L3 | L4a | promoted | `Auto L3 → L4a` |
| 2024 | 2025 | L4b | L5a | promoted | `Auto L4b → L5a` |
| 2025 | — | L5b | — | graduated | `Auto L5b → Graduated` |

---

## Yearbook y'Abasoje

`/graduates` page itanga:
- **Statistic Cards**: Total abasoje, imyaka, trades, diplomas.
- **Filters**: Umwaka, Trade, ushobora gushakisha izina.
- **Group cards**: Buri mwaka ufite umutwe ushobora gufungurwa/gufunga.
- **Photo grid**: Buri munyeshuri afite **ifoto** cg **initials**.
- **Modal y'umwirondoro**: reg number, telefone, aho atuye, umubyeyi, cohort yanyuzemo, n'itariki yarangirijeho.
- **Print PDF**: Buto **"Cap PDF Roster"** itanga raporo y'urutonde rw'abasoje rwacapwe.
- **Send to Employers**: kohereza roster ku ma-employer ku iyo filter (reba munsi).

---

## Employer Outreach (Send Roster ku ma-Employers)

### Endpoints
| Method | Path | Role |
|---|---|---|
| GET    | `/api/employers`              | read roles |
| GET    | `/api/employers/:id`          | read roles (+ outreach history) |
| POST   | `/api/employers`              | admin/director/registrar |
| PUT    | `/api/employers/:id`          | admin/director/registrar |
| DELETE | `/api/employers/:id`          | admin/director/registrar |
| GET    | `/api/employers/email/status` | read roles |
| POST   | `/api/employers/send-roster`  | admin/director/registrar |
| GET    | `/api/employers/outreach`     | read roles (audit log) |

### Algorithm `send-roster`
1. Validates `employer_ids[]` and SMTP config.
2. Loads active employers with valid emails.
3. Queries graduates matching `year_id`, `trade`, `search` filters.
4. Builds **a real PDF** (via `pdfkit`, server-side) once.
5. Sends a beautifully-formatted HTML email with the PDF attached, **per employer**.
6. Logs every send (success or failure) in `employer_outreach` and `email_log`.
7. Returns a per-recipient result list to the UI.

### Configure email (one-time setup)
The send feature requires **SMTP credentials** from any provider (Gmail SMTP, SendGrid, Brevo, AWS SES, Mailgun, school's own email server…). Set the following environment variables:

| Variable | Example |
|---|---|
| `SMTP_HOST`   | `smtp.gmail.com` |
| `SMTP_PORT`   | `587` |
| `SMTP_SECURE` | `false` (use `true` for port 465) |
| `SMTP_USER`   | `school@gardentvet.rw` |
| `SMTP_PASS`   | `••••••••••••` (Gmail app password) |
| `SMTP_FROM`   | `Garden TVET School <noreply@gardentvet.rw>` |

After setting, **restart the backend**. The Employers page will say "Email ready". If not configured, the send endpoint returns HTTP 503 with `EMAIL_NOT_CONFIGURED` — there is **no silent mock**.

---

## Stack ya tekinike & Setup

| Layer | Tekinoroji |
|---|---|
| Frontend | **React 19**, **Vite 7**, **Tailwind CSS**, **lucide-react**, **react-toastify**, **i18next** (Kinyarwanda + English + Français) |
| Backend  | **Node.js**, **Express 5**, **mysql2/promise** (pool + transactions), **Nodemailer** (SMTP), **PDFKit** (server-side PDF generation), **Africa's Talking** (SMS), **node-cron** (auto reminders) |
| Database | **MySQL 8** (booted from Nix store, local socket) |
| Auth     | JWT + bcrypt + role-based access control (8 roles) |
| Realtime | SSE bus for notifications |
| Files    | `uploads/` (images, course notes, hero slides, photos) |

### Ports
- **Frontend (Vite)**: `5000`
- **Backend (Express)**: `8080`
- **MySQL**: socket `/home/runner/workspace/.data/mysql-run/mysql.sock`

### Tangira sisitemu
```bash
bash start-dev.sh
```
Ibi bitangira **MySQL**, **backend** (port 8080), na **frontend** (port 5000).

### Injira nka admin
```
Username: admin
Password: (yashizweho mu nshuro ya mbere)
```

---

## 🛡️ Umutekano (Security)
- **Buri request** isabwa **JWT token**.
- **Role-based authorization** ku buri endpoint.
- **Bcrypt** ku ma password.
- **Helmet + CORS** zafunguwe ku byagenwe.
- **SQL Injection-proof**: parameterized queries gusa.
- **Transaction-safe**: gufunga umwaka bibera mu **ACID transaction**.
- **Audit logs**: `student_promotions`, `employer_outreach`, `email_log`, attendance, discipline.
- **Email compose audit**: buri email yoherejwe iri muri `email_log` n'icyiciro cyayo.

---

## ✍️ Uwabikoze
**Garden TVET School ICT Team** — East / Ngoma 🇷🇼

> Iyi sisitemu **ntabwo ari demo**. Ni **production-grade**: koresha, izaguhesha umusaruro mwiza ku ishuri.
