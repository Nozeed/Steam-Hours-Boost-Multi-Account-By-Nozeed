# 🚀 Steam Hours Boost Multi-Account

สคริปต์ Node.js สำหรับ **ดันชั่วโมงเกม Steam (idle farming)** หลายบัญชีพร้อมกันใน process เดียว

รองรับ Steam Guard, reconnect อัตโนมัติ, รีบูทตามรอบ, แจ้งเตือน Discord และมีไฟล์ `status.json` สำหรับดูสถานะรายบัญชี

> **⚠️ คำเตือน**
> การ idle เกมด้วยวิธีนี้อาจขัดต่อ Steam Subscriber Agreement และเสี่ยงถูกจำกัดหรือระงับบัญชี
> **ใช้ด้วยความเสี่ยงของคุณเอง** ผู้พัฒนาไม่รับผิดชอบต่อความเสียหายใด ๆ ทั้งสิ้น

---

## ✨ ฟีเจอร์

- 👥 หลายบัญชีใน process เดียว
- ⏱️ หน่วงสุ่ม 15–30 วินาทีระหว่างเริ่มแต่ละบัญชี
- 🔐 Steam Guard ทั้งแบบ `shared_secret` (อัตโนมัติ) และกรอกมือ
- 🔄 reconnect อัตโนมัติเมื่อหลุด
- 💤 หยุด idle ชั่วคราวเมื่อมีเซสชันอื่นเล่นเกม แล้วกลับมา boost ต่อเอง
- ♻️ รีบูทอัตโนมัติทุก 12–24 ชั่วโมง (สุ่ม)
- 🔔 แจ้งเตือน Discord (ไม่บังคับ)
- 📄 เขียน `status.json` ทุกครั้งที่สถานะเปลี่ยน + heartbeat ทุก 30 วินาที
- 🧹 ปิดระบบอย่างเรียบร้อยด้วย `Ctrl + C` / `SIGTERM`

---

## 📋 สิ่งที่ต้องมี

- **Node.js 18 ขึ้นไป** (แนะนำ 20 หรือ 22 LTS)
- **npm** (ติดมาพร้อม Node.js)
- บัญชี Steam ที่มีเกมที่ต้องการ boost
- `shared_secret` ของแต่ละบัญชี (ถ้าต้องการรัน 24/7 หรือใช้ PM2/systemd)

---

## ⚡ ติดตั้งและเริ่มใช้งาน

### 🪟 Windows (PowerShell)

```powershell
# 1) ติดตั้ง Node.js LTS (ถ้ายังไม่มี)
winget install OpenJS.NodeJS.LTS

# 2) เปิด PowerShell ใหม่ แล้วตรวจสอบ
node -v
npm -v

# 3) โหลดโปรเจกต์
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed

# 4) ติดตั้ง dependencies
npm install

# 5) สร้างไฟล์ตั้งค่า
Copy-Item settings.example.js settings.js
Copy-Item .env.example .env

# 6) แก้ไขข้อมูลบัญชี
notepad settings.js

# 7) ตรวจสอบค่าตั้งค่า (ไม่เชื่อมต่อ Steam)
npm run dry-run

# 8) เริ่มทำงาน
npm start
```

> ถ้า PowerShell ไม่รู้จัก `npm` ให้ลอง `npm.cmd install`, `npm.cmd start`
> หรือปิดแล้วเปิด terminal ใหม่หลังติดตั้ง Node.js

> ไม่มี Git? กด **Code → Download ZIP** บน GitHub แล้วแตกไฟล์ จากนั้นเปิด terminal ในโฟลเดอร์โปรเจกต์

### 🐧 Ubuntu / Debian

```bash
# 1) อัพเดตระบบและติดตั้งเครื่องมือพื้นฐาน
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl

# 2) ติดตั้ง Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# 3) ตรวจสอบเวอร์ชัน
node -v
npm -v

# 4) โหลดโปรเจกต์
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed

# 5) ติดตั้ง dependencies
npm ci

# 6) สร้างไฟล์ตั้งค่า
cp settings.example.js settings.js
cp .env.example .env

# 7) แก้ไขข้อมูลบัญชี
nano settings.js
nano .env

# 8) ตรวจสอบและเริ่มทำงาน
npm run dry-run
npm start
```

