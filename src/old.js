const { Vector, math } = Lancelot.utils;

const config = {
    width: 1000,
    height: 1000,
    parentElement: document.getElementById("game"),
    preload: preload,
    init: init,
    quality: 1.0,
    controls: {
        active: true,
        theme: "dark",
        joystick: true
    }
};

const data = {
    levelId: 0,
    player: {
        maxHP: 4,
        hp: 4,
        upgrades: {
            agility: 3,
            multishot: 5,
            fireRate: 3,
            homing: 3
        }
    },
    levels: [
        {
            map: 2,
            waves: [
                [["s", 18], ["g", 6], ["b", 6]],
                
            ]
        }
    ]
};

let level;

Lancelot.start(config);

function preload() {

    this.load.setPath("res");
    this.load.font("Quadrit", "fonts/Quadrit.ttf");
    this.load.audio("shot-sound", "audio/shot.wav");
    this.load.audio("pop-sound", "audio/enemy_pop.wav");
    this.load.audio("main-theme", "audio/main-theme.mp3");
    this.load.audio("menu-theme", "audio/menu-theme.mp3");
    this.load.json("map1", "levels/level00.json");
    this.load.json("map2", "levels/level01.json");
    this.load.json("tileset", "tilesets/tileset.json");
    this.load.image("tileset-image", "images/tileset.png");
    this.load.image("ak-47", "images/AK-47.png");
    this.load.image("knight-spritesheet", "images/knight_spritesheet.png");
    this.load.image("slime-spritesheet", "images/slime_spritesheet.png");
    this.load.image("goblin-spritesheet", "images/goblin_spritesheet.png");
    this.load.image("bat-spritesheet", "images/bat_spritesheet.png");
    this.load.image("hpbar-spritesheet", "images/hpbar_spritesheet.png");
    this.load.image("button-spritesheet", "images/button_spritesheet.png");
    this.load.image("golem-spritesheet", "images/golem_spritesheet.png");
    this.load.image("golem-arm", "images/arm_projectile.png");
}

function init() {

    this.audio.music.loop = true;

    level = new Level(this);
    let levelUI = new LevelUI(this);
    let reward = new Reward(this);
    let menu = new Menu(this);
    
    let intro = new Lancelot.Scene(this, "Intro", 0, {
        background: "#222"
    });
    const label = intro.create();
    label.addComponent(new Lancelot.drawable.Text({
        fillStyle: "white",
        fontSize: 36,
        fontFamily: "Quadrit",
        text: "Click to start"
    }));
    intro.play();

    intro.interactive.on("mouseup", () => {
        this.requestFullScreen();
        intro.hide();
        menu.play();
    });
}

class Menu extends Lancelot.Scene {

    constructor(game) {
        const options = {
            background: "white",
            physics: {
                bounds: [[-config.width/2, -config.height/2], [config.width/2, config.height/2]]
            }
        }

        super(game, "Menu", 0, options);

        this.createMenu();
        this.createOptions();

        this.optsOpened = false;

    }

    play() {
        super.play();
        this.audio.music.set("menu-theme");
        this.audio.music.play();
    }

    toggleOpts() {
        if(this.optsOpened) {
            this.opts.position.x = config.width;
            this.menu.position.x = 0;
        } else {
            this.opts.position.x = 0;
            this.menu.position.x = config.width;
        }
        this.optsOpened = !this.optsOpened;
    }

    createMenu() {

        this.menu = this.create();

        const title = this.create();
        title.position.y = -240;
        title.addComponent(new Lancelot.drawable.Text({
            text: "NAMELESS GAME",
            fontFamily: "Quadrit",
            fontSize: 56,
            strokeWidth: 5,
            zIndex: 1
        }));

        this.menu.clip(title);

        const playBtn = this.createButton(this.menu, 0, 0, "New Game", () => {
            this.hide();
            this.game.get("Level").play();
        });

        const optBtn = this.createButton(this.menu, 0, 140, "Options", () => this.toggleOpts());

        const creditBtn = this.createButton(this.menu, 0, 280, "Credit", () => alert("Programmed by David Dolejsi"));

    }

    setMusic(diff, label) {
        this.audio.music.volume += diff;
        label.getComponent("Text").text = "Music: " + Math.round(this.audio.music.volume * 100) + "%";
    }

    setEffects(diff, label) {
        this.audio.effects.volume += diff;
        label.getComponent("Text").text = "Effects: " + Math.round(this.audio.effects.volume * 100) + "%";
    }

