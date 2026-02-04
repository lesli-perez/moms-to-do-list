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

        const gameAssets = [
            { key: "girl-bedroom", path: "assets/img/scenes/girls-bedroom.png" },
            { key: "folded-blanket", path: "assets/img/inventory/folded-blanket.png" },
            { key: "slinky-toy", path: "assets/img/objects/slinky.png" },
            { key: "pen-crop", path: "assets/img/inventory/pen-cropped.png" },
            { key: "pen", path: "assets/img/inventory/pen.png" }
        ];

        gameAssets.forEach(asset => {
            this.load.image(asset.key, asset.path);
        });

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
        // --------------------
        // Game state
        this.inventory = new Set(); // track collected items

        // --------------------
        // Background
        this.add.image(512, 384, "girl-bedroom").setDisplaySize(1024, 768);

        // --------------------
        // Message display helper
        this.message = this.add.text(512, 700, "", {
            fontFamily: "Arial",
            fontSize: "20px",
            fill: "#c5b632",
            stroke: "#000",
            strokeThickness: 2
        }).setOrigin(0.5);

        this.showMessage = (text, duration = 2000) => {
            this.message.setText(text);
            if (this.message.hideTimer) this.message.hideTimer.remove(false);
            this.message.hideTimer = this.time.delayedCall(duration, () => this.message.setText(''), [], this);
        };

        // --------------------
        // Items
        const items = [
            { 
                key: "folded-blanket", 
                x: 410, y: 480, scale: 0.12,
                message: "I can't make my bed with this blanket. It's dirty.",
                requiredInventory: "pen"
            },
            { 
                key: "slinky-toy", 
                x: 110, y: 710, scale: 0.24,
                message: "I should clean this up later.",
                requiredInventory: "pen"
            },
            { 
                key: "pen-crop", 
                x: 689, y: 430, scale: 0.14,
                message: "This could be useful!",
                addToInventory: "pen"
            }
        ];

        // --------------------
        // Interactivity (is that a word?)
        items.forEach(item => {
            const obj = this.add.image(item.x, item.y, item.key).setScale(item.scale);
            obj.setInteractive({ useHandCursor: true, pixelPerfect: true });

            obj.on("pointerdown", () => {
                // Check prerequisites
                if (!item.requiredInventory || this.inventory.has(item.requiredInventory)) {
                    this.showMessage(item.message);
                    // Optionally add item to inventory
                    if (item.addToInventory) this.inventory.add(item.addToInventory);
                } else {
                    this.showMessage("I can't use this yet.");
                }
            });
        });

        // --------------------
        // Show coordinates (remove later!!!!!)
        // --------------------
        const coordText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
        this.input.on('pointermove', pointer => {
            coordText.setText(`X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`);
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


