/**
 * Android Native Interface related
 * wangweihua@360.cn
 * 2014-7
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
		for (var t = o, i = 0; i < len; ++i) {
			part = parts[i];
			if (part in t) {
				prev = t;
				t = t[parts[i]];
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
		//点击查看原文, 查看原文的接口移除 v3.0.1
		g.$nativeSimulator.$_news.OnClickText = navigateToUrl;
		g.$nativeSimulator.$_news.onArticleRendered = function() {
			return true;
		};
		g.$nativeSimulator.$_news.onArticleImgLoaded = function(imgurl) {
			return true;
		};
	}

	if (!g.$_baike) {
		g.$nativeSimulator.$_baike.OnClickBaike = navigateToUrl;
	}

	if (!g.$_video) {
		g.$nativeSimulator.$_video.OnClickVideo = function(videoUrl) {
			location.href = $utils.extractVideoUrl(videoUrl);
		};
	}

	if (!g.$_timeline) {
		g.$nativeSimulator.$_timeline.showFullText = navigateToUrl;
	}

	if (!g.$_related) {
		g.$nativeSimulator.$_related.OnClickRelated = navigateToUrl;
		g.$nativeSimulator.$_related.OnClickEditorArticle = navigateToUrl;
		// g.$nativeSimulator.$_related.OnClickEditorArticleComment = function(newsUrl) {
			// 这个移除，小编的相关文章的评论没有点击事件
		// };
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
	$_news.comment = __('$_news.comment()');
	//点击查看原文, 查看原文的接口移除 v3.0.1
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
	//踩新闻
	$_news.bury = __('$_news.OnClickBury()', function() {
		var span = this.find('span'),
			img;
		if (this.hasClass('tapped')) return true;
		this.find('img').attr('src', {
			stc: 'images/icon-thumbdown-active.png'
		}.stc);
		this.addClass('selected');
		this.closest('.vote-simple').find('.thumb').addClass('tapped');
		span.text(parseInt(span.text(), 10) + 1);
		return true;
	});
	//点击查看更多评论
	$_news.seeMore = __('$_news.OnClickCmtMore()');

	//分享
	$_news.share = __('$_news.OnClickShare()');

	$_news.searchTag = __('$_news.OnSearchTag()');

	//下一篇
	$_news.next = __('$_news.OnClickNextNews()');
	//上一篇
	$_news.prev = __('$_news.OnClickPrevNews()');

	// 性能日志，文章主题渲染完毕
	$_news.articleRendered = __('$_news.onArticleRendered()');
	$_news.articleImgLoaded = __('$_news.onArticleImgLoaded(String imgUrl)');

	// 点击广告
	$_news.clickAd = __('$_news.OnClickAd(String id)');
	$_news.showAd = __('$_news.OnShowAd(String id)');

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
	// 小编相关文章的评论是纯展示，没有点击事件
	// $_related.viewEditorArticleComment = __('$_related.OnClickEditorArticleComment(String url)');

	/**
	 * 音乐
	 */
	$_music.play = __('$_music.play');
	$_music.stop = __('$_music.stop');

	//$wrapper.on('done', function() {
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
	//});


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

	/**
	 * 时间轴
	 * 这段代码应该放在contentRender.js里
	 */
	var lastTapTime = 0;
	$wrapper.delegate('ul.timeline .item', 'tap', function(e) {
		var t = new Date() - lastTapTime;
		lastTapTime = new Date();
		if (t < 200) return;

		e.stopPropagation();
		var cur = $('.timeline').find('.cur'),
			self = $(this).closest('li'),
			p = self.find('p'),
			duration = 200;

		if (self[0] == cur.closest('li')[0]) {
			p.removeClass('cur').slideToggle(duration);
		} else {
			if (cur.length) {
				cur.removeClass('cur').slideUp(0, function() {
					p.addClass('cur').slideToggle(duration);
				});
			} else {
				p.addClass('cur').slideToggle(duration);
			}
		}
	});

	var wrapper = $('.wrapper');

	wrapper.delegate('.native-call', 'click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		var self = $(this);
		if (self.attr('disabled')) return;

		var fname = self.attr('data-native'),
			args = prepareParams(self, fname),
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

	function prepareParams(node, fname) {
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
		return ret;
	}

	// 性能日志
	wrapper.on('partDone', function(e, which, data) {
		if(which == '#article-tmpl') {
			api.news.articleRendered();
		}

		// 广告渲染完毕，添加展示打点逻辑
		if(which == '#news-detail-ad-tmpl') {
			var adItems = $('.news-detail-ad.part .ad-item-inner').toArray();
			if(!adItems.length) {
				return;
			}
			var	len = adItems.length, // 实际广告条数
				showedNum, //  已经展示的广告数
				$win = $(window),
				elementInViewport = function(el) {
					var rect = el.getBoundingClientRect(),
						winHeight = $win.height(),
						curTop = rect.top,
						curBottom = curTop + rect.height,
						triggerHeight = Math.min(rect.height / 2, winHeight / 3);

					return !(curTop > (winHeight - triggerHeight) || curBottom < triggerHeight);
				},
				showAd = function() {
					// 如果所有的广告都展示打点完毕
					// 那么移除 scroll 监听
					if(len == 0) {
						$win.off('scroll.showAd');
					}
					for(var i = 0; i < len; i++) {
						if(elementInViewport(adItems[i])) {
							$_news.showAd($(adItems[i]).data('param1'));
							adItems.splice(i,1);
							i--;
							len--;
						}
					}
				};
			$win.on('scroll.showAd', showAd);
			showAd();
		}
	});
})(this)