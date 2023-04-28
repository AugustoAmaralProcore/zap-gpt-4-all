import { GPT4All } from 'gpt4all';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const zapClient = new Client({
  authStrategy: new LocalAuth({
    clientId: 'browser_client',
  }),
  puppeteer: {
    headless: true,
    timeout: 90000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

const gpt4all = new GPT4All('gpt4all-lora-quantized', true);

zapClient.initialize();

zapClient.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

zapClient.on('ready', () => {
  console.log('GPT Zap iniciado com sucesso!');
});

function removeAnsiEscapeCodes(str: string) {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
zapClient.on('message', async (message) => {
  const isGroup = (await message.getChat()).isGroup;
  if (isGroup === true) {
    return;
  }

  await gpt4all.init();

  // Open the connection with the model
  await gpt4all.open();

  console.log(
    `${new Date()} - ${message.from}: ${message.body.slice(0, 40) + '...'}`
  );
  const response = await gpt4all.prompt(
    `Message from ${message.from}: ${message.body}`
  );
  console.log(`${new Date()} - ${message.from}-R: ${response}`);
  await zapClient.sendMessage(message.from, removeAnsiEscapeCodes(response));

  gpt4all.close();
});
