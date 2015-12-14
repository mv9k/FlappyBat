var SPEED = 200;
var GRAVITY = 900;
var FLAP = 390;
var OPENING = 200;
var SPAWN_RATE = 1.25;
var topScore = localStorage.getItem('topScore') || 0;

var state;
state = {
    preload: function () {
        this.load.spritesheet('explosion', 'assets/explosion.png', 40, 40, 8);
        this.load.spritesheet('bat', 'assets/bat.png', 34, 24, 4);
        this.load.image('wall', 'assets/kwflappyBatBlock.png');
        this.load.image('background', 'assets/kwflappyBatBG3.png');
        this.load.audio("flap", "assets/fly.wav");
        this.load.audio("score", "assets/point.wav");
        this.load.audio("hurt", "assets/explode.wav");
    },
    create: function () {

        this.flapSnd = this.add.audio("flap");
        this.scoreSnd = this.add.audio("score");
        this.hurtSnd = this.add.audio("hurt");

        this.background = this.add.tileSprite(0, 0, 800, 530, "background");

        this.walls = this.add.group();

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = GRAVITY;

        this.bat = this.add.sprite(0, 0, 'bat');
        this.bat.animations.add("fly", [0, 1, 2], 10, true);
        this.bat.animations.add('death', [3], 10, true);
        this.physics.arcade.enableBody(this.bat);
        this.bat.body.collideWorldBounds = true;
        this.bat.anchor.setTo(0.5, 0.5);

        this.scoreText = this.add.text(
            this.world.centerX, this.world.height / 5, "", {
                size: "52px",
                fill: "#ccffff",
                align: "center"
                //color: "black"
                //strokeThickness: "5",
                //stroke: "#6600cc"
            }
        );

        this.scoreText.anchor.setTo(0.5, 0.5);

        this.input.onDown.add(this.flap, this);

        this.reset();
    },
    update: function () {
        if (this.gameStarted) {

            if (this.bat.body.velocity.y > -20) {
                if (!this.gameOver) {
                    this.bat.frame = 0;
                }
                else {
                    this.bat.animations.play('death');
                }
            }
            if (!this.gameOver) {
                this.bat.animations.play("fly");
            }

            if (this.bat.angle < 90 && !this.gameOver) {
                this.bat.angle += 1;
            }

            this.walls.forEachAlive(function (wall) {
                if (wall.x + wall.width < game.world.bounds.left) {
                    wall.kill();
                } else if (!wall.scored && wall.x <= state.bat.x) {
                    state.addScore(wall);

                }
            });

            if (!this.gameOver) {
                if (this.bat.body.bottom >= this.world.bounds.bottom) {
                    this.setGameOver();
                }

                this.physics.arcade.collide(this.bat, this.walls, this.setGameOver, null, this);

            }

        } else {
            this.bat.y = this.world.centerY + (8 * Math.cos(this.time.now / 200));

        }
    },
    reset: function () {

        SPEED = 200;
        GRAVITY = 900;
        FLAP = 390;
        OPENING = 200;
        SPAWN_RATE = 1.25;
        topScore = localStorage.getItem('topScore') || 0;

        this.background.autoScroll(-SPEED * 0.80, 0);

        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;

        this.bat.body.allowGravity = false;
        this.bat.angle = 0;
        this.bat.reset(this.world.width / 4, this.world.centerY);
        this.bat.animations.play("fly");

        this.scoreText.setText("Flappy Bat\n\n\nTap to start!");

        this.walls.removeAll();
    },
    start: function () {
        this.bat.body.allowGravity = true;
        this.scoreText.setText(this.score);
        this.gameStarted = true;

        this.wallTimer = this.game.time.events.loop(Phaser.Timer.SECOND * SPAWN_RATE, this.spawnWalls, this);
        this.wallTimer.timer.start();
    },
    flap: function () {
        if (!this.gameStarted) {
            this.start();
        }

        if (!this.gameOver) {
            this.bat.body.velocity.y = -FLAP;
            this.bat.angle = -15;
            this.flapSnd.play();
        } else if (this.time.now > this.timeOver + 400) {
            this.reset();
        }
    },
    setGameOver: function () {
        this.explosion = this.add.sprite(this.bat.position.x, this.bat.position.y, 'explosion');
        this.explosion.anchor.setTo(0.5, 0.5);
        this.explosion.animations.add('explode');
        // ( name, framerate, shouldloop, killOnComplete)
        this.explosion.animations.play('explode', 30, false, true);
        this.bat.animations.play('death', 5, true, false);

        this.gameOver = true;
        this.scoreText.setText("\n\n\n" + "Final Score:" + "\n" + this.score + "\n\n" + "Top Score:" + "\n" + topScore + "\n" + "Tap to Retry!");
        this.timeOver = this.time.now;

        this.walls.forEachAlive(function (wall) {
            wall.body.velocity.x = wall.body.velocity.y = 0;

        });

        this.wallTimer.timer.stop();

        this.background.autoScroll(0, 0);

        this.bat.body.velocity.x = -30;
        this.bat.body.bounce.x = 0.35;
        this.bat.body.bounce.y = 0.35;
        this.bat.body.drag.x = 19;
        this.hurtSnd.play();
    },

    spawnWall: function (y, flipped) {
        var wall = this.walls.create(
            game.width,
            y + (flipped ? -OPENING : OPENING) / 2,
            "wall"
        );

        this.physics.arcade.enableBody(wall);
        wall.body.allowGravity = false;
        wall.scored = false;
        wall.body.immovable = true;
        wall.body.velocity.x = -SPEED;
        if (flipped) {
            wall.scale.y = -1;
            wall.body.offset.y = -wall.body.height;
        }

        return wall;
    },
    spawnWalls: function () {
        if (this.score > 5 && OPENING > 90 && FLAP > 190) {
            OPENING -= 5;
            FLAP -= 5;
        }
        var wallY = this.rnd.integerInRange(game.height * .3, game.height * .7);
        var botWall = this.spawnWall(wallY);
        var topWall = this.spawnWall(wallY, true);
    },
    addScore: function (wall) {
        this.scoreText.y -= 3;
        setTimeout(function () {
            state.scoreText.y += 3;
        }, 60);
        wall.scored = true;
        this.score += .5;
        this.scoreText.setText(this.score);
        this.scoreSnd.play();

        if (this.score > topScore) {
            topScore = this.score
        }
        localStorage.setItem('topScore', topScore);
    }
};

var game = new Phaser.Game(400, 530, Phaser.CANVAS, document.querySelector('#game'), state
);

