#!/usr/bin/env node
/**
 * Validates a jobs.json file against the schema the viewer expects.
 * Usage: node scripts/validate.js path/to/data/jobs.json
 * Exits non-zero on any error, so it can be used as a pre-commit check.
 */

const fs = require("fs");

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/validate.js path/to/data/jobs.json");
  process.exit(2);
}

let raw;
try {
  raw = fs.readFileSync(path, "utf8");
} catch (e) {
  console.error(`Cannot read ${path}: ${e.message}`);
  process.exit(2);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`Invalid JSON in ${path}: ${e.message}`);
  process.exit(2);
}

const errors = [];
const warnings = [];

if (!data.meta || typeof data.meta !== "object") {
  errors.push("Missing top-level \"meta\" object.");
}
if (!Array.isArray(data.jobs)) {
  errors.push("Missing top-level \"jobs\" array.");
}

if (errors.length) {
  report();
}

const meta = data.meta;
const categories = meta.categories || {};

if (!meta.categoryOrder || !Array.isArray(meta.categoryOrder)) {
  errors.push("meta.categoryOrder must be an array of category keys.");
} else {
  meta.categoryOrder.forEach(cat => {
    if (!(cat in categories)) {
      errors.push(`meta.categoryOrder references "${cat}", which has no entry in meta.categories.`);
    }
  });
}

const seen = new Set();
const requiredFields = ["role", "company", "loc", "cat", "url"];

data.jobs.forEach((job, i) => {
  const where = `jobs[${i}]`;
  requiredFields.forEach(field => {
    if (!job[field] || typeof job[field] !== "string" || !job[field].trim()) {
      errors.push(`${where}: missing or empty required field "${field}".`);
    }
  });

  if (job.cat && !(job.cat in categories)) {
    errors.push(`${where}: cat "${job.cat}" has no entry in meta.categories.`);
  }

  if (job.url) {
    try {
      new URL(job.url);
    } catch {
      errors.push(`${where}: url "${job.url}" is not a valid absolute URL.`);
    }
  }

  if (job.role && job.company) {
    const key = (job.company + "||" + job.role).toLowerCase();
    if (seen.has(key)) {
      warnings.push(`${where}: duplicate role+company ("${job.role}" @ "${job.company}") — possible duplicate listing.`);
    }
    seen.add(key);
  }
});

report();

function report() {
  if (warnings.length) {
    console.warn(`${warnings.length} warning(s):`);
    warnings.forEach(w => console.warn("  ⚠ " + w));
  }
  if (errors.length) {
    console.error(`${errors.length} error(s) in ${path}:`);
    errors.forEach(e => console.error("  ✗ " + e));
    process.exit(1);
  }
  console.log(`✓ ${path} is valid — ${data.jobs ? data.jobs.length : 0} job(s), ${Object.keys(categories).length} categor${Object.keys(categories).length === 1 ? "y" : "ies"}.`);
}
