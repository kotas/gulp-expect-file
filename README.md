```
Under development (not on npm repository)
```

# gulp-expect-file
> Expectation on generated files for gulp 3

This plugin is normally used for testing other gulp plugin.

## Usage

First, install `gulp-expect-file` as a development dependency:

```shell
npm install --save-dev kotas/gulp-expect-file
```

Then, add it to your `gulpfile.js`:

```js
var expect = require('gulp-expect-file');

gulp.task('compile', function(){
  gulp.src(['src/foo.txt'])
    .pipe(gulp.dest('dest/'))
    .pipe(expect('dest/foo.txt'))
});
```
