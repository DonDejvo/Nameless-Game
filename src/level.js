class Level extends Lancelot.Scene {

    floorTiles = [];
    enemiesLeft = 0;
    player = null;
    
    constructor(game) {

        const config = {
            background: "#200",
            world: {
                bounds: [[0, 0], [4000, 4000]],
            }
        };

        super(game, "Level", 0, config);

        this.init();
    
    }

    switch(n) {

        let levelUI = this.game.get("LevelUI");
        levelUI.fadeOut(() => {
            this.timeout.set(() => {
                this.hide();
                this.game.get(n).play();
            }, 1000);
        });

    }

    resetData() {

        data.level = 0;
        data.time = 0.0;
        data.player.hp = data.player.maxhp;
        for(let attr in data.player.upgrades) {
            data.player.upgrades[attr] = 0;
        }

    }

    play() {
        super.play();
        this.game.get("LevelUI").play();
        this.checkEnemies();
    }

    pause() {
        super.pause();
        this.game.get("LevelUI").pause();
    }

    hide() {
        super.hide();
        this.game.get("LevelUI").hide();
    }

    init() {

        const levelData = data.levels[data.level];

        const levelMaker = new Lancelot.utils.LevelMaker({
            tileWidth: 64,
            tileHeight: 64
        });

        levelMaker.onTile((tile, tileData) => {
            if(tileData["type"] == "floor") {
                this.floorTiles.push(tile);
            }  else if(tileData["type"] == "wall") {
                this.initWall(tile);
            }
        });

        const tilemap = this.resources.get("map" + levelData.map);
        const tilesets = [
            Lancelot.utils.Tileset.loadFromTiledJSON(this.resources.get("tileset-data"), "tileset-image")
        ];

        levelMaker.createLevel(this, tilemap, tilesets);

        this.createPlayer();
        this.createEnemies(levelData);
        this.createParticleLayer();

    }

    checkEnemies() {

        this.game.get("LevelUI").enemiesCounter.getComponent("Text").text = `Enemies left: ${this.enemiesLeft}`;

        if(this.enemiesLeft == 0) {

            data.level += 1;

            this.timeout.set(() => {
                if(data.level < data.levels.length) {
                    let reward = new Reward(this.game);
                    this.switch("Reward");
                } else {
                    let victory = new Victory(this.game);
                    this.switch("Victory");
                }
            }, 3000);

        }

    }

    initWall(tile) {
        tile.groupList.add("wall");
        let body;
        tile.addComponent(body = new Lancelot.physics.Box({
            width: 64,
            height: 64
        }));
    }

    createPlayer() {

        const position = math.choice(this.floorTiles).position;

        this.player = Player.create(this, position.x, position.y);

        this.camera.follow(this.player, 0.25);

    }

    createEnemies(levelData) {

        const playerSafeDist = 500;

        const floorTilesFarFromPlayer = this.floorTiles.filter((tile) => Vector.dist(tile.position, this.player.position) >= playerSafeDist);

        const enemies = [];

        for(let elem of levelData.enemies) {

            const count = elem[1];
            this.enemiesLeft += count;

            for(let i = 0; i < count; ++i) {

                let enemy;
                
                const position = math.choice(floorTilesFarFromPlayer).position;

                switch(elem[0]) {
                    case "slime":
                        enemy = Slime.create(this, position.x, position.y);
                        break;
                    case "goblin":
                        enemy = Goblin.create(this, position.x, position.y);
                        break;
                    case "bat":
                        enemy = Bat.create(this, position.x, position.y);
                        break;
                    case "golem":
                        enemy = Golem.create(this, position.x, position.y);
                        break;
                }

                enemies.push(enemy);

            }

        }

        for(let i = 0; i < Math.min(1 + Math.floor(enemies.length / 10), enemies.length); ++i) {
            math.choice(enemies).getComponent("Controller").dropsPotion = true;
        }

    }

    createParticleLayer() {

        this.particleLayer = this.create();

        this.particleLayer.addComponent(new Lancelot.drawable.Buffer({
            bounds: [[0, 0], [4000, 4000]]
        }), "Buffer");
    }

    createPotion(x, y) {

        const w = 64, h = 64;

        const potion = this.create();

        potion.position.set(x, y);

        potion.groupList.add("item");
        potion.groupList.add("heal-potion");

        potion.addComponent(new Lancelot.drawable.Picture({
            width: w,
            height: h,
            image: {
                name: "heal-potion"
            }
        }));

        potion.addComponent(new Lancelot.physics.Box({
            width: w * 0.5,
            height: h * 0.5
        }));

    }

    update(dt) {

        data.time += dt;

    }

}

