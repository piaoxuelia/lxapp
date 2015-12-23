~function($){
    var openPhotoSwipe  = function(data, options){
        if(!data) {
            return;
        }
        var pageStr = '';//页码信息
        var defaults = {
            loop: false,
            history: false,
            pinchToClose: false,
            closeOnScroll: false,
            closeOnVerticalDrag: false,
            escKey: false,
            tapToToggleControls: true,
            clickToCloseNonZoomable: false,
            shareEl: false,
            fullscreenEl: false,
            closeEl: false,
            counterEl: false, // 使用自定义的
            closeElClasses: [],
            addCaptionHTMLFn: function(item, captionEl, isFake) {

                var htmlStr = '<h1 class="pswp__caption__title"><span class="pswp__custom-counter">'+pageStr+'</span><span class="pswp__custom-title">' + item.title + '</span></h1>';
                if(item.desc) {
                    htmlStr += '<p class="pswp__caption__desc"><span class="_scroll">' + item.desc + '</span></p>';
                }
                captionEl.children[0].innerHTML = htmlStr;
                return true;
            },
            isClickableElement: function(el) {
                return el.tagName === 'A' || el.className === '_scroll';
            }
        };
        options = $.extend({}, defaults, options);
        var pswpElement = $('.pswp')[0];
        var _photoSwipe = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, data, options);
        _photoSwipe.listen('afterChange', function(){
            var counterStr = (this.getCurrentIndex()+1) + 
                           this.options.indexIndicatorSep + 
                            this.options.getNumItemsFn();
            $(this.scrollWrap).find('.pswp__ui .pswp__caption:not(.pswp__caption--fake) span.pswp__custom-counter').html(counterStr); 
            pageStr = counterStr;
        });

        $('div.pswp__scroll-wrap').on('touchmove touchend touchcancel', function(e){
            var $target = $(e.target);
            if($target.is('._scroll')){
                e.stopImmediatePropagation();
            }
        });
        _photoSwipe.init();
    };
    var $ContentRender = window.$ContentRender = {}, $msgbox = $('body>.msg-box'), winWdith = $(window).width();
    $ContentRender.renderArticle = function(data){
        if(!data || !data.content.length) {
            $msgbox.html('图集数据出错！');
            return;
        }
        var filterData = [], title = data.title || ' ', len = 0, match;
        document.title = title;
        $.each(data.content, function(k, v){
            if(v.type === 'img') {
                match = v.value.match(/size=(\d+)x(\d+)/);
                if(match) {
                    var temp = {
                        src: '',
                        title: title,
                        desc: '',
                        w: '',
                        h: ''
                    };
                    if (winWdith < match[1]) {
                        temp.w = winWdith;
                        temp.h = Math.floor(winWdith / match[1] * match[2]);
                    } else {
                        temp.w = match[1];
                        temp.h = match[2];
                    }
                    temp.src = $utils.dmfd(v.value, temp.w, temp.h, true);
                    filterData.push(temp);
                }
            }
            if(v.type == 'txt' && v.subtype == 'img_title') {
                len = filterData.length;
                if(filterData[len - 1].src) {
                    filterData[len - 1].desc = v.value
                }
            }
        });
        if(!filterData) {
            $msgbox.html('没有图集数据！');
            return;
        }
        openPhotoSwipe(filterData);
    };
}(Zepto);