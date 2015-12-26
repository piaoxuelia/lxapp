
(function(g) {
	var wrapper = $('.wrapper'),
		//后端接口
		apis = g.$apis = {
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
		 * 评论
		 */
		if (which.indexOf('#comments-tmpl') >= 0) {
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
		} 
	}).on('done', function() {
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