/*
 * mochify.js
 *
 * Copyright (c) 2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var spawn        = require('child_process').spawn;
var through      = require('through2');
var sourceMapper = require('source-mapper');
var trace        = require('./trace');


module.exports = function (b) {

  function apply() {
    var n = spawn('node');
    var out = through();
    var js = '';
    var wrap = b.pipeline.get('wrap');
    wrap.push(through(function (chunk, enc, next) {
      /*jslint unparam: true*/
      js += chunk;
      next();
    }, function (next) {
      var x = sourceMapper.extract(js);
      var s1 = sourceMapper.stream(x.map);
      var s2 = sourceMapper.stream(x.map);
      n.stdout.pipe(s1).pipe(trace()).pipe(out);
      n.stderr.pipe(s2).pipe(trace()).pipe(process.stderr);
      n.on('exit', function (code) {
        if (code) {
          b.emit('error', new Error('Exit ' + code));
        }
        next();
      });
      n.stdin.write(x.js);
      n.stdin.end();
    }));
    wrap.push(out);
  }

  apply();
  b.on('reset', apply);

};
