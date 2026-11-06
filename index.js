// index.js
// Steam Hours Boost Multi-Account — main logic
// ค่าตั้งค่าทั้งหมดอยู่ใน settings.js และ .env

const path = require("path");

require("dotenv").config({ quiet: true, path: path.join(__dirname, ".env") });

const SteamUser = require("steam-user");
const SteamTotp = require("steam-totp");
const readline = require("readline");
const https = require("https");

const settings = (() => {
  try {
    return require("./settings.js");
  } catch (err) {
    if (err && err.code === "MODULE_NOT_FOUND" && String(err.message).includes("settings.js")) {
      console.error(
        "❌ ไม่พบไฟล์ settings.js — กรุณาคัดลอก settings.example.js เป็น settings.js ก่อนรัน"
      );
    } else {
      console.error("❌ โหลด settings.js ไม่สำเร็จ:", err && err.message ? err.message : err);
    }
    process.exit(1);
  }
})();

// ────────────────────────────────────────────────
// ค่าเริ่มต้น (ใช้เมื่อ settings.js ไม่ได้ระบุ)
// ────────────────────────────────────────────────

const DEFAULTS = {
  MIN_START_DELAY_MS: 15 * 1000,
  MAX_START_DELAY_MS: 30 * 1000,
  LOGGED_ELSEWHERE_RETRY_MS: 2 * 60 * 60 * 1000, // 2 ชม.
  RECONNECT_DELAY_MS: 30 * 60 * 1000, // 30 นาที
  DISCONNECT_RETRY_MS: 5 * 60 * 1000, // 5 นาที (watchdog)
  LOGON_TIMEOUT_MS: 2 * 60 * 1000, // 2 นาที
  REBOOT_MIN_MS: 12 * 60 * 60 * 1000, // 12 ชม.
  REBOOT_MAX_MS: 24 * 60 * 60 * 1000, // 24 ชม.
  REBOOT_RELOGIN_MIN_MS: 5 * 1000,
  REBOOT_RELOGIN_MAX_MS: 15 * 1000,
  SHUTDOWN_GRACE_MS: 2 * 1000,
};

const WEBHOOK_URL = String(process.env.WEBHOOK_URL || settings.WEBHOOK_URL || "").trim();

// ────────────────────────────────────────────────
// Logging
// ────────────────────────────────────────────────

function timestamp() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Bangkok",
    hour12: false,
  });
}

function log(...args) {
  console.log(`[${timestamp()}]`, ...args);
}

function logWarn(...args) {
  console.warn(`[${timestamp()}] ⚠️`, ...args);
}

function logError(...args) {
  console.error(`[${timestamp()}] ❌`, ...args);
}

// ────────────────────────────────────────────────
// ตัวช่วยทั่วไป
// ────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function resolveRange(minValue, maxValue, fallbackMin, fallbackMax, label) {
  let min = toPositiveInt(minValue, fallbackMin);
  let max = toPositiveInt(maxValue, fallbackMax);

  if (min > max) {
    logWarn(`[ตั้งค่า] ${label}: MIN มากกว่า MAX → สลับค่าให้อัตโนมัติ`);
    [min, max] = [max, min];
  }

  return [min, max];
}

function getRandomDelayMs(min, max) {
  const a = Number.isFinite(min) ? min : 0;
  const b = Number.isFinite(max) ? max : a;
  const lo = Math.max(0, Math.min(a, b));
  const hi = Math.max(0, Math.max(a, b));
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function formatDuration(ms) {
  if (ms < 60 * 1000) return `${Math.max(1, Math.round(ms / 1000))} วินาที`;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / (60 * 1000))} นาที`;
  const hours = ms / (60 * 60 * 1000);
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ชั่วโมง`;
}

function truncate(text, max) {
  const s = String(text ?? "");
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 3)) + "...";
}

function maskUsername(username) {
  if (!username) return "Unknown";
  if (username.length <= 3) return username;
  return username.substring(0, 3) + "***";
}

