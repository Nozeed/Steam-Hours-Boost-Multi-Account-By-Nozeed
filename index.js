const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const readline = require('readline');
const accounts = require('./accounts.json');
const MIN_START_DELAY_MS = 12000;
const MAX_START_DELAY_MS = 20000;
const LOGGED_ELSEWHERE_RETRY_MS = 7200000;
const RECONNECT_DELAY_MS = 1800000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let promptQueue = Promise.resolve();

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function queuePrompt(task) {
    const next = promptQueue.then(task, task);
    promptQueue = next.catch(() => {});
    return next;
}

function isYes(value) {
    const normalized = value.toLowerCase();
    return normalized === 'y' || normalized === 'yes' || normalized === '1' || normalized === 'ใช่';
}

console.log(`\n[ระบบ] กำลังตรวจสอบบัญชีทั้งหมด ${accounts.length} บัญชี...\n`);

function getErrorMessage(err) {
    switch (err.eresult) {
        case 5: // InvalidPassword
            return 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบไฟล์ accounts.json';
        case 6: // LoggedInElsewhere
            return 'บัญชีถูกใช้งานจากที่อื่นอยู่ (ชนกับเซสชันเดิม)';
        case 20: // ServiceUnavailable
            return 'เซิร์ฟเวอร์ Steam ไม่พร้อมใช้งาน จะลองใหม่ในอีก 30 นาที';
        case 63: // AccountLogonDenied
        case 65: // InvalidLoginAuthCode
        case 85: // AccountLoginDeniedNeedTwoFactor
            return 'บัญชีนี้ต้องยืนยัน Steam Guard (ระบบจะถามรหัสให้กรอกในคอนโซล)';
        default:
            return `ข้อผิดพลาดไม่ทราบสาเหตุ: ${err.message} (Code: ${err.eresult})`;
    }
}

