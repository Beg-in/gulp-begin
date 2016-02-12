'use strict';

var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var merge = require('merge2');
var gp = require('gulp-load-plugins')({
    rename: {
        'gulp-cssnano': 'cssmin',
        'gulp-ng-annotate': 'ngAnnotate',
        'gulp-angular-templatecache': 'ngTemplates'
    }
});
var del = require('del');
gp.livereload = require('tiny-lr')();

/**
 * ## Build
 * ### Requirements
 * - [Postgresql](http://www.postgresql.org/)
 *
 * #### Setup
 * ```bash
 * $ npm run setup
 * $ npm install
 * ```
 * This installs the following globally:
 * - [Gulp](http://gulpjs.com/)
 * - [Bower](http://bower.io/)
 * - [Node Foreman](http://strongloop.github.io/node-foreman/)
 * - [Node Inspector](https://github.com/node-inspector/node-inspector)
 *
 * Add a file called `.env` to the root of the project with the following contents:
 * ```json
 * {
 *     "node": {
 *         "env": "dev"
 *     }
 * }
 * ```
 * You can now run the development server by running the following commands:
 * ```bash
 * $ npm start
 * ```
 *
 * - You can now visit [http://localhost:8081/](http://localhost:8081/) to view changes live.
 *
 * #### Directories
 * - `src/client` - clientside html, scripts, and styles
 * - `src/server` - serverside scripts and sql queries
 *
 * #### Serverside runtime
 * - Uses dependency injection from [Nodep](http://nodep.org)
 *
 * ### Running the test suite
 * #### Single Run:
 * ```bash
 * $ gulp test
 * ```
 * #### Continuous testing when files are changed:
 * ```bash
 * $ gulp autotest
 * ```
 * ### Generating README.md
 * ```bash
 * $ gulp docs
 * ```
 * ### Generating CHANGELOG.md
 * ```bash
 * $ gulp changelog
 * ```
 * ### Notes
 * - jshint is part of the test suite and should be kept clean
 * - Commits should have high test coverage
 * - Docs should be kept up to date
 * - Additions should come with documentation
 * - commit messages should follow [Angular conventional format](https://github.com/stevemao/conventional-changelog-angular/blob/master/convention.md)
 * @module build
 */
