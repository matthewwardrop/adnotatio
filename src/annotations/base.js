'use strict';

export default class Annotation {

    // constructors

    static TYPE = undefined;
    static IMPLEMENTATION = 'default';

    constructor(spec) {
        this.spec = spec;
        if (!this.validate()) {
            throw "Invalid annotation spec."
        }
    }

    static fromSpec(spec) {
        return new this(spec);
    }

    static get_spec_base() {
        return {
            type: this.TYPE,
            implementation: this.IMPLEMENTATION
        }
    }

    // validation

    validate() {
        if (this.spec.type !== this.constructor.TYPE || this.spec.implementation !== this.constructor.IMPLEMENTATION) {
            return false;
        }
        return true;
    }

    // converters

    toSpec() {
        return this.spec;
    }

    toJSON() {  // alias for toSpec
        return this.toSpec();
    }

}
