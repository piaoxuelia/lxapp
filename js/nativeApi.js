/**
 * Android Native Interface related
 */
(function(g) {
	if (g.FastClick) FastClick.attach(document.body);

	var api = g.$nativeApi = {},
		$wrapper = $('.wrapper');
	g.$nativeSimulator = {
		'$_news': {},
		'$_video': {},
		'$_timeline': {},
		'$_baike': {},
		'$_related': {},
		'$_dingyue': {}
	};

	function tryget(o, path) {
		var parts = path.split('.'),
			part, len = parts.length,
			prev;
			/*tryget("g.$nativeApi", "news.likeThisComment")*/

		for (var t = o, i = 0; i < len; ++i) {
			part = parts[i];
			if (part in t) {
				prev = t;/* prev = g.$nativeApi */ /* prev = g.$nativeApi["news"] */
				t = t[parts[i]]; /* t =  g.$nativeApi[news]*//* t =  g.$nativeApi.news["likeThisComment"]*/
			} else {
				return {
					obj: null,
					prop: null
				};
			}
		}
		return {
			obj: prev,
			prop: t
		};
	}

	function navigateToUrl(url) {
		g.location.href = decodeURIComponent(url);
		return false;
	}

	if (!g.$_news) {
		g.$nativeSimulator.$_news.OnClickShare = (function() {
			var mask = $('#mask'),
				tip = $('.open-in-browser-tip');

			function toggle(onOff) {
				if (onOff) {
					mask.show();
					tip.show();
				} else {
					mask.hide();
					tip.hide();
				}
			}

			function close() {
				toggle(false);
			}

			function open(text) {
				var p = tip.find('p');
				if (text == 'weixin') {
					text = '点击右上角，选择“发送给好友”';
				} else if (text == 'circle') {
					text = '点击右上角，选择“分享到朋友圈”';
				}
				if (text) {
					p.text(text);
				} else {
					p.text(p.attr('data-default'));
				}
				toggle(true);
			}

			mask.tap(close);
			tip.find('.close').tap(close);
			g.showTip = open;
			return open;
		})();
	
		g.$nativeSimulator.$_news.onArticleRendered = function() {
			return true;
		};
		g.$nativeSimulator.$_news.onArticleImgLoaded = function(imgurl) {
			return true;
		};
	}
	/**
	 * 生成native接口调用函数
	 * @param  {String} path   [native接口,比如$_object.method]
	 * @param  {Function} before [调用native接口之前调用的函数，如果该函数返回false则不调用native接口]
	 * @param  {Function} after  [调用native接口之后调用的函数，如果native函数返回false则不调用该函数]
	 * @return {Function}        [调用native接口的包装函数]
	 */
	function __(path, before, after) {
		path = path.replace(/\(.*$/, '')

		function f() {

			var ret, x = tryget(g, path),
				isSimulator = false;
			if (x.prop == null) {
				x = tryget(g.$nativeSimulator, path);
				if (x) isSimulator = true;
			}
			if (x.prop && x.obj) {

				console.log('//调用Native接口 ' + path + "参数:\n" + JSON.stringify(arguments));
				if (typeof x.prop == 'function') {
					x.prop.before = before;
					x.prop.after = after;
					if (x.prop.length != arguments.length) {
						console.log('//警告:实参与形参数量不一致:' + arguments.length + '/' + x.prop.length);
					}
					//如果实在安卓客户端，就必须用x.obj
					//否则会出现NPMethod called on non-NPObject错误
					ret = x.prop.apply(isSimulator ? this : x.obj, arguments);

				} else {
					ret = x.prop;
				}
				console.log('//完毕,返回:' + JSON.stringify(ret));
			} else {
				if (g.console && console.log) {
					console.log('//未实现Native接口 ' + path + "参数:\n" + JSON.stringify(arguments));
				}
			}
			return ret;
		}
		f.before = before;
		f.after = after;
		return f;
	}
	$nativeApi.__ = __;

	var $_news = api.news = {},
		$_related = api.related = {},
		$_music = api.music = {},
		$_photo = api.photo = {},
		$_video = api.video = {},
		$_baike = api.baike = {},
		$_timeline = api.timeline = {},
		$_dingyue = api.dingyue = {};

	/**
	 * 新闻
	 */
	$_news.showComments = __('$_news.OnClickCmtMore()');
	
	$_news.recommend = __('$_news.OnClickRecommend()');

	$_news.comment = __('$_news.comment()');
	//点击查看原文
	$_news.showFullText = __('$_news.OnClickText()');
	//点击查看图片
	$_news.showFullImage = __('$_news.OnClickImg(imgUrl,allImgs)');
	//顶新闻
	$_news.digg = __('$_news.OnClickDigg()', function() {
		var span = this.find('span');
		if (this.hasClass('tapped')) return true;
		this.find('img').attr('src', {
			stc: 'images/icon-thumbup-active.png'
		}.stc);
		this.addClass('selected');
		this.closest('.vote-simple').find('.thumb').addClass('tapped');
		span.text(parseInt(span.text(), 10) + 1);
		return true;
	});

	//点击查看更多评论
	$_news.seeMore = __('$_news.OnClickCmtMore()');

	//点击查看评论人信息
	$_news.commUser = __('$_news.OnClickCommUser()');


	//分享
	$_news.share = __('$_news.OnClickShare()');


	$_news.searchTag = __('$_news.OnSearchTag()');
	

	// 性能日志，文章主题渲染完毕
	$_news.articleRendered = __('$_news.onArticleRendered()');
	$_news.articleImgLoaded = __('$_news.onArticleImgLoaded(String imgUrl)');

	//顶评论
	$_news.likeThisComment = __('$_news.OnClickCmtLike(String cid)', function() {
		var isLiked = this.hasClass('thumb-beat');
		if (!isLiked) {
			this.hide();
			this.next().show();
		}
		return !isLiked;
	}, function() {
		this.next().addClass('thumb-beat');
		var likedEle = this.parent().find('.liked'),
			num = parseInt(likedEle.text(), 10);
		likedEle.text(num + 1);
	});

	/**
	 * 时间轴
	 */
	$_timeline.showFullText = __('$_timeline.showFullText()');

	/**
	 * 相关新闻
	 */
	//查看相关新闻
	$_related.viewRelatedArticel = __('$_related.OnClickRelated(String url)');
	// 查看小编最新 3 条新闻
	$_related.viewEditorArticle = __('$_related.OnClickEditorArticle(String url)');

	$_related.OnHitLog = __('$_related.OnHitLog(String json)');
	// 小编相关文章的评论是纯展示，没有点击事件
	// $_related.viewEditorArticleComment = __('$_related.OnClickEditorArticleComment(String url)');

	$_related.viewHotArticel = __('$_related.OnClickHotArticle(String url)');
	/**
	 * 音乐
	 */
	$_music.play = __('$_music.play');
	$_music.stop = __('$_music.stop');

	$wrapper.delegate('.music .play-button', 'click', function() {
		var self = $(this),
			img = self.find('img'),
			playBtns = $wrapper.find('.music .play-button'),
			imgurl;
		if (self.hasClass('stop')) {
			$_music.play(self.attr('data-musicid'));
			//stop all
			playBtns.not(self)
				.removeClass('playing')
				.addClass('stop');

			//play this
			self.removeClass('stop').addClass('playing');
		} else if (self.hasClass('playing')) {
			$_music.stop();
			//stop this
			self.removeClass('playing').addClass('stop')
		}
	});
	


	/**
	 * 图片
	 */
	$_photo.showFullImage = __('$_photo.OnClickPhoto');

	$_photo.search = __('$_photo.OnClickSearchPhoto');

	/**
	 * 视频
	 **/
	var lastClickPlayVideoTime = new Date();
	$_video.play = __('$_video.OnClickVideo', function() {
		if ($ContentRender && $ContentRender.stopMusic) {
			$ContentRender.stopMusic();
		}
		var now = new Date(),
			elapsed = now.getTime() - lastClickPlayVideoTime.getTime();
		lastClickPlayVideoTime = now;
		return elapsed > 1000;
	});

	/**
	 * 百科
	 */
	$_baike.showFullText = __('$_baike.OnClickBaike');

	/**
	* 订阅
	*/
	$_dingyue.addSubscribe = __('$_dingyue.OnClickSubscribeButton');
	$_dingyue.showSubscribe = __('$_dingyue.OnClickShowSubscribe');

	$wrapper.delegate('.dingyue_button button', 'click', function(event) {
		event.stopImmediatePropagation();
		if(!$(this).data('success')) {
			$_dingyue.addSubscribe();
		}
	});

	$wrapper.delegate('.dingyue', 'click', function(event) {
		event.stopImmediatePropagation();
		var self = $(this),
			sub_button = $wrapper.find('.dingyue_button button');
		$_dingyue.showSubscribe();
	});

	var clickTimeLagFlag = false,
		clickTimer = null;


	var wrapper = $('.wrapper');
	wrapper.delegate('.native-call', 'click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		// 如果两次点击的时间在500毫秒以内，则让第二次点击无效
		if(clickTimeLagFlag == false){
			clickTimeLagFlag = true;
			clickTimer = setTimeout(function(){
				clickTimeLagFlag =false
			},1000);
		}else{
			// 如果连续一直点按，则还是只有第一次有效
			clearTimeout(clickTimer);
			clickTimer = setTimeout(function(){
				clickTimeLagFlag =false
			},1000);
			return false;
		}
		var self = $(this);
		if (self.attr('disabled')) return;

		var fname = self.attr('data-native'),
			args = prepareParams(self, fname, e),
			x = tryget(api, fname),
			isCallNative = true,
			isCallAfter,
			tmp;
		
		if (x.prop && x.prop.before) {
			isCallNative = x.prop.before.call(self);
		}
		if (isCallNative && x.prop) {
			isCallAfter = x.prop.apply(self, args);

			if (isCallAfter !== false && x.prop.after) {
				x.prop.after.call(self);
			}
		}

		return false;
	}).delegate('.pseudo-a', 'click', function(e) {
		if (e.target !== this) return;
		var href = $(e.target).data('href');
		if (href.indexOf('javascript:') >= 0) return;
		if (href) location.href = href;
	});

	function prepareParams(node, fname, e) {
		var p1 = node.attr('data-param1'),
			p2 = node.attr('data-param2'),
			ret, extra;
		if (p1 === null && p2 === null) {
			ret = [];
		} else if (p1 !== null && p2 === null) {
			ret = [p1];
		} else {
			ret = [p1, p2];
		}
		if (fname == 'news.showFullImage') {
			var src = node[0].getAttribute('src');
			if (!src) return;
		}
		if (fname == 'photo.showFullImage' || fname == 'news.showFullImage') {
			if (ret.length == 2) ret.length = 1;
			extra = node[0].getBoundingClientRect();
			ret.push(extra.left);
			ret.push(extra.top);
			ret.push(extra.width);
			ret.push(extra.height);
			if (p2) ret.push(p2);
		}

		if(fname == 'related.viewRelatedArticel' || fname == 'related.viewHotArticel'){
			//如果是相关和热门，则返回当前点击的坐标，以及当前项的数据
			var pixelRatio = devicePixelRatio||webkitDevicePixelRatio||mozDevicePixelRatio||1;

			var screenX = e.clientX,
				screenY = e.clientY,
				rtObj = {},
				curIndex = node.index();
				if(fname == 'related.viewRelatedArticel'){
					curIndex = node.data('index');
				}
			if (pixelRatio != 1) {
	            screenX = screenX * pixelRatio ;
	            screenY = screenY * pixelRatio ;
	        }
	        rtObj.screenPos = screenX+","+screenY;
	        rtObj.clickNews = {};

			if(fname == 'related.viewRelatedArticel'){
				rtObj.clickNews = window.detListData.related[curIndex];
			}else{
				rtObj.clickNews = window.detListData.hotNewsList[curIndex];
			}
		 	ret = [JSON.stringify(rtObj)];

		}

		return ret;
	}

	// 性能日志
	wrapper.on('partDone', function(e, which, data) {
		if(which == '#article-tmpl') {
			api.news.articleRendered();
		}

	});

	// 滚动停止时将用户操作信息传递打点

	wrapper.on('domDone',function(){

		//获取屏幕百分百
		function getPagePercent(){
			var winHeight = $(window).height(),
				scrollTop = $(window).scrollTop(),
				docHeight = $(document).height(),
				percent = Math.floor((winHeight + scrollTop)/docHeight*100);
			return percent;
		}

		//调取native方法，并传值
		function postIfoToNative(fnName,arg){
			var args = [arg],
				x = tryget(api, fnName),
				isCallNative = true,
				isCallAfter,
				tmp;
			
			if (x.prop && x.prop.before) {
				isCallNative = x.prop.before;
			}
			if (isCallNative && x.prop) {
				isCallAfter = x.prop.apply(this, args);

				if (isCallAfter !== false && x.prop.after) {
					x.prop.after;
				}
			}
		}

		// 记录滑动次数swipeNum
		var startPosY = 0,
			swipeNum = 0,
			$body = $('body');

		$body.on('touchstart',function(e){
			startPosY = e.targetTouches[0].clientY;
		});
		$body.on('touchend',function(e){
			endPosY = e.changedTouches[0].clientY;
			if(Math.abs(endPosY - startPosY )>30){
				swipeNum ++;
			}
		});

		//获取滑动停止时元素是否在当前视窗
		function elementInViewport(el) {
			var rect = el.getBoundingClientRect(),
				winHeight = $(window).height(),
				curTop = rect.top,
				curBottom = curTop + rect.height,
				triggerHeight = Math.min(rect.height / 2, winHeight / 3);

			return !(curTop > (winHeight - triggerHeight) || curBottom < triggerHeight);
		}

		// 获取相关新闻或热门推荐在本视窗的列表，并将其放入向native回传的列表
		function getCurWinDataList(listName){

			if(listName == "recommend-articles"){
				var showedRelatedList = [],
					listItem = $('.recommend-articles li');
					listlen = listItem.length;
				for(var i = 0; i < listlen; i++) {
					if(elementInViewport(listItem[i])) {
						if( window.detListData){
							showedRelatedList.push(window.detListData.related[i]);
						}
					}
				}

				return showedRelatedList;

			}else{
				var showedHotList = [],
					listItem = $('.hot-articles li');
					listlen = listItem.length;

				for(var i = 0; i < listlen; i++) {
					if(elementInViewport(listItem[i])) {
						if( window.detListData){
							showedHotList.push(window.detListData.hotNewsList[i]);
						}
					}
				}
				return showedHotList;
			}
		}

		
		var scrollEndTimer = null;

		// 滚动停止时向native传值 
		$(window).scroll(function(){
		    if (scrollEndTimer){
		    	clearTimeout(scrollEndTimer);
		    }
		    scrollEndTimer = setTimeout(function(){

		    	var userData = {
					percent:getPagePercent(), // 当前位置相对整个页面的百分比
					slidingCnt:swipeNum, // 用户滑动屏幕的次数
					showedRelatedList:getCurWinDataList('recommend-articles'),// 相关新闻在当前视窗的数据列表
					showedHotList:getCurWinDataList('hot-articles') // 热门推荐在当前视窗的数据列表
				}

				//调取native方法，并传值
				postIfoToNative('related.OnHitLog',JSON.stringify(userData))

		    },100);
		});
	})
	
})(this)