### 🐧 AlmaLinux / Rocky Linux / RHEL

```bash
sudo dnf update -y
sudo dnf install -y git curl
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed

npm ci
cp settings.example.js settings.js
cp .env.example .env
nano settings.js
npm run dry-run
npm start
```

> VPS ทั่วไปไม่ต้องเปิด inbound port สคริปต์เชื่อมต่อ Steam ผ่าน outbound เท่านั้น

---

## ⚙️ การตั้งค่า

### ไฟล์ที่สำคัญ

| ไฟล์ | หน้าที่ | ถูก ignore ใน Git |
|---|---|---|
| `settings.js` | ข้อมูลบัญชี + ค่าตั้งเวลา | ✅ |
| `.env` | `WEBHOOK_URL` และ secret | ✅ |
| `settings.example.js` | ตัวอย่าง settings | ❌ |
| `.env.example` | ตัวอย่าง env | ❌ |
| `status.json` | สถานะล่าสุด (สร้างอัตโนมัติ) | ✅ |

> **ห้าม commit `settings.js` หรือ `.env`** เพราะมีรหัสผ่านและ secret

### 1) ข้อมูลบัญชี (`settings.js`)

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

| ฟิลด์ | จำเป็น | คำอธิบาย |
|---|---|---|
| `username` | ✅ | ชื่อบัญชี Steam (ไม่ใช่ชื่อแสดงผล) |
| `password` | ✅ | รหัสผ่าน |
| `shared_secret` | ❌ | secret สำหรับสร้าง Steam Guard code อัตโนมัติ |
| `games` | ✅ | array ของ AppID / ชื่อเกม / object (ว่างได้ = ออนไลน์เฉย ๆ) |
| `status` | ❌ | `1` = Online (ค่าเริ่มต้น), `7` = Invisible |

#### รูปแบบ `games`

```javascript
games: [
  730,                                  // AppID
  "Boost By Nozeed",                    // ชื่อเกมนอก Steam
  { appid: 570, name: "Dota 2" },       // object
]
```

- AppID หาได้จาก <https://steamdb.info/>
- ตัวอย่าง: `730` = Counter-Strike 2, `440` = Team Fortress 2, `570` = Dota 2, `578080` = PUBG
- ชื่อที่เป็น string จะเป็น "เกมนอก Steam" และ Steam ไม่นับชั่วโมงให้
- `games: []` = ออนไลน์เฉย ๆ ไม่ boost

### 2) Discord Webhook (`.env`)

1. เข้า Discord Server → **Server Settings**
2. **Integrations → Webhooks → New Webhook**
3. เลือก channel แล้วกด **Copy Webhook URL**
4. ใส่ใน `.env`

```env
WEBHOOK_URL=https://discord.com/api/webhooks/xxxxxxxx/yyyyyyyy
```

ถ้าไม่ต้องการแจ้งเตือน ให้เว้นว่างไว้

### 3) ค่าตั้งเวลา (`settings.js`)

| ค่า | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `MIN_START_DELAY_MS` | `15000` | หน่วงต่ำสุดก่อนเริ่มบัญชีถัดไป |
| `MAX_START_DELAY_MS` | `30000` | หน่วงสูงสุดก่อนเริ่มบัญชีถัดไป |
| `LOGGED_ELSEWHERE_RETRY_MS` | `7200000` | ลองใหม่เมื่อบัญชีถูกใช้ที่อื่น (2 ชม.) |
| `RECONNECT_DELAY_MS` | `1800000` | ลองใหม่เมื่อ error ทั่วไป (30 นาที) |
| `DISCONNECT_RETRY_MS` | `300000` | watchdog เมื่อหลุดการเชื่อมต่อ (5 นาที) |
| `LOGON_TIMEOUT_MS` | `120000` | timeout การล็อกอิน (2 นาที) |
| `REBOOT_MIN_MS` | `43200000` | รีบูทเร็วสุดทุก 12 ชม. |
| `REBOOT_MAX_MS` | `86400000` | รีบูทช้าสุดทุก 24 ชม. |
| `REBOOT_RELOGIN_MIN_MS` | `5000` | รอก่อน logOn ใหม่หลังรีบูท (ต่ำสุด) |
| `REBOOT_RELOGIN_MAX_MS` | `15000` | รอก่อน logOn ใหม่หลังรีบูท (สูงสุด) |
| `SHUTDOWN_GRACE_MS` | `2000` | เวลารอก่อนปิด process |

