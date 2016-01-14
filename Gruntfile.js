module.exports = function(grunt) {

	/*
	 * 说明：
	 * 将代码分别处理到几个文件夹：
	 * android： 放入安卓app的文件，无图集的弹框交互  目前只有new-detail
	 * dev: 放入测试环境，安卓app中测试时使用的文件 new-detail.html new-detail-nodata.html  
	 * iso: 放入iosapp的文件， 目前只有new-detail，js多一个iosonly.js
	 * share: 分享后的wap页，生成inn.io中直接将静态文件打包上传的目录结构
	 * wapPageMoni:分享后的wap页有模拟数据的效果，为了直接看效果
	*/

	var sxAppCss = ['css/fontface.css', /*引入字体*/
					'css/common.css', /*通用*/
					'css/mod-topBar.css', /*头部灰色bar*/
					'css/mod-article.css', /*文章模块*/
					'css/mod-relatedhot.css', /*相关和热门模块*/
					'css/mod-comment.css' /*评论模块*/
				],
		shareCss = [
					'css/common.css', /*通用*/
					'css/mod-article.css', /*文章模块*/
					'css/mod-relatedhot.css', /*相关和热门模块*/
					'css/mod-comment.css', /*评论模块*/
					'css/mod-download.css' /*下载模块*/
				],
		detailHtml = [
					'css/detHtml.css', /*引入代码块的css*/
					'css/mod-topBar.css', /*头部灰色bar*/
					'css/mod-article.css', /*文章模块*/
					'css/mod-relatedhot.css', /*相关和热门模块*/
					'css/mod-comment.css', /*评论模块*/
					'css/mod-download.css' /*下载模块*/
				];


	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		/* js-compress */
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			buildAndroid:{//生成最终安卓可用代码
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!**/*only.js','!wap/*.js','!video/*.js'],
						dest: '../output/android/js'
					}]
			},
			buildToDev:{//生成测试服务器安卓可用代码
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!**/iosonly.js','!video/*.js'],
						dest: '../output/dev/js'
					}]
			},
			buildToIOS:{//生成ios可用代码
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!wap/*.js','!video/*.js'],
						dest: '../output/ios/js'
					}]
			},
			buildToIOSPro:{//直接结果修改到ios在视线工程中
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!data/*.js','!wap/*.js','!video/*.js'],
						dest: '../lianxian_app_ios/LIANXIAN/Resources/h5/js'
					}]
			},
			buildToShare:{//生成inn.io中直接将静态文件打包上传的目录结构
				files: [{
						expand:true,
						cwd:'js',
						src:['**/*.js','!**/iosonly.js','!data/*.js'],
						dest: '../output/share/static/js'
					}]
			},
			buildwapPageMoni:{ //看wap页有模拟数据的效果 
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
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				shorthandCompacting: false,
				roundingPrecision: -1
			},
			build:{
				files: {
				  '../output/android/css/common.css': sxAppCss,
				  '../output/android/css/commonHtml.css':detailHtml }			
			},
			buildToDev:{
				files: {'../output/dev/css/common.css': sxAppCss,
						 '../output/dev/css/commonHtml.css': detailHtml}
			},
			buildToIOS:{
				files: { '../output/ios/css/common.css':sxAppCss,
						 '../output/ios/css/commonHtml.css':detailHtml}
			},
			buildToIOSPro:{
				files: {
				  '../lianxian_app_ios/LIANXIAN/Resources/h5/css/common.css': sxAppCss,
				  '../lianxian_app_ios/LIANXIAN/Resources/h5/css/commonHtml.css': detailHtml

				   }
			},
			buildToShare:{
				files: {
				  '../output/share/static/css/common.css': shareCss,
				  '../output/share/static/css/commonHtml.css': detailHtml,

				  '../output/share/static/css/photoswipe.css':'css/photoswipe.css',
				  '../output/share/static/css/video.css':['css/video.css','css/mod-comment.css'],
				}
			},
			buildwapPageMoni:{ //看wap页有模拟数据的效果 
				files: {
				  '../output/wapPageMoni/css/common.css':  shareCss,
				  '../output/wapPageMoni/css/commonHtml.css':  detailHtml,
				  '../output/wapPageMoni/css/photoswipe.css':'css/photoswipe.css',
				  '../output/wapPageMoni/css/video.css':['css/video.css','css/mod-comment.css']
				}
			}
		},
		/* html-compress */
		htmlmin:{
			distToAndroid: {
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: {
					'../output/android/html/news-detail.html': 'html/news-detail.html',
					'../output/android/html/news-detail-html.html': 'html/news-detail-html.html'
				}
			},
			distToDev:{
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: {
					'../output/dev/html/news-detail.html': 'html/news-detail.html',
					'../output/dev/html/news-detail-nodata.html': 'html/news-detail.html',
					'../output/dev/html/news-detail-html.html': 'html/news-detail-html.html',
					'../output/dev/html/news-detail-html-nodata.html': 'html/news-detail-html.html',
				}
			},
			distToIOS:{
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: {
					'../output/ios/html/news-detail.html': 'html/news-detail.html',
					'../output/ios/html/news-detail-html.html': 'html/news-detail-html.html'

				}
			},
			distToIOSPro:{
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: {
					'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail.html': 'html/news-detail.html',
					'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail-html.html': 'html/news-detail-html.html',
				}
			},
			distToShare:{
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: [
				{'../output/share/news-detail.html': 'html/news-detail.html'},
				{'../output/share/news-detail-html.html': 'html/news-detail-html.html'},
				{'../output/share/gallary-detail.html': 'html/gallary-detail-wap.html'},
				{'../output/share/video-detail.html': 'html/video-detail-wap.html'}
					]
			},
			distwapPageMoni: {
				options: {
					removeComments: false,
					collapseWhitespace: true,
					minifyJS:true
				},
				files: [
						{'../output/wapPageMoni/html/news-detail.html': 'html/news-detail.html'},
						{'../output/wapPageMoni/html/news-detail-html.html': 'html/news-detail-html.html'},
						{'../output/wapPageMoni/html/gallary-detail.html': 'html/gallary-detail.html'},
						{'../output/wapPageMoni/html/video-detail.html': 'html/video-detail.html'}
					]
			}
		},
		sass: {
			dist:{
				options: { 
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
				src: ['../output/share/news-detail.html',
					'../output/share/news-detail-html.html',
					'../output/share/gallary-detail.html',
					'../output/share/video-detail.html'],
				overwrite: true, 
				replacements: [{
						from:/\.\.\//ig,
						to: 'static/'
					},{
						from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
						to: ''
					},{
						from:/\<\!--andrStart--\>((?!andrEnd)[\s\S])*\<\!--andrEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceWapMoni: {
				src: [
					'../output/wapPageMoni/html/news-detail.html',
					'../output/wapPageMoni/html/news-detail-html.html',
					'../output/wapPageMoni/html/gallary-detail.html',
					'../output/wapPageMoni/html/video-detail.html'
				],
				overwrite: true, 
				replacements: [{
						from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--andrStart--\>((?!andrEnd)[\s\S])*\<\!--andrEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceIOS: {
				src: [
					'../output/ios/html/news-detail.html',
					'../output/ios/html/news-detail-html.html'
				],
				overwrite: true, 
				replacements: [{
						from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--andrStart--\>((?!andrEnd)[\s\S])*\<\!--andrEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceIOSPro: {
				src: [
					'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail.html',
					'../lianxian_app_ios/LIANXIAN/Resources/h5/html/news-detail-html.html'
				],
				overwrite: true, 
				replacements: [{
						from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--andrStart--\>((?!andrEnd)[\s\S])*\<\!--andrEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceShare1: {
				src: ['../output/share/static/css/*.css','../output/share/*.html'],
				overwrite: true,
				replacements: [{
					from:/images\//ig,
					to: 'img/'
				}]
			},
			regexReplaceAndroid: {
				src: ['../output/android/html/news-detail.html','../output/android/html/news-detail-html.html'],
				overwrite: true, 
				replacements: [{
						from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceDev: {
				src: ['../output/dev/html/news-detail-nodata.html','../output/dev/html/news-detail-html-nodata.html'],
				overwrite: true, 
				replacements: [{
						from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--moniDataStart--\>((?!moniDataEnd)[\s\S])*\<\!--moniDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
						to: ''
					},
					{
						from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
						to: ''
				}]
			},
			regexReplaceDev2: {
				src: ['../output/dev/html/news-detail.html','../output/dev/html/news-detail-html.html'],
				overwrite: true, 
				replacements: [{
					from:/\<\!--wapStart--\>((?!wapEnd)[\s\S])*\<\!--wapEnd--\>/gi,
					to: ''
				},
				{
					from:/\<\!--iosStart--\>((?!iosEnd)[\s\S])*\<\!--iosEnd--\>/gi,
					to: ''
				},
				{
					from:/\<\!--wapDataStart--\>((?!wapDataEnd)[\s\S])*\<\!--wapDataEnd--\>/gi,
					to: ''
				},
				{
					from:/\<\!--((?!--\>)[\s\S])*--\>/gi,
					to: ''
				}]
			}
		},
		watch: {
			scripts: {
				files: ['js/*','js/**/*'],
				tasks: ['js'],
				options: {
				  livereload:true
				}
			},
			css:{
				files: ['css/*'],
				tasks: ['css'],
				options: {
					livereload: true,
				}
			},
			img:{
				files: ['images/*'],
				tasks: ['img'],
				options: {
					livereload: true,
				}
			},
			html:{
				files: ['html/*'],
				tasks: ['html'],
				options: {
					livereload: true,
				}
			}
		},
		copy:{ // 图片拷贝
			main:{
				files: [
					{expand: true, src: ['images/*'], dest: '../output/android/'},
					{expand: true, src: ['images/*'], dest: '../output/wapPageMoni/'},
					{expand: true, src: ['images/*'], dest: '../output/dev/'},
					{expand: true, src: ['images/*'], dest: '../output/ios/'},
					{expand: true, src: ['images/*'], dest: '../lianxian_app_ios/LIANXIAN/Resources/h5/'},
					{expand: true, src: ['font/*'], dest: '../output/android/'},
					{expand: true, src: ['font/*'], dest: '../output/ios/'},
					{expand: true, src: ['font/*'], dest: '../output/dev/'}],
			},
			copyToDev: { // share下的目录不同，单独处理
				expand: true,
				cwd: 'images/',
				src: '**',
				dest: '../output/share/static/img/',
				filter: 'isFile',
			},
		}
	});


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
	grunt.registerTask('html', ['htmlmin','replace']);
	grunt.registerTask('css', ['cssmin','replace:regexReplaceShare1']);
	grunt.registerTask('js', ['uglify']);
	grunt.registerTask('img', ['copy']);
};