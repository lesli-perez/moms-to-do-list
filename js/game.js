// Resize Screen

function resizeGame() {
  const scale = Math.min(
    window.innerWidth / 1024,
    window.innerHeight / 768,
    1
  );
  document.documentElement.style.setProperty('--scale', scale);
}

window.addEventListener('resize', resizeGame);
resizeGame();

// --------------------
// Preload Scene
// --------------------
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Show loading screen
        const imgElement = document.getElementById('loading-logo');
        this.textures.addImage('loading-screen', imgElement);
        const bg = this.add.image(512, 384, 'loading-screen');
        bg.setDisplaySize(1024, 768);

        const flowerImg = document.getElementById('loading-flower');
        this.textures.addImage('loadFlower', flowerImg);

        // Load game assets
        this.load.image("girl-bedroom", "assets/img/scenes/girls-bedroom.png");
        this.load.image("folded-blanket", "assets/img/inventory/folded-blanket.png");
        this.load.image("slinky-toy", "assets/img/objects/slinky.png");

        // ----- Visual progress setup -----
        const flowerWidth = this.textures.get('flower').getSourceImage().width * 0.16;
        this.flowersShown = 0;
        const totalFlowers = 10;
        const spacing = 60;
        const startX = 512-(3.5*spacing) - (5 * flowerWidth);
        const y = 600;

        this.visualProgress = 0;   // 0 → 1
        this.loadingComplete = false;

        this.load.on('complete', () => {
            this.loadingComplete = true;
        });

        this.updateProgress = () => {
            const speed = 1 / 2000; 
            if (!this.lastTime) this.lastTime = this.time.now;
            const delta = this.time.now - this.lastTime;
            this.lastTime = this.time.now;

            // Increase visual progress
            this.visualProgress += delta * speed;

            // Cap at 1
            if (this.visualProgress > 1) this.visualProgress = 1;

            // Add flowers as visual progress passes each 10%
            while (this.visualProgress >= (this.flowersShown + 1) / totalFlowers) {
                const x = startX + this.flowersShown * spacing;
                this.add.image(x, y, 'loadFlower').setScale(0.16);
                this.flowersShown++;
            }

            // When fully visually loaded, start main scene
            if (this.visualProgress >= 1) {
                this.scene.start('GirlRoom');
            }
        };
    }

    // ----- update() method -----
    update() {
        if (this.updateProgress) this.updateProgress();
    }

}




// --------------------
// Main Game Scene
// --------------------
class GirlRoom extends Phaser.Scene {
    constructor() {
        super({ key: 'GirlRoom' });
    }

    create() {
        // Background
        const girlRoom = this.add.image(512, 384, "girl-bedroom");
        girlRoom.setDisplaySize(1024, 768);

        // Folded blanket
        const foldedBlanket = this.add.image(410, 480, "folded-blanket");
        foldedBlanket.setScale(0.12);
        foldedBlanket.setInteractive({ useHandCursor: true, pixelPerfect: true });

        // Slinky
        const slinkyToy = this.add.image(110, 710, "slinky-toy");
        slinkyToy.setScale(0.24);
        slinkyToy.setInteractive({ useHandCursor: true, pixelPerfect: true });

        // Coordinate display top corner so i can see where to put everything
        // REMOVE LATER!!!!
        const coordText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
        this.input.on('pointermove', (pointer) => {
            coordText.setText(`X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`);
        });

        // Message stuff
        const message = this.add.text(512, 700, "", {
            fontFamily: "Arial",
            fontSize: "20px",
            fill: "#c5b632",
            stroke: "#000",
            strokeThickness: 2
        }).setOrigin(0.5);
        const showMessage = (text, duration = 2000) => {
            message.setText(text);
            if (message.hideTimer) message.hideTimer.remove(false);
            message.hideTimer = this.time.delayedCall(duration, () => message.setText(''), [], this);
        };

        // Folded Blanket Click Interaction
        foldedBlanket.on("pointerdown", () => {
            showMessage("I can't make my bed with this blanket. It's dirty.");
        });

        // slinky Click Interaction
        slinkyToy.on("pointerdown", () => {
            showMessage("I should clean this up.");
        });
    }
}


// --------------------
// Game configuration
// --------------------



const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#e6e6e6",

  scene: [PreloadScene, GirlRoom]
};
const game = new Phaser.Game(config);