module.exports = function(gulp, options) {
    var log = function() {
        var args = _.map(arguments, arg => gp.util.colors.green(arg));
        args.unshift(gp.util.colors.green('[server]'));
        gp.util.log.apply(gp.util, args);
    };

    options = _.defaultsDeep(options, {
        root: process.cwd(),
        port: process.env.PORT,
        server: {
            cwd: 'src/server',
            main: 'index.js',
            watch: [
                path.join(_.get(options, 'server.cwd', 'src/server'), '**/*.js'),
                '*.js'
            ]
        },
        client: {
            lib: 'bower_components',
            cwd: 'src/client',
            dest: 'public',
            html: {
                src: ['*.html']
            },
            scripts: {
                cwd: 'scripts',
                dest: 'app.min.js',
                lib: [],
                src: [
                    '*.js',
                    '*/**/*.js'
                ]
            },
            styles: {
                cwd: 'styles',
                dest: 'app.min.css',
                include: {
                    lib: [],
                    src: ['styles']
                },
                src: ['styles.scss']
            },
            templates: {
                cwd: 'views',
                src: ['**/*.html']
            },
            images: {
                cwd: 'images',
                src: ['**/*.png']
            }
        },
        test: {
            main: 'spec.js',
            watch: ['test/**/*.js']
        }
    });

    var buildFiles = function(scope, type) {
        var arr = [];
        if(type === 'lib') {
            arr.push(options.client.lib);
        } else {
            if(options.client.cwd) {
                arr.push(options.client.cwd);
            }
            if(scope.cwd) {
                arr.push(scope.cwd);
            }
        }
        return scope[type].map(file =>
            path.join.apply(path, arr.concat([file]))
        );
    };
    var buildSrc = scope => buildFiles(scope, 'src');
    var buildLib = scope => buildFiles(scope, 'lib');
    var files = {
        src: {
            html: buildSrc(options.client.html),
            templates: buildSrc(options.client.templates),
            scripts: buildSrc(options.client.scripts),
            styles: {
                main: buildSrc(options.client.styles),
                include: options.client.styles.include.src.map(file =>
                    path.join(options.client.cwd, file)
                ),
            },
            images: buildSrc(options.client.images)
        },
        lib: {
            scripts: buildLib(options.client.scripts),
            styles: {
                include: options.client.styles.include.lib.map(file =>
                    path.join(options.client.lib, file)
                )
            }
        }
    };

    var name = task => options.prefix ? `${options.prefix}_${task}` : task;

    gulp.task(name('html'), function() {
        del.sync(files.src.html);
        return gulp.src(files.src.html)
            .pipe(gp.htmlmin({collapseWhitespace: true}))
            .pipe(gulp.dest(options.client.dest));
    });

    gulp.task(name('jshint'), function() {
        return gulp.src(_.flatten([
                files.src.scripts,
                options.server.watch,
                options.test.watch
            ]))
            .pipe(gp.jshint())
            .pipe(gp.jshint.reporter(require('jshint-stylish')));
            //.pipe(jshint.reporter('fail'));
    });

    gulp.task(name('scripts'), [name('jshint')], function() {
        var src = merge(
            gulp.src(files.lib.scripts)
                .pipe(gp.concat('libs.js')),
            gulp.src(files.src.templates)
                .pipe(gp.htmlmin({collapseWhitespace: true}))
                .pipe(gp.ngTemplates('templates.js', {
                    standalone: true
                })),
            gulp.src(files.src.scripts)
                .pipe(gp.sourcemaps.init())
                .pipe(gp.babel())
                .pipe(gp.ngAnnotate({
                    'single_quotes': true
                }))
        );
        src = src.pipe(gp.debug({title: 'scripts'}));
        // src = src.pipe(gp.plumber({errorHandler: true}));
        return src
            .pipe(gp.concat(options.client.scripts.dest))
            .pipe(gp.uglify())
            .pipe(gp.sourcemaps.write('.'))
            .pipe(gulp.dest(path.join(options.client.dest, options.client.scripts.cwd)));
    });

    gulp.task(name('styles'), function() {
        var src = gulp.src(files.src.styles.main);
        // src = src.pipe(gp.debug({title: 'styles'}));
        return src
            .pipe(gp.sourcemaps.init({loadMaps: true}))
            .pipe(gp.plumber())
            .pipe(gp.sass({
                includePaths: _.flatten([
                    files.lib.styles.include,
                    files.src.styles.include
                ])
            }))
            .pipe(gp.autoprefixer())
            .pipe(gp.concat(options.client.styles.dest))
            .pipe(gp.cssmin())
            .pipe(gp.sourcemaps.write('.'))
            .pipe(gulp.dest(path.join(options.client.dest, options.client.styles.cwd)));
    });

    gulp.task(name('images'), function() {
        del.sync(files.src.images);
        return gulp.src(files.src.images)
            .pipe(gp.imagemin())
            .pipe(gulp.dest(path.join(options.client.dest, options.client.images.cwd)));
    });

    gulp.task(name('build'), [
        name('html'),
        name('styles'),
        name('scripts'),
        name('images')
    ]);

    var server = function() {
        gulp.watch(files.src.html, [name('html')]);
        gulp.watch(_.flatten([
            files.src.scripts,
            files.src.templates,
            files.lib.scripts
        ]), [name('scripts')]);
        gulp.watch(_.flatten([
            files.src.styles.main,
            files.src.styles.include,
            files.lib.styles.include
        ])[name('styles')]);
        gulp.watch(files.src.images, [name('images')]);

        var reloadable = function(file, cb) {
            gulp.watch(file, function(event) {
                if(event.path.indexOf(file) === -1) {
                    return;
                }
                cb();
            });
        };
        reloadable('gulpfile.js', function() {
            log('gulpfile.js changed, reloading server...');
            process.exit(0);
        });
        reloadable('package.json', function() {
            log('package.json changed, installing packages...');
            cp.execSync('npm install', {stdio: 'inherit'});
            cp.execSync('npm prune', {stdio: 'inherit'});
            process.exit(0);
        });
        reloadable('bower.json', function() {
            log('bower.json changed, installing packages...');
            cp.execSync('bower install', {stdio: 'inherit'});
            cp.spawn('gulp' + (process.platform === 'win32' ? '.cmd' : ''), [name('build')], {stdio: 'inherit'}).on('close', function(code) {
                process.exit(code);
            });
        });

        gp.nodemon({
          script: options.server.main,
          watch: options.server.watch
        }).on('restart', function() {
            log('app restarted!');
        }).on('crash', function() {
            log('app crashed!');
        }).on('quit', function() {
            log('app exited!');
            process.exit();
        });
        /*
        process.on('SIGINT', function() {
            nodemon.on('exit', function() {
                log('app exited!');
                process.exit();
            });
        });
        */
        log('app started on port', options.port);

        gp.livereload.listen(35729);
        gulp.watch(path.join(options.client.dest, '**/*'), function(event){
            log('livereload initiated');
            setTimeout(function() {
                gp.livereload.changed({
                    body: {
                        files: [path.relative('' + options.port, event.path)]
                    }
                });
            }, 1000);
        });
    };
    gulp.task(name('server'), [name('build')], server);
    gulp.task(name('demon'), server);

    gulp.task('dev', function() {
        cp.execSync('npm install', {stdio: 'inherit'});
        var spawnChild = function() {
            cp.spawn('gulp' + (process.platform === 'win32' ? '.cmd' : ''), [name('demon')], {stdio: 'inherit'}).on('close', function(code) {
                if(code === 0) {
                    spawnChild();
                }
            });
        };
        spawnChild();
    });

    gulp.task(name('test'), [name('jshint')], function() {
        return gulp.src(options.server.watch)
            .pipe(gp.istanbul())
            .pipe(gp.istanbul.hookRequire())
            .on('finish', function() {
                gulp.src(options.test.main)
                    .pipe(gp.mocha())
                    .pipe(gp.istanbul.writeReports());
            });
    });

    gulp.task(name('autotest'), function() {
        gulp.watch(_.flatten([options.server.watch, options.test.watch]), ['test']);
    });

    gulp.task(name('docs'), function() {
        return gulp.src(_.flatten([['gulpfile.js'], options.server.watch, options.test.watch, files.src.scripts]))
            .pipe(gp.concat('README.md'))
            .pipe(gp.jsdocToMarkdown({
                template: fs.readFileSync('./docs.hbs', 'utf8')
            })).pipe(gulp.dest('.'));
    });

    gulp.task(name('changelog'), function() {
        return gulp.src('CHANGELOG.md')
            .pipe(gp.conventionalChangelog({
                preset: 'angular'
            })).pipe(gulp.dest('.'));
    });
};
