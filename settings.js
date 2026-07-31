// settings.js
// ไฟล์นี้เก็บค่าตั้งค่าทั้งหมด + ข้อมูลบัญชี Steam ทั้งหมด
module.exports = {
  // ────────────────────────────────────────────────
  //               Webhook Discord
  // ────────────────────────────────────────────────
  WEBHOOK_URL:
    "https://discordapp.com/api/webhooks/1476072101898358815/uPqaZ59sAxuHb0_r_wxQ4ps19O8ta9dk7LlNTKFXPz28NTYoi8tksLfnOZ10szLYnzAT",

  // ────────────────────────────────────────────────
  //          การหน่วงเวลาเริ่มต้นบัญชี (milliseconds)
  // ────────────────────────────────────────────────
  MIN_START_DELAY_MS: 12000, // 15 วินาที (แนะนำอย่าต่ำกว่านี้มาก)
  MAX_START_DELAY_MS: 20000, // 30 วินาที

  // ────────────────────────────────────────────────
  //       การลองใหม่เมื่อ logged elsewhere
  // ────────────────────────────────────────────────
  LOGGED_ELSEWHERE_RETRY_MS: 7200000, // 2 ชั่วโมง (7200000 ms)

  // ────────────────────────────────────────────────
  //           การ reconnect เมื่อ error ทั่วไป
  // ────────────────────────────────────────────────
  RECONNECT_DELAY_MS: 1800000, // 30 นาที (1800000 ms)

  // ────────────────────────────────────────────────
  //               ข้อมูลบัญชีทั้งหมด (แทน accounts.json)
  // ────────────────────────────────────────────────
  // เพิ่ม/แก้ไขบัญชีที่นี่ได้เลย แต่ละ object คือ 1 บัญชี
  accounts: [
    {
      username: "your_username_1",
      password: "your_password_1",
      shared_secret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // ใส่ถ้ามี
      games: ["Boost By Nozeed", 730, 440, 570], // AppID เกมที่อยาก boost
      status: 1, // optional: 1=Online, 7=Invisible
    },
    {
      username: "your_username_1",
      password: "your_password_2",
      shared_secret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // ใส่ถ้ามี
      games: ["Boost By Nozeed", 730, 440, 570], // AppID เกมที่อยาก boost
      status: 1, // optional: 1=Online, 7=Invisible
    },

    // เพิ่มบัญชีอื่น ๆ ต่อได้เรื่อย ๆ
    // {
    //   username: "...",
    //   password: "...",
    //   shared_secret: "...",
    //   games: [ ... ],
    // },
  ],
};
