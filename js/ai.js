var searchTime = 1000;
var agent;
var MCTSroot;

var threatMasks = [
    new Uint16Array([192, 36, 17]),
    new Uint16Array([320, 18]),
    new Uint16Array([384, 9, 20]),
    new Uint16Array([260, 24]),
    new Uint16Array([130, 40, 257, 68]),
    new Uint16Array([48, 65]),
    new Uint16Array([3, 288, 80]),
    new Uint16Array([5, 144]),
    new Uint16Array([72, 6, 272]),
]

var explorationParameter = Math.sqrt(2);

playoutLocalWin = (sX, sO) => {
    for (var mask of winMasks) {
        if ((sX | mask) == sX) return 0;
        if ((sO | mask) == sO) return 1;
    };
    if ((sX | sO) == 511) return 2;
    return null;
}

playoutTerminalWin = (sX, sO, fulls) => {
    for (var mask of winMasks) {
        if ((sX | mask) == sX) return 0;
        if ((sO | mask) == sO) return 1;
    };
    if ((sX | sO | fulls) == 511) return 2;
    return null;
}

playout = (s) => {
    var boardO = Uint16Array.from(s.boardO);
    var boardX = Uint16Array.from(s.boardX);
    var fullGrids = s.fullGrids;
    var currentPlayer = s.currentPlayer;
    var lastMove = s.lastMove;

    var playerBoard;

    while (lastMove < 9) {
        // Add forced move here to maximize accuracy for each playout

        playerBoard = ((currentPlayer == 0) ? boardX : boardO);
        if (lastMove == -1) {
            for (var i = 0; i < 9; i++) {
                var availableGrids = boardX[9] | boardO[9] | fullGrids;
                if (availableGrids & (1 << (9 - i - 1))) continue;
                for (var mask of threatMasks[i]) {
                    if ((playerBoard[9] | mask) == playerBoard[9]) {
                        for (var j = 0; j < 9; j++) {
                            if (playerBoard[i] & (1 << (9 - j - 1))) continue;
                            for (var subMask of threatMasks[j]) {
                                if ((playerBoard[i] | subMask) == playerBoard[i]) {
                                    return currentPlayer;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        else {
            for (var mask of threatMasks[lastMove]) {
                if ((playerBoard[9] | mask) == playerBoard[9]) {
                    for (var i = 0; i < 9; i++) {
                        if (playerBoard[lastMove] & (1 << (9 - i - 1))) continue;
                        for (var subMask of threatMasks[i]) {
                            if ((playerBoard[lastMove] | subMask) == playerBoard[lastMove]) {
                                return currentPlayer;
                            }
                        }
                    }
                    break;
                }
            }
        }

        var grid;
        if (lastMove == -1) {
            grid = Math.floor(Math.random() * 9);
            var availableGrids = boardX[9] | boardO[9] | fullGrids;
            while (availableGrids & (1 << (9 - grid - 1))) grid = (grid + 1) % 9;
        }
        else {
            grid = lastMove;
        }
        var move = Math.floor(Math.random() * 9);
        var availableSpaces = boardX[grid] | boardO[grid];
        while (availableSpaces & (1 << (9 - move - 1))) move = (move + 1) % 9;
        if (currentPlayer == 0) {
            boardX[grid] = boardX[grid] | (1 << (9 - move - 1));
            currentPlayer = 1;
        }
        else {
            boardO[grid] = boardO[grid] | (1 << (9 - move - 1));
            currentPlayer = 0;
        }
        var win = playoutLocalWin(boardX[grid], boardO[grid]);
        if (win != null) {
            switch (win) {
                case 0:
                    boardX[9] = boardX[9] | (1 << (9 - grid - 1));
                    break;
                case 1:
                    boardO[9] = boardO[9] | (1 << (9 - grid - 1));
                    break;
                case 2:
                    fullGrids = fullGrids | (1 << (9 - grid - 1));
            }
        }
        var globalWin = playoutTerminalWin(boardX[9], boardO[9], fullGrids);
        if (globalWin != null) return globalWin;
        if ((boardX[9] | boardO[9] | fullGrids) & (1 << (9 - move - 1))) lastMove = -1;
        else lastMove = move;
    }
    var globalWin = playoutTerminalWin(boardX[9], boardO[9], fullGrids);
    if (globalWin != null) return globalWin;
    console.log("WTF why are you here");
}

performanceTest = () => {
    var trials = 0;
    var end = Date.now() + 1000;
    while (Date.now() < end) {
        playout(currentState);
        trials++;
    }
    console.log(trials + " trials per second");
}

uct = (s) => {
    //console.log("2# state reached");
    var c = explorationParameter
    var n = s.simulationDone;
    var w = s.wins;
    var t;
    if (s.parentState != null) {
        t = s.parentState.simulationDone;
    }
    else t = 0;
    return (w / n) + c * Math.sqrt(Math.log(t) / n);
}

backpropagation = (s, winner) => {
    //console.log("4# state reached");
    while (s != MCTSroot && s != null) {
        s.simulationDone++;
        if (rollout < 2) {
            if (s.currentPlayer != winner) {
                s.wins++;
            }
        }
        // else {
        //     s.wins += 0.5;
        // }
        s = s.parentState;
    }
}

search = (searchState) => {
    var s = searchState;
    while (s.expanded && s.lastMove < 9) {
        var bestUCT = -Infinity, bestChild = s;
        for (var child of s.childStates) {
            if (child.simulationDone == 0) {
                bestChild = child;
                break;
            }
            if (uct(child) > bestUCT) {
                bestUCT = uct(child);
                bestChild = child;
            }
        }
        s = bestChild;
    }
    if (s.simulationDone != 0 && s.lastMove < 9) {
        expand(s);
        s = s.childStates[0];
    }
    rollout = playout(s);
    backpropagation(s, rollout);
}

AIMove = () => {
    if (currentState.lastMove == 9) return;
    MCTSroot = currentState.parentState;
    var end = Date.now() + searchTime;
    var bestChild, bestScore = -Infinity;
    while (Date.now() < end) {
        search(currentState);
    }
    for (var child of currentState.childStates) {
        var score = child.simulationDone;
        if (score > bestScore) {
            bestScore = score;
            bestChild = child;
        }
    }
    currentState = bestChild;
    console.log("win chance: " + currentState.wins / bestScore * 100 + "%");
    updateHTML();
    if (!isPlayerTurn[currentState.currentPlayer]) agent = setTimeout(() => {AIMove()}, 200);
}