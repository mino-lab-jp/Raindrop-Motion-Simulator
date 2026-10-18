
let diameterSlider, diameterLabel;
let startButton, stopButton, resetButton;

let running = false;
let elapsed = 0;
let velocity = 0;
let distance = 0;

let graphData = [];
let intervalData = [];

let nextInterval = 0.5;
let previousDistance = 0;

let diameterMM = 3;
let dropMass, dropArea, terminalVelocity;

const gravity = 9.8;
const airDensity = 1.2;
const waterDensity = 1000;
const dragCoefficient = 0.47;

const timeStep = 1 / 120;
const graphDuration = 8;
const pixelsPerMeter = 28;

const panelX = 20;
const panelY = 85;
const panelW = 345;
const panelH = 505;

function setup() {
  createCanvas(950, 700);
  textFont('sans-serif');

  let controls = createDiv();
  controls.style('margin', '8px 0');
  controls.style('display', 'flex');
  controls.style('align-items', 'center');
  controls.style('gap', '12px');
  controls.style('flex-wrap', 'wrap');

  createSpan('雨粒の直径：').parent(controls);

  diameterSlider = createSlider(1, 6, 3, 0.5);
  diameterSlider.parent(controls);
  diameterSlider.style('width', '200px');

  diameterLabel = createSpan('3.0 mm');
  diameterLabel.parent(controls);
  diameterLabel.style('font-weight', 'bold');
  diameterLabel.style('min-width', '65px');

  diameterSlider.input(() => {
    diameterLabel.html(
      Number(diameterSlider.value()).toFixed(1) + ' mm'
    );
    resetSimulation();
  });

  startButton = createButton('▶ スタート');
  startButton.parent(controls);
  startButton.mousePressed(() => {
    if (elapsed >= graphDuration) resetSimulation();
    running = true;
  });

  stopButton = createButton('■ ストップ');
  stopButton.parent(controls);
  stopButton.mousePressed(() => {
    running = false;
  });

  resetButton = createButton('↺ リセット');
  resetButton.parent(controls);
  resetButton.mousePressed(resetSimulation);

  resetSimulation();
}

function resetSimulation() {
  diameterMM = Number(diameterSlider.value());

  let d = diameterMM / 1000;

  dropArea = PI * d * d / 4;
  dropMass = waterDensity * PI * pow(d, 3) / 6;

  terminalVelocity = sqrt(
    2 * dropMass * gravity /
    (airDensity * dragCoefficient * dropArea)
  );

  elapsed = 0;
  velocity = 0;
  distance = 0;

  graphData = [{ t: 0, v: 0 }];
  intervalData = [];
  nextInterval = 0.5;
  previousDistance = 0;

  running = false;
}

function draw() {
  background(250);

  if (running && elapsed < graphDuration) {
    for (let i = 0; i < 2; i++) {
      let h = min(timeStep, graphDuration - elapsed);
      if (h <= 0) break;

      let drag = 0.5 * airDensity *
                 dragCoefficient * dropArea *
                 velocity * velocity;

      let a = gravity - drag / dropMass;

      // 台形積分で距離を更新
      let oldVelocity = velocity;
      velocity += a * h;
      distance += (oldVelocity + velocity) * h / 2;
      elapsed += h;

      if (elapsed + 1e-8 >= nextInterval) {
        intervalData.push({
          t: nextInterval,
          moved: distance - previousDistance
        });
        previousDistance = distance;
        nextInterval += 0.5;
      }
    }

    graphData.push({ t: elapsed, v: velocity });

    if (elapsed >= graphDuration - 1e-8) {
      running = false;
    }
  }

  drawTitle();
  drawBackground();
  drawRaindrop();
  drawForces();
  drawInformation();
  drawGraph();
  drawIntervalTable();
  drawDiameterScale();
}

function drawTitle() {
  noStroke();
  fill(25);
  textSize(24);
  textStyle(BOLD);
  text('雨粒の落下と終端速度', 25, 36);
  textStyle(NORMAL);
  textSize(15);
  text('重力と空気抵抗が釣り合うと等速直線運動に近づく', 25, 64);
}

