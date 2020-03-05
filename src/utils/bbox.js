export class Coord {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

}

export class BoundingBox {

    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    get right() {
        return this.left + this.width;
    }

    get bottom() {
        return this.top + this.height;
    }

    getRelativeAnchor(xr, yr) {
        return new Coord(this.left + xr * this.width, this.top + yr * this.height);
    }

    get topleft() {
        return this.getRelativeAnchor(0, 0);
    }

    get topmiddle() {
        return this.getRelativeAnchor(0.5, 0);
    }

    get topright() {
        return this.getRelativeAnchor(1, 0);
    }

    get middleleft() {
        return this.getRelativeAnchor(0, 0.5);
    }

    get center() {
        return this.getRelativeAnchor(0.5, 0.5);
    }

    get middleright() {
        return this.getRelativeAnchor(1, 0.5);
    }

    get bottomleft() {
        return this.getRelativeAnchor(0, 1);
    }

    get bottommiddle() {
        return this.getRelativeAnchor(0.5, 1);
    }

    get bottomright() {
        return this.getRelativeAnchor(1, 1);
    }

    union(other) {
        if (!other) return this;
        return new BoundingBox(
            Math.min(this.left, other.left),
            Math.min(this.top, other.top),
            Math.max(this.right, other.right) - Math.min(this.left, other.left),
            Math.max(this.bottom, other.bottom) - Math.min(this.top, other.top)
        );
    }

}
