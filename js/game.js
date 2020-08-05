var winMasks = new Uint16Array([292, 146, 73, 448, 56, 7, 273, 84]);

function gamestate() {
    this.boardX = new Uint16Array(10);
    this.boardO = new Uint16Array(10);
    this.fullGrids = 0;

    this.currentPlayer = 0;
    this.lastMove = -1;
    this.ply = -1;
    this.parentState = null;

    this.expanded = false;
    this.childStates = [];

    this.wins = 0;
    this.simulationDone = 0;
}

localWin = (s, n) => {
    for (var mask of winMasks) {
        if ((s.boardX[n] | mask) == s.boardX[n]) return 0;
        if ((s.boardO[n] | mask) == s.boardO[n]) return 1;
    };
    if ((s.boardX[n] | s.boardO[n]) == 511) return 2;
    return null;
}

terminalWin = (s) => {
    for (var mask of winMasks) {
        if ((s.boardX[9] | mask) == s.boardX[9]) return 0;
        if ((s.boardO[9] | mask) == s.boardO[9]) return 1;
    }
    if ((s.boardX[9] | s.boardO[9] | s.fullGrids) == 511) return 2;
    return null;
}

expand = (s) => {
    if (s.expanded) return;
    s.expanded = true;
    s.childStates = [];
    if (s.lastMove == -1) {
        for (var i = 0; i < 9; i++) {
            if (s.boardX[i] == 511 | s.boardO[i] == 511) continue;
            var newMask = (1 << (9 - i - 1));
            if (s.boardX[9] & newMask) continue;
            if (s.boardO[9] & newMask) continue;
            if (s.fullGrids & newMask) continue;
            for (var j = 0; j < 9; j ++) {
                var moveMask = (1 << (9 - j - 1));
                if (s.boardX[i] & moveMask) continue;
                if (s.boardO[i] & moveMask) continue;
                var child = new gamestate();
                child.parentState = s;
                child.boardX = Array.from(s.boardX);
                child.boardO = Array.from(s.boardO);
                child.fullGrids = s.fullGrids;
                if (s.currentPlayer == 0) {
                    child.boardX[i] = s.boardX[i] | moveMask;
                    child.currentPlayer = 1;
                }
                else {
                    child.boardO[i] = s.boardO[i] | moveMask;
                    child.currentPlayer = 0;
                }
                var win = localWin(child, i);
                if (win != null) {
                    switch (win) {
                        case 0:
                            child.boardX[9] = child.boardX[9] | newMask;
                            break;
                        case 1:
                            child.boardO[9] = child.boardO[9] | newMask;
                            break;
                        case 2:
                            child.fullGrids = child.fullGrids | newMask;
                            break;
                    }
                }
                var globalWin = terminalWin(child);
                if (globalWin != null) {
                    child.lastMove = 9;
                }
                else if ((child.boardX[9] | child.boardO[9] | child.fullGrids) & moveMask) child.lastMove = -1; // add more to this later
                else child.lastMove = j;
                child.ply = 9 * i + j;
                s.childStates.push(child);
            }
        }
    }
    else {
        if (s.lastMove == 9) return;
        var i = s.lastMove;
        var newMask = (1 << (9 - i - 1));
        for (var j = 0; j < 9; j ++) {
            var moveMask = (1 << (9 - j - 1));
            if (s.boardX[i] & moveMask) continue;
            if (s.boardO[i] & moveMask) continue;
            var child = new gamestate();
            child.parentState = s;
            child.boardX = Array.from(s.boardX);
            child.boardO = Array.from(s.boardO);
            child.fullGrids = s.fullGrids;
            if (s.currentPlayer == 0) {
                child.boardX[i] = s.boardX[i] | moveMask;
                child.currentPlayer = 1;
            }
            else {
                child.boardO[i] = s.boardO[i] | moveMask;
                child.currentPlayer = 0;
            }
            var win = localWin(child, i);
            if (win != null) {
                switch (win) {
                    case 0:
                        child.boardX[9] = child.boardX[9] | newMask;
                        break;
                    case 1:
                        child.boardO[9] = child.boardO[9] | newMask;
                        break;
                    case 2:
                        child.fullGrids = child.fullGrids | newMask;
                        break;
                }
            }
            var globalWin = terminalWin(child);
            if (globalWin != null) {
                child.lastMove = 9;
            }
            else if ((child.boardX[9] | child.boardO[9] | child.fullGrids) & moveMask) child.lastMove = -1; // add more to this later
            else child.lastMove = j;
            child.ply = 9 * i + j;
            s.childStates.push(child);
        }
    }
}