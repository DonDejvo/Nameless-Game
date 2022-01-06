class Reward extends Lancelot.Scene {

    selected = false;

    constructor(game) {

        const config = {
            background: "#000",
            world: {
                bounds: [[-game.width/2, -game.height/2], [game.width/2, game.height/2]]
            }
        };

        super(game, "Reward", 0, config);

        this.createLabel(60);
        this.createCards();

    }

    createLabel(top) {

        const fontSize = 20;

        this.label = this.create();

        this.label.position.y = -this.game.height/2 + fontSize/2 + top;

        this.label.addComponent(new Lancelot.drawable.Text({
            text: "Select your reward",
            fontSize: fontSize,
            fontFamily: "Quadrit",
            strokeWidth: 0,
            align: "center"
        }));

    }

    createCards() {

        const cards = [
            {
                name: "agility",
                title: "AGILITY",
                desc: "Move faster!"
            },
            {
                name: "firerate",
                title: "FIRE RATE",
                desc: "Shoot with\nhigher frequency!"
            },
            {
                name: "multishot",
                title: "MULTISHOT",
                desc: "More bullets\nper shot."
            },
            {
                name: "homing",
                title: "HOMING",
                desc: "Bullets find\ntheir targets."
            }
        ].filter((elem) => data.player.upgrades[elem.name] < 4);

        math.shuffle(cards);

        for(let i = 0; i < Math.min(cards.length, 3); ++i) {
            const card = Card.create(this, (i - 1) * 200, 120, cards[i]);
            this.timeout.set(() => {
                card.getComponent("Controller").flip();
            }, (i + 1) * 600);
        }

    }

}

class Card extends Lancelot.Component {

    constructor(x, y, cardType) {

        super();

        this.cardType = cardType;
        this.selected = false;
        this.flipped = false;
        this.hovered = false;
        this.basePosition = new Vector(x, y);

    }

    select() {

        if(!this.hovered) {
            return;
        }

        this.selected = true;

        data.player.upgrades[this.cardType.name] += 1;

        this.scene.label.position.y = -this.scene.game.height;

        const desc = this.getComponent("Description");
        desc.visible = false;

        const dur = 4000;

        this.parent.moveTo(new Vector(0, -60), 1000, "linear", () => {

            for(let card of this.scene.getEntitiesByGroup("card")) {

                const face = card.getComponent("Face");
                const back = card.getComponent("Back");
    
                if(card == this.parent) {
                    
                    const angle = 0;
                    face.shaker.shake(10, dur, 10, angle);
                    back.shaker.shake(10, dur, 10, angle);
    
                } else {
    
                    face.fade(0, dur/2);
                    back.fade(0, dur/2);
    
                }
                
            }

            this.scene.audio.effects.play("next-dungeon-sound");

            this.scene.timeout.set(() => {

                this.scene.hide();
                new Level(this.scene.game).play();

            }, dur);

        });

        


    }

    hover() {

        if(this.hovered) {
            return;
        }

        const desc = this.getComponent("Description");

        this.parent.moveTo(this.basePosition.clone().sub(new Vector(0, 100)), 600, "ease-out");

        desc.visible = true;
        this.hovered = true;

        for(let card of this.scene.getEntitiesByGroup("card")) {
            if(card == this.parent) {
                continue;
            }
            card.getComponent("Controller").unhover();
        }

    }

    unhover() {

        if(!this.hovered) {
            return;
        }

        const desc = this.getComponent("Description");

        this.parent.moveTo(this.basePosition, 600, "ease-out");

        desc.visible = false;
        this.hovered = false;

    }

    flip() {

        if(this.flipped) {
            return;
        }

        const dur = 600;

        const face = this.getComponent("Face");
        const back = this.getComponent("Back");

        face.scaleTo({x: 1}, dur);
        back.scaleTo({x: 1}, dur, "linear", () => {
            this.flipped = true;
        });

    }