    createOptions() {
        this.opts = this.create();

        const musicLabel = this.createLabel(this.opts, 0, 0, "Music: 100%");
        this.createArrow(this.opts, 220, 0, 0, () => this.setMusic(0.1, musicLabel));
        this.createArrow(this.opts, -220, 0, 1, () => this.setMusic(-0.1, musicLabel));

        const effectsLabel = this.createLabel(this.opts, 0, 140, "Effects: 100%");
        this.createArrow(this.opts, 220, 140, 0, () => this.setEffects(0.1, effectsLabel));
        this.createArrow(this.opts, -220, 140, 1, () => this.setEffects(-0.1, effectsLabel));

        const detailsToggle = this.createButton(this.opts, 0, 280, "Details: High", () => {
            if(this.game.quality == 1.0) {
                detailsToggle.getComponent("Text").text = "Details: Low";
                this.game.quality = 0.5;
            } else {
                detailsToggle.getComponent("Text").text = "Details: High";
                this.game.quality = 1.0;
            }
        });

        this.createButton(this.opts, 0, 460, "Back", () => this.toggleOpts());

        this.opts.position.y = -200;
        this.opts.position.x = config.width;

    }

    createArrow(parent, x, y, inv, action) {
        const w = 64, h = 96;
        let points;
        points = inv ? 
        [[-w/2, 0], [w/2, h/2], [w/2, -h/2]] :
        [[w/2, 0], [-w/2, h/2], [-w/2, -h/2]];
        const btn = this.create();
        if(parent != null) {
            parent.clip(btn);
        }
        btn.position.set(x, y);
        let body, sprite;
        btn.addComponent(body = new Lancelot.physics.Polygon({
            points: points
        }));
        btn.addComponent(sprite = new Lancelot.drawable.Polygon({
            points: points,
            fillColor: "#9BADB7",
            strokeColor: "black",
            strokeWidth: 4
        }));
        this.setInteractive(btn);
        btn.interactive.on("mouseup", () => {
            action();
        });
        return btn;
    }

    createLabel(parent, x, y, text) {
        const w = 288, h = 96;
        const btn = this.create();
        if(parent != null) {
            parent.clip(btn);
        }
        btn.position.set(x, y);
        let sprite, label;
        btn.addComponent(sprite = new Lancelot.drawable.Picture({
            image: {
                name: "button-spritesheet",
                frameWidth: 96,
                frameHeight: 32,
                framePosition: {x: 0, y: 1}
            },
            width: w,
            height: h
        }), "Sprite");
        btn.addComponent(label = new Lancelot.drawable.Text({
            text: text,
            fontFamily: "Quadrit",
            fontSize: 32,
            strokeWidth: 3,
            zIndex: 1
        }));
        return btn;
    }

    createButton(parent, x, y, text, action) {
        const btn = this.createLabel(parent, x, y, text);
        let sprite = btn.getComponent("Sprite"),
        label = btn.getComponent("Text");
        btn.addComponent(new Lancelot.physics.Box({
            width: sprite.width,
            height: sprite.height
        }));
        this.setInteractive(btn);
        btn.interactive.on("mousedown", () => {
            label.offset.y = 8;
            sprite.image.framePosition.y = 0;
        });
        btn.interactive.on("mouseup", () => {
            label.offset.y = 0;
            sprite.image.framePosition.y = 1;
            action();
        });
        return btn;
    }

    update() {

    }

}

class Level extends Lancelot.Scene {
    
    constructor(game) {

        const options = {
            background: "#200",
            physics: {
                bounds: [[0, 0], [4000, 4000]],
                relaxationCount: 1
            }
        };

        super(game, "Level", 0, options);

        this.debug = false;

        this.levelData = data.levels[data.levelId];
        this.tileWidth = 64;
        this.tileHeight = 64;

        const levelMaker = new Lancelot.utils.LevelMaker({
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight
        });

        this.floorTiles = [];

        levelMaker.onTile((tile, tileData) => {
            if(tileData["type"] == "floor") {
                this.floorTiles.push(tile);
            }  else if(tileData["type"] == "wall") {
                this.createWall(tile);
            }
        });

        levelMaker.onObject((obj, objData, zIndex) => {
            // no objects
        });

        const tilemap = this.resources.get("map" + this.levelData.map);
        const tilesets = [
            Lancelot.utils.Tileset.loadFromTiledJSON(this.resources.get("tileset"), "tileset-image")
        ];
        
        levelMaker.createLevel(this, tilemap, tilesets);

        this.createPlayer();
        this.createPotion();
        this.createParticleLayer();

        this.waveIdx = 0;
        this.enemiesRemaining = 0;
        this.nextWave();

    }

    play() {
        super.play();
        level = this;
        this.audio.music.set("main-theme");
        this.game.get("LevelUI").play();
    }

    createParticleLayer() {
        const entity = this.create("ParticleLayer");
        entity.addComponent(this.particleLayer = new Lancelot.drawable.Buffer({
            bounds: [[0, 0], [4000, 4000]]
        }))
    }

