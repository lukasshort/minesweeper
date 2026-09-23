const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Spritesheet
const sheet = new Image();
sheet.src = "spritesheet.png";

let mx = false; // Mouse x
let my = false; // Mouse y
let bx = false; // Board x
let by = false; // Board y
let hvr = false; // hover position (0 - board_width * board_height)

let lmbdown = false; // Left mouse button down
let rmbdown = false; // Right mouse button down
let mouseOverBoard  = false;
let mouseOverFace   = false;
let canTouchBoard   = true;

const tile_width = 48;

// All the difficulty presets
let presets = [
    [9,	 9,  10], // Beginner
	[16, 16, 40], // Intermediate
	[30, 16, 99], // Expert
    [3,  3,  2 ] // Custom
];

let level = 0;
let gamestate;

let board_width;
let board_height;

let mines;
let flags;
let time;
let starttime = 0;
let endtime = 0;

let face_state;

let board;
let layer;

setGamestate("init");

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    bx = Math.floor((mx-30)/48);
    by = Math.floor((my-156)/48);

    if(bx >= 0 && bx < board_width && by >= 0 && by < board_height) {mouseOverBoard = true}
    else {mouseOverBoard = false}

    if(mx > 207 && mx < 282 && my > 41 && my < 116) {mouseOverFace = true}
    else {mouseOverFace = false}

    document.getElementById("mousepos").innerHTML = `x: ${mx.toFixed(0)}, y: ${my.toFixed(0)}`;
    hvr = by*board_width+bx;
});

document.addEventListener("mousedown", (e) => {
    switch(e.button) {
        case 0:
            lmbdown = true;
            break;
        case 2:
            rmbdown = true;
            if(mouseOverBoard && canTouchBoard) {
                switch(layer[hvr]) {
                    case 1:
                        layer[hvr] = 3;
                        flags --;
                        break;
                    case 3:
                        layer[hvr] = 1;
                        flags ++;
                        break;
                }
            }
        break;
    }
});

document.addEventListener("mouseup", (e) => {
    switch(e.button) {
        case 0:
            lmbdown = false;
            if(mouseOverBoard && canTouchBoard) {
                switch(layer[hvr]) {
                    case 2: 
                        if(gamestate == "init") {
                            //Initialize game
                            setGamestate("game");
                        }
                        reveal(hvr);
                        break;
                }
            }
            if(mouseOverFace) {
                setGamestate("init");
            }
            break;
        case 2:
            rmbdown = false;
            break;
    }
});

// Locations and sizes for every sprite in the spritesheet
let sprites = {
    d0: {x:0,y:0,w:13,h:23},
    d1: {x:13,y:0,w:13,h:23},
    d2: {x:26,y:0,w:13,h:23},
    d3: {x:39,y:0,w:13,h:23},
    d4: {x:52,y:0,w:13,h:23},
    d5: {x:65,y:0,w:13,h:23},
    d6: {x:78,y:0,w:13,h:23},
    d7: {x:91,y:0,w:13,h:23},
    d8: {x:104,y:0,w:13,h:23},
    d9: {x:117,y:0,w:13,h:23},
    dNeg: {x:130,y:0,w:13,h:23},
    t0: {x:0,y:23,w:16,h:16},
    t1: {x:16,y:23,w:16,h:16},
    t2: {x:32,y:23,w:16,h:16},
    t3: {x:48,y:23,w:16,h:16},
    t4: {x:64,y:23,w:16,h:16},
    t5: {x:80,y:23,w:16,h:16},
    t6: {x:96,y:23,w:16,h:16},
    t7: {x:102,y:23,w:16,h:16},
    t8: {x:118,y:23,w:16,h:16},
    tOff: {x:0,y:39,w:16,h:16},
    tFlag: {x:16,y:39,w:16,h:16},
    tBomb1: {x:32,y:39,w:16,h:16},
    tBomb2: {x:48,y:39,w:16,h:16},
    tBomb3: {x:64,y:39,w:16,h:16},
    eTL: {x:0,y:81,w:10,h:10},
    eTR: {x:10,y:81,w:10,h:10},
    eBL: {x:20,y:81,w:10,h:10},
    eBR: {x:30,y:81,w:10,h:10},
    eW: {x:40,y:81,w:16,h:10},
    eLW: {x:136,y:39,w:10,h:32},
    eXL: {x:56,y:81,w:10,h:10},
    eXR: {x:66,y:81,w:10,h:10},
    f1: {x:0,y:55,w:26,h:26},
    f2: {x:26,y:55,w:26,h:26},
    f3: {x:52,y:55,w:26,h:26},
    f4: {x:78,y:55,w:26,h:26},
    f5: {x:104,y:55,w:26,h:26},
}

