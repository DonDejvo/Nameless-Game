class LevelUI extends Lancelot.Scene {

    constructor(game) {

        const config = {
            background: "transparent",
            world: {
                bounds: [[-game.width/2, -game.height/2], [game.width/2, game.height/2]]
            }
        }

        super(game, "LevelUI", 1, config);

        this.createDamageEffect();
        this.createHpBar(20, 20);
        this.createEnemiesCounter(280, 35);
        this.createMenuToggle(20, 20);
        this.createGameOverMessage();
        this.createBlackEffect();
    }

    play() {
        super.play();
        this.reset();
        this.updateHpBar();
    }

    reset() {

        this.gameOverMessage.getComponent("Text").visible = false;
        this.damageEffect.getComponent("Sprite").scale = {x: 1.0, y: 1.0};
        this.blackEffect.getComponent("Sprite").opacity = 0.0;

    }

    updateHpBar() {

        this.hpBar.getComponent("Sprite").image.framePosition.y = data.player.maxhp - data.player.hp;

    }

    showGameOver() {

        this.gameOverMessage.getComponent("Text").visible = true;

    }

    openMenu() {

        this.game.get("Level").pause();
        this.game.get("Menu").play("Level");

    }

    createDamageEffect() {

        this.damageEffect = this.create();

        const damageCircleRadius = Math.hypot(this.game.width, this.game.height);

        this.damageEffect.addComponent(new Lancelot.drawable.Circle({
            radius: damageCircleRadius,
            fillColor: "transparent",
            strokeColor: `radial-gradient;0,0,${damageCircleRadius * 0.5},0,0,${damageCircleRadius * 1.5};rgba(100,0,0,0)=0;rgba(50,0,0,1)=0.5`,
            strokeWidth: damageCircleRadius,
            zIndex: 9
        }), "Sprite");

    }

    createHpBar(left, top) {

        const w = 240, h = 48;

        this.hpBar = this.create();

        this.hpBar.position.set(-this.game.width/2 + w/2 + left, -this.game.height/2 + h/2 + top);

        this.hpBar.addComponent(new Lancelot.drawable.Picture({
            image: {
                name: "hpbar",
                frameWidth: 80,
                frameHeight: 16
            },
            width: w,
            height: h
        }), "Sprite");

    }

    createEnemiesCounter(left, top) {

        const fontSize = 24;

        this.enemiesCounter = this.create();

        this.enemiesCounter.position.set(-this.game.width/2 + left, -this.game.height/2 + fontSize/2 + top);

        let text;
        this.enemiesCounter.addComponent(text = new Lancelot.drawable.Text({
            text: "Enemies left: 0",
            fontSize: fontSize,
            fontFamily: "Quadrit",
            strokeWidth: 2,
            align: "left"
        }));

    }

    createMenuToggle(right, top) {

        const w = 48, h = 48;

        const btn = this.create();

        btn.position.set(this.game.width/2 - w/2 - right, -this.game.height/2 + h/2 + top);

        let sprite, body;
        btn.addComponent(sprite = new Lancelot.drawable.Picture({
            image: {
                name: "menu-toggle",
                frameWidth: 16,
                frameHeight: 16,
                framePosition: {x: 1, y: 0}
            },
            width: w,
            height: h
        }));

        btn.addComponent(body = new Lancelot.physics.Box({
            width: w,
            height: h
        }));

        this.setInteractive(btn);

        btn.interactive.on("mousedown", () => {
            sprite.image.framePosition.x = 0;
        }, true);

        btn.interactive.on("mouseup", () => {
            sprite.image.framePosition.x = 1;
            this.openMenu();
        }, true);

    }

    createGameOverMessage() {

        const fontSize = 75;

        this.gameOverMessage = this.create();

        let text;
        this.gameOverMessage.addComponent(text = new Lancelot.drawable.Text({
            text: "Game Over",
            fontSize: fontSize,
            fontFamily: "Quadrit",
            strokeWidth: 6,
            align: "center"
        }));

    }

    createBlackEffect() {

        this.blackEffect = this.create();

        this.blackEffect.addComponent(new Lancelot.drawable.Rect({
            width: this.game.width,
            height: this.game.height,
            strokeWidth: 0,
            fillColor: "black",
            zIndex: 99
        }), "Sprite");

    }

    fadeOut(cb) {

        this.blackEffect.getComponent("Sprite").fade(1.0, 1500, "linear", cb);

    }

}