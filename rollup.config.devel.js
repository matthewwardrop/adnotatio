import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'src/adnotatio.js',
    external: ['react'],
    output: [
        {
            file: 'dist/adnotatio.js',
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
        postcss()
    ]
};
