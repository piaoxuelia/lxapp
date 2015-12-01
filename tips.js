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
    dist: {   // Target
       options: { // Target options
        removeComments: true,
        collapseWhitespace: true
       },
       files: {   // Dictionary of files
        'output/html/news-detail.html': 'html/news-detail.html'
       }
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
  imagemin: {                          // Task \\
    static: {                          // Target
         options: {                       // Target options
           optimizationLevel: 3,
           svgoPlugins: [{ removeViewBox: false }]
         },
         files: {                         // Dictionary of files
           'output/images/share-circle.png': 'images/share-circle.png', // 'destination': 'source'
         }
    },
    dynamic: {                         // Another target 
      files: [{
      expand: true,                  // Enable dynamic expansion 
      cwd: 'images/',                   // Src matches are relative to this path 
      src: ['*.{png,gif}'],   // Actual patterns to match 
      dest: 'output/images/'                  // Destination path prefix 
      }]
    }
  }
  });
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  
  // Default task(s)
  grunt.registerTask('default', ['uglify','cssmin','htmlmin','imagemin','concat']);
};