window.requestAnimationFrame(step);
function step() {
    draw();
    window.requestAnimationFrame(step);
}

function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    if(layer[hvr] == 1 && lmbdown && mouseOverBoard && canTouchBoard) {
        layer[hvr] = 2;
    } //reveal
    if(layer[hvr] == 2 && !lmbdown) {layer[hvr] = 0;} //cancel reveal

    

    //Draw header
    const hx = 0;
    const hy = 0;
    ctx.fillStyle = "rgb(189, 189, 189)";
    ctx.fillRect(hx+30, hy+30, board_width*48, 96);
    let hqueue = [];
    hqueue.push({data:sprites["eTL"],x:hx,y:hy,w:30,h:30});
    hqueue.push({data:sprites["eTR"],x:hx+30+(board_width*48),y:hy,w:30,h:30});
    hqueue.push({data:sprites["eLW"],x:hx+6,y:hy+30,w:30,h:96});
    hqueue.push({data:sprites["eLW"],x:hx+36+(board_width*48),y:hy+30,w:30,h:96});
    for(let w = 0; w < board_width; w ++) {
        hqueue.push({data:sprites["eW"],x:hx+30+(w*48),y:hy,w:48,h:30});
    }

    // Face State
    if(gamestate == "lose") {face_state = 4}
    if(gamestate == "win") {face_state = 5}
    if(lmbdown && mouseOverFace) {face_state = 2;}
    if(lmbdown && mouseOverBoard && canTouchBoard) {face_state = 3}
    else if(face_state == 3 && canTouchBoard) {face_state = 1}
    //Display Face
    hqueue.push({data:sprites[`f${face_state}`],x:hx+30+(board_width/2*48)-39,y:hy+40,w:78,h:78});
    
    //Display Flags left
    let strFlags = Math.abs(flags).toString();

    if(Math.abs(flags) < 100) {strFlags = `0${strFlags}`}
    if(Math.abs(flags) < 10) {strFlags = `0${strFlags}`}
    if(flags < 0) {strFlags = `-${strFlags[1]}${strFlags[2]}`}
    for(let i = 0; i < 3; i ++) {
        let newSprite = {data:sprites[`d${strFlags[i]}`],x:hx+48+(i*39),y:hy+45,w:39,h:69}
        if(strFlags[i] == "-") {newSprite.data = sprites['dNeg']}
        hqueue.push(newSprite);
    }

    //Display Time left
    if(gamestate == "game") {endtime = Date.now()}
    time = Math.floor((endtime - starttime) / 1000);
    let strTime = time.toString();
    if(time < 100) {strTime = `0${strTime}`}
    if(time < 10) {strTime = `0${strTime}`}
    for(let i = 2; i >= 0; i --) {
        let newSprite = {data:sprites[`d${strTime[i]}`],x:hx+30-135+(board_width*48)+(i*39),y:hy+45,w:39,h:69};
        hqueue.push(newSprite);
    }

    

    //Draw all sprites in header queue
    for(let a of hqueue) {
        ctx.drawImage(sheet, a.data.x, a.data.y, a.data.w, a.data.h, hx+a.x, hy+a.y, a.w, a.h);
    }

    //Draw tiles
    for(let i = 0; i < board_width*board_height; i++) {
        let d = board[i];
        const x = 30+(i % board_width)*tile_width;
        const y = 156+(Math.floor(i/board_width))*tile_width;
        let sheet_index = `t${d}`;
        if(d > 8) {sheet_index = "tBomb3"}
        if(layer[i] == 1) {sheet_index = "tOff"}
        if(layer[i] == 2) {sheet_index = "t0"; if(i != by*board_width+bx) {layer[i] = 1}}
        if(layer[i] == 3) {sheet_index = "tFlag"}
        if(layer[i] == 4) {sheet_index = "tBomb1"}
        if(layer[i] == 5) {sheet_index = "tBomb2"}

        let data = sprites[sheet_index];
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sheet, data.x, data.y, data.w, data.h, x, y, data.w*3, data.h*3);
        let queue = [];
        if(i%board_width==0) {queue.push({data:sprites["eW"],x:x-30,y:y+48,w:48,h:30,r:-Math.PI/2});}
        if((i+1)%board_width==0) {queue.push({data:sprites["eW"],x:x+48,y:y+48,w:48,h:30,r:-Math.PI/2});}
        if(i<board_width) {queue.push({data:sprites["eW"],x:x,y:y-30,w:48,h:30,r:0})}
        if(i>=board_width*(board_height-1)) {queue.push({data:sprites["eW"],x:x,y:y+48,w:48,h:30,r:0})}
        if(i<board_width && (i+1)%board_width==0){queue.push({data:sprites["eXR"],x:x+48,y:y-30,w:30,h:30,r:0})}
        if(i>board_width*(board_height-1) && (i+1)%board_width==0){queue.push({data:sprites["eBR"],x:x+48,y:y+48,w:30,h:30,r:0})}
        if(i>=board_width*(board_height-1) && i%board_width==0){queue.push({data:sprites["eBL"],x:x-30,y:y+48,w:30,h:30,r:0})}
        if(i%board_width==0 && i<board_width){queue.push({data:sprites["eXL"],x:x-30,y:y-30,w:30,h:30,r:0})}
        for(let a of queue) {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.r);
            ctx.drawImage(sheet, a.data.x, a.data.y, a.data.w, a.data.h, 0, 0, a.w, a.h);
            ctx.restore();
        }
    }
}

