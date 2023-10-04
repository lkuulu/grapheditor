// By Simon Sarris
// www.simonsarris.com
// sarris@acm.org
//
// Last update December 2011
//
// Free to use and distribute at will
// So long as you are nice to people, etc


// Based on Simon Sarris's work 
// enhanced by Luc Pharabod
// Last update july 2015
// www.shotthemhost.com
// luc.pharabod@shotthemhost.com
// ********************************************************************
// * - add Handle object for displaying resize handles
// * - add Shape as a base class
// * - add linkable for allow object linking capabilities inherit Shape
// * - add handleable for resizing object capabilities inherit linkable
// * - add Box specification inherit handleable
// * - add Diamond specification inherit handleable
// * - add Circle specification inherit linkable
// * - add Doc specification inherit handleable
// * - add labels and few persistant datas in shape
// * - add lines for connectors
// * - add virtual grid to snap shapes && resize
// * - add property editor to change labels / links / (improved from jqPropertyGrid)
// * - add multi-select shapes with a mouse surround
// * - add select/deselect shapes with a keyboard trick (Ctrl+click)
// * - keyboard event to callback events (move / delete)
// * SOON :
// * - add callback for rest storage/property editor/whatever
// ********************************************************************

var s;

// 0  1  2
// 3     4
// 5  6  7
const HANDLE = {
    TOP: 1,
    LEFT: 3,
    RIGHT: 4,
    BOTTOM: 6
};

var globalColor = 'rgba(224, 236, 255, 0.8)';
var canvasMargin = 20;
var oneStep = 1;
var onePage = 20;

var direction = {
    'toLeft': 0,
    'toTop': 1,
    'toRight': 2,
    'toBottom': 4
};

/* global values */
execFunctions = {
    'httpCode': 'Get http response code from url',
    'apiObjectExists': 'API Object exists for url',
    'mailTo': 'Send a mail to'
};

propertiesTypes = {
    'className': 'className',
    'x': 'int',
    'y': 'int',
    'w': 'int',
    'h': 'int',
    'label': 'string',
    'description': 'string',
    'execFunction': 'string',
    'parameter': 'string',
    'trueOnLeft': 'boolean',
    'gridsize': 'int',
    'gridsnap': 'boolean',
    'autosize': 'boolean'
};

var menu = [{
    name: 'create',
    img: 'images/create.png',
    title: 'Create shape',
    subMenu: [{
        'name': 'Question',
        fun: function () {
            s.addShape(new Diamond(s, s.lastCtxMenuPoint.x - 10, s.lastCtxMenuPoint.y - 10, 160, 90, '', globalColor));
        }
    }, {
        'name': 'Action',
        fun: function () {
            s.addShape(new Box(s, s.lastCtxMenuPoint.x - 10, s.lastCtxMenuPoint.y - 10, 160, 90, '', globalColor));
        }
    }, {
        'name': 'Document',
        fun: function () {
            s.addShape(new Doc(s, s.lastCtxMenuPoint.x - 10, s.lastCtxMenuPoint.y - 10, 160, 90, '', globalColor));
        }
    }]
}, {
    name: 'delete',
    img: 'images/delete.png',
    title: 'Delete shape',
    fun: function () {
        s.deleteSelection();
    }
}, {
    name: 'download',
    img: 'images/saveimage.png',
    title: 'Download as image',
    fun: function () {
        s.download();
    }
}];


function consolelog(logs) {
//    console.log(logs);
    document.getElementById('log').innerHTML = logs;
}


function Point(x, y) {
    this.x = x;
    this.y = y;
}

// *******************************
// **  Define an handle Object  **
// *******************************
function Grid(size) {
    this.size = size;
    this.active = true;
    this.snap = true;
    this.color = 'rgba(0,0,0,.4)';
}

Grid.prototype.nearest = function (value) {
    if (!this.snap)
        return value;
    return Math.round(value / this.size) * this.size;
};


function Handle() {
    this.x = 0;
    this.y = 0;
    this.w = 6; // default width and height?
    this.h = 6;
    this.fill = '#000000';
}

// Determine if a point is inside the shape's bounds
Handle.prototype.contains = function (mx, my) {
    // All we have to do is make sure the Mouse X,Y fall in the area between
    // the shape's X and (X + Width) and its Y and (Y + Height)
    return (this.x <= mx) && (this.x + this.w >= mx) &&
        (this.y <= my) && (this.y + this.h >= my);
};

// **************************************
// **  Define a Line between 2 shapes  **
// **************************************
function Line(origin, origineHandle, destination) {
    this.origin = origin;
    this.origineHandle = origineHandle;
    this.destination = destination;

    this.origin.children.push(destination);
    this.destination.parents.push(origin);

    // destinationHandle is always top
    this.origin.addLine(this);
    this.destination.addLine(this);

    this.showBtn = false;

    this.margin = 15;
    this.arrowSize = 8;
}

Line.prototype.destroy = function () {
    //dereference line in parents & children shapes
    this.origin.delLine(this);
    this.destination.delLine(this);
};

Line.prototype.setDestCoord = function () {
    switch (this.destinationHandle) {
        case 1:
            this.dx = this.destination.x + (this.destination.w / 2);
            this.dy = this.destination.y;
            break;
        case 3:
            this.dx = this.destination.x;
            this.dy = this.destination.y + this.destination.h / 2;
            break;
        case 4:
            this.dx = this.destination.x + this.destination.w;
            this.dy = this.destination.y + this.destination.h / 2;
            break;
        case 6:
            this.dx = this.destination.x + (this.destination.w / 2);
            this.dy = this.destination.y + this.destination.h;
            break;
    }
};

Line.prototype.draw = function (ctx) {
    ctx.lineWidth = 2;
    if (this.showBtn) {
        ctx.strokeStyle = '#95B8E7'; //'#aa0000';
    } else {
        ctx.strokeStyle = '#8c8c8c';
    }
    this.doPath(ctx);
    ctx.stroke();

    //ctx.closePath();
    if (this.showBtn) {
        ctx.beginPath();
        ctx.strokeStyle = '#3c3c3c';
        ctx.moveTo(this.dx + 5, this.dy - 15);
        var radius = 5;
        var radians = (Math.PI / 180) * 380;
        ctx.lineWidth = 1;
        ctx.arc(this.dx, this.dy - 15, radius, 0, radians, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();

        ctx.font = '11pt Calibri';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', this.dx, this.dy - 15);
        //ctx.closePath();
    }
};

Line.prototype.contains = function (mx, my) {
    // All we have to do is make sure the Mouse X,Y fall in the area between
    // the shape's X and (X + Width) and its Y and (Y + Height)
    return (this.destination.x + (this.destination.w / 2) - 5 <= mx) && (this.destination.x + (this.destination.w / 2) + 5 >= mx) &&
        (this.destination.y - 20 <= my) && (this.destination.y - 10 >= my);
};

// Set cursor if over an handle
Line.prototype.setCursor = function (container, mx, my) {
    if (this.contains(mx, my)) {
        container.canvas.style.cursor = 'pointer';
        return true;
    }
    return false;
};

// DrawStroke for this shape
Line.prototype.drawStroke = function (ctx) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0c3c3c';
    this.doPath(ctx);
    ctx.stroke();
};


