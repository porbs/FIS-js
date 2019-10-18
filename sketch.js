"use strict"

let lines = [];
let width, height;
let FH = 400;
let f;

class Line {
    constructor(_startX, _startY, _endX, _endY) {
        this.start = createVector(_startX, -_startY);
        this.end = createVector(_endX, -_endY);
    }

    intersection(l) {
        const bx = this.end.x - this.start.x;
        const by = this.end.y - this.start.y;
        const dx = l.end.x - l.start.x;
        const dy = l.end.y - l.start.y;

        const b_dot_d_perp = bx * dy - by * dx;

        if (b_dot_d_perp === 0) {
            return null;
        }

        const cx = l.start.x - this.start.x;
        const cy = l.start.y - this.start.y;

        const t = (cx * dy - cy * dx) / b_dot_d_perp;

        if (t < 0 || t > 1) {
            return null;
        }

        const u = (cx * by - cy * bx) / b_dot_d_perp;
        if (u < 0 || u > 1) {
            return null;
        }

        return createVector(this.start.x + t * bx, this.start.y + t * by);
    }

    show() {
        stroke(0);
        strokeWeight(1);
        line(this.start.x, this.start.y, this.end.x, this.end.y);
    }
}

class Set {
    constructor(low, mid, high) {
        this.x1 = low;
        this.x2 = mid;
        this.x3 = high;

        this.l1 = new Line(this.x1, 0, this.x2, FH);
        this.l2 = new Line(this.x2, FH, this.x3, 0);
    }

    show() {
        this.l1.show();
        this.l2.show();
    }
}

class FIS {
    constructor() {
        this.sets = [];
        this.intersections = [];
    }

    isApplicableSet(set) {
        if (this.sets.length === 0) {
            return true;
        }
        const last = this.sets[this.sets.length - 1];
        return last.x2 < set.x1 && last.x3 > set.x1 && last.x3 < set.x2;
    }

    addSet(low, mid, high) {
        const newSet = new Set(low, mid, high);

        if (!this.isApplicableSet(newSet)) {
            return;
        }
        this.sets.push(newSet);

        if (this.sets.length !== 1) {
            const lastSet = this.sets[this.sets.length - 2];
            this.intersections.push(lastSet.l2.intersection(newSet.l1));
        }

    }

    show() {
        this.sets.forEach(s => s.show());
        this.intersections.forEach(i => {
            stroke('red');
            strokeWeight(10);
            point(i.x, i.y);
        });
    }
}

function drawGrid(cellSize) {
    strokeWeight(1);

    stroke(0);
    line(-width, 0, width, 0);
    line(0, -height, 0, height);

    stroke(200);
    fill(120);

    for (var x = -width; x < width; x += cellSize) {
        line(x, -height, x, height);
        text(x, x + 1, 12);
    }
    for (var y = -height; y < height; y += cellSize) {
        line(-width, y, width, y);
        // text(y, 1, y + 12);
    }
}

function setup() {
    width = 940;
    height = 922;

    createCanvas(width, height);
    // frameRate(2);
    f = new FIS();
    f.addSet(0.0, 200, 300);
    f.addSet(275, 325, 400);
    f.addSet(380, 470, 500);
}

let angle = 0;

function draw() {
    background(220);
    translate(20, height / 2);
    drawGrid(50);


    // translate(width / 2, 0);
    // angle -= (2 * PI * 0.001);
    // rotate(PI);
    f.show();
}
