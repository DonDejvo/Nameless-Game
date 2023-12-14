const { Vector, math } = Lancelot.utils;

const data = {
    player: {
        hp: 4,
        maxhp: 4,
        upgrades: {
            agility: 1,
            firerate: 0,
            multishot: 0,
            homing: 0
        }
    },
    level: 0,
    time: 0.0,
    levels: [
        {
            map: 1,
            enemies: [
                ["slime", 4]
            ]
        },
        {
            map: 2,
            enemies: [
                ["slime", 8]
            ]
        },
        {
            map: 3,
            enemies: [
                ["slime", 12],
                ["goblin", 2]
            ]
        },
        {
            map: 4,
            enemies: [
                ["slime", 15],
                ["goblin", 3]
            ]
        },
        {
            map: 5,
            enemies: [
                ["slime", 21],
                ["goblin", 5]
            ]
        },
        {
            map: 6,
            enemies: [
                ["slime", 24],
                ["goblin", 7],
                ["bat", 3]
            ]
        },
        {
            map: 7,
            enemies: [
                ["slime", 27],
                ["goblin", 9],
                ["bat", 4]
            ]
        },
        {
            map: 8,
            enemies: [
                ["slime", 28],
                ["goblin", 10],
                ["bat", 6],
                ["golem", 1]
            ]
        },
        {
            map: 9,
            enemies: [
                ["slime", 29],
                ["goblin", 11],
                ["bat", 8],
                ["golem", 2]
            ]
        },
    ]
};

Lancelot.start({
    width: 960,
    height: 640,
    quality: 1.0,
    controls: {
        active: true,
        joystick: true,
        theme: "dark"
    },
    preload: preload,
    init: init
});

function preload() {

    const progressBar = document.querySelector(".progress_bar-value");
    const info = document.querySelector(".info");

    this.load.onProgress((value, path) => {

        progressBar.style.width = (value * 100) + "%";
        info.textContent = path;

    });

    this.load.setPath("res");

    // fonts
    this.load.font("Quadrit", "fonts/Quadrit.ttf");

    // tilesets
    this.load.json("tileset-data", "tilesets/tileset.json");
    this.load.image("tileset-image", "tilesets/tileset.png");

    // maps
    for (let i = 1; i <= 9; ++i) {
        this.load.json(`map${i}`, `maps/map${i}.json`);
    }

    // ui
    this.load.image("menu-button", "ui/menu button.png");
    this.load.image("menu-toggle", "ui/menu toggle.png");
    this.load.image("hpbar", "ui/hpbar.png");

    // images
    this.load.image("menu-background", "images/menu background.png");
    this.load.image("ak-47", "images/AK-47.png");
    this.load.image("heal-potion", "images/potion.png");

    // sounds
    this.load.audio("hurt-sound", "audio/sounds/hurt.wav");
    this.load.audio("shot-sound", "audio/sounds/shot.wav");
    this.load.audio("enemy-pop-sound", "audio/sounds/enemy pop.wav");
    this.load.audio("card-select-sound", "audio/sounds/card select.wav");
    this.load.audio("card-flip-sound", "audio/sounds/card flip.wav");
    this.load.audio("next-dungeon-sound", "audio/sounds/next dungeon.wav");
    this.load.audio("heal-sound", "audio/sounds/health pack.wav");

    // music
    this.load.audio("menu-music", "audio/briefing.mp3");
    this.load.audio("bg-music", "audio/industrial_synthdestroyer.mp3");

    // spritesheets
    this.load.image("knight-spritesheet", "spritesheets/knight.png");
    this.load.image("slime-spritesheet", "spritesheets/slime.png");
    this.load.image("goblin-spritesheet", "spritesheets/goblin.png");
    this.load.image("bat-spritesheet", "spritesheets/bat.png");
    this.load.image("golem-spritesheet", "spritesheets/golem.png");
}

function init() {

    document.querySelector(".loader").style.display = "none";

    let intro = new Intro(this);
    let menu = new Menu(this);
    let levelUI = new LevelUI(this);

    intro.play();

}