
(function(g) {
	var wrapper = $('.wrapper'),
		//后端接口
		apis = g.$apis = {
			baseUrl: 'http://jk.kandian.360.cn/index.php',
			commentUrl: 'http://web.comment.kandian.360.cn/'
		},
		_secretKey = '3DDDC1DC6A27A2EF649325B334109296',
		_version = '3.0.1',
		_src = 'kandian_wap',
		rng = new RNG(),
		JsonContentType = 'application/json; charset=utf-8',
		$cr = g.$ContentRender,
		render = g.render;

	/**
	 * 获取当前新闻的url
	 */
	function $getNewsUrl() {
		//如果页面输出了$url则使用之，否则从传入的数据中获取
		return g.$key || $utils.tryget($datum, 'article.url', null);
	}

	function generateSalt() {
		return (+(rng.uniform() + '').substr(2)).toString(16).substr(0,8);
	}
	/**
	 * 从渲染好的评论列表html中抽取评论项部分
	 */
	var comentItemMarkBegin = '<!-- comment-items-begin -->',
		comentItemMarkEnd = '<!-- comment-items-end -->';

	function extractCommentItems(html) {
		if (!html) return '';
		var begin = html.indexOf(comentItemMarkBegin),
			end = html.indexOf(comentItemMarkEnd);
		htmlOfUl = html.substring(begin + comentItemMarkBegin.length, end).replace(/\n\t+/g, "\n"),
		ulEle = $(htmlOfUl);
		return ulEle.children();
	}

	/**
	 * 获取新闻评论列表接口,
	 * 页面的初始评论是空的，所有的评论都是 异步 接口获取
	 */
	apis.getNewsComments = function(done, error) {
		var key = $getNewsUrl(),
			comment_id = '',
			salt = generateSalt();
			verify = md5([_secretKey, key, comment_id || 0, 0, salt].join('')) + salt;
		var ajaxData = {
			type: 'get',
			dataType: 'jsonp',
			url: apis.commentUrl + 'fetchcomment',
			contentType: JsonContentType,
			jsonpCallback: '__callback_getNewsComments',
			data: {
				key: key,
				comment_id: comment_id,
				pointer: 0,
				verify: verify,
				src: _src
			},
			success: done || $.noop,
			error: error || $.noop
		};
		return $.ajax(ajaxData);
	};

	/**
	 * 匿名评论
	 */
	apis.writeCommentAnonymously = function(commentContent, done, error) {
		var ajaxData = {
			type: 'get',
			dataType: 'jsonp',
			url: apis.baseUrl + '?mo=news&ro=comment&ra=addanon&_cv=1&f=jsonp',
			contentType: JsonContentType,
			data: {
				url: $getNewsUrl(),
				content: commentContent
			},
			success: done || $.noop,
			error: error || $.noop
		};
		return $.ajax(ajaxData);
	};

	/**
	 * 获取当前新闻用户表态数量
	 */
	apis.getUserFeelingAboutNews = function(done, error) {
		var ajaxData = {
			type: 'get',
			dataType: 'jsonp',
			url: apis.baseUrl,
			contentType: JsonContentType,
			jsonpCallback: '__callback_getUserFeelingAboutNews',
			data: {
				mo: 'news',
				ro: 'support',
				ra: 'getmood',
				_cv: _version,
				f: 'jsonp',
				typ: 0,
				url: $getNewsUrl()
			},
			success: done || $.noop,
			error: error || $.noop
		};
		return $.ajax(ajaxData);
	};

	/**
	 * 用户表达对当前新闻的态度
	 */
	apis.expressFeelingAboutNews = function(feeling, done, error) {
		var ajaxData = {
			type: 'get',
			dataType: 'jsonp',
			url: apis.baseUrl,
			contentType: JsonContentType,
			jsonpCallback: '__callback_expressFeelingAboutNews',
			data: {
				mo: 'news',
				ro: 'support',
				ra: 'addmood',
				_cv: _version,
				f: 'jsonp',
				typ: 0,
				url: $getNewsUrl(),
				mood: feeling
			},
			success: done || $.noop,
			error: error || $.noop
		};
		return $.ajax(ajaxData);
	};

	/**
	 * 顶评论
	 */
	apis.likeThisComment = function(commentId, done, error) {
		var key = $getNewsUrl(),
			comment_id = commentId,
			salt = generateSalt(),
			attitude = 'good',
			verify = md5([_secretKey, key, attitude, comment_id, salt].join('')) + salt;
		var ajaxData = {
			type: 'get',
			dataType: 'jsonp',
			url: apis.commentUrl + 'punch',
			contentType: JsonContentType,
			jsonpCallback: '__callback_likeThisComment',
			data: {
				key: key,
				attitude: attitude,
				comment_id: comment_id,
				verify: verify,
				src: _src
			},
			success: done || $.noop,
			error: error || $.noop
		};
		return $.ajax(ajaxData);
	};

	$cr.renderCommentsCompose = (function() {
		return $cr.makeNoPreprocessRender('#comments-compose-tmpl');
	}());

	/**
	 * 初始化小编相关文章
	 */
/*	function initEditorArticle() {
		$.ajax({
			type: 'get',
			dataType: 'jsonp',
			url: apis.baseUrl,
			contentType: JsonContentType,
			jsonpCallback: '__callback_initEditorArticle',
			data: {
				mo: 'news',
				ro: 'news',
				ra: 'detail',
				_cv: _version,
				f: 'jsonp',
				url: $getNewsUrl(),
			},
			success: function(data){
				if(data.status == 0) {
					$cr.renderEditorArticleList(data.data.editorNewsList || []);
				}
			}
		})
	};*/

	/**
	 * 初始化心情表态模块
	 */
	function initExpressFeelingMod() {

		var expFeelingMod = $('.exp-feeling');

		function init(data) {
			if (!data) data = [0, 0, 0, 0, 0, 0];
			var list = expFeelingMod.find('li span');
			for (var i = 0; i < list.length; ++i) {
				list[i].innerHTML = $utils.toKw(data[i + 1] || 0);
			}
		}

		var css = {
				shrink: {
					width: '27px',
					'margin-left': '-27px',
					left: '100%'
				},
				expand: {
					width: '',
					'margin-left': '',
					left: ''
				}
			},
			arrow = {
				expand: 'http://p1.qhimg.com/d/inn/7e653e55/arrow-right_.png',
				shrink: 'http://p8.qhimg.com/d/inn/780bca5f/arrow-left_.png'
			},
			status = 'shrink';

		/**
		 * 收起、展开心情图标列表
		 */
		expFeelingMod.delegate('.handle', 'click', function() {
			var handle = expFeelingMod.find('.handle img');
			status = status == 'expand' ? 'shrink' : 'expand';
			expFeelingMod.css(css[status]);
			handle.attr('src', arrow[status]);
			fixFeelingSize();
			/**
			 * 点击心情图标
			 */
		}).delegate('li a', 'click', function(e) {
			// fix微信，微信中 带有 disable prop 的绑定时间无效
			if (expFeelingMod.attr('disabled_fixweixin')) return;
			var img = $(e.target),
				src = img.attr('src');

			//如果心情图标下面的数值小于1000，则直接增加
			//TODO:否则数值不变，播放一个+1动画
			var span = img.next(),
				s = span.text(),
				feelingIndex = img.closest('li').index() + 1;

			expFeelingMod.attr('disabled_fixweixin', true);
			if (!s.match(/(K|W)$/)) {
				span.text(parseInt(s, 10) + 1);
			}

			var img1 = img.attr('data-src');
			if (img1) {
				img.attr('src', img1);
			} else {
				img.attr('src', src.replace(0, function(m) {
					return 1;
				}));
			}
			img.addClass('thumb-beat');
			apis.expressFeelingAboutNews(feelingIndex);
		});

		/**
		 * 获取当前新闻的表态数据
		 */
		apis.getUserFeelingAboutNews(function(json) {
			var ok = json.status == 0 && json.msg == 'succ';
			init(ok ? json.data : null);
		}, function() {
			init();
		});
	}

	function fixFeelingSize() {
		//表态
		//android webkit 对flex支持的不好
		//这里用js计算li的宽度
		var ul = $('.exp-feeling').find('ul'),
			lis, ulWidth, rect;
		if (ul.length) {
			lis = ul.find('li');
			rect = ul[0].getBoundingClientRect();
			ulWidth = rect.right - rect.left - 1; //IE67 has no rect.width
			lis.css('width', parseInt(ulWidth / lis.length));
		}
	}

	/**
	 * 初始化链接点击，通过data参数判断
	 */
	~function initClickEvents() {
		wrapper.on('click', 'a', function(e){
			e.preventDefault();
			var $this = $(this),_href = $this.attr('href'), dataParam;
			if(_href && !_href.match(/^(javascript|#).*$/)) {
				e.stopImmediatePropagation();
				dataParam = $utils.getParam('data', _href);
				if(dataParam) {
					try {
						dataParam = Base64.decode(dataParam);
						dataParam = JSON.parse(dataParam);
					} catch(e) {

					}

					if($.isPlainObject(dataParam)) {
						location.href = dataParam.ourl || _href;
					}
				}
				location.href = _href;
				return false;
			}
		});
	}();

	/**
	 * [initClickEvents 添加与手机助手的合作逻辑]
	 * @return {[type]} [description]
	 */
	var ThirdPartyZhushou = function () {
		// 这里由 src 改为 from ，原因是转码库重构，src 作为了选择模板的逻辑
		var src = $utils.getParam('from'),
			$loading = $('<div class="third-party-loading"><div class="loading"></div></div>'),
			$customWrap = $('<div class="wrapper-zhushou"></div>'),
			$packup = $('<div class="zhushou-pack-up"><a href="javascript:;" class="pack-up" data-content="点击收起全文"></a></div>'),
			$body = $('body'), triggerFlag = 'zhushou', dependency = [
				'http://openbox.mobilem.360.cn/html/api/js/qstore.js',
				'http://openbox.mobilem.360.cn/html/api/js/AppStatusMgr.js'
			];

		var canTrigger = function() {
			return src == triggerFlag;
		};

		var bindEvents = function() {
			$customWrap.on('click', function(e){
				var $target = $(e.target);
				if($target.is('a.more')) {
					e.preventDefault();
					$target.hide();
					$body.removeClass('third-party-zhushou');
					!$body.find($packup).length && $customWrap.after($packup);
					$customWrap.addClass('pack-up');
					$packup.show();
				}
			});

			$body.on('click', '.zhushou-pack-up a.pack-up', function(e) {
				e.preventDefault();
				$packup.hide();
				$body.addClass('third-party-zhushou');
				$customWrap.removeClass('pack-up').find('a.more').show();
			});
		};

		var loadScript = function(url, callback) {
			$('<script>').attr({
				'src': url
			}).on('load', callback).appendTo('body');
		};

		var loadAllDependency = function(dependency, callback) {
			var len = dependency.length, i = 0;
			var loop = function() {
				if(i < len) {
					loadScript(dependency[i++], loop);
				} else {
					callback && callback();
				}
			};
			loop();
		};

		return {
			prepare: function() {
				if(!canTrigger()) {
					return;
				}
				$body.addClass('third-party third-party-oh').append($loading);
			},
			init: function() {
				if(!canTrigger()) {
					return;
				}
				// $datum.article.nid 在 wrapper done 后才有数据
				// 这里主要做一个兼容
				var id = $utils.getParam('zhushouid') ||
						 $utils.getParam('id') ||
						 (/h5\.kandian\.360\.cn/.test(location.host) && location.pathname.split('/').pop().slice(0, -5)) ||
						 $datum.article.nid;
				if(!id) {
					return;
				}
				// http://test1.baohe.mobilem.360.cn/html/demo/download.html
				// http://openbox.mobilem.360.cn/mix/getKandianApps/id/1
				// http://test1.baohe.mobilem.360.cn/mix/getKandianApps/id/1
				$.ajax({
					url: 'http://openbox.mobilem.360.cn/mix/getKandianApps/id/' + id,
					type: 'get',
					dataType: 'jsonp',
					timeout: 3e4,
					success: function(data, status, xhr) {
						if(data && data.data && data.data.length) {
							$body.addClass('third-party-zhushou');
							// 查找 sid http://zhushou.360.cn/search/index/?kw=%E7%9C%8B%E7%82%B9
							// 获取详细数据 http://openbox.mobilem.360.cn/index/getSoftInfoByIdsAccordingToFields?sids=1937129
							// sids 支持 | 分割获取多个数据
							// 为了避免为了一条看点额外请求接口，准备写死。
							// 后，与 后端 沟通， 让接口做了合并一事
							$ContentRender.renderThirdPartyZhushou(data, true, false, $customWrap);
							bindEvents();
							wrapper.after($customWrap);
							loadAllDependency(dependency, function(){
								AppStatusMgr.ready(function(){
									AppStatusMgr.start();
								});
							});
						}
					},
					error: function(xhr, type) {
					},
					complete: function(xhr, status) {
						$body.removeClass('third-party-oh');
						$loading.remove();
					}
				});
			}		
		};
	}();
	// 当源自 手机助手 时，显示 loading...
	ThirdPartyZhushou.prepare();

	var isSetReadCount = false; //是否已经设置了分享页阅读量

	/**
	 * 当某个section/part/mod渲染完后做一些处理
	 */
	wrapper.on('partDone', function(e, which) {
		function checkTextareaLength() {
			section.find('b').text(textarea.val().length);
		}
		function showTextarea() {
			setTimeout(function() {
				window.scrollTo(0, section.offset().top);
			}, 500);
		}

		/**
		 * 评论框
		 */
		if (which.indexOf('#comments-compose-tmpl') >= 0) {
			var textarea = $('#comment-content'),
				section = $('.comments-compose.part'),
				expFeelingBarHeight = $('.exp-feeling').height(),
				wrapperHeight = wrapper.height() + expFeelingBarHeight;

			// TODO 这里为什么要设置10em的间隔？
			//section.css('margin-bottom', '10em');

			//监控输入字数变化
			textarea.change(checkTextareaLength)
				.on('keyup input paste', checkTextareaLength)
				.focus(function() {
					/**
					 * 软键盘打开时增加wrapper高度
					 * 好让输入框能在软键盘上面
					 */
					commentPrompt.hide();
					showTextarea();
				}).blur(showTextarea);

			/**
			 * 匿名评论
			 */
			var pubCommentButton = $('#pub-comment'),
				commentPrompt = $('#comment-prompt');
			commentPrompt.dismiss = function(msg, n) {
				var self = this;
				if (msg) this.text(msg);
				setTimeout(function() {
					self.hide();
				}, n);
			};
			//点击发表按钮
			pubCommentButton.click(function() {
				var text = textarea.val();
				if (!text || text.length === 0) {
					commentPrompt.show().dismiss('请写评论!', 5e3);
					return;
				}
				if (text.length > 140) {
					commentPrompt.show().dismiss('评论字数不得多于140字!', 5e3);
					return;
				}
				pubCommentButton.attr('disabled',true);
				apis.writeCommentAnonymously(text, function(json) {
					if (!json || json.msg != 'succ') {
						pubCommentButton.removeAttr('disabled');
						var msg;
						/*
						 *     101 param empty           url参数空
						 *     102 content too long     评论内容过长
						 *     106 error send           评论失败
						 *     109 too frequent         评论太频繁
						 *     112 content empty        评论内容为空
						 *     113 nid not match url    nid和url参数不匹配
						 */
						switch (json.status) {
							case '102':
								msg = '评论内容过长!';
								break;
							case '109':
								msg = '评论太频繁!';
								break;
							case '112':
								msg = '评论内容为空!';
								break;
							default:
								msg = '评论失败!';
						}
						commentPrompt.show().dismiss(json.status == '109' ? '操作过于频繁！' : '评论失败!', 5e3);
						return;
					}
					commentPrompt.show().dismiss('评论成功!', 5e3);

					json.time = json.data;
					json.time_total = 1;
					var html = $cr.renderComments(json, false, true),
						dom = extractCommentItems(html);
					$('.comment-list').prepend(dom).show();
					textarea.val('');
					$('.comments-compose.part').find('b').text(0);
					pubCommentButton.removeAttr('disabled');
					$('.no-comments').hide();
				}, function() {
					commentPrompt.show().dismiss('评论失败!', 5e3);
					pubCommentButton.removeAttr('disabled');
				});
			});

			/**
			 * 获取更多评论
			 */
		} else if (which.indexOf('#comments-tmpl') >= 0) {
			// 看模板的逻辑， pc 根本没有加载更多的 dom 结构 
			// var getMoreCommentButton = $('#more-comment');
			function fetchComment(flag) {
				// 因为 初始化页面时 是渲染的 的 空的 评论，在 pc 版本评论是其他接口
				// 异步加载的， flag 表明是否 第一次加载
				flag = flag || false;
				$apis.getNewsComments(function(json) {
					if (!json || json.status != 0 || !json.data) return;

					if (!json.data.comments || json.data.comments.length == 0) {
						// getMoreCommentButton.text('没有评论啦!');
						return;
					}
					//复用$ContentRender.renderComments，从渲染结果html中抽取出评论项
					var html = $cr.renderComments(json.data, false, true);
					if(!flag) {
						var dom = extractCommentItems(html);
						$('.comment-list').append(dom).show();
						$('.no-comments').hide();
					} else {
						$('.comments.part').replaceWith(html);
					}
				});
			}
			// getMoreCommentButton.click(fetchComment);
			// 第一次加载
			fetchComment(true);
		} else if (which.indexOf('#article-tmpl') >= 0) {
			// v2.1.4 移除轻互动表情，by zhangdaiping 2015-03-23
			//if ($('.exp-feeling').length) initExpressFeelingMod();
		}
	}).on('done', function() {
		fixFeelingSize();
		var obj = wrapper.find('object');
		var rate = 0.56;
		setVideoHeight(obj,rate)
		/*initEditorArticle();*/
		/*ThirdPartyZhushou.init();*/
	});

	/**
	 * 对nativeApi.js的扩展
	 */
	//点击‘赞评论’
	g.$nativeSimulator.$_news.OnClickCmtLike = function(cid) {
		var self = this;
		apis.likeThisComment(cid, function(json) {
			if (!json || json.msg != 'succ') return;

			var isLiked = self.hasClass('thumb-beat');
			if (!isLiked) {
				self.hide();
				self.next().show();
			}
			self.next().addClass('thumb-beat');
		});
		return true;
	};


	/*视频高度控制*/
	function setVideoHeight(obj,rate){
		obj.each(function(i){
			var me = $(this);
			var vWidth = me.width(),
				vHeight = vWidth * rate;
			me.css({"height":vHeight+"px"});
		})
		return;
	}

	window.$wap = true;

})(this);