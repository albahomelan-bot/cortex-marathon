const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '9222643279:AAGkXw00L6kFfBno8hj8hIILwVJVb90C6fE';
const incomingFolder = 'D:\\Cortex\\видео по базилю\\ВХОДЯЩИЕ_ВИДЕО';
const statsFile = path.join(__dirname, 'stats.json');

function getTodayScreenshots() {
  if (!fs.existsSync(incomingFolder)) return [];
  const files = fs.readdirSync(incomingFolder);
  const screenshotFiles = files
    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'))
    .filter(f => f.toLowerCase().includes('screenshot'))
    .map(f => ({
      name: f,
      fullPath: path.join(incomingFolder, f),
      mtime: fs.statSync(path.join(incomingFolder, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return screenshotFiles.slice(0, 2).map(s => s.fullPath);
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
Пишіть слово <b>СПОТ</b> мені в особисті повідомлення 👉 <a href="https://t.me/albaRoyalQ">@albaRoyalQ</a>

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

main().catch(console.error);
