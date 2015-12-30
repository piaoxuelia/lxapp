module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		/* js-compress */
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build:{
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!**/*only.js','!wap/*.js','!video/*.js'],
						dest: '../output/android/js'
					}]
			},
			buildToDev:{
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!**/iosonly.js','!video/*.js'],
						dest: '../output/dev/js'
					}]
			},
			buildToIOS:{
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!wap/*.js','!video/*.js'],
						dest: '../output/ios/js'
					}]
			},
			buildToIOSPro:{
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!wap/*.js','!video/*.js'],
						dest: '../lianxian_app_ios/LIANXIAN/Resources/h5/js'
					}]
			},
			buildToShare:{
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!**/iosonly.js'],
						dest: '../output/share/static/js'
					}]
			},
			buildTest:{
				files: [{
						expand:true,
						cwd:'js',
						src:'**/*.js',
						dest: '../output/testOutput/js'
					}]
			},
			buildToWapTest:{ //看wap页有模拟数据的效果 
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!**/iosonly.js'],
						dest: '../output/wapPageMoni/js'
					}]
			}

		},
		/* css-compress */
		cssmin: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build:{
				files: [{
						expand:true,
						cwd:'css',
						src:'**/*.css',
						dest: '../output/android/css'
					}]
			},
			buildToDev:{
				files: [{
						expand:true,
						cwd:'css',
						src:'**/*.css',
						dest: '../output/dev/css'
					}]
			},
			buildToIOS:{
				files: [{
						expand:true,
						cwd:'css',
						src:'common.css',
						dest: '../output/ios/css'
					}]
			},
			buildToIOSPro:{
				files: [{
						expand:true,
						cwd:'css',
						src:'common.css',
						dest: '../lianxian_app_ios/LIANXIAN/Resources/h5/css'
					}]
			},
			buildToShare:{
				files: [{
						expand:true,
						cwd:'css',
						src: ['*.css', '!common.css','!common-wap.css'],
						dest: '../output/share/static/css'
					},{
						'../output/share/static/css/common.css': 'css/common-wap.css'
					}
					]
			},
			buildTest:{
				files: [{
						expand:true,
						cwd:'css',
						src:'**/*.css',
						dest: '../output/testOutput/css'
					}]
			},
			buildToWapTest:{ //看wap页有模拟数据的效果 
				files: [{
						expand:true,
						cwd:'css',
						src:['**/*.css'],
						dest: '../output/wapPageMoni/css'
					}]
			}
			

		},
		/* html-compress */
		htmlmin:{
			dist: {// Target
				options: {// Target options
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true //html中压缩js
				},
				files: {
					'../output/android/html/news-detail.html': 'html/news-detail.html'
				}
			},
			distToDev:{// Target
				options: {// Target options
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true //html中压缩js
				},
				files: [{
					'../output/dev/html/news-detail.html': 'html/news-detail.html'
				},
					{'../output/dev/html/news-detail-nodata.html': 'html/news-detail-nodata.html'

				}]
			},
			distToIOS:{// Target
				options: {// Target options
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true //html中压缩js
				},
				files: [{
					'../output/ios/html/news-detail.html': 'html/news-detail.html'
				}]
			},
			distToIOSPro:{// Target
				options: {// Target options
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true //html中压缩js
				},
				files: [{
					'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail.html': 'html/news-detail.html'
				}]
			},
			distToShare:{// Target
				options: {// Target options
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true //html中压缩js
				},
				files: [
				{'../output/share/news-detail.html': 'html/news-detail.html'},
				{'../output/share/gallary-detail.html': 'html/gallary-detail.html'},
				{'../output/share/video-detail.html': 'html/video-detail.html'}
					]
			},
			distTest: {
				options: {// Target options
					removeComments: true,
					collapseWhitespace: true
				},
				files: {// Dictionary of files
					'../output/testOutput/html/news-detail.html': 'html/news-detail.html'
				}
			},
			distToWapTest: {
				options: {// Target options
					removeComments: true,
					collapseWhitespace: true
				},
				files: [
						{'../output/wapPageMoni/html/news-detail.html': 'html/news-detail.html'},
						{'../output/wapPageMoni/html/gallary-detail.html': 'html/gallary-detail.html'},
						{'../output/wapPageMoni/html/video-detail.html': 'html/video-detail.html'}
					]
			}
		},
		sass: {
			dist:{
				options: {// Target options 
					style: 'expanded'
				},
				files: [{
					expand: true,
						compass:true,
					cwd: 'css',
					src: ['*.scss'],
					dest: 'output/css/',
					ext: '.css'
				  }]
			}

		},
		replace: {
		  regexReplaceShare: {
			src: [
				'../output/share/news-detail.html',
				'../output/share/gallary-detail.html',
				'../output/share/video-detail.html'
			],
			overwrite: true,                 // overwrite matched source files 
			replacements: [ {
			  from:/\.\.\//ig,//去掉带有deletecur的script标签
			  to: 'static/'
			},{
			  
			  from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
			  to: ''
			}]
		  },
		  regexReplaceWapTest: {
			src: [
				'../output/wapPageMoni/html/news-detail.html',
				'../output/wapPageMoni/html/gallary-detail.html',
				'../output/wapPageMoni/html/video-detail.html'
			],
			overwrite: true,                 // overwrite matched source files 
			replacements: [{
			  from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
			  to: ''
			}]
		  },
		  regexReplaceIOS: {
			src: [
				'../output/ios/html/news-detail.html'
			],
			overwrite: true,                 // overwrite matched source files 
			replacements: [{
			  from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
			  to: ''
			},
			{
			  from:/\<\!--iosNotStart--\>((?!iosNotEnd)[\s\S])*\<\!--iosNotEnd--\>/gi,
			  to: ''
			}]
		  },
		  regexReplaceIOSPro: {
			src: [
				'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail.html'
			],
			overwrite: true,                 // overwrite matched source files 
			replacements: [{
			  from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
			  to: ''
			},
			{
			  from:/\<\!--iosNotStart--\>((?!iosNotEnd)[\s\S])*\<\!--iosNotEnd--\>/gi,
			  to: ''
			},
			{
			  from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
			  to: ''
			}]
		  },
		  regexReplaceShare1: {
			/*src: ['output/html/*.html'],*/
			src: ['../output/share/static/css/*.css','../output/share/*.html'],
			overwrite: true,
			replacements: [ {
			  from:/images\//ig,
			  to: 'img/'
			}]
		  },
		  regexReplace: {
			/*src: ['output/html/*.html'],*/
			src: ['../output/android/html/news-detail.html'],
			overwrite: true,                 // overwrite matched source files 
			replacements: [ /*{
			  from:/\<script\s+deletecur[^\<]+\<\/script\>/ig,//去掉带有deletecur的script标签
			  to: ''
			},*/{
			  // from:/\<\!--wapStart--\>([\s\S]*)\<\!--wapEnd--\>/gi,
			  from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
			  to: ''
			},
			{
			  from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
			  to: ''
			}]
		  }

		},
		watch: {
		    files: ['css/*','html/*','js/*','js/**/','images/*'],
		    tasks: ['default'],
		    options: {
		      livereload: true,
		    },
		},
		copy:{ // 图片拷贝
			main:{
				files: [
			      {expand: true, src: ['images/*'], dest: '../output/android/'},
			      {expand: true, src: ['images/*'], dest: '../output/wapPageMoni/'},
			      {expand: true, src: ['images/*'], dest: '../output/dev/'},
			      {expand: true, src: ['images/*'], dest: '../output/ios/'},
			      {expand: true, src: ['images/*'], dest: '../lianxian_app_ios/LIANXIAN/Resources/h5/'}
			    ],
			},
			copyToDev: {
				expand: true,
				cwd: 'images/',
				src: '**',
				dest: '../output/share/static/img/',
				filter: 'isFile',
			},
		}
	});

	// Load the plugin that provides the "uglify" task.
	//grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	
	
	// Default task(s)
	grunt.registerTask('default', ['uglify','cssmin','htmlmin','copy','replace']);
	grunt.registerTask('wc', ['watch']);
};