import Annotation from './base';
import {AnnotationClassNotFound, AnnotationSpecMalformed} from '../utils/errors';


export default class AnnotationFactory {

    constructor(classes) {
        this.registry = {};
        classes.forEach((cls) => this.register(cls));
    }

    register(cls) {
        if (!(cls.prototype instanceof Annotation)) {
            throw new Error("Object provided to `AnnotationFactory` is not a subclass of `Annotation`.");
        }
        if (!(cls.TYPE in this.registry)) {
            this.registry[cls.TYPE] = {};
        }
        this.registry[cls.TYPE][cls.IMPLEMENTATION] = cls;
    }

    classForType(type, implementation='default') {
        if (!(type in this.registry) || !(implementation in this.registry[type]) ) {
            throw new AnnotationClassNotFound(
                "No Annotation subclass found for type '" + type +
                "' and implementation '" + implementation + "'."
            );
        }
        return this.registry[type][implementation];
    }

    fromSpec(spec) {
        if (!("type" in spec) || !("implementation" in spec)) {
            throw new AnnotationSpecMalformed("Annotation spec is missing 'type' and/or 'implementation' keys.")
        }
        if (!(spec.type in this.registry) || !(spec.implementation in this.registry[spec.type])) {
            throw new AnnotationClassNotFound(
                "No Annotation subclass found for type '" + spec.type +
                "' and implementation '" + spec.implementation + "'."
            );
        }
        return new this.registry[spec.type][spec.implementation](spec);
    }

}
