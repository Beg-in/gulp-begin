# gulp-begin


## Using `gulp-begin`

Here's an example
```javascript
var begin = require('gulp-begin');
var gulp = require('gulp');

gulp.task('default', ['test']);

begin(gulp, {
  test: {
    main: 'test/myTestRunner.js'
  },
  exclude: ['server'],
  warnExclusions: true
});
```

### `begin(gulp, options)`
`TODO`

#### `options.exclude`
An array of task names to exclude from `gulp`.

#### `options.warnExclusions`
If this field is set to a truthy value, `gulp-begin` will warn if a `gulp`
command is run with an excluded task.


## Default Server

`TODO`


## Default Tasks

### `html`

This task will minify HTML in `files/src/html` and place the minified
version in the client destination directory.

### `jshint`

This task runs the `jshint` linter on source files and reports the
results in a stylish manner.

### `scripts`
`TODO`

### `styles`
`TODO`

### `build`
`TODO`

### `server`
`TODO`

### `demon`
`TODO`

### `dev`
`TODO`

### `test`
`TODO`

### `autotest`
`TODO`

### `docs`
`TODO`

### `changelog`
`TODO`


## Build
### Requirements
- [Postgresql](http://www.postgresql.org/)

#### Setup
```bash
$ npm run setup
$ npm install
```
This installs the following globally:
- [Gulp](http://gulpjs.com/)
- [Bower](http://bower.io/)
- [Node Foreman](http://strongloop.github.io/node-foreman/)
- [Node Inspector](https://github.com/node-inspector/node-inspector)

Add a file called `.env` to the root of the project with the following contents:
```json
{
    "node": {
        "env": "dev"
    }
}
```
You can now run the development server by running the following commands:
```bash
$ npm start
```

- You can now visit [http://localhost:8081/](http://localhost:8081/) to view changes live.

#### Directories
- `src/client` - clientside html, scripts, and styles
- `src/server` - serverside scripts and sql queries

#### Serverside runtime
- Uses dependency injection from [Nodep](http://nodep.org)

### Running the test suite
#### Single Run:
```bash
$ gulp test
```
#### Continuous testing when files are changed:
```bash
$ gulp autotest
```
### Generating README.md
```bash
$ gulp docs
```
### Generating CHANGELOG.md
```bash
$ gulp changelog
```
### Notes
- jshint is part of the test suite and should be kept clean
- Commits should have high test coverage
- Docs should be kept up to date
- Additions should come with documentation
- commit messages should follow [Angular conventional format](https://github.com/stevemao/conventional-changelog-angular/blob/master/convention.md)


# License
[The MIT License (MIT)](http://www.opensource.org/licenses/mit-license.html)

Copyright (c) 2016 Beg.in

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


