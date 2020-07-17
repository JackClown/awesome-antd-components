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
  const tsResult = src(['src/**/*.tsx', 'src/*.ts'])
    .pipe(replace(/import\s+([\'\"])[\.\/\\a-zA-Z0-9_]+\.less\1;/, ''))
    .pipe(ts.createProject('tsconfig.json')());

  return merge([
    tsResult.dts.pipe(dest('lib')),
    tsResult.js
      .pipe(
        babel({
          plugins: [
            [
              'babel-plugin-import',
              {
                libraryName: 'antd',
                libraryDirectory: 'lib',
                style: false,
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
  return src('src/**/*.less').pipe(dest('lib'));
}

function compileLess() {
  return src('src/**/*.less', { buffer: false })
    .pipe(
      through.obj((file, _, cb) => {
        const content = `@import './${path.relative(path.resolve(__dirname, 'src'), file.path)}';`;

        file.contents = Buffer.from(content);

        cb(null, file);
      }),
    )
    .pipe(concat('index.less'))
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

function webpack() {
  spawn('npm', ['run', 'dev:webpack'], { stdio: 'inherit' });
}

const processLess = series(moveLess, compileLess);

exports.dev = series(parallel(compileTS, processLess), parallel(watchFiles, webpack));

exports.default = parallel(compileTS, processLess);