    update() {

        const face = this.getComponent("Face");
        const back = this.getComponent("Back");

        if(this.selected) {
            face.zIndex = 10;
        } else {
            face.zIndex = face.scale.x;
        }

        back.zIndex = -back.scale.x;

        if(this.flipped) {
            back.visible = false;
        }

    }

    static create(scene, x, y, cardType) {

        const w = 140, h = 220;
        const col1 = "gold", col2 = "goldenrod";

        const card = scene.create();

        card.groupList.add("card");

        card.position.set(x, y);

        let controller, desc;

        card.addComponent(new Lancelot.physics.Box({
            width: w,
             height: h
        }));

        card.addComponent(new CardFace({
            width: w,
            height: h,
            borderRadius: 10,
            strokeWidth: 5,
            fillColor: col1,
            strokeColor: col2,
            scale: {x: -1}
        }), "Face");

        card.addComponent(new CardBack({
            width: w,
            height: h,
            borderRadius: 10,
            fillColor: col1,
            strokeColor: col2,
            strokeWidth: 5,
            scale: {x: -1}
        }), "Back");

        card.addComponent(desc = new Lancelot.drawable.Text({
            text: cardType.desc,
            fontFamily: "Quadrit",
            strokeWidth: 0,
            fontSize: 18,
            align: "left"
        }), "Description");

        desc.visible = false;
        desc.offset.set(-w/2 , h * 0.8);

        card.addComponent(controller = new Card(x, y, cardType), "Controller");

        scene.setInteractive(card);

        card.interactive.on("mousedown", () => {

            if(!controller.flipped || scene.selected) {
                return;
            }

            if(!controller.hovered) {
                controller.hover();
            } else {
                scene.selected = true;
                controller.select();
            }

        });

        return card;

    }

}

class CardFace extends Lancelot.drawable.RoundedRect {

    constructor(params) {

        super(params);

    }

    draw(ctx) {

        super.draw(ctx);

        const cardType = this.getComponent("Controller").cardType;

        ctx.fillStyle = this.strokeColor.value;
        ctx.font = "18px Quadrit";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cardType.title, 0, -this.height * 0.35);

        switch(cardType.name) {
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
            case "firerate":
                ctx.beginPath();
                ctx.fillStyle = "violet";
                Lancelot.drawable.regularPolygon(ctx, 0, 0, 40, 5);
                ctx.fill();
                break;
        }

    }

}

class CardBack extends Lancelot.drawable.RoundedRect {

    constructor(params) {

        super(params);

    }

    draw(ctx) {

        super.draw(ctx);

        const d = this.width + this.height;

        const getDist = (p1, p2) => {
            return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
        }

        const getPosition = (t, ...points) => {
            let total = 0;
            const distArr = [0];
            for(let i = 0; i < points.length - 1; ++i) {
                total += getDist(points[i], points[i + 1]);
                distArr.push(total);
            }
            const d = t * total;
            for(let i = 1; i < distArr.length; ++i) {
                if(d <= distArr[i]) {
                    const u = (d - distArr[i - 1]) / (distArr[i] - distArr[i - 1]);
                    return [
                        points[i - 1][0] + u * (points[i][0] - points[i - 1][0]),
                        points[i - 1][1] + u * (points[i][1] - points[i - 1][1])
                    ];
                }
            }
        }

        const points = [
            [-this.width/2, -this.height/2],
            [this.width/2, -this.height/2],
            [this.width/2, this.height/2],
            [-this.width/2, this.height/2],
        ];

        ctx.beginPath();
        ctx.fillStyle = this.strokeColor.value;
        ctx.lineWidth = 3;

        const count = 10;
        for(let i = 0; i <= count; ++i) {

            const t = i / count;
            const start1 = getPosition(t, points[0], points[1], points[2]);
            const end1 = getPosition(t, points[0], points[3], points[2]);
            const start2 = getPosition(t, points[1], points[0], points[3]);
            const end2 = getPosition(t, points[1], points[2], points[3]);

            ctx.moveTo(...start1);
            ctx.lineTo(...end1);
            ctx.stroke();
            ctx.moveTo(...start2);
            ctx.lineTo(...end2);
            ctx.stroke();

        }

    }

}