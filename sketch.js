"use strict"

let lines = [];
let width, height;
const FH = -180;
let done = false
let f, l;

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
        stroke(0);
        strokeWeight(1);
        noFill();
        this.sets.forEach(s => {
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
        this.fis = new fis([])

        this._tokenMapping = {
            'і': 'and',
            'або': 'or',
            'не': 'not',
            'дуже': ['scale', 1.2],
            'злегка': ['scale', 0.8]
        }
    }

    addTerm(name, set) {
        const ss = this.fis.sets.push(set);
        this.terms[name] = ss - 1;
    }

    _isScalabe(token) {
        return token === 'дуже' || token === 'злегка';
    }

    _isTerm(token) {
        return (this.terms.hasOwnProperty(token));
    }

    applyQuery(query) {
        const tokens = query.split(' ');
        let state = new Pipe(this.fis);

        let scaleStucker = 1;
        for (let i = 0; i < tokens.length; i++) {
            if (this._isScalabe(tokens[i])) {
                const tm = this._tokenMapping[tokens[i]];
                while(!this._isTerm(tokens[i]))  {                   
                    scaleStucker *= tm[1];
                    ++i;
                }
                state = state.pipe(tm[0], this.terms[tokens[i]], scaleStucker);
                scaleStucker = 1;
            }  else if (tokens[i] === 'не') {
                const tm = this._tokenMapping[tokens[i]];
                while(!this._isTerm(tokens[i]))  {                   
                    ++i;
                }
                state = state.pipe(tm, this.terms[tokens[i]]);
            } else if (tokens[i] === 'і') {
                const tm = this._tokenMapping[tokens[i]];
                while(!this._isTerm(tokens[i]))  {                   
                    ++i;
                }
                
            }

        }

        this.fis.show();
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
        // text(y, 1, y + 12);
    }
}

function setup() {
    width = 1600;
    height = 800;

    createCanvas(width, height);
    // f = new fis([
    //     new set(0.0, 150, 200),
    //     new set(175, 225, 300),
    //     new set(270, 325, 400),
    //     new set(375, 550, 570)
    // ]);

    l = new lv('test');
    l.addTerm('холодно', new set(0.0, 150, 200));
    l.addTerm('прохолодно', new set(175, 225, 300));
    l.addTerm('тепло', new set(270, 325, 400));
    l.addTerm('гаряче', new set(375, 550, 570));
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
        // f.show();

        // const c = new Pipe(f)
            // .pipe('get', 1)
            // .pipe()
            // .pipe('get', 2)
            // .pipe('and')
            // .pipe()
            // .pipe('get', 3)
            // .pipe('or')
            // .pipe('scale', 0, 0.75)
            // .pipe()
            // .pipe('scale', 1)
            // .pipe('and')
            // .pipe()
            // .pipe('not', 2)
            // .pipe('and')
            // .values();

        // f.showV(c);

        // l.applyQuery('злегка дуже холодно');
        l.applyQuery('не гаряче');

        done = true;
    }
}