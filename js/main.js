var isPlayerTurn = [true, false];

var legitMoves = new Array(81);

press = (y, x) => {
    if (isPlayerTurn[currentState.currentPlayer]) {
        expand(currentState);
        for (var child of currentState.childStates) {
            if (child.ply == 9 * y + x) {
                currentState = child;
                updateHTML();
                if (!isPlayerTurn[currentState.currentPlayer]) agent = setTimeout(() => {AIMove()}, 200);
                break;
                
            }
        }
    }
}

openSetting = () => {
    document.getElementsByClassName("settingPage")[0].style.pointerEvents = "auto";
    document.getElementsByClassName("settingPage")[0].style.opacity = 1;
}

closeSetting = () => {
    document.getElementsByClassName("settingPage")[0].style.pointerEvents = "none";
    document.getElementsByClassName("settingPage")[0].style.opacity = 0;
}

reset = () => {
    clearTimeout(agent);
    clearMessage();
    trials = 0;
    totalTrials = 0;
    currentState = new gamestate();
    updateHTML();
    if (!isPlayerTurn[currentState.currentPlayer]) agent = setTimeout(() => {AIMove()}, 200);
}

binToBoard = (gamestate) => {
    var res = []
    for (var i = 0; i < 9; i++) {
        var globalX = gamestate.boardX[9];
        var globalY = gamestate.boardO[9];
        if (1 << (9 - i - 1) & globalX) {
            res.push(1);
            continue;
        }
        if (1 << (9 - i - 1) & globalY) {
            res.push(2);
            continue;
        }
        var x = gamestate.boardX[i];
        var y = gamestate.boardO[i];
        var localRes = "";
        while (x > 0 || y > 0) {
            if (x % 2 == 1) localRes = '1' + localRes;
            else if (y % 2 == 1) localRes = '2' + localRes; 
            else localRes = '0' + localRes;
            x = Math.floor(x / 2);
            y = Math.floor(y / 2);
        }
        while (localRes.length < 9) localRes = '0' + localRes;
        localRes = localRes.split('');
        res.push(Array.from(localRes, x => parseInt(x)));
    }
    return res;
}

updateHTML = () => {
    var s = binToBoard(currentState);
    var cells = document.getElementsByClassName("mainCell");
    for (var i = 0; i < 9; i++) {
        if (typeof(s[i]) == "object") {
            cells[i].getElementsByTagName("p")[0].innerHTML = "";
            cells[i].getElementsByTagName("p")[0].style.fontSize = 0;
            cells[i].getElementsByClassName("subGrid")[0].style.display = "inherit";
            if (i == currentState.lastMove || currentState.lastMove == -1) {
                cells[i].getElementsByClassName("subGrid")[0].style.background = "#f3f3f3";
                cells[i].getElementsByClassName("subGrid")[0].style.opacity = 1;
            }
            else {
                cells[i].getElementsByClassName("subGrid")[0].style.background = "#333333";
                cells[i].getElementsByClassName("subGrid")[0].style.opacity = 1 / 3;
            }
            var subCells = cells[i].getElementsByClassName("subCell");
            for (var j = 0; j < 9; j++) {
                subCells[j].innerHTML = ['', 'X', 'O'][s[i][j]];
                subCells[j].style.color = ["#f3f3f3", "#3498db", "#f1c40f"][s[i][j]];
                if (s[i][j] == 0) subCells[j].style.fontSize = "0px";
                else subCells[j].style.fontSize = "30px";
            }
        }
        else {
            cells[i].getElementsByTagName("p")[0].innerHTML = ['', 'X', 'O'][s[i]];
            cells[i].getElementsByTagName("p")[0].style.color = ["#f3f3f3", "#3498db", "#f1c40f"][s[i]];
            cells[i].getElementsByClassName("subGrid")[0].style.display = "none";
            if (s[i] == 0) cells[i].getElementsByTagName("p")[0].style.fontSize = 0;
            else cells[i].getElementsByTagName("p")[0].style.fontSize = "inherit";
        }
    }
    if (currentState.lastMove == 9) {
        setTimeout(() => {showMessage(); }, 1000);
    }
}

clearMessage = () => {
    var endMessage = document.getElementsByClassName("endMessage")[0];
    endMessage.innerHTML = "";
    endMessage.style.opacity = "0";
    endMessage.style.backdropFilter = "none";
}

showMessage = () => {
    var endMessage = document.getElementsByClassName("endMessage")[0];
    endMessage.innerHTML = ["X wins", "O wins", "Game tied"][terminalWin(currentState)];
    endMessage.style.opacity = "1";
    endMessage.style.backdropFilter = "blur(6px)";
}

setUp = function() {
    var cells = document.getElementsByClassName("mainCell");
    for (var i = 0; i < 9; i++) {
        var subCells = cells[i].getElementsByClassName("subCell");
        for (var j = 0; j < 9; j++) {
            eval("subCells[j].onclick = function () {press(" + i + ", " + j + ");};");
        }
    }
}

submit = () => {
    isPlayerTurn = [
        [true, true], 
        [false, true], 
        [true, false], 
        [false, false]
    ][document.getElementById("setAITurn").selectedIndex];
    searchTime = document.getElementById("thinkingTime").value * 1000;
    reset();
    closeSetting();
}

setUp();

reset();