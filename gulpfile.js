const { src, dest, parallel, watch, series } = require('gulp');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');
const less = require('gulp-less');
const merge = require('merge2');
const through = require('through2');
const path = require('path');
const concat = require('gulp-concat');
const spawn = require('cross-spawn');
const babel = require('gulp-babel');

function compileTS() {
  const tsResult = src(['src/**/*.tsx', 'src/*.ts']).pipe(ts.createProject('tsconfig.json')());

  return merge([
    tsResult.dts
      .pipe(replace(/import\s+([\'\"])[\.\/\\a-zA-Z0-9_]+\.less\1;/, ''))
      .pipe(dest('lib')),
    tsResult.js
      .pipe(
        babel({
          plugins: [
            [
              'babel-plugin-import',
              {
                libraryName: 'antd',
                libraryDirectory: 'es',
                style: true,
              },
              'antd',
            ],
            [
              'babel-plugin-import',
              {
                libraryName: 'lodash',
                libraryDirectory: '',
                camel2DashComponentName: false,
              },
              'lodash',
            ],
          ],
        }),
      )
      .pipe(dest('lib')),
  ]);
}

function moveLess() {
  return src('src/**/*.less')
    .pipe(dest('lib'))
    .pipe(
      less({
        javascriptEnabled: true,
      }),
    )
    .pipe(dest('lib'));
}

function watchFiles() {
  watch(['src/**/*.(ts|tsx)', 'tsconfig.json'], compileTS);

  watch(['src/**/*.less'], processLess);
}

const processLess = moveLess;

exports.dev = series(parallel(compileTS, processLess), watchFiles);

exports.default = series(parallel(compileTS, processLess));
