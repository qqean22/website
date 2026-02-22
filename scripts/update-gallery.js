#!/usr/bin/env node
/**
 * Scans images/work for category folders, then shoot folders, then images.
 * Categories: products, events, clothing, personal-branding
 * Output: gallery.json with { category: [ { shoot, images: [] } ], ... }
 * Run from project root: node scripts/update-gallery.js
 */

const fs = require('fs');
const path = require('path');

const GALLERY_DIR = path.join(__dirname, '..', 'images', 'work');
const GALLERY_JSON = path.join(GALLERY_DIR, 'gallery.json');
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const CATEGORIES = [
    'personal-branding',
    'clothing',
    'products',
    'events'
];

function getImages(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter((name) => {
            const ext = path.extname(name).toLowerCase();
            return ALLOWED_EXT.includes(ext) && !name.startsWith('.');
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getShoots(categoryDir) {
    if (!fs.existsSync(categoryDir)) return [];
    return fs.readdirSync(categoryDir)
        .filter((name) => {
            const full = path.join(categoryDir, name);
            return fs.statSync(full).isDirectory() && !name.startsWith('.');
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

const gallery = {};
let totalShoots = 0;
let totalImages = 0;

for (const cat of CATEGORIES) {
    const categoryDir = path.join(GALLERY_DIR, cat);
    gallery[cat] = [];

    getShoots(categoryDir).forEach((shootDirName) => {
        const shootPath = path.join(categoryDir, shootDirName);
        const images = getImages(shootPath);
        if (images.length > 0) {
            gallery[cat].push({ shoot: shootDirName, images });
            totalShoots += 1;
            totalImages += images.length;
        }
    });
}

fs.writeFileSync(GALLERY_JSON, JSON.stringify(gallery, null, 2), 'utf8');
console.log(`Gallery updated: ${totalShoots} shoot(s), ${totalImages} image(s) → images/work/gallery.json`);
console.log('Categories:', Object.keys(gallery).filter((k) => gallery[k].length > 0).join(', ') || '(none yet)');