function getRandomDelayMs(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let cumulativeStartDelay = 0;
accounts.forEach((acc, index) => {
    const client = new SteamUser();
    let reconnectTimer = null;
    let reconnectDueAt = 0;
    let loggedElsewhereInterval = null;
    const hasSharedSecret = typeof acc.shared_secret === 'string' && acc.shared_secret.trim() !== '';

    // ตรวจสอบข้อมูลบัญชีที่จำเป็นก่อนล็อกอิน
    if (!acc.username || !acc.password || !Array.isArray(acc.games)) {
        console.error(`[ข้อผิดพลาด] [ลำดับ ${index + 1}] ข้อมูลบัญชีไม่ครบถ้วน (ต้องมี username, password และ games)`);
        return;
    }

    const logOnOptions = {
        accountName: acc.username,
        password: acc.password
    };

    function attemptLogOn() {
        if (hasSharedSecret) {
            logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(acc.shared_secret);
        } else {
            delete logOnOptions.twoFactorCode;
        }
        client.logOn(logOnOptions);
    }

    function scheduleReconnect(reason) {
        if (reconnectTimer) {
            const remainingSec = Math.max(0, Math.ceil((reconnectDueAt - Date.now()) / 1000));
            console.log(`[คิวลองใหม่] [${acc.username}] มีคิวลองใหม่อยู่แล้ว อีกประมาณ ${remainingSec} วินาที`);
            return;
        }

        console.log(`[ลองใหม่] [${acc.username}] ${reason} กำลังเชื่อมต่อใหม่ในอีก 30 นาที...`);
        reconnectDueAt = Date.now() + RECONNECT_DELAY_MS;
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            reconnectDueAt = 0;
            attemptLogOn();
        }, RECONNECT_DELAY_MS);
    }

    function clearReconnectTimer() {
        if (!reconnectTimer) {
            reconnectDueAt = 0;
            return;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        reconnectDueAt = 0;
    }

    function startLoggedElsewhereRetry(reason) {
        if (loggedElsewhereInterval) {
            return;
        }

        clearReconnectTimer();
        console.warn(`[ล็อกอินซ้ำ] [${acc.username}] ${reason} ระบบจะลองเริ่มใหม่ทุก 2 ชั่วโมง`);
        loggedElsewhereInterval = setInterval(() => {
            console.log(`[ลองใหม่] [${acc.username}] กำลังลองเริ่มใหม่อัตโนมัติ (รอบ 2 ชั่วโมง)`);
            attemptLogOn();
        }, LOGGED_ELSEWHERE_RETRY_MS);
    }

    function stopLoggedElsewhereRetry() {
        if (!loggedElsewhereInterval) {
            return;
        }
        clearInterval(loggedElsewhereInterval);
        loggedElsewhereInterval = null;
    }

    const startDelay = cumulativeStartDelay;
    const nextGapMs = getRandomDelayMs(MIN_START_DELAY_MS, MAX_START_DELAY_MS);
    cumulativeStartDelay += nextGapMs;

    console.log(
        `[คิวเริ่ม] [${acc.username}] จะเริ่มล็อกอินในอีก ${Math.floor(startDelay / 1000)} วินาที (หน่วงบัญชีถัดไปแบบสุ่ม ${Math.floor(nextGapMs / 1000)} วินาที)`
    );
    setTimeout(() => {
        attemptLogOn();
    }, startDelay);

    // เหตุการณ์เมื่อเข้าสู่ระบบสำเร็จ
    client.on('loggedOn', () => {
        clearReconnectTimer();
        stopLoggedElsewhereRetry();
        console.log(`[สำเร็จ] [${acc.username}] ล็อกอินสำเร็จ`);
        client.setPersona(acc.status || 1);
        client.gamesPlayed(acc.games);
    });

    // เมื่อ Steam ขอรหัส Steam Guard และไม่มี shared_secret ให้ถามผู้ใช้ผ่านคอนโซล
    client.on('steamGuard', (domain, callback, lastCodeWrong) => {
        if (hasSharedSecret) {
            callback(SteamTotp.generateAuthCode(acc.shared_secret));
            return;
        }

        queuePrompt(async () => {
            const guardType = domain ? `อีเมล (${domain})` : 'มือถือ (2FA)';
            const retryNote = lastCodeWrong ? ' รหัสก่อนหน้าไม่ถูกต้อง.' : '';
            const consent = await ask(`[Steam Guard] [${acc.username}] ต้องยืนยันผ่าน ${guardType}.${retryNote} ต้องการกรอกรหัสตอนนี้หรือไม่ (y/n): `);

            if (!isYes(consent)) {
                console.warn(`[Steam Guard] [${acc.username}] ข้ามการกรอกรหัส ระบบจะลองใหม่ภายหลัง`);
                scheduleReconnect('ยังไม่ได้ยืนยัน Steam Guard');
                return;
            }

            const code = await ask(`[Steam Guard] [${acc.username}] กรุณากรอกรหัส Steam Guard: `);
            if (!code) {
                console.warn(`[Steam Guard] [${acc.username}] ไม่พบรหัสที่กรอก ระบบจะลองใหม่ภายหลัง`);
                scheduleReconnect('ยังไม่ได้ยืนยัน Steam Guard');
                return;
            }

            callback(code);
        }).catch((promptError) => {
            console.error(`[ข้อผิดพลาด] [${acc.username}] ไม่สามารถอ่านรหัส Steam Guard ได้: ${promptError.message}`);
            scheduleReconnect('ไม่สามารถรับรหัส Steam Guard');
        });
    });

    client.on('playingState', (blocked) => {
        if (blocked) {
            console.warn(`[คำเตือน] [${acc.username}] มีผู้ใช้งานบัญชีนี้จากที่อื่นอยู่ หยุดดันชั่วโมงชั่วคราว`);
            startLoggedElsewhereRetry('ตรวจพบว่ามีการใช้งานจากที่อื่น');
        } else {
            stopLoggedElsewhereRetry();
            console.log(`[สถานะ] [${acc.username}] กำลังดันชั่วโมง ${acc.games.length} เกม`);
        }
    });

    // จัดการข้อผิดพลาดระหว่างทำงาน
    client.on('error', (err) => {
        console.error(`[ข้อผิดพลาด] [${acc.username}] ${getErrorMessage(err)}`);

        if (err.eresult === 6) {
            startLoggedElsewhereRetry('ล็อกอินชนกับเซสชันที่อื่น');
            return;
        }

        // ถ้าไม่ใช่ปัญหา credential ให้ลองเชื่อมต่อใหม่
        if (err.eresult !== 5) {
            scheduleReconnect('พบปัญหาระหว่างเชื่อมต่อ');
        }
    });

    // แจ้งเตือนเมื่อหลุดการเชื่อมต่อ
    client.on('disconnected', (eresult) => {
        console.warn(`[หลุดการเชื่อมต่อ] [${acc.username}] ขาดการเชื่อมต่อ (Result: ${eresult})`);
        scheduleReconnect('เชื่อมต่อหลุด');
    });
});

process.on('SIGINT', () => {
    rl.close();
    process.exit(0);
});
