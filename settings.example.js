// settings.example.js
// คัดลอกไฟล์นี้เป็น settings.js แล้วใส่ข้อมูลจริง
// Windows (PowerShell): Copy-Item settings.example.js settings.js
// Linux/macOS:          cp settings.example.js settings.js
//
// ⚠️ ห้าม commit ไฟล์ settings.js ขึ้น Git (มี .gitignore กันไว้แล้ว)

const path = require("path");

require("dotenv").config({ quiet: true, path: path.join(__dirname, ".env") });

module.exports = {
  // ────────────────────────────────────────────────
  //               Webhook Discord
  // ────────────────────────────────────────────────
  // แนะนำให้ตั้งค่าใน .env แทน:
  //   WEBHOOK_URL=https://discord.com/api/webhooks/...
  WEBHOOK_URL: process.env.WEBHOOK_URL || "",

  // ────────────────────────────────────────────────
  //          การหน่วงเวลาเริ่มต้นบัญชี (milliseconds)
  // ────────────────────────────────────────────────
  MIN_START_DELAY_MS: 15000,
  MAX_START_DELAY_MS: 30000,

  // ────────────────────────────────────────────────
  //       การลองใหม่เมื่อ logged elsewhere
  // ────────────────────────────────────────────────
  LOGGED_ELSEWHERE_RETRY_MS: 7200000, // 2 ชั่วโมง

  // ────────────────────────────────────────────────
  //           การ reconnect เมื่อ error ทั่วไป
  // ────────────────────────────────────────────────
  RECONNECT_DELAY_MS: 1800000, // 30 นาที

  // ────────────────────────────────────────────────
  //        Watchdog เมื่อหลุดการเชื่อมต่อ
  // ────────────────────────────────────────────────
  DISCONNECT_RETRY_MS: 300000, // 5 นาที

  // ────────────────────────────────────────────────
  //              Timeout ของการล็อกอิน
  // ────────────────────────────────────────────────
  LOGON_TIMEOUT_MS: 120000, // 2 นาที

  // ────────────────────────────────────────────────
  //                 รอบการรีบูทอัตโนมัติ
  // ────────────────────────────────────────────────
  REBOOT_MIN_MS: 43200000, // 12 ชั่วโมง
  REBOOT_MAX_MS: 86400000, // 24 ชั่วโมง
  REBOOT_RELOGIN_MIN_MS: 5000,
  REBOOT_RELOGIN_MAX_MS: 15000,

  // ────────────────────────────────────────────────
  //               เวลารอก่อนปิดระบบ
  // ────────────────────────────────────────────────
  SHUTDOWN_GRACE_MS: 2000,

  // ────────────────────────────────────────────────
  //               ข้อมูลบัญชีทั้งหมด
  // ────────────────────────────────────────────────
  // games รองรับ 3 แบบ:
  //   1) AppID เป็นตัวเลข เช่น 730
  //   2) ชื่อเกมนอก Steam เป็น string เช่น "Boost By Nozeed"
  //   3) object { appid: 730, name: "CS2" }
  // status (optional): 1 = Online, 7 = Invisible
  accounts: [
    {
      username: "your_username",
      password: "your_password",
      shared_secret: "", // ใส่ถ้าเปิด Steam Guard
      games: [730, 570],
      status: 1,
    },
    // {
    //   username: "second_account",
    //   password: "second_password",
    //   shared_secret: "",
    //   games: [440],
    //   status: 7,
    // },
  ],
};