    createWall(tile) {
        tile.groupList.add("wall");
        let body;
        tile.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth,
            height: this.tileHeight
        }));
    }

    nextWave() {

        if(this.waveIdx >= this.levelData.waves.length) {
            this.timeout.set(() => {
                this.finish();
            }, 4000);
            return;
        }

        const wave = this.levelData.waves[this.waveIdx];

        for(let pair of wave) {
            const type = pair[0];
            const count = pair[1];
            this.enemiesRemaining += count;
            for(let i = 0; i < count; ++i) {
                this.createEnemy(type);
            }
        }

        this.getEntityByName("Player").getComponent("Controller").activateShield();

        ++this.waveIdx;
    }

    finish() {
        this.hide();
        this.game.get("LevelUI").hide();
        this.game.get("Reward").play();
    }

    killEnemy() {
        if(--this.enemiesRemaining <= 0) {
            this.timeout.set(() => {
                this.nextWave();
            }, 4000);
        }
    }

    createPlayer() {
        const playerData = data.player;
        const player = this.create("Player");
        let sprite, body;
        player.position = math.choice(this.floorTiles).position;
        player.addComponent(sprite = new Lancelot.drawable.Sprite({
            image: {
                name: "knight-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            width: this.tileWidth,
            height: this.tileHeight,
            zIndex: 1,
            fillColor: "silver",
            strokeWidth: 0
        }), "Sprite");
        sprite.center.y = this.tileHeight * 0.2;
        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}
        ]);
        sprite.addAnim("run", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}
        ]);
        player.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth * 0.6,
            height: this.tileHeight * 0.6,
            mass: 1
        }));
        body.addBehavior("wall", "resolve");
        this.camera.follow(player, 0.2);

        const gun = this.create();
        player.clip(gun);
        gun.position = player.position;
        let gunSprite;
        gun.addComponent(gunSprite = new Lancelot.drawable.Picture({
            image: {
                name: "ak-47"
            },
            width: this.tileWidth * 1.4,
            height: this.tileHeight * 0.7,
            zIndex: 1
        }), "Sprite");
        gunSprite.offset.y = this.tileHeight * 0.08;
        gunSprite.center.set(-this.tileWidth * 0.16, 0);
        let gunController;
        gun.addComponent(gunController = new GunController());

        player.addComponent(new Lancelot.drawable.Circle({
            radius: 750,
            fillColor: "radial-gradient;0,0,0,0,0,600;rgba(255,0,0,0)=0.4;rgba(45,0,0,0.9)=0.7",
            strokeWidth: 0,
            zIndex: 10,
            scale: {x: 3, y: 3}
        }), "DamageCircle");
        
        let playerController;
        player.addComponent(playerController = new PlayerController(gunController), "Controller");

        body.addBehavior("enemy enemyBullet", "detect", {
            action: (otherBody) => {
                if(otherBody.parent.groupList.has("enemyBullet")) {
                    otherBody.parent.remove();
                }
                if(playerController.shieldCounter == 0) {
                    playerController.receiveDamage();
                    playerController.activateShield();
                }
            }
        });

    }

    createEnemy(type) {
        const enemy = this.create();
        enemy.groupList.add("enemy");
        enemy.position = math.choice(this.floorTiles).position;
        switch(type) {
            case "s":
                this.initSlime(enemy);
                break;
            case "g":
                this.initGoblin(enemy);
                break;
            case "b":
                this.initBat(enemy);
                break;
            case "x":
                this.initGolem(enemy);
                break;
        }
    }

    initSlime(enemy) {
        let body, sprite;
        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: this.tileWidth,
            height: this.tileHeight,
            image: {
                name: "slime-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            zIndex: 1
        }));
        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}
        ]);
        sprite.addAnim("move", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}
        ]);
        enemy.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth * 0.95,
            height: this.tileHeight * 0.7,
            mass: 1
        }));
        enemy.addComponent(new SimpleSpriteController(body, sprite));
        body.addBehavior("wall", "resolve", {
            bounce: 1.0
        });
        enemy.addComponent(new SlimeController(), "Controller");
    }

    initGoblin(enemy) {
        let body, sprite;
        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: this.tileWidth,
            height: this.tileHeight,
            image: {
                name: "goblin-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            zIndex: 1
        }));
        sprite.center.y = this.tileHeight * 0.2;
        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}
        ]);
        sprite.addAnim("move", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}
        ]);
        enemy.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth * 0.6,
            height: this.tileHeight * 0.6,
            mass: 1
        }));
        enemy.addComponent(new SimpleSpriteController(body, sprite));
        body.addBehavior("wall", "resolve");
        enemy.addComponent(new GoblinController(), "Controller");
    }

    initBat(enemy) {
        let body, sprite;
        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: this.tileWidth,
            height: this.tileHeight,
            image: {
                name: "bat-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            zIndex: 5
        }));
        sprite.addAnim("fly", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}
        ]);
        sprite.play("fly", 100, true);
        enemy.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth * 0.95,
            height: this.tileHeight * 0.6,
            mass: 1
        }));
        enemy.addComponent(new BatController(), "Controller");
    }

    initGolem(enemy) {
        let body, sprite;

        enemy.addComponent(body = new Lancelot.physics.Box({
            width: this.tileWidth * 2,
            height: this.tileHeight * 2,
            mass: 1
        }));
        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: this.tileWidth * 5,
            height: this.tileHeight * 5,
            image: {
                name: "golem-spritesheet",
                frameWidth: 100,
                frameHeight: 100
            },
            zIndex: 1
        }));
        sprite.offset.y = -this.tileHeight * 0.2;
        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, 
        ]);
        sprite.addAnim("glow", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}, 
        ]);
        sprite.addAnim("activateShield", [
            {x: 0, y: 3}, {x: 1, y: 3}, {x: 2, y: 3}, {x: 3, y: 3}, {x: 4, y: 3}, {x: 5, y: 3}, {x: 6, y: 3}, {x: 7, y: 3}, 
        ]);
        sprite.addAnim("deactivateShield", [
            {x: 7, y: 3}, {x: 6, y: 3}, {x: 5, y: 3}, {x: 4, y: 3}, {x: 3, y: 3}, {x: 2, y: 3}, {x: 1, y: 3}, {x: 0, y: 3}, 
        ]);
        
        enemy.addComponent(new GolemController(), "Controller");
        body.addBehavior("wall", "resolve", {
            bounce: 1.0
        });
    }

    createPotion() {

    }

    createExplosion(x, y, angle, count) {
        for(let i = 0; i < count; ++i) {
            const r = this.tileWidth * math.rand(0.1, 0.2);
            const particle = this.create();
            particle.position.set(x, y);
            let body;
            particle.addComponent(body = new Lancelot.physics.Ball({
                radius: r,
                mass: 1,
            }));
            const multiplier = math.rand(0, 16);
            const v = Vector.fromAngle(angle + math.rand(-0.4, 0.4)).mult(this.tileWidth * multiplier);
            body.velocity = v;
            
            let star;
            particle.addComponent(star = new Lancelot.drawable.Star({
                outerRadius: r,
                innerRadius: r/2,
                peaks: 5,
                fillColor: `hsl(${math.lerp(multiplier / 12, 0, 360)}, 100%, 50%)`,
                strokeWidth: 0
            }), "Sprite");
            star.angle = math.rand(0, 2 * Math.PI);
            let controller;
            particle.addComponent(controller = new ExplosionParticleController());
            body.addBehavior("wall", "resolve", {
                //action: () => controller.destroy()
                bounce: 1
            });
        }
    }

    update(dt) {

        
        
    }

}

