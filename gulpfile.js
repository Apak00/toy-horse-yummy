let gulp = require("gulp");
let sass = require("gulp-sass");
let browserSync = require("browser-sync").create();

let useref = require("gulp-useref");
let uglify = require('gulp-uglifyes');
let gulpIf = require('gulp-if');
let cssnano = require("gulp-cssnano");

gulp.task("sass", function () {
    //all kind a stuff!
    return gulp.src("app/Sass/mySass.scss")
        .pipe(sass())
        .pipe(gulp.dest("app/css"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task("watch", ["browserSync", "sass", ], function(){
    gulp.watch("app/Sass/**/*.scss", ["sass"]);
    gulp.watch("app/*.html", browserSync.reload);
    gulp.watch("app/js/**/*.js", browserSync.reload);
    // Other watchers
});


gulp.task("browserSync", function() {
    browserSync.init({
        server: {
            baseDir: "app"
        },
    })
});

gulp.task("useref", function () {
        return gulp.src('app/*.html')
            .pipe(useref())
            .pipe(gulpIf('*.js', uglify()))
            .pipe(gulpIf("*.css", cssnano()))
            .pipe(gulp.dest('dist'));

});