function formatGames(games) {
  if (!Array.isArray(games) || games.length === 0) return "ไม่มีเกมที่บูท";

  return games
    .map((g, index) => {
      if (typeof g === "number") return `${index + 1}. GameID: ${g}`;
      if (typeof g === "string") return `${index + 1}. ${g}`;
      if (g && typeof g === "object") {
        const id = g.appid ?? g.game_id;
        const name = g.name ?? g.game_extra_info;
        if (id) return `${index + 1}. ${name || "ไม่ทราบชื่อ"} (ID: ${id})`;
      }
      return `${index + 1}. ${String(g)}`;
    })
    .join("\n");
}

function normalizeGames(rawGames) {
  if (!Array.isArray(rawGames)) return null;

  const games = [];

  for (const game of rawGames) {
    if (typeof game === "number" && Number.isFinite(game) && game > 0) {
      games.push(game);
      continue;
    }

    if (typeof game === "string" && game.trim()) {
      // string = ชื่อเกมนอก Steam (custom game name) สูงสุด 32 ตัวอักษร
      games.push(game.trim().slice(0, 32));
      continue;
    }

    if (game && typeof game === "object") {
      const appid = Number(game.appid ?? game.game_id);
      if (Number.isFinite(appid) && appid > 0) {
        games.push({
          game_id: appid,
          game_extra_info: String(game.name ?? game.game_extra_info ?? "").slice(0, 32),
        });
      }
    }
  }

  return games;
}

function normalizeAccounts(rawAccounts) {
  if (!Array.isArray(rawAccounts)) return [];

  const valid = [];

  rawAccounts.forEach((acc, index) => {
    const label = `[บัญชีที่ ${index + 1}]`;

    if (!acc || typeof acc !== "object") {
      logError(`${label} รูปแบบไม่ถูกต้อง → ข้าม`);
      return;
    }

    const username = typeof acc.username === "string" ? acc.username.trim() : "";
    const password = typeof acc.password === "string" ? acc.password : "";
    const games = normalizeGames(acc.games);

    if (!username || !password) {
      logError(`${label} ขาด username หรือ password → ข้าม`);
      return;
    }

    if (games === null) {
      logError(`${label} ค่า games ต้องเป็น array → ข้าม`);
      return;
    }

    if (games.length === 0) {
      logWarn(`${label} ไม่มีรายการเกม → บัญชีนี้จะออนไลน์เฉย ๆ ไม่ได้ boost`);
    }

    valid.push({
      username,
      password,
      shared_secret:
        typeof acc.shared_secret === "string" ? acc.shared_secret.trim() : "",
      games,
      status: Number.isInteger(acc.status) ? acc.status : SteamUser.EPersonaState.Online,
    });
  });

  return valid;
}

function getErrorMessage(err) {
  const code = err && err.eresult;

  const messages = {
    0: "ไม่มีการเชื่อมต่อ / ถูกตัดการเชื่อมต่อ",
    3: "บัญชีไม่ถูกต้อง",
    5: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลใน settings.js",
    6: "บัญชีถูกใช้งานจากที่อื่น (Session conflict)",
    20: "เซิร์ฟเวอร์ Steam ไม่พร้อม",
    63: "ต้องการ Steam Guard code",
    65: "รหัส Steam Guard ไม่ถูกต้อง",
    84: "ถูกจำกัดอัตราการล็อกอิน (Rate limit) กรุณารอสักครู่",
    85: "ต้องการ Steam Guard code",
    87: "บัญชีถูกจำกัดการล็อกอินชั่วคราว",
    88: "รหัสยืนยันไม่ถูกต้อง",
    106: "บัญชีต้องการ Two-Factor Authentication",
  };

  if (Object.prototype.hasOwnProperty.call(messages, code)) {
    return `${messages[code]} (Code: ${code})`;
  }

  const message = err && err.message ? err.message : String(err);
  return `ข้อผิดพลาด: ${message}${code !== undefined ? ` (Code: ${code})` : ""}`;
}

// ────────────────────────────────────────────────
// Discord Webhook
// ────────────────────────────────────────────────