class PlayerController extends Lancelot.Component {

    constructor(gun) {
        super();
        this.gun = gun;
        this.agility = 320 + data.player.upgrades.agility * 40;
        this.shieldCounter = 0;
    }

    receiveDamage() {
        if(data.player.hp <= 0) return;
        data.player.hp -= 1;
        const damageCircle = this.getComponent("DamageCircle");
        damageCircle.scaleTo({x: 1, y: 1}, 300, "ease-out", () => damageCircle.scaleTo({x: 2.5, y: 2.5}, 300, "ease-in"));
        this.scene.camera.shaker.shake(30, 400, 5, math.rand(0, Math.PI));
    }

    activateShield() {
        this.shieldCounter = 2000;
    }

    update(dt) {
        this.shieldCounter = Math.max(this.shieldCounter - dt * 1000, 0);

        const v = new Vector();
        if (this.scene.isKeyPressed("ArrowRight")) {
            v.x = 1;
        } else if (this.scene.isKeyPressed("ArrowLeft")) {
            v.x = -1;
        } else {
            v.x = 0;
        }
        if (this.scene.isKeyPressed("ArrowUp")) {
            v.y = -1;
        } else if (this.scene.isKeyPressed("ArrowDown")) {
            v.y = 1;
        } else {
            v.y = 0;
        }
        v.unit().mult(this.agility);
        this.parent.body.velocity = v;
        const sprite = this.getComponent("Sprite");
        sprite.scale = {x: Math.cos(this.gun.angle) >= 0 ? 1 : -1};
        if(this.parent.body.velocity.x == 0 && this.parent.body.velocity.y == 0) {
            sprite.play("idle", 100, true);
        } else {
            sprite.play("run", 100, true);
        }
        sprite.opacity = this.shieldCounter == 0 ? 1 : 0.5;
    }

}

class GunController extends Lancelot.Component {

    constructor() {
        super();
        this.counter = 0;
        this.isFiring = false;
        this.angle = 0;
        this.homingRadius = 400 + data.player.upgrades.homing * 200;
        this.damage = 30;
        this.bulletsPerShot = 1 + data.player.upgrades.multishot;
        this.bulletRotation = data.player.upgrades.homing * 0.03;
        this.bulletSpeed = 750;
        this.reloadTime = Math.max(100, 500 - 100 * data.player.upgrades.fireRate);
    }

    initComponent() {
        this.scene.interactive.on("mousemove", (e) => {
            this.angle = new Vector(e.x - this.parent.position.x, e.y - this.parent.position.y).angle();
        });
        this.scene.interactive.on("mousedown", (e) => {
            this.isFiring = true;
        });
        this.scene.interactive.on("mouseup", (e) => {
            this.isFiring = false;
        });
    }

