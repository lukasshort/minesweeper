const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mx;
let my;
let bx;
let by;
let lmbdown = false;
let rmbdown = false;

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    bx = Math.floor((mx-30)/48);
    by = Math.floor((my-156)/48);
});

document.addEventListener("mousedown", (e) => {
    if(e.button == 0) {lmbdown = true}
    if(e.button == 2) {rmbdown = true}
    const t = by*board_width + bx;
    
    if(e.button == 2) {
        if(layer[t] == 3) {layer[t] = 1}
        else {layer[t] = 3}
    } 
})
document.addEventListener("mouseup", (e) => {
    if(e.button == 0) {lmbdown = false}
    if(e.button == 2) {rmbdown = false}
})
document.addEventListener("click", (e) => {
    
})

const sheet = new Image();
sheet.src = "spritesheet.png";

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
    dNeg: {x:120,y:0,w:13,h:23},
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
    s1: {x:0,y:55,w:26,h:26},
    s2: {x:26,y:55,w:26,h:26},
    s3: {x:52,y:55,w:26,h:26},
    s4: {x:78,y:55,w:26,h:26},
    s5: {x:104,y:55,w:26,h:26},
}
let global_scale = 50/16;

let presets = [
    [3,  3,  2 ],
    [9,	 9,  10],
	[16, 16, 40],
	[30, 16, 99]
];
let level = 3;
let board_width = presets[level][0];
let board_height = presets[level][1];
let board_mines = presets[level][2];
let gamestate = "idle";

let flags = board_mines;
let time = 123;
let face_state = 1;
canvas.width = (board_width) * 48 + 60;
canvas.height = (board_height) * 48 + 186;

const tile_width = 48;

let board = new Uint8Array(board_width * board_height);
board.fill(0);
let layer = new Uint8Array(board_width * board_height);
layer.fill(1);

//window.requestAnimationFrame(placeMines);
window.requestAnimationFrame(step);
function step() {
    draw();
    window.requestAnimationFrame(step);
}

function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    const t = by*board_width + bx;
    if(layer[t] == 1 && lmbdown) {
        layer[t] = 2; 
        if(gamestate == "idle") {
            gamestate = "game";
            placeMines();
            collapseEmpty(by*board_width+bx);
        }
        if(board[t] == 0) {collapseEmpty(t)}
    } //reveal
    if(layer[t] == 2 && !lmbdown) {layer[t] = 0;} //cancel reveal
    //if(layer[t] == 1 && rmbdown) {layer[t] = 3;} //flag

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
    //Scores

    let strFlags = flags.toString();

    if(flags < 100) {strFlags = `0${strFlags}`}
    for(let i = 0; i < 3; i ++) {
        hqueue.push({data:sprites[`d${strFlags[i]}`],x:hx+48+(i*39),y:hy+45,w:39,h:69});
    }
    let strTime = time.toString();
    for(let i = 2; i >= 0; i --) {
        hqueue.push({data:sprites[`d${strTime[i]}`],x:hx+30-135+(board_width*48)+(i*39),y:hy+45,w:39,h:69});
    }
    hqueue.push({data:sprites[`s${face_state}`],x:hx+30+(board_width/2*48)-39,y:hy+40,w:78,h:78});
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

function placeMines() {
    console.log("place")
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
    for(let i = 0; i < board_mines; i ++) {
        let found = false;
        let r;
        while(!found) {
            r = Math.floor(Math.random()*board_width*board_height);
            if(board[r] < 9) {found = true}
            for(let s of safe_tiles) {
                if(r == s) {found = false}
            }
            //console.log(r, s, found)
        }
        board[r] = 9;
        incrNeighbors(r);
        placed ++;
    }
    console.log(placed);
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