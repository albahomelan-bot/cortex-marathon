const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

function cleanNumber(input, defaultVal) {
  if (!input || input.trim() === '') return defaultVal;
  let val = input.trim().replace(/\$/g, '').replace(/\+/g, '').replace(/,/g, '.');
  return `+$${val}`;
}

async function main() {
  console.clear();
  console.log('=======================================================');
  console.log('   ШЛЯХ ІНВЕСТОРА • ОНОВЛЕННЯ САЙТУ CORTEX MARATHON    ');
  console.log('   https://cortex-marathon.pages.dev/                  ');
  console.log('=======================================================\n');

  // Calculate day from 7 Sept 2026
  const startDate = new Date(2026, 8, 7);
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNumber = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const monthsUa = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const monthsShortUa = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

  const dateLabel = `${now.getDate()} ${monthsUa[now.getMonth()]}`;
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = `${yesterday.getDate()} ${monthsShortUa[yesterday.getMonth()]}`;

  console.log(`📅 Сьогодні: ${dateLabel} (${dayNumber}-й день марафону)\n`);

  const statsPath = path.join(__dirname, 'stats.json');
  let prev = {
    yesterdayProfit: "+$1",
    todayProfit: "+$0",
    monthProfit: "+$53",
    totalProfit: "+$917"
  };

  if (fs.existsSync(statsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      if (parsed.yesterdayProfit) prev.yesterdayProfit = parsed.yesterdayProfit;
      if (parsed.todayProfit) prev.todayProfit = parsed.todayProfit;
      if (parsed.monthProfit) prev.monthProfit = parsed.monthProfit;
      if (parsed.totalProfit) prev.totalProfit = parsed.totalProfit;
    } catch (e) {}
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (query) => new Promise(resolve => rl.question(query, resolve));

  console.log('Введіть показники (натисніть Enter, щоб залишити поточне значення в дужках):\n');

  const inYesterday = await ask(`1. Дохід за вчора [${prev.yesterdayProfit}]: `);
  const yesterdayProfit = cleanNumber(inYesterday, prev.yesterdayProfit);

  const inToday = await ask(`2. Дохід на ранок сьогодні [${prev.todayProfit}]: `);
  const todayProfit = cleanNumber(inToday, prev.todayProfit);

  const inMonth = await ask(`3. За поточний місяць [${prev.monthProfit}]: `);
  const monthProfit = cleanNumber(inMonth, prev.monthProfit);

  const inTotal = await ask(`4. Загальний накопичений дохід [${prev.totalProfit}]: `);
  const totalProfit = cleanNumber(inTotal, prev.totalProfit);

  console.log('\nФіксуємо показники:');
  console.log(` • День: ${dayNumber} (${dateLabel})`);
  console.log(` • Вчора (${yesterdayDate}): ${yesterdayProfit}`);
  console.log(` • Сьогодні: ${todayProfit}`);
  console.log(` • Місяць: ${monthProfit}`);
  console.log(` • Разом: ${totalProfit}\n`);

  const newStats = {
    dayNumber: dayNumber,
    dateLabel: dateLabel,
    yesterdayDate: yesterdayDate,
    yesterdayProfit: yesterdayProfit,
    todayProfit: todayProfit,
    monthProfit: monthProfit,
    totalProfit: totalProfit,
    status: "LIVE"
  };

  fs.writeFileSync(statsPath, JSON.stringify(newStats, null, 2) + '\n', 'utf8');
  console.log('✅ stats.json оновлено локально.');

  console.log('🚀 Відправляємо оновлення на GitHub для Cloudflare Pages...');
  try {
    execSync('git add stats.json', { cwd: __dirname });
    const commitMsg = `Update marathon stats: Day ${dayNumber} (${dateLabel}) - Yesterday ${yesterdayProfit}, Today ${todayProfit}, Total ${totalProfit}`;
    try {
      execSync(`git commit -m "${commitMsg}"`, { cwd: __dirname });
    } catch (e) {
      console.log('Немає змін для коміту або вже закомічено.');
    }
    const pushOutput = execSync('git push origin main', { cwd: __dirname }).toString();
    console.log(pushOutput);
  } catch (err) {
    console.error('Помилка git:', err.message);
  }

  console.log('\n=======================================================');
  console.log('   ✅ САЙТ УСПІШНО ОНОВЛЕНО ТА ВІДПРАВЛЕНО!            ');
  console.log('   Сторінка оновиться на Cloudflare через 30-45 сек:   ');
  console.log('   👉 https://cortex-marathon.pages.dev/               ');
  console.log('=======================================================\n');

  await ask('Натисніть Enter для виходу...');
  rl.close();
}

main().catch(console.error);