    shootPosition() {
        const sprite = this.getComponent("Sprite");
        return sprite.position.clone().add(new Vector(this.scene.tileWidth * 0.6, (Math.cos(this.angle) >= 0 ? -0.1 : 0.1) * this.scene.tileHeight).rot(this.angle));
    }

    fire() {

        if(this.scene.getEntityByName("Player").getComponent("Controller").shieldCounter > 0) return;

        const w = 24,
        h = 6;

        const pos = this.shootPosition();
        
        for (let i = 0; i < this.bulletsPerShot; ++i) {
            const bullet = this.scene.create();
            let sprite, body;
            bullet.position = pos;
            bullet.addComponent(body = new Lancelot.physics.Box({
                width: w,
                height: h
            }));
            const v = Vector.fromAngle(this.angle + (i - (this.bulletsPerShot - 1) / 2) * 0.1 + math.rand(-0.2, 0.2)).mult(this.bulletSpeed);
            body.velocity = v;
            bullet.addComponent(sprite = new Lancelot.drawable.Rect({
                width: w,
                height: h,
                fillColor: "black",
                strokeColor: "orange",
                strokeWidth: 3
            }), "Sprite");
            sprite.followBody();
            let controller;
            bullet.addComponent(controller = new BulletController(this.damage, this.homingRadius, this.bulletRotation));
            body.addBehavior("wall", "detect", {
                action: () => bullet.remove()
            });
            body.addBehavior("enemy", "detect", {
                action: (otherBody) => {
                    controller.hit(otherBody.parent);
                    bullet.remove();
                }
            });
        }

        this.scene.audio.effects.play("shot-sound");
        this.scene.camera.shaker.shake(5, 200, 5, this.angle - Math.PI);
    }

    update(dt) {

        this.counter = Math.min(this.counter + dt * 1000, this.reloadTime);

        if(this.isFiring) {
            if(this.counter >= this.reloadTime) {
                this.counter = 0;
                this.fire();
            }
        }

        const sprite = this.getComponent("Sprite");
        const offsetX = this.scene.tileWidth * 0.2;
        
        if(Math.cos(this.angle) >= 0) {
            sprite.angle = this.angle;
            sprite.scale = {x: 1};
            sprite.offset.x = offsetX;
        } else {
            sprite.angle = Math.PI - this.angle;
            sprite.scale = {x: -1};
            sprite.offset.x = -offsetX;
        }

    }

}

class BulletController extends Lancelot.Component {

    constructor(damage, homingRadius, rotation) {
        super();
        this.damage = damage;
        this.homingRadius = homingRadius;
        this.target = null;
        this.rotSpeed = rotation;
        this.lifeCounter = 0;
        this.lifetime = 600;
    }

    hit(target) {
        const controller = target.getComponent("Controller");
        controller.hitByBullet(this);
    }

    update(dt) {
        this.lifeCounter += dt * 1000;
        if(this.lifeCounter >= this.lifetime) {
            this.parent.remove();
            return;
        }
        
        if(this.lifeCounter > this.lifetime/2) {
            if(this.target == null) {
                const nearEnemies = this.scene.world.findNear([this.position.x, this.position.y], [this.homingRadius/2, this.homingRadius/2]).filter((e) => e.groupList.has("enemy"));
                if(nearEnemies.length) {
                    let idx;
                    let dist = Infinity;
                    for(let i = 0; i < nearEnemies.length; ++i) {
                        const d = Vector.dist(nearEnemies[i].position, this.position);
                        if(d < dist) {
                            dist = d;
                            idx = i;
                        }
                    }
                    this.target = nearEnemies[idx];
                }
            }
            
            if(this.target) {
                const angle = this.target.position.clone().sub(this.position).angle();
                const diff = Math.sin(angle - this.parent.body.velocity.angle());
                if(diff < 0) {
                    this.parent.body.velocity.rot(-this.rotSpeed);
                } else {
                    this.parent.body.velocity.rot(this.rotSpeed);
                }
                if(this.target.getComponent("Controller").destroyed) {
                    this.target = null;
                }
            }
        }

        this.getComponent("Sprite").angle = this.parent.body.velocity.angle();
    }

}

class SimpleSpriteController extends Lancelot.Component {

    constructor(body, sprite) {
        super();
        this.body = body;
        this.sprite = sprite;
    }

    update() {

        if(this.body.velocity.x == 0 && this.body.velocity.y == 0) {
            this.sprite.play("idle", 100, true);
        } else {
            this.sprite.play("move", 100, true);
        }

        if(this.body.velocity.x > 0) {
            this.sprite.scale = {x: 1};
        } else if(this.body.velocity.x < 0) {
            this.sprite.scale = {x: -1};
        }

    }

}

class EnemyController extends Lancelot.Component {

    constructor(hp) {
        super();
        this.maxHP = hp;
        this.hp = this.maxHP;
        this.destroyed = false;
    }

    hitByBullet(bulletController) {
        const x = bulletController.position.x,
        y = bulletController.position.y,
        angle = bulletController.parent.body.velocity.angle();
        this.receiveDamage(bulletController.damage);
        if(!this.destroyed && this.hp <= 0) {
            this.destroyed = true;
            this.destroy(x, y, angle); 
        }
    }

