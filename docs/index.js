"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const XLSX = require("xlsx");   
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

puppeteer.use(StealthPlugin())

//Helper isi caption status 
async function typeCaptionSafe(page, caption) {
  const selector =
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea';

  // ===============================
  // 1️⃣ WAKE UP REACT COMPOSER
  // ===============================
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  // ===============================
  // 2️⃣ PASTIKAN FOCUS KE TEXTBOX
  // ===============================
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (el) el.focus();
  }, selector);

  await page.waitForTimeout(200);

  // ===============================
  // 3️⃣ INPUT PALING AMAN: KEYBOARD
  // ===============================
  await page.keyboard.type(caption, { delay: 90 });
  await page.waitForTimeout(600);

  // ===============================
  // 4️⃣ VALIDASI REACT (BUKAN DOM PALSU)
  // ===============================
  const ok = await page.evaluate((sel, text) => {
    const el = document.querySelector(sel);
    if (!el) return false;

    const value = el.textContent || el.innerText || "";
    return value.includes(text.slice(0, 5));
  }, selector, caption);

  if (!ok) {
    throw new Error("❌ Caption tidak diterima oleh React FB");
  }

  console.log("✅ Caption TERISI (React acknowledged)");
}

//PARSE TANGGAL///
function parseTanggalXLSX(tgl) {
  if (!tgl) return null;

  // format: M/D/YY atau MM/DD/YY
  const [m, d, y] = tgl.split("/");

  const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);

  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    }


//FUNGSI POSTING STATUS 
async function runStatus(page, row) {
  console.log(`\n📝 Post STATUS → ${row.account}`);
  const account = row.account;
  console.log(`\n📝 Post STATUS → ${account}`);
  const caption = row.caption;
  const mediaUrl = row.media_url || row.github_release;

  if (!caption && !mediaUrl) {
    console.log("⚠️ Status kosong, skip");
    return;
  }

  // 1️⃣ BUKA HOME FB (WAJIB)
  await page.goto("https://m.facebook.com", { waitUntil: "networkidle2" });
  
  await delay(3000);
  
async function clickComposerStatus(page) {
  const ok = await page.evaluate(() => {
    const keywords = [
      "what's on your mind",
      "apa yang anda pikirkan",
      "tulis sesuatu",
      "buat postingan"
    ];

    const btn = [...document.querySelectorAll('div[role="button"]')]
      .find(el =>
        keywords.some(k =>
          (el.innerText || "").toLowerCase().includes(k)
        )
      );

    if (!btn) return false;

    btn.scrollIntoView({ block: "center" });

    [
      "pointerdown",
      "touchstart",
      "mousedown",
      "mouseup",
      "touchend",
      "click"
    ].forEach(e =>
      btn.dispatchEvent(new Event(e, { bubbles: true, cancelable: true }))
    );

    return true;
  });

  console.log(
    ok ? "✅ Composer STATUS diklik" : "❌ Tombol STATUS tidak ditemukan"
  );
  return ok;
}
  
  // 3️⃣ TUNGGU TEXTBOX
  await page.waitForTimeout(2000);
// 1️⃣ Klik placeholder composer
      await page.waitForSelector(
    'div[role="button"][data-mcomponent="ServerTextArea"]',
    { timeout: 20000 }
  );

  await page.evaluate(() => {
    const el = document.querySelector(
      'div[role="button"][data-mcomponent="ServerTextArea"]'
    );
    if (!el) return;

    el.scrollIntoView({ block: "center" });

    ["touchstart","touchend","mousedown","mouseup","click"]
      .forEach(e =>
        el.dispatchEvent(new Event(e, { bubbles: true }))
      );
  });

  
await page.waitForFunction(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
}, { timeout: 30000 });

console.log("✅ Composer textbox terdeteksi");

  const boxHandle = await page.evaluateHandle(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
});
const box = boxHandle.asElement();
if (!box) {
  throw new Error("❌ Composer textbox tidak valid");
}

  await box.focus();
    
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  // 🔥 PAKAI FUNGSI AMAN 
  await typeCaptionSafe(page, caption);

  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  console.log("✅ Caption diketik");

    
 await delay(3000);

  // ===== 3️⃣ Download + upload media
 const today = process.env.DATE || new Date().toISOString().split("T")[0];
 // HARUS sama dengan nama file di Release!

