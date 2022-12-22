class Intro extends Lancelot.Scene {

    constructor(game) {

        const config = {
            background: "#222"
        };

        super(game, "Intro", 0, config);

        const label = this.create();

        label.addComponent(new Lancelot.drawable.Text({
            fillStyle: "white",
            fontSize: 40,
            fontFamily: "Quadrit",
            text: "Click to start"
        }));

        this.interactive.on("mouseup", () => {
            // game.requestFullScreen();
            this.hide();
            game.get("Menu").play();
            this.audio.music.set("menu-music");
            this.audio.music.play();
        });

    }

}