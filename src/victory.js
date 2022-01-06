class Victory extends Lancelot.Scene {

    constructor(game) {

        const config = {
            background: "#000",
            world: {
                bounds: [[-game.width/2, -game.height/2], [game.width/2, game.height/2]]
            }
        };

        super(game, "Victory", 0, config);

        this.createLabel(80, "Victory!", 30);
        this.createLabel(200, "Total time: " + this.parseTime(data.time), 20);
        this.createLabel(300, "Stats", 20);
        this.createUpgradesTable(340);

    }

    parseTime(value) {

        const sec = Math.floor(value % 60);
        const min = Math.floor(value / 60);

        return (min > 9 ? min : "0" + min) + " : " + (sec > 9 ? sec : "0" + sec);

    }

    createLabel(top, text, fontSize) {

        this.label = this.create();

        this.label.position.y = -this.game.height/2 + fontSize/2 + top;

        this.label.addComponent(new Lancelot.drawable.Text({
            text: text,
            fontSize: fontSize,
            fontFamily: "Quadrit",
            strokeWidth: 0,
            align: "center"
        }));

    }

    createUpgradesTable(top) {

        const size = 180;

        const table = this.create();

        table.position.y = -this.game.height/2 + size/2 + top;

        table.addComponent(new UpgradesTableSprite({
            width: size,
            height: size
        }));

    }

}

class UpgradesTableSprite extends Lancelot.drawable.FixedDrawable {

    constructor(params) {

        super(params);

    }

    draw(ctx) {

        const cols = 5, rows = 4;
        const cellSize = this.height / rows;

        let i = 0;

        for(let attr in data.player.upgrades) {

            const y = (i - (rows - 1) / 2) * cellSize;
            let x = -(cols - 1) / 2 * cellSize;
            let j = 0;

            switch(attr) {
                case "multishot":
                    ctx.beginPath();
                    ctx.fillStyle = "red";
                    Lancelot.drawable.regularPolygon(ctx, x, y, cellSize * 0.45, 3);
                    ctx.fill();
                    break;
                case "agility":
                    ctx.beginPath();
                    ctx.fillStyle = "aqua";
                    ctx.arc(x, y, cellSize * 0.4, 0, 2 * Math.PI);
                    ctx.fill();
                    break;
                case "homing":
                    ctx.beginPath();
                    ctx.fillStyle = "yellow";
                    Lancelot.drawable.star(ctx, x, y, cellSize * 0.225, cellSize * 0.45, 5);
                    ctx.fill();
                    break;
                case "firerate":
                    ctx.beginPath();
                    ctx.fillStyle = "violet";
                    Lancelot.drawable.regularPolygon(ctx, x, y, cellSize * 0.4, 5);
                    ctx.fill();
                    break;
            }

            ctx.fillStyle = "white";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;

            for(let k = 1; k < cols; ++k) {

                x = (k - (cols - 1) / 2) * cellSize;

                ctx.beginPath();
                ctx.rect(x - cellSize * 0.3, y - cellSize * 0.3, cellSize * 0.6, cellSize * 0.6);
                if(k <= data.player.upgrades[attr]) {
                    ctx.fill();
                }
                ctx.stroke();

            }

            ++i;

        }

    }

}