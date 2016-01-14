var iosOnly = (function () {
	var IO = {},
		bridge = null,
		body = $('body');

	// 消息配发中心
	var sendMessageToApp = function (data) {
		bridge.callHandler('JSCallCenter', data, function (response) {

		});
	};

   

	// 初始化事件中心
	var initEventHandler = function () {

		//文章中的单图点击
		body.on('click','.photo-mod img',function () {
			var srcs = [];
			var index = $('.photo-mod img').index($(this));
			$('.photo-mod img').each(function (index, item) {
				srcs.push($(item).data('src'));
			});
			console.log(index)
			console.log(srcs)
			sendMessageToApp({
				handle: 'image',
				type: '1001',   
				data: {
					index: index,
					srcs: srcs
				}
			});
		});

	   
		
		// 多图模式
		$('.gallery-wrap a').click(function (e) {
			e.stopPropagation();
			e.preventDefault();

			var image_group_wrapper = $(this).parent('.cont');
			var srcs = [];
			var transurl = image_group_wrapper.data('trans-url');
			
			sendMessageToApp({
				handle: 'image',
				type: '1002',
				data: transurl
			});
		});
	};

	IO.initialize = function (_bridge) {
		bridge = _bridge;
		initEventHandler();

	};
	// 相关和推荐
	IO.bineReatedEventHandler = function () {
		// 模拟数据
		// var related = relatedNews.data;
		// var hotNewsData = hotNews.data;
		//  window.detListData = related;

		//热门推荐
		body.on('click','.hot-articles li',function () {
			var index = $('.hot-articles li').index($(this));
			var data = window.detListData.hotNewsList[index];
			console.log(data)
			sendMessageToApp({
				handle: 'link',
				type: '4001',   
				data: data
			});
		});

		body.on('click','.recommend-articles li',function () {
			var index = $('.recommend-articles li').index($(this));
			var data = window.detListData.related[index];
			console.log(data)
			sendMessageToApp({
				handle: 'link',
				type: '5001',   
				data: data
			});
		});

		body.on('click','.grayBar-rt',function () {
			sendMessageToApp({
				handle: 'click',
				type: '3004'
			});
		});
	};
	// 评论
	IO.bineCommentEventHandler = function () {
		
		body.on('click','.more-comments',function(){
			sendMessageToApp({
				handle: 'click',
				type: '3001'
			});
		})

		body.on('click','.thumbup',function(){
			var me = $(this),
				data = me.data('param1'),
				numDom = me.siblings('.liked'),
				thumbupNum = Number(numDom.text());

			me.hide();
			me.next('.thumbup-active').show().addClass('thumb-beat');
			numDom.text(thumbupNum+1);

			sendMessageToApp({
				handle: 'click',
				type: '3002',
				data:data
			});
		})

		body.on('click','.no-comments',function(){
			sendMessageToApp({
				handle: 'click',
				type: '3003'
			});
		})
	};


	return IO;
})();

/**
*   WebViewReady启动入口
*/
window.onerror = function(err) {
	log('window.onerror: ' + err)
}

function connectWebViewJavascriptBridge(callback) {
	if (window.WebViewJavascriptBridge) {
		callback(WebViewJavascriptBridge)
	} else {
		document.addEventListener('WebViewJavascriptBridgeReady', function() {
		  callback(WebViewJavascriptBridge)
		}, false)
	}
}

connectWebViewJavascriptBridge(function(bridge) {
  var uniqueId = 1
  function log(message, data) {
	var log = document.getElementById('log')
	var el = document.createElement('div')
	el.className = 'logLine'
	el.innerHTML = uniqueId++ + '. ' + message + ':<br/>' + JSON.stringify(data)
	if (log.children.length) { log.insertBefore(el, log.children[0]) }
	else { log.appendChild(el) }
  }
  bridge.init(function(message, responseCallback) {});

  bridge.registerHandler('JavascriptHandler', function(data, responseCallback) {
	$ContentRender.renderArticle(data);
	iosOnly.initialize(bridge);
  });

  bridge.registerHandler('JavascriptHtmlHandler', function(data, responseCallback) {
	$ContentRender.renderArticleTitle(data);
	$ContentRender.renderArticleHtml(data);
  });

  bridge.registerHandler('JavascriptRelatedHandler', function(data, responseCallback) {
   if(data){
		((data.transmit_data && data.transmit_data.length) || data.transmit_num) && $ContentRender.renderGrayBar(data);
		data.related && data.related.length && $ContentRender.renderRecommendArtices(data);
		
		data.hotNewsList && data.hotNewsList.length && $ContentRender.renderhotArtices(data);
	}
	$ContentRender.lazyLoadImage();
	iosOnly.bineReatedEventHandler();
  });  

  bridge.registerHandler('JavascriptCommentHandler', function(data, responseCallback) {
		$ContentRender.renderComments(data);
		iosOnly.bineCommentEventHandler();
  });  

});
