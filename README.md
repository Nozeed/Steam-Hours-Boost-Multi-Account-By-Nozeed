# 🚀 Steam Hours Boost Multi-Account 🎮

สคริปต์ Node.js สำหรับ **ดันชั่วโมงเกม Steam (Idle farming)** รองรับหลายบัญชีพร้อมกันใน process เดียว
มีระบบหน่วงเวลาสุ่ม รองรับ Steam Guard ทั้งแบบอัตโนมัติ (`shared_secret`) และแบบกรอกมือผ่านคอนโซล
พร้อม reconnect อัตโนมัติ รีบูทตามรอบ และแจ้งเตือนผ่าน Discord Webhook (optional)

> **⚠️ คำเตือนสำคัญ**
> การ idle เกมด้วยวิธีนี้ **อาจขัดต่อ Steam Subscriber Agreement** และเสี่ยงโดน VAC ban หรือล็อกบัญชี
> **ใช้ด้วยความเสี่ยงและรับผิดชอบเอง** – ผู้พัฒนาไม่รับผิดชอบใด ๆ ทั้งสิ้น

---

## ✨ คุณสมบัติ

- 👥 **Multi-Account** – ใส่ได้หลายบัญชี ไม่จำกัดจำนวน (ขึ้นกับทรัพยากรเครื่อง)
- ⏱️ **Smart Random Delay** – หน่วง 15–30 วินาทีระหว่างเริ่มแต่ละบัญชี (ปรับได้)
- 🔐 **Steam Guard** – รองรับทั้ง `shared_secret` (อัตโนมัติ) และกรอก code เอง
- 🔄 **Auto Reconnect** – ใช้ `autoRelogin` ของ `steam-user` + watchdog ถ้าหลุดนานเกินกำหนด
- 💤 **Smart Playing State** – หยุด idle ชั่วคราวถ้าตรวจพบว่าคุณกำลังเล่นเกมจากเซสชันอื่น แล้วกลับมา boost ต่อเอง
- ♻️ **Auto Reboot** – logOff → logOn ใหม่ทุก 12–24 ชั่วโมง (สุ่ม)
- 🔔 **Discord Webhook** – แจ้งสถานะออนไลน์ / รีบูท / error / หลุดการเชื่อมต่อ (optional)
- 🛡️ **Validation** – ตรวจ settings และบัญชีตั้งแต่เริ่มระบบ พร้อม log ภาษาไทย
- 🧹 **Graceful Shutdown** – รองรับ `SIGINT` / `SIGTERM` และ logOff ทุกบัญชีก่อนปิด
- 🇹🇭 Log ภาษาไทย พร้อม timestamp (เวลาไทย)

---

## 📋 สิ่งที่ต้องมี

- **Node.js ≥ 18** (แนะนำ LTS v20 หรือ v22)
- **npm** (มาพร้อม Node.js)
- บัญชี Steam ที่มีเกมที่ต้องการ boost
- (ถ้าใช้ Steam Guard) `shared_secret` ของแต่ละบัญชี

---

## 🪟 ติดตั้งบน Windows

### 1. ติดตั้ง Node.js

เลือกวิธีใดวิธีหนึ่ง:

**วิธี A – ดาวน์โหลดตัวติดตั้ง**

1. ไปที่ <https://nodejs.org/en/download>
2. ดาวน์โหลด **LTS** (Windows Installer `.msi`)
3. ติดตั้งด้วยค่าเริ่มต้น แล้ว **ปิด-เปิด terminal ใหม่**

**วิธี B – ใช้ winget (Windows 10/11)**

```powershell
winget install OpenJS.NodeJS.LTS
```

### 2. ตรวจสอบเวอร์ชัน

เปิด **PowerShell** หรือ **Command Prompt** แล้วรัน:

```powershell
node -v
npm -v
```

ควรได้ `v20.x` หรือสูงกว่า

### 3. ดาวน์โหลดโปรเจกต์

```powershell
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed
```

ถ้าไม่มี git สามารถกด **Code → Download ZIP** จากหน้า GitHub แล้วแตกไฟล์ก็ได้

### 4. ติดตั้ง dependencies

```powershell
npm install
```

### 5. สร้างไฟล์ตั้งค่า

```powershell
Copy-Item settings.example.js settings.js
Copy-Item .env.example .env
```

