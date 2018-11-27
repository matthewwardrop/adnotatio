'use strict';

export function greedyHandler(func, ...args) {
    if (func === undefined) func = () => {};
    return function (e) {
        e.stopPropagation();
        func(...args);
    };
}


export function asPromise(func, ...args) {
    return Promise.resolve(func(...args));
}