const originalName = mediaUrl.split("?")[0].split("/").pop();
 
  const fileName = `${account}_${Date.now()}_${originalName}`;
console.log(`✅ Posting selesai untuk ${account}`);

 // download media → simpan return value ke filePat
const filePath = await downloadMedia(mediaUrl, fileName);
console.log(`✅ Media ${fileName} berhasil di-download.`);

const stats = fs.statSync(filePath);
if (stats.size === 0) {
  throw new Error(`❌ File ${fileName} kosong! Download gagal.`);
}


// upload ke Facebook

  
await uploadMedia(page, filePath, fileName, "Photos");
   
// Cari tombol POST dengan innerText
await page.evaluate(() => {
  const keywords = [
    "post", 
    "Posting",
    "POST",
    "POSTING",
    "posting",    // ID
    "bagikan"     // ID (kadang muncul)
  ];

  const buttons = [...document.querySelectorAll('div[role="button"]')];

  const postBtn = buttons.find(btn => {
    const text = (btn.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    return keywords.some(k => text === k || text.includes(k));
  });

  if (!postBtn) return false;

  postBtn.scrollIntoView({ block: "center" });
  postBtn.click();

  return true;
});

console.log("✅ Klik POST (EN+ID)");
await delay(3000);
console.log(`✅ Posting selesai untuk ${account}`);
}

//--ACAK JEDA LINK GRUPNYA --//
let lastDelay = null;

function pickRandomNoRepeat(arr) {
  if (arr.length === 1) return arr[0];

  let picked;
  do {
    picked = arr[Math.floor(Math.random() * arr.length)];
  } while (picked === lastDelay);

  lastDelay = picked;
  return picked;
}


// ===== HELPER =====
function getTodayWIB() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    })
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function urlExists(url) {
  return new Promise(resolve => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      },
      res => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      }
    ).on("error", () => resolve(false));
  });
}



//VERSI BARU BUAT TEST
function readTemplate(file) {
  if (!fs.existsSync(file)) {
    throw new Error("❌ File XLSX tidak ditemukan: " + file);
  }

  const wb = XLSX.readFile(file);
  const result = {};

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false
    });

    result[sheetName.trim()] = rows.map(row => {
      const clean = {};
      for (const k in row) {
        clean[k.trim()] =
          typeof row[k] === "string" ? row[k].trim() : row[k];
      }
      return clean;
    });
  }

  return result;
}

//--FUNGSI RUN ACCOUNT--//

async function runAccount(page, row) {
 console.log("\n🧪 runAccount row:", row);
    const account = row.account;
  const caption = row.caption;
  const mediaUrl = row.media_url || row.github_release;

  // ===== PARSE DELAY GRUP DARI XLSX =====
  const delayGroupList = String(row.delay_grup || "")
  .replace(/\./g, ",")  // ganti titik jadi koma
  .split(/,/)           // split koma
  .map(v => parseInt(v.trim(), 10))
  .filter(v => !isNaN(v) && v > 0);

  const defaultDelayGroup = 5000; // fallback kalau kosong

  
  const groups = String(row.grup_link || "")
  .split(",")
  .map(g => g.replace(/[\s\r\n]+/g, "").trim()) // hapus spasi, CR, LF
  .filter(Boolean);
  
  
   if (!account || !caption || !mediaUrl || groups.length === 0) {
    console.log("⚠️ Row XLSX tidak lengkap, skip:", row);
    return;
  }

  console.log(`🧠 runAccount (XLSX) → ${account}`);
  console.log(`🔗 Grup: ${groups.length}`);
    
  for (let i = 0; i < groups.length; i++) {
    const groupUrl = groups[i];
   
    console.log(`\n📌 [${account}] Grup ${i + 1}/${groups.length}`);
    console.log(`➡️ ${groupUrl}`);
    

// ✅ Validasi URL grup
    if (!groupUrl.startsWith("http")) {
      groupUrl = "https://m.facebook.com/" + groupUrl.replace(/^\/+/, "");
    }

    if (!groupUrl.includes("/groups/")) {
      console.log("❌ URL grup tidak valid, skip:", groupUrl);
      continue; // skip kalau bukan URL grup
    }

    console.log(`\n📌 [${account}] Membuka grup ${i + 1}/${groups.length}`);
    console.log("➡️", groupUrl);
    
    // ===== Buka grup
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);
    // DEBUG SETELAH PAGE SIAP
await page.evaluate(() => {
  console.log(
    "SPAN:",
    [...document.querySelectorAll("span")]
      .map(e => e.textContent?.trim())
      .filter(Boolean)
      .slice(0, 20)
  );
});



    // ===== 1️⃣ Klik composer / write something
  let writeClicked =
  await safeClickXpath(page, "//*[contains(text(),'Write something')]", "Composer") ||
  await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu')]", "Composer") ||
  await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu...')]", "Composer");

    await page.waitForTimeout(2000);
   // 1️⃣ Klik placeholder composer
   await page.waitForSelector(
    'div[role="button"][data-mcomponent="ServerTextArea"]',
    { timeout: 20000 }
  );

   await page.evaluate(() => {
    const el = document.querySelector(
     'div[role="button"][data-mcomponent="ServerTextArea"]'
    );
    if (!el) return;

    el.scrollIntoView({ block: "center" });

    ["touchstart","touchend","mousedown","mouseup","click"]
      .forEach(e =>
        el.dispatchEvent(new Event(e, { bubbles: true }))
     );
  });

  
await page.waitForFunction(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
}, { timeout: 30000 });