Line.prototype.doPath = function (ctx) {
    // Corners are not available to begin||finish a line
    //    1
    // 3     4
    //    6
    switch (this.origineHandle) {
        case HANDLE.TOP:
            this.ox = this.origin.x + (this.origin.w / 2);
            this.oy = this.origin.y;
            break;
        case HANDLE.LEFT:
            this.ox = this.origin.x;
            this.oy = this.origin.y + this.origin.h / 2;
            break;
        case HANDLE.RIGHT:
            this.ox = this.origin.x + this.origin.w;
            this.oy = this.origin.y + this.origin.h / 2;
            break;
        case HANDLE.BOTTOM:
            this.ox = this.origin.x + (this.origin.w / 2);
            this.oy = this.origin.y + this.origin.h;
            break;
    }

    var ix = [];
    var iy = [];

    this.destinationHandle = HANDLE.TOP;
    this.setDestCoord();
    if (this.origineHandle == HANDLE.LEFT) {
        // start headache

        if ((this.dy < this.oy) && (this.destination.x + this.destination.w > this.origin.x - this.margin)) { //(this.dx<this.origin.x+this.origin.w) ) {
            ix.push(this.ox,
                Math.min(this.origin.x, this.destination.x) - this.margin,
                Math.min(this.origin.x, this.destination.x) - this.margin,
                this.dx);
            iy.push(this.oy, this.oy, this.destination.y - this.margin, this.destination.y - this.margin);

        } else if (this.dx > this.ox - this.margin) { // && (!(this.ox>this.destination.x && this.ox<this.destination.x+this.destination.w))) {
            if (this.dy > this.origin.y + this.origin.h) {
                // |-[ O ]
                // |-----|
                //     [ D ]
                ix.push(this.ox - this.margin, this.ox - this.margin, this.dx);

                iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                //iy.push(this.oy, this.dy-(this.dy-(this.origin.y+this.origin.h))/2, this.dy-(this.dy-(this.origin.y+this.origin.h))/2);

            } else {
                //         |---|
                // |-[ O ] | [ D ]
                // |-------|
                //ix.push(this.ox-this.margin, this.ox-this.margin, this.origin.x+this.origin.w + ((this.destination.x-(this.origin.x+this.origin.w))/2), this.origin.x+this.origin.w + ((this.destination.x-(this.origin.x+this.origin.w))/2), this.dx);
                //iy.push(this.oy, this.origin.y+this.origin.h+this.margin, this.origin.y+this.origin.h+this.margin, this.destination.y-this.margin, this.destination.y-this.margin);

                // new option = less cross
                // |-----------|
                // |-[ O ]   [ D ]
                ix.push(Math.min(this.ox - this.margin, this.destination.x - this.margin), Math.min(this.ox - this.margin, this.destination.x - this.margin), this.dx);
                iy.push(this.oy, this.destination.y - this.margin, this.destination.y - this.margin);
            }
        } else {
            if (this.dy > this.oy) {
                //         |-[ O ]
                //         |
                //       [ D ]
                ix.push(this.dx);
                iy.push(this.oy);
            } else {

                //     |---|
                //   [ D ] |-[ O ]
                //
                ix.push(this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.dx);
                iy.push(this.oy, this.destination.y - this.margin, this.destination.y - this.margin);

            }
        }
    } else if (this.origineHandle == HANDLE.RIGHT) {
        if ((this.dx > this.ox)) {
            if (this.dy > this.oy) {
                // [  ]--|
                //       |
                //     [   ]
                ix.push(this.dx);
                iy.push(this.oy);

            } else {
                if (this.destination.x < this.ox + this.margin) {
                    ix.push(Math.max(this.destination.x + this.destination.w, this.ox) + this.margin,
                        Math.max(this.destination.x + this.destination.w, this.ox) + this.margin,
                        this.dx);
                    iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                } else {
                    //        |----|
                    // [   ]--|  [   ]
                    ix.push(Math.max(this.destination.x - this.margin, this.ox + this.margin),
                        Math.max(this.destination.x - this.margin, this.ox + this.margin),
                        this.dx);

                    iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                }
            }
        } else if ((this.dy < this.oy) && ((this.ox + this.margin > this.destination.x) && (this.ox < this.destination.x + this.destination.w))) { //(this.dx>this.ox) {
            ix.push(Math.max(this.destination.x + this.destination.w, this.ox) + this.margin,
                Math.max(this.destination.x + this.destination.w, this.ox) + this.margin,
                this.dx);
            iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);

        } else {
            if (this.dy > this.origin.y + this.origin.h) {
                //        [ O ]-|
                //          |---|
                //        [ D ]
                ix.push(this.ox + this.margin, this.ox + this.margin, this.dx);
                iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                //iy.push(this.oy,this.dy-(this.dy-(this.origin.y+this.origin.h))/2,this.dy-(this.dy-(this.origin.y+this.origin.h))/2);

            } else {
                if (((this.dy <= this.origin.y) || (this.dx >= this.origin.x && this.dx <= this.origin.x + this.origin.w))
                    && (this.oy > this.destination.y + this.destination.h + this.margin)) {
                    //    |----|
                    //  [ D ]  |
                    //   [ O ]-|
                    ix.push(Math.max(this.ox, this.destination.x + this.destination.w) + this.margin, Math.max(this.ox, this.destination.x + this.destination.w) + this.margin, this.dx);
                    iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                } else if (this.dy <= this.origin.y) {
                    ix.push(Math.max(this.ox, this.destination.x + this.destination.w) + this.margin, Math.max(this.ox, this.destination.x + this.destination.w) + this.margin, this.dx);
                    iy.push(this.oy, this.dy - this.margin, this.dy - this.margin);
                } else {
                    //     |---|
                    //   [ D ] | [ O ]-|
                    //         |-------|
                    //
                    ix.push(this.ox + this.margin, this.ox + this.margin, this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.dx);
                    iy.push(this.oy, this.origin.y + this.origin.h + this.margin, this.origin.y + this.origin.h + this.margin, this.dy - this.margin, this.dy - this.margin);
                }
            }
        }
    } else if (this.origineHandle == HANDLE.BOTTOM) {
        // D is right to O
        if (this.dy > this.oy) {
            //   [ O ]
            //     |-|
            //     [ D ]
            ix.push(this.ox, this.dx);
            iy.push(this.dy - this.margin, this.dy - this.margin);
            //iy.push(this.dy-(this.dy-(this.origin.y+this.origin.h))/2, this.dy-(this.dy-(this.origin.y+this.origin.h))/2);
        } else {
            // should I have to turn around object
            if ((this.dx > this.origin.x) && (this.dx < this.origin.x + this.origin.w)) {
                ix.push(this.ox,
                    Math.max(this.origin.x + this.origin.w, this.destination.x + this.destination.w) + this.margin,
                    Math.max(this.origin.x + this.origin.w, this.destination.x + this.destination.w) + this.margin,
                    this.dx);
                iy.push(this.oy + this.margin, this.oy + this.margin, this.destination.y - this.margin, this.destination.y - this.margin);
            } else if (this.dx > this.ox) {
                ix.push(this.ox, this.destination.x - (this.destination.x - (this.origin.x + this.origin.w)) / 2, this.destination.x - (this.destination.x - (this.origin.x + this.origin.w)) / 2, this.dx);
                iy.push(this.oy + this.margin, this.oy + this.margin, this.destination.y - this.margin, this.destination.y - this.margin);
            } else {
                ix.push(this.ox, this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.destination.x + this.destination.w + (this.origin.x - (this.destination.x + this.destination.w)) / 2, this.dx);
                iy.push(this.oy + this.margin, this.oy + this.margin, this.destination.y - this.margin, this.destination.y - this.margin);
            }
        }
    }

    // draw Line Path
    ctx.beginPath();
    ctx.moveTo(this.ox, this.oy);
    for (var i = 0; i < ix.length; i++) {
        ctx.lineTo(ix[i], iy[i]);
    }


    ctx.lineTo(this.dx, this.dy - this.arrowSize);
    ctx.lineTo(this.dx - (this.arrowSize / 2), this.dy - this.arrowSize);
    ctx.lineTo(this.dx, this.dy);
    ctx.lineTo(this.dx + (this.arrowSize / 2), this.dy - this.arrowSize);
    ctx.lineTo(this.dx, this.dy - this.arrowSize);
    ctx.lineTo(this.dx, this.dy - this.arrowSize);

};