    receiveDamage(dmg) {
        this.hp -= dmg;
    }

    destroy(x, y, angle) {
        const delay = 300;
            const sprite = this.getComponent("Sprite");
            sprite.scaleTo({x: sprite.scale.x * 1.5, y: sprite.scale.y * 1.5}, delay);
            this.scene.timeout.set(() => {
                this.scene.camera.shaker.shake(60, 200, 5, angle);
                this.scene.createExplosion(x, y, angle, 50);
                this.scene.killEnemy();
                this.parent.remove();
                this.scene.audio.effects.play("pop-sound");
            }, delay);
    }

}

class GolemController extends EnemyController {

    constructor() {
        super(10000);
        this.state = 0;
        this.counter = 0;
        this.shield = false;
        this.speed = 300;
        this.subCounter = 0;
    }

    update(dt) {

        this.counter += dt * 1000;

        
    }

}

class ShootingEnemyController extends EnemyController {

    constructor(hp, bulletRotation, bulletColor, bulletSpeed, reloadTime) {
        super(hp);
        this.bulletSpeed = bulletSpeed;
        this.bulletRotation = bulletRotation;
        this.bulletColor = bulletColor;
        this.reloadTime = reloadTime;
        this.reloadCounter = this.reloadTime;
        this.range = 600;
    }

    shoot() {
        const r = 16;
        const bullet = this.scene.create();
        const player = this.scene.getEntityByName("Player");
        bullet.groupList.add("enemyBullet");
        bullet.position = this.position;
        let sprite, body;
        bullet.addComponent(body = new Lancelot.physics.Ball({
            radius: r,
            mass: 1
        }));
        body.velocity = player.position.clone().sub(this.position).unit().mult(this.bulletSpeed);
        body.addBehavior("wall", "detect", {
            action: () => bullet.remove()
        });
        bullet.addComponent(sprite = new Lancelot.drawable.Circle({
            radius: r,
            strokeWidth: 0,
            fillColor: `radial-gradient;4,-4,0,4,-4,12;white=0;${this.bulletColor}=1`,
            //strokeColor: "white"
            zIndex: 1
        }));
        bullet.addComponent(new EnemyShootController(this.bulletRotation));
    }

    update(dt) {

        this.reloadCounter = Math.min(this.reloadCounter + dt * 1000, this.reloadTime);

        if(this.reloadCounter >= this.reloadTime) {
            const player = this.scene.getEntityByName("Player");
            if(Vector.dist(player.position, this.position) <= this.range) {
                this.reloadCounter = 0;
                this.shoot();
            }
        }

    }

}

class SlimeController extends ShootingEnemyController {

    constructor() {
        super(100, 0, "darkgreen", 250, 2000);
        this.state = 0;
        this.counter = 0;
        this.speed = 325;
    }

    update(dt) {
        super.update(dt);
        if(this.destroyed) {
            this.parent.body.velocity.set(0, 0);
            return;
        }
        this.counter += dt * 1000;
        if(this.state == 0) {
            if(this.counter >= 1500) {
                this.counter = 0;
                this.state = 1;
                this.parent.body.velocity = Vector.fromAngle(math.rand(0, Math.PI * 2)).mult(this.speed);
            }
        } else {
            if(this.counter >= 500) {
                this.counter = 0;
                this.state = 0;
                this.parent.body.velocity.set(0, 0);
            }
        }
    }

}

class GoblinController extends ShootingEnemyController {

    constructor() {
        super(100, 0.02, "darkred", 350, 2000);
        this.isFollowing = false;
        this.counter = 0;
        this.speed = 175;
    }

    update(dt) {
        super.update(dt);
        const player = this.scene.getEntityByName("Player");
        const v = player.position.clone().sub(this.position);
        const dist = v.mag();
        this.counter += dt * 1000;
        if(this.isFollowing) {
            if(dist >= 50) {
                this.parent.body.velocity = v.clone().unit().mult(this.speed);
            } else {
                this.parent.body.velocity.set(0, 0);
            }
            if(dist >= this.range + 200) {
                this.isFollowing = false;
            }
        } else {
            this.parent.body.velocity.set(0, 0);
            if(dist <= this.range) {
                this.isFollowing = true;
            }
        }
    }

}

class BatController extends ShootingEnemyController {

    constructor() {
        super(100, 0.4, "yellow", 250, 4000);
        this.isFollowing = false;
        this.counter = 0;
        this.speed = 150;
    }
    
