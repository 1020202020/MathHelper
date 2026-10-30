// Game catalog. `url` is loaded in an in-page iframe.
// Some publishers block embedding; the player always offers an "Open in new tab" fallback.
const CG = slug => `https://www.crazygames.com/embed/${slug}`;
const POKI = slug => `https://poki.com/en/g/${slug}`;

window.GAMES = [
  // Sports
  { name: "Retro Bowl", url: POKI("retro-bowl"), cat: "Sports", emoji: "🏈", hot: true },
  { name: "Retro Bowl College", url: POKI("retro-bowl-college"), cat: "Sports", emoji: "🎓" },
  { name: "Basketball Stars", url: POKI("basketball-stars"), cat: "Sports", emoji: "🏀", hot: true },
  { name: "Basket Random", url: POKI("basket-random"), cat: "Sports", emoji: "🤾" },
  { name: "Soccer Random", url: POKI("soccer-random"), cat: "Sports", emoji: "⚽" },
  { name: "Volley Random", url: POKI("volley-random"), cat: "Sports", emoji: "🏐" },
  { name: "Football Legends", url: POKI("football-legends"), cat: "Sports", emoji: "🥅" },
  { name: "Golf Orbit", url: POKI("golf-orbit"), cat: "Sports", emoji: "⛳" },

  // Shooters
  { name: "1v1.LOL", url: "https://1v1.lol/", cat: "Shooter", emoji: "🔫", hot: true },
  { name: "Krunker", url: "https://krunker.io/", cat: "Shooter", emoji: "🎯", hot: true },
  { name: "Shell Shockers", url: "https://shellshock.io/", cat: "Shooter", emoji: "🥚", hot: true },
  { name: "Bloxd.io", url: "https://bloxd.io/", cat: "Shooter", emoji: "🧱" },
  { name: "Venge.io", url: "https://venge.io/", cat: "Shooter", emoji: "💥" },
  { name: "EV.IO", url: "https://ev.io/", cat: "Shooter", emoji: "🤖" },
  { name: "Kirka.io", url: "https://kirka.io/", cat: "Shooter", emoji: "🧊" },
  { name: "Narrow One", url: "https://narrow.one/", cat: "Shooter", emoji: "🏹" },
  { name: "Repuls.io", url: "https://repuls.io/", cat: "Shooter", emoji: "🚀" },
  { name: "Survev.io", url: "https://survev.io/", cat: "Shooter", emoji: "🪖" },
  { name: "Suroi", url: "https://suroi.io/", cat: "Shooter", emoji: "🎒" },
  { name: "ZombsRoyale", url: "https://zombsroyale.io/", cat: "Shooter", emoji: "🧟" },
  { name: "Bullet Force", url: CG("bullet-force-multiplayer"), cat: "Shooter", emoji: "🪂" },

  // Racing / driving
  { name: "Smash Karts", url: "https://smashkarts.io/", cat: "Racing", emoji: "🏎️", hot: true },
  { name: "Drift Hunters", url: CG("drift-hunters"), cat: "Racing", emoji: "🚗", hot: true },
  { name: "Slope", url: CG("slope"), cat: "Racing", emoji: "🟢", hot: true },
  { name: "Moto X3M", url: POKI("moto-x3m"), cat: "Racing", emoji: "🏍️" },
  { name: "Drive Mad", url: POKI("drive-mad"), cat: "Racing", emoji: "🚙" },
  { name: "Madalin Stunt Cars 2", url: CG("madalin-stunt-cars-2"), cat: "Racing", emoji: "🛞" },
  { name: "Polytrack", url: "https://www.kodub.com/apps/polytrack", cat: "Racing", emoji: "🏁" },
  { name: "GeoFS Flight Sim", url: "https://www.geo-fs.com/geofs.php", cat: "Racing", emoji: "✈️" },

  // Action / platform
  { name: "Subway Surfers", url: POKI("subway-surfers"), cat: "Action", emoji: "🛹", hot: true },
  { name: "Temple Run 2", url: POKI("temple-run-2"), cat: "Action", emoji: "🏃" },
  { name: "Stickman Hook", url: POKI("stickman-hook"), cat: "Action", emoji: "🪝" },
  { name: "Level Devil", url: POKI("level-devil"), cat: "Action", emoji: "😈" },
  { name: "Getaway Shootout", url: CG("getaway-shootout"), cat: "Action", emoji: "🤠" },
  { name: "Ragdoll Archers", url: POKI("ragdoll-archers"), cat: "Action", emoji: "🎳" },
  { name: "Run 3", url: "https://www.coolmathgames.com/0-run-3", cat: "Action", emoji: "🌌" },
  { name: "Fireboy & Watergirl", url: "https://www.coolmathgames.com/0-fireboy-and-water-girl-in-the-forest-temple", cat: "Action", emoji: "🔥" },
  { name: "Sky Hopper", url: "flappy.html", cat: "Action", emoji: "🐤", local: true },

  // .io
  { name: "Paper.io 2", url: "https://paper-io.com/", cat: ".io", emoji: "📄", hot: true },
  { name: "Agar.io", url: "https://agar.io/", cat: ".io", emoji: "🔵" },
  { name: "Slither.io", url: "https://slither.io/", cat: ".io", emoji: "🐍" },
  { name: "Diep.io", url: "https://diep.io/", cat: ".io", emoji: "🛡️" },
  { name: "Zombs.io", url: "https://zombs.io/", cat: ".io", emoji: "🏰" },
  { name: "MooMoo.io", url: "https://moomoo.io/", cat: ".io", emoji: "🐮" },
  { name: "Hole.io", url: "https://hole-io.com/", cat: ".io", emoji: "🕳️" },
  { name: "Deeeep.io", url: "https://deeeep.io/", cat: ".io", emoji: "🐟" },
  { name: "Taming.io", url: "https://taming.io/", cat: ".io", emoji: "🐺" },
  { name: "Starve.io", url: "https://starve.io/", cat: ".io", emoji: "❄️" },
  { name: "Wormate.io", url: "https://wormate.io/", cat: ".io", emoji: "🪱" },
  { name: "Powerline.io", url: "https://powerline.io/", cat: ".io", emoji: "⚡" },
  { name: "Bonk.io", url: "https://bonk.io/", cat: ".io", emoji: "⚪" },
  { name: "Skribbl.io", url: "https://skribbl.io/", cat: ".io", emoji: "✏️" },
  { name: "Gartic Phone", url: "https://garticphone.com/", cat: ".io", emoji: "📞" },

  // Puzzle / brain
  { name: "2048", url: "https://play2048.co/", cat: "Puzzle", emoji: "🔢", hot: true },
  { name: "Hextris", url: "https://hextris.io/", cat: "Puzzle", emoji: "⬡" },
  { name: "Tetris", url: "https://tetris.com/play-tetris", cat: "Puzzle", emoji: "🟪" },
  { name: "Little Alchemy 2", url: "https://littlealchemy2.com/", cat: "Puzzle", emoji: "⚗️" },
  { name: "Lichess Puzzles", url: "https://lichess.org/training/frame", cat: "Puzzle", emoji: "♟️" },
  { name: "Cut the Rope", url: POKI("cut-the-rope"), cat: "Puzzle", emoji: "🍬" },
  { name: "Tic Tac Toe", url: "ttt.html", cat: "Puzzle", emoji: "❌", local: true },

  // Idle / clicker / sim
  { name: "Cookie Clicker", url: "https://orteil.dashnet.org/cookieclicker/", cat: "Idle", emoji: "🍪", hot: true },
  { name: "Monkey Mart", url: POKI("monkey-mart"), cat: "Idle", emoji: "🐒" },
  { name: "Universal Paperclips", url: "https://www.decisionproblem.com/paperclips/index2.html", cat: "Idle", emoji: "📎" },
  { name: "A Dark Room", url: "https://adarkroom.doublespeakgames.com/", cat: "Idle", emoji: "🔥" },
  { name: "Candy Box 2", url: "https://candybox2.github.io/", cat: "Idle", emoji: "🍭" },

  // Creative / classic
  { name: "Minecraft Classic", url: "https://classic.minecraft.net/", cat: "Classic", emoji: "⛏️", hot: true },
  { name: "Pac-Man Doodle", url: "https://www.google.com/logos/2010/pacman10-i.html", cat: "Classic", emoji: "🟡" },
  { name: "Chrome Dino", url: "https://chromedino.com/", cat: "Classic", emoji: "🦖" },
  { name: "QWOP", url: "https://www.foddy.net/Athletics.html", cat: "Classic", emoji: "🦵" },
  { name: "Snake", url: "snake.html", cat: "Classic", emoji: "🐍", local: true },
  { name: "Sandspiel", url: "https://sandspiel.club/", cat: "Creative", emoji: "⏳" },
  { name: "Line Rider", url: "https://www.linerider.com/", cat: "Creative", emoji: "🛷" },
  { name: "Quick, Draw!", url: "https://quickdraw.withgoogle.com/", cat: "Creative", emoji: "🖍️" },
];