console.log("✅ Composer textbox terdeteksi");

  const boxHandle = await page.evaluateHandle(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
});
const box = boxHandle.asElement();
if (!box) {
  throw new Error("❌ Composer textbox tidak valid");
}

  await box.focus();
    
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  await page.keyboard.type(caption, { delay: 90 });

  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  console.log("✅ Caption diketik");

    
 await delay(3000); // kasih waktu 3 detik minimal


  // ===== 3️⃣ Download + upload media
 const today = process.env.DATE || new Date().toISOString().split("T")[0];
 // HARUS sama dengan nama file di Release!

const originalName = mediaUrl.split("?")[0].split("/").pop();
 
  const fileName = `${account}_${Date.now()}_${originalName}`;
console.log(`✅ Posting selesai untuk ${account}`);

 // download media → simpan return value ke filePat
const filePath = await downloadMedia(mediaUrl, fileName);
console.log(`✅ Media ${fileName} berhasil di-download.`);

const stats = fs.statSync(filePath);
if (stats.size === 0) {
  throw new Error(`❌ File ${fileName} kosong! Download gagal.`);
}


// upload ke Facebook

  
await uploadMedia(page, filePath, fileName, "Photos");
   
// Cari tombol POST dengan innerText
await page.evaluate(() => {
  const keywords = [
    "post", 
    "Posting",
    "POST",
    "POSTING",
    "posting",    // ID
    "bagikan"     // ID (kadang muncul)
  ];

  const buttons = [...document.querySelectorAll('div[role="button"]')];

  const postBtn = buttons.find(btn => {
    const text = (btn.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    return keywords.some(k => text === k || text.includes(k));
  });

  if (!postBtn) return false;

  postBtn.scrollIntoView({ block: "center" });
  postBtn.click();

  return true;
});

console.log("✅ Klik POST (EN+ID)");
await delay(3000);
console.log(`✅ Posting selesai untuk ${account}`);
    
  //----FUNGSI MELAKUKAN LIKE POSTINGAN DI LINK GRUP ---////
    
  await page.goto(groupUrl, { waitUntil: "networkidle2" });
  console.log(" Mulai akan lakukan like postingan");
    
  let max = 10;        // jumlah like maksimal
  let delayMs = 3000;  // delay antar aksi (ms)
  let clicked = 0;

  async function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  while (clicked < max) {
    const button = await page.$(
      'div[role="button"][aria-label*="Like"],div[role="button"][aria-label*="like"], div[role="button"][aria-label*="Suka"]'
   );

  if (button) {
      await button.tap(); // ✅ simulate tap (touchscreen)
      clicked++;
      console.log(`👍 Klik tombol Like ke-${clicked}`);
    } else {
      console.log("🔄 Tidak ada tombol Like, scroll...");
    }

    // Scroll sedikit biar postingan baru muncul
    await page.evaluate(() => window.scrollBy(0, 500));
   await delay(delayMs);
 }

 console.log(`🎉 Selesai! ${clicked} tombol Like sudah diklik.`);




// ⏳ JEDA ANTAR GRUP (ACAK, TANPA PENGULANGAN)
const delayGrup =
  delayGroupList.length > 0
    ? pickRandomNoRepeat(delayGroupList)
    : defaultDelayGroup;

console.log(`🎲 Delay grup (acak): ${delayGrup} ms`);
await delay(delayGrup);

}
  
}