class Player extends Lancelot.Component {

    constructor() {

        super();

        this.speed = Math.min(320, 200 + data.player.upgrades.agility * 30);
        this.dead = false;
        this.shieldCounter = 0;
        this.gun = null;

    }

    hasShield() {
        return this.shieldCounter > 0;
    }

    activateShield(dur) {
        this.shieldCounter = dur * 1000;
    }

    receiveDamage(angle) {

        if(this.hasShield() || this.scene.enemiesLeft == 0) {
            return;
        }

        this.activateShield(1.2);

        if(!this.dead) {
            data.player.hp -= 1;
        }

        if(data.player.hp == 0) {
            this.dead = true;
            this.explode(angle);
        }
        
        const damageEffect = this.scene.game.get("LevelUI").damageEffect;

        this.scene.game.get("LevelUI").updateHpBar();

        damageEffect.getComponent("Sprite").scaleTo({x: 0.4, y: 0.3}, 100, "linear", () => {
            if(!this.dead) {
                damageEffect.getComponent("Sprite").scaleTo({x: 1.0, y: 1.0}, 500, "ease-in");
            }
        });

        this.scene.camera.shaker.shake(6, 250, 4, this.angle);
        this.scene.audio.effects.play("hurt-sound");

    }

    explode(angle) {

        this.parent.body.velocity.set(0, 0);

        this.gun.remove();

        this.scene.camera.scaleTo(2.0, 300, "linear", () => {

            const sprite = this.getComponent("Sprite");

            sprite.scaleTo({ x: Math.sign(sprite.scale.x) * 2, y: 2 }, 300, "linear", () => {

                this.parent.remove();
    
                for(let i = 0; i < 200; ++i) {
                    Particle.create(this.scene, this.position.x, this.position.y, angle + math.rand(0, 2 * Math.PI), 250);
                }

                this.scene.game.get("LevelUI").showGameOver();

                this.scene.timeout.set(() => {
                    this.scene.resetData();
                    this.scene.switch("Menu");
                }, 3000);
    
            });

        });
        
        

    }

    update(dt) {

        if(this.dead) {
            return;
        }


        const body = this.parent.body,
        sprite = this.getComponent("Sprite");

        this.shieldCounter -= dt * 1000;

        const vel = new Vector();

        if (this.scene.isKeyPressed("ArrowRight")) {
            vel.x = 1;
        } else if (this.scene.isKeyPressed("ArrowLeft")) {
            vel.x = -1;
        } else {
            vel.x = 0;
        }
        if (this.scene.isKeyPressed("ArrowUp")) {
            vel.y = -1;
        } else if (this.scene.isKeyPressed("ArrowDown")) {
            vel.y = 1;
        } else {
            vel.y = 0;
        }

        vel.unit().mult(this.speed);

        body.velocity = vel;

        if(body.velocity.x == 0 && body.velocity.y == 0) {
            sprite.play("idle", 80, true);
        } else {
            sprite.play("move", 80, true);
        }

        sprite.opacity = this.hasShield() ? 0.5 : 1.0;

    }