> ถ้าตั้ง `MIN > MAX` ระบบจะสลับค่าให้อัตโนมัติ

---

## 🔐 Steam Guard

### วิธีที่แนะนำ: `shared_secret`

ใช้สร้าง 2FA code อัตโนมัติ เหมาะกับการรัน 24/7, PM2 และ systemd

วิธีหา `shared_secret`:

- ใช้ **Steam Desktop Authenticator (SDA)** หรือ **steamguard-cli**
- เปิด Steam Guard บนมือถือก่อน
- ดึงค่าจาก `maFile` ของบัญชีนั้น

```javascript
{
  username: "your_username",
  password: "your_password",
  shared_secret: "abcdefghijklmnop1234567890",
  games: [730],
}
```

> `shared_secret` ใช้ยืนยันตัวตนได้ ต้องเก็บเป็นความลับเหมือนรหัสผ่าน

### กรอกมือ (Manual)

- ใช้เมื่อไม่มี `shared_secret`
- ต้องรันใน terminal ที่มี TTY เท่านั้น
- **ใช้กับ PM2 / systemd ไม่ได้**
- ถ้ากรอกรหัสผิด ระบบจะรอ 30 วินาทีก่อนขอรหัสใหม่
- ถ้า `shared_secret` ผิดติดกันเกิน 3 ครั้ง บัญชีนั้นจะหยุดจนกว่าจะ restart

---

## 🧪 คำสั่งทั้งหมด

คำสั่ง `npm` ใช้เหมือนกันทั้ง Windows และ Linux (ถ้า PowerShell ไม่รู้จัก `npm` ให้ใช้ `npm.cmd`)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm install` | ติดตั้ง dependencies |
| `npm start` | เริ่มระบบและสร้าง `status.json` |
| `npm run dev` | เริ่มแบบ watch ด้วย nodemon |
| `npm run dry-run` | ตรวจ `settings.js` โดยไม่เชื่อมต่อ Steam และไม่สร้าง `status.json` |
| `npm run check` | ตรวจ syntax ไฟล์ JS |
| `npm run status` | แสดงสถานะรายบัญชีจาก `status.json` |
| `npm run status:check` | เหมือน `status` แต่คืน exit code 1 ถ้ามีปัญหา |
| `npm run pm2:start` | เริ่มผ่าน PM2 |
| `npm run pm2:logs` | ดู log PM2 |

### หยุดโปรแกรม

กด `Ctrl + C` ระบบจะ logOff ทุกบัญชี เขียนสถานะสุดท้ายเป็น `stopped` แล้วปิดอย่างเรียบร้อย

---

## 📄 ดูสถานะด้วย `status.json`

`index.js` จะสร้าง `status.json` ที่โฟลเดอร์โปรเจกต์อัตโนมัติเมื่อรัน `npm start` (ไม่สร้างตอน `dry-run`)

- เขียนใหม่ทุกครั้งที่สถานะบัญชีเปลี่ยน
- heartbeat ทุก 30 วินาที
- เขียนแบบ atomic (เขียนไฟล์ชั่วคราวแล้ว rename) เพื่อไม่ให้อ่านไฟล์ไม่ครบ
- เก็บ username แบบปิดบางส่วน เช่น `tes***`
- ไฟล์นี้อยู่ใน `.gitignore` แล้ว

### ดูแบบสรุป

```bash
npm run status
```

ตัวอย่างผลลัพธ์:

```text
Steam Boost Status
──────────────────────────────────────────────────────────────
PID: 12345 (running)
Started: 2026-11-07 21:30:00
Updated: 2026-11-07 21:35:12 (3 วินาทีที่แล้ว)
──────────────────────────────────────────────────────────────
#   บัญชี           สถานะ                         เกม   อัปเดต                หมายเหตุ
#1  use***          🟢 ออนไลน์                    6     2026-11-07 21:35:10   ล็อกอินสำเร็จ
#2  abc***          🔴 error                      2     2026-11-07 21:34:50   รหัสผ่านไม่ถูกต้อง
#3  xyz***          🟠 รอ retry                   3     2026-11-07 21:35:00   retry: 2026-11-07 22:05:00
──────────────────────────────────────────────────────────────
สรุป: ออนไลน์ 1 / 3 | ออฟไลน์ 2
```

### ใช้กับ monitoring

```bash
npm run status:check
```

- exit `0` = ทุกบัญชีออนไลน์ + process ยังอยู่ + ไฟล์สถานะไม่เก่าเกิน 90 วินาที
- exit `1` = มีบัญชีออฟไลน์, ไม่พบ process, ไฟล์เก่าเกิน 90 วินาที หรืออ่านไฟล์ไม่ได้

เหมาะกับ cron, Uptime Kuma หรือ health check

### ความหมายของสถานะ

| สถานะ | ความหมาย |
|---|---|
| `starting` | รอเริ่มระบบ |
| `logging_in` | กำลังล็อกอิน |
| `online` | ออนไลน์และกำลัง boost |
| `online_blocked` | ออนไลน์แต่หยุด idle ชั่วคราว |
| `waiting_steam_guard` | รอ Steam Guard code |
| `waiting_retry` | รอ retry ตามเวลา |
| `logged_elsewhere` | บัญชีถูกใช้งานจากที่อื่น |
| `reconnecting` | หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่ |
| `rebooting` | กำลัง logOff → logOn ใหม่ |
| `error` | เกิดข้อผิดพลาด ดูหมายเหตุ |
| `stopped` | หยุดแล้ว |

> ถ้าไฟล์ `status.json` เสียหายหรืออ่านไม่ได้ ให้ลบไฟล์แล้วรัน `npm start` ใหม่

---

## 🔁 รัน 24/7

### PM2 (Windows และ Linux)

```bash
# Linux ใช้ sudo, Windows ไม่ต้องใช้
sudo npm install -g pm2