// *****************************
// **  Define a Shape Object  **
// *****************************
function Shape(parent, x, y, w, h, label, fill) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.label = label || '';
    this.description = '';

    this.fill = fill || '#AAAAAA';
    this.font = '11pt Calibri';
    this.textAlign = 'center';
    this.fillStyle = 'black';
    this.parents = [];
    this.children = [];
    this.lines = [];
    this.parent = parent;
    this.parameter = '';

    // store offet from mouse coordinate when mousedown on canvas
    this.dragoffx = 0;
    this.dragoffy = 0;
}

Shape.prototype.destroy = function () {
    for (var i = this.lines.length - 1; i >= 0; i--) {
        if (i < this.lines.length)
            this.lines[i].destroy();
        //this.lines.splice(i, 1);
    }
};

Shape.prototype.delLine = function (line) {
    var index = this.parent.lines.indexOf(line);
    if (index > -1) {
        //this.lines[index].destroy();
        this.parent.lines.splice(index, 1);
    }
    index = this.lines.indexOf(line);
    if (index > -1) {
        //this.lines[index].destroy();
        this.lines.splice(index, 1);
    }
};

Shape.prototype.addLine = function (line) {
    this.lines.push(line);
};

Shape.prototype.drawLabel = function (ctx) {
    var lineheight = 13;
    ctx.font = this.font;
    ctx.textAlign = this.textAlign;
    ctx.fillStyle = this.fillStyle;
    ctx.textBaseline = 'middle';


    var lines = this.label.split('\n');

    for (var i = 0; i < lines.length; i++)
        ctx.fillText(lines[i], this.x + this.w / 2, this.y + this.h / 2 - (lineheight * (lines.length - 1) / 2) + (i * lineheight));
};

// Determine if shape is contained in selectFrame Rect
Shape.prototype.isContained = function (selectFrame) {
    // return true if almost one corner is contain
    return selectFrame.contains(this.x, this.y) ||
        selectFrame.contains(this.x + this.w, this.y) ||
        selectFrame.contains(this.x + this.w, this.y + this.h) ||
        selectFrame.contains(this.x, this.y + this.h) ||
        selectFrame.contains(this.x + this.w / 2, this.y) ||
        selectFrame.contains(this.x + this.w, this.y + this.h / 2) ||
        selectFrame.contains(this.x + this.w / 2, this.y + this.h) ||
        selectFrame.contains(this.x, this.y + this.h / 2);
};

// Determine if a point is inside the shape's bounds, available for all shapes
Shape.prototype.contains = function (mx, my) {
    // All we have to do is make sure the Mouse X,Y fall in the area between
    // the shape's X and (X + Width) and its Y and (Y + Height)
    return (this.x <= mx) && (this.x + this.w >= mx) &&
        (this.y <= my) && (this.y + this.h >= my);
};


function Linkable(parent, x, y, w, h, label, fill) {
    this.selectionLinks = [];
    this.myLinkBoxColor = '#95B8E7'; //'darkred'; // New for selection boxes
    this.myLinkBoxSize = 8;
    this.limit = 25;
    this.parent = parent;

    this.base = Shape;
    this.base(parent, x, y, w, h, label, fill);

    for (var i = 0; i < 3; i++) {
        var link = new Handle;
        this.selectionLinks.push(link);
    }
}

Linkable.prototype = new Shape;


Linkable.prototype.drawLinks = function (ctx) {
    // draw the boxes
    var half = this.myLinkBoxSize / 2;

    // 0     2
    //    1
    //middle left
    this.selectionLinks[0].x = this.x - 8 - half;
    this.selectionLinks[0].y = this.y + this.h / 2 - half;

    //middle right
    this.selectionLinks[2].x = this.x + this.w + 8 - half;
    this.selectionLinks[2].y = this.y + this.h / 2 - half;

    this.selectionLinks[1].x = this.x + this.w / 2 - half;
    this.selectionLinks[1].y = this.y + this.h - half + 8;


    ctx.fillStyle = this.myLinkBoxColor;
    for (var i = 0; i < this.selectionLinks.length; i++) {
        var cur = this.selectionLinks[i];
        ctx.fillRect(cur.x, cur.y, this.myLinkBoxSize, this.myLinkBoxSize);
    }

    for (var i = 0; i < this.lines.length; i++) {
        this.lines[i].showBtn = true;
    }
};

Linkable.prototype.hideBtns = function () {
    for (var i = 0; i < this.lines.length; i++) {
        this.lines[i].showBtn = false;
    }

};

// Set cursor if over an handle
Linkable.prototype.setLinkCursor = function (container, mx, my) {
    var foundIndex = -1;
    for (var i = 0; i < this.selectionLinks.length; i++) {
        // 0  1  2
        // 3     4
        // 5  6  7
        if (this.selectionLinks[i].contains(mx, my)) {
            // we found one!
            foundIndex = i;
            container.canvas.style.cursor = 'pointer';
        }
    }
    return foundIndex;
};


// ***********************************
// **  Define an handleable Object  **
// **  Inherit from a Shape object  **
// ***********************************
function Handleable(parent, x, y, w, h, label, fill) {
    // New, holds the 8 tiny boxes that will be our selection handles
    // the selection handles will be in this order:
    // 0  1  2
    // 3     4
    // 5  6  7
    this.selectionHandles = [];
    this.mySelBoxColor = '#95B8E7'; //'darkred'; // New for selection boxes
    this.mySelBoxSize = 6;
    this.limit = 25;
    this.parent = parent;

    // invoque inherited object
    this.base = Linkable; //Shape;
    this.base(parent, x, y, w, h, label, fill);

    // set up the selection handle boxes
    for (var i = 0; i < 8; i++) {
        var handle = new Handle;
        this.selectionHandles.push(handle);
    }
}