    static create(scene, x, y) {

        const w = 64, h = 64;

        const player = scene.create();

        player.position.set(x, y);

        let sprite, body, controller;

        player.addComponent(controller = new Player(), "Controller");

        player.addComponent(sprite = new Lancelot.drawable.Sprite({
            image: {
                name: "knight-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            width: w,
            height: h,
            zIndex: 1,
            fillColor: "silver",
            strokeWidth: 0
        }), "Sprite");

        sprite.center.y = h * 0.15;

        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}
        ]);

        sprite.addAnim("move", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}
        ]);

        player.addComponent(body = new Lancelot.physics.Box({
            width: w * 0.6,
            height: h * 0.7,
            mass: 1
        }));

        body.addBehavior("enemy enemy-bullet item", "detect", {
            action: (otherBody) => {
                if(otherBody.parent.groupList.has("item")) {
                    if(otherBody.parent.groupList.has("heal-potion")) {
                        data.player.hp = Math.min(data.player.hp + 1, data.player.maxhp);
                        scene.game.get("LevelUI").updateHpBar();
                        scene.audio.effects.play("heal-sound");
                    }
                    otherBody.parent.remove();
                    return;
                }
                if(otherBody.parent.groupList.has("enemy-bullet")) {
                    otherBody.parent.remove();
                }
                controller.receiveDamage(otherBody.velocity.angle());
            }
        });

        body.addBehavior("wall", "resolve");

        Gun.create(scene, player, 0, 0);

        return player;

    }

}

class Gun extends Lancelot.Component {

    constructor(player) {

        super();

        this.player = player;
        this.reloadTime = Math.max(200, 600 - 100 * data.player.upgrades.firerate);
        this.reloadCounter = 0;
        this.bulletsPerShot = Math.min(5, 1 + data.player.upgrades.multishot);
        this.shooting = false;
        this.angle = 0;

    }

    initComponent() {
        this.player.getComponent("Controller").gun = this.parent;
    }

    getShootPosition() {

        const sprite = this.getComponent("Sprite");

        return sprite.position.clone().add(new Vector(sprite.width * 0.46, (Math.cos(this.angle) >= 0 ? -0.16 : 0.16) * sprite.height).rot(this.angle));

    }

    shoot() {

        const position = this.getShootPosition();
        const dispersion = 0.3;

        for (let i = 0; i < this.bulletsPerShot; ++i) {

            PlayerBullet.create(this.scene, position.x, position.y, this.angle + (i - (this.bulletsPerShot - 1) / 2) * 0.2 + math.rand(-dispersion, dispersion) / 2);

        }

        this.scene.audio.effects.play("shot-sound");
        this.scene.camera.shaker.shake(4, 100, 5, this.angle - Math.PI);

    }

    update(dt) {

        if(this.player.getComponent("Controller").dead) {
            return;
        }

        this.reloadCounter += dt * 1000;

        if(this.shooting) {
            if(this.reloadCounter >= this.reloadTime) {
                this.reloadCounter = 0;
                this.shoot();
            }
        }

        const sprite = this.getComponent("Sprite");
        const playerSprite = this.player.getComponent("Sprite");
        const offsetX = playerSprite.width * 0.2, offsetY = playerSprite.height * 0.1;
        
        if(Math.cos(this.angle) >= 0) {
            sprite.angle = this.angle;
            sprite.scale = {x: 1};
            sprite.offset.set(offsetX, offsetY);
            playerSprite.scale = {x: 1};
        } else {
            sprite.angle = Math.PI - this.angle;
            sprite.scale = {x: -1};
            sprite.offset.set(-offsetX, offsetY);
            playerSprite.scale = {x: -1};
        }

    }

    static create(scene, player, x, y) {

         const w = 90, h = 45;
        
        const gun = scene.create();

        player.clip(gun);

        gun.position.set(player.position.x + x, player.position.y + y);

        let sprite, controller;

        gun.addComponent(sprite = new Lancelot.drawable.Picture({
            image: {
                name: "ak-47"
            },
            width: w,
            height: h,
            zIndex: 1
        }), "Sprite");

        sprite.center.set(-w * 0.1, 0);

        gun.addComponent(controller = new Gun(player));

        scene.interactive.on("mousemove", (e) => {
            controller.angle = new Vector(e.x - gun.position.x, e.y - gun.position.y).angle();
        });
        
        scene.interactive.on("mousedown", (e) => {
            controller.shooting = true;
        });

        scene.interactive.on("mouseup", (e) => {
            controller.shooting = false;
        });

    }

}