จากนั้นแก้ไข `settings.js` (ข้อมูลบัญชี) และ `.env` (webhook) ตามหัวข้อ [การตั้งค่า](#️-การตั้งค่า)

### 6. ตรวจสอบค่าตั้งค่า

```powershell
npm run dry-run
```

คำสั่งนี้จะตรวจ `settings.js` และแสดงจำนวนบัญชี/เกม โดย **ไม่เชื่อมต่อ Steam**

### 7. เริ่มใช้งาน

```powershell
npm start
```

> **หมายเหตุ:** ถ้า PowerShell ไม่ยอมรัน `npm` ให้ลองใช้ `npm.cmd` เช่น `npm.cmd install`
> หรือเปิด PowerShell ใหม่หลังติดตั้ง Node.js

---

## 🐧 ติดตั้งบน Linux VPS

### Ubuntu / Debian

```bash
# อัพเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้งเครื่องมือพื้นฐาน
sudo apt install -y git curl

# ติดตั้ง Node.js LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# ตรวจสอบเวอร์ชัน
node -v
npm -v

# Clone โปรเจกต์
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed

# ติดตั้ง dependencies
npm ci

# สร้างไฟล์ตั้งค่า
cp settings.example.js settings.js
cp .env.example .env
nano settings.js   # ใส่ข้อมูลบัญชี
nano .env          # ใส่ WEBHOOK_URL (ถ้าใช้)

# ตรวจสอบค่าตั้งค่า
npm run dry-run

# ทดสอบรัน
npm start
```

### Alma Linux / RHEL / Rocky Linux

```bash
# อัพเดตระบบ
sudo dnf update -y

# ติดตั้งเครื่องมือพื้นฐาน
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y git curl

# ติดตั้ง Node.js LTS (NodeSource)
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

# ตรวจสอบเวอร์ชัน
node -v
npm -v

# Clone โปรเจกต์
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed

# ติดตั้ง dependencies
npm ci

# สร้างไฟล์ตั้งค่า
cp settings.example.js settings.js
cp .env.example .env
nano settings.js
nano .env

# ตรวจสอบและทดสอบ
npm run dry-run
npm start
```

> **Firewall:** โดยทั่วไป VPS เปิด outbound อยู่แล้ว สคริปต์ต้องเชื่อมต่อ Steam ผ่าน TCP/UDP
> (พอร์ตหลัก 443 และช่วง 27015–27050) ไม่ต้องเปิด inbound port ใด ๆ

---

## ⚙️ การตั้งค่า

### ไฟล์ที่ต้องสนใจ

| ไฟล์ | หน้าที่ | ถูก ignore ใน git |
|---|---|---|
| `settings.js` | ข้อมูลบัญชี + ค่าตั้งเวลาต่าง ๆ | ✅ |
| `.env` | `WEBHOOK_URL` (และ secret อื่น ๆ) | ✅ |
| `settings.example.js` | ตัวอย่างสำหรับเครื่องใหม่ | ❌ |
| `.env.example` | ตัวอย่าง env | ❌ |

> **ห้าม commit `settings.js` หรือ `.env` ขึ้น GitHub เด็ดขาด**
> โปรเจกต์มี `.gitignore` กันไว้แล้ว แต่ควรตรวจสอบก่อน push ทุกครั้ง

### 1. ข้อมูลบัญชี (`settings.js`)

```javascript
accounts: [
  {
    username: "your_username",
    password: "your_password",
    shared_secret: "",       // ใส่ถ้าเปิด Steam Guard
    games: [730, 570],       // AppID หรือชื่อเกมนอก Steam
    status: 1,               // 1 = Online, 7 = Invisible
  },
  {
    username: "second_account",
    password: "second_password",
    shared_secret: "abcdefghijklmnop1234567890",
    games: ["Boost By Nozeed", 440],
    status: 7,
  },
],
```

#### รูปแบบของ `games`

รองรับ 3 แบบ (ใส่ผสมกันได้):

```javascript
games: [
  730,                                  // 1) AppID
  "Boost By Nozeed",                    // 2) ชื่อเกมนอก Steam (custom game name)
  { appid: 570, name: "Dota 2" },       // 3) object
]
```

- AppID หาได้จาก <https://steamdb.info/>
- ตัวอย่าง AppID ยอดนิยม: `730` = Counter-Strike 2, `440` = Team Fortress 2, `570` = Dota 2,
  `578080` = PUBG: BATTLEGROUNDS, `381210` = Dead by Daylight
- ชื่อที่เป็น string จะแสดงเป็น "เกมนอก Steam" (Steam ไม่นับชั่วโมงให้เกมนั้น)
- ถ้า `games: []` บัญชีนั้นจะออนไลน์เฉย ๆ โดยไม่ boost

#### ฟิลด์ของแต่ละบัญชี

| ฟิลด์ | จำเป็น | คำอธิบาย |
|---|---|---|
| `username` | ✅ | ชื่อบัญชี Steam (ไม่ใช่ชื่อแสดงผล) |
| `password` | ✅ | รหัสผ่าน |
| `shared_secret` | ❌ | secret สำหรับสร้าง Steam Guard code อัตโนมัติ |
| `games` | ✅ | array ของ AppID / ชื่อเกม / object (ว่างได้ = ออนไลน์เฉย ๆ) |
| `status` | ❌ | `1` = Online (ค่าเริ่มต้น), `7` = Invisible |

### 2. Discord Webhook (`.env`)

สร้าง webhook ที่ Discord:

1. เข้า Server ที่ต้องการ → **Server Settings**
2. **Integrations → Webhooks → New Webhook**
3. ตั้งชื่อ เลือก channel แล้วกด **Copy Webhook URL**
4. ใส่ใน `.env`:

```env
WEBHOOK_URL=https://discord.com/api/webhooks/xxxxxxxx/yyyyyyyy
```

ถ้าไม่ต้องการแจ้งเตือน ให้เว้นว่างไว้ได้

> **สำคัญ:** ค่า webhook เดิมเคยฝังอยู่ใน `settings.js` (และอาจถูก commit ไปแล้ว)
> แนะนำให้ **สร้าง webhook ใหม่หรือกด Reset** ใน Discord แล้วใส่ค่าใหม่ใน `.env`

### 3. ค่าตั้งเวลาต่าง ๆ (`settings.js`)

| ค่า | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `MIN_START_DELAY_MS` | `15000` | หน่วงต่ำสุดก่อนเริ่มบัญชีถัดไป (15 วินาที) |
| `MAX_START_DELAY_MS` | `30000` | หน่วงสูงสุดก่อนเริ่มบัญชีถัดไป (30 วินาที) |
| `LOGGED_ELSEWHERE_RETRY_MS` | `7200000` | ลองใหม่เมื่อบัญชีถูกใช้จากที่อื่น (2 ชม.) |
| `RECONNECT_DELAY_MS` | `1800000` | ลองใหม่เมื่อ error ทั่วไป (30 นาที) |
| `DISCONNECT_RETRY_MS` | `300000` | watchdog เมื่อหลุดการเชื่อมต่อ (5 นาที) |
| `LOGON_TIMEOUT_MS` | `120000` | timeout ของการล็อกอิน (2 นาที) |
| `REBOOT_MIN_MS` | `43200000` | รีบูทเร็วสุดทุก 12 ชม. |
| `REBOOT_MAX_MS` | `86400000` | รีบูทช้าสุดทุก 24 ชม. |
| `REBOOT_RELOGIN_MIN_MS` | `5000` | รอก่อน logOn ใหม่หลังรีบูท (ต่ำสุด) |
| `REBOOT_RELOGIN_MAX_MS` | `15000` | รอก่อน logOn ใหม่หลังรีบูท (สูงสุด) |
| `SHUTDOWN_GRACE_MS` | `2000` | เวลารอก่อนปิด process |

> ถ้าตั้ง `MIN > MAX` ระบบจะสลับค่าให้อัตโนมัติและแจ้งเตือนใน log

---

## 🔐 การจัดการ Steam Guard

### 1. อัตโนมัติด้วย `shared_secret` (แนะนำสำหรับ 24/7)

- ใช้ `shared_secret` สร้าง 2FA code อัตโนมัติทุกครั้งที่ login
- วิธีหา `shared_secret`:
  - ใช้ **Steam Desktop Authenticator (SDA)** หรือ **steamguard-cli**
  - เปิด Steam Guard บนมือถือก่อน
  - ดึงค่าจาก `maFile` ของบัญชีนั้น
- ใส่ใน `settings.js`:

```javascript
{
  username: "your_username",
  password: "your_password",
  shared_secret: "abcdefghijklmnop1234567890",
  games: [730],
}
```

> `shared_secret` ใช้ยืนยันตัวตนได้ จึงต้องเก็บเป็นความลับเหมือนรหัสผ่าน
> ถ้าเครื่องถูกบุกรุก ให้ revoke Steam Guard แล้วตั้งใหม่

### 2. กรอกมือ (Manual)

- ถ้าไม่มี `shared_secret` สคริปต์จะขอให้กรอก code ผ่านคอนโซล
- ต้องรันใน terminal ที่เป็น interactive (มี TTY) เท่านั้น
- **ใช้กับ PM2 / systemd ไม่ได้** เพราะไม่มี TTY — ต้องใช้ `shared_secret` เท่านั้น
- ถ้ากรอกรหัสผิด ระบบจะรอ 30 วินาทีก่อนสร้าง/ขอรหัสใหม่ (กัน login loop)

---

## ▶️ การใช้งาน

### ตรวจสอบค่าตั้งค่า (ไม่เชื่อมต่อ Steam)

```bash
npm run dry-run
```

### รันปกติ

```bash
npm start
```

หรือ

```bash
node index.js
```

### หยุดโปรแกรม

กด `Ctrl + C` ระบบจะ logOff ทุกบัญชีและปิดอย่างเรียบร้อย

---

## 🔁 รัน 24/7 ด้วย PM2 (แนะนำสำหรับ VPS)

```bash
# ติดตั้ง PM2 แบบ global
sudo npm install -g pm2

# รันจากไฟล์ ecosystem.config.js
pm2 start ecosystem.config.js

# ดู log
pm2 logs steam-boost

# ดูสถานะ
pm2 status

# restart / stop / delete
pm2 restart steam-boost
pm2 stop steam-boost
pm2 delete steam-boost

# ให้เริ่มอัตโนมัติหลัง reboot
pm2 startup
pm2 save
```

> **หมายเหตุ:** ถ้าใช้ Steam Guard แบบกรอกมือ จะใช้กับ PM2 ไม่ได้
> ให้ใส่ `shared_secret` ใน `settings.js` ก่อน

### Windows 24/7

PM2 ใช้ได้บน Windows เช่นกัน:

```powershell
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs steam-boost
pm2 save
```

หรือใช้ **Task Scheduler** ของ Windows ตั้งให้รัน `npm start` ตอน login/บูตเครื่อง

---

## 🧷 รัน 24/7 ด้วย systemd (ทางเลือกสำหรับ Linux)

ถ้าไม่ใช้ PM2 สามารถใช้ systemd ได้ สร้างไฟล์ service:

```bash
sudo nano /etc/systemd/system/steam-boost.service
```

```ini
[Unit]
Description=Steam Hours Boost Multi-Account
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/home/YOUR_USER/Steam-Hours-Boost-Multi-Account-By-Nozeed
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

> เปลี่ยน `YOUR_USER` และ path ให้ตรงกับเครื่องจริง
> ตรวจตำแหน่ง node ด้วย `which node` แล้วแก้ `ExecStart` ให้ตรง

เปิดใช้งาน:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now steam-boost
sudo systemctl status steam-boost

# ดู log แบบ realtime
sudo journalctl -u steam-boost -f
```

> systemd ไม่มี TTY เช่นเดียวกับ PM2 → ต้องใช้ `shared_secret` เท่านั้น

---

## 🧠 พฤติกรรมของระบบ

| สถานการณ์ | สิ่งที่ระบบทำ |
|---|---|
| เริ่มระบบ | เริ่มบัญชีทีละบัญชีโดยหน่วง 15–30 วินาที |
| Login สำเร็จ | ตั้ง persona + เริ่ม `gamesPlayed` + แจ้ง Discord + ตั้งรอบรีบูท |
| หลุดการเชื่อมต่อ | `steam-user` พยายาม reconnect เอง + watchdog 5 นาที |
| Error ทั่วไป | ลองใหม่ตาม `RECONNECT_DELAY_MS` (30 นาที) |
| รหัสผ่านผิด (`eresult 5`) | หยุดลองใหม่เฉพาะบัญชีนั้น + แจ้ง Discord |
| บัญชีถูกใช้จากที่อื่น (`eresult 6`) | ลองใหม่ทุก `LOGGED_ELSEWHERE_RETRY_MS` (2 ชม.) |
| มีเซสชันอื่นกำลังเล่นเกม | หยุด idle ชั่วคราว + แจ้ง Discord แล้วกลับมา boost ต่อเมื่อเซสชันนั้นเลิก |
| ครบรอบรีบูท | logOff → รอ 5–15 วินาที → logOn ใหม่ |
| กด `Ctrl + C` / `SIGTERM` | logOff ทุกบัญชีแล้วปิด process |

---

## 🧪 คำสั่งที่มีให้

| คำสั่ง | ทำอะไร |
|---|---|
| `npm start` | เริ่มระบบ |
| `npm run dev` | เริ่มแบบ watch ด้วย nodemon |
| `npm run dry-run` | ตรวจ settings โดยไม่เชื่อมต่อ Steam |
| `npm run check` | ตรวจ syntax ของไฟล์ JS |
| `npm run pm2:start` | เริ่มผ่าน PM2 |
| `npm run pm2:logs` | ดู log PM2 |

---

## 🧯 แก้ปัญหาเบื้องต้น

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Cannot find module 'dotenv'` | ยังไม่ได้ `npm install` |
| `ไม่พบบัญชีที่ใช้งานได้ใน settings.js` | ยังไม่ได้ copy `settings.example.js` เป็น `settings.js` หรือข้อมูลไม่ครบ |
| `WEBHOOK_URL ไม่ถูกต้อง` | URL ต้องขึ้นต้นด้วย `https://discord.com/api/webhooks/...` |
| `ต้องกรอก Steam Guard แต่ไม่ได้รันแบบ interactive` | ใส่ `shared_secret` หรือรันใน terminal ปกติ (ไม่ใช่ PM2) |
| `รหัสผ่านไม่ถูกต้อง` | ตรวจ `username` / `password` ใน `settings.js` |
| `บัญชีถูกใช้งานจากที่อื่น` | ปิด Steam client เครื่องอื่น หรือรอรอบ retry 2 ชม. |
| `EACCES` ตอน `npm install -g pm2` (Linux) | ใช้ `sudo npm install -g pm2` |
| PowerShell รัน `npm` ไม่ได้ | ใช้ `npm.cmd` หรือเปิด terminal ใหม่หลังติดตั้ง Node.js |
| Node เวอร์ชันเก่า | อัปเดตเป็น Node 20/22 ตามหัวข้อติดตั้ง |
| `npm audit` แจ้ง vulnerabilities | เป็น dependency ทางอ้อมของ `steam-user`; ตรวจด้วย `npm audit` และอย่ารัน `npm audit fix --force` โดยไม่ตรวจสอบ |

### ดู log

- รันตรง: ดูใน terminal
- PM2: `pm2 logs steam-boost`
- ดูย้อนหลัง: `pm2 logs steam-boost --lines 200`

---

## 🔒 ความปลอดภัย

1. **ห้าม commit** `settings.js` และ `.env` — มี `.gitignore` กันไว้แล้ว
2. ถ้าเคย commit ไฟล์เหล่านี้ไปแล้ว ให้เอาไฟล์ออกจาก git (แต่เก็บไว้ในเครื่อง):
   ```bash
   git rm --cached settings.js .env
   git commit -m "remove secrets from repository"
   ```
3. **Rotate Discord webhook** ถ้าเคยเอาค่าไปวางที่สาธารณะ
4. ใช้ `shared_secret` เท่าที่จำเป็น และเก็บไฟล์ให้สิทธิ์จำกัด เช่น `chmod 600 settings.js .env`
5. จำกัดสิทธิ์การเข้าถึง VPS (SSH key, firewall, ไม่ใช้รหัสผ่านง่าย ๆ)
6. หลีกเลี่ยงการรันบัญชีจำนวนมากจาก IP เดียวกัน เพราะเสี่ยงถูก flag

---

## 📁 โครงสร้างโปรเจกต์

```text
.
├── index.js               # logic หลัก
├── settings.js            # ข้อมูลบัญชี + ค่าตั้ง (gitignored)
├── settings.example.js    # ตัวอย่าง settings
├── .env                   # webhook / secrets (gitignored)
├── .env.example           # ตัวอย่าง env
├── ecosystem.config.js    # config สำหรับ PM2
├── package.json
├── package-lock.json
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md
```

---

## ⚖️ ข้อจำกัดความรับผิด

สคริปต์นี้จัดทำเพื่อการศึกษาเท่านั้น การใช้งานอาจขัดต่อข้อกำหนดของ Steam
ผู้ใช้ต้องรับความเสี่ยงและผลที่เกิดขึ้นเองทั้งหมด ผู้พัฒนาไม่รับผิดชอบต่อการถูกระงับบัญชี
ข้อมูลสูญหาย หรือความเสียหายใด ๆ ทั้งสิ้น

---

## 📄 License

[MIT](LICENSE) © 2026 Nozeed
