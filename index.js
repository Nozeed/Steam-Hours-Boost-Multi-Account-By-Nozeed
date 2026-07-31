const SteamUser = require("steam-user");
const SteamTotp = require("steam-totp");
const readline = require("readline");
const https = require("https");
const settings = require("./settings.js");   // ← ทุกอย่างมาจากที่นี่

// ดึงค่าจาก settings
const {
  WEBHOOK_URL,
  MIN_START_DELAY_MS,
  MAX_START_DELAY_MS,
  LOGGED_ELSEWHERE_RETRY_MS,
  RECONNECT_DELAY_MS,
  accounts,   // ← ใช้ตรงนี้แทน require("./accounts.json")
} = settings;

// ────────────────────────────────────────────────
// ฟังก์ชันช่วยเหลือ (เหมือนเดิมทั้งหมด)
// ────────────────────────────────────────────────

function sendDiscordEmbed(embed) {
  if (!WEBHOOK_URL) return;

  const payload = JSON.stringify({ embeds: [embed] });

  const url = new URL(WEBHOOK_URL);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error(`[Webhook] Failed: ${res.statusCode} ${res.statusMessage}`);
    }
  });

  req.on("error", (err) => {
    console.error(`[Webhook] Error: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let promptQueue = Promise.resolve();

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function queuePrompt(task) {
  const next = promptQueue.then(task, task);
  promptQueue = next.catch(() => {});
  return next;
}

function isYes(value) {
  const v = value.toLowerCase().trim();
  return ["y", "yes", "ใช่", "1"].includes(v);
}

function getErrorMessage(err) {
  switch (err.eresult) {
    case 5: return "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลใน settings.js";
    case 6: return "บัญชีถูกใช้งานจากที่อื่น (Session conflict)";
    case 20: return "เซิร์ฟเวอร์ Steam ไม่พร้อม จะลองใหม่ใน 30 นาที";
    case 63:
    case 65:
    case 85: return "ต้องการ Steam Guard code";
    default: return `ข้อผิดพลาด: ${err.message} (Code: ${err.eresult})`;
  }
}

function getRandomDelayMs(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maskUsername(username) {
  if (!username) return "Unknown";
  if (username.length <= 5) return username;
  return username.substring(0, 5) + "...";
}

function formatGames(games) {
  if (!Array.isArray(games) || games.length === 0) return "ไม่มีเกมที่บูท";

  return games
    .map((g, index) => {
      if (typeof g === "number") return `${index + 1}. GameID: ${g}`;
      if (typeof g === "string") return `${index + 1}. ${g}`;
      if (g?.appid) return `${index + 1}. ${g.name || "ไม่ทราบชื่อ"} (ID: ${g.appid})`;
      return `${index + 1}. ${String(g)}`;
    })
    .join("\n");
}

// ────────────────────────────────────────────────
// Logic หลัก (ปรับตรง accounts.length และ acc = accounts[i])
// ────────────────────────────────────────────────

async function startSystem() {
  console.log(`\nเริ่มระบบ boost ${accounts.length} บัญชี...\n`);

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const client = new SteamUser();
    let reconnectTimer = null;
    let loggedElsewhereInterval = null;
    let rebootTimer = null;

    if (!acc.username || !acc.password || !Array.isArray(acc.games)) {
      console.error(`[ERROR] บัญชีที่ ${i + 1} ข้อมูลไม่ครบใน settings.js`);
      continue;
    }

    const logOnOptions = {
      accountName: acc.username,
      password: acc.password,
    };

    const hasSharedSecret = !!acc.shared_secret?.trim();

    function attemptLogOn() {
      if (hasSharedSecret) {
        logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(acc.shared_secret);
      }
      client.logOn(logOnOptions);
    }

    function scheduleReconnect(reason) {
      if (reconnectTimer) return;
      console.log(`[${acc.username}] ${reason} → ลองใหม่ใน ${RECONNECT_DELAY_MS / 60000} นาที`);
      reconnectTimer = setTimeout(attemptLogOn, RECONNECT_DELAY_MS);
    }

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function startLoggedElsewhereRetry() {
      if (loggedElsewhereInterval) return;
      clearReconnectTimer();
      console.warn(`[${acc.username}] ถูกใช้งานจากที่อื่น → ลองใหม่ทุก ${LOGGED_ELSEWHERE_RETRY_MS / 3600000} ชม.`);
      loggedElsewhereInterval = setInterval(attemptLogOn, LOGGED_ELSEWHERE_RETRY_MS);
    }

    function stopLoggedElsewhereRetry() {
      if (loggedElsewhereInterval) {
        clearInterval(loggedElsewhereInterval);
        loggedElsewhereInterval = null;
      }
    }

    function scheduleReboot() {
      if (rebootTimer) clearTimeout(rebootTimer);

      const minMs = 12 * 60 * 60 * 1000; // 12 ชม.
      const maxMs = 24 * 60 * 60 * 1000; // 24 ชม.
      const delayMs = getRandomDelayMs(minMs, maxMs);

      const hours = Math.round(delayMs / (60 * 60 * 1000));
      console.log(`[${acc.username}] จะรีบูทในประมาณ ${hours} ชม.`);

      rebootTimer = setTimeout(() => {
        console.log(`[${acc.username}] กำลังรีบูท...`);

        const masked = maskUsername(acc.username);

        const embed = {
          title: `🔄 ${masked} กำลังรีบูท`,
          color: 0xe67e22,
          description: "ระบบกำลังล็อกเอาท์ → จะล็อกอินใหม่ในไม่กี่วินาที",
          fields: [
            { name: "🎮 เกมปัจจุบัน", value: "```" + formatGames(acc.games) + "```", inline: false },
            { name: "สถานะ", value: "รีบูทอัตโนมัติ", inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Steam Booster • Auto Restart" },
        };

        sendDiscordEmbed(embed);

        client.logOff();

        setTimeout(() => attemptLogOn(), getRandomDelayMs(5000, 15000));
      }, delayMs);
    }

    client.on("loggedOn", () => {
      clearReconnectTimer();
      stopLoggedElsewhereRetry();

      console.log(`[${acc.username}] ล็อกอินสำเร็จ → เริ่มเล่นเกม`);

      client.setPersona(acc.status || SteamUser.EPersonaState.Online);
      client.gamesPlayed(acc.games);

      const masked = maskUsername(acc.username);
      const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

      const embed = {
        title: `🟢 ${masked} ออนไลน์แล้ว`,
        color: 0x2ecc71,
        description: `กำลัง boost เกมทั้งหมด ${acc.games.length} เกม`,
        fields: [
          { name: "🎮 เกมที่บูท", value: "```" + formatGames(acc.games) + "```", inline: false },
          { name: "เวลา", value: now, inline: true },
          { name: "บัญชี", value: masked, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Steam Booster" },
      };

      sendDiscordEmbed(embed);

      scheduleReboot();
    });

    client.on("steamGuard", (domain, callback, lastCodeWrong) => {
      if (hasSharedSecret) {
        callback(SteamTotp.generateAuthCode(acc.shared_secret));
        return;
      }

      queuePrompt(async () => {
        const type = domain ? `อีเมล (${domain})` : "มือถือ";
        const note = lastCodeWrong ? " (รหัสก่อนหน้าไม่ถูก)" : "";

        console.log(`\n[Steam Guard] ${acc.username} - ต้องการ code จาก ${type}${note}`);
        const consent = await ask("ต้องการกรอก code ไหม? (y/n): ");

        if (!isYes(consent)) {
          console.log(`[${acc.username}] ข้าม Steam Guard`);
          scheduleReconnect("ยังไม่ได้ยืนยัน Steam Guard");
          return;
        }

        const code = await ask(`กรอกรหัส Steam Guard สำหรับ ${acc.username}: `);
        callback(code);
      });
    });

    client.on("playingState", (blocked) => {
      if (blocked) {
        startLoggedElsewhereRetry();
      } else {
        stopLoggedElsewhereRetry();
        console.log(`[${acc.username}] กำลัง boost ${acc.games.length} เกม`);
      }
    });

    client.on("error", (err) => {
      console.error(`[${acc.username}] Error: ${getErrorMessage(err)}`);

      if (err.eresult === 6) {
        startLoggedElsewhereRetry();
      } else if (err.eresult !== 5) {
        scheduleReconnect("พบข้อผิดพลาด");
      }
    });

    // เริ่มล็อกอินบัญชีนี้
    attemptLogOn();

    // หน่วงก่อนบัญชีถัดไป
    if (i < accounts.length - 1) {
      const delay = getRandomDelayMs(MIN_START_DELAY_MS, MAX_START_DELAY_MS);
      console.log(`รอ ${Math.round(delay / 1000)} วินาทีก่อนเริ่มบัญชีถัดไป...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

startSystem().catch((err) => {
  console.error("ระบบเกิดข้อผิดพลาด:", err);
});

process.on("SIGINT", () => {
  console.log("\nปิดระบบ...");
  rl.close();
  process.exit(0);
});