class PlayerBullet extends Lancelot.Component {

    constructor() {

        super();

        this.damage = 35;
        this.homingRadius = Math.min(1200, 300 * data.player.upgrades.homing);
        this.turnSpeed = 0.04 * data.player.upgrades.homing;
        this.lifeTime = 1000;
        this.homingStartTime = 50;
        this.lifeTimeCounter = 0;
        this.target = null;
        this.active = true;

    }

    hit(target) {

        const targetController = target.getComponent("Controller");
        targetController.receiveDamage(this.active ? this.damage : 0, this.parent.body.velocity.angle());

        this.active = false;

    }

    update(dt) {

        this.lifeTimeCounter += dt * 1000;

        if(this.lifeTimeCounter >= this.lifeTime) {
            this.parent.remove();
            return;
        }

        const body = this.parent.body;

        if(this.lifeTimeCounter >= this.homingStartTime) {

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
                const diff = angle - body.velocity.angle();


                const turnAcc = Math.min(Math.abs(diff), this.turnSpeed);
                if(Math.sin(diff) < 0) {
                    body.velocity.rot(-turnAcc);
                } else {
                    body.velocity.rot(turnAcc);
                }
                
            }

        }

        body.angle = body.velocity.angle();

    }

    static create(scene, x, y, angle) {

        const w = 36, h = 6;
        const speed = 700;
        
        const bullet = scene.create();

        bullet.position.set(x, y);

        let sprite, body, controller;

        bullet.addComponent(controller = new PlayerBullet());

        bullet.addComponent(body = new Lancelot.physics.Box({
            width: w,
            height: h
        }));

        const vel = Vector.fromAngle(angle).mult(speed);
        body.velocity = vel;

        body.addBehavior("wall enemy", "detect", {
            action: (otherBody) => {
                if(otherBody.parent.groupList.has("enemy")) {
                    controller.hit(otherBody.parent);
                }
                bullet.remove();
            }
        });

        bullet.addComponent(sprite = new Lancelot.drawable.RoundedRect({
            width: w,
            height: h,
            borderRadius: 3,
            fillColor: "black",
            strokeColor: "tomato",
            strokeWidth: 4,
            zIndex: 1
        }), "Sprite");

        sprite.followBody();

    }

}

class Enemy extends Lancelot.Component {

    constructor(hp) {

        super();

        this.maxHp = hp;
        this.hp = hp;
        this.dead = false;
        this.dropsPotion = false;

    }

    receiveDamage(dmg, angle) {

        if(this.dead) {
            return;
        }

        this.hp -= dmg;

        if(this.hp <= 0) {
            this.dead = true;
            this.scene.enemiesLeft -= 1;
            this.scene.checkEnemies();
            if(this.dropsPotion) {
                this.scene.createPotion(this.position.x, this.position.y);
            }
            this.explode(angle);
        }

    }

    explode(_) {}

}

class ShootingEnemy extends Enemy {

    constructor(hp, minReloadTime, maxReloadTime) {

        super(hp);

        this.minReloadTime = minReloadTime;
        this.maxReloadTime = maxReloadTime;
        this.reloadTime = minReloadTime;
        this.reloadCounter = 0;
        this.range = 450;

    }

    shoot() {}

    explode(angle) {

        this.parent.body.velocity.set(0, 0);

        const dispersion = 0.6;

        const sprite = this.getComponent("Sprite");
        
        sprite.scaleTo({ x: Math.sign(sprite.scale.x) * 1.5, y: 1.5 }, 150, "linear", () => {

            this.parent.remove();

            this.scene.audio.effects.play("enemy-pop-sound");

            for(let i = 0; i < 50; ++i) {
                Particle.create(this.scene, this.position.x, this.position.y, angle + math.rand(-dispersion, dispersion) / 2, 250);
            }

        });

    }

