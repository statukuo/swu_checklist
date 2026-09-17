const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const API_URL = "https://admin.starwarsunlimited.com/api/card-list";

function normalizeName(name) {
  return name.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function csvField(value) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function fetchCardCandidates(setKey, cardNumber) {
  const url = new URL(API_URL);
  url.searchParams.set("locale", "en");
  url.searchParams.set("filters[cardNumber][$eq]", cardNumber);
  url.searchParams.set("filters[expansion][code][$eq]", setKey);

  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const { data } = await response.json();
  return data;
}

// Same setKey+cardNumber can be reused across different products (leaders,
// tokens, promos), so the original English name is used to pick the right one.
function pickBestCandidate(candidates, originalName) {
  if (candidates.length <= 1) return candidates[0] || null;

  const target = normalizeName(originalName);

  for (const candidate of candidates) {
    const { title, subtitle } = candidate.attributes;
    const candidateName = normalizeName(subtitle ? `${title}${subtitle}` : title);
    if (candidateName === target) return candidate;
  }

  return candidates[0];
}

function extractName(card, locale) {
  const { title, subtitle } = card.attributes;
  if (locale === "en") {
    return subtitle ? `${title} ${subtitle}` : title;
  }

  const localizations = card.attributes.localizations?.data || [];
  const localization = localizations.find(l => l.attributes.locale === locale);
  if (!localization) return null;

  const { title: locTitle, subtitle: locSubtitle } = localization.attributes;
  return locSubtitle ? `${locTitle} ${locSubtitle}` : locTitle;
}

async function translateCsv(filePath, locale) {
  const raw = fs.readFileSync(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const rows = parse(raw, { relax_column_count: true, skip_empty_lines: true });

  const outputRows = [];

  for (const row of rows) {
    const [setKey, cardNumber, name] = row;

    try {
      const candidates = await fetchCardCandidates(setKey.trim(), cardNumber.trim());
      const card = pickBestCandidate(candidates, name);

      if (!card) {
        console.log(`No match for ${setKey} ${cardNumber} (${name}), keeping original`);
        outputRows.push(row);
      } else {
        const translatedName = extractName(card, locale).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");
        if (!translatedName) {
          console.log(`No ${locale} localization for ${setKey} ${cardNumber} (${name}), keeping original`);
          outputRows.push(row);
        } else {
          outputRows.push([setKey, cardNumber, translatedName, ...row.slice(3)]);
        }
      }
    } catch (error) {
      console.log(`ERROR fetching ${setKey} ${cardNumber} (${name}): ${error.message}`);
      outputRows.push(row);
    }

    console.log(`[${setKey}-${cardNumber.padStart(3, "0")}] (${outputRows.length}/${rows.length})`, outputRows[outputRows.length - 1][2]);

    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const outputPath = path.join(dir, `${base}-${locale}${ext}`);

  const csvText = outputRows.map(cols => cols.map(csvField).join(",")).join(eol) + eol;
  fs.writeFileSync(outputPath, csvText);
  console.log(`DONE writing ${outputPath}`);
}

const [, , filePath, locale] = process.argv;

if (!filePath || !locale) {
  console.log("Usage: node translateCsvNames.js <csvPath> <locale>");
  process.exit(1);
}

translateCsv(path.resolve(filePath), locale).catch(error => {
  console.log("ERROR", error);
  process.exit(1);
});
