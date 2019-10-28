"use strict"

let lines = [];
let width, height;
let FH = -180;
let done = false
let f, l;

// Helpers

function v(x, y) {
    return createVector(x, y);
}

function k(...args) {
    return args.map(a => `[${a}]`).join('|');
}

function randomColor() {
    return color(random(255), random(255), random(255));
}

class Line {
    constructor(v1, v2) {
        this.start = v1;
        this.end = v2;
    }

    show(color = 0) {
        stroke(color);
        strokeWeight(1);
        line(this.start.x, this.start.y, this.end.x, this.end.y);
    }
}

class set {
    constructor(a, b, c) {
        this.v1 = v(a, 0.0);
        this.v2 = v(b, FH);
        this.v3 = v(c, 0.0);

        this.shape = new shape([this.v1, this.v2, this.v3]);
    }
}

class shape {
    constructor(vertices) {
        this.vertices = vertices;
    }

    show() {
        beginShape();
        strokeWeight(1);
        fill('rgba(255,0,0, 0.3)');
        this.vertices.forEach(v => {
            vertex(v.x, v.y);
        });
        endShape();
    }

    inside(point) {
        const x = point.x, y = point.y;
        const vs = this.vertices;
        let inside = false;

        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;

            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };
}

class fis {
    constructor(sets) {
        this.sets = sets;
        this.colors = [];

        this.sets.forEach(() => {
            this.colors.push(randomColor());
        })

    }

    addSet(set) {
        const newLength = this.sets.push(set);
        this.colors.push(randomColor());
        return newLength - 1;
    }

    and(a, b) {
        return _.pick(a, _.keys(b));
    }

    get(index) {
        const s = this.sets[index].shape;
        const vs = {};
        for (let i = FH; i <= 0; i++) {
            for (let j = 0; j < width; j++) {
                const cv = v(j, i);
                if (s.inside(cv)) {
                    vs[k(j, i)] = cv;
                }
            }
        }
        return vs;
    }

    not(index) {
        const s = this.sets[index].shape;
        const otherShapes = [];
        this.sets.forEach((set, i) => {
            if (i !== index) {
                otherShapes.push(this.sets[i].shape);
            }
        });

        const vs = {};
        for (let i = FH; i <= 0; i++) {
            for (let j = 0; j < width; j++) {
                const cv = v(j, i);
                if (
                    !s.inside(cv) &&
                    _.some(otherShapes, (sh) => sh.inside(cv))
                ) {
                    vs[k(j, i)] = cv;
                }
            }
        }
        return vs;
    }

    or(a, b) {
        return _.assign(a, b);
    }

    /**
     * cv > 1: con
     * cv < 1: dil
     * cv = 1: get
     */
    scale(index, cv = 1) {
        const s = this.sets[index];
        const d1 = s.v2.x - s.v1.x;
        const d2 = s.v3.x - s.v2.x;
        const conShape = new shape([
            v(s.v2.x - d1 * (1 / cv + 0.01), s.v1.y),
            s.v2,
            v(s.v2.x + d2 * (1 / cv + 0.01), s.v3.y),
            v(s.v2.x - d1 * (1 / cv + 0.01), s.v1.y)
        ]);

        const vs = {};
        for (let i = FH; i <= 0; i++) {
            for (let j = 0; j < width; j++) {
                const cv = v(j, i);
                if (
                    conShape.inside(cv)
                ) {
                    vs[k(j, i)] = cv;
                }
            }
        }
        return vs;
    }

    show() {
        strokeWeight(4);
        noFill();


        this.sets.forEach((s, i) => {
            stroke(this.colors[i]);
            beginShape();
            s.shape.vertices.forEach(vtx => {
                vertex(vtx.x, vtx.y);
            });
            endShape(CLOSE)
        });
    }

    showV(vts) {
        for (let key in vts) {
            stroke('rgba(0, 0, 255, 0.3)');
            strokeWeight(1);
            point(vts[key].x, vts[key].y);
        };
    }
}

class lv {
    constructor(name) {
        this.name = name;
        this.terms = {};
        this.labels = [];
        this.fis = new fis([])

        this._tokenMapping = {
            'і': 'and',
            'та': 'and',
            'також': 'and',
            'або': 'or',
            'чи': 'or',
            'не': 'not',
            'дуже': ['scale', 1.2],
            'злегка': ['scale', 0.8],
            'трохи': ['scale', 0.8]
        }
    }

    addTerm(name, set) {
        const ss = this.fis.addSet(set);
        this.labels.push(name);
        this.terms[name] = ss;
    }

