import * as dg from "./diagramatics-ext-1.3.1-1-dev.js"

const svgelem = document.getElementById("svg")
const stopButton = document.getElementById("stop")
// const imgelem = document.getElementById("img")
// const imgsvgelem = document.getElementById("imgsvg")
const draw = (...diagrams) => {
    dg.draw_to_svg_element(svgelem, dg.diagram_combine(...diagrams))
}
const draw_sprite = (...diagrams) => {
    dg.draw_to_svg_element(svgelem, dg.diagram_combine(...diagrams), {
        clear_svg: false,
        set_html_attribute: false,
    })
}

let spritesData = {};

async function generateSprites(name, nrows, ncols, imgsrc){
    let sprites = [];
    let rawimg = new Image();
    rawimg.src = imgsrc;
    rawimg.onload = function(){
        let spriteWidth = rawimg.width / ncols;
        let spriteHeight = rawimg.height / nrows;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = spriteWidth;
        canvas.height = spriteHeight;
        
        for (let y = 0; y < nrows; y++) {
            for (let x = 0; x < ncols; x++) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(rawimg, x * spriteWidth, y * spriteHeight, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);
                sprites.push(canvas.toDataURL()); // Add each sprite as a data URL
            }
        }
        
        spritesData[name] = sprites;
    }
}

draw(dg.square());
generateSprites("face", 5, 5, "face.jpg");
generateSprites("scott", 2, 8, "scottpilgrim_multiple.png");
const playerData = {
    x: 0,
    y: 3,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: -100,
}
const bgData = {
    x : 0,
    y : 1.4,
}
const V2 = dg.V2;

const GROUND_Y = 0;
const PLAYER_DY = -0.5;

function updatePlayer(dt){
    // kinematics
    playerData.vx += playerData.ax * dt;
    playerData.vy += playerData.ay * dt;
    playerData.x += playerData.vx * dt;
    playerData.y += playerData.vy * dt;
    
    if (playerData.y - PLAYER_DY < 0){
        playerData.vy = 0;
        playerData.y = PLAYER_DY;
    }
    
}
function updateBg(dt, s){
    bgData.x -= 15 * dt;
    bgData.x = bgData.x % (44*s);
}

function jump(){
    playerData.vy = 30;
}
svgelem.onclick = (e) => {
    e.preventDefault();
    jump();
};

let i = 0;
let lastTimestamp = 0;
let stop = false;
stopButton.onclick = () => { stop = true; }
function loop(timestamp){
    if (stop) return;
    const dt = (timestamp - lastTimestamp) / 1000;
    i++;
    
    let id = (Math.round(i/4)) % 8
    const s = 2;
    updatePlayer(dt)
    updateBg(dt, s)
    
    let sq = dg.square(10).translate(V2(0,5));
    let scott = dg.image(spritesData["scott"]?.[id], 2, 3).mut()
        .move_origin('bottom-center')
        .position(V2(playerData.x, playerData.y))
    draw(sq)
    
    let bgLeft = dg.image("./city_presskit.png", 44*s, 12*s).mut()
        .position(V2(bgData.x, bgData.y));
    let bgRight = dg.image("./city_presskit.png", 44*s, 12*s).mut()
        .position(V2(bgData.x + 44*s, bgData.y));
    draw_sprite(bgLeft, bgRight, scott)
        
    
    lastTimestamp = timestamp;
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop)

// let bg = dg.image("./city_presskit.png", 44, 12);
// draw(bg)