function cameraPosition() {
  let trackingStart = (325 - 150) / pixelsPerMeter;
  return max(0, distance - trackingStart);
}

function getDropY() {
  return 150 + (distance - cameraPosition()) * pixelsPerMeter;
}

function drawBackground() {
  push();

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(panelX, panelY, panelW, panelH);
  drawingContext.clip();

  noStroke();
  fill(234, 244, 253);
  rect(panelX, panelY, panelW, panelH);

  let cameraY = cameraPosition();

  let firstMeter = max(0, floor(cameraY) - 3);
  let lastMeter = ceil(cameraY + panelH / pixelsPerMeter + 3);

  for (let meter = firstMeter; meter <= lastMeter; meter++) {
    let sy = 150 + (meter - cameraY) * pixelsPerMeter;

    stroke(175, 200, 220);
    strokeWeight(1);
    line(30, sy, 355, sy);

    noStroke();
    fill(95, 125, 150);
    textSize(11);
    text(meter + ' m', 35, sy - 4);
  }

  noStroke();
  fill(205, 220, 233);
  rect(270, panelY, 72, panelH);

  for (let meter = firstMeter; meter <= lastMeter; meter++) {
    let wy = 150 + (meter - cameraY) * pixelsPerMeter;

    fill(245, 250, 255);
    stroke(175, 195, 210);
    strokeWeight(1);
    rect(282, wy, 18, 17, 2);
    rect(312, wy, 18, 17, 2);
  }

  drawingContext.restore();
  pop();

  noFill();
  stroke(205, 215, 225);
  rect(panelX, panelY, panelW, panelH, 10);
}

function drawRaindrop() {
  let x = 180;
  let yy = getDropY();

  push();
  translate(x, yy);

  let s = 14 + diameterMM * 2.5;

  fill(70, 180, 245);
  stroke(20, 100, 175);
  strokeWeight(2);

  ellipse(0, s * 0.12, s * 1.2, s * 1.3);
  triangle(
    -s * 0.45, -s * 0.12,
     s * 0.45, -s * 0.12,
     0, -s
  );

  noStroke();
  fill(255, 255, 255, 160);
  ellipse(-s * 0.2, s * 0.1, s * 0.17, s * 0.35);

  pop();
}

function drawForces() {
  let x = 180;
  let yy = getDropY();

  let weight = dropMass * gravity;
  let drag = 0.5 * airDensity *
             dragCoefficient * dropArea *
             velocity * velocity;

  let ratio = drag / weight;
  let forceLength = 70;

  drawArrow(x - 60, yy,
            x - 60, yy + forceLength,
            color(225, 65, 65));

  if (ratio > 0.001) {
    drawArrow(x + 60, yy,
              x + 60, yy - forceLength * ratio,
              color(35, 125, 225));
  }

  noStroke();
  textSize(13);
  fill(205, 55, 55);
  text('重力', x - 95, yy + forceLength + 16);

  fill(30, 110, 210);
  text('空気抵抗', x + 72,
       yy - forceLength * ratio - 8);

  if (ratio >= 0.98) {
    fill(15, 145, 80);
    textStyle(BOLD);
    textSize(16);
    text('ほぼ等速直線運動', 95, 565);
    textStyle(NORMAL);
  } else {
    fill(175, 105, 25);
    textSize(16);
    text('加速中', 145, 565);
  }
}

function drawArrow(x1, y1, x2, y2, c) {
  stroke(c);
  fill(c);
  strokeWeight(5);
  line(x1, y1, x2, y2);

  let angle = atan2(y2 - y1, x2 - x1);
  push();
  translate(x2, y2);
  rotate(angle);
  triangle(0, 0, -13, -7, -13, 7);
  pop();
  strokeWeight(1);
}

