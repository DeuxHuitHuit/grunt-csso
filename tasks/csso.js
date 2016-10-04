/*
 * grunt-csso
 * http://github.com/t32k/grunt-csso
 *
 * Copyright (c) 2013 Koji Ishimoto
 * Licensed under the MIT license.
 */
'use strict';

module.exports = (grunt) => {
  const fs = require('fs');
  const path = require('path');
  const csso = require('csso');
  const chalk = require('chalk');
  const maxmin = require('maxmin');

  grunt.registerMultiTask('csso', 'Minify CSS files with CSSO.', function () {
    const now = () => (new Date()).getTime();
    const options = this.options({
      restructure: true,
      banner: '',
      report: false,
      debug: false
    });
    const done = (() => {
      const start = now();
      const done = this.async();
      return () => {
        if (options.report) {
          grunt.log.writeln('Executed in %d ms', now() - start);
        }
        return done();
      };
    })();
    // Process banner.
    const banner = grunt.template.process(options.banner);

    this.files.forEach((file) => {
      const dest = file.dest || file.src[0];

      // 1. Check existence
      // 2. Check file extension
      // 3. Load and concatenate css files
      const original = file.src.filter((p) => {
        if (!fs.existsSync(p)) {
          grunt.log.warn('Source file "' + p + '" is not found.');
          return false;
        } else {
          return true;
        }
      }).filter((p) => {
        if (path.extname(p) !== '.css') {
          grunt.log.warn('Source file "' + p + '" is not css.');
          return false;
        } else {
          return true;
        }
      }).map((p) => {
        return fs.readFileSync(p, {
          encoding: 'utf8'
        });
      }).join(grunt.util.normalizelf(grunt.util.linefeed));

      let proceed = '';
      try {
        proceed = csso.minify(original, { restructure: options.restructure, debug: options.debug }).css;
      }
      catch (err) {
        grunt.fail.fatal(err.message + '  (' + err.parseError.line + ')');
        return;
      }

      if (proceed.length === 0) {
        grunt.log.warn('Destination is not created because minified CSS was empty.');
      } else {
        // add banner.
        proceed = banner + proceed;

        grunt.file.write(dest, proceed);
        grunt.log.write('File ' + chalk.cyan(dest) + ' created' + (options.report ? ': ' : '.'));
        if (options.report) {
          grunt.log.write(maxmin(original, dest, options.report === 'gzip'));
        }
        grunt.log.writeln();
      }
      done();
    });
  });
};
