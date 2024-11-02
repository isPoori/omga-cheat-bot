// Developer : Pouria Hosseini | Telegram : @isPoori | Channel : @OmgaDeveloper //
const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const config = require('./config.json'); 
const bot = new Telegraf(config.token);

let userToken = '';
let operationInProgress = false; 

const mainMenu = Markup.keyboard([
    ['🚀 اجرای عملیات'],
    ['🔍 راهنما', '📜 قوانین'],
    ['🛠 پشتیبانی']
]).resize();

const cancelButton = Markup.keyboard([
    ['❌ لغو عملیات']
]).resize();

bot.start((ctx) => {
    ctx.reply('به اُمگاچیت خوش آمدید!\nیک گذینه را انتخاب کنید.', mainMenu);
});

bot.hears('🔍 راهنما', (ctx) => {
    ctx.reply('جهت دریافت توکن و استفاده از ربات ابتدا ویدیوی زیر رو تماشا کنید:\nhttps://youtu.be/2QddlxEzX6c');
});

bot.hears('📜 قوانین', (ctx) => {
    ctx.reply('لطفا جهت بن نشدن از ربات قوانین زیر را رعایت کنید:\nدرصورت اسپم کردن ربات از طرف ربات یا ارسال پشت هم توکن حساب شما بسته خواهد شد\nدرصورت مطلع شدن از فروش ربات به دیگر کاربران حساب شما مسدود و پیگرد قانونی خواهد شد\nدرصورت هر گونه سو استفاده از این ربات پیگرد قانونی خواهد شد\nممنون از همراهی شما موفق و پیروز باشید.');
});

bot.hears('🛠 پشتیبانی', (ctx) => {
    ctx.reply('برای پشتیبانی به پیوی مراجعه کنید:', 
        Markup.inlineKeyboard([
            Markup.button.url('تماس با پشتیبانی', 'https://t.me/isPoori')
        ])
    );
});

bot.hears('❌ لغو عملیات', (ctx) => {
    if (operationInProgress) {
        operationInProgress = false;
        ctx.reply('عملیات لغو شد.', mainMenu);
    } else {
        ctx.reply('عملیاتی در حال انجام نیست.');
    }
});

// عملیات ربات (دریافت توکن از کاربر)
bot.hears('🚀 اجرای عملیات', (ctx) => {
    operationInProgress = true;
    ctx.reply('لطفاً توکن خود را وارد کنید یا دکمه "❌ لغو عملیات" را برای لغو بزنید:', cancelButton);
});

// مدیریت پیام‌های ورودی
bot.on('text', async (ctx) => {
    const userId = ctx.from.id; // شناسه کاربر

    // بررسی برای دریافت توکن از کاربر و اجرای عملیات
    if (operationInProgress) {
        userToken = ctx.message.text; // ذخیره توکن کاربر
        ctx.reply('توکن دریافت شد، عملیات شروع شد... لطفاً منتظر بمانید.');

        try {
            await makeMoney(ctx, userToken);
        } catch (error) {
            ctx.reply('خطایی رخ داده است: ' + error.message);
        }

        operationInProgress = false; // عملیات به پایان رسیده است
    }
});

// تابع اصلی برای انجام عملیات
async function makeMoney(ctx, token) {
    console.log("Success: Let's start...");

    await validateToken(token);
    ctx.reply("Success: توکن معتبر است...");

    const streak = await setStreak(token);
    ctx.reply(`Success: استریک شما بروزرسانی شد: ${streak}`);

    const holdReward = await holdGame(token);
    holdReward && ctx.reply(`Success: پاداش از بازی Hold: ${holdReward}`);

    const rouletteReward = await rouletteGame(token);
    rouletteReward && ctx.reply(`Success: پاداش از بازی Roulette: ${rouletteReward}`);

    const swipeReward = await swipeGame(token);
    swipeReward && ctx.reply(`Success: پاداش از بازی Swipe: ${swipeReward}`);

    const tasks = await getTasks(token);
    ctx.reply(`Success: تعداد ${tasks.length} تسک پیدا شد. در حال بررسی...`);

    for (let i = 0; i < tasks.length; i++) {
        await delay(1000); // تأخیر برای هر تسک
        const done = await doneTask(token, tasks[i].id);
        if (done) {
            ctx.reply(`Success: تسک ${tasks[i].id} کامل شد. پاداش: ${tasks[i].award}`);
        }
    }

    ctx.reply("Success: همه عملیات‌ها با موفقیت انجام شد!");
}

// توابع مورد نیاز اسکریپت
async function delay(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

async function validateToken(token) {
    const headers = { Authorization: token };

    const res = await fetch(`https://major.bot/api/users/6946511911/`, {
        headers,
    });

    if (res.status !== 200) {
        throw "خطا: توکن نامعتبر است!";
    }
}

async function setStreak(token) {
    const headers = { Authorization: token };

    const res = await fetch("https://major.bot/api/user-visits/streak/", {
        headers,
    });
    const data = await res.json();

    if (data.user_id) {
        return data.streak;
    } else {
        throw "خطا در تنظیم استریک!";
    }
}

async function getTasks(token) {
    const headers = { Authorization: token };

    let tasks = [];
    const res = await fetch("https://major.bot/api/tasks/?is_daily=false", {
        headers,
    });

    tasks.push(...(await res.json()));

    const res2 = await fetch("https://major.bot/api/tasks/?is_daily=true", {
        headers,
    });

    tasks.push(
        ...(await res2.json()).filter(
            (v) => !tasks.some((value) => v.id === value.id)
        )
    );

    return tasks;
}

async function doneTask(token, id) {
    const headers = { Authorization: token };

    const res = await fetch("https://major.bot/api/tasks/", {
        headers,
        method: "POST",
        body: JSON.stringify({ task_id: id }),
    });
    const data = await res.json();

    return data.is_completed ?? false;
}

async function rouletteGame(token) {
    const headers = { Authorization: token };
    const res = await fetch("https://major.bot/api/roulette/", {
        method: "POST",
        headers,
    });

    const data = await res.json();

    return data.rating_award;
}

async function holdGame(token) {
    const headers = { Authorization: token };

    const res = await fetch("https://major.bot/api/bonuses/coins/", {
        headers,
        method: "POST",
        body: JSON.stringify({ coins: 901 }),
    });

    const data = await res.json();

    if (data.success == true) {
        return 901;
    }
}

async function swipeGame(token) {
    const headers = { Authorization: token };

    const res = await fetch("https://major.bot/api/swipe_coin/", {
        method: "POST",
        headers,
        body: JSON.stringify({ coins: 2900 }),
    });

    const data = await res.json();

    if (data.success == true) {
        return 2900;
    }
}

// اجرای ربات
bot.launch().then(() => {
    console.log('Bot is running.');
}).catch(err => {
    console.error('Error:', err);
});