import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import PDFDocument from 'pdfkit';
import { env } from '../config/env.js';
import { slugify } from '../utils/misc.js';

const VIDEO_SPECS = [
  { file: 'demo-lecture-14.mp4', duration: 840 },
  { file: 'demo-lecture-18.mp4', duration: 1080 },
  { file: 'demo-lecture-24.mp4', duration: 1440 },
  { file: 'demo-lecture-32.mp4', duration: 1920 },
  { file: 'demo-lecture-38.mp4', duration: 2280 },
  { file: 'demo-lecture-45.mp4', duration: 2700 },
];

let ffmpegBinary = null;
try {
  const mod = await import('ffmpeg-static');
  ffmpegBinary = mod.default || null;
} catch {
  ffmpegBinary = null;
}

export function ensureDemoVideos({ log = console.log } = {}) {
  const videoDir = path.join(env.seedMediaDir, 'videos');
  fs.mkdirSync(videoDir, { recursive: true });
  const hasBinary = ffmpegBinary && fs.existsSync(ffmpegBinary);
  if (!hasBinary) {
    log('[seed] ffmpeg-static not found — lecture videos will be skipped. Lectures remain listed but playback shows a setup notice.');
    return VIDEO_SPECS.map((spec) => ({ ...spec, key: null }));
  }
  return VIDEO_SPECS.map((spec) => {
    const target = path.join(videoDir, spec.file);
    if (!fs.existsSync(target)) {
      const filter = [
        `drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='EduPulse':fontcolor=0xF97316:fontsize=92:x=(w-text_w)/2:y=(h-text_h)/2-70`,
        `drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='Sample lecture recording':fontcolor=0xE5E7EB:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+20`,
        `drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='Demo media for the EduPulse MVP':fontcolor=0x94A3B8:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2+78`,
      ].join(',');
      const args = [
        '-y',
        '-f', 'lavfi',
        '-i', `gradients=s=1280x720:r=3:d=${spec.duration}:c0=0x111827:c1=0x1E293B:speed=0.02`,
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-shortest',
        '-vf', filter,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '34',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '32k',
        '-movflags', '+faststart',
        target,
      ];
      log(`[seed] Rendering ${spec.file} (${Math.round(spec.duration / 60)} min demo lecture)…`);
      const result = spawnSync(ffmpegBinary, args, { stdio: 'pipe' });
      if (result.status !== 0) {
        log(`[seed] ffmpeg failed for ${spec.file}: ${String(result.stderr).slice(-400)}`);
        return { ...spec, key: null };
      }
    }
    return { ...spec, key: `seed/videos/${spec.file}` };
  });
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

function sanitizeText(value) {
  return String(value)
    .replace(/•/g, '-')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => `^${'0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch)]}`)
    .replace(/⁻/g, '^-')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => `_${'0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(ch)]}`)
    .replace(/[αβγδεζηικρστχψ]/g, (ch) => ({ α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', ζ: 'zeta', η: 'eta', ι: 'iota', κ: 'kappa', ρ: 'rho', σ: 'sigma', τ: 'tau', χ: 'chi', ψ: 'psi' })[ch])
    .replace(/θ/g, 'theta')
    .replace(/λ/g, 'lambda')
    .replace(/μ/g, 'mu')
    .replace(/ν/g, 'nu')
    .replace(/ω/g, 'omega')
    .replace(/φ/g, 'phi')
    .replace(/Δ/g, 'Delta')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/∫/g, 'integral')
    .replace(/∑/g, 'sum')
    .replace(/∞/g, 'infinity')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/−/g, '-')
    .replace(/→/g, '->')
    .replace(/[′’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x00-\xFF]/g, '');
}

function line(doc, text, options = {}) {
  doc.text(sanitizeText(text), { lineGap: 4, ...options });
}

export function generateMaterialPdf(material) {
  const dir = path.join(env.seedMediaDir, 'pdfs');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${slugify(material.title)}.pdf`;
  const target = path.join(dir, filename);
  if (fs.existsSync(target)) return Promise.resolve(`seed/pdfs/${filename}`);

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: material.title, Author: 'EduPulse' } });
  const stream = fs.createWriteStream(target);
  doc.pipe(stream);

  doc.rect(0, 0, PAGE_WIDTH, 116).fill('#111827');
  doc.fillColor('#F97316').fontSize(11).font('Helvetica-Bold').text('EDUPULSE  ·  STUDY MATERIAL');
  doc.moveDown(0.4);
  doc.fillColor('#FFFFFF').fontSize(20).text(sanitizeText(material.title), { width: PAGE_WIDTH - MARGIN * 2 });
  doc.fillColor('#CBD5E1').fontSize(10).font('Helvetica').text(sanitizeText(`${material.exam} - ${material.category}${material.subject ? ` - ${material.subject}` : ''}`));
  doc.moveDown(1.4);

  doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('How to use this resource');
  doc.moveDown(0.3);
  doc.fontSize(10.5).font('Helvetica').fillColor('#334155');
  line(doc, material.description || 'A concise, exam-focused resource prepared by EduPulse educators.');
  doc.moveDown(0.8);

  material.sections.forEach((section, index) => {
    if (doc.y > PAGE_HEIGHT - 150) doc.addPage();
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text(sanitizeText(`${index + 1}. ${section.heading}`));
    doc.moveDown(0.3);
    doc.fontSize(10.5).font('Helvetica').fillColor('#334155');
    section.points.forEach((point) => {
      doc.text(sanitizeText(`•  ${point}`), { indent: 6, lineGap: 3 });
    });
    doc.moveDown(0.7);
  });

  if (doc.y > PAGE_HEIGHT - 170) doc.addPage();
  doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Practice questions');
  doc.moveDown(0.4);
  doc.fontSize(10.5).font('Helvetica').fillColor('#334155');
  material.practice.forEach((question, index) => {
    doc.text(sanitizeText(`${index + 1}. ${question.q}`));
    doc.fillColor('#64748B').fontSize(9.5).text(sanitizeText(`   Answer: ${question.a}`));
    doc.fillColor('#334155').fontSize(10.5);
    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  if (doc.y > PAGE_HEIGHT - 100) doc.addPage();
  doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica').text(
    '© EduPulse. This document is original educational content prepared for demonstration and learning purposes. Please do not redistribute outside the platform.',
    { width: PAGE_WIDTH - MARGIN * 2 },
  );

  doc.end();
  return new Promise((resolve) => {
    stream.on('finish', () => resolve(`seed/pdfs/${filename}`));
  });
}
