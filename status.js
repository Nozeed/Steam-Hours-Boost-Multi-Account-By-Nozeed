#!/usr/bin/env node
// status.js — แสดงสถานะบัญชีจาก status.json
// ใช้งาน: npm run status
// ตรวจแบบ exit code: npm run status:check

const fs = require("fs");
const path = require("path");

const STATUS_FILE = path.join(__dirname, "status.json");
const STALE_MS = 90 * 1000;

const STATE_LABELS = {
  starting: "⏳ กำลังเริ่ม",
  logging_in: "🔑 กำลังล็อกอิน",
  online: "🟢 ออนไลน์",
  online_blocked: "🟡 ออนไลน์ (หยุด idle)",
  waiting_retry: "🟠 รอ retry",
  logged_elsewhere: "🟠 ถูกใช้ที่อื่น",
  reconnecting: "🟠 กำลัง reconnect",
  waiting_steam_guard: "🔑 รอ Steam Guard",
  rebooting: "🔄 กำลังรีบูท",
  error: "🔴 error",
  stopped: "⚪ หยุด",
};

function formatTime(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("sv-SE", {
    timeZone: "Asia/Bangkok",
    hour12: false,
  });
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

function pad(text, width) {
  const value = String(text ?? "");
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function main() {
  const checkMode = process.argv.includes("--check");

  if (!fs.existsSync(STATUS_FILE)) {
    console.log("ยังไม่มีไฟล์สถานะ (status.json)");
    console.log("→ ยังไม่เคยรันโปรแกรม หรือยังไม่ได้เริ่มระบบด้วย npm start");
    process.exit(checkMode ? 1 : 0);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
  } catch (err) {
    console.error("อ่าน status.json ไม่สำเร็จ:", err.message);
    process.exit(1);
  }

  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const updatedMs = new Date(data.updatedAt).getTime();
  const ageMs = Number.isFinite(updatedMs) ? Math.max(0, Date.now() - updatedMs) : Infinity;
  const stale = !Number.isFinite(ageMs) || ageMs > STALE_MS;
  const alive = isProcessAlive(data.pid);
  const ageText = Number.isFinite(ageMs)
    ? `${Math.round(ageMs / 1000)} วินาทีที่แล้ว`
    : "ไม่ทราบเวลา";

  console.log("");
  console.log("Steam Boost Status");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`PID: ${data.pid}${alive ? " (running)" : " (ไม่พบ process)"}`);
  console.log(`Started: ${formatTime(data.startedAt)}`);
  console.log(`Updated: ${formatTime(data.updatedAt)} (${ageText})`);

  if (stale) {
    console.log("⚠️  ไฟล์สถานะเก่าเกิน 90 วินาที — process อาจหยุดหรือค้าง");
  }

  if (!alive) {
    console.log("⚠️  ไม่พบ process ตาม PID นี้ — สถานะอาจค้างจากรอบก่อน");
  }

  console.log("──────────────────────────────────────────────────────────────");

  if (accounts.length === 0) {
    console.log("ไม่พบข้อมูลบัญชีใน status.json");
    process.exit(checkMode ? 1 : 0);
  }

  const header =
    pad("#", 4) +
    pad("บัญชี", 16) +
    pad("สถานะ", 30) +
    pad("เกม", 6) +
    pad("อัปเดต", 22) +
    "หมายเหตุ";

  console.log(header);
  console.log("─".repeat(header.length));

  let onlineCount = 0;
  let offlineCount = 0;

  for (const acc of accounts) {
    const state = acc.state || "unknown";
    const label = STATE_LABELS[state] || state;

    if (acc.online === true) onlineCount += 1;
    else offlineCount += 1;

    const noteParts = [];

    if (acc.lastError) noteParts.push(acc.lastError);
    if (acc.nextRetryAt) noteParts.push(`retry: ${formatTime(acc.nextRetryAt)}`);
    if (!acc.lastError && !acc.nextRetryAt && acc.lastEvent) noteParts.push(acc.lastEvent);

    console.log(
      pad(`#${Number(acc.index) + 1}`, 4) +
        pad(acc.username || "-", 16) +
        pad(label, 30) +
        pad(acc.games ?? 0, 6) +
        pad(formatTime(acc.updatedAt), 22) +
        noteParts.join(" | ")
    );
  }

  console.log("──────────────────────────────────────────────────────────────");
  console.log(`สรุป: ออนไลน์ ${onlineCount} / ${accounts.length} | ออฟไลน์ ${offlineCount}`);
  console.log("");

  const unhealthy = stale || !alive || offlineCount > 0;
  process.exit(checkMode && unhealthy ? 1 : 0);
}

main();
