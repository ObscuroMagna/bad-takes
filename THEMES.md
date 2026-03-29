# Bad Takes — Theme System

## Overview

Themes control the visual personality of the app: particle effects, rare drops, verdict labels/icons, and accent colors. The app loads a theme config and all visual components read from it, making it trivial to swap themes without touching component code.

## Theme Config Structure

```js
const theme = {
  name: "default",

  // Particle effects on clapperboard snap
  particles: {
    type: "popcorn" | "emoji" | "css",  // rendering strategy
    count: 12,                           // particles per burst
    // For type "popcorn":
    colors: ["#fff8dc", "#fffacd"],      // CSS blob fill colors
    // For type "emoji":
    emojis: ["🎃", "👻"],               // emoji pool
  },

  // Rare drop system — random bonus effects on some claps
  rareDrops: {
    chance: 0.12,                        // probability per clap (0–1)
    emojis: ["🔥", "💀", "🤡"],         // emoji pool for rare bursts
    count: 8,                            // how many rare particles
    // Could also include:
    // sound: "/rare.mp3",               // optional bonus sound
    // screenEffect: "shake" | "flash",  // optional screen effect
  },

  // Verdict scale (trash-to-trophy rating based on vote ratio)
  verdicts: [
    { icon: "🗑️", label: "TRASH",             color: "#f44336", maxRatio: 0.2 },
    { icon: "♻️", label: "PRETTY BAD",         color: "#ff7043", maxRatio: 0.4 },
    { icon: "😐", label: "MEH",               color: "#999",    maxRatio: 0.6 },
    { icon: "👑", label: "SOLID TAKE",         color: "#ffb300", maxRatio: 0.8 },
    { icon: "🏆", label: "CERTIFIED BANGER",   color: "#ffd700", maxRatio: 1.0 },
  ],

  // Vote button icons
  voteIcons: {
    up: "🏆",
    down: "🗑️",
  },

  // Accent color used for glows, highlights
  accent: "#ffd700",

  // Optional background override
  background: null,  // null = use default gradient
};
```

## Activation Strategies

Themes can be activated in several ways (implement as needed):

- **Date-based auto-switch**: Check the current date and load a seasonal theme automatically. For example, load Halloween theme Oct 15–Nov 1, Christmas Dec 10–Dec 31.
- **Firebase remote config**: Store the active theme name in Firebase so you can switch themes for all users without redeploying.
- **User toggle**: Add a theme picker in the UI (future feature).
- **URL parameter**: `?theme=halloween` for testing/sharing themed links.

### Suggested date-based schedule

| Theme       | Start    | End      |
|-------------|----------|----------|
| Valentine's | Feb 7    | Feb 15   |
| St Patrick's| Mar 14   | Mar 18   |
| Easter      | varies   | varies   |
| 4th of July | Jun 30   | Jul 5    |
| Halloween   | Oct 15   | Nov 1    |
| Thanksgiving| Nov 20   | Nov 28   |
| Christmas   | Dec 10   | Dec 31   |
| New Year's  | Dec 31   | Jan 2    |
| Super Bowl  | game day | +1 day   |

---

## Theme Definitions

### Default

The everyday theme. Buttery popcorn particles, movie-night vibes.

```js
{
  name: "default",
  particles: {
    type: "popcorn",
    count: 12,
    colors: [
      "#fff8dc",  // cornsilk
      "#fffacd",  // lemon chiffon
      "#ffefd5",  // papaya whip
      "#fff5e1",  // warm white
      "#f5deb3",  // wheat
      "#ffe4b5",  // moccasin
      "#ffffff",  // white
      "#fdf5e6",  // old lace
    ],
  },
  rareDrops: {
    chance: 0.12,
    emojis: ["🔥", "💀", "🤡", "💩", "😱", "🎬", "🍿", "⭐"],
    count: 8,
  },
  verdicts: [
    { icon: "🗑️", label: "TRASH",             color: "#f44336", maxRatio: 0.2 },
    { icon: "♻️", label: "PRETTY BAD",         color: "#ff7043", maxRatio: 0.4 },
    { icon: "😐", label: "MEH",               color: "#999",    maxRatio: 0.6 },
    { icon: "👑", label: "SOLID TAKE",         color: "#ffb300", maxRatio: 0.8 },
    { icon: "🏆", label: "CERTIFIED BANGER",   color: "#ffd700", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🏆", down: "🗑️" },
  accent: "#ffd700",
}
```

### Halloween

Spooky season. Ghost and bat particles, horror-themed verdicts.