function setGamestate(state) {
    gamestate = state;
    switch(gamestate) {
        case "init":
            canTouchBoard = true;

            board_width = presets[level][0];
            board_height = presets[level][1];
            canvas.width = (board_width) * 48 + 60;
            canvas.height = (board_height) * 48 + 186;

            mines = presets[level][2];
            flags = mines;
            time = 0;
            starttime = endtime;

            face_state = 1;

            board = new Uint8Array(board_width * board_height);
            board.fill(0);
            layer = new Uint8Array(board_width * board_height);
            layer.fill(1);
            break;
        case "game":
            placeMines();
            starttime = Date.now();
            break;
        case "lose":
            canTouchBoard = false;
            for(let i = 0; i < board_width * board_height; i ++) {
                if(board[i] > 8 && layer[i] != 3) {layer[i] = 0}
                if(board[i] <= 8 && layer[i] == 3) {layer[i] = 5}
            }
            layer[hvr] = 4;
            break;
        case "win":
            canTouchBoard = false;
            flags = 0;
            for(let i = 0; i < board_width * board_height; i++) {
                if(board[i] > 8) {layer[i] = 3}
            }
            break;
    }
}

function placeMines() {
    const t = by*board_width + bx;
    board[t] = 0;
    let safe_tiles = [
        t,
        t-board_width,
        t-board_width+1,
        t+1,
        t+1+board_width,
        t+board_width,
        t-1+board_width,
        t-1,
        t-1-board_width
    ];
    let placed = 0;
    for(let i = 0; i < mines; i ++) {
        let found = false;
        let r;
        while(!found) {
            r = Math.floor(Math.random()*board_width*board_height);
            if(board[r] < 9) {found = true}
            for(let s of safe_tiles) {
                if(r == s) {found = false}
            }
        }
        board[r] = 9;
        incrNeighbors(r);
        placed ++;
    }
}

function incrNeighbors(p) {
    //starting top middle, moving clockwise
    let dirs = getNeighbors(p);
        
    for(let i = 0; i < dirs.length; i++) {
        let n = dirs[i];
        board[n] ++;
    }
}

function getNeighbors(p) {
    let dirs = [];
        if(p>=board_width)                                              {dirs.push(p-board_width)}
        if(p>=board_width && (p+1)%board_width!=0)                      {dirs.push(p+1-board_width)}
        if((p+1)%board_width!=0)                                        {dirs.push(p+1)}
        if(p<=board_width*(board_height-1) && (p+1)%board_width!=0)     {dirs.push(p+board_width+1)}
        if(p<=board_width*(board_height-1))                             {dirs.push(p+board_width)}
        if(p<=board_width*(board_height-1) && p%board_width!=0)         {dirs.push(p+board_width-1)}
        if(p%board_width!=0)                                            {dirs.push(p-1)}
        if(p%board_width!=0 && p>=board_width)                          {dirs.push(p-1-board_width)}
    return dirs;
}

function collapseEmpty(p) {
    let open = [p];
    let closed = new Set;
    closed.add(p);
    while(open.length > 0) {
        
        let current = open.pop();
        const dirs = getNeighbors(current);
        for(let i = 0; i < dirs.length; i ++) {
            layer[dirs[i]] = 0;
            if(board[dirs[i]] == 0 && !closed.has(dirs[i])) {
                open.push(dirs[i]);
            }
        }
        closed.add(current);
    }
}

function reveal(p) {
    layer[p] = 0;
    if(board[p] == 0) {collapseEmpty(p);}
    if(board[p] > 8) {setGamestate("lose");}
    checkWin();
}

function checkWin() {
    let win = true;
    for(let i = 0; i < board_width * board_height; i++) {
        if(layer[i] == 1 && board[i] < 9) {win = false; break;}
    }
    if(win) {
        setGamestate("win");
    }
}