Handleable.prototype = new Linkable; //Shape;

// This object can be resize with a call from main loop => mousedown && over an handle && mouseMove
Handleable.prototype.resize = function (handleIndex, mx, my) {
    // Hold some values
    var oldx = this.x;
    var oldy = this.y;

    // remember handles order & position
    // 0  1  2
    // 3     4
    // 5  6  7
    switch (handleIndex) {
        case 0:
            if (this.w + oldx - mx <= this.limit) return;
            if (this.h + oldy - my <= this.limit) return;
            this.x = mx;
            this.y = my;
            this.w += oldx - mx;
            this.h += oldy - my;
            break;
        case 1:
            if (this.h + oldy - my <= this.limit) return;
            this.y = my;
            this.h += oldy - my;
            break;
        case 2:
            if (mx - oldx <= this.limit) return;
            if (this.h + oldy - my <= this.limit) return;
            this.y = my;
            this.w = mx - oldx;
            this.h += oldy - my;
            break;
        case 3:
            if (this.w + oldx - mx <= this.limit) return;
            this.x = mx;
            this.w += oldx - mx;
            break;
        case 4:
            if (mx - oldx <= this.limit) return;
            this.w = mx - oldx;
            break;
        case 5:
            if (this.w + oldx - mx <= this.limit) return;
            if (my - oldy <= this.limit) return;
            this.x = mx;
            this.w += oldx - mx;
            this.h = my - oldy;
            break;
        case 6:
            if (my - oldy <= this.limit) return;
            this.h = my - oldy;
            break;
        case 7:
            if (mx - oldx <= this.limit) return;
            if (my - oldy <= this.limit) return;
            this.w = mx - oldx;
            this.h = my - oldy;
            break;
    }
};

// Drawing handles
Handleable.prototype.drawHandles = function (ctx) {
    // draw the boxes
    var half = this.mySelBoxSize / 2;

    // 0  1  2
    // 3     4
    // 5  6  7
    // top left, middle, right
    this.selectionHandles[0].x = this.x - half;
    this.selectionHandles[0].y = this.y - half;

    this.selectionHandles[1].x = this.x + this.w / 2 - half;
    this.selectionHandles[1].y = this.y - half;

    this.selectionHandles[2].x = this.x + this.w - half;
    this.selectionHandles[2].y = this.y - half;

    //middle left
    this.selectionHandles[3].x = this.x - half;
    this.selectionHandles[3].y = this.y + this.h / 2 - half;

    //middle right
    this.selectionHandles[4].x = this.x + this.w - half;
    this.selectionHandles[4].y = this.y + this.h / 2 - half;

    //bottom left, middle, right
    this.selectionHandles[6].x = this.x + this.w / 2 - half;
    this.selectionHandles[6].y = this.y + this.h - half;

    this.selectionHandles[5].x = this.x - half;
    this.selectionHandles[5].y = this.y + this.h - half;

    this.selectionHandles[7].x = this.x + this.w - half;
    this.selectionHandles[7].y = this.y + this.h - half;


    ctx.fillStyle = this.mySelBoxColor;
    for (var i = 0; i < 8; i++) {
        var cur = this.selectionHandles[i];
        ctx.fillRect(cur.x, cur.y, this.mySelBoxSize, this.mySelBoxSize);
    }
};

// Set cursor if over an handle
Handleable.prototype.setCursor = function (container, mx, my) {
    var foundIndex = -1;
    for (var i = 0; i < 8; i++) {
        // 0  1  2
        // 3     4
        // 5  6  7
        if (this.selectionHandles[i].contains(mx, my)) {
            // we found one!
            foundIndex = i;
            switch (i) {
                case 0:
                    container.canvas.style.cursor = 'nw-resize';
                    break;
                case 1:
                    container.canvas.style.cursor = 'n-resize';
                    break;
                case 2:
                    container.canvas.style.cursor = 'ne-resize';
                    break;
                case 3:
                    container.canvas.style.cursor = 'w-resize';
                    break;
                case 4:
                    container.canvas.style.cursor = 'e-resize';
                    break;
                case 5:
                    container.canvas.style.cursor = 'sw-resize';
                    break;
                case 6:
                    container.canvas.style.cursor = 's-resize';
                    break;
                case 7:
                    container.canvas.style.cursor = 'se-resize';
                    break;
            }
        }
    }
    return foundIndex;
};


// *****************************
// **  Define Circle as a Shape  **
// *****************************
function Circle(parent, x, y, w, h, label, fill) {
    this.fill = fill || '#ffffff';

    // invoque inherited object
    //  this.base=Shape;
    //  this.base(parent, x, y, w, h, label, this.fill);

    this.className = this.getName();

    this.linkeable = Linkable;
    this.linkeable(parent, x, y, w, h, label, fill);
}


Circle.prototype = new Linkable;

Circle.prototype.persistant = function () {
    return {
        'x': this.x,
        'y': this.y,
        'w': this.w,
        'h': this.h,
        'label': this.label,
        'description': this.description,
        'parameter': this.parameter
    };
};


Circle.prototype.getName = function () {
    return 'Circle';
};

// what is a circle path
Circle.prototype.doPath = function (ctx) {
    var radians = (Math.PI / 180) * 380;
    ctx.beginPath();
    ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, radians, false);
};

// Draws this Box shape to a given context
Circle.prototype.draw = function (ctx) {
    this.doPath(ctx);


    ctx.fillStyle = this.fill;
    ctx.fill();
    this.drawLabel(ctx);

    //no handle for circle as begin node
    //just a gray permanent stroke when not selected
    ctx.strokeStyle = '#3c3c3c';
    ctx.lineWidth = 1;
    this.drawStroke(ctx);

};

// DrawStroke for this Circle shape
Circle.prototype.drawStroke = function (ctx) {
    this.doPath(ctx);
    ctx.stroke();
};


// *****************************
// **  Define Box as a Shape  **
// *****************************
function Box(parent, x, y, w, h, label, fill) {
    this.fill = fill || '#AAAAAA';

    this.className = this.getName();

    // invoque inherited object
    this.base = Handleable;
    this.base(parent, x, y, w, h, label, fill);

    this.execFunction = '';
    this.description = '';
    this.parameters = '';
}

Box.prototype = new Handleable;

Box.prototype.persistant = function () {
    return {
        'className': this.className,
        'x': this.x,
        'y': this.y,
        'w': this.w,
        'h': this.h,
        'label': this.label,
        'description': this.description,
        'execFunction': this.execFunction,
        'parameter': this.parameters
    };
};


Box.prototype.getName = function () {
    return 'Box';
};

// Draws this Box shape to a given context
Box.prototype.draw = function (ctx) {


    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    this.drawLabel(ctx);

    ctx.strokeStyle = '#95B8E7';
    ctx.lineWidth = 1;
    this.drawStroke(ctx);

};

// DrawStroke for this Box shape
Box.prototype.drawStroke = function (ctx) {
    ctx.strokeRect(this.x, this.y, this.w, this.h);
};

