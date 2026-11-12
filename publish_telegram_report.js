const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '9222643279:AAGkXw00L6kFfBno8hj8hIILwVJVb90C6fE';
const statsFile = path.join(__dirname, 'stats.json');

// Folders to search for screenshots
const searchFolders = [
  path.join(__dirname, 'screenshots'),
  'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО',
  'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО\\november26',
  'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО\\011126',
  'E:\\ВХОДЯЩИЕ_ВИДЕО',
  'E:\\ВХОДЯЩИЕ_ВИДЕО\\1 мій запис (відео для монтажу)',
  'C:\\Users\\Admin\\Documents\\antigravity\\AI-Montazher\\ЗАНЕСИ-СЮДИ\\1 мій запис (відео для монтажу)',
  'C:\\Users\\Admin\\Documents\\antigravity\\AI-Montazher\\ЗАНЕСИ-СЮДИ\\4 мої картинки й відео (для вставок)',
  'C:\\Users\\Admin\\Pictures\\Screenshots',
  'C:\\Users\\Admin\\Desktop'
];

// Patterns to exclude (covers, icons, branding, avatars)
const excludePatterns = [
  'cover', 'character', 'sheet', 'logo', 'avatar', 'scam', 'vpo', 'itsmy', 
  'thumb', 'banner', 'stickers', 'photo-', '.rendered_history'
];

function isExcluded(fileName) {
  const lower = fileName.toLowerCase();
  return excludePatterns.some(pattern => lower.includes(pattern));
}

function getTodayScreenshots() {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const now = Date.now();
  const maxAgeMs = 48 * 60 * 60 * 1000; // Prefer last 48 hours

  const candidates = [];

  for (const folder of searchFolders) {
    if (!fs.existsSync(folder)) continue;

    const isDedicatedScreenshots = folder.toLowerCase().includes('screenshots');
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

        // On desktop, only pick files that look like screenshots or photos
        if (isDesktop) {
          const hasKeyword = lowerName.includes('screen') || 
                             lowerName.includes('скрин') || 
                             lowerName.includes('image_') || 
                             lowerName.includes('photo_') || 
                             lowerName.includes('img_') ||
                             lowerName.includes('cortex') ||
                             lowerName.includes('binance') ||
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

        // Priority calculation
        let priority = 1;
        const isRecent = (now - stat.mtimeMs) <= maxAgeMs;

        if (isDedicatedScreenshots) {
          priority += 50; // Files in screenshots/ have highest priority
        }
        if (lowerName.includes('screen') || lowerName.includes('скрин') || lowerName.includes('марафон')) {
          priority += 30;
        }
        if (isRecent) {
          priority += 20;
        }

        candidates.push({
          name,
          fullPath,
          size: stat.size,
          mtime: stat.mtime,
          mtimeMs: stat.mtimeMs,
          priority
        });
      }
    } catch (err) {
      console.warn(`Warning: Could not read folder ${folder}:`, err.message);
    }
  }

  // Deduplicate by size & name (in case same file exists in multiple views)
  const unique = [];
  const seen = new Set();
  for (const c of candidates) {
    const key = `${c.name}_${c.size}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  // Sort by priority descending, then by mtime descending
  unique.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.mtimeMs - a.mtimeMs;
  });

  const selected = unique.slice(0, 2).map(s => s.fullPath);
  return selected;
}

async function sendReport(chatId, threadId, captionText, photos) {
  if (photos.length > 0) {
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
}

// Allow importing or direct execution
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { getTodayScreenshots };
}
