import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../docs/pitch-deck.html');
const outputPath = path.resolve(__dirname, '../docs/Oppuna-Pitch-Deck.pdf');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

const slideCount = await page.$$eval('.slide', (slides) => slides.length);
const merged = await PDFDocument.create();

for (let i = 0; i < slideCount; i += 1) {
  await page.evaluate((index) => {
    document.querySelectorAll('.slide').forEach((slide, j) => {
      slide.style.display = j === index ? 'flex' : 'none';
      slide.style.position = 'relative';
      slide.style.inset = 'auto';
    });
    document.querySelector('.nav')?.remove();
    document.querySelector('.progress')?.remove();
  }, i);

  await new Promise((resolve) => setTimeout(resolve, 150));

  const bytes = await page.pdf({
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const doc = await PDFDocument.load(bytes);
  const [copied] = await merged.copyPages(doc, [0]);
  merged.addPage(copied);
  console.log(`Rendered slide ${i + 1}/${slideCount}`);
}

const pdfBytes = await merged.save();
fs.writeFileSync(outputPath, pdfBytes);
await browser.close();

console.log(`PDF saved: ${outputPath} (${slideCount} slides)`);