    update(dt) {
        super.update(dt);

        const player = this.scene.getEntityByName("Player");
        const v = player.position.clone().sub(this.position);
        const dist = v.mag();
        this.counter += dt * 1000;
        if(this.isFollowing) {
            if(this.counter >= 2000 || dist >= this.range) {
                this.parent.body.velocity = player.position.clone().add(Vector.fromAngle(math.rand(0, Math.PI * 2)).mult(this.range - 100)).sub(this.position).unit().mult(this.speed);
                this.counter = 0;
            }
            if(dist >= this.range + 200) {
                this.counter = 0;
                this.isFollowing = false;
            }
        } else {
            this.parent.body.velocity.set(0, 0);
            if(dist <= this.range) {
                this.counter = 2000;
                this.isFollowing = true;
            }
        }

        const sprite = this.getComponent("Sprite");
        if(this.parent.body.velocity.x > 0) {
            sprite.scale = {x: 1};
        } else if(this.parent.body.velocity.x < 0) {
            sprite.scale = {x: -1};
        }
    }

}

class EnemyShootController extends Lancelot.Component {

    constructor(rotation) {
        super();
        this.rotSpeed = rotation;
        this.lifetime = 4000;
        this.lifeCounter = 0;
    }


    update(dt) {
        this.lifeCounter += dt * 1000;
        if(this.lifeCounter >= this.lifetime) {
            this.parent.remove();
            return;
        }
        const player = this.scene.getEntityByName("Player");
        const angle = player.position.clone().sub(this.position).angle();
        const diff = Math.sin(angle - this.parent.body.velocity.angle());
        if(diff < 0) {
            this.parent.body.velocity.rot(-this.rotSpeed);
        } else {
            this.parent.body.velocity.rot(this.rotSpeed);
        }
    }

}

class ExplosionParticleController extends Lancelot.Component {

    constructor() {
        super();
        this.lifetime = 150;
        this.counter = 0;
    }

    update(dt) {
        this.counter += dt * 1000;

        if(this.counter >= this.lifetime) {
            this.destroy();
        }
    }

    destroy() {
        this.scene.particleLayer.add(this.getComponent("Sprite"));
        this.parent.remove();
    }

}

class LevelUI extends Lancelot.Scene {

    constructor(game) {

        const options = {
            background: "transparent",
            physics: {
                bounds: [[-config.width/2, -config.height/2], [config.width/2, config.height/2]]
            }
        }

        super(game, "LevelUI", 1, options);

        this.createHPBar();
        this.createRemainingEnemiesLabel();
    }

    createHPBar() {
        const w = 240, h = 48, margin = {x: 20, y: 20};

        const hpBar = this.create();
        hpBar.position.set(-config.width/2 + w/2 + margin.x, -config.height/2 + h/2 + margin.y);

        hpBar.addComponent(new Lancelot.drawable.Picture({
            image: {
                name: "hpbar-spritesheet",
                frameWidth: 80,
                frameHeight: 16
            },
            width: 240,
            height: 48
        }), "Sprite");

        hpBar.addComponent(new HPBarController());

    }

    createRemainingEnemiesLabel() {
        const margin = {x: 300, y: 30}, fontSize = 36;
        const label = this.create();
        label.position.set(-config.width/2 + margin.x, -config.height/2 + fontSize/2 + margin.y);
        let text;
        label.addComponent(text = new Lancelot.drawable.Text({
            text: "Enemies Left: 0",
            fontSize: fontSize,
            fontFamily: "Quadrit",
            strokeWidth: 3,
            align: "left"
        }));

        label.onUpdate(() => {
            let count = level.enemiesRemaining;
            for(let i = level.waveIdx; i < level.levelData.waves.length; ++i) {
                for(let elem of level.levelData.waves[i]) {
                    count += elem[1];
                }
            }
            text.text = "Enemies Left: " + count;
        });
    }

    update(dt) {

    }

}

class HPBarController extends Lancelot.Component {

    constructor() {
        super();
    }

    update() {

        const sprite = this.getComponent("Sprite");
        sprite.image.framePosition.y = data.player.maxHP - data.player.hp;

    }

}

class Reward extends Lancelot.Scene {

    constructor(game) {

        const options = {
            background: "black",
            physics: {
                bounds: [[-config.width/2, -config.height/2], [config.width/2, config.height/2]]
            }
        };

        super(game, "Reward", 0, options);

        this.cardTypes = [
            {
                id: "agility",
                title: "AGILITY",
                description: "Agility:\nMove faster!"
            },
            {
                id: "multishot",
                title: "MULTISHOT",
                description: "Multishot:\nShoot more\nbullets at once!"
            },
            {
                id: "fireRate",
                title: "FIRE RATE",
                description: "Fire Rate:\nShoot bullets with\nhigher frequency!"
            },
            {
                id: "homing",
                title: "HOMING",
                description: "Homing:\nHit targets easier!"
            },
        ];

        this.locked = false;
        this.initCards();
    }

    finish() {

    }

    initCards() {
        this.cards = [];

        math.shuffle(this.cardTypes);

        for(let i = -1; i <= 1; ++i) {
            const card = this.createCard(i * 200, 80, this.cardTypes[i + 1]);
            this.cards.push(card);
            this.timeout.set(() => card.getComponent("Controller").turn(), (i + 2) * 400);
        }
    }

