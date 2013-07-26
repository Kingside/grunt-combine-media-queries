/*
 * grunt-combine-media-queries
 * https://github.com/buildingblocks/grunt-combine-media-queries
 *
 * Copyright (c) 2013 John Cashmore
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

	function processCssRule (rule) {
		var strCss = "";

		strCss += '\t' + rule.selectors.join(',') + ' {\r\n';
		rule.declarations.forEach(function (declaration) {
			strCss += '\t\t' + declaration.property + ':' + declaration.value + ';\r\n';
		});
		strCss += '\t' + '}\r\n\r\n';

		return strCss;
	}

  grunt.registerMultiTask('cmq', 'Find duplicate media queries and combines them.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
        //options to go here
    });

	var error = false,
		parseCss = require('css-parse'),
		fs = require('fs'),
		read = fs.readFileSync;

	// Iterate over all specified file groups.
	this.files.forEach(function(f) {

			f.src.forEach(function (filename) {



				if (grunt.file.exists(filename)) {
					if (!grunt.file.isDir(filename)) {
						var source = read(filename, 'utf8');

						var cssJson = parseCss(source),
						processedCSS = {};
						processedCSS.base = {};
						processedCSS.base.rules = [];
						processedCSS.media = [];
						processedCSS.keyframes = [];
						grunt.file.write(f.dest + '/' + filename, cssJson);

						cssJson.stylesheet.rules.forEach( function (rule) {
							if (rule.type === 'media') {


								var strMedia = rule.media.replace(/[^A-Za-z0-9]/ig,'');

								var item = processedCSS.media.filter(function (element) {
										return (element.val === strMedia);
								});



								if (item.length < 1) {
									var mediaObj = {};
									mediaObj.sortval = parseFloat(rule.media.match( /\d+/g ));
									mediaObj.rule = rule.media;
									mediaObj.val = strMedia;

									mediaObj.rules = [];

									processedCSS.media.push(mediaObj);

								}
								var i = 0, matched = false;
								processedCSS.media.forEach(function (elm) {
									if (elm.val === strMedia) {
										matched = true;
									}
									if (!matched) {i++;}

								});





								rule.rules.forEach(function (mediaRule) {
									processedCSS.media[i].rules.push(mediaRule);

								});

							} else if (rule.type === 'keyframes') {

								processedCSS.keyframes.push(rule);
							} else if (rule.type === 'rule') {

								processedCSS.base.rules.push(rule);
							}

						});


						processedCSS.media.sort(function (a,b) {
							
							if(a.sortval < b.sortval) {
								return -1;
							}
							if(a.sortval > b.sortval) {
								return 1;
							}
							return 0;
						});



						var strStyles = "";
						processedCSS.base.rules.forEach(function (rule) {

							strStyles += processCssRule(rule);
						});


						//var media;






						processedCSS.media.forEach(function (item) {

								strStyles += '@media ' + item.rule + ' {\r\n';


								//var rule;
								item.rules.forEach(function (rule) {

									strStyles += processCssRule(rule);


								});

								strStyles += '}\r\n';

						});

						processedCSS.keyframes.forEach(function (keyFrame) {
							strStyles += '@'+ (typeof keyFrame.vendor !=='undefined'? keyFrame.vendor: '') +'keyframes '+ keyFrame.name +' {\r\n';

							keyFrame.keyframes.forEach(function (frame) {
								strStyles += '\t' +frame.values.join(',') + ' {\r\n';

									frame.declarations.forEach(function (declaration) {
										strStyles += '\t\t' + declaration.property + ':' + declaration.value + ';\r\n';
									});

								strStyles += '}\r\n';
							});

							strStyles += '\t}\r\n';

						});
						grunt.file.write(f.dest + '/' + filename.substring(filename.lastIndexOf('/')+1), strStyles);

					} else {
						grunt.log.error('Source file "' + filename + '" not found.');
						error = true;
						return false;

					}
				} else {
					grunt.log.error('Source file "' + filename + '" not found.');
					error = true;
					return false;

				}
			});
    });
    if(error) {
			return false;
		}

  });

};
