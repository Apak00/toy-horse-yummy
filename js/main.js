"use strict";

(function () {
    // the DOM will be available here
    let trashImg = document.getElementsByClassName("trashImg")[0];
    let playerHorseImg = document.getElementsByClassName("horse");
    let trashCaughtImg = document.getElementsByClassName("trashCaughtImg")[0];
    let specialItemImg = document.getElementsByClassName("specialItem");

    let gameOver = document.getElementById("gameOver");
    let startButton = document.getElementById("startButton");
    let leaderBoardButton = document.getElementById("leaderBoardButton");
    let restartButton = document.getElementById("restartButton");
    let playerNameInput = document.getElementsByTagName("input")[0];
    let leaderBoardTable = document.getElementsByTagName("table")[0];


    restartButton.style.display = "none";

    leaderBoardButton.onclick = function () {
        dbRef.child("myLeaderBoard").once("value", snap => {
            if (leaderBoard && snap.val() !== null) {
                leaderBoard = snap.val();
                leaderBoardTable.innerHTML = sortAndMarkUp(leaderBoard);
            }
        });
        leaderBoardButton.style.display = "none";
        leaderBoardTable.style.display = "unset";
        startButton.style.display = "unset";
        playerNameInput.style.display = "unset";
        restartButton.style.display = "none";
    };

    startButton.onclick = function () {
        startGame(playerNameInput.value);

    };

    restartButton.onclick = function () {
        myGameMap.remove();
        leaderBoardButton.style.display = "unset";
        leaderBoardTable.style.display = "none";
        startButton.style.display = "unset";
        playerNameInput.style.display = "unset";
        restartButton.style.display = "none"
    };

    // ARCADE GAME

    let player;
    let playerScore;
    let sessionTime;
    let myGameMap = {};
    let leaderBoard = {};
    let tableBody = "";

    let dbRef = firebase.database().ref();
    dbRef.child("myLeaderBoard").once("value", snap => {
        if (snap.val() !== null) {
            leaderBoard = snap.val();
        }
    });

    function Component(x, y, width, height, color, type, specialItemId) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.specialItemId = specialItemId;

        this.update = function () {
            let ctx = myGameMap.context;
            if (this.type === "text") {
                ctx.font = "16px Arial";
                ctx.fillStyle = this.color;
                ctx.fillText("Score: " + this.currentScore, this.x, this.y);
            } else if (this.type === "time") {
                ctx.font = "16px Arial";
                ctx.fillStyle = this.color;
                ctx.fillText("Time: " + this.currentTime, this.x, this.y);
            } else if (this.type === "human") {
                this.secondWidth = width * player.volumeMultiplier;
                this.secondHeight = height * player.volumeMultiplier;
                if (this.x <= 0)
                    this.x = 0;
                if (this.y <= 0)
                    this.y = 0;

                if (this.x >= myGameMap.canvas.width - playerHorseImg[1].width / 3)
                    this.x = myGameMap.canvas.width - playerHorseImg[1].width / 3;
                if (this.y >= myGameMap.canvas.height - playerHorseImg[2].height)
                    this.y = myGameMap.canvas.height - playerHorseImg[2].height;
                this.x += this.speedX;
                this.y += this.speedY;
                ctx.textAlign = "center";
                ctx.shadowColor = "Red";
                ctx.shadowBlur = this.shadowBlur;
                if (this.speedY < 0) {
                    ctx.drawImage(playerHorseImg[0], this.srcX, this.srcY, this.width, this.height, this.x, this.y, this.secondWidth, this.secondHeight);
                } else if (this.speedX > 0) {
                    ctx.drawImage(playerHorseImg[1], this.srcX, this.srcY, this.width, this.height, this.x, this.y, this.secondWidth, this.secondHeight);
                } else if (this.speedY > 0) {
                    ctx.drawImage(playerHorseImg[2], this.srcX, this.srcY, this.width, this.height, this.x, this.y, this.secondWidth, this.secondHeight);
                } else if (this.speedX < 0) {
                    ctx.drawImage(playerHorseImg[3], this.srcX, this.srcY, this.width, this.height, this.x, this.y, this.secondWidth, this.secondHeight);
                } else {
                    ctx.drawImage(playerHorseImg[2], 0, 0, this.width, this.height, this.x, this.y, this.secondWidth, this.secondHeight);
                }
                ctx.shadowBlur = 0;
            } else if (this.type === "caught") {
                ctx.drawImage(trashCaughtImg, this.x, this.y, this.width, this.height);
            } else if (this.type === "specialItem") {
                ctx.drawImage(specialItemImg[this.specialItemId], this.x, this.y, this.width, this.height);
            } else {
                ctx.drawImage(trashImg, this.x, this.y, this.width, this.height);
            }

        };
        this.catchItem = function (trash) {
            let myX = this.x + this.secondWidth / 6;
            let myY = this.y + this.secondHeight / 6;
            let myH = this.secondHeight / 3 * 2;
            let myW = this.secondWidth / 3 * 2;
            let oX = trash.x + (trash.width / 2);
            let oY = trash.y + (trash.height / 2);

            if ((myX < oX && oX < (myX + myW)) && (myY < oY && oY < (myY + myH))) {
                return true;
            }
        };
    }

    function updateGameMap() {
        for (let i = 0; i < myGameMap.trashes.length; i++) {
            if (player.catchItem(myGameMap.trashes[i])) {
                // When trash is catched:
                myGameMap.caughtTrashes.push(new Component(myGameMap.trashes[i].x, myGameMap.trashes[i].y + 40, 40, 20, "blue", "caught"));
                setTimeout(function () {
                    myGameMap.caughtTrashes.shift();
                }, 5000);
                myGameMap.trashes.splice(i, 1);
                myGameMap.trashes.push(new Component(Math.random() * (myGameMap.canvas.width - trashImg.width), Math.random()
                    * (myGameMap.canvas.width - trashImg.height), 40, 60, "blue"));
                playerScore.currentScore += 1;
            }
        }
        for (let key in myGameMap.specialItems) {
            if (myGameMap.specialItems.hasOwnProperty(key))
                if (player.catchItem(myGameMap.specialItems[key])) {
                    // When specialItem is catched:
                    superSkill(myGameMap.specialItems[key].specialItemId);
                    delete myGameMap.specialItems[key];
                }
        }
        myGameMap.clear();
        for (let i = 0; i < myGameMap.trashes.length; i++) {
            myGameMap.trashes[i].update();
        }
        for (let i = 0; i < myGameMap.caughtTrashes.length; i++) {
            myGameMap.caughtTrashes[i].update();
        }
        for (let key in myGameMap.specialItems) {
            if (myGameMap.specialItems.hasOwnProperty(key))
                myGameMap.specialItems[key].update();
        }
        playerScore.update();
        player.update();
        sessionTime.update();

    }

    function initUser(userName) {
        player = new Component(myGameMap.canvas.width / 2 - playerHorseImg[1].width / 6
            , (myGameMap.canvas.height - playerHorseImg[1].height) / 2, playerHorseImg[1].width / 3, playerHorseImg[1].height, "red", "human");
        let cols = 3;
        let currentFrame = 0;
        player.animationIntervalId = setInterval(function updateFrame() {
            currentFrame = ++currentFrame % cols;
            player.srcX = currentFrame * 64;
            player.srcY = 0;
        }, 200);
        player.name = userName;
        player.speedX = 0;
        player.speedY = 0;
        player.baseSpeed = 4;
        player.shadowBlur = 0;
        player.volumeMultiplier = 1;
        playerScore = new Component(myGameMap.canvas.width - 100, 50, 50, 50, "black", "text");
        playerScore.currentScore = 0;
        playerScore.text = "Score: " + playerScore.currentScore;
        sessionTime = new Component(myGameMap.canvas.width - 200, 50, 50, 50, "cyan", "time");
        sessionTime.currentTime = myGameMap.currentTime;


    }

    function initTrashes() {
        for (let i = 0; i < myGameMap.trashes.length; i++) {
            myGameMap.trashes[i] = new Component(Math.random() * (myGameMap.canvas.width - trashImg.width), Math.random()
                * (myGameMap.canvas.width - trashImg.height), trashImg.width, trashImg.height, "blue");
        }
    }

    function initGameMap() {
        myGameMap = {
            trashes: new Array(10),
            caughtTrashes: [],
            currentTime: 30,
            tableBody: "",
            specialItems: {},
            specialItemIndex: 0,
            activeSkillTimeOutId: -1,
            volumeSkillTimeOutId: -1,
            speedSkillTimeOutId: -1,
            canvas: document.createElement("canvas"),
            start: function () {
                this.canvas.width = 800;
                this.canvas.height = 800;
                this.context = this.canvas.getContext("2d");
                document.body.insertBefore(this.canvas, document.body.childNodes[0]);
                this.interval = setInterval(updateGameMap, 20);
                if (Object.keys(myGameMap.specialItems).length < 4) {

                    this.specialItemIntervalId = setInterval(function () {
                        myGameMap.specialItemIndex++;
                        myGameMap.specialItems[myGameMap.specialItemIndex] = new Component(
                            Math.random() * (myGameMap.canvas.width - specialItemImg[0].width),
                            Math.random() * (myGameMap.canvas.width - specialItemImg[0].height),
                            specialItemImg[0].width, specialItemImg[0].height, "blue", "specialItem", Math.floor(Math.random() * 3));
                        let myVar = myGameMap.specialItemIndex;
                        setTimeout(function () {
                            delete myGameMap.specialItems[myVar];
                        }, 5000);

                    }, 3000);
                }
                this.timeIntervalId = setInterval(function () {
                    if (sessionTime.currentTime) {
                        sessionTime.currentTime -= 1;
                    } else {
                        window.removeEventListener("keydown", moveSelection);
                        window.removeEventListener("keyup", moveSelection2);
                        gameOver.style.display = "unset";
                        leaderBoard[player.name] = playerScore.currentScore;
                        let updates = {};
                        updates["myLeaderBoard"] = leaderBoard;
                        dbRef.update(updates);
                        myGameMap.clearIntervals();
                    }
                }, 1000);
            },
            clear: function () {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            },
            remove: function () {
                document.body.removeChild(this.canvas);
                this.clearIntervals();
            },
            clearIntervals: function () {
                clearInterval(this.specialItemIntervalId);
                clearInterval(this.interval);
                clearInterval(player.animationIntervalId);
                clearInterval(this.timeIntervalId);
            }
        };
    }

    function startGame(userName) {
        if (tableBody.includes(userName) && userName !== "") {
            alert("User Name Already Exist!");
        } else {
            if (userName === "")
                userName = "Random Citizen";
            initGameMap();
            myGameMap.start();
            initUser(userName);
            initTrashes();
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                window.ondevicemotion = moveSelectionForMobile;
            } else {
                window.addEventListener("keydown", moveSelection);
                window.addEventListener("keyup", moveSelection2);
            }

            leaderBoardButton.style.display = "none";
            leaderBoardTable.style.display = "none";
            startButton.style.display = "none";
            playerNameInput.style.display = "none";
            restartButton.style.display = "unset";
        }
    }

    function superSkill(whichSuperSkill) {
        switch (whichSuperSkill) {
            case 0:
                // TODO add mirror Horse and spacebar should switch the position of Horse
                playerScore.currentScore += 3;
                break;
            case 1:
                clearTimeout(myGameMap.volumeSkillTimeOutId);
                player.volumeMultiplier = 2;
                playerScore.currentScore += 1;
                myGameMap.volumeSkillTimeOutId = setTimeout(function () {
                    player.volumeMultiplier = 1;
                }, 5000);
                break;
            case 2:
                clearTimeout(myGameMap.speedSkillTimeOutId);
                player.baseSpeed = 8;
                player.shadowBlur = 10;
                playerScore.currentScore += 1;
                myGameMap.speedSkillTimeOutId = setTimeout(function () {
                    player.baseSpeed = 4;
                    player.shadowBlur = 0;
                }, 5000);
                break;
        }
    }

    function sortAndMarkUp(leaderBoard) {
        let sortedList1 = Object.keys(leaderBoard).sort(function (a, b) {
            return leaderBoard[b] - leaderBoard[a]
        });
        tableBody = "<tr><th>User Name</th><th>Score</th></tr>";
        for (let i = 0; i < sortedList1.length; i++) {
            tableBody += "<tr><th>" + sortedList1[i] + "</th>" + "<th>" + leaderBoard[sortedList1[i]] + "</th></tr>";
        }

        return tableBody;
    }

    function moveSelection(evt) {
        switch (evt.keyCode) {
            case 65:
                player.speedX = -player.baseSpeed;
                break;
            case 68:
                player.speedX = player.baseSpeed;
                break;
            case 87:
                player.speedY = -player.baseSpeed;
                break;
            case 83:
                player.speedY = player.baseSpeed;
                break;
        }
    }

    function moveSelection2(evt) {
        switch (evt.keyCode) {
            case 65:
                if (player.speedX < 0)
                    player.speedX = 0;
                break;
            case 68:
                if (player.speedX > 0)
                    player.speedX = 0;
                break;
            case 87:
                if (player.speedY < 0)
                    player.speedY = 0;
                break;
            case 83:
                if (player.speedY > 0)
                    player.speedY = 0;
                break;
        }
    }

    function moveSelectionForMobile() {
        let x = Math.floor(event.accelerationIncludingGravity.x * 5);
        let y = Math.floor(event.accelerationIncludingGravity.y * 5);
        if (x < 0) {
            player.speedX = player.baseSpeed;
        }
        else if (x > 0) {
            player.speedX = -player.baseSpeed;
        } else if (y < 0)
            player.speedY = -player.baseSpeed;
        else if (y > 0) {
            player.speedY = player.baseSpeed;
        }

    }

})();