function sanitizeEmbed(embed) {
  const clean = { ...embed };

  if (clean.title) clean.title = truncate(clean.title, 256);
  if (clean.description) clean.description = truncate(clean.description, 4096);

  if (Array.isArray(clean.fields)) {
    clean.fields = clean.fields
      .slice(0, 25)
      .map((field) => ({
        name: truncate(field.name ?? "-", 256),
        value: truncate(field.value ?? "-", 1024),
        inline: Boolean(field.inline),
      }));
  }

  return clean;
}

function sendDiscordEmbed(embed, attempt = 0) {
  if (!WEBHOOK_URL) return;

  let url;
  try {
    url = new URL(WEBHOOK_URL);
  } catch {
    logError("[Webhook] WEBHOOK_URL ไม่ถูกต้อง");
    return;
  }

  if (url.protocol !== "https:") {
    logError("[Webhook] WEBHOOK_URL ต้องขึ้นต้นด้วย https://");
    return;
  }

  const payload = JSON.stringify({ embeds: [sanitizeEmbed(embed)] });

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    let body = "";

    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      if (body.length < 4096) body += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 429 && attempt < 2) {
        let retryAfter = 2;
        try {
          retryAfter = Number(JSON.parse(body).retry_after) || 2;
        } catch {
          // ใช้ค่าเริ่มต้น
        }

        const waitMs = Math.min(retryAfter * 1000 + 500, 10000);
        logWarn(`[Webhook] โดน rate limit → รอ ${formatDuration(waitMs)} แล้วลองใหม่`);
        setTimeout(() => sendDiscordEmbed(embed, attempt + 1), waitMs);
        return;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        logError(
          `[Webhook] ส่งไม่สำเร็จ: ${res.statusCode} ${res.statusMessage} ${body.slice(0, 200)}`
        );
      }
    });
  });

  req.setTimeout(15000, () => req.destroy(new Error("timeout 15 วินาที")));

  req.on("error", (err) => {
    logError(`[Webhook] Error: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// ────────────────────────────────────────────────
// Readline (สำหรับ Steam Guard แบบกรอกมือ)
// ────────────────────────────────────────────────

let rl = null;
let promptQueue = Promise.resolve();

function getReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function ask(question) {
  return new Promise((resolve) => getReadline().question(question, resolve));
}

function queuePrompt(task) {
  const next = promptQueue.then(task, task);
  promptQueue = next.catch(() => {});
  return next;
}

function isYes(value) {
  const v = String(value || "").toLowerCase().trim();
  return ["y", "yes", "ใช่", "1"].includes(v);
}

// ────────────────────────────────────────────────
// ตัวแปรระดับระบบ
// ────────────────────────────────────────────────

const [MIN_START_DELAY_MS, MAX_START_DELAY_MS] = resolveRange(
  settings.MIN_START_DELAY_MS,
  settings.MAX_START_DELAY_MS,
  DEFAULTS.MIN_START_DELAY_MS,
  DEFAULTS.MAX_START_DELAY_MS,
  "MIN_START_DELAY_MS / MAX_START_DELAY_MS"
);

const [REBOOT_MIN_MS, REBOOT_MAX_MS] = resolveRange(
  settings.REBOOT_MIN_MS,
  settings.REBOOT_MAX_MS,
  DEFAULTS.REBOOT_MIN_MS,
  DEFAULTS.REBOOT_MAX_MS,
  "REBOOT_MIN_MS / REBOOT_MAX_MS"
);

const [REBOOT_RELOGIN_MIN_MS, REBOOT_RELOGIN_MAX_MS] = resolveRange(
  settings.REBOOT_RELOGIN_MIN_MS,
  settings.REBOOT_RELOGIN_MAX_MS,
  DEFAULTS.REBOOT_RELOGIN_MIN_MS,
  DEFAULTS.REBOOT_RELOGIN_MAX_MS,
  "REBOOT_RELOGIN_MIN_MS / REBOOT_RELOGIN_MAX_MS"
);

const LOGGED_ELSEWHERE_RETRY_MS = toPositiveInt(
  settings.LOGGED_ELSEWHERE_RETRY_MS,
  DEFAULTS.LOGGED_ELSEWHERE_RETRY_MS
);

const RECONNECT_DELAY_MS = toPositiveInt(
  settings.RECONNECT_DELAY_MS,
  DEFAULTS.RECONNECT_DELAY_MS
);

const DISCONNECT_RETRY_MS = toPositiveInt(
  settings.DISCONNECT_RETRY_MS,
  DEFAULTS.DISCONNECT_RETRY_MS
);

const LOGON_TIMEOUT_MS = toPositiveInt(
  settings.LOGON_TIMEOUT_MS,
  DEFAULTS.LOGON_TIMEOUT_MS
);

const SHUTDOWN_GRACE_MS = toPositiveInt(
  settings.SHUTDOWN_GRACE_MS,
  DEFAULTS.SHUTDOWN_GRACE_MS
);

let workers = [];
let shuttingDown = false;

// ────────────────────────────────────────────────
// Worker 1 บัญชี
// ────────────────────────────────────────────────

function createAccountWorker(acc) {
  const masked = maskUsername(acc.username);
  const games = acc.games;
  const sharedSecret = acc.shared_secret;

  const client = new SteamUser({ autoRelogin: true });

  let isLoggingOn = false;
  let isOnline = false;
  let intentionalLogOff = false;
  let playingBlocked = false;
  let sharedSecretFailures = 0;

  let reconnectTimer = null;
  let loggedElsewhereTimer = null;
  let rebootTimer = null;
  let reloginTimer = null;
  let logonTimeout = null;

  const tag = () => `[${masked}]`;

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function clearLoggedElsewhereTimer() {
    if (loggedElsewhereTimer) {
      clearInterval(loggedElsewhereTimer);
      loggedElsewhereTimer = null;
    }
  }

  function clearRebootTimer() {
    if (rebootTimer) {
      clearTimeout(rebootTimer);
      rebootTimer = null;
    }
  }

  function clearReloginTimer() {
    if (reloginTimer) {
      clearTimeout(reloginTimer);
      reloginTimer = null;
    }
  }

  function clearLogonTimeout() {
    if (logonTimeout) {
      clearTimeout(logonTimeout);
      logonTimeout = null;
    }
  }

  function armLogonTimeout() {
    clearLogonTimeout();

    logonTimeout = setTimeout(() => {
      logonTimeout = null;

      if (shuttingDown || isOnline || !isLoggingOn) return;

      logError(
        `${tag()} ล็อกอินไม่ตอบสนองภายใน ${formatDuration(LOGON_TIMEOUT_MS)} → ยกเลิกและลองใหม่`
      );

      isLoggingOn = false;
      intentionalLogOff = true;

      try {
        client.logOff();
      } catch {
        // ไม่เป็นไร
      }

      setTimeout(() => {
        intentionalLogOff = false;
      }, 5000);

      scheduleReconnect("ล็อกอิน timeout");
    }, LOGON_TIMEOUT_MS);
  }

  function scheduleReconnect(reason, delayMs = RECONNECT_DELAY_MS) {
    if (shuttingDown || reconnectTimer) return;

    const waitMs = Math.max(1000, Number(delayMs) || RECONNECT_DELAY_MS);

    log(`${tag()} ${reason} → ลองใหม่ใน ${formatDuration(waitMs)}`);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      attemptLogOn(reason);
    }, waitMs);
  }

  function attemptLogOn(reason = "เริ่มต้น") {
    if (shuttingDown) return;

    if (isOnline) {
      log(`${tag()} ออนไลน์อยู่แล้ว → ข้ามการล็อกอิน (${reason})`);
      return;
    }

    if (isLoggingOn) {
      log(`${tag()} กำลังล็อกอินอยู่ → ข้าม (${reason})`);
      return;
    }

    if (client.steamID || client._connecting) {
      log(`${tag()} ยังเชื่อมต่อ/กำลังเชื่อมต่ออยู่ → รอแล้วลองใหม่ (${reason})`);
      scheduleReconnect(reason, 15000);
      return;
    }

    clearReconnectTimer();
    clearLoggedElsewhereTimer();

    isLoggingOn = true;

    const logOnOptions = {
      accountName: acc.username,
      password: acc.password,
    };

    if (sharedSecret) {
      logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(sharedSecret);
    }

    log(`${tag()} กำลังล็อกอิน (${reason})...`);

    try {
      client.logOn(logOnOptions);
    } catch (err) {
      isLoggingOn = false;
      logError(`${tag()} เรียก logOn ไม่สำเร็จ: ${err.message}`);
      scheduleReconnect("logOn error");
      return;
    }

    armLogonTimeout();
  }

  function startLoggedElsewhereRetry() {
    if (shuttingDown) return;

    clearReconnectTimer();

    if (loggedElsewhereTimer) return;

    logWarn(
      `${tag()} บัญชีถูกใช้งานจากที่อื่น → จะลองใหม่ทุก ${formatDuration(
        LOGGED_ELSEWHERE_RETRY_MS
      )}`
    );

    loggedElsewhereTimer = setInterval(() => {
      if (shuttingDown || isOnline || isLoggingOn) return;
      attemptLogOn("บัญชีถูกใช้งานจากที่อื่น");
    }, LOGGED_ELSEWHERE_RETRY_MS);
  }

  function scheduleReboot() {
    clearRebootTimer();

    const delayMs = getRandomDelayMs(REBOOT_MIN_MS, REBOOT_MAX_MS);

    log(`${tag()} จะรีบูทในประมาณ ${formatDuration(delayMs)}`);

    rebootTimer = setTimeout(() => {
      rebootTimer = null;

      if (shuttingDown || !isOnline) return;

      log(`${tag()} กำลังรีบูท (logOff → logOn ใหม่)...`);
      notifyReboot();

      intentionalLogOff = true;
      isOnline = false;

      try {
        client.logOff();
      } catch (err) {
        logError(`${tag()} logOff ไม่สำเร็จ: ${err.message}`);
      }

      const reloginDelay = getRandomDelayMs(
        REBOOT_RELOGIN_MIN_MS,
        REBOOT_RELOGIN_MAX_MS
      );

      clearReloginTimer();
      reloginTimer = setTimeout(() => {
        reloginTimer = null;
        intentionalLogOff = false;
        isLoggingOn = false;
        attemptLogOn("รีบูท");
      }, reloginDelay);
    }, delayMs);
  }

  // ── Discord notifications ──────────────────────

  function notifyOnline() {
    sendDiscordEmbed({
      title: `🟢 ${masked} ออนไลน์แล้ว`,
      color: 0x2ecc71,
      description:
        games.length > 0
          ? `กำลัง boost เกมทั้งหมด ${games.length} เกม`
          : "ออนไลน์อยู่ (ไม่ได้ boost เกม)",
      fields: [
        {
          name: "🎮 เกมที่บูท",
          value: "```\n" + truncate(formatGames(games), 980) + "\n```",
          inline: false,
        },
        {
          name: "เวลา",
          value: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          inline: true,
        },
        { name: "บัญชี", value: masked, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Steam Booster" },
    });
  }

  function notifyReboot() {
    sendDiscordEmbed({
      title: `🔄 ${masked} กำลังรีบูท`,
      color: 0xe67e22,
      description: "ระบบกำลังล็อกเอาท์ → จะล็อกอินใหม่ในไม่กี่วินาที",
      fields: [
        {
          name: "🎮 เกมปัจจุบัน",
          value: "```\n" + truncate(formatGames(games), 980) + "\n```",
          inline: false,
        },
        { name: "สถานะ", value: "รีบูทอัตโนมัติ", inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Steam Booster • Auto Restart" },
    });
  }

  function notifyError(message) {
    sendDiscordEmbed({
      title: `⚠️ ${masked} พบข้อผิดพลาด`,
      color: 0xe74c3c,
      description: truncate(message, 4000),
      timestamp: new Date().toISOString(),
      footer: { text: "Steam Booster • Error" },
    });
  }

  function notifyDisconnected(eresult, msg) {
    sendDiscordEmbed({
      title: `🔌 ${masked} หลุดการเชื่อมต่อ`,
      color: 0xf1c40f,
      description: truncate(
        `Code: ${eresult}${msg ? `\n${msg}` : ""}\nระบบจะพยายามเชื่อมต่อใหม่`,
        4000
      ),
      timestamp: new Date().toISOString(),
      footer: { text: "Steam Booster • Reconnect" },
    });
  }

  function notifyPlayingState(blocked) {
    sendDiscordEmbed({
      title: blocked
        ? `⏸️ ${masked} หยุด idle ชั่วคราว`
        : `▶️ ${masked} กลับมา boost ต่อ`,
      color: blocked ? 0xf39c12 : 0x2ecc71,
      description: blocked
        ? "ตรวจพบการเล่นเกมจากเซสชันอื่น → หยุด boost จนกว่าเซสชันนั้นจะเลิกเล่น"
        : "เซสชันอื่นเลิกเล่นแล้ว → เริ่ม boost ต่อ",
      timestamp: new Date().toISOString(),
      footer: { text: "Steam Booster • Playing State" },
    });
  }

  // ── Steam events ───────────────────────────────

  client.on("loggedOn", () => {
    isLoggingOn = false;
    isOnline = true;
    intentionalLogOff = false;
    playingBlocked = false;

    clearLogonTimeout();
    clearReconnectTimer();
    clearLoggedElsewhereTimer();
    clearReloginTimer();

    log(`${tag()} ล็อกอินสำเร็จ → เริ่มเล่นเกม`);

    try {
      client.setPersona(acc.status);
      if (games.length > 0) client.gamesPlayed(games);
    } catch (err) {
      logError(`${tag()} ตั้งค่า persona/games ไม่สำเร็จ: ${err.message}`);
    }

    notifyOnline();
    scheduleReboot();
  });

  client.on("steamGuard", (domain, callback, lastCodeWrong) => {
    if (shuttingDown) return;

    clearLogonTimeout();

    const type = domain ? `อีเมล (${domain})` : "แอปมือถือ";

    logWarn(
      `${tag()} ต้องการ Steam Guard code จาก ${type}${
        lastCodeWrong ? " (รหัสก่อนหน้าไม่ถูก)" : ""
      }`
    );

    if (sharedSecret) {
      const respond = () => {
        if (shuttingDown) return;
        const code = SteamTotp.generateAuthCode(sharedSecret);
        log(`${tag()} ส่ง Steam Guard code อัตโนมัติแล้ว`);
        callback(code);
        armLogonTimeout();
      };

      if (lastCodeWrong) {
        sharedSecretFailures += 1;

        if (sharedSecretFailures > 3) {
          logError(
            `${tag()} shared_secret ไม่ถูกต้องติดกัน ${sharedSecretFailures} ครั้ง → หยุดลองบัญชีนี้`
          );
          notifyError(
            "shared_secret ไม่ถูกต้อง (Steam Guard code ผิดติดกันเกิน 3 ครั้ง) กรุณาตรวจสอบค่าใน settings.js"
          );

          isLoggingOn = false;
          intentionalLogOff = true;

          try {
            client.logOff();
          } catch {
            // ไม่เป็นไร
          }

          setTimeout(() => {
            intentionalLogOff = false;
          }, 5000);

          return;
        }

        logWarn(
          `${tag()} รหัสก่อนหน้าไม่ถูก (ครั้งที่ ${sharedSecretFailures}/3) → รอ 30 วินาทีเพื่อสร้างรหัสใหม่`
        );
        setTimeout(respond, 30000);
      } else {
        sharedSecretFailures = 0;
        respond();
      }

      return;
    }

    if (!process.stdin.isTTY) {
      logError(`${tag()} ต้องกรอก Steam Guard แต่ไม่ได้รันแบบ interactive (ไม่มี TTY)`);
      logError(
        `${tag()} แนะนำให้ใส่ shared_secret ใน settings.js หรือรัน "npm start" ใน terminal`
      );
      notifyError("ต้องกรอก Steam Guard code แต่ไม่มี TTY (แนะนำใช้ shared_secret)");

      isLoggingOn = false;
      intentionalLogOff = true;

      try {
        client.logOff();
      } catch {
        // ไม่เป็นไร
      }

      setTimeout(() => {
        intentionalLogOff = false;
      }, 5000);

      scheduleReconnect("รอ Steam Guard code");
      return;
    }

    queuePrompt(async () => {
      const note = lastCodeWrong ? " (รหัสก่อนหน้าไม่ถูก)" : "";

      if (lastCodeWrong) {
        logWarn(`${tag()} รหัสก่อนหน้าไม่ถูก → รอ 30 วินาทีก่อนขอรหัสใหม่`);
        await sleep(30000);
      }

      const consent = await ask(
        `\n[Steam Guard] ${masked} - ต้องการ code จาก ${type}${note}\nต้องการกรอก code ไหม? (y/n): `
      );

      if (!isYes(consent)) {
        log(`${tag()} ข้าม Steam Guard → จะลองใหม่ภายหลัง`);

        isLoggingOn = false;
        intentionalLogOff = true;

        try {
          client.logOff();
        } catch {
          // ไม่เป็นไร
        }

        setTimeout(() => {
          intentionalLogOff = false;
        }, 5000);

        scheduleReconnect("ยังไม่ได้ยืนยัน Steam Guard");
        return;
      }

      const code = (await ask(`กรอกรหัส Steam Guard สำหรับ ${masked}: `)).trim();

      if (!code) {
        logError(`${tag()} ไม่ได้กรอกรหัส → จะลองใหม่ภายหลัง`);

        isLoggingOn = false;
        intentionalLogOff = true;

        try {
          client.logOff();
        } catch {
          // ไม่เป็นไร
        }

        setTimeout(() => {
          intentionalLogOff = false;
        }, 5000);

        scheduleReconnect("ไม่ได้กรอก Steam Guard");
        return;
      }

      callback(code);
      armLogonTimeout();
    });
  });

  client.on("playingState", (blocked) => {
    if (blocked) {
      if (playingBlocked) return;

      playingBlocked = true;
      logWarn(
        `${tag()} ถูกบล็อกการเล่นเกม (มีเซสชันอื่นกำลังเล่นอยู่) → หยุด idle ชั่วคราว`
      );
      notifyPlayingState(true);
      return;
    }

    if (!playingBlocked) return;

    playingBlocked = false;
    log(`${tag()} เซสชันอื่นเลิกเล่นแล้ว → กลับมา boost ต่อ`);

    if (games.length > 0) client.gamesPlayed(games);

    notifyPlayingState(false);
  });

  client.on("error", (err) => {
    isLoggingOn = false;
    isOnline = false;

    clearLogonTimeout();
    clearRebootTimer();
    clearReloginTimer();
    clearLoggedElsewhereTimer();

    const message = getErrorMessage(err);

    logError(`${tag()} Error: ${message}`);
    notifyError(message);

    if (err && err.eresult === 5) {
      logError(`${tag()} รหัสผ่านไม่ถูกต้อง → หยุดลองใหม่สำหรับบัญชีนี้`);
      return;
    }

    if (err && err.eresult === 6) {
      startLoggedElsewhereRetry();
      return;
    }

    scheduleReconnect("พบข้อผิดพลาด");
  });

  client.on("disconnected", (eresult, msg) => {
    isLoggingOn = false;
    isOnline = false;

    clearLogonTimeout();
    clearRebootTimer();

    if (shuttingDown) return;

    if (intentionalLogOff) {
      log(`${tag()} ตัดการเชื่อมต่อตามคำสั่ง`);
      return;
    }

    logWarn(
      `${tag()} หลุดการเชื่อมต่อ (${eresult}${msg ? `: ${msg}` : ""})`
    );

    notifyDisconnected(eresult, msg);

    // autoRelogin ของ steam-user จะพยายามเชื่อมต่อให้เอง
    // ตัว watchdog นี้มีไว้กันกรณีที่มันไม่กลับมา
    scheduleReconnect("หลุดการเชื่อมต่อ", DISCONNECT_RETRY_MS);
  });

  // ── lifecycle ──────────────────────────────────

  function start() {
    if (sharedSecret) {
      log(`${tag()} ใช้ Steam Guard อัตโนมัติ (shared_secret)`);
    } else {
      logWarn(
        `${tag()} ไม่มี shared_secret → ถ้าเปิด Steam Guard อยู่ จะต้องกรอก code เอง`
      );
    }

    attemptLogOn("เริ่มต้น");
  }

  function shutdown() {
    clearReconnectTimer();
    clearLoggedElsewhereTimer();
    clearRebootTimer();
    clearReloginTimer();
    clearLogonTimeout();

    try {
      if (client.steamID) client.logOff();
    } catch {
      // ไม่เป็นไร
    }
  }

  return { start, shutdown, masked };
}

// ────────────────────────────────────────────────
// ระบบหลัก
// ────────────────────────────────────────────────

async function startSystem() {
  const accounts = normalizeAccounts(settings.accounts);

  if (accounts.length === 0) {
    logError("ไม่พบบัญชีที่ใช้งานได้ใน settings.js → หยุดทำงาน");
    process.exit(1);
  }

  log(`เริ่มระบบ boost ${accounts.length} บัญชี...`);

  if (!WEBHOOK_URL) {
    logWarn("ไม่ได้ตั้งค่า WEBHOOK_URL → ปิดการแจ้งเตือน Discord");
  }

  if (process.argv.includes("--dry-run") || process.env.DRY_RUN === "1") {
    log("โหมดตรวจสอบ (dry-run): ตรวจ settings เรียบร้อย จะไม่เชื่อมต่อ Steam");
    accounts.forEach((account, index) => {
      log(
        `  ${index + 1}. ${maskUsername(account.username)} → ${
          account.games.length
        } เกม${account.shared_secret ? " (มี shared_secret)" : " (ไม่มี shared_secret)"}`
      );
    });
    return;
  }

  for (let i = 0; i < accounts.length; i++) {
    const worker = createAccountWorker(accounts[i]);
    workers.push(worker);
    worker.start();

    if (i < accounts.length - 1) {
      const delay = getRandomDelayMs(MIN_START_DELAY_MS, MAX_START_DELAY_MS);
      log(`รอ ${formatDuration(delay)} ก่อนเริ่มบัญชีถัดไป...`);
      await sleep(delay);
    }
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  log(`ได้รับสัญญาณ ${signal} → กำลังปิดระบบ...`);

  for (const worker of workers) {
    worker.shutdown();
  }

  if (rl) {
    try {
      rl.close();
    } catch {
      // ไม่เป็นไร
    }
    rl = null;
  }

  await sleep(SHUTDOWN_GRACE_MS);

  log("ปิดระบบเรียบร้อย");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  const detail = reason instanceof Error ? reason.stack || reason.message : String(reason);
  logError("[Process] Unhandled rejection:", detail);

  sendDiscordEmbed({
    title: "⚠️ Unhandled Rejection",
    color: 0xe74c3c,
    description: truncate(detail, 4000),
    timestamp: new Date().toISOString(),
    footer: { text: "Steam Booster • Process" },
  });
});

process.on("uncaughtException", (err) => {
  const detail = err && (err.stack || err.message) ? err.stack || err.message : String(err);
  logError("[Process] Uncaught exception:", detail);

  sendDiscordEmbed({
    title: "⚠️ Uncaught Exception",
    color: 0xe74c3c,
    description: truncate(detail, 4000),
    timestamp: new Date().toISOString(),
    footer: { text: "Steam Booster • Process" },
  });
});

startSystem().catch((err) => {
  logError("ระบบเกิดข้อผิดพลาดร้ายแรง:", err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