    createCard(x, y, type) {
        const w = 140, h = 220;
        const card = this.create();
        card.position.set(x, y);
        card.addComponent(new CardTop({
            scale: {x: -1},
            width: w - 4,
            height: h - 4,
            borderRadius: 10,
            fillColor: "gold",
            strokeWidth: 8,
            strokeColor: "goldenrod",
            zIndex: -1,
            cardType: type
        }), "TopLayer");
        card.addComponent(new Lancelot.drawable.RoundedRect({
            scale: {x: -1},
            width: w,
            height: h,
            borderRadius: 10,
            fillColor: (() => {
                let str = "linear-gradient;-70,-110,70,110";
                const count = 8;
                for(let i = 0; i < count; ++i) {
                    const color = i % 2 ? "gold" : "goldenrod";
                    str += ";" + color + "=" + (i / count);
                    str += ";" + color + "=" + ((i + 1) / count); 
                }
                return str;
            })(),
            strokeWidth: 0,
            zIndex: 1,
        }), "BottomLayer");
        card.addComponent(new Lancelot.physics.Box({
            width: w,
            height: h
        }));
        let desc;
        card.addComponent(desc = new Lancelot.drawable.Text({
            fillColor: "white",
            fontFamily: "Quadrit",
            fontSize: 20,
            strokeWidth: 0,
            text: type.description,
            align: "left"
        }), "Description");
        desc.offset.set(-w/2 , h * 0.8);
        desc.visible = false;
        let controller;
        card.addComponent(controller = new CardController(), "Controller");

        this.setInteractive(card);
        card.interactive.on("mousedown", () => {
            if(this.locked || !controller.turned) {
                return;
            }
            if(controller.selected) {

                this.locked = true;
                ++data.player.upgrades[type.id];

                card.moveTo(new Vector(0, -120), 1000, "linear", () => {
                    const dur = 5000;
                    for(let otherCard of this.cards) {
                        const desc = card.getComponent("Description");
                        desc.visible = false;
                        const top = otherCard.getComponent("TopLayer");
                        const bottom = otherCard.getComponent("BottomLayer");
                        if(otherCard == card) {
                            const angle = math.rand(0, Math.PI);
                            top.shaker.shake(10, dur, 10, angle);
                            bottom.shaker.shake(10, dur, 10, angle);
                            continue;
                        }
                        top.fade(0, dur/2);
                        bottom.fade(0, dur/2);
                    }

                    this.finish();
                });

            } else { 
                controller.select();
                for(let otherCard of this.cards) {
                    if(otherCard == card) {
                        continue;
                    }
                    otherCard.getComponent("Controller").unselect();
                }
            }
        });
        return card;
    }
}

class CardController extends Lancelot.Component {

    constructor() {
        super();
        this.selected = false;
        this.turned = false;
    }

    initComponent() {
        this.base = this.parent.position.clone();
    }

    select() {
        if(this.selected) {
            return;
        }
        const desc = this.getComponent("Description");
        this.parent.moveTo(this.base.clone().sub(new Vector(0, 100)), 600, "ease-out");
        desc.visible = true;
        this.selected = true;
    }

    unselect() {
        if(!this.selected) {
            return;
        }
        const desc = this.getComponent("Description");
        this.parent.moveTo(this.base, 600, "ease-out");
        desc.visible = false;
        this.selected = false;
    }

    turn() {
        const dur = 600, timing = "linear";
        const top = this.getComponent("TopLayer");
        const bottom = this.getComponent("BottomLayer");
        if(!this.turned) {
            top.scaleTo({x: 1}, dur, timing);
            bottom.scaleTo({x: 1}, dur, timing, () => {
                this.turned = !this.turned;
            });
        }
        
    }

    update() {
        const top = this.getComponent("TopLayer");
        const bottom = this.getComponent("BottomLayer");
        if(this.selected) {
            top.zIndex = 10;
        } else {
            top.zIndex = top.scale.x;
        }
        bottom.zIndex = -bottom.scale.x;
        if(this.turned) {
            bottom.visible = false;
        }
    }

}

class CardTop extends Lancelot.drawable.RoundedRect {

    constructor(params) {
        super(params);
        this.cardType = params.cardType;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = "goldenrod";
        ctx.font = "18px Quadrit";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.cardType.title, 0, -this.height * 0.35);
        switch(this.cardType.id) {
            case "multishot":
                ctx.beginPath();
                ctx.fillStyle = "red";
                Lancelot.drawable.regularPolygon(ctx, 0, 0, 40, 3);
                ctx.fill();
                break;
            case "agility":
                ctx.beginPath();
                ctx.fillStyle = "aqua";
                ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case "homing":
                ctx.beginPath();
                ctx.fillStyle = "yellow";
                Lancelot.drawable.star(ctx, 0, 0, 20, 40, 5);
                ctx.fill();
                break;
            case "fireRate":
                ctx.beginPath();
                ctx.fillStyle = "violet";
                Lancelot.drawable.regularPolygon(ctx, 0, 0, 40, 5);
                ctx.fill();
                break;
        }
    }

}

