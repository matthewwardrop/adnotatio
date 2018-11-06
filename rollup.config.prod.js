import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import {uglify} from "rollup-plugin-uglify";
import postcss from 'rollup-plugin-postcss';

const dependencies = Object.keys(require('./package.json').dependencies);


export default {
    input: 'src/index.js',
    external: dependencies,
    output: [
        {
            file: 'dist/adnotatio.min.js',
            format: 'cjs'
        }
    ],
    plugins: [
        resolve(),
        commonjs({
            exclude: ['src/**']
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        uglify(),
        postcss()
    ]
};