// *****************************
// **  Define Doc as a Shape  **
// *****************************


function Doc(parent, x, y, w, h, label, fill) {
    this.fill = fill || '#AAAAAA';

    this.className = this.getName();

    // invoque inherited object
    this.base = Handleable;
    this.base(parent, x, y, w, h, label, fill);

    this.execFunction = '';
    this.description = '';
}

Doc.prototype = new Handleable;

Doc.prototype.persistant = function () {
    return {
        'className': this.className,
        'x': this.x,
        'y': this.y,
        'w': this.w,
        'h': this.h,
        'label': this.label,
        'description': this.description,
        'execFunction': this.execFunction,
        'parameter': this.parameters
    };
};


Doc.prototype.getName = function () {
    return 'Doc';
};

Doc.prototype.doPath = function (ctx) {
    var dy = this.h;

    ctx.beginPath();
    ctx.fillStyle = this.fill;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h - 20);
    ctx.quadraticCurveTo(this.x + this.w * 3 / 4, this.y + this.h - 20, this.x + this.w / 2, this.y + this.h);
    ctx.quadraticCurveTo(this.x + this.w / 4, this.y + this.h + 20, this.x, this.y + this.h);
    ctx.lineTo(this.x, this.y + dy / 2);
    ctx.closePath();
};

Doc.prototype.draw = function (ctx) {

    this.doPath(ctx);

    ctx.fill();


    ctx.strokeStyle = '#95B8E7';
    ctx.lineWidth = 1;
    this.drawStroke(ctx);
    this.drawLabel(ctx);
};

Doc.prototype.drawStroke = function (ctx) {
    this.doPath(ctx);
    ctx.stroke();
};


// *********************************
// **  Define Diamond as a Shape  **
// *********************************
function Diamond(parent, x, y, w, h, label, fill) {
    this.fill = fill || '#AAAAAA';

    this.className = this.getName();
    // invoque inherited object
    this.base = Handleable;
    this.base(parent, x, y, w, h, label, fill);
    this.execFunction = '';
    this.trueOnLeft = true;
    // You can specify handles size & color for this shape
    // this.mySelBoxSize = 6;
}


Diamond.prototype = new Handleable;

Diamond.prototype.persistant = function () {
    return {
        'className': this.className,
        'x': this.x,
        'y': this.y,
        'w': this.w,
        'h': this.h,
        'label': this.label,
        'description': this.description,
        'execFunction': this.execFunction,
        'parameter': this.parameter,
        'trueOnLeft': this.trueOnLeft
    };
};

Diamond.prototype.getName = function () {
    return 'Diamond';
};

Diamond.prototype.doPath = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.w / 2, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h / 2);
    ctx.lineTo(this.x + this.w / 2, this.y + this.h);
    ctx.lineTo(this.x, this.y + this.h / 2);
    ctx.closePath();
};

// Draws this shape to a given context
Diamond.prototype.draw = function (ctx) {
    // path
    this.doPath(ctx);

    // fill
    ctx.fillStyle = this.fill;

    ctx.fill();


    // border
    ctx.strokeStyle = '#95B8E7';
    ctx.lineWidth = 1;
    this.drawStroke(ctx);

    // T/F links label
    ctx.font = '7pt Calibri';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'green';
    ctx.fillText('T', this.trueOnLeft ? this.x + 10 : this.x + this.w - 10, this.y + this.h / 2);
    ctx.fillStyle = 'red';
    ctx.fillText('F', this.trueOnLeft ? this.x + this.w - 10 : this.x + 10, this.y + this.h / 2);


    // Label
    this.drawLabel(ctx);
};

Diamond.prototype.drawStroke = function (ctx) {
    this.doPath(ctx);
    ctx.stroke();
};

function SimpleFrame(coord) {
    this.originCoord = coord;
    this.destinationCoord = null;
    this.strokeStyle = '#95B8E7';
    this.lineWidth = 1;
}

SimpleFrame.prototype.setDestinationCoord = function (coord) {
    this.destinationCoord = coord;
};

SimpleFrame.prototype.contains = function (mx, my) {
    return (Math.min(this.originCoord.x, this.destinationCoord.x) <= mx) && (Math.max(this.originCoord.x, this.destinationCoord.x) >= mx) &&
        (Math.min(this.originCoord.y, this.destinationCoord.y) <= my) && (Math.max(this.originCoord.y, this.destinationCoord.y) >= my)
};

SimpleFrame.prototype.draw = function (ctx) {
    if (this.destinationCoord != null) {
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.strokeRect(this.originCoord.x, this.originCoord.y, this.destinationCoord.x - this.originCoord.x, this.destinationCoord.y - this.originCoord.y);
    }
};


