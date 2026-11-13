const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '9222643279:AAGkXw00L6kFfBno8hj8hIILwVJVb90C6fE';
const statsFile = path.join(__dirname, 'stats.json');
const dedicatedFolder = path.join(__dirname, 'screenshots');
const archiveFolder = path.join(dedicatedFolder, 'archive');

// Other fallback folders to check
const fallbackFolders = [
  'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО',
  'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО\\november26',
  'E:\\ВХОДЯЩИЕ_ВИДЕО',
  'E:\\ВХОДЯЩИЕ_ВИДЕО\\1 мій запис (відео для монтажу)',
  'C:\\Users\\Admin\\Documents\\antigravity\\AI-Montazher\\ЗАНЕСИ-СЮДИ\\1 мій запис (відео для монтажу)',
  'C:\\Users\\Admin\\Pictures\\Screenshots',
  'C:\\Users\\Admin\\Desktop'
];

// Patterns to exclude (covers, icons, branding, avatars, reactions)
const excludePatterns = [
  'cover', 'character', 'sheet', 'logo', 'avatar', 'scam', 'vpo', 'itsmy', 
  'thumb', 'banner', 'stickers', 'photo-', '.rendered_history', 'вебінар', 'афіша'
];

function isExcluded(fileName) {
  const lower = fileName.toLowerCase();
  return excludePatterns.some(pattern => lower.includes(pattern));
}

function getTodayScreenshots() {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const now = Date.now();
  const MAX_AGE_HOURS = 36; // СТРОГО не старше 36 часов! Старые скриншоты игнорируются на 100%
  const maxAgeMs = MAX_AGE_HOURS * 60 * 60 * 1000;

  // 1. Приоритет №1: Выделенная папка "СКРИНШОТИ_МАРАФОНУ"
  if (fs.existsSync(dedicatedFolder)) {
    try {
      const files = fs.readdirSync(dedicatedFolder, { withFileTypes: true });
      const dedicatedFiles = [];

      for (const dirent of files) {
        if (!dirent.isFile()) continue;
        const name = dirent.name;
        const ext = path.extname(name).toLowerCase();
        if (!validExtensions.includes(ext)) continue;
        if (isExcluded(name)) continue;

        const fullPath = path.join(dedicatedFolder, name);
        try {
          const stat = fs.statSync(fullPath);
          dedicatedFiles.push({
            name,
            fullPath,
            mtimeMs: stat.mtimeMs
          });
        } catch (e) {}
      }

      // Если в папке screenshots что-то лежит — берем ТОЛЬКО оттуда!
      if (dedicatedFiles.length > 0) {
        dedicatedFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
        console.log(`[Screenshots] Found ${dedicatedFiles.length} file(s) in dedicated folder СКРИНШОТИ_МАРАФОНУ.`);
        return dedicatedFiles.slice(0, 2).map(s => s.fullPath);
      }
    } catch (e) {
      console.warn('[Screenshots] Warning reading dedicated folder:', e.message);
    }
  }

  // 2. Приоритет №2: Поиск в общих папках ТОЛЬКО СВЕЖИХ файлов (за последние 36 часов)
  console.log(`[Screenshots] Dedicated folder empty. Scanning other folders for FRESH screenshots (<${MAX_AGE_HOURS}h)...`);
  const freshCandidates = [];

  for (const folder of fallbackFolders) {
    if (!fs.existsSync(folder)) continue;
    const isDesktop = folder.toLowerCase().endsWith('desktop');

    try {
      const files = fs.readdirSync(folder, { withFileTypes: true });

      for (const dirent of files) {
        if (!dirent.isFile()) continue;
        const name = dirent.name;
        const ext = path.extname(name).toLowerCase();
        if (!validExtensions.includes(ext)) continue;
        if (isExcluded(name)) continue;

        const lowerName = name.toLowerCase();

        // На рабочем столе смотрим только файлы со специфическими именами
        if (isDesktop) {
          const hasKeyword = lowerName.includes('screen') || 
                             lowerName.includes('скрин') || 
                             lowerName.includes('image_') || 
                             lowerName.includes('photo_') || 
                             lowerName.includes('cortex') ||
                             lowerName.includes('марафон');
          if (!hasKeyword) continue;
        }

        const fullPath = path.join(folder, name);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch (e) {
          continue;
        }

        const ageMs = now - stat.mtimeMs;
        // ЖЕЛЕЗНЫЙ ФИЛЬТР: файл обязан быть свежим! Старье от прошлых дней отсекается намертво
        if (ageMs > maxAgeMs) {
          continue;
        }

        freshCandidates.push({
          name,
          fullPath,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          ageHours: Math.round(ageMs / 3600000)
        });
      }
    } catch (err) {}
  }

  // Убираем дубликаты
  const unique = [];
  const seen = new Set();
  for (const c of freshCandidates) {
    const key = `${c.name}_${c.size}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  // Сортируем от самых новых к более старым
  unique.sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (unique.length === 0) {
    console.log('[Screenshots] No fresh screenshots (<36h) found anywhere.');
    return [];
  }

  console.log(`[Screenshots] Found ${unique.length} fresh screenshot(s):`);
  unique.forEach(u => console.log(`  • ${u.name} (age: ${u.ageHours}h ago)`));

  return unique.slice(0, 2).map(s => s.fullPath);
}

function archiveSentScreenshots(photos) {
  if (!photos || photos.length === 0) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const targetDir = path.join(archiveFolder, today);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const p of photos) {
      // Архивируем только те, что лежали непосредственно в dedicatedFolder
      if (path.dirname(p).toLowerCase() === dedicatedFolder.toLowerCase()) {
        const dest = path.join(targetDir, path.basename(p));
        fs.renameSync(p, dest);
        console.log(`[Archive] Moved ${path.basename(p)} -> archive/${today}`);
      }
    }
  } catch (err) {
    console.warn('[Archive] Could not archive screenshots:', err.message);
  }
}

async function sendReport(chatId, threadId, captionText, photos) {
  if (photos && photos.length > 0) {
    const form = new FormData();
    form.append('chat_id', chatId.toString());
    if (threadId) {
      form.append('message_thread_id', threadId.toString());
    }

    const mediaArray = photos.map((p, idx) => ({
      type: 'photo',
      media: `attach://photo${idx}`,
      caption: idx === 0 ? captionText : undefined,
      parse_mode: idx === 0 ? 'HTML' : undefined
    }));

    form.append('media', JSON.stringify(mediaArray));

    photos.forEach((p, idx) => {
      const blob = new Blob([fs.readFileSync(p)]);
      form.append(`photo${idx}`, blob, path.basename(p));
    });

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      body: form
    });
    return await res.json();
  } else {
    const body = {
      chat_id: chatId,
      text: captionText,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    };
    if (threadId) body.message_thread_id = threadId;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }
}

