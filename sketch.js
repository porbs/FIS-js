"use strict"

let lines = [];
let width, height;
const FH = -180;
let done = false
let f;

// Helpers

function v(x, y) {
    return createVector(x, y);
}

function k(...args) {
    return args.map(a => `[${a}]`).join('|');
}

class Line {
    constructor(v1, v2) {
        this.start = v1;
        this.end = v2;
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

class set {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;

        this.v1 = v(a, 0.0);
        this.v2 = v(b, FH);
        this.v3 = v(c, 0.0);

        this.l1 = new Line(this.v1, this.v2);
        this.l2 = new Line(this.v2, this.v3);
    }

    show() {
        this.l1.show();
        this.l2.show();
    }

}

class shape {
    constructor(labels, vertices) {
        this.labels = labels;
        this.vertices = vertices;
    }
}

class fis {
    constructor(sets) {
        this.sets = sets;
        this.int = [];
        this.sb = {};
        this.selection = {};

        for (let i = 0; i < sets.length - 1; i++) {
            this.int.push(sets[i].l2.intersection(sets[i + 1].l1));
        }

        this._initShapeBuffer();
    }

    _initShapeBuffer() {
        this.sb[k(0)] = new shape([0], [
            this.sets[0].v1,
            this.sets[0].v2,
            this.int[0],
            this.sets[1].v1,
            this.sets[0].v1
        ]
        );

        const li = this.sets.length - 1;

        this.sb[k(li)] = new shape([li], [
            this.sets[li - 1].v3,
            this.int[li - 1],
            this.sets[li].v2,
            this.sets[li].v3,
            this.sets[li - 1].v3
        ]
        );

        for (let i = 1; i < this.sets.length - 1; i++) {

            this.sb[k(i - 1, i)] = new shape([i - 1, i], [
                this.sets[i].v1,
                this.sets[i - 1].v3,
                this.int[i - 1],
                this.sets[i].v1
            ]
            );

            this.sb[k(i)] = new shape([i], [
                this.sets[i - 1].v3,
                this.int[i - 1],
                this.sets[i].v2,
                this.int[i],
                this.sets[i + 1].v1,
                this.sets[i + 1].v3
            ]
            );

            this.sb[k(i, i + 1)] = new shape([i, i + 1], [
                this.sets[i + 1].v1,
                this.int[i],
                this.sets[i].v3,
                this.sets[i + 1].v1
            ]
            );
        }
    }

    get(index) {
        const result = {};
        for (let key in this.sb) {
            if (key.indexOf(k(index)) !== -1) {
                result[key] = this.sb[key];
            }
        }

        return result;
    }

    not(index) {
        return _.omitBy(this.sb, (val, key) => key.indexOf(k(index)) !== -1);
    }

    and(a, b) {
        return _.pick(a, _.keys(b));
    }

    or(a, b) {
        return _.assign(a, b);
    }

    show() {
        this.sets.forEach(s => s.show());
        this.int.forEach(i => {
            stroke('red');
            strokeWeight(10);
            point(i.x, i.y);
        });
    }

    showSB(src) {
        for (let key in src) {
            beginShape();
            strokeWeight(0);
            fill('rgba(255,0,0, 0.3)');
            if (src[key]) {
                src[key].vertices.forEach(v => {
                    vertex(v.x, v.y);
                });
            }
            endShape();
        }
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
    width = 1600;
    height = 800;

    createCanvas(width, height);
    f = new fis([
        new set(0.0, 150, 200),
        new set(175, 225, 300),
        new set(270, 325, 400),
        new set(375, 550, 570)
    ]);
}

class Pipe {
    constructor(context = null) {
        this.context = _.isNil(context) ? window : context;
        this._values = [];
        this._toPush = false;
    }

    pipe(func, ...args) {
        if (_.isEmpty(arguments)) {
            this._toPush = true;
            return this;
        }

        if (this._toPush) {
            const res = this.context[func](...args);
            if (!_.isNil(res)) {
                this._values.push(res);
            }
            this._toPush = false;
        } else {
            this._values = [this.context[func](...this._values, ...args)];
        }

        return this;
    }

    values() {
        return this._values[0];
    }
}

function draw() {
    if (!done) {
        background(220);
        translate(20, height * 0.75);
        drawGrid(50);
        f.show();

        const c = new Pipe(f)
            .pipe('get', 1)
            .pipe()
            .pipe('get', 2)
            .pipe('and')
            .pipe()
            .pipe('get', 3)
            .pipe('or')
            .pipe()
            .pipe('not', 2)
            .pipe('and')
            .values();

        f.showSB(c);
        done = true;
    }
}