function CanvasState(canvas) {
    // **** First some setup! ****

    this.canvas = canvas;
    this.w = canvas.width;
    this.h = canvas.height;

    this.label = '';
    this.description = '';
    this.parameter = '';
    this.gridsnap = true;
    this.gridsize = 10;
    this.autosize = false;

    this.ctx = canvas.getContext('2d');
    // This complicates things a little but but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    this.stylePaddingLeft = 0;
    this.stylePaddingTop = 0;
    this.styleBorderLeft = 0;
    this.styleBorderTop = 0;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }
    // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    // **** Keep track of state! ****

    this.valid = false; // when set to false, the canvas will redraw everything
    this.shapes = [];  // the collection of things to be drawn
    this.lines = [];
    this.selections = [];

    this.selectFrame = null;

    this.grid = new Grid(this.gridsize);
    this.grid.color = 'rgba(0,0,0,.1)';
    //this.grid.active=false;

    this.dragging = false; // Keep track of when we are dragging

    this.isResizeDrag = false;
    this.isLinkDrag = false;
    this.expectResize = -1;
    this.expectLink = -1;

    this.isSelectDrag = false;

    this.expectDelLine = -1;
    this.isDel = false;

    this.lastCtxMenuPoint = null;

    function linkToHandleIndex(linkIndex) {
        // convert Link index to handle Index
        // 0  1  2
        // 3     4
        // 5  6  7
        if (linkIndex == 0) return 3;
        if (linkIndex == 1) return 6;
        if (linkIndex == 2) return 4;
        return linkIndex;
    }

    // **** Then events! ****

    // This is an example of a closure!
    // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
    // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
    // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
    // This is our reference!
    var myState = this;

    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function (e) {
        e.preventDefault();
        return false;
    }, false);
    // Up, down, and move are for dragging
    canvas.addEventListener('mousedown', function (e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var l = shapes.length;

        myState.lastCtxMenuPoint = new Point(mouse.x, mouse.y);

        if (myState.isSelectDrag) {

            myState.selections.length = 0;
            myState.isSelectDrag = false;
        }

        // we are over a selection box
        // resize detected
        if (myState.expectResize !== -1) {
            myState.isResizeDrag = true;
            // stop here, do not check other things
            return;
        }

        // link making
        if (myState.expectLink !== -1) {
            myState.isLinkDrag = true;
            // stop here, do not check other things
            return;
        }

        // delete line button click
        if (myState.expectDelLine !== -1) {
            myState.isDel = true;
            // stop here, do not check other things
            return;
        }


        myState.dragging = false;
        var mySel = null;

        // store in each selected shape offset from mouse coordinates
        for (var i = myState.selections.length - 1; i >= 0; i--) {
            mySel = myState.selections[i];
            // Keep track of where in the object we clicked
            // so we can move it smoothly (see mousemove)
            myState.dragging = myState.dragging || (mySel.contains(mx, my));

            mySel.dragoffx = mx - mySel.x;
            mySel.dragoffy = my - mySel.y;

        }


        if (myState.dragging) {
            myState.valid = false;
        } else {
            if (!e.ctrlKey) {
                // invalid btns
                for (var i = myState.selections.length - 1; i >= 0; i--) {
                    myState.selections[i].hideBtns();
                    myState.valid = false; // Need to clear the old selection border
                }
                myState.selections.length = 0;
            }
        }


        // if no shape selected
        // check if mouse click is on a shape
        if ((myState.selections.length == 0) || (e.ctrlKey)) {

            for (var i = l - 1; i >= 0; i--) {
                if (shapes[i].contains(mx, my)) {
                    mySel = shapes[i];
                    // Keep track of where in the object we clicked
                    // so we can move it smoothly (see mousemove)
                    mySel.dragoffx = mx - mySel.x;
                    mySel.dragoffy = my - mySel.y;
                    myState.dragging = true;

                    //toggle Shape Selection
                    var pos = myState.selections.indexOf(mySel);
                    if (pos != -1) {
                        // delete from selection = hidebtn
                        mySel.hideBtns();
                        myState.selections.splice(pos, 1);
                        //myState.selection=null;
                    } else {
                        // add this shape to selectionArray
                        myState.selections.push(mySel);
                        //myState.setSelection(mySel);
                    }

                    //if (myState.selections.length>0)
                    // myState.selections[0].hideBtns();

                    myState.valid = false;
                    break;
                }
            }
        }

        // stop select frame drawing
        myState.selectFrame = null;

        // havent returned means we have failed to select anything.
        // If there was an object selected, we deselect it
        for (var i = myState.selections.length - 1; i >= 0; i--) {
            myState.selections[i].hideBtns();
            myState.valid = false; // Need to clear the old selection border
        }

        if (myState.selections.length > 0) return;

        // entered in multiselect mode, set isSelect true
        myState.selectFrame = new SimpleFrame(new Point(mx, my));
        myState.isSelectDrag = true;


    }, true);


    canvas.addEventListener('mousemove', function (e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;

        //console.log('dragging', myState.dragging, 'isSelectDrag(', myState.isSelectDrag ,',',myState.expectResize,') isResizeDrag', myState.isResizeDrag ,'isLinkDrag', myState.isLinkDrag );
        if (myState.dragging) {
            // We don't want to drag the object by its top-left corner, we want to drag it
            // from where we clicked. Thats why we saved the offset and use it here
            for (var i = 0; i < myState.selections.length; i++) {
                // calc offset for each selection
                // snap to nearest x, y
                myState.selections[i].x = myState.grid.nearest((mx - myState.selections[i].dragoffx));
                myState.selections[i].y = myState.grid.nearest((my - myState.selections[i].dragoffy));
            }

            myState.valid = false; // Something's dragging so we must redraw

        } else if ((myState.isSelectDrag) && (myState.selectFrame != null)) {
            // trace selection border
            myState.selectFrame.setDestinationCoord(new Point(mx, my));
            myState.updateSelections();
            myState.valid = false;

        } else if (myState.isResizeDrag) {
            myState.selections[0].resize(myState.expectResize, myState.grid.nearest(mx), myState.grid.nearest(my));
            myState.valid = false;
        } else if (myState.isLinkDrag) {

            //check if mouse over different shape of selection
            for (var i = myState.shapes.length - 1; i >= 0; i--) {
                if (myState.shapes[i].contains(mx, my)) {
                    var upShape = myState.shapes[i];
                    if (upShape != myState.selection) {
                        myState.canvas.style.cursor = 'copy';
                    }
                }
            }
            myState.valid = false;
        } else
            // Implements cursor when over handles
        if (myState.selections.length != 0 && !myState.isResizeDrag && typeof (myState.selections[myState.selections.length - 1]) != 'undefined') {
            if (typeof myState.selections[myState.selections.length - 1].drawHandles != "undefined") {
                myState.expectResize = myState.selections[myState.selections.length - 1].setCursor(myState, mx, my);
                // in selection, exit
                if (myState.expectResize != -1) return;

                // not over a selection box, return to normal
                myState.isResizeDrag = false;
                myState.expectResize = -1;
                this.style.cursor = 'auto';

            }
            if (typeof myState.selections[myState.selections.length - 1].drawLinks != "undefined") {
                myState.expectLink = linkToHandleIndex(myState.selections[myState.selections.length - 1].setLinkCursor(myState, mx, my));
                // in selection, exit
                if (myState.expectLink != -1) myState.canvas.title = 'delete link';
                if (myState.expectLink != -1) return;

                // not over a selection box, return to normal
                myState.canvas.title = '';
                myState.isLinkDrag = false;
                myState.expectLink = -1;
                this.style.cursor = 'auto';
            }

            myState.isDel = false;
            myState.expectDelLine = -1;

            // cursor on link delete
            for (var i = myState.lines.length - 1; i >= 0; i--) {
                if (myState.lines[i].setCursor(myState, mx, my)) {
                    myState.expectDelLine = i;
                }
                // in selection, exit
                if (myState.expectDelLine != -1) return;
            }
            // not over a selection box, return to normal
            myState.isDel = false;
            myState.expectDelLine = -1;
            this.style.cursor = 'auto';

        }


        // end of implementing move over handles
    }, true);


    window.addEventListener('keydown', function (e) {
        console.log(e.keyCode);
        switch (e.keyCode) {
            case 46:
                if (e.shiftKey) {
                    s.deleteSelection()
                }
                break;
            case 65: // a
                if (e.ctrlKey) {
                    s.selectAll();
                    e.preventDefault();
                }
                break;
            case 37: // <-
                s.moveSelection(direction.toLeft, (e.shiftKey) ? onePage : oneStep);
                break;
            case 38: // ^
                s.moveSelection(direction.toTop, (e.shiftKey) ? onePage : oneStep);
                break;
            case 39: // ->
                s.moveSelection(direction.toRight, (e.shiftKey) ? onePage : oneStep);
                break;
            case 40: // v
                s.moveSelection(direction.toBottom, (e.shiftKey) ? onePage : oneStep);
                break;
        }

    }, true);


    canvas.addEventListener('mouseup', function (e) {
        myState.dragging = false;
        myState.isResizeDrag = false;
        myState.expectResize = -1;

        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;

        if (myState.isLinkDrag) {
            var upShape = null;
            // si le link est d�j� existant, on le supprime.
            for (var i = myState.shapes.length - 1; i >= 0; i--) {
                if (myState.shapes[i].contains(mx, my)) {
                    upShape = myState.shapes[i];
                    // count down to prevent curent line deletion changing array size
                    for (var j = myState.lines.length - 1; j >= 0; j--) {
                        if (myState.lines[j].origin == myState.selections[myState.selections.length - 1] && myState.lines[j].destination == myState.shapes[i]) {
                            myState.deleteLine(myState.lines[j]);
                            myState.isLinkDrag = false;
                            myState.expectLink = -1;
                            myState.valid = false;
                        }
                    }
                }
            }

            if (myState.valid) {
                // si on est sur un Link <> link en cours, on cr�er le link
                for (var i = myState.shapes.length - 1; i >= 0; i--) {
                    if (myState.shapes[i].contains(mx, my)) {
                        upShape = myState.shapes[i];

                        myState.addLine(new Line(myState.selections[myState.selections.length - 1], myState.expectLink, upShape));
                        myState.isLinkDrag = false;
                        myState.expectLink = -1;
                        myState.valid = false;
                        return;
                    }
                }
                myState.valid = false;
            }
        }

        if (myState.isDel) {
            myState.lines.splice(myState.expectDelLine, 1);


            myState.isDel = false;
            myState.expectDelLine = -1;
            myState.valid = false;
            return;
        }

        // stop selecting Frame 
        myState.isSelectDrag = false;
        myState.selectFrame = null;
        myState.valid = false;


        if (myState.selections.length == 1) {
            callbackEvent(myState.selections[0]);
        } else {
            callbackEvent(myState);
        }
        myState.updMenu()

    }, true);

    // double click for making new shapes
    canvas.addEventListener('dblclick', function (e) {
        var mouse = myState.getMouse(e);
        myState.lastCtxMenuPoint = new Point(mouse.x, mouse.y);
        var updateObj = [{
            name: 'delete',
            disable: (myState.selections.length == 0)
        }];
        $('#canvas1')
            .contextMenu('update', updateObj)
            .contextMenu('open', {top: e.pageY, left: e.pageX});
    }, true);

    // **** Options! ****

    this.selectionColor = '#95B8E7'; //'#CC0000';
    this.selectionWidth = 2;
    this.interval = 30;
    setInterval(function () {
        myState.draw();
    }, myState.interval);
}

