/*! lxapp 2015-12-30 */
function connectWebViewJavascriptBridge(a){window.WebViewJavascriptBridge?a(WebViewJavascriptBridge):document.addEventListener("WebViewJavascriptBridgeReady",function(){a(WebViewJavascriptBridge)},!1)}var iosOnly=function(){var a={},b=null,c=$("body"),d=function(a){b.callHandler("JSCallCenter",a,function(a){})},e=function(){c.on("click",".photo-mod img",function(){var a=[],b=$(".photo-mod img").index($(this));$(".photo-mod img").each(function(b,c){a.push($(c).data("src"))}),console.log(b),console.log(a),d({handle:"image",type:"1001",data:{index:b,srcs:a}})}),$(".article-img-list img").click(function(a){a.stopPropagation(),a.preventDefault();var b=$(this).parents(".scroller-wrap"),c=[],e=b.data("transurl");b.find("img").each(function(a,b){c.push($(b).data("src"))}),d({handle:"image",type:"1002",data:{srcs:c,index:0,transurl:e}})})};return a.initialize=function(a){b=a,e()},a.bineReatedEventHandler=function(){c.on("click",".hot-articles li",function(){var a=$(".hot-articles li").index($(this)),b=window.detListData.hotNewsList[a];console.log(b),d({handle:"link",type:"4001",data:b})}),c.on("click",".recommend-articles li",function(){var a=$(".recommend-articles li").index($(this)),b=window.detListData.related[a];console.log(b),d({handle:"link",type:"5001",data:b})})},a.bineCommentEventHandler=function(){c.on("click",".more-comments",function(){d({handle:"click",type:"3001"})}),c.on("click",".thumbup",function(){var a=$(this),b=a.data("param1"),c=a.siblings(".liked"),e=Number(c.text());a.hide(),a.next(".thumbup-active").show().addClass("thumb-beat"),c.text(e+1),d({handle:"click",type:"3002",data:b})}),c.on("click",".no-comments",function(){d({handle:"click",type:"3003"})})},a}();window.onerror=function(a){log("window.onerror: "+a)},connectWebViewJavascriptBridge(function(a){a.init(function(a,b){}),a.registerHandler("JavascriptHandler",function(b,c){$ContentRender.renderArticle(b),iosOnly.initialize(a)}),a.registerHandler("JavascriptRelatedHandler",function(a,b){a&&((a.transmit_data||a.transmit_num)&&$ContentRender.renderGrayBar(a),a.related&&$ContentRender.renderRecommendArtices(a),a.hotNewsList&&$ContentRender.renderhotArtices(a)),$ContentRender.lazyLoadImage(),iosOnly.bineReatedEventHandler()}),a.registerHandler("JavascriptCommentHandler",function(a,b){$ContentRender.renderComments(a),iosOnly.bineCommentEventHandler()})});