function drawInformation() {
  let weight = dropMass * gravity;
  let drag = 0.5 * airDensity *
             dragCoefficient * dropArea *
             velocity * velocity;
  let a = gravity - drag / dropMass;

  noStroke();
  fill(30);
  textSize(15);

  text('時間：' + elapsed.toFixed(2) + ' s', 400, 112);
  text('速度：' + velocity.toFixed(2) + ' m/s', 400, 140);
  text('終端速度：' + terminalVelocity.toFixed(2) + ' m/s', 400, 168);
  text('加速度：' + a.toFixed(2) + ' m/s²', 400, 196);
  text('落下距離：' + distance.toFixed(2) + ' m', 400, 224);
  text('空気抵抗 / 重力：' +
       (drag / weight * 100).toFixed(1) + ' %', 400, 252);

  if (running) {
    fill(20, 140, 75);
    text('● 運動中', 770, 112);
  } else {
    fill(150, 90, 30);
    text('■ 停止中', 770, 112);
  }
}

function drawGraph() {
  let gx = 440, gy = 345;
  let gw = 445, gh = 185;
  let vmax = terminalVelocity * 1.2;

  fill(255);
  stroke(215);
  strokeWeight(1);
  rect(gx - 43, gy - 35, gw + 65, gh + 78, 8);

  stroke(230);
  for (let i = 0; i <= 8; i++) {
    let px = gx + gw * i / 8;
    line(px, gy, px, gy + gh);
  }
  for (let i = 0; i <= 4; i++) {
    let py = gy + gh - gh * i / 4;
    line(gx, py, gx + gw, py);
  }

  stroke(60);
  strokeWeight(1.5);
  line(gx, gy, gx, gy + gh);
  line(gx, gy + gh, gx + gw, gy + gh);

  noStroke();
  fill(30);
  textSize(14);
  text('速度 (m/s)', gx - 30, gy - 12);
  text('時間 (s)', gx + gw - 50, gy + gh + 37);

  textSize(12);
  textAlign(CENTER);
  for (let i = 0; i <= 8; i++) {
    text(i, gx + gw * i / 8, gy + gh + 18);
  }

  textAlign(RIGHT);
  for (let i = 0; i <= 4; i++) {
    text((vmax * i / 4).toFixed(1),
         gx - 8, gy + gh - gh * i / 4 + 4);
  }
  textAlign(LEFT);

  let ty = gy + gh - terminalVelocity / vmax * gh;

  stroke(20, 155, 95);
  strokeWeight(2);
  drawingContext.setLineDash([7, 5]);
  line(gx, ty, gx + gw, ty);
  drawingContext.setLineDash([]);

  noStroke();
  fill(15, 140, 80);
  textSize(13);
  text('終端速度', gx + gw - 76, ty - 8);

  noFill();
  stroke(35, 105, 230);
  strokeWeight(3);
  beginShape();

  for (let p of graphData) {
    let px = gx + p.t / graphDuration * gw;
    let py = gy + gh - p.v / vmax * gh;
    vertex(px, py);
  }
  endShape();

  let px = gx + elapsed / graphDuration * gw;
  let py = gy + gh - velocity / vmax * gh;

  noStroke();
  fill(35, 105, 230);
  circle(px, py, 9);
}

function drawIntervalTable() {
  let x = 400, y = 575;

  noStroke();
  fill(30);
  textSize(15);
  textStyle(BOLD);
  text('0.5秒ごとの落下距離', x, y);
  textStyle(NORMAL);

  let recent = intervalData.slice(-5);

  textSize(13);
  for (let i = 0; i < recent.length; i++) {
    let item = recent[i];

    let label =
      (item.t - 0.5).toFixed(1) +
      '〜' + item.t.toFixed(1) + ' s';

    text(
      label + '：' + item.moved.toFixed(2) + ' m',
      x + (i % 3) * 175,
      y + 24 + floor(i / 3) * 27
    );
  }

  fill(70);
  textSize(12);
  text('同じ時間に進む距離が一定になると等速運動', x, 655);
}

function drawDiameterScale() {
  noStroke();
  fill(65);
  textSize(13);
  text('直径の設定範囲：1〜6 mm（0.5 mm刻み）', 25, 622);
  text('モデル：球形雨粒、Cd = 0.47（一定）', 25, 645);
  text('※ 大きな雨粒の実際の終端速度は過大評価されます', 25, 668);
}