CanvasState.prototype.persistant = function () {
    return {
        'label': this.label,
        'description': this.description,
        'parameter': this.parameter,
        'w': this.w,
        'h': this.h,
        'gridsize': this.grid.size,
        'gridsnap': this.grid.snap,
        'autosize': this.autosize
    };
};

CanvasState.prototype.selectAll = function () {
    for (var i = 0; i < this.shapes.length; i++) {
        var pos = this.selections.indexOf(this.shapes[i]);
        if (pos == -1) {
            this.selections.push(this.shapes[i]);
        }
    }
    this.valid = false;
};

CanvasState.prototype.moveSelection = function (dir, offset) {
    for (var i = 0; i < this.selections.length; i++) {
        switch (dir) {
            case direction.toLeft:
                this.selections[i].x -= offset;
                break;
            case direction.toRight:
                this.selections[i].x += offset;
                break;
            case direction.toTop:
                this.selections[i].y -= offset;
                break;
            case direction.toBottom:
                this.selections[i].y += offset;
                break;
        }
        this.valid = false;
    }
};


CanvasState.prototype.tranform = function (sourceShape, destShapeClass) {
    // if sourceShape is not destShapeClass
    if (sourceShape.className != destShapeClass && sourceShape.className != 'Circle') {
        // create a new shape as destClass
        // get all properties label, x, y, w, h, ...
        var newShape = new window[destShapeClass](this, sourceShape.x, sourceShape.y, sourceShape.w, sourceShape.h, sourceShape.label, globalColor);

        for (var i = 0; i < this.lines.length; i++) {
            if (this.lines[i].origin == sourceShape) {
                this.addLine(new Line(newShape, this.lines[i].origineHandle, this.lines[i].destination));
            }
            if (this.lines[i].destination == sourceShape) {
                this.addLine(new Line(this.lines[i].origin, this.lines[i].origineHandle, newShape));
            }
        }

        this.addShape(newShape);


        //this.selections[this.selections.indexOf(sourceShape)]=newShape;

        this.selections = [];
        this.selections.push(newShape);
        //this.setSelection(newShape);

        //this.selection=newShape;

        // nil source & invalidate canvas
        this.deleteShape(sourceShape);

        this.valid = false;

    }
};

CanvasState.prototype.updateSelections = function () {
    // base to selectFrame
    // for each shape add to array selections if frame contains shape

    // deselect all = hide all butns
    for (var i = this.selections.length - 1; i >= 0; i--) {
        this.selections[i].hideBtns();
    }

    this.selections = [];
    for (var i = this.shapes.length - 1; i >= 0; i--) {
        if (this.shapes[i].isContained(this.selectFrame)) {
            this.selections.push(this.shapes[i]);
            this.valid = false;
        }
    }
};


CanvasState.prototype.updMenu = function () {
    var updateObj = [{
        name: 'delete',
        disable: (this.selections.length != 1)
    }];
    $('#canvas1').contextMenu('update', updateObj, {displayAround: 'cursor', position: 'auto'});
};


CanvasState.prototype.deleteShape = function (shape) {
    if ((shape != null) && (shape.getName() != 'Circle')) {
        var index = this.shapes.indexOf(shape);
        if (index != -1) {
            this.shapes[index].destroy();
            this.shapes.splice(index, 1);
        }
    }
};
CanvasState.prototype.download = function () {

    // resise canvas to fit graph
    var canvasw = this.w;
    var canvash = this.h;
    this.resize(true);

    setTimeout(function () {
        var dataURL = s.canvas.toDataURL('image/png');
        var save = document.createElement('a');

        save.href = dataURL;
        save.target = '_blank';
        save.download = (s.label || 'unknown') + '.png';

        if (save.dispatchEvent) {
            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", true, true);

            save.dispatchEvent(evt);
        } else {
            save.click();
        }
        s.setSize(canvasw, canvash);
    }, 50);
};

CanvasState.prototype.deleteSelection = function () {
    this.deleteShape(this.selection);
    this.selection = null;
    this.valid = false;
};

CanvasState.prototype.addShape = function (shape) {
    this.shapes.push(shape);
    this.valid = false;
};

CanvasState.prototype.addLine = function (line) {
    this.lines.push(line);
    this.valid = false;
};

CanvasState.prototype.deleteLine = function (line) {
    var index = line.destination.parents.indexOf(line.origin);
    if (index > -1) {
        line.destination.parents.splice(index, 1);
    }
    index = line.origin.children.indexOf(line.destination);
    if (index > -1) {
        line.origin.children.splice(index, 1);
    }
    index = this.lines.indexOf(line);
    if (index > -1) {
        this.lines.splice(index, 1);
    }
};

CanvasState.prototype.setSize = function (w, h) {
    this.w = w;
    this.h = h;

    this.canvas.width = w;
    this.canvas.height = h;
    this.valid = false;
};