pm2 start ecosystem.config.js
pm2 logs steam-boost
pm2 status
```

คำสั่งที่ใช้บ่อย:

```bash
pm2 restart steam-boost
pm2 stop steam-boost
pm2 delete steam-boost
```

ให้เริ่มอัตโนมัติหลังบูตเครื่อง (Linux):

```bash
pm2 startup
pm2 save
```

> PM2 ไม่มี TTY จึงต้องใช้ `shared_secret` เท่านั้น

### systemd (Linux)

สร้างไฟล์ service:

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
KillSignal=SIGINT
TimeoutStopSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

เปิดใช้งาน:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now steam-boost
sudo systemctl status steam-boost

# ดู log แบบ realtime
sudo journalctl -u steam-boost -f
```

> เปลี่ยน `YOUR_USER` และ path ให้ตรงกับเครื่องจริง
> ตรวจตำแหน่ง node ด้วย `which node` แล้วแก้ `ExecStart` ให้ตรง

### Windows Task Scheduler (ทางเลือก)

ถ้าไม่ใช้ PM2 สามารถตั้ง Task Scheduler ให้รัน `npm start` ตอน login หรือตอนบูตเครื่องได้
แต่แนะนำ PM2 เพราะจัดการ restart และ log ได้ง่ายกว่า

---

## 📁 โครงสร้างโปรเจกต์

```text
.
├── index.js               # logic หลัก + เขียน status.json
├── status.js              # อ่านสถานะ (npm run status)
├── status.json            # สถานะล่าสุด (สร้างอัตโนมัติ, gitignored)
├── settings.js            # ข้อมูลบัญชี (gitignored)
├── settings.example.js    # ตัวอย่าง settings
├── .env                   # webhook / secrets (gitignored)
├── .env.example           # ตัวอย่าง env
├── ecosystem.config.js    # config PM2
├── package.json
├── package-lock.json
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md
```

---

