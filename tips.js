module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/jquery.js',
        dest: 'build/jquery.min.js'
      },
      buildall:{
        files: [{
                    expand:true,
                    cwd:'js',//js目录下
                    src:'**/*.js',//所有js文件
                    dest: 'output/js'//输出到此目录下
                }]
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/bootstrap.css',
        dest: 'build/bootstrap.min.css'
      }
    },
    concat: {
        options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        dist: {
          src: ['src/a.js', 'src/b.js'],
          dest: 'build/c.js'
        }
    },
    jshint: { 
      all: ['main.js'] //files to lint 
    }, 

  });
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  // Default task(s)
  grunt.registerTask('default', ['uglify','cssmin','concat','jshint');

  grunt.registerTask('minall', ['uglify:buildall']);
};