```js
{
  name: "halloween",
  particles: {
    type: "emoji",
    count: 10,
    emojis: ["🎃", "👻", "🦇", "🕷️", "🕸️", "💀"],
  },
  rareDrops: {
    chance: 0.18,
    emojis: ["⚰️", "🧛", "🐺", "😈", "🪦", "👹"],
    count: 10,
  },
  verdicts: [
    { icon: "⚰️", label: "DEAD TAKE",         color: "#666",    maxRatio: 0.2 },
    { icon: "🧟", label: "BRAINDEAD",          color: "#8b4513", maxRatio: 0.4 },
    { icon: "👻", label: "GHOSTED",            color: "#999",    maxRatio: 0.6 },
    { icon: "🎃", label: "SPOOKY GOOD",        color: "#ff7518", maxRatio: 0.8 },
    { icon: "🧛", label: "IMMORTAL TAKE",      color: "#8b0000", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🎃", down: "⚰️" },
  accent: "#ff7518",
}
```

### Christmas

Holiday cheer. Snowflakes and ornament particles, festive verdicts.

```js
{
  name: "christmas",
  particles: {
    type: "emoji",
    count: 12,
    emojis: ["❄️", "🎄", "⭐", "🔔", "🎁", "✨"],
  },
  rareDrops: {
    chance: 0.15,
    emojis: ["🎅", "🤶", "🦌", "⛄", "🧝", "🪅"],
    count: 8,
  },
  verdicts: [
    { icon: "🪨", label: "COAL",              color: "#555",    maxRatio: 0.2 },
    { icon: "🧦", label: "EMPTY STOCKING",     color: "#cc4444", maxRatio: 0.4 },
    { icon: "🎄", label: "FESTIVE",            color: "#228b22", maxRatio: 0.6 },
    { icon: "🎁", label: "NICE LIST",          color: "#cc0000", maxRatio: 0.8 },
    { icon: "⭐", label: "TREE TOPPER",        color: "#ffd700", maxRatio: 1.0 },
  ],
  voteIcons: { up: "⭐", down: "🪨" },
  accent: "#cc0000",
}
```

### Valentine's Day

Love and heartbreak. Hearts and roses, romantic verdicts.

```js
{
  name: "valentines",
  particles: {
    type: "emoji",
    count: 10,
    emojis: ["❤️", "💕", "💗", "💘", "🌹", "✨"],
  },
  rareDrops: {
    chance: 0.15,
    emojis: ["💝", "😍", "💌", "🏹", "💋", "🥰"],
    count: 8,
  },
  verdicts: [
    { icon: "💔", label: "HEARTBREAKER",       color: "#8b0000", maxRatio: 0.2 },
    { icon: "🥀", label: "WILTED",             color: "#cc4444", maxRatio: 0.4 },
    { icon: "💐", label: "SWEET GESTURE",       color: "#db7093", maxRatio: 0.6 },
    { icon: "💕", label: "LOVE IT",             color: "#ff69b4", maxRatio: 0.8 },
    { icon: "💘", label: "CUPID'S ARROW",       color: "#ff1493", maxRatio: 1.0 },
  ],
  voteIcons: { up: "💘", down: "💔" },
  accent: "#ff1493",
}
```

### 4th of July

Red white and blue. Firework particles, patriotic verdicts.

```js
{
  name: "july4th",
  particles: {
    type: "css",
    count: 15,
    colors: ["#ff0000", "#ffffff", "#0000ff", "#ff4444", "#4444ff"],
  },
  rareDrops: {
    chance: 0.2,
    emojis: ["🇺🇸", "🦅", "🎆", "🎇", "🗽", "🫡"],
    count: 10,
  },
  verdicts: [
    { icon: "🏳️", label: "SURRENDERED",        color: "#888",    maxRatio: 0.2 },
    { icon: "📜", label: "UNCONSTITUTIONAL",    color: "#8b7355", maxRatio: 0.4 },
    { icon: "⚖️", label: "BIPARTISAN",          color: "#999",    maxRatio: 0.6 },
    { icon: "🦅", label: "PATRIOTIC",           color: "#00308f", maxRatio: 0.8 },
    { icon: "🗽", label: "NATIONAL TREASURE",   color: "#00a36c", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🦅", down: "🏳️" },
  accent: "#cc0000",
}
```

### Thanksgiving

Turkey day. Autumn leaves, food-themed verdicts.

