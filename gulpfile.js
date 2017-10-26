var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var path = require('path');
const imagemin = require('gulp-imagemin');
var ghPages = require('gulp-gh-pages');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminPngquant = require('imagemin-pngquant');
var critical = require('critical');

// Set the banner content
var banner = ['/*!\n',
    ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
    ' */\n',
    ''
].join('');

var buildPath = 'dist/';

// Compiles SCSS files from /scss into /css
gulp.task('sass', function() {
    return gulp.src('scss/new-age.scss')
        .pipe(sass())
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest(path.join(buildPath, 'css')))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('sass-and-min', function() {
    return gulp.src('scss/new-age.scss')
        .pipe(sass())
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(cleanCSS({
            compatibility: 'ie8'
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(path.join(buildPath, 'css')))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['sass'], function() {
    return gulp.src(['css/new-age.css'])
        .pipe(cleanCSS({
            compatibility: 'ie8'
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(path.join(buildPath, 'css')))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify custom JS
gulp.task('minify-js', function() {
    return gulp.src('js/new-age.js')
        .pipe(uglify())
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(path.join(buildPath, 'js')))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
gulp.task('copy', function() {
    gulp.src([
            'node_modules/bootstrap/dist/**/*',
            '!**/npm.js',
            '!**/bootstrap-theme.*',
            '!**/*.map'
        ])
        .pipe(gulp.dest(path.join(buildPath, 'vendor/bootstrap')))

    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest(path.join(buildPath, 'vendor/jquery')))

    gulp.src(['node_modules/jquery.easing/*.js'])
        .pipe(gulp.dest(path.join(buildPath, 'vendor/jquery-easing')))

    gulp.src(['node_modules/simple-line-icons/*/*'])
        .pipe(gulp.dest(path.join(buildPath, 'vendor/simple-line-icons')))

    gulp.src(['index.html'])
        .pipe(gulp.dest(path.join(buildPath, '')));

    gulp.src(['device-mockups/**/*.css'])
        .pipe(gulp.dest(path.join(buildPath, 'device-mockups/')));

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest(path.join(buildPath, 'vendor/font-awesome')))
});

gulp.task('images', function() {
    gulp.src(['img/**/*'])
        .pipe(gulp.dest(path.join(buildPath, 'img/')));

    gulp.src(['device-mockups/**/*.png'])
        .pipe(gulp.dest(path.join(buildPath, 'device-mockups/')));
});

gulp.task('images-dist', function() {
    gulp.src(['img/**/*'])
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imageminJpegRecompress({
                progressive: true,
                max: 80,
                min: 70
            }),
            imageminPngquant({ quality: '75-85' }),
            imagemin.svgo({ plugins: [{ removeViewBox: false }] })
        ]))
        .pipe(gulp.dest(path.join(buildPath, 'img/')));

    gulp.src(['device-mockups/**/*.png'])
        //.pipe(imagemin())
        .pipe(gulp.dest(path.join(buildPath, 'device-mockups/')));
});

// Default task
gulp.task('default', ['sass-and-min', 'minify-css', 'minify-js', 'images-dist', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: buildPath
        },
    })
})

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'sass', 'minify-css', 'minify-js', 'images', 'copy'], function() {
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('css/*.css', ['minify-css']);
    gulp.watch('js/*.js', ['minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload);
    gulp.watch('js/**/*.js', browserSync.reload);
});

gulp.task('deploy', ['default', 'critical'], function() {
    return gulp.src('./dist/**/*')
        .pipe(ghPages());
});

gulp.task('optimize-css', function() {
    return gulp.src('css/*.css')
        .pipe(autoprefixer())
        .pipe(uncss({
            html: ['_site/**/*.html'],
            ignore: []
        }))
        .pipe(minifyCss({ keepBreaks: false }))
        .pipe(gulp.dest(path.join(buildPath, 'css/')));
});

gulp.task('critical', ['default'], function(cb) {
    critical.generate({
        inline: true,
        base: 'dist/',
        src: 'index.html',
        dest: 'index.html',
        minify: true,
        width: 800,
        height: 600
    }, cb.bind(cb));
});