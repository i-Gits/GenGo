// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   GenGo! Database Seed
//   "planting the first flowers in the garden" 🌱
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is this file? ──────────────────────────────────────
// This script fills the database with initial content:
// - The Japanese language entry
// - SRS interval configs
// - Level 1 items (components, characters, vocabulary)
// - Meanings, readings, mnemonics, and dependencies
//
// Run it with: npx prisma db seed
//
// 🧠 Java analogy: This is like a database initializer or
//    a Flyway migration that inserts default data.

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter }) as unknown as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("🌱 Planting seeds in the garden...\n");

  // ═══════════════════════════════════════════════════════════
  //  1. CREATE LANGUAGE: Japanese
  // ═══════════════════════════════════════════════════════════

  const japanese = await prisma.language.upsert({
    where: { code: "ja" },
    update: {},
    create: {
      code: "ja",
      displayName: "日本語",
      writingSystemType: "logographic",
    },
  });
  console.log(`✅ Language: ${japanese.displayName} (${japanese.code})`);

  // ═══════════════════════════════════════════════════════════
  //  2. CREATE SRS CONFIGS for Japanese
  // ═══════════════════════════════════════════════════════════

  const srsIntervals = [
    { stage: 0, intervalHours: 0,    penaltyStages: 0 },  // 🌰 Seed
    { stage: 1, intervalHours: 4,    penaltyStages: 1 },  // 🌱 Sprout
    { stage: 2, intervalHours: 8,    penaltyStages: 1 },  // 🪴 Seedling
    { stage: 3, intervalHours: 24,   penaltyStages: 1 },  // 🌿 Young Plant
    { stage: 4, intervalHours: 72,   penaltyStages: 2 },  // 🌷 Budding
    { stage: 5, intervalHours: 168,  penaltyStages: 2 },  // 🌸 Blooming
    { stage: 6, intervalHours: 336,  penaltyStages: 2 },  // 🌺 Full Bloom
    { stage: 7, intervalHours: 720,  penaltyStages: 2 },  // 💐 Flourishing
    { stage: 8, intervalHours: 2880, penaltyStages: 2 },  // 🌳 Deeply Rooted
    { stage: 9, intervalHours: 0,    penaltyStages: 0 },  // 🪻 Eternal
  ];

  for (const config of srsIntervals) {
    await prisma.srsConfig.upsert({
      where: {
        languageId_stage: {
          languageId: japanese.id,
          stage: config.stage,
        },
      },
      update: config,
      create: {
        languageId: japanese.id,
        ...config,
      },
    });
  }
  console.log(`✅ SRS configs: ${srsIntervals.length} stages configured`);

  // ═══════════════════════════════════════════════════════════
  //  3. LEVEL 1 CONTENT: Components (Radicals)
  // ═══════════════════════════════════════════════════════════
  //
  // Components are the building blocks of kanji.
  // Level 1 starts with the simplest, most foundational ones.
  // These have NO dependencies -- they're the root of the tree!

  const components = [
    {
      display: "一",
      meanings: [{ meaning: "one", isPrimary: true }, { meaning: "ground", isPrimary: false }],
      readings: [],  // components don't always have standalone readings
      mnemonic: "A single horizontal line. The simplest stroke. One line, one meaning: one~ 🌱",
      jlptLevel: "N5",
    },
    {
      display: "｜",
      meanings: [{ meaning: "stick", isPrimary: true }, { meaning: "line", isPrimary: false }],
      readings: [],
      mnemonic: "A vertical stick standing tall in your garden. It's just a stick! Simple and straight~ 🌿",
      jlptLevel: null,
    },
    {
      display: "丶",
      meanings: [{ meaning: "drop", isPrimary: true }, { meaning: "dot", isPrimary: false }],
      readings: [],
      mnemonic: "A tiny raindrop falling on a leaf. Just one little drop~ 💧",
      jlptLevel: null,
    },
    {
      display: "ノ",
      meanings: [{ meaning: "slide", isPrimary: true }, { meaning: "sweep", isPrimary: false }],
      readings: [],
      mnemonic: "A gentle sweep, like sliding down a petal. Whee~ 🌸",
      jlptLevel: null,
    },
    {
      display: "二",
      meanings: [{ meaning: "two", isPrimary: true }],
      readings: [],
      mnemonic: "Two lines stacked. One wasn't enough -- now there's two! Double the fun~ ✌️",
      jlptLevel: "N5",
    },
    {
      display: "十",
      meanings: [{ meaning: "cross", isPrimary: true }, { meaning: "ten", isPrimary: false }],
      readings: [],
      mnemonic: "A horizontal line crossed by a vertical line. Like a tiny garden fence~ 🌻",
      jlptLevel: "N5",
    },
    {
      display: "口",
      meanings: [{ meaning: "mouth", isPrimary: true }, { meaning: "opening", isPrimary: false }],
      readings: [],
      mnemonic: "A perfect little square -- like an open mouth saying 'oh!' Or a pot for planting~ 🪴",
      jlptLevel: "N4",
    },
    {
      display: "人",
      meanings: [{ meaning: "person", isPrimary: true }, { meaning: "human", isPrimary: false }],
      readings: [],
      mnemonic: "Two legs walking through the garden. Just a person, taking a stroll on a nice day~ 🚶",
      jlptLevel: "N5",
    },
  ];

  const componentIds: Record<string, string> = {};

  for (const comp of components) {
    const item = await prisma.item.upsert({
      where: {
        id: `comp-${comp.display}`,
      },
      update: {},
      create: {
        id: `comp-${comp.display}`,
        languageId: japanese.id,
        type: "component",
        level: 1,
        primaryDisplay: comp.display,
        jlptLevel: comp.jlptLevel,
      },
    });

    componentIds[comp.display] = item.id;

    // Create meanings
    for (const m of comp.meanings) {
      await prisma.itemMeaning.upsert({
        where: { id: `meaning-${item.id}-${m.meaning}` },
        update: {},
        create: {
          id: `meaning-${item.id}-${m.meaning}`,
          itemId: item.id,
          meaning: m.meaning,
          isPrimary: m.isPrimary,
        },
      });
    }

    // Create mnemonic
    await prisma.itemMnemonic.upsert({
      where: { id: `mnemonic-${item.id}-meaning` },
      update: {},
      create: {
        id: `mnemonic-${item.id}-meaning`,
        itemId: item.id,
        mnemonicType: "meaning",
        text: comp.mnemonic,
      },
    });
  }
  console.log(`✅ Components: ${components.length} radicals planted`);

  // ═══════════════════════════════════════════════════════════
  //  4. LEVEL 1 CONTENT: Characters (Kanji)
  // ═══════════════════════════════════════════════════════════
  //
  // Characters (kanji) depend on components (radicals).
  // You must guru the radicals before these unlock!

  const characters = [
    {
      display: "一",
      meanings: [{ meaning: "one", isPrimary: true }],
      readings: [
        { reading: "いち", type: "onyomi", isPrimary: true },
        { reading: "いつ", type: "onyomi", isPrimary: false },
        { reading: "ひと", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "This kanji IS the radical -- one horizontal line means 'one'. The very beginning of everything. Every journey starts with one step~ 🌱",
      readingMnemonic: "いち -- imagine saying 'itchy' because when there's only ONE mosquito bite, it's いち (itchy)!",
      dependsOn: ["一"],
      jlptLevel: "N5",
    },
    {
      display: "二",
      meanings: [{ meaning: "two", isPrimary: true }],
      readings: [
        { reading: "に", type: "onyomi", isPrimary: true },
        { reading: "ふた", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "Two lines. One on top, one on bottom. If one line is one, two lines is two! Math checks out~ ✌️",
      readingMnemonic: "に -- like 'knee'. You have TWO knees! に (ni) = two!",
      dependsOn: ["二"],
      jlptLevel: "N5",
    },
    {
      display: "十",
      meanings: [{ meaning: "ten", isPrimary: true }],
      readings: [
        { reading: "じゅう", type: "onyomi", isPrimary: true },
        { reading: "とお", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "A cross shape. Count all four tips plus the center -- ancient counting magic says that's ten! Also looks like a plus sign: add everything up~ ➕",
      readingMnemonic: "じゅう -- sounds like 'jew-oo'. Imagine a jewel with TEN facets sparkling in the garden~",
      dependsOn: ["十"],
      jlptLevel: "N5",
    },
    {
      display: "人",
      meanings: [{ meaning: "person", isPrimary: true }, { meaning: "human", isPrimary: false }],
      readings: [
        { reading: "じん", type: "onyomi", isPrimary: true },
        { reading: "にん", type: "onyomi", isPrimary: false },
        { reading: "ひと", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "Two legs mid-stride. A person walking through your garden, leaving footprints in the soft earth~",
      readingMnemonic: "じん -- think of JIN from a fighting game! A PERSON who fights! にん -- sounds like NINja, a sneaky PERSON!",
      dependsOn: ["人"],
      jlptLevel: "N5",
    },
    {
      display: "口",
      meanings: [{ meaning: "mouth", isPrimary: true }],
      readings: [
        { reading: "こう", type: "onyomi", isPrimary: true },
        { reading: "く", type: "onyomi", isPrimary: false },
        { reading: "くち", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "A wide open mouth! 口 Like a square hole -- your mouth when you're surprised: 'oh!'",
      readingMnemonic: "こう -- sounds like 'co' as in company. A company needs many MOUTHs to feed! くち -- 'kuchi' sounds crunchy, like food in your MOUTH!",
      dependsOn: ["口"],
      jlptLevel: "N4",
    },
    {
      display: "三",
      meanings: [{ meaning: "three", isPrimary: true }],
      readings: [
        { reading: "さん", type: "onyomi", isPrimary: true },
        { reading: "み", type: "kunyomi", isPrimary: false },
      ],
      meaningMnemonic: "Three horizontal lines. One was one, two was two, three is... three! The pattern continues~ We're counting with sticks in the garden!",
      readingMnemonic: "さん -- like 'sun'! THREE rays of sunshine warming your garden~ ☀️",
      dependsOn: ["一", "二"],
      jlptLevel: "N5",
    },
  ];

  const characterIds: Record<string, string> = {};

  for (const char of characters) {
    const item = await prisma.item.upsert({
      where: { id: `char-${char.display}` },
      update: {},
      create: {
        id: `char-${char.display}`,
        languageId: japanese.id,
        type: "character",
        level: 1,
        primaryDisplay: char.display,
        jlptLevel: char.jlptLevel,
      },
    });

    characterIds[char.display] = item.id;

    // Meanings
    for (const m of char.meanings) {
      await prisma.itemMeaning.upsert({
        where: { id: `meaning-${item.id}-${m.meaning}` },
        update: {},
        create: {
          id: `meaning-${item.id}-${m.meaning}`,
          itemId: item.id,
          meaning: m.meaning,
          isPrimary: m.isPrimary,
        },
      });
    }

    // Readings (🚫 NO ROMAJI -- all in かな!)
    for (const r of char.readings) {
      await prisma.itemReading.upsert({
        where: { id: `reading-${item.id}-${r.reading}` },
        update: {},
        create: {
          id: `reading-${item.id}-${r.reading}`,
          itemId: item.id,
          reading: r.reading,
          readingType: r.type,
          isPrimary: r.isPrimary,
        },
      });
    }

    // Mnemonics
    await prisma.itemMnemonic.upsert({
      where: { id: `mnemonic-${item.id}-meaning` },
      update: {},
      create: {
        id: `mnemonic-${item.id}-meaning`,
        itemId: item.id,
        mnemonicType: "meaning",
        text: char.meaningMnemonic,
      },
    });

    await prisma.itemMnemonic.upsert({
      where: { id: `mnemonic-${item.id}-reading` },
      update: {},
      create: {
        id: `mnemonic-${item.id}-reading`,
        itemId: item.id,
        mnemonicType: "reading",
        text: char.readingMnemonic,
      },
    });

    // Dependencies (kanji depends on its component radicals)
    for (const depDisplay of char.dependsOn) {
      const depId = componentIds[depDisplay];
      if (depId) {
        await prisma.dependency.upsert({
          where: {
            itemId_dependsOnItemId: {
              itemId: item.id,
              dependsOnItemId: depId,
            },
          },
          update: {},
          create: {
            itemId: item.id,
            dependsOnItemId: depId,
          },
        });
      }
    }
  }
  console.log(`✅ Characters: ${characters.length} kanji planted`);

  // ═══════════════════════════════════════════════════════════
  //  5. LEVEL 1 CONTENT: Vocabulary
  // ═══════════════════════════════════════════════════════════
  //
  // Vocabulary depends on kanji. You must guru the kanji
  // before the vocab that uses them unlocks!

  const vocabulary = [
    {
      display: "一つ",
      meanings: [{ meaning: "one thing", isPrimary: true }],
      readings: [{ reading: "ひとつ", type: "kunyomi", isPrimary: true }],
      meaningMnemonic: "一 (one) + つ (counter). One single thing. You're holding one flower in your hand~ 🌸",
      readingMnemonic: "ひとつ -- 'hee-toh-tsu'. A person (ひと) holding one (つ) thing!",
      dependsOn: ["一"],
      jlptLevel: "N5",
    },
    {
      display: "二つ",
      meanings: [{ meaning: "two things", isPrimary: true }],
      readings: [{ reading: "ふたつ", type: "kunyomi", isPrimary: true }],
      meaningMnemonic: "二 (two) + つ (counter). Two things! A pair of flowers blooming side by side~ 🌸🌸",
      readingMnemonic: "ふたつ -- 'foo-tah-tsu'. Think of two FOOTsteps: left, right. Two things!",
      dependsOn: ["二"],
      jlptLevel: "N5",
    },
    {
      display: "十",
      meanings: [{ meaning: "ten", isPrimary: true }],
      readings: [{ reading: "じゅう", type: "onyomi", isPrimary: true }],
      meaningMnemonic: "When used as vocabulary, 十 by itself means ten! A full set of ten fingers~ ✋✋",
      readingMnemonic: "じゅう -- same as the kanji reading! Consistent and simple~",
      dependsOn: ["十"],
      jlptLevel: "N5",
    },
    {
      display: "人口",
      meanings: [{ meaning: "population", isPrimary: true }],
      readings: [{ reading: "じんこう", type: "onyomi", isPrimary: true }],
      meaningMnemonic: "人 (person) + 口 (mouth). Count the mouths to count the people -- that's population! How many mouths does your garden city need to feed?",
      readingMnemonic: "じんこう -- じん (person) + こう (mouth). Put the kanji readings together and you get the vocab reading! This pattern is very common~",
      dependsOn: ["人", "口"],
      jlptLevel: "N4",
    },
    {
      display: "三つ",
      meanings: [{ meaning: "three things", isPrimary: true }],
      readings: [{ reading: "みっつ", type: "kunyomi", isPrimary: true }],
      meaningMnemonic: "三 (three) + つ (counter). Three things! Three seeds in a row, ready to sprout~ 🌰🌰🌰",
      readingMnemonic: "みっつ -- 'meet-tsu'. Three friends MeeTing at a cafe -- three things!",
      dependsOn: ["三"],
      jlptLevel: "N5",
    },
    {
      display: "一人",
      meanings: [{ meaning: "one person", isPrimary: true }, { meaning: "alone", isPrimary: false }],
      readings: [{ reading: "ひとり", type: "kunyomi", isPrimary: true }],
      meaningMnemonic: "一 (one) + 人 (person). One person. Just you, alone in the garden, enjoying the quiet~",
      readingMnemonic: "ひとり -- 'hee-toh-ree'. One person = ひとり. This is a special reading you just memorize!",
      dependsOn: ["一", "人"],
      jlptLevel: "N5",
    },
    {
      display: "二人",
      meanings: [{ meaning: "two people", isPrimary: true }],
      readings: [{ reading: "ふたり", type: "kunyomi", isPrimary: true }],
      meaningMnemonic: "二 (two) + 人 (person). Two people! A friend joins you in the garden~ 🌸🌸",
      readingMnemonic: "ふたり -- 'foo-tah-ree'. Two people = ふたり. Another special reading, just like ひとり!",
      dependsOn: ["二", "人"],
      jlptLevel: "N5",
    },
  ];

  for (const vocab of vocabulary) {
    const item = await prisma.item.upsert({
      where: { id: `vocab-${vocab.display}` },
      update: {},
      create: {
        id: `vocab-${vocab.display}`,
        languageId: japanese.id,
        type: "vocabulary",
        level: 1,
        primaryDisplay: vocab.display,
        jlptLevel: vocab.jlptLevel,
      },
    });

    for (const m of vocab.meanings) {
      await prisma.itemMeaning.upsert({
        where: { id: `meaning-${item.id}-${m.meaning}` },
        update: {},
        create: {
          id: `meaning-${item.id}-${m.meaning}`,
          itemId: item.id,
          meaning: m.meaning,
          isPrimary: m.isPrimary,
        },
      });
    }

    for (const r of vocab.readings) {
      await prisma.itemReading.upsert({
        where: { id: `reading-${item.id}-${r.reading}` },
        update: {},
        create: {
          id: `reading-${item.id}-${r.reading}`,
          itemId: item.id,
          reading: r.reading,
          readingType: r.type,
          isPrimary: r.isPrimary,
        },
      });
    }

    await prisma.itemMnemonic.upsert({
      where: { id: `mnemonic-${item.id}-meaning` },
      update: {},
      create: {
        id: `mnemonic-${item.id}-meaning`,
        itemId: item.id,
        mnemonicType: "meaning",
        text: vocab.meaningMnemonic,
      },
    });

    await prisma.itemMnemonic.upsert({
      where: { id: `mnemonic-${item.id}-reading` },
      update: {},
      create: {
        id: `mnemonic-${item.id}-reading`,
        itemId: item.id,
        mnemonicType: "reading",
        text: vocab.readingMnemonic,
      },
    });

    // Dependencies (vocab depends on its kanji)
    for (const depDisplay of vocab.dependsOn) {
      const depId = characterIds[depDisplay];
      if (depId) {
        await prisma.dependency.upsert({
          where: {
            itemId_dependsOnItemId: {
              itemId: item.id,
              dependsOnItemId: depId,
            },
          },
          update: {},
          create: {
            itemId: item.id,
            dependsOnItemId: depId,
          },
        });
      }
    }
  }
  console.log(`✅ Vocabulary: ${vocabulary.length} words planted`);

  // ═══════════════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════════════

  console.log("\n🌸 Garden seeded successfully!");
  console.log(`   Components: ${components.length}`);
  console.log(`   Characters: ${characters.length}`);
  console.log(`   Vocabulary: ${vocabulary.length}`);
  console.log(`   Total items: ${components.length + characters.length + vocabulary.length}`);
  console.log("\n   Your garden is ready to grow~ 🌱✨\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
