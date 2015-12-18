var iosOnly = (function () {
    var IO = {};
    var bridge = null;

    // 消息配发中心
    var sendMessageToApp = function (data) {
        bridge.callHandler('JSCallCenter', data, function (response) {

        });
    };

    // 触发分享事件
    var triggerShareHandler = function (share) {
        share = $(share);
        var ret = {};
        ret.handle = 'share';
        ret.type = share.data('type');
        var share_pic = ($('#p-topPic img')[0] || $('.article-img img')[0] || { src: '' }).src;
        ret.data = {
            share_pic: share_pic,
            share_url: $('#article-header').data('shorturl'),
            share_title: document.title
        };
        sendMessageToApp(ret);
    };

    // 初始化事件中心
    var initEventHandler = function () {
        $('.share').click(function () {
            triggerShareHandler(this);
        });

        // 单图模式
        $('.article-img img').click(function () {
            var srcs = [];
            var index = $('.article-img img').index($(this));
            $('.article-img img').each(function (index, item) {
                srcs.push($(item).data('src'));
            });
            sendMessageToApp({
                handle: 'image',
                type: '1001',
                data: {
                    srcs: srcs,
                    index: index
                }
            });
        });
        
        // 多图模式
        $('.article-img-list img').click(function (e) {
            e.stopPropagation();
            e.preventDefault();

            var image_group_wrapper = $(this).parents('.scroller-wrap');
            var srcs = [];
            var transurl = image_group_wrapper.data('transurl');
            image_group_wrapper.find('img').each(function (index, item) {
                srcs.push($(item).data('src'));
            });
            sendMessageToApp({
                handle: 'image',
                type: '1002',
                data: {
                    srcs: srcs,
                    index: 0,
                    transurl: transurl
                }
            });
        });

        // 文章外部链接
        $('#p-article a').click(function (e) {
            e.preventDefault();
            var url = this.href;
            sendMessageToApp({
                handle: 'link',
                type: '0001',
                data: {
                    url: url
                }
            });
        });
    };

    IO.initialize = function (_bridge) {
        bridge = _bridge;
        initEventHandler();

    };

    IO.bineReatedEventHandler = function () {
        // 小编相关推荐外部链接
        $('#p-more a').click(function (e) {
            e.preventDefault();
            var url = this.href;
            var nid = $(this).data('nid');
            var m = $(this).data('m');
            sendMessageToApp({
                handle: 'link',
                type: '0001',
                data: {
                    url: url,
                    nid: nid,
                    m: m
                }
            });
        });
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
    renderArticle(data);
    renderShareButtons(data);
    iosOnly.initialize(bridge);
  });

  bridge.registerHandler('JavascriptRelatedHandler', function(data, responseCallback) {
        renderNews({
            related: data
        });
        iosOnly.bineReatedEventHandler();
  });  


});