    update(dt) {

        if(this.dead) {
            return;
        }

        this.reloadCounter += dt * 1000;

        const player = this.scene.player;

        if(Vector.dist(player.position, this.position) < this.range && this.reloadCounter >= this.reloadTime) {

            this.reloadCounter = 0;
            this.reloadTime = math.rand(this.minReloadTime, this.maxReloadTime);

            this.shoot();

        }

    }

}

class Slime extends ShootingEnemy {

    constructor() {

        super(100, 2000, 4000);

        this.state = 0;
        this.counter = 0;
        this.minIdleTime = 1500;
        this.maxIdleTime = 2500;
        this.idleTime = this.minIdleTime;
        this.moveTime = 300;
        this.speed = 300;

    }

    shoot() {

        const target = this.scene.player;

        const angle = target.position.clone().sub(this.position).angle();

        EnemyBullet.create(this.scene, this.position.x, this.position.y, angle, 150, 0, "green");

    }

    update(dt) {

        super.update(dt);

        this.counter += dt * 1000;

        if(this.state == 0) {

            if(this.counter >= this.idleTime) {
                this.idleTime = math.rand(this.minIdleTime, this.maxIdleTime);
                this.counter = 0;
                this.state = 1;
                this.parent.body.velocity = Vector.fromAngle(math.rand(0, Math.PI * 2)).mult(this.speed);
            }
        } else {
            if(this.counter >= this.moveTime) {
                this.counter = 0;
                this.state = 0;
                this.parent.body.velocity.set(0, 0);
            }
        }

    }

    static create(scene, x, y) {

        const enemy = scene.create();

        enemy.position.set(x, y);

        enemy.groupList.add("enemy");

        const w = 64, h = 64;

        let body, sprite;

        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: w,
            height: h,
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

        sprite.center.y = h * 0.2;

        enemy.addComponent(body = new Lancelot.physics.Box({
            width: w * 0.95,
            height: h * 0.7,
            mass: 1
        }));

        body.addBehavior("wall", "resolve", {
            bounce: 1.0
        });

        enemy.addComponent(new SimpleSpriteController(body, sprite));

        enemy.addComponent(new Slime(), "Controller");

        return enemy;

    }

}

class Goblin extends ShootingEnemy {

    constructor() {

        super(200, 2500, 4500);

        this.minSpeed = 80;
        this.maxSpeed = 140;
        this.speed = math.rand(this.minSpeed, this.maxSpeed);
        this.counter = 0;

    }

    shoot() {

        const target = this.scene.player;

        const angle = target.position.clone().sub(this.position).angle();

        EnemyBullet.create(this.scene, this.position.x, this.position.y, angle, 180, 0.01, "red");

    }

    update(dt) {

        super.update(dt);

        this.counter += dt * 1000;

        if(this.counter >= 1000) {
            this.counter = 0;
            this.speed = math.rand(this.minSpeed, this.maxSpeed);
        }

        const player = this.scene.player;

        const diff = player.position.clone().sub(this.position);
        const dist = diff.mag();

        const body = this.parent.body;

        if(dist <= this.range && dist > 32) {

            body.velocity = diff.clone().unit().mult(this.speed);

        } else {

            body.velocity.set(0, 0);

        }

    }

    static create(scene, x, y) {

        const enemy = scene.create();

        enemy.position.set(x, y);

        enemy.groupList.add("enemy");

        const w = 64, h = 64;

        let body, sprite;

        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: w,
            height: h,
            image: {
                name: "goblin-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            zIndex: 1
        }));

        sprite.center.y = h * 0.15;

        sprite.addAnim("idle", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}
        ]);

        sprite.addAnim("move", [
            {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}
        ]);

        enemy.addComponent(body = new Lancelot.physics.Box({
            width: w * 0.6,
            height: h * 0.7,
            mass: 1
        }));

        body.addBehavior("wall", "resolve", {
            bounce: 1.0
        });

        enemy.addComponent(new SimpleSpriteController(body, sprite));

        enemy.addComponent(new Goblin(), "Controller");

        return enemy;

    }

}

