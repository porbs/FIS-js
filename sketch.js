"use strict"

let lines = [];
let width, height;
let FH = -400;
let f;

class Line {
    constructor(_startX, _startY, _endX, _endY) {
        this.start = createVector(_startX, _startY);
        this.end = createVector(_endX, _endY);
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

    and(si1, si2) {
        if (si2 - si1 !== 1) {
            return;
        }

        const s1 = this.sets[si1];
        const s2 = this.sets[si2];

        return [
            createVector(s2.x1, 0),
            this.intersections[si1],
            createVector(s1.x3, 0)
        ];
    }

    or(si1, si2) {
        if (si2 - si1 !== 1) {
            return;
        }

        const s1 = this.sets[si1];
        const s2 = this.sets[si2];
        const s3 = this.sets[si2 + 1];

        // return [
        //     createVector(s1.x1, 0),
        //     createVector(s1.x2, FH),
        //     createVector(s1.x3, 0),
        //     this.intersections[si1],
        //     createVector(s2.x1, 0),
        //     createVector(s2.x2, FH),
        //     createVector(s2.x3, 0),
        // ];


        return [
            {
                labels: [si1.toString()],
                vertices: [
                    createVector(s1.x1, 0),
                    createVector(s1.x2, FH),
                    this.intersections[si1],
                    createVector(s2.x1, 0),
                ]

            },
            {
                labels: [si2.toString()],
                vertices: [
                    this.intersections[si1],
                    createVector(s2.x2, FH),
                    this.intersections[si2],
                    createVector(s3.x1, 0),
                    createVector(s1.x3, 0),
                ]
            },
            {
                labels: [si1.toString(), si2.toString()],
                vertices: [
                    createVector(s2.x1, 0),
                    this.intersections[si1],
                    createVector(s1.x3, 0),
                ]
            },
            {
                labels: [si2.toString(), (si2 + 1).toString()],
                vertices: [
                    createVector(s3.x1, 0),
                    this.intersections[si2],
                    createVector(s2.x3, 0),
                ]
            }
        ];
    }

    xor(si1, si2) {
        if (si2 - si1 !== 1) {
            return;
        }

        const s1 = this.sets[si1];
        const s2 = this.sets[si2];

        return [
            createVector(s1.x1, 0),
            createVector(s1.x2, FH),
            this.intersections[si1],
            createVector(s2.x1, 0)
        ];
    }

    not(si, shapes) {
        const s = this.sets[si];

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].labels.indexOf(si.toString()) !== -1) {
                shapes.splice(i, 1);
            }
        }

        return shapes;

        // return vertices.filter((v) => {
        //     console.log(si, v.x, v.y, this._inside(
        //         [v.x, v.y],
        //         [
        //             [s.x1, 0.0],
        //             [s.x2, FH],
        //             [s.x3, 0.0]
        //         ]
        //     ));
        //     return true &&
        //         // !v.equals(createVector(s.x1, 0)) &&
        //         !v.equals(createVector(s.x2, FH)) &&
        //         // !v.equals(createVector(s.x3, 0)) &&
        //         !this._inside(
        //             [v.x, v.y],
        //             [
        //                 [s.x1, 0.0],
        //                 [s.x2, FH],
        //                 [s.x3, 0.0]
        //             ]
        //         );
        // });
    }

    _inside(point, vs) {
        var x = point[0], y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    showOp(shapes) {
        beginShape();
        strokeWeight(0);
        fill('rgba(255,0,0, 0.3)');
        shapes.forEach(s => {
            s.vertices.forEach(v => {
                vertex(v.x, v.y);
            });
        });
        endShape(CLOSE);
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
    f = new FIS();
    f.addSet(0.0, 200, 300);
    f.addSet(275, 325, 400);
    f.addSet(380, 470, 500);
    f.addSet(480, 600, 650);
}

let angle = 0;
let done = false
function draw() {
    if (!done) {
        background(220);
        translate(20, height / 2);
        drawGrid(50);
        f.show();
        let v = f.or(0, 1)
        // .concat(f.or(1, 2));
        v = f.not(0, v);
        console.log(v);
        f.showOp(v);
        done = true;
    }
}
