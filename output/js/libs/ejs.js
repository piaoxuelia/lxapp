/*! lxapp 2015-12-02 */
ejs=function(){function a(b){if("fs"==b)return{};if("path"==b)return{};var c=a.resolve(b),d=a.modules[c];if(!d)throw new Error('failed to require "'+b+'"');return d.exports||(d.exports={},d.call(d.exports,d,d.exports,a.relative(c))),d.exports}return a.modules={},a.resolve=function(b){var c=b,d=b+".js",e=b+"/index.js";return a.modules[d]&&d||a.modules[e]&&e||c},a.register=function(b,c){a.modules[b]=c},a.relative=function(b){return function(c){if("."!=c.substr(0,1))return a(c);var d=b.split("/"),e=c.split("/");d.pop();for(var f=0;f<e.length;f++){var g=e[f];".."==g?d.pop():"."!=g&&d.push(g)}return a(d.join("/"))}},a.register("ejs.js",function(a,b,c){function d(a){return a.substr(1).split("|").reduce(function(a,b){var c=b.split(":"),d=c.shift(),e=c.join(":")||"";return e&&(e=", "+e),"filters."+d+"("+a+e+")"})}function e(a,b,c,d){var e=b.split("\n"),f=Math.max(d-3,0),g=Math.min(e.length,d+3),h=e.slice(f,g).map(function(a,b){var c=b+f+1;return(c==d?" >> ":"    ")+c+"| "+a}).join("\n");throw a.path=c,a.message=(c||"ejs")+":"+d+"\n"+h+"\n\n"+a.message,a}function f(a,b){var c=k(i(b),a),d=j(a);return d||(c+=".ejs"),c}var g=c("./utils"),h=c("path"),i=h.dirname,j=h.extname,k=h.join,l=c("fs"),m=l.readFileSync,n=b.filters=c("./filters"),o={};b.clearCache=function(){o={}};var p=(b.parse=function(a,c){var c=c||{},e=c.open||b.open||"<%",g=c.close||b.close||"%>",h=c.filename,i=c.compileDebug!==!1,j="";j+="var buf = [];",!1!==c._with&&(j+="\nwith (locals || {}) { (function(){ "),j+="\n buf.push('";for(var k=1,l=!1,n=0,o=a.length;o>n;++n){var p=a[n];if(a.slice(n,e.length+n)==e){n+=e.length;var q,r,s=(i?"__stack.lineno=":"")+k;switch(a[n]){case"=":q="', escape(("+s+", ",r=")), '",++n;break;case"-":q="', ("+s+", ",r="), '",++n;break;default:q="');"+s+";",r="; buf.push('"}var t=a.indexOf(g,n);if(0>t)throw new Error('Could not find matching close tag "'+g+'".');var u=a.substring(n,t),v=n,w=null,x=0;if("-"==u[u.length-1]&&(u=u.substring(0,u.length-2),l=!0),0==u.trim().indexOf("include")){var y=u.trim().slice(7).trim();if(!h)throw new Error("filename option is required for includes");var z=f(y,h);w=m(z,"utf8"),w=b.parse(w,{filename:z,_with:!1,open:e,close:g,compileDebug:i}),j+="' + (function(){"+w+"})() + '",u=""}for(;~(x=u.indexOf("\n",x));)x++,k++;":"==u.substr(0,1)&&(u=d(u)),u&&(u.lastIndexOf("//")>u.lastIndexOf("\n")&&(u+="\n"),j+=q,j+=u,j+=r),n+=t-v+g.length-1}else"\\"==p?j+="\\\\":"'"==p?j+="\\'":"\r"==p||("\n"==p?l?l=!1:(j+="\\n",k++):j+=p)}return j+=!1!==c._with?"'); })();\n} \nreturn buf.join('');":"');\nreturn buf.join('');"},b.compile=function(a,c){c=c||{};var d=c.escape||g.escape,f=JSON.stringify(a),h=c.compileDebug!==!1,i=c.client,j=c.filename?JSON.stringify(c.filename):"undefined";a=h?["var __stack = { lineno: 1, input: "+f+", filename: "+j+" };",e.toString(),"try {",b.parse(a,c),"} catch (err) {","  rethrow(err, __stack.input, __stack.filename, __stack.lineno);","}"].join("\n"):b.parse(a,c),c.debug&&console.log(a),i&&(a="escape = escape || "+d.toString()+";\n"+a);try{var k=new Function("locals, filters, escape, rethrow",a)}catch(l){throw"SyntaxError"==l.name&&(l.message+=c.filename?" in "+j:" while compiling ejs"),l}return i?k:function(a){return k.call(this,a,n,d,e)}});b.render=function(a,b){var c,b=b||{};if(b.cache){if(!b.filename)throw new Error('"cache" option requires "filename".');c=o[b.filename]||(o[b.filename]=p(a,b))}else c=p(a,b);return b.__proto__=b.locals,c.call(b.scope,b)},b.renderFile=function(a,c,d){var e=a+":string";"function"==typeof c&&(d=c,c={}),c.filename=a;var f;try{f=c.cache?o[e]||(o[e]=m(a,"utf8")):m(a,"utf8")}catch(g){return void d(g)}d(null,b.render(f,c))},b.__express=b.renderFile,c.extensions?c.extensions[".ejs"]=function(a,b){b=b||a.filename;var c={filename:b,client:!0},d=l.readFileSync(b).toString(),e=p(d,c);a._compile("module.exports = "+e.toString()+";",b)}:c.registerExtension&&c.registerExtension(".ejs",function(a){return p(a,{})})}),a.register("filters.js",function(a,b,c){b.first=function(a){return a[0]},b.last=function(a){return a[a.length-1]},b.capitalize=function(a){return a=String(a),a[0].toUpperCase()+a.substr(1,a.length)},b.downcase=function(a){return String(a).toLowerCase()},b.upcase=function(a){return String(a).toUpperCase()},b.sort=function(a){return Object.create(a).sort()},b.sort_by=function(a,b){return Object.create(a).sort(function(a,c){return a=a[b],c=c[b],a>c?1:c>a?-1:0})},b.size=b.length=function(a){return a.length},b.plus=function(a,b){return Number(a)+Number(b)},b.minus=function(a,b){return Number(a)-Number(b)},b.times=function(a,b){return Number(a)*Number(b)},b.divided_by=function(a,b){return Number(a)/Number(b)},b.join=function(a,b){return a.join(b||", ")},b.truncate=function(a,b,c){return a=String(a),a.length>b&&(a=a.slice(0,b),c&&(a+=c)),a},b.truncate_words=function(a,b){var a=String(a),c=a.split(/ +/);return c.slice(0,b).join(" ")},b.replace=function(a,b,c){return String(a).replace(b,c||"")},b.prepend=function(a,b){return Array.isArray(a)?[b].concat(a):b+a},b.append=function(a,b){return Array.isArray(a)?a.concat(b):a+b},b.map=function(a,b){return a.map(function(a){return a[b]})},b.reverse=function(a){return Array.isArray(a)?a.reverse():String(a).split("").reverse().join("")},b.get=function(a,b){return a[b]},b.json=function(a){return JSON.stringify(a)}}),a.register("utils.js",function(a,b,c){b.escape=function(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#39;").replace(/"/g,"&quot;")}}),a("ejs")}();