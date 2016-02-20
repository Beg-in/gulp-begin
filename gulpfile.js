'use strict';

var begin = require('./gulp-begin');
var gulp = require('gulp');

gulp.task('default', ['test']);

begin(gulp, {
  test: {
    main: 'test/test.js'
  },
  exclude: ['server'],
  warnExclusions: true
});
