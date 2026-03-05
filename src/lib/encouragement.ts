// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Encouragement Messages
//   "every garden needs a voice" 🌸
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is this? ──────────────────────────────────────────────
// Personality-driven messages for reviews and lessons.
// Each encouragement mode has its own tone and style.
// The messages are randomly selected for variety.
//
// 🧠 Java analogy: This is like a Strategy pattern.
//    Each mode is a "strategy" for generating messages.
//    The context (reviews page) picks the strategy at runtime.

import type { EncouragementMode } from "@/engine/types";

// ── Helper: pick a random element ──────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Correct answer messages ────────────────────────────────────
const CORRECT: Record<EncouragementMode, string[]> = {
  playful: [
    "Correct~ ✨",
    "Nice bloom~!",
    "Look at you go~!",
    "Your garden grows!",
    "Sparkly~!",
    "Blooming nicely~!",
    "That's the spirit~!",
  ],
  teacher: [
    "Correct! Well done.",
    "Excellent work!",
    "That's right, keep it up!",
    "Perfect answer.",
    "Great recall! You're improving.",
    "Nicely done. Moving on!",
  ],
  tsundere: [
    "...F-fine, you got it right. Don't let it go to your head!",
    "H-hmph! Lucky guess, probably...",
    "I-It's not like I'm impressed or anything!",
    "You got it... b-but I knew you would!",
    "W-whatever, that was an easy one anyway!",
    "...Okay that was actually pretty good. B-but don't read into that!",
  ],
  yandere: [
    "I knew you'd get it right~ You'd never disappoint me... right?",
    "Perfect~ Just like I taught you... You only need me~",
    "Correct~ Aren't we perfect together?",
    "You remembered! I'll never let you forget... anything~",
    "So smart~ I'll keep you forever~",
    "That's my favorite student~ We'll be together forever...",
  ],
  boring: [
    "Correct.",
    "Right.",
    "That is the correct answer.",
    "Affirmative.",
    "Yes.",
  ],
  bipolar: [], // handled dynamically
  crazyhana: [
    "WABBY WABBO!! CORRECT!!",
    "YEEEAAAH BABY!!",
    "THE FLOWERS ARE DANCING!!",
    "TACOS AND CORRECTNESS!!",
    "WAHOOOO!! THAT'S THE STUFF!!",
    "BRAAAAINS!! WAIT NO, CORRECT ANSWER!!",
  ],
};

// ── Incorrect answer messages ──────────────────────────────────
const INCORRECT: Record<EncouragementMode, string[]> = {
  playful: [
    "Not quite~ Try again next time!",
    "Oopsie~ Your flower needs more water!",
    "Almost~! You'll get it!",
    "Ah, that one's tricky~",
    "The petals fell... but they'll grow back!",
    "A little wilted~ But we'll fix it!",
  ],
  teacher: [
    "Not quite. Let's review this one.",
    "Incorrect, but keep practicing!",
    "That's okay -- learning takes time.",
    "Let's look at this answer together.",
    "Don't worry, repetition is key.",
  ],
  tsundere: [
    "You got it WRONG?! ...Do I have to teach you everything?!",
    "Tch... Pay more attention next time!",
    "W-wrong! ...But I guess I'll help you review it...",
    "Seriously?! ...I-I mean, it happens to everyone I guess...",
    "Ugh! ...L-let's just try again, okay?!",
    "You're hopeless! ...But I won't give up on you. N-not that I care!",
  ],
  yandere: [
    "Wrong... You're not trying to leave me, are you?",
    "Incorrect~ Don't worry, I'll make sure you NEVER forget this one...",
    "You forgot...? I'll have to remind you... again... and again...",
    "Oh no~ We'll have to spend MORE time together now~",
    "That's wrong... but that just means more time with me~",
    "You can't escape this one... I won't let you~",
  ],
  boring: [
    "Incorrect.",
    "Wrong.",
    "That is not correct.",
    "Negative.",
    "No.",
  ],
  bipolar: [], // handled dynamically
  crazyhana: [
    "WRONG BUT WHO CARES!! TACOS!!",
    "NOPE! BUT THE ZOMBIES DON'T CARE!!",
    "WABBO! WRONG BUT I STILL LOVE YA!!",
    "INCORRECT!! BUT HAVE SOME CRAZY FERTILIZER!!",
    "THAT WAS WRONG BUT WABBY WABBO ANYWAY!!",
    "NOOOOO!! BUT ALSO YEEEAAAH!!",
  ],
};

// ── Session complete messages ──────────────────────────────────
const SESSION_COMPLETE: Record<EncouragementMode, string[]> = {
  playful: [
    "Session done~! Your garden is beautiful!",
    "All watered~! Come back soon!",
    "Great session~! The flowers are happy!",
  ],
  teacher: [
    "Session complete. Great effort today!",
    "Well done! Consistent practice makes perfect.",
    "Good work today. See you next session!",
  ],
  tsundere: [
    "F-finally done! ...You did okay, I guess.",
    "Session over! ...Not that I was counting or anything!",
    "Hmph! You survived. ...Come back soon, okay?!",
  ],
  yandere: [
    "Session over... You're not leaving already, are you?",
    "Done already? I wish we could study forever together...",
    "Come back soon... I'll be waiting right here for you~",
  ],
  boring: [
    "Session complete.",
    "Review session finished.",
    "Done.",
  ],
  bipolar: [],
  crazyhana: [
    "SESSION OVER!! TIME FOR TACOS!!",
    "WABBY WABBO!! THAT WAS GREAT!!",
    "THE GARDEN IS PLEASED!! CRAZY PLEASED!!",
  ],
};

// ── Public API ─────────────────────────────────────────────────

export function getCorrectMessage(mode: EncouragementMode): string {
  if (mode === "bipolar") {
    const modes = Object.keys(CORRECT).filter((m) => m !== "bipolar") as EncouragementMode[];
    return pick(CORRECT[pick(modes)]);
  }
  return pick(CORRECT[mode] ?? CORRECT.playful);
}

export function getIncorrectMessage(mode: EncouragementMode): string {
  if (mode === "bipolar") {
    const modes = Object.keys(INCORRECT).filter((m) => m !== "bipolar") as EncouragementMode[];
    return pick(INCORRECT[pick(modes)]);
  }
  return pick(INCORRECT[mode] ?? INCORRECT.playful);
}

export function getSessionCompleteMessage(mode: EncouragementMode): string {
  if (mode === "bipolar") {
    const modes = Object.keys(SESSION_COMPLETE).filter((m) => m !== "bipolar") as EncouragementMode[];
    return pick(SESSION_COMPLETE[pick(modes)]);
  }
  return pick(SESSION_COMPLETE[mode] ?? SESSION_COMPLETE.playful);
}