async function main() {
  if (!fs.existsSync(statsFile)) {
    console.error('stats.json not found!');
    process.exit(1);
  }

  const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  const photos = getTodayScreenshots();

  console.log(`Found ${photos.length} screenshot(s) for report:`);
  photos.forEach((p, idx) => console.log(`  [${idx + 1}] ${p}`));

  const captionText = 
`🧭 <b>ДЕНЬ ${stats.dayNumber}: ОФІЦІЙНИЙ ЗВІТ СПОТОВОГО МАРАФОНУ «ШЛЯХ ІНВЕСТОРА»</b>

📊 <b>Показники на ${stats.dateLabel} 2026 року:</b>
• <b>Вчора (${stats.yesterdayDate}):</b> <code>${stats.yesterdayProfit} USDT</code> <i>(зафіксовано алгоритмом)</i>
• <b>Сьогодні зранку:</b> <code>${stats.todayProfit} USDT</code>
• <b>За поточний місяць:</b> <code>${stats.monthProfit} USDT</code>
• <b>Загальний накопичений результат:</b> <b>${stats.totalProfit} USDT</b> <i>(стабільна робота сітки!)</i>

🛡 <b>Інженерні стандарти безпеки:</b>
1. <b>Чистий біржовий спот:</b> робота без кредитних плечей (1x), ризик ліквідації 0%.
2. <b>Повний контроль:</b> активи знаходяться виключно на особистому біржовому рахунку.
3. <b>Безпечний протокол:</b> офіційний API без права зовнішнього виводу коштів.

🌐 <b>Онлайн-трекер марафону в реальному часі:</b>
👉 <a href="https://cortex-marathon.pages.dev/">cortex-marathon.pages.dev</a>

📩 <b>Хочете налаштувати таку ж безпечну систему на власному рахунку?</b>
Пишіть мені в особисті повідомлення 👉 <a href="https://t.me/albaRoyalQ">@albaRoyalQ</a>

<i>Спокійна математика споту перемагає будь-яку метушню на ринку. Працюємо системно далі! 🤝</i>`;

  const CHANNEL_ID = -1004350292111;
  const HUB_GROUP_ID = -1004400783965;
  const TOPIC_MARATHON = 6;

  console.log('Sending to Channel...');
  const resChan = await sendReport(CHANNEL_ID, null, captionText, photos);
  console.log('Channel:', resChan.ok ? 'SUCCESS' : resChan);

  console.log('Sending to Supergroup Hub Topic 6...');
  const resHub = await sendReport(HUB_GROUP_ID, TOPIC_MARATHON, captionText, photos);
  console.log('Hub:', resHub.ok ? 'SUCCESS' : resHub);

  // Перемещаем отправленные файлы в архив, чтобы не дублировались
  archiveSentScreenshots(photos);
}

// Allow importing or direct execution
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { getTodayScreenshots, archiveSentScreenshots };
}
