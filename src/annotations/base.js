import { AnnotationSpecMalformed, NotImplementedError } from '../utils/errors';

export default class Annotation {

    // constructors

    static TYPE = undefined;
    static IMPLEMENTATION = 'default';

    constructor(spec) {
        this.spec = spec;
        if (!this.validate()) {
            throw new AnnotationSpecMalformed('Invalid annotation spec.');
        }
    }

    description() {}

    static fromSpec(spec) {
        return new this(spec);
    }

    static getSpecBase() {
        return {
            type: this.TYPE,
            implementation: this.IMPLEMENTATION,
        };
    }

    // validation

    validate() {
        if (this.spec.type !== this.constructor.TYPE || this.spec.implementation !== this.constructor.IMPLEMENTATION) {
            return false;
        }
        return true;
    }

    isOrphaned(root) {
        throw new NotImplementedError();
    }

    // converters

    toSpec() {
        return this.spec;
    }

    toJSON() { // alias for toSpec
        return this.toSpec();
    }

    // rendering

    render(root, bglayer, fglayer, onclick = null, onmouseover = null, onmouseout = null) {
        throw new NotImplementedError();
    }

    getBoundingBox(root, bglayer, fglayer) {
        throw new NotImplementedError();
    }

}
