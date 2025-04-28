// Initialize Kaboom
kaboom({
    global: true,
    width: 800,   // Game width
    height: 400,  // Game height
    background: [ 135, 206, 250 ], // Light Sky Blue
    // !!! KEEP DEBUG TRUE UNTIL COLLISION BOX IS PERFECT !!!
    debug: true,
    touchToMouse: true,
});

// --- Game Variables ---
const JUMP_FORCE = 600;
const OBSTACLE_SPEED = 250; // How fast lava moves left
const GRAVITY_FORCE = 1400;
const WIN_SCORE = 7;       // Puddles to jump before Ben appears
const PLAYER_START_X = 100; // Player's horizontal position
const PLATFORM_HEIGHT = 20;
const PLATFORM_Y = height() - 50; // Y position of the top of the platform
const LAVA_WIDTH = 60;
const LAVA_HEIGHT = 15;
const ABIGAIL_RUN_SPEED = 12;
const BEN_IDLE_SPEED = 5;
const BEN_SPAWN_DISTANCE = width() + 300; // How far right Ben spawns initially

// --- Asset Loading ---
loadSprite("abigail", "run.png", {
    sliceX: 8, sliceY: 1,
    anims: { run: { from: 0, to: 7, loop: true, speed: ABIGAIL_RUN_SPEED } }
});
loadSprite("ben", "ben.png", {
    sliceX: 3, sliceY: 1,
    anims: { idle: { from: 0, to: 2, loop: true, speed: BEN_IDLE_SPEED } }
});

// --- Global Game State (for tracking score etc. across functions) ---
let currentScore = 0;
let isBenSpawned = false;
let scoreLabel = null;

// --- Obstacle Spawning ---
function spawnLavaPuddle() {
    if (!isBenSpawned || get("ben_goal").length === 0) {
        add([
            rect(LAVA_WIDTH, LAVA_HEIGHT),
            pos(width(), PLATFORM_Y),
            anchor("botleft"),
            color(255, 69, 0),
            area(),
            move(LEFT, OBSTACLE_SPEED),
            offscreen({ destroy: true }),
            "obstacle", "lava", { passed: false }, "scorer",
            {
                update() {
                    if (this.pos.x + LAVA_WIDTH < PLAYER_START_X && !this.passed) {
                        this.passed = true;
                        currentScore++;
                        if (scoreLabel) { scoreLabel.text = "Score: " + currentScore; }
                        if (currentScore >= WIN_SCORE && !isBenSpawned) {
                            spawnBen();
                            isBenSpawned = true;
                        }
                    }
                }
            }
        ]);
    }
    wait(rand(0.7, 1.6), spawnLavaPuddle);
}

// --- Ben Spawning ---
function spawnBen() {
    add([
        sprite("ben"),
        pos(BEN_SPAWN_DISTANCE, PLATFORM_Y),
        anchor("botleft"),
        area(),
        body({ isStatic: true }),
        move(LEFT, OBSTACLE_SPEED),
        "ben_goal",
    ]).play("idle");
}

// --- Scene Definitions ---
scene("start", () => {
    add([ text("Abigail's Lava Dash!", { size: 36 }), pos(center().x, height() * 0.3), anchor("center"), color(255, 105, 180) ]);
    add([ text("Tap or Click to Jump", { size: 22 }), pos(center().x, height() * 0.5), anchor("center"), color(0,0,0) ]);
    add([ text(`Jump 9 lava puddles to find Ben!`, { size: 18 }), pos(center().x, height() * 0.6), anchor("center"), color(0,0,128) ]);
    add([ text("Tap anywhere to Start", { size: 24 }), pos(center().x, height() * 0.8), anchor("center"), color(255, 69, 0) ]);
    onMousePress(() => go("game")); onKeyPress("space", () => go("game"));
});

scene("game", () => {
    currentScore = 0;
    isBenSpawned = false;
    setGravity(GRAVITY_FORCE);
    const platform = add([ rect(width(), PLATFORM_HEIGHT), pos(0, PLATFORM_Y), color(139, 69, 19), area(), body({ isStatic: true }), "platform", ]);

    // Add Abigail
    const player = add([
        sprite("abigail"),
        pos(PLAYER_START_X, PLATFORM_Y),
        anchor("botleft"),
        // REPLACE scale with shape:
        // area({ scale: vec2(0.7, 0.9)}), // REMOVE THIS
        // ADD SHAPE - Adjust X offset and WIDTH. Use correct Y offset and HEIGHT.
        area({ shape: new Rect(vec2(45, 0), 20, 58) }), // <--- ADJUST X & WIDTH VALUES
        body(),
        "player",
    ]);

    player.play("run");
    scoreLabel = add([ text("Score: " + currentScore, { size: 24 }), pos(20, 20), color(0, 0, 0), fixed(), ]);
    function jump() { if (player.isGrounded()) { player.jump(JUMP_FORCE); player.stop(); } }
    player.onGround(() => { if (player.curAnim() !== "run") { player.play("run"); } });
    player.onFall(() => { player.stop(); });
    onMousePress(jump); onKeyPress("space", jump);
    player.onCollide("lava", () => { go("lose", currentScore); });
    player.onUpdate(() => { if (player.pos.y > height() + 20) { go("lose", currentScore); } });
    player.onCollide("ben_goal", () => { go("win", currentScore); });
    spawnLavaPuddle();
});

scene("lose", (score) => { /* ... Lose scene unchanged ... */
    add([ rect(width(), height()), pos(0,0), color(255, 69, 0, 0.8) ]);
    add([ text("Melted!", { size: 50 }), pos(center().x, height() * 0.3), anchor("center"), color(255, 255, 255) ]);
    add([ text("Puddles Jumped: " + score, { size: 30 }), pos(center().x, height() * 0.5), anchor("center"), color(255, 255, 255) ]);
    add([ text("Tap anywhere to Retry", { size: 24 }), pos(center().x, height() * 0.7), anchor("center"), color(255, 255, 0) ]);
    onMousePress(() => go("game")); onKeyPress("space", () => go("game"));
});

scene("win", (score) => { /* ... Win scene unchanged ... */
    add([ rect(width(), height()), pos(0,0), color(255, 215, 0, 0.7) ]);
    add([ text("You Found Ben!", { size: 50 }), pos(center().x, height() * 0.3), anchor("center"), color(0, 100, 0) ]);
    add([ sprite("ben"), pos(center().x + 50, height() * 0.55), anchor("center"), scale(1.5) ]).play("idle");
    add([ sprite("abigail"), pos(center().x - 50, height() * 0.55), anchor("center"), scale(1.5) ]);
    add([ text("Puddles Jumped: " + score, { size: 30 }), pos(center().x, height() * 0.7), anchor("center"), color(0, 0, 0) ]);
    add([ text("Tap anywhere to Play Again", { size: 24 }), pos(center().x, height() * 0.85), anchor("center"), color(255, 20, 147) ]);
    onMousePress(() => go("game")); onKeyPress("space", () => go("game"));
});

// --- Start the Game ---
go("start");