/*! lxapp 2015-12-23 */
~function(a){var b=function(b,c){if(b){var d="",e={loop:!1,history:!1,pinchToClose:!1,closeOnScroll:!1,closeOnVerticalDrag:!1,escKey:!1,tapToToggleControls:!0,clickToCloseNonZoomable:!1,shareEl:!1,fullscreenEl:!1,closeEl:!1,counterEl:!1,closeElClasses:[],addCaptionHTMLFn:function(a,b,c){var e='<h1 class="pswp__caption__title"><span class="pswp__custom-counter">'+d+'</span><span class="pswp__custom-title">'+a.title+"</span></h1>";return a.desc&&(e+='<p class="pswp__caption__desc"><span class="_scroll">'+a.desc+"</span></p>"),b.children[0].innerHTML=e,!0},isClickableElement:function(a){return"A"===a.tagName||"_scroll"===a.className}};c=a.extend({},e,c);var f=a(".pswp")[0],g=new PhotoSwipe(f,PhotoSwipeUI_Default,b,c);g.listen("afterChange",function(){var b=this.getCurrentIndex()+1+this.options.indexIndicatorSep+this.options.getNumItemsFn();a(this.scrollWrap).find(".pswp__ui .pswp__caption:not(.pswp__caption--fake) span.pswp__custom-counter").html(b),d=b}),a("div.pswp__scroll-wrap").on("touchmove touchend touchcancel",function(b){var c=a(b.target);c.is("._scroll")&&b.stopImmediatePropagation()}),g.init()}},c=window.$ContentRender={},d=a("body>.msg-box"),e=a(window).width();c.renderArticle=function(c){if(!c||!c.content.length)return void d.html("图集数据出错！");var f,g=[],h=c.title||" ",i=0;return document.title=h,a.each(c.content,function(a,b){if("img"===b.type&&(f=b.value.match(/size=(\d+)x(\d+)/))){var c={src:"",title:h,desc:"",w:"",h:""};e<f[1]?(c.w=e,c.h=Math.floor(e/f[1]*f[2])):(c.w=f[1],c.h=f[2]),c.src=$utils.dmfd(b.value,c.w,c.h,!0),g.push(c)}"txt"==b.type&&"img_title"==b.subtype&&(i=g.length,g[i-1].src&&(g[i-1].desc=b.value))}),g?void b(g):void d.html("没有图集数据！")}}(Zepto);