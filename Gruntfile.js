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
					cwd:'js',//js目录下
					src:'**/*.js',//所有js文件
					dest: 'output/js'//输出到此目录下
				}]
		},
		buildTest:{
			files: [{
					expand:true,
					cwd:'js',//js目录下
					src:'**/*.js',//所有js文件
					dest: 'testOutput/js'//输出到此目录下
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
					cwd:'css',//js目录下
					src:'**/*.css',//所有js文件
					dest: 'output/css'//输出到此目录下
				}]
		},
		buildTest:{
			files: [{
					expand:true,
					cwd:'css',//js目录下
					src:'**/*.css',//所有js文件
					dest: 'testOutput/css'//输出到此目录下
				}]
		}
	},
	/* html-compress */
	htmlmin:{
		dist: {		// Target
			options: {	// Target options
				removeComments: true,
				collapseWhitespace: true,
				minifyJS:true //html中压缩js
			},
			files: {		// Dictionary of files
				'output/html/news-detail.html': 'html/news-detail.html'
			}
		},
		distTest: {		// Target
			options: {	// Target options
				removeComments: true,
				collapseWhitespace: true
			},
			files: {		// Dictionary of files
				'testOutput/html/news-detail.html': 'html/news-detail.html'
			}
		}
	},
	clean: {
	  build: {
		src: ["output/js/data/",]
	  }
	},
	sass: {
		dist:{
			options: {		// Target options 
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
	  regexReplace: {
	    /*src: ['output/html/*.html'],*/
	    src: ['output/html/news-detail.html'],
	    overwrite: true,                 // overwrite matched source files 
	    replacements: [ {
	      from:/\<script\s+deletecur[^\<]+\<\/script\>/ig,//去掉带有deletecur的script标签
	      to: ''
	    }]
	  }
	},
	jshint: {
	   ignore_warning: {
		 src: ['**/*.js','**/**/.js'],
	   },
	 }
	});
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-text-replace');
	
	
	
	// Default task(s)
	grunt.registerTask('default', ['uglify:build','cssmin:build','htmlmin:dist','clean','replace']);
	grunt.registerTask('test', ['uglify:buildTest','cssmin:buildTest','htmlmin:distTest']);
	grunt.registerTask('sa', ['sass']);
};