CanvasState.prototype.resize = function (overrideauto) {
    var maxw = 0;
    var maxh = 0;
    if (this.autosize || overrideauto) {
        for (var i = this.shapes.length - 1; i >= 0; i--) {
            maxw = Math.max(maxw, this.shapes[i].x + this.shapes[i].w + canvasMargin);
            maxh = Math.max(maxh, this.shapes[i].y + this.shapes[i].h + canvasMargin);
        }
        this.setSize(maxw, maxh);
    }
};

/* use introspection to call back those methods in propoerty editor :do not erase */
//noinspection JSUnusedGlobalSymbols
CanvasState.prototype.setautosize = function (value) {
    this.autosize = value;
    this.resize(false);
};

//noinspection JSUnusedGlobalSymbols
CanvasState.prototype.setgridsnap = function (value) {
    this.grid.snap = value;
};

//noinspection JSUnusedGlobalSymbols
CanvasState.prototype.setgridsize = function (value) {
    this.grid.size = value;
    setGrid();
};


CanvasState.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
};

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function () {
    // if our state is invalid, redraw and validate!
    if (!this.valid) {

        this.canvas.width = this.w;
        this.canvas.height = this.h;

        this.resize(false);

        var ctx = this.ctx;
        var shapes = this.shapes;
        var lines = this.lines;
        this.clear();

        // draw all shapes
        var l = shapes.length;
        for (var i = 0; i < l; i++) {
            if (shapes[i] != this.selection) {
                var shape = shapes[i];
                // We can skip the drawing of elements that have moved off the screen:
                if (shape.x > this.width || shape.y > this.height ||
                    shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
                shapes[i].draw(ctx);
            }
        }

        var mySel = null;
        // draw selection
        // right now this is just a stroke along the edge of the selected Shape
        if (this.selections.length > 0) {
            this.selections[this.selections.length - 1].draw(ctx);

            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
            mySel = this.selections[this.selections.length - 1];
            mySel.drawStroke(ctx);
            //this.drawHandles(ctx, mySel);
            if (typeof mySel.drawHandles != "undefined")
                mySel.drawHandles(ctx);

            if (typeof mySel.drawLinks != "undefined")
                mySel.drawLinks(ctx);

        }

        if (this.selections.length > 0) {
            for (var i = 0; i < this.selections.length; i++) {
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                mySel = this.selections[i];
                mySel.drawStroke(ctx);
                //this.drawHandles(ctx, mySel);
                if (typeof mySel.drawHandles != "undefined")
                    mySel.drawHandles(ctx);

                if (typeof mySel.drawLinks != "undefined")
                    mySel.drawLinks(ctx);
            }
        }

        // draw lines
        var l = lines.length;
        for (var i = 0; i < l; i++) {
            lines[i].draw(ctx);
        }

        // draw selectBox
        if (this.selectFrame != null) {
            this.selectFrame.draw(ctx);
        }

        // ** Add stuff you want drawn on top all the time here **
        this.valid = true;
    }
};

// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function (e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

    // Compute the total offset
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    if (this.canvas.parentNode !== undefined) {
        offsetX -= this.canvas.parentNode.scrollLeft;
        offsetY -= this.canvas.parentNode.scrollTop;
    }

    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    // We return a simple javascript object (a hash) with x and y defined
    return {x: mx, y: my};
};

function callbackEvent(e) {
    showPropertyEditor(e);
}


function showPropertyEditor(obj) {
    $('#propGrid').jqPropertyGrid(obj.persistant(), theMeta, function (property, value) {
        if (propertiesTypes[property] == 'className') {
            s.tranform(obj, value);
        } else if (propertiesTypes[property] == 'int') {
            if (typeof obj['set' + property] != 'undefined') {
                obj['set' + property](value);
            } else
                obj[property] = parseInt(value);
        } else if (propertiesTypes[property] == 'boolean') {
            if (typeof obj['set' + property] != 'undefined') {
                obj['set' + property](value);
            } else
                obj[property] = value;
        } else if (propertiesTypes[property] == 'string') {
            obj[property] = value;
        }
        s.valid = false;
    });
}

function setGrid() {
    if (s.grid.active) {
        var elt = document.getElementById('canvas1');
        elt.setAttribute("style", '	 background-image: -webkit-repeating-radial-gradient(center center, ' + s.grid.color + ', ' + s.grid.color + ' 1px, transparent 1px, transparent 100%);' +
            '  background-image: -moz-repeating-radial-gradient(center center, ' + s.grid.color + ', ' + s.grid.color + ' 1px, transparent 1px, transparent 100%);' +
            '  background-image: -ms-repeating-radial-gradient(center center, ' + s.grid.color + ', ' + s.grid.color + ' 1px, transparent 1px, transparent 100%);' +
            '  background-image: repeating-radial-gradient(center center, ' + s.grid.color + ', ' + s.grid.color + ' 1px, transparent 1px, transparent 100%);' +
            '  -webkit-background-size: ' + s.grid.size + 'px ' + s.grid.size + 'px;-moz-background-size: ' + s.grid.size + 'px ' + s.grid.size + 'px;background-size: ' + s.grid.size + 'px ' + s.grid.size + 'px;' +
            '  background-position:' + (s.grid.size / 2) + 'px');
    }
}

function init() {
    // init main canvas
    s = new CanvasState(document.getElementById('canvas1'));

    // grid setup
    setGrid();

    // create shapes (for example)
    var begin = new Circle(s, 280, 5, 40, 40, 'start');
    s.addShape(begin);

    var answerYes = new Box(s, 340, 170, 160, 90, 'Answer: Yes \n then do ...', globalColor);
    s.addShape(answerYes);

    var answerNo = new Box(s, 50, 200, 160, 90, 'Answer is No \n so do ...', globalColor);
    s.addShape(answerNo);

    // Lets make some partially transparent
    var asq2 = new Diamond(s, 30, 330, 160, 90, 'Another test\nwith a newline\nand another one', globalColor);
    s.addShape(asq2);

    var asq = new Diamond(s, 220, 70, 160, 90, '1st question\n so what ?', globalColor);
    s.addShape(asq);

    var doc = new Doc(s, 420, 200, 160, 100, 'one', globalColor);
    s.addShape(doc);

    // add lines between shapes
    s.addLine(new Line(asq, HANDLE.RIGHT, answerYes));
    s.addLine(new Line(answerNo, HANDLE.LEFT, answerNo));
    s.addLine(new Line(begin, HANDLE.BOTTOM, asq));
    s.addLine(new Line(asq, HANDLE.LEFT, answerNo));
    s.addLine(new Line(answerNo, HANDLE.LEFT, answerNo));
    s.addLine(new Line(answerNo, HANDLE.BOTTOM, asq2));
    s.addLine(new Line(asq2, HANDLE.LEFT, asq));

    s.addLine(new Line(asq, HANDLE.BOTTOM, doc));

    showPropertyEditor(s);
}

/*
init Property editor on ready
 */
$(function () {
    $('#canvas1').contextMenu(menu, {
            triggerOn: 'contextmenu',
            displayAround: 'cursor',
            top: 'auto',
            left: 'auto'
        }
    );
});
