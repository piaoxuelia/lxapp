
(function(g) {
	var $cr = {},
		$renderedSections = [],
		$win = $(window),
		$doc = $(document),
		$totalRenderTime = 0;
		
	$.noop = function(){};
	g.$pageHPadding = 16; //正文水平左右padding
	g.$isWeixin = navigator.userAgent.toLowerCase().indexOf('micromessenger') > 0;
	g.$is360Browser = navigator.userAgent.indexOf("360") >= 0;
	g.$isShixianInstalled = location.search.indexOf('isappinstalled') > 0;
	g.$datum = {
		mod: {}
	};
	ejs.open = "{%";
	ejs.close = "%}";
	if ($ && $.fn && !$.fn.tap) $.fn.tap = $.fn.click;

	function shake(n) {
		if (typeof n == 'undefined') n = 100;
		//触发scroll，调整锚点位置
		window.scrollTo(0, $win.scrollTop() + 1);
		setTimeout(function() {
			window.scrollTo(0, $win.scrollTop() - 1);
		}, n);
	}

	var $defaultMagnificPopupCreateOpts = {
		delegate: 'a[data-mfp-src]',
		type: 'image',
		closeOnContentClick: false,
		closeBtnInside: false,
		mainClass: 'mfp-with-zoom mfp-img-mobile',
		image: {
			verticalFit: false
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
				'href': 'http://s0.qhimg.com/!51b589d0/magnific-popup.css'
			}).appendTo('head');
			$('<script>').attr({
				'id': scriptId,
				'src': 'http://s9.qhimg.com/!1a5e34b7/jquery.magnific-popup.js'
			}).on('load', callback).appendTo('body');
		}
	}



	/**
	 * render
	 * 核心渲染函数
	 * @param  {String} tmplId            [模板id]
	 * @param  {Object} data              [模板数据]
	 * @param  {Boolean} clearExistContent [是否清除已有内容]
	 * @param  {Function} preprocess        [预处理函数]
	 * @param  {Boolean} returnHtml        [是否仅返回渲染后的html]
	 */
	function render(tmplId, data, clearExistContent, preprocess, returnHtml, wrapper) {

		var renderBegin = new Date();
		var tmpl = $(tmplId).html(),
			feeds = typeof preprocess == 'function' ? preprocess(data) : data,
			html = '',
			dom, errmsg;
		console.log(feeds)
		wrapper = wrapper || $('.wrapper').last();

		if (feeds == null) return html;

		//save alll data for further use
		if (!$.isEmptyObject(feeds)) {
			$datum[tmplId.replace(/^#|\-tmpl/g, '')] = feeds;
		}
		if (!tmpl) {
			errmsg = 'template ' + tmplId + ' is missing or empty!';
			console.error(errmsg);
			return '<p>' + errmsg + '</p>';
		}
		// 过滤空白模块，by:zhangdaiping date:2015-03-09
		var newFeedsContent = [];
		if (feeds.content) {
			$.each(feeds.content, function(k, v) {
				if (v.type == 'txt') {
					if ($.trim(v.value)) {
						newFeedsContent.push(v);	
					}
				} else {
					newFeedsContent.push(v);
				}
			});
			feeds.content = newFeedsContent;
		}
		try {
			html = ejs.compile(tmpl)(feeds, {
				compileDebug: true
			});

			if (returnHtml) return html;
			dom = $(html);
			if (clearExistContent) {
				$renderedSections = [];
				wrapper.html(dom);
			} else {
				wrapper.append(dom);
			}
			wrapper.trigger('partDone', [tmplId, feeds]);
			$renderedSections.push(dom[0]);
		} catch (e) {
			if (g.$debug === true) {
				e.message = 'error while compiling ' + tmplId + ':' + e.message;
				throw e;
			}
		}
		var renderEnd = new Date(),
			delta = renderEnd - renderBegin;
		$totalRenderTime += delta;
		if(g.$debug) console.log('//Profiling: Render ' + tmplId + ' use ' + (renderEnd - renderBegin) + 'ms');
		return this;
	}
	$cr.render = render;

	/**
	 * 渲染插入到中的模块或片段(mod/parts)
	 */
	function renderArticleParts(partType, data, preprocess) {
		var tmplId = '#' + partType + '-tmpl',
			tmpl = $(tmplId).html(),
			feeds = typeof preprocess == 'function' ? preprocess(data) : data,
			html, dom;

		if (feeds == null) return this;
		if (!tmpl) {
			console.error('template ' + tmplId + ' is missing or empty!');
			return this;
		}

		if (!$.isEmptyObject(feeds)) {
			$datum.mod[tmplId.replace(/^#|\-tmpl/g, '')] = feeds;
		}
		try {
			html = ejs.compile(tmpl)(feeds, {ompileDebug: true});
		} catch (e) {
			if (g.$debug === true) {
				e.message = 'error while compiling ' + tmplId + ':' + e.message;
				throw e;
			}
		}
		return html;
	}

	/**
	 * 返回一个无需处理数据的render函数
	 * @param  {string} tmplId 模板id
	 */
	function makeNoPreprocessRender(tmplId, getWrapper) {
		return function(data, clearExistContent) {
			return render.call($cr, tmplId, data, clearExistContent, null, false, getWrapper ? getWrapper() : null);
		};
	}
	$cr.makeNoPreprocessRender = makeNoPreprocessRender;

	/**
	 * 插入到正文的模块或片段的列表
	 * 不在列表中的不显示
	 * mod与part相比更独立，有鲜明的边界
	 */
	var supportedArticleParts = {
		'dajiasou': 'mod',
		'shixian': 'mod',
		'wiki': 'mod',
		'weibo': 'mod',
		'music': 'mod',
		'gallery': 'mod',
		'video': 'mod',
		'further-reading': 'mod',
		'blockquote': 'mod',
		'n-slash-total': 'part',
		'editor-comment': 'part',
		'headimg': 'part'
	};


	$cr.renderGrayBar = function(data,hasViewOriginButton,clearExistContent){
		if (g.$debug === true) console.log('$ContentRender.renderGrayBar(' + JSON.stringify(data) + ');');
		return render.call(this, '#grayBar-tmpl', data, clearExistContent, function(data) {
			hasViewOriginButton = typeof hasViewOriginButton == 'undefined' ? true : !!hasViewOriginButton;
			var feeds = {
					// 避免污染源数据
					tagData: $.extend(true, [], data.transmit_data)
				};
				
				feeds.transmit_num = data.transmit_num ? data.transmit_num : "";
				return feeds;
		},"",$('#sx-graybar'));
	}



	// var sharedDocTitle = '【深度】';

	/**
	 * $ContentRender.renderArticle(data,clearExistContent)
	 * 渲染正文
	 * @param  {Object} data {title,subtitle,Array.<{type,value,subtype}>}
	 * @param  {Boolean} clearExistContent
	 */
	$cr.renderArticle = function(data, hasViewOriginButton, clearExistContent) {

		if (g.$debug === true) console.log('$ContentRender.renderArticle(' + JSON.stringify(data) + ');');

		var wrapper = $('.wrapper'),
			contentWidth = wrapper.width() - 2 * $pageHPadding;

		hasViewOriginButton = typeof hasViewOriginButton == 'undefined' ? true : !!hasViewOriginButton;

		var headImgHtml;
		var videoHtml = [];
		var result = render.call(this, '#article-tmpl', data, clearExistContent, function(data) {
			var feeds = {
					// 避免污染源数据
					content: $.extend(true, [], data.content)
				},
				i, dat, match, ratio;
			//正文的数据需要预先处理的比较多
			//每次增加新的字段都需要在下面加上

			
			if (data.time && (isNaN(data.time) || data.time > 0)) {
				feeds.time = $utils.formatDate(data.time);
			} else {
				feeds.time = '';
			}
			if (data.wapurl && hasViewOriginButton) {
				feeds.origin = data.wapurl;
			}

			// 与手机助手合作，提供文章 id， 并且兼容
			// 看点自定义新闻的静态页，转码页，以及后续普通新闻的转码页
			if(data.nid) {
				feeds.nid = data.nid;
			}

			if (data.title) {
				feeds.title = $utils.unescape(data.title);
				document.title = feeds.title;
				//准备微信分享数据
				// if (g.$key && g.$key.indexOf('shixian.so.com') >= 0) {
				// 	$ContentRender.weixinShareData.title = sharedDocTitle + feeds.title.replace(sharedDocTitle, '');
				// }
			}

			if (data.newtags && data.newtags.length > 0) {
				feeds.tags = data.newtags.split('|');
			}
			if (data.source) feeds.source = data.source;
			if (data.editor_pic) feeds.editor_pic = $utils.dmfd(data.editor_pic, 60, 60);
			if (data.editor_name) feeds.editor_name = data.editor_name;
			if (data.editor_desc) feeds.editor_desc = data.editor_desc;
			if (data.editor_comment) feeds.editor_comment = data.editor_comment;

			// 处理正文内容
			for (i = 0; feeds.content && i < feeds.content.length; ++i) {
				dat = feeds.content[i];

				if (dat.type == 'img') {
					/**
					 * 计算图片的宽高
					 */
					dat.originalValue = dat.value;
					match = dat.value.match(/size=(\d+).*?(\d+)/);
					if (!match) {
						console.error('DataError!image missing dimension:' + dat.value);
						continue;
					}

					if (contentWidth < match[1]) {
						ratio = contentWidth / match[1];
						dat.width = contentWidth;
						dat.height = Math.floor(ratio * match[2]);
					} else {
						dat.width = match[1];
						dat.height = match[2];
						dat.descAlignCenter = true;
					}
					dat.value = $utils.dmfd(dat.value, dat.width, dat.height, true);

					//将正文第一张图片设置为分享图片
					// if (!$ContentRender.weixinShareData._found_img_url && match && match.length == 3) {
					// 	//准备微信分享数据
					// 	$ContentRender.weixinShareData.img_url = dat.value;
					// 	$ContentRender.weixinShareData.img_width = dat.width;
					// 	$ContentRender.weixinShareData.img_height = dat.height;
					// 	$ContentRender.weixinShareData._found_img_url = true;
					// }
				} else if (dat.type == 'txt') {
					if (dat.subtype == 'img_title') {
						dat.cssClass = 'caption';
					} else if (dat.subtype == 'head') {
						dat.cssClass = 'head';
					} else {
						dat.cssClass = 'normal';
						if (isMeaninglessPTag(dat.value)) {
							dat.value = null;
						}
					}
					//老数据是没有p标签的，新数据有
					//没有p标签的要在模板中用p标签括起来
					if (dat.value && dat.value.match(/^\s*<p/)) {
						dat.noPTag = true; // 不需要包裹 p 标签
					} else {
						dat.noPTag = false;
					}
					if (dat.value) dat.value = $utils.unescape(dat.value);

					// if (!$ContentRender.weixinShareData._found_first_text) {
					// 	$ContentRender.weixinShareData.desc = $utils.trunc(dat.value, 100, '...', true);
					// 	$ContentRender.weixinShareData._found_first_text = true;
					// }
				} else if (typeof supportedArticleParts[dat.type] != 'undefined') {
					var json = extractArticlePartsData(dat.type, contentWidth, dat.value, dat),
						typename = supportedArticleParts[dat.type];

					if (dat.type == 'headimg') {
						if(json.url) {
							match = json.url.match(/size=(\d+).*?(\d+)/);
							if (contentWidth < match[1]) {
								ratio = contentWidth / match[1];
								dat.width = contentWidth;
								dat.height = Math.floor(ratio * match[2]);
							} else {
								dat.width = match[1];
								dat.height = match[2];
								dat.descAlignCenter = true;
							}
							dat.value = $utils.dmfd(dat.value, dat.width, dat.height, true);
						}
						headImgHtml = renderArticleParts(typename ? (typename + '-' + dat.type) : dat.type, json);						
						feeds.content.splice(i, 1);
						i--;
					} else if (dat.type == 'video') {
						videoHtml.push(renderArticleParts(typename ? (typename + '-' + dat.type) : dat.type, json));
						feeds.content.splice(i, 1);
					} else{
						if(json.showeditor == 1) {
							json._editorData = {
								editor_pic: feeds.editor_pic,
								editor_name: feeds.editor_name,
								editor_desc: feeds.editor_desc
							};
						}
						dat.value = renderArticleParts(typename ? (typename + '-' + dat.type) : dat.type, json);
						dat.type = 'html';
					}
				}
			}
			return feeds;
		},"",$('#sx-article'));

		/*
		 * 	- 视频提到最上面
		 */
		if (videoHtml.length) {
			videoHtml.forEach(function(item){
				wrapper.find('#video').append(item);
			})
		}
		if (headImgHtml) {
			wrapper.find('.article').prepend(headImgHtml);
		}

		//正文内可横向的滚动图集
	
		if(window.$wap){
			initGalleryMagnificPopup($('.mod .gallery'));
		}
	

		return result;
	};

	function initGalleryMagnificPopup($el) {
		useMagnificPopup(function() {
			var url = $el.attr('data-trans-url');
			if ($el.attr('data-allqimg') > 8 && url) {
				$.ajax({
					url: url,
					dataType: 'jsonp',
					success: function(response) {
						if (response && response.data && response.data.content) {
							var opts = $.extend({}, $defaultMagnificPopupCreateOpts);
							opts.index = 7;
							opts.items = $el.find('a[data-mfp-src]').toArray();
							var count = 0;
							$.each(response.data.content, function(i, item) {
								if (item.type == 'img') {
									count++;
									if (count > 8) {
										opts.items.push({
											src: item.value
										});
									}
								}
							});
							$el.magnificPopup(opts);
						} else {
							$el.magnificPopup($defaultMagnificPopupCreateOpts);
						}
					},
					error: function() {
						if (g.$debug === true) console.log('initGalleryMagnificPopup error');
					}
				});
			} else {
				$el.magnificPopup($defaultMagnificPopupCreateOpts);
			}
		});
	}

	function initScroller(containerSelector) {
		var ctn = $(containerSelector),
			scroller = ctn.find('.scroller');
		scroller.children().each(function(i, e) {
			$(e).width(ctn.width() + 'px');
		});
		scroller.width(ctn.width() * scroller.children().length + 'px');
	}

	function extractArticlePartsData(type, contentWidth, value, rawData) {
		var s = value.replace(/<p[\s\S]*?>([\s\S]*?)<\/p>/g, "$1").replace(/\}<br\/>/, '}'),
			data = {},
			tmp,

			// TODO 2014-12-04 这块没有明白，计算这个宽度有什么用？
			// w = contentWidth - 24; //两边边距2x12
			w = contentWidth - 20;

		if (s && s.length >= 2) {
			try {
				tmp = JSON.parse(s);
				data = $.isArray(tmp) ? {
					items: tmp
				} : tmp;
			} catch (e) {
				console.error(e.toString());
			}
		}
		//图集
		if (type == 'gallery') {
			var transUrls;
			try {
				transUrls = JSON.parse(rawData.transUrls);
			} catch(e) {}
			transUrls = transUrls || [];
			$.each(data.items, function(i, item) {
				item.transUrl = transUrls[i];
				item.items = item.imgurl.split('|');
				item.data = JSON.stringify(item);
				var itemPerPage = 1,betweenGap = 0;
					imgWidth = item.imgWidth = Math.floor((w - betweenGap) / itemPerPage),
					n = item.items.length;
				item.imgHeight = Math.floor(imgWidth * 3 / 4);
				item.itemPerPage = itemPerPage;
				item.scrollerWidth = ((imgWidth + 5) * n) - 5;
				item.originalPhotos = item.items;
				item.items = item.items.map(function(url) {
					return $utils.dmfd(url, imgWidth, item.imgHeight, true);
				});
				item.total = item.items.length;
			});
			//深读
		} else if (type == 'further-reading') {
			data.scrollerWidth = w * data.items.length;
			data.itemWidth = w;
			data.items = data.items.map(function(item) {
				item.summary = $utils.unescape(item.summary);
				return item;
			});

			//百科
		} else if (type == 'wiki') {
			data.items = data.items.map(function(item) {
				var summary = item.rawSummary = $utils.unescape(item.summary);
				item.summary = summary;
				item.imgurl = $utils.dmfd(item.imgurl, 62, 65, true);
				if (summary.length > 100) item.summary = summary.substr(0, 100) + '...';
				return item;
			});
			//微博
		} else if (type == 'weibo') {
			var itemPerPage = 3,
				imgWidth = data.imgWidth = Math.floor((w - 10) / itemPerPage);
			data.imgHeight = Math.floor(imgWidth * 3 / 4);
			data.items.forEach(function(weibo) {
				var when = weibo.created_at.indexOf('-') > 0 ? weibo.created_at : Date.parse(weibo.created_at);
				weibo.date = $utils.formatDate(when);
				weibo.text = $utils.unescape(weibo.text);
				weibo.itemPerPage = itemPerPage;
				var photos = weibo.pic_urls;
				weibo.scrollerWidth = ((imgWidth + 5) * photos.length) - 5;
				weibo.originalPhotos = photos.map(function(photo) {
					return photo.thumbnail_pic;
				});
				weibo.photos = photos.map(function(photo) {
					return $utils.dmfd(photo.thumbnail_pic, imgWidth, data.imgHeight, true);
				});
				weibo.data = weibo.originalPhotos.join('|');
				if (!weibo.src) weibo.src = "javascript:;";
			});

			//视频
		} else if (type == 'video') {
			data.w = w;
			data.h = (w / 1.777).toFixed(0); //UI designed width/height ratio
			data.items.forEach(function(item) {
				item.url = item.url;
				item.imgurl = $utils.dmfd(item.imgurl, data.w, data.h, true);
			});

			//新闻专题
		} else if (type == 'news-feature') {
			if (data.pattern == 'big') {
				var url = data.items[0].imgshow;
				if (!data.logo) {
					data.logo = {};
				}
				if (!data.logo.title) {
					daata.logo.title = '进入专题';
				}
				data.items[0].summary = $utils.unescape(data.items[0].summary);
				data.items[0].imgshow = $utils.dmt(url, w, 150, true);
			}
		} else if (type == 'shixian') { 
			var fixSequence = function(str) {
				// 处理 十 以内
				var hash = {
					'一': '01',
					'二': '02',
					'三': '03',
					'四': '04',
					'五': '05',
					'六': '06',
					'七': '07',
					'八': '08',
					'九': '09',
					'十': '10'
				};
				var tempNum = parseInt(str, 10);
				// 如果不可以转成数字
				if(isNaN(tempNum)) {
					return hash[str] || ''
				}
				return tempNum < 10 ? ('0' + tempNum) : tempNum;
			}
			// 如果可以转成数字
			if(!isNaN(data.sequence)) {
				data.sequence = fixSequence(data.sequence);
			} else if(data.sequence.indexOf('看点') !== -1) { // 如果有 看点 二字
				data.sequence = fixSequence(data.sequence.substr(2)) || '';
			} else { // 如果是其他的不显示
				data.sequence = '';
			}
			if (data.summary) {
				data.summary = data.summary.replace(/\n/g, '<br>');
			}
			if($.isArray(data.items)) {
				$.each(data.items, function(k, v) {
					data.items[k].imgurl = v.imgurl && $utils.dmfd(v.imgurl, 100, 75)
				})
			}
		}
		return data;
	}

	function isMeaninglessPTag(v) {
		//忽略这些无意义的p标签 多是copy&paste从网页带过来的
		return v == '<p style="white-space: normal;"></p>' || v == '<p style="white-space: normal;"><br/></p>';
	}

	/**
	 * $ContentRender.renderRecommendArticelList(data, clearExistContent)
	 * 渲染推荐新闻列表
	 */
	$cr.renderRecommendArtices = function(data, clearExistContent) {
		 window.detListData = data;
		if (g.$debug === true) console.log('$ContentRender.renderRecommendArtices(' + JSON.stringify(data) + ');');
		var wrapper = $('.wrapper'),
			contentWidth = wrapper.width() - 2 * $pageHPadding;
		return render.call(this, '#recommend-articles-tmpl', data, clearExistContent, function(data) {
			if (data.related && data.related.length > 0) {
				data.related.forEach(function(item, index) {
					if (item.pdate) item.elapse = $utils.elapse(item.pdate);
					item.source = item.src;
					if (item.album_pic) {
						item.imgurl = item.album_pic.split('|')[0];
						item.width = Math.floor((contentWidth-15)/2);
						item.height = contentWidth / 3;
						item.img = $utils.dmfd(item.imgurl, item.width, item.height);

					} else {
						item.img = item.imgurl;
					}
				});
			}
			return data;
		},'',$('#sx-recommond'));
	};



	/**
	 * $ContentRender.renderhotArtices(data, clearExistContent)
	 * 渲染热门推荐新闻列表
	 */

	 $cr.renderhotArtices = function(data, clearExistContent) {
	 	window.detListData = data;
	 	if (g.$debug === true) console.log('$ContentRender.renderhotArtices(' + JSON.stringify(data) + ');');
	 	var wrapper = $('.wrapper'),
	 		contentWidth = wrapper.width() - 2 * $pageHPadding;
	 	return render.call(this, '#hot-articles-tmpl', data, clearExistContent, function(data) {
	 		if (data.hotNewsList && data.hotNewsList.length > 0) {
	 			data.hotNewsList.forEach(function(item, index) {
	 				if (item.pdate) item.elapse = $utils.elapse(item.pdate);
	 				item.source = item.src;
	 				if (item.album_pic) {
	 					item.imgurl = item.album_pic.split('|')[0];
	 					item.width =110;
	 					item.height = 82;
	 					item.img = $utils.dmfd(item.imgurl, item.width, item.height);

	 				} else {
	 					item.img = item.imgurl;
	 				}
	 			});
	 		}
	 		return data;
	 	},'',$('#sx-hot'));
	 };


	/**
	 * $ContentRender.renderComments(data)
	 * 渲染评论列表
	 * @type {Object} data
	 */
	$cr.renderComments = function(data, clearExistContent, returnHtml) {
		if (g.$debug === true) console.log('$ContentRender.renderComments(' + JSON.stringify(data) + ');');
		return render.call(this, '#comments-tmpl', data, clearExistContent, function(data) {
			var title;
			// 兼容老客户端，1. 直接丢弃老数据 2. 做兼容逻辑  这里选择直接丢弃
			if (data.hot_comments && data.hot_comments.length > 0) {
				// 热门评论，显示3条
				title = "热门评论";
				data._comments = data.hot_comments;
				data.more = "查看更多评论";
			} else if (data.comments && data.comments.length > 0) {
				title = "最新评论";
				data._comments = data.comments;
				if (data.comment_num > 3) {
					data.more = "查看更多评论";
				}
			} else {
				title = "最新评论";
				data._comments = [];
			}
			if (!data.title && title) {
				data.title = title;
			}
			if (data._comments && data._comments.length > 3) {
				data._comments.length = 3;
			}
			data._comments.forEach(function(item) {
				item.text = decodeURIComponent(item.comment);
				item.username = decodeURIComponent(item.uname);
				item.liked = item.support || 0;
				item.cid = item.comment_id;
				item.time = $utils.elapse(item.create_time);
				item.avatarUrl = decodeURIComponent(item.uavatar) || null;
			});
			return data;
		}, returnHtml,$('#sx-comments'));
	};

	/**
	 * $ContentRender.refreshComments(newData)
	 * 用新评论数据更新已有评论
	 * @param  {Object} newData [新的评论数据]
	 */
	$cr.refreshComments = function(newData) {
		var html = $cr.renderComments(newData, false, true),
			i = 0,
			len = $renderedSections.length,
			index = -1,
			dom;
		for (; i < len; ++i) {
			dom = $($renderedSections[i]);
			if (dom.attr('class').indexOf('comments') >= 0) {
				dom.replaceWith(html);
			}
		}
	};

	/**
	 * $ContentRender.prependComment(data)
	 * 在评论列表增加一条评论
	 */
	$cr.prependComment = function(data) {
		var fake = {
			hot_comments: [data]
		};
		var section = $('.comments.part'),
			list, html, dom;

		section.find('.no-comments').hide();
		list = section.find('.comment-list').show();
		html = this.renderComments(fake, false, true);
		dom = $(html).find('li');
		list.prepend(dom);
	};

	/**
	 * $ContentRender.playMusic()
	 * 播放音乐
	 */
	$cr.playMusic = function() {
		
	};

	/**
	 * $ContentRender.StopMusic()
	 * 停止播放音乐, 客户端加载失败，或者音乐播放完，调用
	 */
	$cr.stopMusic = function() {
		$('.wrapper').find('.music .play-button.playing')
					 .removeClass('playing').addClass('stop');
	};


	/**
	 * $ContentRender.renderShareButtons(data, hasPageButton, clearExistContent)
	 * 渲染分享按钮
	 */
	$cr.renderShareButtons = function(data, clearExistContent) {
		if((!g.$wap || g.$isWeixin)) {
			return render.call($cr, '#share-buttons-tmpl', data, clearExistContent, null, false);
		} else {
			return $.noop;
		}
	};

	// REMOVE: 相关模块，保留时间轴
	var partNameToRenderFunction = {
		time_line: 'Timeline'
	};
	$cr.renderExtend = function(json) {
		if (g.$debug === true) console.log('$ContentRender.renderExtend(' + JSON.stringify(json) + ');');
		if (!json || !json.data) return;
		if (json.data.mood1) {
			$('.wrapper').trigger('onRenderExtend', [json.data.mood1]);
		}

		if (!json.data.extend) return;
		var partsData = json.data.extend,
			//正文后模块顺序在detailorder中
			partList = json.data.extend.detailorder.split(',');

		var i = 0,
			len = partList.length,
			name, method, args, data;
		for (; i < len; ++i) {
			name = partList[i];
			methodName = 'render' + partNameToRenderFunction[name];
			method = $cr[methodName];
			if (!method) {
				console.log('//Can not render ' + name + ', check your spelling');
				continue;
			}
			data = partsData[name];
			if (!data) {
				console.log('//' + name + ' data is missing!');
				continue;
			}
			method.call($cr, data);
		}
	};

	/**
	 * 渲染撰写评论部分
	 * 这里只存一个空函数，确保可以调用。
	 * 真正的实现在waponly.js中
	 */
	$cr.renderCommentsCompose = $.noop;

	/**
	 * 灌入数据完毕
	 */
	$cr.done = function() {
		if (g.$debug === true) console.log('$ContentRender.done();');
		var wrapper = $('.wrapper');

		//安卓dom加载完成要绑定一些打点信息，在domdDone后执行
		wrapper.trigger('domDone');

		wrapper.data('done', true);
		// TODO: 在小米 3 上测试，右侧导航已经移除， $winHeight 在 右侧导航的逻辑里声明
		// $winHeight = $win.height(); // 有些手机(小米3)上需要在这里重新计算一下
		console.log('//渲染完成,总耗时' + $totalRenderTime + 'ms!');

	};

	/**
	 * 图片延时加载
	 */
	(function(window) {
		var $q = function(q, res) {
				if (document.querySelectorAll) {
					res = document.querySelectorAll(q);
				} else {
					var d = document,
						a = d.styleSheets[0] || d.createStyleSheet();
					a.addRule(q, 'f:b');
					for (var l = d.all, b = 0, c = [], f = l.length; b < f; b++)
						l[b].currentStyle.f && c.push(l[b]);

					a.removeRule(0);
					res = c;
				}
				return res;
			},
			addEventListener = function(evt, fn) {
				if (window.addEventListener) {
					this.addEventListener(evt, fn, false);
				} else if (window.attachEvent) {
					this.attachEvent('on' + evt, fn);
				} else {
					this['on' + evt] = fn;
				}
			},
			_has = function(obj, key) {
				return Object.prototype.hasOwnProperty.call(obj, key);
			};

		var images = null; //images to be lazy load

		function loadImage(el, fn) {
			var img = new Image(),
				src = el.getAttribute('data-src');
			img.onload = function() {
				var e = $(el);
				e.removeClass('lazy error loading');
				if (e.hasClass('_native-call')) {
					e.addClass('native-call');
					e.removeClass('_native-call');
				}

				if (!!el.parent) {
					el.parent.replaceChild(img, el);
				} else {
					el.src = src;
					$(el).removeClass('lazy');
				}
				//$nativeApi.news.articleImgLoaded(el.src);
				fn && fn();
			};
			img.onerror = function() {
				var e = $(el);
				if (e.hasClass('native-call')) {
					e.addClass('_native-call');
				}
				e.addClass('error lazy')
					.removeClass('native-call loading')
					.off('tap').tap(function() {
						e.addClass('loading');
						loadImage(el, fn);
					});
			};
			if (g.$debug) console.log('//加载' + src);
			img.src = src;
		}

		function elementInViewport(e, index) {
			var rect = e.ele.getBoundingClientRect(),
				winHeight = $win.height(),
				scrollTop = $win.scrollTop(),
				curTop = rect.top + scrollTop,
				curBottom = curTop + rect.height;
			if (curTop <= scrollTop) {
				return curBottom >= scrollTop - winHeight;
			} else {
				return curTop <= scrollTop + winHeight * 2;
			}
		}

		function toArray(list) {
			var i = 0,
				len = list.length,
				res = [];
			if (g.$debug) console.log('//懒加载' + len + '张图');
			for (i; i < len; ++i) {
				res.push({
					ele: list[i],
					rect: list[i].getBoundingClientRect()
				});
			}
			return res;
		}

		function doLoadImage(images, i) {
			if (elementInViewport(images[i], i)) {
				loadImage(images[i].ele, function() {
					//images.splice(i, 1);
					images[i] = null;
				});
				return true;
			}
			return false;
		}

		var cleared = false,
			lastResponseOnScrollTime = null;

		function loadImageInScreen() {
			var cur = new Date();
			// if (lastResponseOnScrollTime !== null && cur - lastResponseOnScrollTime < 200) return;
			if (images == null) {
				images = toArray($('img.lazy'));
				if (g.$debug) g.$images = images;
			}
			if (images.length === 0) {
				if (!cleared) {
					images = null;
				}
				return;
			}

			lastResponseOnScrollTime = cur;
			var loaded = 0;
			for (var i = 0; i < images.length; i++) {
				if (images[i] == null) {
					loaded++;
					continue;
				}
				doLoadImage(images, i);
			};
			if (loaded == images.length) {
				images.length = 0;
				cleared = true;
			}
		}
		addEventListener('scroll', loadImageInScreen);
		$cr.lazyLoadImage = function() {
			if (g.$debug === true) console.log('$ContentRender.lazyLoadImage();');
			loadImageInScreen();
		};
	}(this));

	/**
	 * 调整字体大小
	 */
	var fontSize = {
		small: 'small',
		normal: 'normal',
		big: 'big',
		extraBig: 'extra-big'
	};
	g.adjustFontSize = function(size) {
		var s = fontSize[size] || 'normal';
		$('.wrapper').attr('class', 'wrapper').addClass(s);
		shake();
	};

	// $($cr.lazyLoadImage);
	g.$ContentRender = $cr;



})(this);