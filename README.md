# 🚀 Steam Hours Boost Multi-Account 🎮

สคริปต์ Node.js สำหรับ **ดันชั่วโมงเกม Steam (Idle farming)** รองรับหลายบัญชีพร้อมกันใน process เดียว  
มีระบบหน่วงเวลาสุ่ม + รองรับ Steam Guard ทั้งแบบอัตโนมัติ (shared_secret) และกรอกมือผ่านคอนโซล

**⚠️ คำเตือนสำคัญ**  
การ idle เกมด้วยวิธีนี้ **อาจขัดต่อ Steam Subscriber Agreement** (ข้อ 3.A) และเสี่ยงโดน VAC ban หรือ lock บัญชีในบางกรณี  
**ใช้ด้วยความเสี่ยงและรับผิดชอบเอง** – ผู้พัฒนาไม่รับผิดชอบใด ๆ ทั้งสิ้น

---

## ✨ คุณสมบัติเด่น

- 👥 **Multi-Account** ไม่จำกัดจำนวนบัญชี
- ⏱️ **Smart Random Delay** 12–20 วินาทีระหว่าง login แต่ละบัญชี (ลดโอกาสถูก flag)
- 🔐 **Steam Guard** รองรับทั้ง auto (shared_secret) และ manual input
- 🔄 **Auto Reconnect** + Retry เมื่อหลุด / logged elsewhere / error
- 💤 **Smart Playing State** หยุด idle ชั่วคราวถ้าคุณเล่นเกมจริง แล้วกลับมา boost ต่อเอง
- 🔔 **Discord Webhook** แจ้งสถานะออนไลน์/รีบูท (optional)
- 🇹🇭 Log และข้อความภาษาไทยชัดเจน

---

## 🛠️ การติดตั้ง

### Prerequisites
- Node.js ≥ 18 (แนะนำ LTS v20 หรือ v22)
- git

### ติดตั้งบน Ubuntu/Debian (VPS เช่น Contabo, Linode, Vultr)

```bash
# อัพเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# เช็คเวอร์ชัน
node -v   # ควรได้ v20.x หรือสูงกว่า
npm -v

# ติดตั้ง git (ถ้ายังไม่มี)
sudo apt install -y git

# Clone repo
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed
```

### ติดตั้งบน Alma Linux 9.7 (หรือ RHEL-based อื่น ๆ)

```bash
# อัพเดตระบบ
sudo dnf update -y

# ติดตั้ง build tools ที่จำเป็น
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y git curl

# ติดตั้ง Node.js LTS (ใช้ NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

# เช็คเวอร์ชัน
node -v   # ควรได้ v20.x หรือสูงกว่า
npm -v

# Clone repo
git clone https://github.com/Nozeed/Steam-Hours-Boost-Multi-Account-By-Nozeed.git
cd Steam-Hours-Boost-Multi-Account-By-Nozeed
```
### ติดตั้ง Dependencies
```bash
npm install
```

### ⚙️ การตั้งค่า
1. แก้ไขข้อมูลบัญชี
ใน settings.js (หรือ accounts.json ถ้ายังใช้เวอร์ชันเก่า)ดูตัวอย่างใน settings.js แล้วใส่ username, password, shared_secret (ถ้ามี), games (AppID)หา AppID เกมได้ที่: https://steamdb.info/ (ค้นชื่อเกม → ดู AppID)ตัวอย่าง games:
730 = Counter-Strike 2
440 = Team Fortress 2
570 = Dota 2
ฯลฯ

2. ความปลอดภัยไฟล์
ห้ามอัพโหลด settings.js / accounts.json ขึ้น GitHub หรือ public ที่ไหนเด็ดขาด
ใส่ไฟล์เหล่านี้ใน .gitignore
ถ้าใช้ VPS แนะนำเข้ารหัสไฟล์หรือใช้ environment variables แทน

3. Webhook Discord (optional)
แก้ WEBHOOK_URL ใน settings.js เพื่อรับแจ้งเตือนออนไลน์/รีบูท

### 🔐 การจัดการ Steam Guard

สคริปต์รองรับ Steam Guard 2 แบบ:

**1. Steam Guard อัตโนมัติ (แนะนำ)**
- ใช้ `shared_secret` เพื่อสร้าง 2FA code อัตโนมัติ
- วิธีหา `shared_secret`:
  - เปิด Steam Guard บนมือถือ
  - ใช้โปรแกรมอย่าง `maFile` หรือ `steamguard-cli` เพื่อดึงค่า
- ใส่ `shared_secret` ใน settings.js สำหรับแต่ละบัญชีที่มี Steam Guard
- ตัวอย่าง:
  ```javascript
  {
    username: "your_username",
    password: "your_password",
    shared_secret: "abcdefghijklmnop1234567890", // ใส่ค่านี้ถ้ามี Steam Guard
    games: [730, 440]
  }
  ```

**2. Steam Guard กรอกมือ (Manual Input)**
- ถ้าไม่มี `shared_secret` สคริปต์จะขอให้กรอก code ผ่านคอนโซล
- เมื่อ login แต่ละบัญชี จะมีข้อความให้กรอก 2FA code
- กรอก code 6 ตัวอักษรจาก Steam Guard บนมือถือ
- **ข้อควรระวัง:**
  - ถ้ารันด้วย PM2 ต้องดู log เพื่อกรอก code: `pm2 logs steam-boost`
  - ถ้าบัญชีมี Steam Guard และไม่ได้ใส่ `shared_secret` จะต้องกรอก code ทุกครั้งที่ login
  - แนะนำให้ใช้ `shared_secret` เพื่อความสะดวกและรันอัตโนมัติได้ 24/7

### ▶️ การใช้งาน
รันปกติ (ทดสอบ)
```bash
node index.js
# หรือ npm start
```

### รัน 24/7 บน VPS ด้วย PM2 (แนะนำมาก)
```bash
# ติดตั้ง PM2 global
sudo npm install -g pm2

# รัน
pm2 start index.js --name "steam-boost"

# ดู log (สำคัญมาก ถ้ามี Steam Guard manual จะให้กรอกที่นี่)
pm2 logs steam-boost

# คำสั่งอื่น
pm2 status
pm2 restart steam-boost
pm2 stop steam-boost
pm2 delete steam-boost

# รันอัตโนมัติตอนเครื่อง reboot
pm2 startup
pm2 save
```
