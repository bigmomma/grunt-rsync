/*
 * grunt-rsync
 * https://github.com/maxdaten/grunt-rsync
 *
 * Copyright (c) 2012 Jan-Philip Loos
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
  'use strict';
  var _this = this;

  function rsyncCallback(error, stdout, stderr, done) {
    grunt.verbose.write(stdout);
    if (error) {
      grunt.verbose.write(stderr);
      grunt.fail.fatal(error);
			done(false);
    }else{
      grunt.log.ok('Files transferred successfully.');
			done();
		}
  }


  function doRsync(cmd, options, target, files, done) {
    var exec = require('child_process').exec,
        src = grunt.file.expand(files[target]),
        dest = target;
    if(src.length === 0){
      grunt.fail.warn('There are no files to transfer.');
    }
    cmd.push(src.join(' '));

    // destination to copy
    cmd.push((options.user === '' ? '' :  options.user + '@') + options.host + ':' + options.remoteBase + '/' + target); // TODO: normalize
    if(options.deleteAfter && !options.dry){
      cmd.push('&& rm -rf ' + src.join(' '));
    }
    cmd.push();
    cmd = cmd.join(' ');

    grunt.log.writeln( 'Executing: ' + cmd );
    grunt.log.writeln( 'Starting transfer... ' );

    exec(cmd, function(error, stdout, stderr) {
			rsyncCallback(error, stdout, stderr, done);
		});
  }

  grunt.registerMultiTask('rsync', 'Copy files to a (remote) machine with rsync.', function () {

    var done = this.async(),
        files = _this.createFileMap(this.data.files);
        var options = this.data.options;
        // options
        options.dry = grunt.option('no-write'),
        options.host = options.host || 'localhost',
        options.user = options.user || '',

        // TODO system username or nothing?
        options.remoteBase = options.remoteBase || '~',
        options.verbose = grunt.option('verbose'),
        options.preserveTimes = options.preserveTimes || false,
        options.preservePermissions = options.preservePermissions || true,
        options.compression = options.compression || true,
        options.recursive = options.recursive || true,
        options.clean = options.clean || false,
        options.deleteAfter = options.deleteAfter || false,
        options.additionalOptions = options.additionalOptions || '';

    // setup the cmd
    var command = ['rsync'];

    // these flags must be set before the src/dest args
    if (options.recursive) {
      command.push('-r');
    }

    if (options.verbose) {
      command.push('-v');
    }

    if (options.preserveTimes) {
      command.push('-t');
    }

    if (options.preservePermissions) {
      command.push('-p');
    }

    if(options.clean){
      command.push('--delete');
      command.push('--delete-after');
    }

    if (options.compression) {
      command.push('-z');
    }

    if (options.dry) {
      command.push('--dry-run');
    }

    command.push(options.additionalOptions);

    // from this line on, the order of the args is relevant!
    // files to copy
    // save command before execute files-map wise
    for (var target in files) {
      // copy command
      doRsync(command.slice(), options, target, files, done);
    } // for in files

  });

  this.createFileMap = function(files) {
    var map = {};

    files = files instanceof Object ? files : {
      '': files
    };

    for (var target in files) {

      map[target] = files[target];
    }
    return map;
  };
};
