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
		}
	},
	/* css-compress */
	cssmin: {
		options: {
			banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		},
		/* single file compress
			build: {
				src: 'src/bootstrap.css',
				dest: 'build/bootstrap.min.css'
			},
		*/
		build:{
			files: [{
					expand:true,
					cwd:'css',//js目录下
					src:'**/*.css',//所有js文件
					dest: 'output/css'//输出到此目录下
				}]
		}
	},
	htmlmin:{
		dist: {		// Target
			 options: {	// Target options
				removeComments: true,
				collapseWhitespace: true
			 },
			 files: {		// Dictionary of files
				'output/html/news-detail.html': 'html/news-detail.html'
			 }
		}
	},
	clean: {
	  build: {
	    src: ["output/css/*.map", "!output/css/*.css"]
	  }
	},
	sass: {
		dist:{
			options: {		// Target options 
				style: 'expanded'
			},
			/*files:{
				'output/css/layout.css':'css/layout.scss'
			},*/
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
	concat: {
		options: {
			banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		},
		dist: {
			src: ['output/css/common.css', 'output/css/newslist.css'],
			dest: 'output/css/detail.css'
		}
	},
	});
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');

	
	
	// Default task(s)
	grunt.registerTask('a', ['uglify','cssmin','htmlmin','concat']);
	grunt.registerTask('s', ['sass']);
	grunt.registerTask('d', ['clean']);
};