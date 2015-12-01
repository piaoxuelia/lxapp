/*! lxapp 2015-12-01 */
!function(a){function b(a,b){for(var c,d,e=b.split("."),f=e.length,g=a,h=0;f>h;++h){if(c=e[h],!(c in g))return{obj:null,prop:null};d=g,g=g[e[h]]}return{obj:d,prop:g}}function c(b){return a.location.href=decodeURIComponent(b),!1}function d(c,d,e){function f(){var f,g=b(a,c),h=!1;return null==g.prop&&(g=b(a.$nativeSimulator,c),g&&(h=!0)),g.prop&&g.obj?(console.log("//调用Native接口 "+c+"参数:\n"+JSON.stringify(arguments)),"function"==typeof g.prop?(g.prop.before=d,g.prop.after=e,g.prop.length!=arguments.length&&console.log("//警告:实参与形参数量不一致:"+arguments.length+"/"+g.prop.length),f=g.prop.apply(h?this:g.obj,arguments)):f=g.prop,console.log("//完毕,返回:"+JSON.stringify(f))):a.console&&console.log&&console.log("//未实现Native接口 "+c+"参数:\n"+JSON.stringify(arguments)),f}return c=c.replace(/\(.*$/,""),f.before=d,f.after=e,f}function e(a,b){var c,d,e=a.attr("data-param1"),f=a.attr("data-param2");if(c=null===e&&null===f?[]:null!==e&&null===f?[e]:[e,f],"news.showFullImage"==b){var g=a[0].getAttribute("src");if(!g)return}return("photo.showFullImage"==b||"news.showFullImage"==b)&&(2==c.length&&(c.length=1),d=a[0].getBoundingClientRect(),c.push(d.left),c.push(d.top),c.push(d.width),c.push(d.height),f&&c.push(f)),c}a.FastClick&&FastClick.attach(document.body);var f=a.$nativeApi={},g=$(".wrapper");a.$nativeSimulator={$_news:{},$_video:{},$_timeline:{},$_baike:{},$_related:{},$_dingyue:{}},a.$_news||(a.$nativeSimulator.$_news.OnClickShare=function(){function b(a){a?(e.show(),f.show()):(e.hide(),f.hide())}function c(){b(!1)}function d(a){var c=f.find("p");"weixin"==a?a="点击右上角，选择“发送给好友”":"circle"==a&&(a="点击右上角，选择“分享到朋友圈”"),a?c.text(a):c.text(c.attr("data-default")),b(!0)}var e=$("#mask"),f=$(".open-in-browser-tip");return e.tap(c),f.find(".close").tap(c),a.showTip=d,d}(),a.$nativeSimulator.$_news.OnClickText=c,a.$nativeSimulator.$_news.onArticleRendered=function(){return!0},a.$nativeSimulator.$_news.onArticleImgLoaded=function(a){return!0}),a.$_baike||(a.$nativeSimulator.$_baike.OnClickBaike=c),a.$_video||(a.$nativeSimulator.$_video.OnClickVideo=function(a){location.href=$utils.extractVideoUrl(a)}),a.$_timeline||(a.$nativeSimulator.$_timeline.showFullText=c),a.$_related||(a.$nativeSimulator.$_related.OnClickRelated=c,a.$nativeSimulator.$_related.OnClickEditorArticle=c),$nativeApi.__=d;var h=f.news={},i=f.related={},j=f.music={},k=f.photo={},l=f.video={},m=f.baike={},n=f.timeline={},o=f.dingyue={};h.showComments=d("$_news.OnClickCmtMore()"),h.recommend=d("$_news.OnClickRecommend()"),h.comment=d("$_news.comment()"),h.showFullText=d("$_news.OnClickText()"),h.showFullImage=d("$_news.OnClickImg(imgUrl,allImgs)"),h.digg=d("$_news.OnClickDigg()",function(){var a=this.find("span");return this.hasClass("tapped")?!0:(this.find("img").attr("src",{stc:"images/icon-thumbup-active.png"}.stc),this.addClass("selected"),this.closest(".vote-simple").find(".thumb").addClass("tapped"),a.text(parseInt(a.text(),10)+1),!0)}),h.bury=d("$_news.OnClickBury()",function(){var a=this.find("span");return this.hasClass("tapped")?!0:(this.find("img").attr("src",{stc:"images/icon-thumbdown-active.png"}.stc),this.addClass("selected"),this.closest(".vote-simple").find(".thumb").addClass("tapped"),a.text(parseInt(a.text(),10)+1),!0)}),h.seeMore=d("$_news.OnClickCmtMore()"),h.share=d("$_news.OnClickShare()"),h.searchTag=d("$_news.OnSearchTag()"),h.next=d("$_news.OnClickNextNews()"),h.prev=d("$_news.OnClickPrevNews()"),h.articleRendered=d("$_news.onArticleRendered()"),h.articleImgLoaded=d("$_news.onArticleImgLoaded(String imgUrl)"),h.clickAd=d("$_news.OnClickAd(String id)"),h.showAd=d("$_news.OnShowAd(String id)"),h.likeThisComment=d("$_news.OnClickCmtLike(String cid)",function(){var a=this.hasClass("thumb-beat");return a||(this.hide(),this.next().show()),!a},function(){this.next().addClass("thumb-beat");var a=this.parent().find(".liked"),b=parseInt(a.text(),10);a.text(b+1)}),n.showFullText=d("$_timeline.showFullText()"),i.viewRelatedArticel=d("$_related.OnClickRelated(String url)"),i.viewEditorArticle=d("$_related.OnClickEditorArticle(String url)"),j.play=d("$_music.play"),j.stop=d("$_music.stop"),g.delegate(".music .play-button","click",function(){var a=$(this),b=(a.find("img"),g.find(".music .play-button"));a.hasClass("stop")?(j.play(a.attr("data-musicid")),b.not(a).removeClass("playing").addClass("stop"),a.removeClass("stop").addClass("playing")):a.hasClass("playing")&&(j.stop(),a.removeClass("playing").addClass("stop"))}),k.showFullImage=d("$_photo.OnClickPhoto"),k.search=d("$_photo.OnClickSearchPhoto");var p=new Date;l.play=d("$_video.OnClickVideo",function(){$ContentRender&&$ContentRender.stopMusic&&$ContentRender.stopMusic();var a=new Date,b=a.getTime()-p.getTime();return p=a,b>1e3}),m.showFullText=d("$_baike.OnClickBaike"),o.addSubscribe=d("$_dingyue.OnClickSubscribeButton"),o.showSubscribe=d("$_dingyue.OnClickShowSubscribe"),g.delegate(".dingyue_button button","click",function(a){a.stopImmediatePropagation(),$(this).data("success")||o.addSubscribe()}),g.delegate(".dingyue","click",function(a){a.stopImmediatePropagation();$(this),g.find(".dingyue_button button");o.showSubscribe()});var q=0;g.delegate("ul.timeline .item","tap",function(a){var b=new Date-q;if(q=new Date,!(200>b)){a.stopPropagation();var c=$(".timeline").find(".cur"),d=$(this).closest("li"),e=d.find("p"),f=200;d[0]==c.closest("li")[0]?e.removeClass("cur").slideToggle(f):c.length?c.removeClass("cur").slideUp(0,function(){e.addClass("cur").slideToggle(f)}):e.addClass("cur").slideToggle(f)}});var r=$(".wrapper");r.delegate(".native-call","click",function(a){a.preventDefault(),a.stopPropagation(),a.stopImmediatePropagation();var c=$(this);if(!c.attr("disabled")){var d,g=c.attr("data-native"),h=e(c,g),i=b(f,g),j=!0;return i.prop&&i.prop.before&&(j=i.prop.before.call(c)),j&&i.prop&&(d=i.prop.apply(c,h),d!==!1&&i.prop.after&&i.prop.after.call(c)),!1}}).delegate(".pseudo-a","click",function(a){if(a.target===this){var b=$(a.target).data("href");b.indexOf("javascript:")>=0||b&&(location.href=b)}}),r.on("partDone",function(a,b,c){if("#article-tmpl"==b&&f.news.articleRendered(),"#news-detail-ad-tmpl"==b){var d=$(".news-detail-ad.part .ad-item-inner").toArray();if(!d.length)return;var e=d.length,g=$(window),i=function(a){var b=a.getBoundingClientRect(),c=g.height(),d=b.top,e=d+b.height,f=Math.min(b.height/2,c/3);return!(d>c-f||f>e)},j=function(){0==e&&g.off("scroll.showAd");for(var a=0;e>a;a++)i(d[a])&&(h.showAd($(d[a]).data("param1")),d.splice(a,1),a--,e--)};g.on("scroll.showAd",j),j()}})}(this);