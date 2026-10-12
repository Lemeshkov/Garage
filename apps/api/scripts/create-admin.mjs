import { PrismaClient } from '@prisma/client';
import { argon2id, hash } from 'argon2';
import readline from 'node:readline';

const args = new Map(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value.slice(2), all[index + 1]] : ['', '']).filter(([key]) => key));
const login = String(args.get('login') ?? '').trim().toLowerCase();
const displayName = String(args.get('name') ?? '').trim();
if (!login || !displayName || !/^[a-z0-9._-]+$/.test(login)) { console.error('Использование: npm run admin:create -- --login <login> --name <имя>'); process.exit(1); }

function hidden(prompt) {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) throw new Error('Для безопасного ввода пароля требуется интерактивный терминал.');
    process.stdout.write(prompt); process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8'); let value = '';
    const onData = char => { if (char === '\u0003') process.exit(130); if (char === '\r' || char === '\n') { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off('data', onData); process.stdout.write('\n'); resolve(value); return; } if (char === '\u007f' || char === '\b') { value = value.slice(0, -1); return; } value += char; };
    process.stdin.on('data', onData);
  });
}

const prisma = new PrismaClient();
try {
  if (await prisma.adminUser.findUnique({ where: { login } })) throw new Error(`Администратор ${login} уже существует.`);
  const password = await hidden('Первоначальный пароль: '); const confirmation = await hidden('Повторите пароль: ');
  if (!password || password !== confirmation) throw new Error('Пароли не совпадают.');
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await prisma.adminUser.create({ data: { login, displayName, passwordHash, mustChangePassword: true } });
  console.log(`Администратор ${login} создан. При первом входе потребуется сменить пароль.`);
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
finally { await prisma.$disconnect(); }