//--FUNGSI KLIK ELEMEN WRITE SOMETHING --//
async function safeClickEl(el) {
  if (!el) return false;
  try {
    await el.click();
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik element:", e.message);
    return false;
  }
}

// ===== Klik composer aman pakai trigger React



      


// ===== Fungsi klik by XPath
async function safeClickXpath(page, xpath, desc = "elemen") {
  try {
    const el = await page.waitForXPath(xpath, { visible: true, timeout: 8000 });
    await el.click();
    console.log(`✅ Klik ${desc}`);
    return true;
  } catch (e) {
    console.log(`❌ Gagal klik ${desc}:`, e.message);
    return false;
  }
}

// ===== Fungsi scan elemen verbose
async function scanAllElementsVerbose(page, label = "Scan") {
  console.log(`\n🔎 ${label} (50 elemen pertama)`);
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("div, span, a, button, textarea, input")]
      .slice(0, 50)
      .map((el, i) => ({
        index: i,
        tag: el.tagName,
        txt: (el.innerText || "").trim(),
        aria: el.getAttribute("aria-label"),
        placeholder: el.getAttribute("placeholder"),
        role: el.getAttribute("role"),
        href: el.getAttribute("href"),
        contenteditable: el.getAttribute("contenteditable"),
        classes: el.className
      }));
  });
   elements.forEach(el => console.log(`#${el.index}`, el));
  return elements;
}

// ===== Fungsi download media dari GitHub Release
const mediaFolder = path.join(__dirname, "media");
if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

async function downloadMedia(url, filename) {
  const mediaFolder = path.join(__dirname, "media");
  if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true });

  const filePath = path.join(mediaFolder, filename);
  const options = {
    headers: { "User-Agent": "Mozilla/5.0 (PuppeteerBot)" }
  };

  return new Promise((resolve, reject) => {
    const request = https.get(url, options, (res) => {
    console.log("🌐 GET:", url);
    console.log("🔢 Status:", res.statusCode);
    console.log("📎 Location:", res.headers.location || "(tidak ada)");
      
      // 🔁 Handle redirect (301, 302)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log("🔁 Redirect ke:", res.headers.location);
        return resolve(downloadMedia(res.headers.location, filename));
      }

      // ❌ Handle error status
      if (res.statusCode !== 200) {
        reject(new Error(`❌ Gagal download media: ${res.statusCode}`));
        return;
      }

      // 💾 Tulis file ke disk
      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          try {
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
              reject(new Error(`❌ File ${filename} kosong! Download gagal.`));
              return;
            }
            console.log(`✅ Media selesai diunduh (${(stats.size / 1024).toFixed(2)} KB): ${filePath}`);
            resolve(filePath);
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    request.on("error", (err) => {
      console.log("❌ Error saat download:", err.message);
      reject(err);
    });
  });
}

async function uploadMedia(page, filePath, fileName) {
  console.log(`🚀 Mulai upload media: ${fileName}`);

  const ext = path.extname(fileName).toLowerCase();
  const isVideo = [".mp4", ".mov"].includes(ext);

  console.log(`🧩 Deteksi ekstensi ${ext} -> isVideo=${isVideo}`);

  // ---- Klik tombol Photos / Foto / Video sesuai ekstensi ----
  try {
    if (isVideo) {
      // klik tombol Video (mencari span dengan teks "Video" lalu klik parent button)
      const clickedVideo = await page.evaluate(() => {
        const span = [...document.querySelectorAll("span")].find(s => s.textContent && s.textContent.trim().toLowerCase() === "video");
        if (!span) return false;
        const button = span.closest('div[role="button"], button');
        if (!button) return false;
        button.scrollIntoView({ block: "center", behavior: "instant" });
        ["pointerdown","touchstart","mousedown","mouseup","touchend","click"].forEach(type => {
          button.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
        });
        return true;
      });
      console.log("🎬 Klik tombol Video:", clickedVideo);
    } else {
      // klik tombol Photos/Foto
      const clickedPhotos = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('div[role="button"]')];
        const btn = buttons.find(b => {
          const text = (b.innerText || b.textContent || "").toLowerCase
