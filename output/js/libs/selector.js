/*! lxapp 2015-12-07 */
!function(a){function b(b){return b=a(b),!(!b.width()&&!b.height())&&"none"!==b.css("display")}function c(a,b){a=a.replace(/=#\]/g,'="#"]');var c,d,e=h.exec(a);if(e&&e[2]in g&&(c=g[e[2]],d=e[3],a=e[1],d)){var f=Number(d);d=isNaN(f)?d.replace(/^["']|["']$/g,""):f}return b(a,c,d)}var d=a.zepto,e=d.qsa,f=d.matches,g=a.expr[":"]={visible:function(){return b(this)?this:void 0},hidden:function(){return b(this)?void 0:this},selected:function(){return this.selected?this:void 0},checked:function(){return this.checked?this:void 0},parent:function(){return this.parentNode},first:function(a){return 0===a?this:void 0},last:function(a,b){return a===b.length-1?this:void 0},eq:function(a,b,c){return a===c?this:void 0},contains:function(b,c,d){return a(this).text().indexOf(d)>-1?this:void 0},has:function(a,b,c){return d.qsa(this,c).length?this:void 0}},h=new RegExp("(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*"),i=/^\s*>/,j="Zepto"+ +new Date;d.qsa=function(b,f){return c(f,function(c,g,h){try{var k;!c&&g?c="*":i.test(c)&&(k=a(b).addClass(j),c="."+j+" "+c);var l=e(b,c)}catch(m){throw console.error("error performing selector: %o",f),m}finally{k&&k.removeClass(j)}return g?d.uniq(a.map(l,function(a,b){return g.call(a,b,l,h)})):l})},d.matches=function(a,b){return c(b,function(b,c,d){return(!b||f(a,b))&&(!c||c.call(a,null,d)===a)})}}(Zepto);