```js
{
  name: "thanksgiving",
  particles: {
    type: "emoji",
    count: 10,
    emojis: ["🍂", "🍁", "🌽", "🥧", "🦃", "🍎"],
  },
  rareDrops: {
    chance: 0.15,
    emojis: ["🦃", "🥧", "🍗", "🌾", "🏈", "🫶"],
    count: 8,
  },
  verdicts: [
    { icon: "🦃", label: "TURKEY",             color: "#8b4513", maxRatio: 0.2 },
    { icon: "🥫", label: "CANNED TAKE",        color: "#cc6633", maxRatio: 0.4 },
    { icon: "🌽", label: "CORNY",              color: "#daa520", maxRatio: 0.6 },
    { icon: "🥧", label: "SWEET AS PIE",       color: "#d2691e", maxRatio: 0.8 },
    { icon: "🍗", label: "CHEF'S KISS",        color: "#b8860b", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🥧", down: "🦃" },
  accent: "#d2691e",
}
```

### St. Patrick's Day

Lucky charms. Green and gold, Irish-themed verdicts.

```js
{
  name: "stpatricks",
  particles: {
    type: "emoji",
    count: 10,
    emojis: ["☘️", "🍀", "💚", "🌈", "🪙", "✨"],
  },
  rareDrops: {
    chance: 0.17,
    emojis: ["🫅", "🌈", "🪙", "🍺", "🥇", "💰"],
    count: 8,
  },
  verdicts: [
    { icon: "🐍", label: "SNAKE TAKE",         color: "#556b2f", maxRatio: 0.2 },
    { icon: "🥔", label: "HALF-BAKED",         color: "#8b7355", maxRatio: 0.4 },
    { icon: "☘️", label: "FAIR ENOUGH",         color: "#2e8b57", maxRatio: 0.6 },
    { icon: "🍀", label: "LUCKY TAKE",          color: "#00a550", maxRatio: 0.8 },
    { icon: "🪙", label: "POT OF GOLD",         color: "#ffd700", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🪙", down: "🐍" },
  accent: "#00a550",
}
```

### New Year's

Countdown vibes. Fireworks and champagne, resolution-themed verdicts.

```js
{
  name: "newyear",
  particles: {
    type: "emoji",
    count: 14,
    emojis: ["🎆", "🎇", "✨", "🥂", "🎊", "🎉"],
  },
  rareDrops: {
    chance: 0.2,
    emojis: ["🍾", "🥂", "🕛", "🎊", "🪩", "💫"],
    count: 10,
  },
  verdicts: [
    { icon: "🕛", label: "EXPIRED",            color: "#666",    maxRatio: 0.2 },
    { icon: "🥱", label: "FELL ASLEEP AT 10",  color: "#999",    maxRatio: 0.4 },
    { icon: "🎊", label: "PARTY TAKE",          color: "#cc66ff", maxRatio: 0.6 },
    { icon: "🥂", label: "TOAST-WORTHY",        color: "#ffcc00", maxRatio: 0.8 },
    { icon: "🍾", label: "POP THE CHAMPAGNE",   color: "#ffd700", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🍾", down: "🕛" },
  accent: "#ffcc00",
}
```

### Super Bowl

Game day energy. Football and stadium vibes.

```js
{
  name: "superbowl",
  particles: {
    type: "emoji",
    count: 12,
    emojis: ["🏈", "🎉", "📣", "🍕", "🍺", "🏟️"],
  },
  rareDrops: {
    chance: 0.18,
    emojis: ["🏆", "🐐", "💍", "🎤", "📺", "🦅"],
    count: 10,
  },
  verdicts: [
    { icon: "🚩", label: "FLAG ON THE PLAY",   color: "#cc0000", maxRatio: 0.2 },
    { icon: "🏈", label: "FUMBLED",            color: "#8b4513", maxRatio: 0.4 },
    { icon: "📣", label: "FAIR CATCH",          color: "#999",    maxRatio: 0.6 },
    { icon: "🏅", label: "MVP TAKE",            color: "#daa520", maxRatio: 0.8 },
    { icon: "🏆", label: "SUPER BOWL CHAMP",    color: "#ffd700", maxRatio: 1.0 },
  ],
  voteIcons: { up: "🏆", down: "🚩" },
  accent: "#004953",
}
```

---

## Implementation Notes

### Where themes live
Create `src/themes.js` exporting all theme configs and a `getActiveTheme()` function that checks the date (or Firebase, or URL param) and returns the current theme.

### How components consume themes
Pass the active theme as a prop or via React context. Components that need theme data (particles, verdicts, vote buttons) read from the theme object instead of hardcoded values.

### Clapperboard chevron colors
The clapperboard stripes form chevrons (top bar skews right, bottom bar skews left). Themes could override the stripe colors to match the theme palette. Add to the theme config:

```js
clapperboard: {
  stripeLight: "#f5f5f0",  // default light stripe
  stripeDark: "#1a1a1a",   // default dark stripe
  boardColor: "#1a1a1a",   // board body
  borderColor: "#333",     // board border
},
```

### Adding a new theme
1. Define the config object following the structure above