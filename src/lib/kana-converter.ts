// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Romaji → Kana Converter
//   "silent translation, no romaji shown" 🤫
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is this? ──────────────────────────────────────────────
// When the user types a READING answer, they type in romaji
// (English letters) and we silently convert to hiragana.
//
// The user sees KANA in the input field, never romaji.
// This enforces the "NO ROMAJI" rule from the PRD.
//
// Example: user types "ji" → input shows "じ"
//          user types "n" → waits, types "a" → shows "な"
//          user types "nn" → shows "ん"
//
// 🧠 This is basically an IME (Input Method Editor) in code.
//    Japanese people use similar systems to type on computers!

// ── Romaji to Hiragana mapping ─────────────────────────────────
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  // Vowels
  "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",

  // K-row
  "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",

  // S-row
  "sa": "さ", "si": "し", "su": "す", "se": "せ", "so": "そ",
  "shi": "し",

  // T-row
  "ta": "た", "ti": "ち", "tu": "つ", "te": "て", "to": "と",
  "chi": "ち", "tsu": "つ",

  // N-row
  "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",

  // H-row
  "ha": "は", "hi": "ひ", "hu": "ふ", "he": "へ", "ho": "ほ",
  "fu": "ふ",

  // M-row
  "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",

  // Y-row
  "ya": "や", "yu": "ゆ", "yo": "よ",

  // R-row
  "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",

  // W-row
  "wa": "わ", "wi": "ゐ", "we": "ゑ", "wo": "を",

  // N (standalone)
  "nn": "ん", "n'": "ん", "xn": "ん",

  // Dakuten (voiced)
  "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
  "za": "ざ", "zi": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
  "ji": "じ",
  "da": "だ", "di": "ぢ", "du": "づ", "de": "で", "do": "ど",
  "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",

  // Handakuten (half-voiced)
  "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",

  // Combo sounds (yoon)
  "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
  "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
  "sya": "しゃ", "syu": "しゅ", "syo": "しょ",
  "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
  "tya": "ちゃ", "tyu": "ちゅ", "tyo": "ちょ",
  "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
  "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
  "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
  "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
  "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
  "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
  "jya": "じゃ", "jyu": "じゅ", "jyo": "じょ",
  "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
  "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ",

  // Small kana
  "xa": "ぁ", "xi": "ぃ", "xu": "ぅ", "xe": "ぇ", "xo": "ぉ",
  "xya": "ゃ", "xyu": "ゅ", "xyo": "ょ",
  "xtu": "っ", "xtsu": "っ",

  // Long vowel mark
  "-": "ー",
};

// ── Double consonant → っ + consonant ──────────────────────────
// "kk" → "っk", "pp" → "っp", etc.
const DOUBLE_CONSONANTS = new Set([
  "bb", "cc", "dd", "ff", "gg", "hh", "jj", "kk", "ll", "mm",
  "pp", "qq", "rr", "ss", "tt", "vv", "ww", "xx", "yy", "zz",
]);

// ── Main conversion function ──────────────────────────────────
// Takes a romaji string and returns { kana, pending }
// - kana: the converted characters so far
// - pending: remaining romaji that hasn't been converted yet
//   (waiting for more input to complete a character)

export function romajiToKana(input: string): { kana: string; pending: string } {
  let result = "";
  let buffer = "";
  const chars = input.toLowerCase();

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // If it's already kana or not a letter, pass through
    if (!/[a-z'-]/.test(char)) {
      if (buffer.length > 0) {
        // Try to convert buffer before passing through
        const converted = ROMAJI_TO_HIRAGANA[buffer];
        if (converted) {
          result += converted;
        } else {
          result += buffer;
        }
        buffer = "";
      }
      result += char;
      continue;
    }

    buffer += char;

    // Check for double consonant (っ)
    if (buffer.length >= 2) {
      const lastTwo = buffer.slice(-2);
      if (DOUBLE_CONSONANTS.has(lastTwo)) {
        // Convert everything before the double into kana
        const before = buffer.slice(0, -2);
        if (before.length > 0) {
          const converted = ROMAJI_TO_HIRAGANA[before];
          if (converted) {
            result += converted;
          } else {
            result += before;
          }
        }
        result += "っ";
        buffer = buffer.slice(-1); // Keep the second consonant
        continue;
      }
    }

    // Handle 'n' before a consonant (not followed by a vowel or 'y')
    if (buffer.length >= 2 && buffer[0] === "n" && buffer[1] !== "n" &&
        buffer[1] !== "y" && buffer[1] !== "a" && buffer[1] !== "i" &&
        buffer[1] !== "u" && buffer[1] !== "e" && buffer[1] !== "o") {
      result += "ん";
      buffer = buffer.slice(1);
    }

    // Try to match the longest possible romaji sequence
    let matched = false;
    for (let len = Math.min(buffer.length, 4); len >= 1; len--) {
      const substr = buffer.slice(0, len);
      if (ROMAJI_TO_HIRAGANA[substr]) {
        result += ROMAJI_TO_HIRAGANA[substr];
        buffer = buffer.slice(len);
        matched = true;
        break;
      }
    }

    // If we matched, re-check the remaining buffer
    if (matched) {
      i -= 0; // continue with next char (already advanced)
    }
  }

  return { kana: result, pending: buffer };
}

// ── Quick converter for final submission ──────────────────────
// Converts any remaining buffer (including trailing 'n' → 'ん')
export function romajiToKanaFinal(input: string): string {
  const { kana, pending } = romajiToKana(input);

  // Handle trailing 'n' → 'ん'
  if (pending === "n") {
    return kana + "ん";
  }

  // If there's remaining unconverted text, just append it
  return kana + pending;
}