    showLegend() {
        const termsCnt = Object.keys(this.terms).length;
        const lw = 400;
        const lh = termsCnt * 30;
        const lStartX = width - lw - 40;
        const lStartY = -height + lh;


        stroke(255);
        fill(255);
        rect(lStartX, lStartY, lw, lh);

        for (let i = 0; i < termsCnt; i++) {
            const c = this.fis.colors[i];
            const lineW = 100;
            const lineStartY = lStartY + (30 * i) + 10;
            const lineStartX = lStartX + 10;

            stroke(c);
            strokeWeight(8);
            line(lineStartX, lineStartY, lineStartX + lineW, lineStartY);

            const labelStartX = lineStartX + lineW + 10;
            fill(0);
            stroke(0);
            strokeWeight(0);
            textSize(18);
            text(this.labels[i], labelStartX, lineStartY + 5);
        };
    }

    _isScalabe(token) {
        const tm = this._tokenMapping[token];
        return _.isArray(tm) && tm[0] === 'scale';
    }

    _isTerm(token) {
        return (this.terms.hasOwnProperty(token));
    }

    _isUnary(token) {
        const tm = this._tokenMapping[token];
        return this._isScalabe(token) || tm === 'not';
    }

    _isBinary(token) {
        const tm = this._tokenMapping[token];
        return tm === 'and' || tm === 'or';
    }

    applyQuery(query) {
        console.log('query: ', query);
        const tokens = query.split(' ');
        let state = new Pipe(this.fis);

        let prevTerm = false;
        let scaleStucker = 1;
        for (let i = 0; i < tokens.length; i++) {
            if (this._isScalabe(tokens[i])) {
                console.log('scalable ', tokens[i]);
                const tm = this._tokenMapping[tokens[i]];
                while (!this._isTerm(tokens[i]) && i <= tokens.length) {
                    scaleStucker *= tm[1];
                    ++i;
                }
                if (_.isNil(tokens[i])) {
                    return;
                }
                state = state.pipe(tm[0], this.terms[tokens[i]], scaleStucker);
                scaleStucker = 1;
                prevTerm = false;
            } else if (this._tokenMapping[tokens[i]] === 'not') {
                console.log('not ', tokens[i]);
                const tm = this._tokenMapping[tokens[i]];
                while (!this._isTerm(tokens[i]) && i <= tokens.length) {
                    ++i;
                }
                if (_.isNil(tokens[i])) {
                    return;
                }
                state = state.pipe(tm, this.terms[tokens[i]]);
                prevTerm = false;
            } else if (this._isBinary(tokens[i])) {
                const tmp = this._tokenMapping[tokens[i]];
                console.log('binary ', tokens[i]);
                while (!(this._isTerm(tokens[i]) || this._isUnary(tokens[i])) && i <= tokens.length) {
                    ++i;
                }
                if (_.isNil(tokens[i])) {
                    return;
                }
                console.log('term or unary ', tokens[i]);
                if (this._isTerm(tokens[i])) {
                    console.log('binary -> term ', tokens[i]);
                    state = state.pipe().pipe('get', this.terms[tokens[i]]).pipe(tmp);
                } else if (this._isUnary(tokens[i])) {
                    console.log('binary -> unary ', tokens[i]);
                    if (this._isScalabe(tokens[i])) {
                        console.log('binary -> scalable ', tokens[i]);
                        const tm = this._tokenMapping[tokens[i]];
                        while (!this._isTerm(tokens[i]) && i <= tokens.length) {
                            scaleStucker *= tm[1];
                            ++i;
                        }
                        if (_.isNil(tokens[i])) {
                            return;
                        }
                        state = state.pipe().pipe(tm[0], this.terms[tokens[i]], scaleStucker).pipe(tmp);
                        scaleStucker = 1;
                    } else if (tokens[i] === 'не') {
                        console.log('binary -> not ', tokens[i]);
                        const tm = this._tokenMapping[tokens[i]];
                        while (!this._isTerm(tokens[i]) && i <= tokens.length) {
                            ++i;
                        }
                        if (_.isNil(tokens[i])) {
                            return;
                        }
                        console.log(tm, this.terms[tokens[i]], tmp)
                        state = state.pipe().pipe(tm, this.terms[tokens[i]]).pipe(tmp);
                    }
                }
                prevTerm = false;
            } else if (this._isTerm(tokens[i])) {
                console.log('term ', tokens[i]);
                if (!prevTerm) {
                    state = state.pipe('get', this.terms[tokens[i]]);
                }
                prevTerm = true;
            }
        }

        this.fis.showV(state.values());
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
    }
}

function setup() {
    width = windowWidth;
    height = windowHeight * 0.70;
    FH = -height * 0.50;
    createCanvas(width, height);

    l = new lv('test');
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

let update = true;
let query = '';
function draw() {
    if (update) {
        background(220);
        translate(20, height * 0.85);
        drawGrid(50);
        l.fis.show();
        l.applyQuery(query);
        l.showLegend();
        update = false;
    }
}