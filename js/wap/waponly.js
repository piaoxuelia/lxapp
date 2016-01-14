
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


	var $defaultMagnificPopupCreateOpts = {
		delegate: 'a[data-mfp-src]',
		type: 'image',
		closeOnContentClick: false,
		closeBtnInside: false,
		mainClass: 'mfp-with-zoom mfp-img-mobile',
		
		image: {
			verticalFit: false,
			titleSrc: function(item) {
				var str = '';
				for(var i in item){
					str+=i+":"+item[i];
				}
		    return $(item.el).attr('title');
		  },
		},
		gallery: {
			enabled: true
		},
		zoom: {
			enabled: true,
			duration: 300, // don't foget to change the duration also in CSS
			opener: function(element) {
				return element.find ? element.find('img') : $(element.img[0]);
			}
		},
		callbacks: {
			open: function(e) {
				//强制360极速浏览器(7.5.3.312,30.0.1599.101)渲染body滚动条
				document.body.scrollTop+=1;
				document.body.scrollTop-=1;
			}
		}
	};

	function useMagnificPopup(callback) {
		var scriptId = 'magnificPopupScript',
			script = $('#' + scriptId);
		if (script.length > 0) {
			callback();
		} else {
			$('<link>').attr({
				'type': 'text/css',
				'rel': 'stylesheet',
				'href': 'http://s3.qhimg.com/!44db5e31/magnific-popup.css'
			}).appendTo('head');
			$('<script>').attr({
				'id': scriptId,
				'src': 'http://s9.qhimg.com/!1a5e34b7/jquery.magnific-popup.js'
			}).on('load', callback).appendTo('body');
		}
	}
	function initGalleryMagnificPopup($el) {
		useMagnificPopup(function() {
			$el.magnificPopup($defaultMagnificPopupCreateOpts);
		});
	}

	var galleryFlag = true;
	/**
	 * 当某个section/part/mod渲染完后做一些处理
	 */
	wrapper.on('partDone', function(e, which) {
		/**
		 * 评论
		 */
		if (which.indexOf('#comments-tmpl') >= 0) {
			function fetchComment(flag) {
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

		if (which.indexOf('#article-tmpl') >= 0) {
			if($('.gallery-wrap').length>0 && galleryFlag){
				galleryFlag = false;
				initGalleryMagnificPopup($('.mod .gallery'));
			}
		}
	})

	
	//点击‘赞评论’
	wrapper.on('click','.thumbup',function(){
		var me = $(this),
			data = me.data('param1'),
			numDom = me.siblings('.liked'),
			thumbupNum = Number(numDom.text());

		me.hide();
		me.next('.thumbup-active').show().addClass('thumb-beat');
		numDom.text(thumbupNum+1);

		apis.likeThisComment(data, function(json) {
			if (!json || json.msg != 'succ') return;
		});
		return true;

	})

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