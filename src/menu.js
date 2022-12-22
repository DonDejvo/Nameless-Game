class Menu extends Lancelot.Scene {

    menu = null;
    options = null;
    optionsOpened = false;
    cameFrom = null;

    constructor(game) {

        const config = {
            background: "white",
            world: {
                bounds: [[-game.width / 2, -game.height / 2], [game.width / 2, game.height / 2]]
            }
        }

        super(game, "Menu", 9, config);

        this.createBackground();
        this.createMenu();
        this.createOptions();

        this.hideOptions();

    }

    play(cameFrom = null) {

        super.play();

        this.cameFrom = cameFrom;

        if(this.cameFrom == "Level") {
            this.showOptions();
        } else {
            this.hideOptions();
        }

    }

    startGame() {

        this.hide();
        let level = new Level(this.game);
        level.play();

    }

    createBackground() {

        this.backgroundImage = this.create();

        let part1, part2;

        this.backgroundImage.addComponent(part1 = new Lancelot.drawable.Picture({
            image: {
                name: "menu-background"
            },
            width: this.game.width,
            height: this.game.height,
            zIndex: -1
        }), "Part1");

        this.backgroundImage.addComponent(part2 = new Lancelot.drawable.Picture({
            image: {
                name: "menu-background"
            },
            width: this.game.width,
            height: this.game.height,
            zIndex: -1
        }), "Part2");

        part2.offset.y = this.game.height;

    }

    showOptions() {

        this.options.position.x = 0;
        this.menu.position.x = this.game.width;

    }

    hideOptions() {

        this.options.position.x = this.game.width;
        this.menu.position.x = 0;

    }

    setMusic(value) {

        this.audio.music.volume = value;
        this.musicLabel.getComponent("Text").text = `Music: ${Math.round(this.audio.music.volume * 100)}%`;

    }

    musicUp() {

        this.setMusic(this.audio.music.volume + 0.05);

    }

    musicDown() {

        this.setMusic(this.audio.music.volume - 0.05);

    }

    setEffects(value) {

        this.audio.effects.volume = value;
        this.effectsLabel.getComponent("Text").text = `Effects: ${Math.round(this.audio.effects.volume * 100)}%`;

    }

    effectsUp() {

        this.setEffects(this.audio.effects.volume + 0.05);

    }

    effectsDown() {

        this.setEffects(this.audio.effects.volume - 0.05);

    }

    toggleDetails() {

        let details;

        switch(this.game.quality) {
            case 1.0:
                this.game.quality = 0.8;
                details = "Medium";
                break;
            case 0.8:
                this.game.quality = 0.6;
                details = "Low";
                break;
            case 0.6:
                this.game.quality = 1.0;
                details = "High";
                break;
        }

        this.detailsToggle.getComponent("Text").text = `Details: ${details}`;

    }

    showCredit() {

        // alert("Programmed by David Dolejsi");

    }

    createTitle(parent, x, y) {

        const title = this.create();

        if(parent != null) {
            parent.clip(title);
        }

        title.position.set(x, y)

        title.addComponent(new Lancelot.drawable.Text({
            text: "NAMELESS GAME",
            fontFamily: "Quadrit",
            fontSize: 45,
            strokeWidth: 4,
            zIndex: 1
        }));
    }

    createTextField(parent, x, y, text) {

        const w = 192, h = 64;

        const textField = this.create();

        if(parent != null) {
            parent.clip(textField);
        }

        textField.position.set(x, y);

        let sprite, label;

        textField.addComponent(sprite = new Lancelot.drawable.Picture({
            image: {
                name: "menu-button",
                frameWidth: 96,
                frameHeight: 32,
                framePosition: {x: 0, y: 1}
            },
            width: w,
            height: h
        }), "Sprite");

        textField.addComponent(label = new Lancelot.drawable.Text({
            text: text,
            fontFamily: "Quadrit",
            fontSize: 20,
            strokeWidth: 2,
            zIndex: 1
        }));

        return textField;
    }

    createButton(parent, x, y, text, action) {

        const btn = this.createTextField(parent, x, y, text);

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

    createArrowButton(parent, x, y, inv, action) {

        const w = 42, h = 64;

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


    

    createMenu() {

        this.menu = this.create();

        this.createTitle(this.menu, 0, -180);

        this.createButton(this.menu, 0, 0, "New Game", () => this.startGame());

        this.createButton(this.menu, 0, 90, "Options", () => this.showOptions());

        this.createButton(this.menu, 0, 180, "Credit", () => this.showCredit());

    }

    createOptions() {

        this.options = this.create();

        this.musicLabel = this.createTextField(this.options, 0, 0, "Music: 100%");
        this.createArrowButton(this.options, 150, 0, 0, () => this.musicUp());
        this.createArrowButton(this.options, -150, 0, 1, () => this.musicDown());

        this.effectsLabel = this.createTextField(this.options, 0, 90, "Effects: 100%");
        this.createArrowButton(this.options, 150, 90, 0, () => this.effectsUp());
        this.createArrowButton(this.options, -150, 90, 1, () => this.effectsDown());

        this.detailsToggle = this.createButton(this.options, 0, 180, "Details: High", () => this.toggleDetails());

        this.createButton(this.options, 0, 300, "Back", () => {
            if(this.cameFrom == null) {
                this.hideOptions();
            } else if(this.cameFrom == "Level") {
                this.hide();
                this.game.get("Level").play();
            }
        });

        this.options.position.y = -140;

    }

    update(dt) {

        this.backgroundImage.position.y -= 60 * dt;

        if(this.backgroundImage.position.y <= -this.game.height) {
            this.backgroundImage.position.y += this.game.height;
        } 

    }

}