## 🧯 แก้ปัญหาเบื้องต้น

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Cannot find module 'dotenv'` | ยังไม่ได้รัน `npm install` |
| `ไม่พบไฟล์ settings.js` | คัดลอก `settings.example.js` เป็น `settings.js` |
| `ไม่พบบัญชีที่ใช้งานได้` | ตรวจ `username`, `password` และ `games` ต้องเป็น array |
| PowerShell รัน `npm` ไม่ได้ | ใช้ `npm.cmd` หรือเปิด terminal ใหม่ |
| `EACCES` ตอนติดตั้ง PM2 (Linux) | ใช้ `sudo npm install -g pm2` |
| `ต้องกรอก Steam Guard แต่ไม่ได้รันแบบ interactive` | ใส่ `shared_secret` หรือรันใน terminal ปกติ |
| `รหัสผ่านไม่ถูกต้อง` | ตรวจ `username` / `password` |
| `บัญชีถูกใช้งานจากที่อื่น` | ปิด Steam client เครื่องอื่น หรือรอ retry 2 ชม. |
| `ยังไม่มีไฟล์สถานะ (status.json)` | ยังไม่เคยรัน `npm start` (dry-run ไม่สร้างไฟล์) |
| `อ่าน status.json ไม่สำเร็จ` | ไฟล์เสียหาย ให้ลบ `status.json` แล้วรัน `npm start` ใหม่ |
| `npm run status` ขึ้นเตือนไฟล์เก่า | process อาจหยุดหรือค้าง ตรวจ `pm2 status` / `systemctl status` |
| `npm run status:check` ได้ exit 1 | ดูตารางด้านบนว่าบัญชีไหนออฟไลน์ หรือ process/ไฟล์สถานะมีปัญหา |
| คอลัมน์ตาราง `npm run status` เหลื่อม | เป็นเรื่องการนับความกว้างตัวอักษรไทย อ่านค่าจากแต่ละคอลัมน์แทน |

### ดู log

- รันตรง: ดูใน terminal
- PM2: `pm2 logs steam-boost`
- systemd: `sudo journalctl -u steam-boost -f`

---

## 🐞 ข้อจำกัดที่ทราบ

| อาการ | สาเหตุ / ผลกระทบ |
|---|---|
| ขึ้น `บัญชีไม่ถูกต้อง` ทั้งที่เน็ตหลุด | การแปล `EResult` บาง code ไม่ตรง (เช่น code `3`) ให้ดู code ใน log ประกอบ |
| `shared_secret` ผิดติดกันเกิน 3 ครั้ง | บัญชีนั้นหยุดจนกว่าจะ restart process |
| `uncaughtException` แล้วโปรแกรมค้าง | handler แค่ log/แจ้ง Discord ไม่ได้ exit เอง |
| กด `Ctrl + C` ระหว่างหน่วงเริ่มบัญชี | สถานะของบัญชีที่ยังไม่เริ่มอาจค้างเป็น `starting` จนกว่ารันใหม่ |
| ใช้ Steam Guard แบบกรอกมือกับ PM2/systemd | ไม่ได้ เพราะไม่มี TTY ต้องใช้ `shared_secret` |

---

## 🔒 ความปลอดภัย

1. **ห้าม commit** `settings.js` และ `.env`
2. ถ้าเคย commit ไปแล้ว ให้เอาไฟล์ออกจาก Git แต่เก็บไว้ในเครื่อง:
   ```bash
   git rm --cached settings.js .env
   git commit -m "remove secrets from repository"
   ```
3. ถ้า webhook หลุด ให้กด Reset แล้วสร้างใหม่
4. จำกัดสิทธิ์ไฟล์: `chmod 600 settings.js .env`
5. หลีกเลี่ยงการรันหลายบัญชีจาก IP เดียวกัน เพราะเสี่ยงถูก flag

---

## ⚖️ ข้อจำกัดความรับผิด

โปรเจกต์นี้จัดทำเพื่อการศึกษา การใช้งานอาจขัดต่อข้อกำหนดของ Steam
ผู้ใช้ต้องรับความเสี่ยงและผลที่เกิดขึ้นเองทั้งหมด ผู้พัฒนาไม่รับผิดชอบต่อการถูกระงับบัญชี
ข้อมูลสูญหาย หรือความเสียหายใด ๆ

---

## 📄 License

[MIT](LICENSE) © 2026 Nozeed