class Bat extends ShootingEnemy {

    constructor() {

        super(300, 3500, 5500);

        this.speed = 110;
        this.counter = 0;
        this.sleeping = true;

    }

    shoot() {

        const count = 2;

        for(let i = 0; i < count; ++i) {

            const angle = 2 * Math.PI * (i / count + Math.random() / count);

            EnemyBullet.create(this.scene, this.position.x, this.position.y, angle, 150, 0.035, "yellow");

        }

    }

    update(dt) {

        super.update(dt);

        this.counter += dt * 1000;

        const player = this.scene.player,
        sprite = this.getComponent("Sprite");

        const diff = player.position.clone().sub(this.position);
        const dist = diff.mag();

        const body = this.parent.body;

        if(this.sleeping) {

            if(dist <= this.range) {
                this.sleeping = false;
            }

        } else {

            if(this.counter >= 1000) {
                this.counter = 0;
                if(Math.random() > 0.5 || (body.velocity.x == 0 && body.velocity.y == 0)) {
                    body.velocity = diff.clone().add(Vector.fromAngle(math.rand(0, Math.PI * 2)).mult(this.range * 0.5)).unit().mult(this.speed);
                }
            }

        }

        if(body.velocity.x > 0) {
            sprite.scale = {x: 1};
        } else if(body.velocity.x < 0) {
            sprite.scale = {x: -1};
        }

    }

    static create(scene, x, y) {

        const enemy = scene.create();

        enemy.position.set(x, y);

        enemy.groupList.add("enemy");

        const w = 64, h = 64;

        let body, sprite;

        enemy.addComponent(sprite = new Lancelot.drawable.Sprite({
            width: w,
            height: h,
            image: {
                name: "bat-spritesheet",
                frameWidth: 16,
                frameHeight: 16
            },
            zIndex: 3
        }));

        sprite.center.y = h * 0.15;

        sprite.addAnim("fly", [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}
        ]);

        sprite.play("fly", 80, true);

        enemy.addComponent(body = new Lancelot.physics.Box({
            width: w * 0.7,
            height: h * 0.6,
            mass: 1
        }));

        enemy.addComponent(new Bat(), "Controller");

        return enemy;

    }

}

class Golem extends Enemy {

    constructor() {

        super(5000);

        this.state = 0;
        this.counter = 0;

    }

    explode(angle) {

        this.parent.body.velocity.set(0, 0);

        const sprite = this.getComponent("Sprite");
        
        sprite.scaleTo({ x: Math.sign(sprite.scale.x) * 1.5, y: 1.5 }, 150, "linear", () => {

            sprite.play("die", 140, false);

            this.scene.timeout.set(() => {

                this.parent.remove();

                this.scene.audio.effects.play("enemy-pop-sound");

                for(let i = 0; i < 200; ++i) {
                    Particle.create(this.scene, this.position.x, this.position.y, math.rand(0, 2 * Math.PI), 350);
                }

            }, 140 * 14);

        });

    }
    
    update(dt) {

        this.counter += dt * 1000;

        

    }

    static create(scene, x, y) {

        const w = 400, h = 400;

        const golem = scene.create();

        golem.groupList.add("enemy");

        golem.position.set(x, y);

        let body, sprite;
    
            golem.addComponent(body = new Lancelot.physics.Box({
                width: w * 0.34,
                height: h * 0.34,
                mass: 1
            }));

            body.addBehavior("wall", "resolve", {
                bounce: 1.0
            });

            golem.addComponent(sprite = new Lancelot.drawable.Sprite({
                width: w,
                height: h,
                image: {
                    name: "golem-spritesheet",
                    frameWidth: 100,
                    frameHeight: 100
                },
                zIndex: 1
            }));

            sprite.offset.y = -h * 0.04;

            sprite.addAnim("idle", [
                {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, 
            ]);

            sprite.addAnim("glow", [
                {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}, 
            ]);

            sprite.addAnim("shoot", [
                {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}, {x: 7, y: 2}, {x: 8, y: 2}, 
            ]);

            sprite.addAnim("die", [
                {x: 0, y: 7}, {x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}, {x: 8, y: 7},{x: 9, y: 7}, {x: 10, y: 7}, {x: 11, y: 7}, {x: 12, y: 7}, {x: 13, y: 7}
            ]);

            sprite.play("idle", 140, true);
            
            golem.addComponent(new Golem(), "Controller");

            return golem;

    }


}

class Particle extends Lancelot.Component {

