import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import {uglify} from "rollup-plugin-uglify";
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'src/adnotatio.js',
    external: ['react'],
    output: [
        {
            file: 'dist/adnotatio.min.js',
            format: 'cjs'
        }
    ],
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        }),
        uglify(),
        postcss()
    ]
};
