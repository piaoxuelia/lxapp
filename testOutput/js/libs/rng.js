/*! lxapp 2015-12-23 */
function RC4(a){this.s=new Array(256),this.i=0,this.j=0;for(var b=0;256>b;b++)this.s[b]=b;a&&this.mix(a)}function RNG(a){null==a?a=(Math.random()+Date.now()).toString():"function"==typeof a?(this.uniform=a,this.nextByte=function(){return~~(256*this.uniform())},a=null):"[object String]"!==Object.prototype.toString.call(a)&&(a=JSON.stringify(a)),this._normal=null,a?this._state=new RC4(a):this._state=null}RC4.getStringBytes=function(a){for(var b=[],c=0;c<a.length;c++){var d=a.charCodeAt(c),e=[];do e.push(255&d),d>>=8;while(d>0);b=b.concat(e.reverse())}return b},RC4.prototype._swap=function(a,b){var c=this.s[a];this.s[a]=this.s[b],this.s[b]=c},RC4.prototype.mix=function(a){for(var b=RC4.getStringBytes(a),c=0,d=0;d<this.s.length;d++)c+=this.s[d]+b[d%b.length],c%=256,this._swap(d,c)},RC4.prototype.next=function(){return this.i=(this.i+1)%256,this.j=(this.j+this.s[this.i])%256,this._swap(this.i,this.j),this.s[(this.s[this.i]+this.s[this.j])%256]},RNG.prototype.nextByte=function(){return this._state.next()},RNG.prototype.uniform=function(){for(var a=7,b=0,c=0;a>c;c++)b*=256,b+=this.nextByte();return b/(Math.pow(2,8*a)-1)},RNG.prototype.random=function(a,b){return null==a?this.uniform():(null==b&&(b=a,a=0),a+Math.floor(this.uniform()*(b-a)))},RNG.prototype.normal=function(){if(null!==this._normal){var a=this._normal;return this._normal=null,a}var b=this.uniform()||Math.pow(2,-53),c=this.uniform();return this._normal=Math.sqrt(-2*Math.log(b))*Math.sin(2*Math.PI*c),Math.sqrt(-2*Math.log(b))*Math.cos(2*Math.PI*c)},RNG.prototype.exponential=function(){return-Math.log(this.uniform()||Math.pow(2,-53))},RNG.prototype.poisson=function(a){var b=Math.exp(-(a||1)),c=0,d=1;do c++,d*=this.uniform();while(d>b);return c-1},RNG.prototype.gamma=function(a){var b=(1>a?1+a:a)-1/3,c=1/Math.sqrt(9*b);do{do var d=this.normal(),e=Math.pow(c*d+1,3);while(0>=e);var f=this.uniform(),g=Math.pow(d,2)}while(f>=1-.0331*g*g&&Math.log(f)>=.5*g+b*(1-e+Math.log(e)));return 1>a?b*e*Math.exp(this.exponential()/-a):b*e},RNG.roller=function(a,b){var c=a.split(/(\d+)?d(\d+)([+-]\d+)?/).slice(1),d=parseFloat(c[0])||1,e=parseFloat(c[1]),f=parseFloat(c[2])||0;return b=b||new RNG,function(){for(var a=d+f,c=0;d>c;c++)a+=b.random(e);return a}},RNG.$=new RNG;