    constructor(lifeTime) {

        super();

        this.lifeTime = lifeTime;
        this.lifeTimeCounter = 0;

    }

    update(dt) {

        this.lifeTimeCounter += dt * 1000;

        if(this.lifeTimeCounter >= this.lifeTime) {

            this.scene.particleLayer.getComponent("Buffer").add(this.getComponent("Sprite"));

            this.parent.remove();

        }

    }


    static create(scene, x, y, angle, range) {

        const r = 8;
        const lifeTime = 200;
        const minSpeed = 0, maxSpeed = range / (lifeTime * 0.001);
        const speed = math.rand(minSpeed, maxSpeed);
        

        const particle = scene.create();

        particle.position.set(x, y);

        let sprite, body, controller
        ;
        particle.addComponent(body = new Lancelot.physics.Ball({
            radius: r,
            mass: 1,
        }));

        const vel = Vector.fromAngle(angle).mult(speed);
        body.velocity = vel;

        body.addBehavior("wall", "resolve", {
            bounce: 1.0
        });

        particle.addComponent(sprite = new Lancelot.drawable.Star({
            outerRadius: r,
            innerRadius: 0,
            peaks: 4,
            fillColor: "transparent",
            strokeColor: `hsl(${math.lerp((speed - minSpeed) / (maxSpeed - minSpeed), 0, 360)}, 100%, 50%)`,
            strokeWidth: 2
        }), "Sprite");
        
        particle.addComponent(controller = new Particle(lifeTime));

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
            this.sprite.play("idle", 80, true);
        } else {
            this.sprite.play("move", 80, true);
        }

        if(this.body.velocity.x > 0) {
            this.sprite.scale = {x: 1};
        } else if(this.body.velocity.x < 0) {
            this.sprite.scale = {x: -1};
        }

    }

}

class EnemyBullet extends Lancelot.Component {

    constructor(turnSpeed) {

        super();

        this.turnSpeed = turnSpeed;
        this.lifeTime = 8000;
        this.lifeTimeCounter = 0;

    }

    update(dt) {

        this.lifeTimeCounter += dt * 1000;

        if (this.lifeTimeCounter >= this.lifeTime) {
            this.parent.remove();
            return;
        }

        const target = this.scene.player;
        const body = this.parent.body;

        const angle = target.position.clone().sub(this.position).angle();
        const diff = angle - body.velocity.angle();


        const turnAcc = Math.min(Math.abs(diff), this.turnSpeed);
        if (Math.sin(diff) < 0) {
            body.velocity.rot(-turnAcc);
        } else {
            body.velocity.rot(turnAcc);
        }

    }

    static create(scene, x, y, angle, speed, turnSpeed, color) {

        const r = 18;

        const bullet = scene.create();

        bullet.groupList.add("enemy-bullet");

        bullet.position.set(x, y);

        let sprite, body, controller;

        bullet.addComponent(controller = new EnemyBullet(turnSpeed));

        bullet.addComponent(body = new Lancelot.physics.Ball({
            radius: r
        }));

        const vel = Vector.fromAngle(angle).mult(speed);
        body.velocity = vel;

        body.addBehavior("wall", "detect", {
            action: () => {
                bullet.remove();
            }
        });

        bullet.addComponent(sprite = new Lancelot.drawable.Circle({
            radius: r,
            fillColor: `radial-gradient;4,-4,0,4,-4,12;white=0;${color}=1`,
            strokeWidth: 0,
            zIndex: 1
        }), "Sprite");

    }

}