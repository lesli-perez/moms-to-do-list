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
            { key: "pen", path: "assets/img/inventory/pen.png" },
            { key: "inventory-icon", path: "assets/img/objects/bag.png" },
            { key: "inventory-bg", path: "assets/img/scenes/inventory-bg.png" },
            { key: "inventory-card", path: "assets/img/objects/inventory-card.png" },
            { key: "exit-icon", path: "assets/img/objects/x.png" },
            {key: "map", path: "assets/img/scenes/map.png"},
            {key: "map-icon", path: "assets/img/objects/map-icon.png"},
            { key: "kitchen", path: "assets/img/scenes/kitchen.png" },          
            {key: "moms-list", path: "assets/img/inventory/moms-list.png"}  
        ];

        gameAssets.forEach(asset => {
            this.load.image(asset.key, asset.path);
        });

        // ----- Visual progress setup -----
        const flowerWidth = this.textures.get('flower').getSourceImage().width * 0.16;
        this.flowersShown = 0;
        const totalFlowers = 10;
        const spacing = 60;
        const startX = 512-(4.5*spacing) - (5 * flowerWidth);
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
        if (!this.registry.has('inventory')) {
          this.registry.set('inventory', new Set());
        }

        if (!this.registry.has('removedItems')) {
          this.registry.set('removedItems', new Set());
        } 
  
        const inventory = this.registry.get('inventory');
        const removedItems = this.registry.get('removedItems');

        

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
                addToInventory: "pen",
                disappear: true
            },
            { 
                key: "inventory-icon", 
                x: 970, y: 700, scale: 0.09,
                message: "",
                newScene: "InventoryScene"
            },
            { 
                key: "map-icon", 
                x: 970, y: 50, scale: 0.19,
                message: "",
                newScene: "MapScene"
            },
        ];

        // --------------------
        // Interactivity (is that a word?)
        items.forEach(item => {
          // dont create items that are in inventory or removed!!
            if (removedItems.has(item.key)) {
              return;
            }

            const obj = this.add.image(item.x, item.y, item.key).setScale(item.scale);
            obj.setInteractive({ useHandCursor: true, pixelPerfect: true });

            obj.on("pointerdown", () => {
                // Check prerequisites
                if (item.newScene){
                  this.registry.set('lastScene', this.scene.key);
                  this.scene.start(item.newScene);
                }
                if (!item.requiredInventory || inventory.has(item.requiredInventory)) {
                    this.showMessage(item.message);
                    if (item.addToInventory) inventory.add(item.addToInventory);
                   if (item.disappear) {
                      obj.setVisible(false).disableInteractive();
                      
                      // remove item globally
                      removedItems.add(item.key);
                      this.registry.set('removedItems', removedItems);
                  }
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
// Kitchen
// --------------------
class KitchenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KitchenScene' });
    }

    create() {
        const lastScene = this.registry.get('lastScene') || 'GirlRoom';
        const inventory = this.registry.get('inventory');
        const removedItems = this.registry.get('removedItems');

        // --------------------
        // Background
        this.add.image(512, 384, "kitchen")
            .setDisplaySize(1024, 768);
        
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
                key: "inventory-icon", 
                x: 970, y: 700, scale: 0.09,
                message: "",
                newScene: "InventoryScene"
            },
            { 
                key: "map-icon", 
                x: 970, y: 50, scale: 0.19,
                message: "",
                newScene: "MapScene"
            },
            { 
                key: "moms-list", 
                x: 896, y: 200, scale: 0.05,
                message: "Mom must have left this for me.",
                addToInventory: "moms-list",
                disappear: true,
            },

        ];

        // --------------------
        // Interactivity (is that a word?)
        items.forEach(item => {
          // dont create items that are in inventory or removed!!
            if (removedItems.has(item.key)) {
              return;
            }

            const obj = this.add.image(item.x, item.y, item.key).setScale(item.scale);
            obj.setInteractive({ useHandCursor: true, pixelPerfect: true });

            obj.on("pointerdown", () => {
                // Check prerequisites
                if (item.newScene){
                  this.registry.set('lastScene', this.scene.key);
                  this.scene.start(item.newScene);
                }
                if (!item.requiredInventory || inventory.has(item.requiredInventory)) {
                    this.showMessage(item.message);
                    if (item.addToInventory) inventory.add(item.addToInventory);
                   if (item.disappear) {
                      obj.setVisible(false).disableInteractive();
                      
                      // remove item globally
                      removedItems.add(item.key);
                      this.registry.set('removedItems', removedItems);
                  }
                if (item.key == "moms-list" && !inventory.has("pen")) {
                    //HINT
                    this.time.delayedCall(2000, () => {
                        this.showMessage("If only I had a pen...");
                    })
                }
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
// Inventory
// --------------------
class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
    }

    create() {
        const inventorySet = this.registry.get('inventory') || [];
        const inventory = Array.from(inventorySet);
        const lastScene = this.registry.get('lastScene') || 'GirlRoom';

        // --------------------
        // Background
        this.add.image(512, 384, "inventory-bg")
            .setDisplaySize(1024, 768);

        // --------------------
        // Exit Button
        const exitBtn = this.add.image(970, 40, "exit-icon")
            .setScale(0.07)
            .setInteractive({ useHandCursor: true });

        exitBtn.on("pointerdown", () => {
            this.scene.start(lastScene);
        });


        const itemData = {
            pen: { image: 'pen', name: 'Pen', scale: 0.4, fontSize: "38px" },
            "folded-blanket": { image: 'folded-blanket', name: 'Dirty Blanket', scale: 0.3, fontSize: "38px" },
            "moms-list": {image: 'moms-list', name: 'Mom\'s To Do List', scale: 0.09, fontSize: "34px"}
        };

        const startX = 355;
        const startY = 248;
        const spacingX = 340;
        const spacingY = 260;
        const columns = 3;

        inventory.forEach((itemKey, index) => {
            const data = itemData[itemKey];
            if (!data) {
                console.warn("Missing itemData for:", itemKey);
                return;
            }

            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = Math.round(startX + col * spacingX);
            const y = Math.round(startY + row * spacingY);

            // Card container
            const cardBg = this.add.image(0, 0, "inventory-card").setScale(0.26);
            const icon = this.add.image(0, -40, data.image).setScale(data.scale);

            const label = this.add.text(0, 75, data.name, {
                fontFamily: '"Biro Script Plus"',
                fontSize: data.fontSize,
                fontWeight: "normal",
                color: "#b402ad"
            }).setOrigin(0.5);

            const container = this.add.container(x, y, [cardBg, icon, label]);
            container.setSize(cardBg.displayWidth, cardBg.displayHeight);
            container.setInteractive({ useHandCursor: true });
            container.on("pointerdown", () => console.log("Clicked:", data.name));
        });
    }


}


// --------------------
// MAP
// --------------------
class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
      const lastScene = this.registry.get('lastScene') || 'GirlRoom';
      // --------------------
      // Background
      this.add.image(512, 384, "map").setDisplaySize(1024, 768);
      
      // --------------------
      // Message display helper
      let location = '';
      if (lastScene == 'MomRoom'){
        location = 'Mom\'s Room.';
      }
      else if (lastScene == 'KitchenScene'){
        location = 'the Kitchen.';
      }
      else if (lastScene == 'BathroomScene'){
        location = 'the Bathroom.';
      }
      else if (lastScene == 'GardenScene'){
        location = 'the Garden.';
      }
      else if (lastScene == 'LaundromatScene'){
        location = 'the Laundromat.';
      }
      else{location = "My Room."}

    

        this.add.text(537, 750, "You're in " + location, {
            fontFamily: '"Biro Script Plus"',
            fontSize: "24px",
            fontWeight: "normal",
            color: "#b402ad"
        })
        .setOrigin(0.5)
        .setRotation(Phaser.Math.DegToRad(5));

        // --------------------
        // Clickable Map Areas
        const locations = [
        { scene: "GirlRoom", x: 700, y: 400, width: 250, height: 135, rotation: Phaser.Math.DegToRad(4) },
        { scene: "KitchenScene", x: 464, y: 256, width: 210, height: 395, rotation: Phaser.Math.DegToRad(4) }
        ];

        locations.forEach(loc => {
        const zone = this.add.zone(loc.x, loc.y, loc.width, loc.height);
        zone.setOrigin(0.5);
        zone.setRotation(loc.rotation);
        zone.setInteractive({ useHandCursor: true });

        zone.on("pointerdown", () => {
            this.scene.start(loc.scene);
        });

        // debug rectangles for adjusting positions
        // const debugRect = this.add.rectangle(loc.x, loc.y, loc.width, loc.height, 0xff0000, 0.3);
        // debugRect.setOrigin(0.5);
        // debugRect.setRotation(loc.rotation);
        });

      // --------------------
      //EXIT
        const items  = [
        {
          key:"exit-icon",
          x: 970, y: 40, scale: 0.07,
          exit: true,
          pixelPerfect: false
        }
      ];
      const obj = this.add.image(970, 40, 'exit-icon').setScale(0.07);
      obj.setInteractive({ useHandCursor: true, pixelPerfect: false});
      obj.on("pointerdown", () => {
         this.scene.start(lastScene);
      })

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


window.addEventListener("load", async () => {

  await document.fonts.load('24px "Biro Script Plus"');
  await document.fonts.ready;

  const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    backgroundColor: "#e6e6e6",
    scene: [PreloadScene, GirlRoom, InventoryScene, MapScene, KitchenScene]
  };

  new Phaser.Game(config);
});


