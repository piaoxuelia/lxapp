(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * author lijingan
 * 克隆对象
 * QQ:290711851
 * 2015.08.13
 **/
module.exports = (function () {
	var clone_obj	=	function(_obj){
		  	var obj = arguments[0];
		  	if (typeof obj === 'undefined' || obj === null)
      			return {};

			if (typeof obj !== 'object')
      			return obj;
  
  			//第二个参数是属性名称列表，就采用该列表进行刷选
  			//否则就克隆所有属性
  			var attrs = arguments[1];
  			var enable_spec_attr = true;
  			if (!(attrs instanceof Array)) {
      			//console.log(attrs);
      			attrs = obj;
      			enable_spec_attr = false;
  			}

  			var result = {};
  			var i;
  			for (i in attrs) {
      			attr = enable_spec_attr? attrs[i]: i;
      			//console.log(attr);
      			if (obj.hasOwnProperty(attr)) {
          		if (obj[attr] instanceof Array) {
              		result[attr] = cloneArray(obj[attr]);
          		}
          		else if (typeof obj[attr] === 'object') {
              		result[attr] = cloneOwn(obj[attr]);
          		} else {
              		result[attr] = obj[attr];
          		}
      		}
  		}

  		return result;
	}
	return {
		clone_obj:clone_obj
	}
}());
},{}],2:[function(require,module,exports){
/**
	*	connect cdn
	*	lijingan
	*	qq:290711851
	*	2015.08.05
	**/
module.exports = (function(){
	
	var	ajaxTools	=	require('./ajaxTools'),
		_live_url	=	"http://g.live.360.cn/liveplay",
		_live_url_debug	=	"http://gtest.live.360.cn/liveplay",
		_replay_url	=	"http://g.live.360.cn/replay",
		_replay_url_debug	=	"http://gtest.live.360.cn/replay",
		_connect_num	=	0;
	
	var init	=	function(_video_obj,_d,_fn){
		var	_url	=	"";
		if( _d.vtype=="liveplay"){
			if(_d.debug){
				_url	=	_live_url_debug;
			}else{
				_url	=	_live_url;
			}
		}else{
			if(_d.debug){
				_url	=	_replay_url_debug;
			}else{
				_url	=	_replay_url;
			}
		}
		var _data = {
			channel:_d.channel,
			sn:_d.sn,
			_rate:_d._rate,
			stype:_d.stype,
			sid:_d.sid,
			ts:_d.ts,
			_jsonp:_d._jsonp
		}
		
		ajaxTools.ajaxJsonp(_url,_data,function(data){
			
			if(data){
				_fn(data);
				//告诉调用方， 已经得到了url
				_video_obj.trigger("connectSuccess");
				
			}else{
				//如果没有数据，那么连续请求三次，无果后告诉用户失败
				_video_obj.trigger("reconnect");
				if(_connect_num	<	3){
					_connect_num++;
					var	_cur_num	=	Math.floor(0+Math.random()*(2-0));
					switch	(_cur_num){
						case	0:	setTimeout(function(){
							init(_data,_fn);
						},1000);break;
						case	1:	setTimeout(function(){
							init(_data,_fn);
						},3000);break;
						case	2:	setTimeout(function(){
							init(_data,_fn);
						},5000);break;
						default:break;
					}	
				}else{
					_video_obj.trigger("connectError");
					_fn(false);
				}
			}
		});
	}
	
	return{
		init:init
	}
}());
},{"./ajaxTools":7}],3:[function(require,module,exports){
/**
	*	video player for m3u8
	*	lijingan
	*	qq:290711851
	*	2015.07.29
	**/
(function($,win){
	
	var	connect	=	require('./Connect'),
		video_event	=	require('./Video_event'),
		video_get_attributes	=	require('./Video_get_attributes'),
		ajaxTools = require('./ajaxTools');
		clone_data = require('./Clone_obj');
		
	H5_video = function(d,dom){
		var _that = this;
		this._dom	=	dom;
		//this._video	=	dom[0];
		this._user_data	=	d;
		this._upload_info_url = "http://qos.live.360.cn/vc.gif";
		this._event;
		this._online_timer;
		this._back_url_timer;
		this._sdkver = "1.0.0";
		this._update_info_base_date;
		this._is_pause	=	0;
		this._skin = d.skin || false; //默认不显示皮肤
		
		if( this.check_video() ){
			this.init();
		}else{
			console.log("不支持video标签");
		}
		
	}
	
	H5_video.prototype.init	=	function(){
		var _that	=	this;
		this._video;
		this._is_waiting	=	0;	//	是否在缓冲
		this._waiting_start_time	=	0;	//	本次缓冲开始时间
		this._waiting_end_time	=	0;	//	本次缓冲结束时间
		this._waiting_num	=	0;	//	本次播放缓冲次数
		this._is_seek	=	0; 	//是否在拖动 
		this._total_waiting_time	=	0; //一共等待了多长时间
		this._is_first_error	=	1;	//要区分是播放中的报错，还是第一次请求时的报错，所以需要一个状态
		this._mark_time =	0;
		
		//替补的m3u8地址
		this._back_url	=	[];
		
		this._update_info_base_date	=	{
			cid:	this._user_data.channel, //不可不填
			uid:	this._user_data.uid || "",
			sdkver:	this._sdkver,
			sid:	this._user_data.sid || "",
			bid:	this._user_data.bid || "",
			pid:	this._user_data.pid || "H5",
			ver:	"0.0.1",
			rid:	this._user_data.sn,
			mid:	this._user_data.mid || "",	//机器id 这个播放器的载体是什么，因为js得不到。
			tm:	new Date().getTime(),
			r:	Math.random(),
			ty:"online"
		};
		//先去play.360kan.corp.qihoo.net拿到实际播放需要的url 然后打点。
		var _data = {
			channel:this._user_data.channel, //不可不填
			sdkver:	this._sdkver,
			sn:this._user_data.sn,
			_rate:this._user_data._rate || "xd",
			stype:this._user_data.stype || "m3u8",
			vtype:this._user_data.vtype || "",
			debug:this._user_data.debug || false,
			sid:this._user_data.sid || "",
			ts:new Date().getTime(),
			_jsonp:this._user_data._jsonp || "_jsonp"
		}
		
		//请求cdn返回播放地址
		var _before_request	=	new Date().getTime();
		connect.init($(this),_data,function(data){
			if(data){
				_that._back_url	=	data.back;
				_that._update_info_base_date.u	=	encodeURI(data.main);
				
				//增加属性默认设置
				var _width = _that._user_data.width || "100%";
					
				var _height = _that._user_data.height || "100%";
				
				var _controls = _that._user_data.controls ? " controls" : "";
				
				var _autoplay = _that._user_data.autoplay ? " autoplay" : "";
				
				var _loop = _that._user_data.loop ? 'loop="loop"' : "";
					
				var _preload = _that._user_data.preload ? _that._user_data.preload : "auto";
					
				var _poster = _that._user_data.poster || "";
				
				//创建video 标签
				var _video = '<video '+_controls+_autoplay+' webkit-playsinline="webkit-playsinline" x-webkit-airplay="allow" width="'+_width+'" height="'+_height+'" '+_loop+' preload="'+_preload+'" poster="'+_poster+'" src="'+data.main+'" ></video>';
				_that._dom.html(_video);
				_that._video = _that._dom.find("video")[0];
				//针对某些手机记录播放位置的行为，强制归零
				_that._video.duration	=	0;
				_that.add_dispatch_event();
				
				//调度接口打点
				var _after_request	=	new Date().getTime();
				var _request_time	=	_after_request-_before_request;
				_that.upload_info_action(0,_request_time);
				
				//开始打点
				_that.upload_info_init();
				_that._online_timer	=	setInterval(function(){_that.upload_info_online(_that._upload_info_url,_that._update_info_base_date)},60000);
			
			}else{
				alert("cdn 返回链接失败");
				//调度接口打点
				var _after_request	=	new Date().getTime();
				var _request_time	=	_after_request-_before_request;
				_that.upload_info_action(_that.dom.error.code,_request_time);
			}
			_that._is_first_error	=	0;
		});
	}
	
	//取M3U8地址时发生错误，用back url 重新初始化
	H5_video.prototype.use_back_url	=	function(){
		//$(".log").append("use back url"+"<br>");
		var _that	=	this;
		clearInterval(_that._online_timer);
		if(_that._back_url.length){
			
			if( $.trim(_that._back_url[0])!=" "&&$.trim(_that._back_url[0])!="" ){
				_that._video.src	=	_that._back_url[0];
				_that._update_info_base_date.u	=	encodeURI(_that._back_url[0]);
				_that._back_url.splice(0,1);
				_that._back_url_timer	=	setInterval(function(){_that.upload_info_online(_that._upload_info_url,_that._update_info_base_date)},60000);
			}else{
				_that._back_url.splice(0,1);
				_that.use_back_url();
			}
			//$(".log").append("backUrlError"+"<br>");
			$(this).trigger("backUrlError");
		}else{
			clearInterval(_that._back_url_timer);
			_that._mark_time	=	0;
			//$(".log").append("urlError"+"<br>");
			$(this).trigger("urlError");
		}
		
	}
	
	//检查浏览器是否支持video标签
	H5_video.prototype.check_video	=	function(){
	
		var _new_video	=	document.createElement("video");
		if (!!_new_video.canPlayType) {
			return true;
		}else{
			return false;
		}
	}
	
	//请求全屏 （Chrome 15 / Firefox Nightly / Safari 5.1）
	H5_video.prototype.request_full_screen	=	function(){
		
		if(this._video.requestFullScreen) {
    		this._video.requestFullScreen();
    		$(this).trigger("requestFullScreen");
  		} else if(this._video.mozRequestFullScreen) {
    		this._video.mozRequestFullScreen();
    		$(this).trigger("requestFullScreen");
  		} else if(this._video.webkitRequestFullScreen) {
   			this._video.webkitRequestFullScreen();
   			$(this).trigger("requestFullScreen");
  		}
	}
	
	//取消全屏 （Chrome 15 / Firefox Nightly / Safari 5.1）
	H5_video.prototype.cancel_full_screen	=	function(){
		
		if(this._video.exitFullscreen) {
    		this._video.exitFullscreen();
    		$(this).trigger("cancelFullScreen");
  		} else if(this._video.mozCancelFullScreen) {
    		this._video.mozCancelFullScreen();
    		$(this).trigger("cancelFullScreen");
  		} else if(this._video.webkitCancelFullScreen) {
   			this._video.webkitCancelFullScreen();
   			$(this).trigger("cancelFullScreen");
  		}
	}
	
	//增加事件监听
	H5_video.prototype.add_dispatch_event	=	function(){
	
		var _that =	this;
		_that._event	=	new	video_event.init(_that);
		_that._event.add_event();
	}
	
	//去除事件监听
	H5_video.prototype.remove_dispatch_event	=	function(){
	
		var _that =	this;
		_that._event.remove_event();
		_that._event	=	null;
	}
	
	/**检测您的浏览器是否能播放不同类型的视频
	*	常用值：
	*	video/ogg
	*	video/mp4
	*	video/webm
	*	audio/mpeg
	*	audio/ogg
	*	audio/mp4
	*	常用值，包括编解码器：
	*	video/ogg; codecs="theora, vorbis"
	*	video/mp4; codecs="avc1.4D401E, mp4a.40.2"
	*	video/webm; codecs="vp8.0, vorbis"
	*	audio/ogg; codecs="vorbis"
	*	audio/mp4; codecs="mp4a.40.5"
	*	注释：如果包含编解码器，则只能返回 "probably"。
	*
	*	表示支持的级别。可能的值：
	*	"probably" - 最有可能支持
	*	"maybe" - 可能支持
	*	"" - （空字符串）不支持
	**/
	H5_video.prototype.canPlayType = function(_type){
		return	this._video.canPlayType(_type);
	}
	
	H5_video.prototype.pause = function(){
		this._video.pause();
	}
	
	H5_video.prototype.play = function(){
		this._video.play();
	}
	
	//包装一个seek方法
	H5_video.prototype.seek = function(_seek_time){
		this._video.currentTime	=	_seek_time;
	}
	
	//方法重新加载音频/视频元素。用于在更改来源或其他设置后对音频/视频元素进行更新。
	H5_video.prototype.load = function(){
		this._video.load();
	}
	
	//快进
	H5_video.prototype.add_current_time	=	function(_num){
		this._video.currentTime+=_num;
	}
	
	//快退
	H5_video.prototype.reduce_current_time	=	function(_num){
		this._video.currentTime+=_num;
	}
	
	//播放速率 增加
	H5_video.prototype.add_playback_rate	=	function(_num){
		this._video.playbackRate+=_num;
	}
	
	//播放速率 减少
	H5_video.prototype.reduce_playback_rate	=	function(_num){
		this._video.playbackRate-=_num;
	}
	
	//加音量
	H5_video.prototype.add_volume	=	function(){
		this._video.volume+=0.1;
	}
	
	//减音量
	H5_video.prototype.reduce_volume	=	function(){
		this._video.volume-=0.1;
	}
	
	//静音 布尔
	H5_video.prototype.muted	=	function(_boolean){
		this._video.muted=_boolean;
	}
	
	//改变视频源
	H5_video.prototype.change_sn	=	function(_new_sn){
		
		this._user_data.sn	=	_new_sn;
		//移除监听事件
		this.remove_dispatch_event();
		clearInterval(this._online_timer);
		this._is_first_error	=	1;
		this.init();
	}
	
	//取得video对象属性
	H5_video.prototype.get_attributes = function(){
		
		var	_param_1	=	arguments[0];
		var	_param_2	=	arguments[1] ||	0;
		
		switch	(_param_1){
			case	"current_time"	:	return	video_get_attributes.currentTime(this._video);	break;
			case	"duration"	:	return	video_get_attributes.duration(this._video);	break;
			case	"paused"	:	return	video_get_attributes.paused(this._video);	break;
			case	"default_playback_rate"	:	return	video_get_attributes.defaultPlaybackRate(this._video);	break;
			case	"playback_rate"	:	return	video_get_attributes.playbackRate(this._video);	break;
			case	"played_start"	:	return	video_get_attributes.played_start(this._video,_param_2);	break;
			case	"played_end"	:	return	video_get_attributes.played_end(this._video,_param_2);	break; 
			case	"seekable_start"	:	return	video_get_attributes.seekable_start(this._video,_param_2);	break; 
			case	"seekable_end"	:	return	video_get_attributes.seekable_end(this._video,_param_2);	break;
			case	"ended"	:	return	video_get_attributes.ended(this._video);	break;
			case	"auto_play"	:	return	video_get_attributes.autoPlay(this._video);	break;
			case	"loop"	:	return	video_get_attributes.loop(this._video);	break;
			case	"buffered_start"	:	return	video_get_attributes.buffered_start(this._video,_param_2);	break;
			case	"buffered_end"	:	return	video_get_attributes.buffered_end(this._video,_param_2);	break;
			case	"audioTracks_length"	:	return	video_get_attributes.audioTracks_length(this._video);	break;
			case	"audioTracks_get_object_by_id"	:	return	video_get_attributes.audioTracks_get_object_by_id(this._video,_param_2);
			case	"audioTracks_get_object_by_index"	:	return	video_get_attributes.audioTracks_get_object_by_index(this._video,_param_2);	break;
			case	"controller"	:	return	video_get_attributes.controller(this._video);	break;
			case	"current_src"	:	return	video_get_attributes.currentSrc(this._video);	break;
			case	"default_muted"	:	return	video_get_attributes.defaultMuted(this._video);	break;
			case	"error"	:	return	video_get_attributes.error(this._video);	break;
			case	"media_group"	:	return	video_get_attributes.mediaGroup(this._video);	break;
			case	"muted"	:	return	video_get_attributes.muted(this._video);	break;
			case	"network_state"	:	return	video_get_attributes.networkState(this._video);	break;
			case	"ready_state"	:	return	video_get_attributes.readyState(this._video);	break;
			case	"volume"	:	return	video_get_attributes.volume(this._video);	break;
			case	"textTracks_length"	:	return	video_get_attributes.textTracks_length(this._video);	break;
			case	"textTracks_get_object_by_index"	:	return	video_get_attributes.textTracks_get_object_by_index(this._video,_param_2);	break;
			case	"textTracks_get_object_by_id"	:	return	video_get_attributes.textTracks_get_object_by_id(this._video,_param_2);	break;
			case	"videoTracks_get_object_by_index"	:	return	video_get_attributes.videoTracks_get_object_by_index(this._video,_param_2);	break;
			case	"videoTracks_get_object_by_id"	:	return	video_get_attributes.videoTracks_get_object_by_id(this._video,_param_2);	break;
			default:break;
		}
	}
	
	//开始上报信息
	//上传基本信息
	H5_video.prototype.upload_info_init	=	function(){
		
		var _that = this;
		//这里需要后端返回接口里面包含错误信息
		ajaxTools.ajaxGet(_that._upload_info_url,_that._update_info_base_date,function(data){
			if(data){
				console.log("调度接口请求成功");
			}else{
				console.log("请求调度接口请求失败");
			};
		});
	
	}
	
	//请求调度接口
	H5_video.prototype.upload_info_action	=	function(_num,_timer){

		var _that = this,
			_data	=	clone_data.clone_obj(_that._update_info_base_date);
			_data.st = 2;
			_data.rt = _timer;
			_data.ty = "action";
			_data.er = _num;
			_data.tm	=	new Date().getTime();
			_data.r	=	Math.random();
			switch (_num){
				case 0:	_data.em	=	"调度成功";break;
				case 1:	_data.em	=	"用户终止";break;
				case 2:	_data.em	=	"网络错误";break;
				case 3:	_data.em	=	"解码错误";break;
				case 4:	_data.em	=	"URL无效";break;
				default:break;
			}
			
		ajaxTools.ajaxGet(_that._upload_info_url,_data,function(data){
			if(data){
				console.log("调度接口上报成功");
			}else{
				console.log("调度接口上报失败");
			};
		});
	}
	
	//请求online接口
	H5_video.prototype.upload_info_online	=	function(_url,_d){
	
		var	_data	=	clone_data.clone_obj(_d);
			_data.ty	=	"online";
			_data.tm	=	new Date().getTime();
			_data.r	=	Math.random();
		ajaxTools.ajaxGet(_url,_data,function(data){
			if(data){
				console.log("在线接口上报成功");
			}else{
				console.log("在线接口上报失败");
			};
		});
	}
	
	//请求播放过程中的错误接口
	H5_video.prototype.upload_info_exception	=	function(_exception){
	
		var _that = this,
			_data	=	clone_data.clone_obj(_that._update_info_base_date);
			_data.exception = _exception;
			_data.st = 2;
			_data.ty = "action";
			_data.tm	=	new Date().getTime();
			_data.r	=	Math.random();
			_data.er = _exception;
			switch (_exception){
				case 1:	_data.em	=	"第一次加载时用户终止";break;
				case 2:	_data.em	=	"第一次加载时网络错误";break;
				case 3:	_data.em	=	"第一次加载时解码错误";break;
				case 4:	_data.em	=	"第一次加载时URL无效";break;
				default:break;
			}
			
		ajaxTools.ajaxGet(_that._upload_info_url,_data,function(data){
			if(data){
				console.log("播放过程中的错误接口上报成功");
			}else{
				console.log("播放过程中的错误接口上报失败");
			};
		});
	}
	
	//缓冲原因 缓冲时间
	H5_video.prototype.upload_info_buffer	=	function(_br,_timer){
		
		var _that = this,
			_data	=	clone_data.clone_obj(_that._update_info_base_date);
			_data.br = _br;
			_data.ty = "buffer";
			_data.bc = _that._waiting_num;
			_data.po = _that._video.currentTime;
			_data.bt	=	_timer;
			_data.tm	=	new Date().getTime();
			_data.r	=	Math.random();
			switch (_br){
				case	1: _data.em	=	"第一次加载引起的缓冲结束";break;
				case	2: _data.em	=	"因为seek引起得缓冲开始";break;
				case	4: _data.em	=	"因为播放过程中卡引起的缓冲开始";break;
				default:break;
			};
		ajaxTools.ajaxGet(_that._upload_info_url,_data,function(data){
			if(data){
				console.log("缓冲原因和时间接口上报成功");
			}else{
				console.log("缓冲原因和时间接口上报失败");
			};
		});
	}
	
	//加上缓冲一共花去的观看影片的时间
	H5_video.prototype.upload_info_summary	=	function(_ot,_pt){
		
		var _that = this,
			_data	=	clone_data.clone_obj(_that._update_info_base_date);
			_data.ot = _ot;
			_data.bc = _that._waiting_num;
			_data.pt = _pt;
			_data.ty = "summary";
			_data.tm	=	new Date().getTime();
			_data.r	=	Math.random();
			
		ajaxTools.ajaxGet(_that._upload_info_url,_data,function(data){
			if(data){
				console.log("加上缓冲一共花去的观看影片的时间接口上报成功");
			}else{
				console.log("加上缓冲一共花去的观看影片的时间接口上报失败");
			};
		});
	}
	
}(Zepto,window));
},{"./Clone_obj":1,"./Connect":2,"./Video_event":4,"./Video_get_attributes":5,"./ajaxTools":7}],4:[function(require,module,exports){
/**
	*	add sdk event
	*	lijingan
	*	qq:290711851
	*	2015.08.04
	**/
	
module.exports = (function(){

	var init	=	function(_video_obj){
		var	video_skin	=	require('./Video_skin');
		var _that	=	this;
		_that._obj	=	_video_obj;
		_that._dom	=	_video_obj._video;
		
		_that.add_event	=	function(){
			_that._dom.addEventListener("loadstart",loadstart,false);
			_that._dom.addEventListener("progress",progress,false);
			_that._dom.addEventListener("suspend",suspend,false);
			_that._dom.addEventListener("abort",abort,false);
			_that._dom.addEventListener("error",error,false);
			_that._dom.addEventListener("stalled",stalled,false);
			_that._dom.addEventListener("play",play,false);
			_that._dom.addEventListener("pause",pause,false);
			_that._dom.addEventListener("loadedmetadata",loadedmetadata,false);
			_that._dom.addEventListener("loadeddata",loadeddata,false);
			_that._dom.addEventListener("waiting",waiting,false);
			_that._dom.addEventListener("playing",playing,false);
			_that._dom.addEventListener("canplay",canplay,false);
			_that._dom.addEventListener("canplaythrough",canplaythrough,false);
			_that._dom.addEventListener("seeking",seeking,false);
			_that._dom.addEventListener("seeked",seeked,false);
			_that._dom.addEventListener("timeupdate",timeupdate,false);
			_that._dom.addEventListener("ended",ended,false);
			_that._dom.addEventListener("ratechange",ratechange,false);
			_that._dom.addEventListener("durationchange",durationchange,false);
			_that._dom.addEventListener("volumechange",volumechange,false);
			
			$("body").delegate(".js_h5_sdk_play_dom","touchend",function(){
				_that._dom.play();
			});
		}
		
		_that.remove_event	=	function(){
			_that._dom.removeEventListener("loadstart",loadstart,false);
			_that._dom.removeEventListener("progress",progress,false);
			_that._dom.removeEventListener("suspend",suspend,false);
			_that._dom.removeEventListener("abort",abort,false);
			_that._dom.removeEventListener("error",error,false);
			_that._dom.removeEventListener("stalled",stalled,false);
			_that._dom.removeEventListener("play",play,false);
			_that._dom.removeEventListener("pause",pause,false);
			_that._dom.removeEventListener("loadedmetadata",loadedmetadata,false);
			_that._dom.removeEventListener("loadeddata",loadeddata,false);
			_that._dom.removeEventListener("waiting",waiting,false);
			_that._dom.removeEventListener("playing",playing,false);
			_that._dom.removeEventListener("canplay",canplay,false);
			_that._dom.removeEventListener("canplaythrough",canplaythrough,false);
			_that._dom.removeEventListener("seeking",seeking,false);
			_that._dom.removeEventListener("seeked",seeked,false);
			_that._dom.removeEventListener("timeupdate",timeupdate,false);
			_that._dom.removeEventListener("ended",ended,false);
			_that._dom.removeEventListener("ratechange",ratechange,false);
			_that._dom.removeEventListener("durationchange",durationchange,false);
			_that._dom.removeEventListener("volumechange",volumechange,false);
			
			$(".js_h5_sdk_play_dom").unbind();
		}
		
		//客户端开始请求数据
		function	loadstart(){
			$(_that._obj).trigger("loadstart");
			if(_that._obj._skin){
				video_skin.hide_waiting(_that._dom);	
				video_skin.show_play(_that._dom);	
			}
			//从下载资源开始就算卡，用来算，每次下载需要多长时间
			_that._obj._is_waiting	=	1;
			_that._obj._waiting_start_time	=	new Date().getTime();
		}
		
		//客户端正在请求数据
		function	progress(){
		
			$(_that._obj).trigger("progress");
		}
		
		//延迟下载 （下载完成或按了暂停按钮都可能触发）
		function	suspend(){
		
			$(_that._obj).trigger("suspend");
		}
		
		//客户端主动终止下载（不是因为错误引起, 比如说现在在播放中，而且还没完全下载完，你点了重新播放）
		function	abort(){
		
			$(_that._obj).trigger("abort");
		}
		
		//请求数据时遇到错误
		//1.用户终止 
		//2.网络错误 
		//3.解码错误 
		//4.URL无效 
		function	error(e){
		
			$(_that._obj).trigger("error");
			if(!_that._obj._is_first_error){
				_that._obj.upload_info_exception(_that._dom.error.code);
			};
			_that._obj._mark_time	=	_that._dom.currentTime;
			_that._obj.use_back_url();
		}
		
		//该下载下来的数据没下载下来，或者下载下来的数据与预期不符
		function	stalled(){
		
			$(_that._obj).trigger("stalled");
			_that._obj._mark_time	=	_that._dom.currentTime;
			//_that._obj.use_back_url();
		}
		
		//play()和autoplay开始播放时触发
		function	play(){
		
			if(_that._obj._skin){
				video_skin.hide_waiting(_that._dom);
				video_skin.hide_play(_that._dom);	
			}
			$(_that._obj).trigger("play");
		}
		
		//pause()触发
		function	pause(){
		
			if(_that._obj._skin){
				video_skin.show_play(_that._dom);
				video_skin.hide_waiting(_that._dom);	
			}
			_that._obj._is_pause	=	1;
			$(_that._obj).trigger("pause");
		}
		
		//metdata下载完了 当收到总时长，分辨率和字轨等metadata时产生该事件
		function	loadedmetadata(){
		
			$(_that._obj).trigger("loadedmetadata");
		}
		
		//第一帧加载完成
		function	loadeddata(){
		
			$(_that._obj).trigger("loadeddata");
		}
		
		//等待数据中
		function	waiting(){
			
			$(_that._obj).trigger("waiting");
			if(_that._obj._waiting_num){
				if(_that._obj._skin){
					video_skin.show_waiting(_that._dom);	
					video_skin.hide_play(_that._dom);	
				}
			}
			_that._obj._waiting_num++;
			
			_that._obj._waiting_start_time	=	new Date().getTime();
			//_that._obj.upload_info_buffer();
		}
		
		//回放或暂停后再次开始播放 或 当媒体从因缓冲而引起的暂停和停止恢复到播放时产生该事件
		function	playing(){
			if(_that._obj._skin){
				video_skin.hide_waiting(_that._dom);	
				video_skin.hide_play(_that._dom);	
			}
			$(_that._obj).trigger("playing");
			_that._obj._waiting_end_time	=	new Date().getTime();
			
			//如果是等待下载后恢复播放得，需要向服务器端上报一下等待时间。
			var	_waiting_time	=	_that._obj._waiting_end_time	-	_that._obj._waiting_start_time;
			_that._obj._total_waiting_time	=	_that._obj._total_waiting_time	+	_waiting_time;
			if(_that._obj._is_pause){
				_that._obj._is_pause	=	0;
			}else if(_that._obj._is_seek){
				//如果缓冲是因为seek引起得需要上报
				if(_that._obj._waiting_start_time!=0){
					_that._obj.upload_info_buffer(2,_waiting_time);
				}
			}else{
				if(_that._obj._waiting_num	==	0){
					_that._obj.upload_info_buffer(1,_waiting_time);
					_that._obj._waiting_num++;
				}else{
					//如果缓冲是因为播放过程中卡
					if(_that._obj._waiting_start_time!=0){
						_that._obj.upload_info_buffer(4,_waiting_time);
					}
				}
			}
			
			_that._obj._waiting_start_time	=	0;
			_that._obj._waiting_end_time	=	0;
			_that._obj._is_seek	=	0;
		}
		
		//可以开始播放了,加载下来一些帧，但非全部
		function	canplay(){
		
			$(_that._obj).trigger("canplay");
			if(_that._obj._mark_time){
				_that._dom.currentTime = _that._obj._mark_time;
				_that._obj._mark_time =	0;
			}
			
		}
		
		//可以开始播放了，加载下来了全部
		function	canplaythrough(){
		
			$(_that._obj).trigger("canplaythrough");
		}
		
		//寻找关键帧中
		function	seeking(){
		
			_that._obj._is_seek	=	1;
			$(_that._obj).trigger("seeking");
		}
		
		//寻找完毕
		function	seeked(){
		
			$(_that._obj).trigger("seeked");
		}
		
		//播放时间改变
		function	timeupdate(){
		
			$(_that._obj).trigger("timeupdate");
		}
		
		//播放结束
		function	ended(){
		
			//console.log(_that._obj._video.currentTime);
			//_that._obj.upload_info_bc(_that._obj._waiting_num);
			//加上缓冲时间的观看video一共用的时间,未加上缓冲时间的观看video一共用的时间
			_that._obj.upload_info_summary(_that._obj._total_waiting_time + _that._obj._video.currentTime,_that._obj._video.currentTime);
			_that._obj._total_waiting_time	=	0;
			_that._obj._waiting_num	=	0;
			//清楚online上报循环
			clearInterval(_that._obj._online_timer);
			_that._obj._is_first_error	=	1;
			_that._obj._mark_time	=	0;
			$(_that._obj).trigger("ended");
		}
		
		//播放速率改变
		function	ratechange(){
		
			$(_that._obj).trigger("ratechange");
		}
		
		//资源长度改变
		function	durationchange(){
		
			$(_that._obj).trigger("durationchange");
		}
		
		//音量改变
		function	volumechange(){
		
			$(_that._obj).trigger("volumechange");
		}
	}
	
	return{
		init:init
	}
}());
},{"./Video_skin":6}],5:[function(require,module,exports){
/**
	*	add sdk get video attributes
	*	lijingan
	*	qq:290711851
	*	2015.08.05
	**/
module.exports = (function(){
	
	var current_time_status = 0;
	var current_time_base = 0;
	var currentTime	=	function(_video){
	
		var _current_time = 0;
		if( current_time_status < 2 ){
			current_time_status ++;
		}else if( current_time_status == 2 ){
			current_time_status ++;
			if( _video.currentTime > 1000 ){
				current_time_base = _video.currentTime;
			}
		}
		if( current_time_base ){
			_currentTime = _video.currentTime - current_time_base;
		}else{
			_currentTime = _video.currentTime;
		}
		return _currentTime;
	}
	var duration	=	function(_video){
		return _video.duration;
	}
	var paused	=	function(_video){
		return _video.paused;
	}
	var defaultPlaybackRate	=	function(_video){
		return _video.defaultPlaybackRate;
	}
	var playbackRate	=	function(_video){
		return _video.playbackRate;
	}
	
	//已播范围指的是被播放音频/视频的时间范围。如果用户在音频/视频中跳跃，则会获得多个播放范围。
	//获得某个已播范围的开始位置
	var played_start	=	function(_video,_num){
		return _video.played.start(_num);
	}
	
	//获得某个已播范围的结束位置
	var played_end	=	function(_video,_num){
		return _video.played.end(_num);
	}
	
	//可寻址范围指的是用户在音频/视频中可寻址（移动播放位置）的时间范围。
	//对于流视频，通常可以寻址到视频中的任何位置，即使其尚未完成缓冲。
	//获得某个已播范围的开始位置
	var seekable_start	=	function(_video,_num){
		return _video.seekable.start(_num);
	}
	
	//获得某个已播范围的结束位置
	var seekable_end	=	function(_video,_num){
		return _video.seekable.end(_num);
	}
	
	var ended	=	function(_video){
		return _video.ended;
	}
	var autoPlay	=	function(_video){
		return _video.autoplay;
	}
	var loop	=	function(_video){
		return _video.loop;
	}
	
	//缓冲范围指的是已缓冲音视频的时间范围。如果用户在音视频中跳跃播放，会得到多个缓冲范围。
	//获得某个已播范围的开始位置
	var buffered_start	=	function(_video,_num){
		return _video.buffered.start(_num);
	}
	
	//获得某个已播范围的结束位置
	var buffered_end	=	function(_video,_num){
		return _video.buffered.end(_num);
	}
	
	//可用音轨的数量
	var audioTracks_length	=	function(_video){
		return _video.audioTracks.length;
	}
	
	//通过 id 来获得 AudioTrack 对象
	var audioTracks_get_object_by_id	=	function(_video,_num){
		return _video.audioTracks.getTrackById(_num);
	}
	
	//通过 index 来获得 AudioTrack 对象
	var audioTracks_get_object_by_index	=	function(_video,_num){
		return _video.audioTracks[_num];
	}
	
	//返回当前的媒体控制器（MediaController对象）
	var controller	=	function(_video){
		return _video.controller;
	}
	
	//返回当前媒体的URL
	var currentSrc	=	function(_video){
		return _video.currentSrc;
	}
	
	//缺省是否静音
	var defaultMuted	=	function(_video){
		return _video.defaultMuted;
	}
	
	//返回当前播放的错误状态
	//1.用户终止 
	//2.网络错误 
	//3.解码错误 
	//4.URL无效 
	var error	=	function(_video){
		return _video.error;
	}
	
	//当前音视频所属媒体组 (用来链接多个音视频标签)
	var mediaGroup	=	function(_video){
		return _video.mediaGroup;
	}
	
	//是否静音
	var muted	=	function(_video){
		return _video.muted;
	}
	
	//音量值
	var volume	=	function(_video){
		return _video.volume;
	}
	
	//返回当前网络状态
	//0 = NETWORK_EMPTY - 音频/视频尚未初始化
	//1 = NETWORK_IDLE - 音频/视频是活动的且已选取资源，但并未使用网络
	//2 = NETWORK_LOADING - 浏览器正在下载数据
	//3 = NETWORK_NO_SOURCE - 未找到音频/视频来源
	var networkState	=	function(_video){
		return _video.networkState;
	}
	
	//返回音频/视频元素的就绪状态
	//0 = HAVE_NOTHING - 没有关于音频/视频是否就绪的信息
	//1 = HAVE_METADATA - 关于音频/视频就绪的元数据
	//2 = HAVE_CURRENT_DATA - 关于当前播放位置的数据是可用的，但没有足够的数据来播放下一帧/毫秒
	//3 = HAVE_FUTURE_DATA - 当前及至少下一帧的数据是可用的
	//4 = HAVE_ENOUGH_DATA - 可用数据足以开始播放
	var readyState	=	function(_video){
		return _video.readyState;
	}
	
	//文本轨迹(TextTrackList对象)得长度
	var textTracks_length	=	function(_video){
		return _video.textTracks.length;
	}
	
	//根据下标来获得 TextTrack 对象
	var textTracks_get_object_by_index	=	function(_video,_num){
		return _video.textTracks[_num];
	}
	
	//根据id来获得 TextTrack 对象
	var textTracks_get_object_by_id	=	function(_video,_num){
		return _video.textTracks.getTrackById(_num);
	}
	
	//根据下标来获得 videoTracks 对象
	var videoTracks_get_object_by_index	=	function(_video,_num){
		return _video.videoTracks[_num];
	}
	
	//根据id来获得 videoTracks 对象
	var videoTracks_get_object_by_id	=	function(_video,_num){
		return _video.videoTracks.getTrackById(_num);
	}
	
	return{
		currentTime:function(_video){
			return currentTime(_video);
		},
		duration:function(_video){
			return duration(_video);
		},
		paused:function(_video){
			return paused(_video);
		},
		defaultPlaybackRate:function(_video){
			return defaultPlaybackRate(_video);
		},
		playbackRate:function(_video){
			return playbackRate(_video);
		},
		played_start:function(_video,_num){
			return played_start(_video,_num);
		},
		played_end:function(_video,_num){
			return played_end(_video,_num);
		},
		seekable_start:function(_video,_num){
			return seekable_start(_video,_num);
		},
		seekable_end:function(_video,_num){
			return seekable_end(_video,_num);
		},
		ended:function(_video){
			return ended(_video);
		},
		autoPlay:function(_video){
			return autoPlay(_video);
		},
		loop:function(_video){
			return loop(_video);
		},
		buffered_start:function(_video,_num){
			return buffered_start(_video,_num);
		},
		buffered_end:function(_video,_num){
			return buffered_end(_video,_num);
		},
		audioTracks_length:function(_video){
			return audioTracks_length(_video);
		},
		audioTracks_get_object_by_id:function(_video,_num){
			return audioTracks_get_object_by_id(_video,_num);
		},
		audioTracks_get_object_by_index:function(_video,_num){
			return audioTracks_get_object_by_index(_video,_num);
		},
		controller:function(_video){
			return controller(_video);
		},
		currentSrc:function(_video){
			return currentSrc(_video);
		},
		defaultMuted:function(_video){
			return defaultMuted(_video);
		},
		error:function(_video){
			return error(_video);
		},
		mediaGroup:function(_video){
			return mediaGroup(_video);
		},
		muted:function(_video){
			return muted(_video);
		},
		networkState:function(_video){
			return networkState(_video);
		},
		readyState:function(_video){
			return readyState(_video);
		},
		volume:function(_video){
			return volume(_video);
		},
		textTracks_length:function(_video){
			return textTracks_length(_video);
		},
		textTracks_get_object_by_index:function(_video,_num){
			return textTracks_get_object_by_index(_video,_num);
		},
		textTracks_get_object_by_id:function(_video,_num){
			return textTracks_get_object_by_id(_video,_num);
		},
		videoTracks_get_object_by_id:function(_video,_num){
			return videoTracks_get_object_by_id(_video,_num);
		},
		videoTracks_get_object_by_index:function(_video,_num){
			return videoTracks_get_object_by_index(_video,_num);
		}		
	}
}());
},{}],6:[function(require,module,exports){
/**
	*	add sdk skin
	*	lijingan
	*	qq:290711851
	*	2015.09.15
	**/
	
module.exports = (function(){

	var show_waiting	=	function(_video){
	
		if($(".js_h5_sdk_waiting_dom").length){
			$(".js_h5_sdk_play_dom").hide();
			$(".js_h5_sdk_waiting_dom").show();
		}else{
			var _dom = '<a type="button" class="js_h5_sdk_waiting_dom"></a>';
			$(_video).after(_dom);
		}
	}
	
	var hide_waiting	=	function(_video){
		
		$(_video).next(".js_h5_sdk_waiting_dom").hide();
	}
	
	var show_play	=	function(_video){
		
		if($(".js_h5_sdk_play_dom").length){
			$(".js_h5_sdk_waiting_dom").hide();
			$(".js_h5_sdk_play_dom").show();
		}else{
			var _dom = '<a type="button" style="4px solid green" class="js_h5_sdk_play_dom"></a>';
			$(_video).after(_dom);
		}
	}
	
	var hide_play	=	function(_video){
	
		$(_video).next(".js_h5_sdk_play_dom").hide();
	}
	
	return{
		show_waiting:show_waiting,
		hide_waiting:hide_waiting,
		show_play:show_play,
		hide_play:hide_play
	}
}());
},{}],7:[function(require,module,exports){
/**
 * author lijingan
 * QQ:290711851
 *	改成模块儿
 * 2015.08.03
 **/
 
module.exports = (function () {
    var ajaxPost = function (url, data, fun) {
        $.ajax({
            type: "POST",
            url: url,
            cache: false,
            data: data,
            xhrFields: {withCredentials: true},
            success: function (d) {
                fun(d);
            },
            error: function () {
                fun(false);
            }
        });
    };

    var ajaxGet = function (url, data, fun) {
        $.ajax({
            type: "GET",
            url: url,
            cache: false,
            data: data,
            xhrFields: {withCredentials: true},
            success: function (d) {
                fun(d);
            },
            error: function () {
                fun(false);
            }
        });
    };

    var ajaxJsonp = function (url, data, fun) {
        $.ajax({
            type: "GET",
            dataType: "jsonp",
            jsonp: "callbackfn",
            jsonpCallback:data._jsonp,
            url: url,
            cache: false,
            data: data,
            xhrFields: {withCredentials: true},
            success: function (callbackData) {
                fun(callbackData);
            },
            error: function () {
                fun(false);
            }
        });
    };

    return {
        ajaxPost: ajaxPost,
        ajaxGet: ajaxGet,
        ajaxJsonp: ajaxJsonp
    };
}());
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIkNsb25lX29iai5qcyIsIkNvbm5lY3QuanMiLCJNYWluLmpzIiwiVmlkZW9fZXZlbnQuanMiLCJWaWRlb19nZXRfYXR0cmlidXRlcy5qcyIsIlZpZGVvX3NraW4uanMiLCJhamF4VG9vbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBhdXRob3IgbGlqaW5nYW5cbiAqIOWFi+mahuWvueixoVxuICogUVE6MjkwNzExODUxXG4gKiAyMDE1LjA4LjEzXG4gKiovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG5cdHZhciBjbG9uZV9vYmpcdD1cdGZ1bmN0aW9uKF9vYmope1xuXHRcdCAgXHR2YXIgb2JqID0gYXJndW1lbnRzWzBdO1xuXHRcdCAgXHRpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcgfHwgb2JqID09PSBudWxsKVxuICAgICAgXHRcdFx0cmV0dXJuIHt9O1xuXG5cdFx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG4gICAgICBcdFx0XHRyZXR1cm4gb2JqO1xuICBcbiAgXHRcdFx0Ly/nrKzkuozkuKrlj4LmlbDmmK/lsZ7mgKflkI3np7DliJfooajvvIzlsLHph4fnlKjor6XliJfooajov5vooYzliLfpgIlcbiAgXHRcdFx0Ly/lkKbliJnlsLHlhYvpmobmiYDmnInlsZ7mgKdcbiAgXHRcdFx0dmFyIGF0dHJzID0gYXJndW1lbnRzWzFdO1xuICBcdFx0XHR2YXIgZW5hYmxlX3NwZWNfYXR0ciA9IHRydWU7XG4gIFx0XHRcdGlmICghKGF0dHJzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICBcdFx0XHQvL2NvbnNvbGUubG9nKGF0dHJzKTtcbiAgICAgIFx0XHRcdGF0dHJzID0gb2JqO1xuICAgICAgXHRcdFx0ZW5hYmxlX3NwZWNfYXR0ciA9IGZhbHNlO1xuICBcdFx0XHR9XG5cbiAgXHRcdFx0dmFyIHJlc3VsdCA9IHt9O1xuICBcdFx0XHR2YXIgaTtcbiAgXHRcdFx0Zm9yIChpIGluIGF0dHJzKSB7XG4gICAgICBcdFx0XHRhdHRyID0gZW5hYmxlX3NwZWNfYXR0cj8gYXR0cnNbaV06IGk7XG4gICAgICBcdFx0XHQvL2NvbnNvbGUubG9nKGF0dHIpO1xuICAgICAgXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShhdHRyKSkge1xuICAgICAgICAgIFx0XHRpZiAob2JqW2F0dHJdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgXHRcdHJlc3VsdFthdHRyXSA9IGNsb25lQXJyYXkob2JqW2F0dHJdKTtcbiAgICAgICAgICBcdFx0fVxuICAgICAgICAgIFx0XHRlbHNlIGlmICh0eXBlb2Ygb2JqW2F0dHJdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICBcdFx0cmVzdWx0W2F0dHJdID0gY2xvbmVPd24ob2JqW2F0dHJdKTtcbiAgICAgICAgICBcdFx0fSBlbHNlIHtcbiAgICAgICAgICAgICAgXHRcdHJlc3VsdFthdHRyXSA9IG9ialthdHRyXTtcbiAgICAgICAgICBcdFx0fVxuICAgICAgXHRcdH1cbiAgXHRcdH1cblxuICBcdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXHRyZXR1cm4ge1xuXHRcdGNsb25lX29iajpjbG9uZV9vYmpcblx0fVxufSgpKTsiLCIvKipcblx0Klx0Y29ubmVjdCBjZG5cblx0Klx0bGlqaW5nYW5cblx0Klx0cXE6MjkwNzExODUxXG5cdCpcdDIwMTUuMDguMDVcblx0KiovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpe1xuXHRcblx0dmFyXHRhamF4VG9vbHNcdD1cdHJlcXVpcmUoJy4vYWpheFRvb2xzJyksXG5cdFx0X2xpdmVfdXJsXHQ9XHRcImh0dHA6Ly9nLmxpdmUuMzYwLmNuL2xpdmVwbGF5XCIsXG5cdFx0X2xpdmVfdXJsX2RlYnVnXHQ9XHRcImh0dHA6Ly9ndGVzdC5saXZlLjM2MC5jbi9saXZlcGxheVwiLFxuXHRcdF9yZXBsYXlfdXJsXHQ9XHRcImh0dHA6Ly9nLmxpdmUuMzYwLmNuL3JlcGxheVwiLFxuXHRcdF9yZXBsYXlfdXJsX2RlYnVnXHQ9XHRcImh0dHA6Ly9ndGVzdC5saXZlLjM2MC5jbi9yZXBsYXlcIixcblx0XHRfY29ubmVjdF9udW1cdD1cdDA7XG5cdFxuXHR2YXIgaW5pdFx0PVx0ZnVuY3Rpb24oX3ZpZGVvX29iaixfZCxfZm4pe1xuXHRcdHZhclx0X3VybFx0PVx0XCJcIjtcblx0XHRpZiggX2QudnR5cGU9PVwibGl2ZXBsYXlcIil7XG5cdFx0XHRpZihfZC5kZWJ1Zyl7XG5cdFx0XHRcdF91cmxcdD1cdF9saXZlX3VybF9kZWJ1Zztcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRfdXJsXHQ9XHRfbGl2ZV91cmw7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHRpZihfZC5kZWJ1Zyl7XG5cdFx0XHRcdF91cmxcdD1cdF9yZXBsYXlfdXJsX2RlYnVnO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdF91cmxcdD1cdF9yZXBsYXlfdXJsO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR2YXIgX2RhdGEgPSB7XG5cdFx0XHRjaGFubmVsOl9kLmNoYW5uZWwsXG5cdFx0XHRzbjpfZC5zbixcblx0XHRcdF9yYXRlOl9kLl9yYXRlLFxuXHRcdFx0c3R5cGU6X2Quc3R5cGUsXG5cdFx0XHRzaWQ6X2Quc2lkLFxuXHRcdFx0dHM6X2QudHMsXG5cdFx0XHRfanNvbnA6X2QuX2pzb25wXG5cdFx0fVxuXHRcdFxuXHRcdGFqYXhUb29scy5hamF4SnNvbnAoX3VybCxfZGF0YSxmdW5jdGlvbihkYXRhKXtcblx0XHRcdFxuXHRcdFx0aWYoZGF0YSl7XG5cdFx0XHRcdF9mbihkYXRhKTtcblx0XHRcdFx0Ly/lkYror4nosIPnlKjmlrnvvIwg5bey57uP5b6X5Yiw5LqGdXJsXG5cdFx0XHRcdF92aWRlb19vYmoudHJpZ2dlcihcImNvbm5lY3RTdWNjZXNzXCIpO1xuXHRcdFx0XHRcblx0XHRcdH1lbHNle1xuXHRcdFx0XHQvL+WmguaenOayoeacieaVsOaNru+8jOmCo+S5iOi/nue7reivt+axguS4ieasoe+8jOaXoOaenOWQjuWRiuivieeUqOaIt+Wksei0pVxuXHRcdFx0XHRfdmlkZW9fb2JqLnRyaWdnZXIoXCJyZWNvbm5lY3RcIik7XG5cdFx0XHRcdGlmKF9jb25uZWN0X251bVx0PFx0Myl7XG5cdFx0XHRcdFx0X2Nvbm5lY3RfbnVtKys7XG5cdFx0XHRcdFx0dmFyXHRfY3VyX251bVx0PVx0TWF0aC5mbG9vcigwK01hdGgucmFuZG9tKCkqKDItMCkpO1xuXHRcdFx0XHRcdHN3aXRjaFx0KF9jdXJfbnVtKXtcblx0XHRcdFx0XHRcdGNhc2VcdDA6XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdGluaXQoX2RhdGEsX2ZuKTtcblx0XHRcdFx0XHRcdH0sMTAwMCk7YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlXHQxOlx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHRpbml0KF9kYXRhLF9mbik7XG5cdFx0XHRcdFx0XHR9LDMwMDApO2JyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZVx0MjpcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0aW5pdChfZGF0YSxfZm4pO1xuXHRcdFx0XHRcdFx0fSw1MDAwKTticmVhaztcblx0XHRcdFx0XHRcdGRlZmF1bHQ6YnJlYWs7XG5cdFx0XHRcdFx0fVx0XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdF92aWRlb19vYmoudHJpZ2dlcihcImNvbm5lY3RFcnJvclwiKTtcblx0XHRcdFx0XHRfZm4oZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblx0XG5cdHJldHVybntcblx0XHRpbml0OmluaXRcblx0fVxufSgpKTsiLCIvKipcblx0Klx0dmlkZW8gcGxheWVyIGZvciBtM3U4XG5cdCpcdGxpamluZ2FuXG5cdCpcdHFxOjI5MDcxMTg1MVxuXHQqXHQyMDE1LjA3LjI5XG5cdCoqL1xuKGZ1bmN0aW9uKCQsd2luKXtcblx0XG5cdHZhclx0Y29ubmVjdFx0PVx0cmVxdWlyZSgnLi9Db25uZWN0JyksXG5cdFx0dmlkZW9fZXZlbnRcdD1cdHJlcXVpcmUoJy4vVmlkZW9fZXZlbnQnKSxcblx0XHR2aWRlb19nZXRfYXR0cmlidXRlc1x0PVx0cmVxdWlyZSgnLi9WaWRlb19nZXRfYXR0cmlidXRlcycpLFxuXHRcdGFqYXhUb29scyA9IHJlcXVpcmUoJy4vYWpheFRvb2xzJyk7XG5cdFx0Y2xvbmVfZGF0YSA9IHJlcXVpcmUoJy4vQ2xvbmVfb2JqJyk7XG5cdFx0XG5cdEg1X3ZpZGVvID0gZnVuY3Rpb24oZCxkb20pe1xuXHRcdHZhciBfdGhhdCA9IHRoaXM7XG5cdFx0dGhpcy5fZG9tXHQ9XHRkb207XG5cdFx0Ly90aGlzLl92aWRlb1x0PVx0ZG9tWzBdO1xuXHRcdHRoaXMuX3VzZXJfZGF0YVx0PVx0ZDtcblx0XHR0aGlzLl91cGxvYWRfaW5mb191cmwgPSBcImh0dHA6Ly9xb3MubGl2ZS4zNjAuY24vdmMuZ2lmXCI7XG5cdFx0dGhpcy5fZXZlbnQ7XG5cdFx0dGhpcy5fb25saW5lX3RpbWVyO1xuXHRcdHRoaXMuX2JhY2tfdXJsX3RpbWVyO1xuXHRcdHRoaXMuX3Nka3ZlciA9IFwiMS4wLjBcIjtcblx0XHR0aGlzLl91cGRhdGVfaW5mb19iYXNlX2RhdGU7XG5cdFx0dGhpcy5faXNfcGF1c2VcdD1cdDA7XG5cdFx0dGhpcy5fc2tpbiA9IGQuc2tpbiB8fCBmYWxzZTsgLy/pu5jorqTkuI3mmL7npLrnmq7ogqRcblx0XHRcblx0XHRpZiggdGhpcy5jaGVja192aWRlbygpICl7XG5cdFx0XHR0aGlzLmluaXQoKTtcblx0XHR9ZWxzZXtcblx0XHRcdGNvbnNvbGUubG9nKFwi5LiN5pSv5oyBdmlkZW/moIfnrb5cIik7XG5cdFx0fVxuXHRcdFxuXHR9XG5cdFxuXHRINV92aWRlby5wcm90b3R5cGUuaW5pdFx0PVx0ZnVuY3Rpb24oKXtcblx0XHR2YXIgX3RoYXRcdD1cdHRoaXM7XG5cdFx0dGhpcy5fdmlkZW87XG5cdFx0dGhpcy5faXNfd2FpdGluZ1x0PVx0MDtcdC8vXHTmmK/lkKblnKjnvJPlhrJcblx0XHR0aGlzLl93YWl0aW5nX3N0YXJ0X3RpbWVcdD1cdDA7XHQvL1x05pys5qyh57yT5Yay5byA5aeL5pe26Ze0XG5cdFx0dGhpcy5fd2FpdGluZ19lbmRfdGltZVx0PVx0MDtcdC8vXHTmnKzmrKHnvJPlhrLnu5PmnZ/ml7bpl7Rcblx0XHR0aGlzLl93YWl0aW5nX251bVx0PVx0MDtcdC8vXHTmnKzmrKHmkq3mlL7nvJPlhrLmrKHmlbBcblx0XHR0aGlzLl9pc19zZWVrXHQ9XHQwOyBcdC8v5piv5ZCm5Zyo5ouW5YqoIFxuXHRcdHRoaXMuX3RvdGFsX3dhaXRpbmdfdGltZVx0PVx0MDsgLy/kuIDlhbHnrYnlvoXkuoblpJrplb/ml7bpl7Rcblx0XHR0aGlzLl9pc19maXJzdF9lcnJvclx0PVx0MTtcdC8v6KaB5Yy65YiG5piv5pKt5pS+5Lit55qE5oql6ZSZ77yM6L+Y5piv56ys5LiA5qyh6K+35rGC5pe255qE5oql6ZSZ77yM5omA5Lul6ZyA6KaB5LiA5Liq54q25oCBXG5cdFx0dGhpcy5fbWFya190aW1lID1cdDA7XG5cdFx0XG5cdFx0Ly/mm7/ooaXnmoRtM3U45Zyw5Z2AXG5cdFx0dGhpcy5fYmFja191cmxcdD1cdFtdO1xuXHRcdFxuXHRcdHRoaXMuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZVx0PVx0e1xuXHRcdFx0Y2lkOlx0dGhpcy5fdXNlcl9kYXRhLmNoYW5uZWwsIC8v5LiN5Y+v5LiN5aGrXG5cdFx0XHR1aWQ6XHR0aGlzLl91c2VyX2RhdGEudWlkIHx8IFwiXCIsXG5cdFx0XHRzZGt2ZXI6XHR0aGlzLl9zZGt2ZXIsXG5cdFx0XHRzaWQ6XHR0aGlzLl91c2VyX2RhdGEuc2lkIHx8IFwiXCIsXG5cdFx0XHRiaWQ6XHR0aGlzLl91c2VyX2RhdGEuYmlkIHx8IFwiXCIsXG5cdFx0XHRwaWQ6XHR0aGlzLl91c2VyX2RhdGEucGlkIHx8IFwiSDVcIixcblx0XHRcdHZlcjpcdFwiMC4wLjFcIixcblx0XHRcdHJpZDpcdHRoaXMuX3VzZXJfZGF0YS5zbixcblx0XHRcdG1pZDpcdHRoaXMuX3VzZXJfZGF0YS5taWQgfHwgXCJcIixcdC8v5py65ZmoaWQg6L+Z5Liq5pKt5pS+5Zmo55qE6L295L2T5piv5LuA5LmI77yM5Zug5Li6anPlvpfkuI3liLDjgIJcblx0XHRcdHRtOlx0bmV3IERhdGUoKS5nZXRUaW1lKCksXG5cdFx0XHRyOlx0TWF0aC5yYW5kb20oKSxcblx0XHRcdHR5Olwib25saW5lXCJcblx0XHR9O1xuXHRcdC8v5YWI5Y67cGxheS4zNjBrYW4uY29ycC5xaWhvby5uZXTmi7/liLDlrp7pmYXmkq3mlL7pnIDopoHnmoR1cmwg54S25ZCO5omT54K544CCXG5cdFx0dmFyIF9kYXRhID0ge1xuXHRcdFx0Y2hhbm5lbDp0aGlzLl91c2VyX2RhdGEuY2hhbm5lbCwgLy/kuI3lj6/kuI3loatcblx0XHRcdHNka3ZlcjpcdHRoaXMuX3Nka3Zlcixcblx0XHRcdHNuOnRoaXMuX3VzZXJfZGF0YS5zbixcblx0XHRcdF9yYXRlOnRoaXMuX3VzZXJfZGF0YS5fcmF0ZSB8fCBcInhkXCIsXG5cdFx0XHRzdHlwZTp0aGlzLl91c2VyX2RhdGEuc3R5cGUgfHwgXCJtM3U4XCIsXG5cdFx0XHR2dHlwZTp0aGlzLl91c2VyX2RhdGEudnR5cGUgfHwgXCJcIixcblx0XHRcdGRlYnVnOnRoaXMuX3VzZXJfZGF0YS5kZWJ1ZyB8fCBmYWxzZSxcblx0XHRcdHNpZDp0aGlzLl91c2VyX2RhdGEuc2lkIHx8IFwiXCIsXG5cdFx0XHR0czpuZXcgRGF0ZSgpLmdldFRpbWUoKSxcblx0XHRcdF9qc29ucDp0aGlzLl91c2VyX2RhdGEuX2pzb25wIHx8IFwiX2pzb25wXCJcblx0XHR9XG5cdFx0XG5cdFx0Ly/or7fmsYJjZG7ov5Tlm57mkq3mlL7lnLDlnYBcblx0XHR2YXIgX2JlZm9yZV9yZXF1ZXN0XHQ9XHRuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRjb25uZWN0LmluaXQoJCh0aGlzKSxfZGF0YSxmdW5jdGlvbihkYXRhKXtcblx0XHRcdGlmKGRhdGEpe1xuXHRcdFx0XHRfdGhhdC5fYmFja191cmxcdD1cdGRhdGEuYmFjaztcblx0XHRcdFx0X3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZS51XHQ9XHRlbmNvZGVVUkkoZGF0YS5tYWluKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8v5aKe5Yqg5bGe5oCn6buY6K6k6K6+572uXG5cdFx0XHRcdHZhciBfd2lkdGggPSBfdGhhdC5fdXNlcl9kYXRhLndpZHRoIHx8IFwiMTAwJVwiO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR2YXIgX2hlaWdodCA9IF90aGF0Ll91c2VyX2RhdGEuaGVpZ2h0IHx8IFwiMTAwJVwiO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIF9jb250cm9scyA9IF90aGF0Ll91c2VyX2RhdGEuY29udHJvbHMgPyBcIiBjb250cm9sc1wiIDogXCJcIjtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBfYXV0b3BsYXkgPSBfdGhhdC5fdXNlcl9kYXRhLmF1dG9wbGF5ID8gXCIgYXV0b3BsYXlcIiA6IFwiXCI7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgX2xvb3AgPSBfdGhhdC5fdXNlcl9kYXRhLmxvb3AgPyAnbG9vcD1cImxvb3BcIicgOiBcIlwiO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHR2YXIgX3ByZWxvYWQgPSBfdGhhdC5fdXNlcl9kYXRhLnByZWxvYWQgPyBfdGhhdC5fdXNlcl9kYXRhLnByZWxvYWQgOiBcImF1dG9cIjtcblx0XHRcdFx0XHRcblx0XHRcdFx0dmFyIF9wb3N0ZXIgPSBfdGhhdC5fdXNlcl9kYXRhLnBvc3RlciB8fCBcIlwiO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly/liJvlu7p2aWRlbyDmoIfnrb5cblx0XHRcdFx0dmFyIF92aWRlbyA9ICc8dmlkZW8gJytfY29udHJvbHMrX2F1dG9wbGF5Kycgd2Via2l0LXBsYXlzaW5saW5lPVwid2Via2l0LXBsYXlzaW5saW5lXCIgeC13ZWJraXQtYWlycGxheT1cImFsbG93XCIgd2lkdGg9XCInK193aWR0aCsnXCIgaGVpZ2h0PVwiJytfaGVpZ2h0KydcIiAnK19sb29wKycgcHJlbG9hZD1cIicrX3ByZWxvYWQrJ1wiIHBvc3Rlcj1cIicrX3Bvc3RlcisnXCIgc3JjPVwiJytkYXRhLm1haW4rJ1wiID48L3ZpZGVvPic7XG5cdFx0XHRcdF90aGF0Ll9kb20uaHRtbChfdmlkZW8pO1xuXHRcdFx0XHRfdGhhdC5fdmlkZW8gPSBfdGhhdC5fZG9tLmZpbmQoXCJ2aWRlb1wiKVswXTtcblx0XHRcdFx0Ly/pkojlr7nmn5DkupvmiYvmnLrorrDlvZXmkq3mlL7kvY3nva7nmoTooYzkuLrvvIzlvLrliLblvZLpm7Zcblx0XHRcdFx0X3RoYXQuX3ZpZGVvLmR1cmF0aW9uXHQ9XHQwO1xuXHRcdFx0XHRfdGhhdC5hZGRfZGlzcGF0Y2hfZXZlbnQoKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8v6LCD5bqm5o6l5Y+j5omT54K5XG5cdFx0XHRcdHZhciBfYWZ0ZXJfcmVxdWVzdFx0PVx0bmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRcdHZhciBfcmVxdWVzdF90aW1lXHQ9XHRfYWZ0ZXJfcmVxdWVzdC1fYmVmb3JlX3JlcXVlc3Q7XG5cdFx0XHRcdF90aGF0LnVwbG9hZF9pbmZvX2FjdGlvbigwLF9yZXF1ZXN0X3RpbWUpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly/lvIDlp4vmiZPngrlcblx0XHRcdFx0X3RoYXQudXBsb2FkX2luZm9faW5pdCgpO1xuXHRcdFx0XHRfdGhhdC5fb25saW5lX3RpbWVyXHQ9XHRzZXRJbnRlcnZhbChmdW5jdGlvbigpe190aGF0LnVwbG9hZF9pbmZvX29ubGluZShfdGhhdC5fdXBsb2FkX2luZm9fdXJsLF90aGF0Ll91cGRhdGVfaW5mb19iYXNlX2RhdGUpfSw2MDAwMCk7XG5cdFx0XHRcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRhbGVydChcImNkbiDov5Tlm57pk77mjqXlpLHotKVcIik7XG5cdFx0XHRcdC8v6LCD5bqm5o6l5Y+j5omT54K5XG5cdFx0XHRcdHZhciBfYWZ0ZXJfcmVxdWVzdFx0PVx0bmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRcdHZhciBfcmVxdWVzdF90aW1lXHQ9XHRfYWZ0ZXJfcmVxdWVzdC1fYmVmb3JlX3JlcXVlc3Q7XG5cdFx0XHRcdF90aGF0LnVwbG9hZF9pbmZvX2FjdGlvbihfdGhhdC5kb20uZXJyb3IuY29kZSxfcmVxdWVzdF90aW1lKTtcblx0XHRcdH1cblx0XHRcdF90aGF0Ll9pc19maXJzdF9lcnJvclx0PVx0MDtcblx0XHR9KTtcblx0fVxuXHRcblx0Ly/lj5ZNM1U45Zyw5Z2A5pe25Y+R55Sf6ZSZ6K+v77yM55SoYmFjayB1cmwg6YeN5paw5Yid5aeL5YyWXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS51c2VfYmFja191cmxcdD1cdGZ1bmN0aW9uKCl7XG5cdFx0Ly8kKFwiLmxvZ1wiKS5hcHBlbmQoXCJ1c2UgYmFjayB1cmxcIitcIjxicj5cIik7XG5cdFx0dmFyIF90aGF0XHQ9XHR0aGlzO1xuXHRcdGNsZWFySW50ZXJ2YWwoX3RoYXQuX29ubGluZV90aW1lcik7XG5cdFx0aWYoX3RoYXQuX2JhY2tfdXJsLmxlbmd0aCl7XG5cdFx0XHRcblx0XHRcdGlmKCAkLnRyaW0oX3RoYXQuX2JhY2tfdXJsWzBdKSE9XCIgXCImJiQudHJpbShfdGhhdC5fYmFja191cmxbMF0pIT1cIlwiICl7XG5cdFx0XHRcdF90aGF0Ll92aWRlby5zcmNcdD1cdF90aGF0Ll9iYWNrX3VybFswXTtcblx0XHRcdFx0X3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZS51XHQ9XHRlbmNvZGVVUkkoX3RoYXQuX2JhY2tfdXJsWzBdKTtcblx0XHRcdFx0X3RoYXQuX2JhY2tfdXJsLnNwbGljZSgwLDEpO1xuXHRcdFx0XHRfdGhhdC5fYmFja191cmxfdGltZXJcdD1cdHNldEludGVydmFsKGZ1bmN0aW9uKCl7X3RoYXQudXBsb2FkX2luZm9fb25saW5lKF90aGF0Ll91cGxvYWRfaW5mb191cmwsX3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZSl9LDYwMDAwKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRfdGhhdC5fYmFja191cmwuc3BsaWNlKDAsMSk7XG5cdFx0XHRcdF90aGF0LnVzZV9iYWNrX3VybCgpO1xuXHRcdFx0fVxuXHRcdFx0Ly8kKFwiLmxvZ1wiKS5hcHBlbmQoXCJiYWNrVXJsRXJyb3JcIitcIjxicj5cIik7XG5cdFx0XHQkKHRoaXMpLnRyaWdnZXIoXCJiYWNrVXJsRXJyb3JcIik7XG5cdFx0fWVsc2V7XG5cdFx0XHRjbGVhckludGVydmFsKF90aGF0Ll9iYWNrX3VybF90aW1lcik7XG5cdFx0XHRfdGhhdC5fbWFya190aW1lXHQ9XHQwO1xuXHRcdFx0Ly8kKFwiLmxvZ1wiKS5hcHBlbmQoXCJ1cmxFcnJvclwiK1wiPGJyPlwiKTtcblx0XHRcdCQodGhpcykudHJpZ2dlcihcInVybEVycm9yXCIpO1xuXHRcdH1cblx0XHRcblx0fVxuXHRcblx0Ly/mo4Dmn6XmtY/op4jlmajmmK/lkKbmlK/mjIF2aWRlb+agh+etvlxuXHRINV92aWRlby5wcm90b3R5cGUuY2hlY2tfdmlkZW9cdD1cdGZ1bmN0aW9uKCl7XG5cdFxuXHRcdHZhciBfbmV3X3ZpZGVvXHQ9XHRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidmlkZW9cIik7XG5cdFx0aWYgKCEhX25ld192aWRlby5jYW5QbGF5VHlwZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fWVsc2V7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdFxuXHQvL+ivt+axguWFqOWxjyDvvIhDaHJvbWUgMTUgLyBGaXJlZm94IE5pZ2h0bHkgLyBTYWZhcmkgNS4x77yJXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5yZXF1ZXN0X2Z1bGxfc2NyZWVuXHQ9XHRmdW5jdGlvbigpe1xuXHRcdFxuXHRcdGlmKHRoaXMuX3ZpZGVvLnJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgXHRcdHRoaXMuX3ZpZGVvLnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgXHRcdCQodGhpcykudHJpZ2dlcihcInJlcXVlc3RGdWxsU2NyZWVuXCIpO1xuICBcdFx0fSBlbHNlIGlmKHRoaXMuX3ZpZGVvLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgXHRcdHRoaXMuX3ZpZGVvLm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgXHRcdCQodGhpcykudHJpZ2dlcihcInJlcXVlc3RGdWxsU2NyZWVuXCIpO1xuICBcdFx0fSBlbHNlIGlmKHRoaXMuX3ZpZGVvLndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICBcdFx0XHR0aGlzLl92aWRlby53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgXHRcdFx0JCh0aGlzKS50cmlnZ2VyKFwicmVxdWVzdEZ1bGxTY3JlZW5cIik7XG4gIFx0XHR9XG5cdH1cblx0XG5cdC8v5Y+W5raI5YWo5bGPIO+8iENocm9tZSAxNSAvIEZpcmVmb3ggTmlnaHRseSAvIFNhZmFyaSA1LjHvvIlcblx0SDVfdmlkZW8ucHJvdG90eXBlLmNhbmNlbF9mdWxsX3NjcmVlblx0PVx0ZnVuY3Rpb24oKXtcblx0XHRcblx0XHRpZih0aGlzLl92aWRlby5leGl0RnVsbHNjcmVlbikge1xuICAgIFx0XHR0aGlzLl92aWRlby5leGl0RnVsbHNjcmVlbigpO1xuICAgIFx0XHQkKHRoaXMpLnRyaWdnZXIoXCJjYW5jZWxGdWxsU2NyZWVuXCIpO1xuICBcdFx0fSBlbHNlIGlmKHRoaXMuX3ZpZGVvLm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBcdFx0dGhpcy5fdmlkZW8ubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuICAgIFx0XHQkKHRoaXMpLnRyaWdnZXIoXCJjYW5jZWxGdWxsU2NyZWVuXCIpO1xuICBcdFx0fSBlbHNlIGlmKHRoaXMuX3ZpZGVvLndlYmtpdENhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgIFx0XHRcdHRoaXMuX3ZpZGVvLndlYmtpdENhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgIFx0XHRcdCQodGhpcykudHJpZ2dlcihcImNhbmNlbEZ1bGxTY3JlZW5cIik7XG4gIFx0XHR9XG5cdH1cblx0XG5cdC8v5aKe5Yqg5LqL5Lu255uR5ZCsXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5hZGRfZGlzcGF0Y2hfZXZlbnRcdD1cdGZ1bmN0aW9uKCl7XG5cdFxuXHRcdHZhciBfdGhhdCA9XHR0aGlzO1xuXHRcdF90aGF0Ll9ldmVudFx0PVx0bmV3XHR2aWRlb19ldmVudC5pbml0KF90aGF0KTtcblx0XHRfdGhhdC5fZXZlbnQuYWRkX2V2ZW50KCk7XG5cdH1cblx0XG5cdC8v5Y676Zmk5LqL5Lu255uR5ZCsXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5yZW1vdmVfZGlzcGF0Y2hfZXZlbnRcdD1cdGZ1bmN0aW9uKCl7XG5cdFxuXHRcdHZhciBfdGhhdCA9XHR0aGlzO1xuXHRcdF90aGF0Ll9ldmVudC5yZW1vdmVfZXZlbnQoKTtcblx0XHRfdGhhdC5fZXZlbnRcdD1cdG51bGw7XG5cdH1cblx0XG5cdC8qKuajgOa1i+aCqOeahOa1j+iniOWZqOaYr+WQpuiDveaSreaUvuS4jeWQjOexu+Wei+eahOinhumikVxuXHQqXHTluLjnlKjlgLzvvJpcblx0Klx0dmlkZW8vb2dnXG5cdCpcdHZpZGVvL21wNFxuXHQqXHR2aWRlby93ZWJtXG5cdCpcdGF1ZGlvL21wZWdcblx0Klx0YXVkaW8vb2dnXG5cdCpcdGF1ZGlvL21wNFxuXHQqXHTluLjnlKjlgLzvvIzljIXmi6znvJbop6PnoIHlmajvvJpcblx0Klx0dmlkZW8vb2dnOyBjb2RlY3M9XCJ0aGVvcmEsIHZvcmJpc1wiXG5cdCpcdHZpZGVvL21wNDsgY29kZWNzPVwiYXZjMS40RDQwMUUsIG1wNGEuNDAuMlwiXG5cdCpcdHZpZGVvL3dlYm07IGNvZGVjcz1cInZwOC4wLCB2b3JiaXNcIlxuXHQqXHRhdWRpby9vZ2c7IGNvZGVjcz1cInZvcmJpc1wiXG5cdCpcdGF1ZGlvL21wNDsgY29kZWNzPVwibXA0YS40MC41XCJcblx0Klx05rOo6YeK77ya5aaC5p6c5YyF5ZCr57yW6Kej56CB5Zmo77yM5YiZ5Y+q6IO96L+U5ZueIFwicHJvYmFibHlcIuOAglxuXHQqXG5cdCpcdOihqOekuuaUr+aMgeeahOe6p+WIq+OAguWPr+iDveeahOWAvO+8mlxuXHQqXHRcInByb2JhYmx5XCIgLSDmnIDmnInlj6/og73mlK/mjIFcblx0Klx0XCJtYXliZVwiIC0g5Y+v6IO95pSv5oyBXG5cdCpcdFwiXCIgLSDvvIjnqbrlrZfnrKbkuLLvvInkuI3mlK/mjIFcblx0KiovXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5jYW5QbGF5VHlwZSA9IGZ1bmN0aW9uKF90eXBlKXtcblx0XHRyZXR1cm5cdHRoaXMuX3ZpZGVvLmNhblBsYXlUeXBlKF90eXBlKTtcblx0fVxuXHRcblx0SDVfdmlkZW8ucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLl92aWRlby5wYXVzZSgpO1xuXHR9XG5cdFxuXHRINV92aWRlby5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5fdmlkZW8ucGxheSgpO1xuXHR9XG5cdFxuXHQvL+WMheijheS4gOS4qnNlZWvmlrnms5Vcblx0SDVfdmlkZW8ucHJvdG90eXBlLnNlZWsgPSBmdW5jdGlvbihfc2Vla190aW1lKXtcblx0XHR0aGlzLl92aWRlby5jdXJyZW50VGltZVx0PVx0X3NlZWtfdGltZTtcblx0fVxuXHRcblx0Ly/mlrnms5Xph43mlrDliqDovb3pn7PpopEv6KeG6aKR5YWD57Sg44CC55So5LqO5Zyo5pu05pS55p2l5rqQ5oiW5YW25LuW6K6+572u5ZCO5a+56Z+z6aKRL+inhumikeWFg+e0oOi/m+ihjOabtOaWsOOAglxuXHRINV92aWRlby5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5fdmlkZW8ubG9hZCgpO1xuXHR9XG5cdFxuXHQvL+W/q+i/m1xuXHRINV92aWRlby5wcm90b3R5cGUuYWRkX2N1cnJlbnRfdGltZVx0PVx0ZnVuY3Rpb24oX251bSl7XG5cdFx0dGhpcy5fdmlkZW8uY3VycmVudFRpbWUrPV9udW07XG5cdH1cblx0XG5cdC8v5b+r6YCAXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5yZWR1Y2VfY3VycmVudF90aW1lXHQ9XHRmdW5jdGlvbihfbnVtKXtcblx0XHR0aGlzLl92aWRlby5jdXJyZW50VGltZSs9X251bTtcblx0fVxuXHRcblx0Ly/mkq3mlL7pgJ/njocg5aKe5YqgXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5hZGRfcGxheWJhY2tfcmF0ZVx0PVx0ZnVuY3Rpb24oX251bSl7XG5cdFx0dGhpcy5fdmlkZW8ucGxheWJhY2tSYXRlKz1fbnVtO1xuXHR9XG5cdFxuXHQvL+aSreaUvumAn+eOhyDlh4/lsJFcblx0SDVfdmlkZW8ucHJvdG90eXBlLnJlZHVjZV9wbGF5YmFja19yYXRlXHQ9XHRmdW5jdGlvbihfbnVtKXtcblx0XHR0aGlzLl92aWRlby5wbGF5YmFja1JhdGUtPV9udW07XG5cdH1cblx0XG5cdC8v5Yqg6Z+z6YePXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5hZGRfdm9sdW1lXHQ9XHRmdW5jdGlvbigpe1xuXHRcdHRoaXMuX3ZpZGVvLnZvbHVtZSs9MC4xO1xuXHR9XG5cdFxuXHQvL+WHj+mfs+mHj1xuXHRINV92aWRlby5wcm90b3R5cGUucmVkdWNlX3ZvbHVtZVx0PVx0ZnVuY3Rpb24oKXtcblx0XHR0aGlzLl92aWRlby52b2x1bWUtPTAuMTtcblx0fVxuXHRcblx0Ly/pnZnpn7Mg5biD5bCUXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS5tdXRlZFx0PVx0ZnVuY3Rpb24oX2Jvb2xlYW4pe1xuXHRcdHRoaXMuX3ZpZGVvLm11dGVkPV9ib29sZWFuO1xuXHR9XG5cdFxuXHQvL+aUueWPmOinhumikea6kFxuXHRINV92aWRlby5wcm90b3R5cGUuY2hhbmdlX3NuXHQ9XHRmdW5jdGlvbihfbmV3X3NuKXtcblx0XHRcblx0XHR0aGlzLl91c2VyX2RhdGEuc25cdD1cdF9uZXdfc247XG5cdFx0Ly/np7vpmaTnm5HlkKzkuovku7Zcblx0XHR0aGlzLnJlbW92ZV9kaXNwYXRjaF9ldmVudCgpO1xuXHRcdGNsZWFySW50ZXJ2YWwodGhpcy5fb25saW5lX3RpbWVyKTtcblx0XHR0aGlzLl9pc19maXJzdF9lcnJvclx0PVx0MTtcblx0XHR0aGlzLmluaXQoKTtcblx0fVxuXHRcblx0Ly/lj5blvpd2aWRlb+WvueixoeWxnuaAp1xuXHRINV92aWRlby5wcm90b3R5cGUuZ2V0X2F0dHJpYnV0ZXMgPSBmdW5jdGlvbigpe1xuXHRcdFxuXHRcdHZhclx0X3BhcmFtXzFcdD1cdGFyZ3VtZW50c1swXTtcblx0XHR2YXJcdF9wYXJhbV8yXHQ9XHRhcmd1bWVudHNbMV0gfHxcdDA7XG5cdFx0XG5cdFx0c3dpdGNoXHQoX3BhcmFtXzEpe1xuXHRcdFx0Y2FzZVx0XCJjdXJyZW50X3RpbWVcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5jdXJyZW50VGltZSh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiZHVyYXRpb25cIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5kdXJhdGlvbih0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwicGF1c2VkXCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMucGF1c2VkKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJkZWZhdWx0X3BsYXliYWNrX3JhdGVcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5kZWZhdWx0UGxheWJhY2tSYXRlKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJwbGF5YmFja19yYXRlXCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMucGxheWJhY2tSYXRlKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJwbGF5ZWRfc3RhcnRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5wbGF5ZWRfc3RhcnQodGhpcy5fdmlkZW8sX3BhcmFtXzIpO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcInBsYXllZF9lbmRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5wbGF5ZWRfZW5kKHRoaXMuX3ZpZGVvLF9wYXJhbV8yKTtcdGJyZWFrOyBcblx0XHRcdGNhc2VcdFwic2Vla2FibGVfc3RhcnRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5zZWVrYWJsZV9zdGFydCh0aGlzLl92aWRlbyxfcGFyYW1fMik7XHRicmVhazsgXG5cdFx0XHRjYXNlXHRcInNlZWthYmxlX2VuZFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLnNlZWthYmxlX2VuZCh0aGlzLl92aWRlbyxfcGFyYW1fMik7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiZW5kZWRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5lbmRlZCh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiYXV0b19wbGF5XCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMuYXV0b1BsYXkodGhpcy5fdmlkZW8pO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcImxvb3BcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5sb29wKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJidWZmZXJlZF9zdGFydFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLmJ1ZmZlcmVkX3N0YXJ0KHRoaXMuX3ZpZGVvLF9wYXJhbV8yKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJidWZmZXJlZF9lbmRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5idWZmZXJlZF9lbmQodGhpcy5fdmlkZW8sX3BhcmFtXzIpO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcImF1ZGlvVHJhY2tzX2xlbmd0aFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLmF1ZGlvVHJhY2tzX2xlbmd0aCh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiYXVkaW9UcmFja3NfZ2V0X29iamVjdF9ieV9pZFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLmF1ZGlvVHJhY2tzX2dldF9vYmplY3RfYnlfaWQodGhpcy5fdmlkZW8sX3BhcmFtXzIpO1xuXHRcdFx0Y2FzZVx0XCJhdWRpb1RyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4XCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMuYXVkaW9UcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleCh0aGlzLl92aWRlbyxfcGFyYW1fMik7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiY29udHJvbGxlclwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLmNvbnRyb2xsZXIodGhpcy5fdmlkZW8pO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcImN1cnJlbnRfc3JjXCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMuY3VycmVudFNyYyh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiZGVmYXVsdF9tdXRlZFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLmRlZmF1bHRNdXRlZCh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwiZXJyb3JcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5lcnJvcih0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwibWVkaWFfZ3JvdXBcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy5tZWRpYUdyb3VwKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJtdXRlZFwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLm11dGVkKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJuZXR3b3JrX3N0YXRlXCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMubmV0d29ya1N0YXRlKHRoaXMuX3ZpZGVvKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJyZWFkeV9zdGF0ZVwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLnJlYWR5U3RhdGUodGhpcy5fdmlkZW8pO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcInZvbHVtZVwiXHQ6XHRyZXR1cm5cdHZpZGVvX2dldF9hdHRyaWJ1dGVzLnZvbHVtZSh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwidGV4dFRyYWNrc19sZW5ndGhcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy50ZXh0VHJhY2tzX2xlbmd0aCh0aGlzLl92aWRlbyk7XHRicmVhaztcblx0XHRcdGNhc2VcdFwidGV4dFRyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4XCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMudGV4dFRyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4KHRoaXMuX3ZpZGVvLF9wYXJhbV8yKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJ0ZXh0VHJhY2tzX2dldF9vYmplY3RfYnlfaWRcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy50ZXh0VHJhY2tzX2dldF9vYmplY3RfYnlfaWQodGhpcy5fdmlkZW8sX3BhcmFtXzIpO1x0YnJlYWs7XG5cdFx0XHRjYXNlXHRcInZpZGVvVHJhY2tzX2dldF9vYmplY3RfYnlfaW5kZXhcIlx0Olx0cmV0dXJuXHR2aWRlb19nZXRfYXR0cmlidXRlcy52aWRlb1RyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4KHRoaXMuX3ZpZGVvLF9wYXJhbV8yKTtcdGJyZWFrO1xuXHRcdFx0Y2FzZVx0XCJ2aWRlb1RyYWNrc19nZXRfb2JqZWN0X2J5X2lkXCJcdDpcdHJldHVyblx0dmlkZW9fZ2V0X2F0dHJpYnV0ZXMudmlkZW9UcmFja3NfZ2V0X29iamVjdF9ieV9pZCh0aGlzLl92aWRlbyxfcGFyYW1fMik7XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6YnJlYWs7XG5cdFx0fVxuXHR9XG5cdFxuXHQvL+W8gOWni+S4iuaKpeS/oeaBr1xuXHQvL+S4iuS8oOWfuuacrOS/oeaBr1xuXHRINV92aWRlby5wcm90b3R5cGUudXBsb2FkX2luZm9faW5pdFx0PVx0ZnVuY3Rpb24oKXtcblx0XHRcblx0XHR2YXIgX3RoYXQgPSB0aGlzO1xuXHRcdC8v6L+Z6YeM6ZyA6KaB5ZCO56uv6L+U5Zue5o6l5Y+j6YeM6Z2i5YyF5ZCr6ZSZ6K+v5L+h5oGvXG5cdFx0YWpheFRvb2xzLmFqYXhHZXQoX3RoYXQuX3VwbG9hZF9pbmZvX3VybCxfdGhhdC5fdXBkYXRlX2luZm9fYmFzZV9kYXRlLGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0aWYoZGF0YSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi6LCD5bqm5o6l5Y+j6K+35rGC5oiQ5YqfXCIpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi6K+35rGC6LCD5bqm5o6l5Y+j6K+35rGC5aSx6LSlXCIpO1xuXHRcdFx0fTtcblx0XHR9KTtcblx0XG5cdH1cblx0XG5cdC8v6K+35rGC6LCD5bqm5o6l5Y+jXG5cdEg1X3ZpZGVvLnByb3RvdHlwZS51cGxvYWRfaW5mb19hY3Rpb25cdD1cdGZ1bmN0aW9uKF9udW0sX3RpbWVyKXtcblxuXHRcdHZhciBfdGhhdCA9IHRoaXMsXG5cdFx0XHRfZGF0YVx0PVx0Y2xvbmVfZGF0YS5jbG9uZV9vYmooX3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZSk7XG5cdFx0XHRfZGF0YS5zdCA9IDI7XG5cdFx0XHRfZGF0YS5ydCA9IF90aW1lcjtcblx0XHRcdF9kYXRhLnR5ID0gXCJhY3Rpb25cIjtcblx0XHRcdF9kYXRhLmVyID0gX251bTtcblx0XHRcdF9kYXRhLnRtXHQ9XHRuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdF9kYXRhLnJcdD1cdE1hdGgucmFuZG9tKCk7XG5cdFx0XHRzd2l0Y2ggKF9udW0pe1xuXHRcdFx0XHRjYXNlIDA6XHRfZGF0YS5lbVx0PVx0XCLosIPluqbmiJDlip9cIjticmVhaztcblx0XHRcdFx0Y2FzZSAxOlx0X2RhdGEuZW1cdD1cdFwi55So5oi357uI5q2iXCI7YnJlYWs7XG5cdFx0XHRcdGNhc2UgMjpcdF9kYXRhLmVtXHQ9XHRcIue9kee7nOmUmeivr1wiO2JyZWFrO1xuXHRcdFx0XHRjYXNlIDM6XHRfZGF0YS5lbVx0PVx0XCLop6PnoIHplJnor69cIjticmVhaztcblx0XHRcdFx0Y2FzZSA0Olx0X2RhdGEuZW1cdD1cdFwiVVJM5peg5pWIXCI7YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRhamF4VG9vbHMuYWpheEdldChfdGhhdC5fdXBsb2FkX2luZm9fdXJsLF9kYXRhLGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0aWYoZGF0YSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi6LCD5bqm5o6l5Y+j5LiK5oql5oiQ5YqfXCIpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi6LCD5bqm5o6l5Y+j5LiK5oql5aSx6LSlXCIpO1xuXHRcdFx0fTtcblx0XHR9KTtcblx0fVxuXHRcblx0Ly/or7fmsYJvbmxpbmXmjqXlj6Ncblx0SDVfdmlkZW8ucHJvdG90eXBlLnVwbG9hZF9pbmZvX29ubGluZVx0PVx0ZnVuY3Rpb24oX3VybCxfZCl7XG5cdFxuXHRcdHZhclx0X2RhdGFcdD1cdGNsb25lX2RhdGEuY2xvbmVfb2JqKF9kKTtcblx0XHRcdF9kYXRhLnR5XHQ9XHRcIm9ubGluZVwiO1xuXHRcdFx0X2RhdGEudG1cdD1cdG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0X2RhdGEuclx0PVx0TWF0aC5yYW5kb20oKTtcblx0XHRhamF4VG9vbHMuYWpheEdldChfdXJsLF9kYXRhLGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0aWYoZGF0YSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi5Zyo57q/5o6l5Y+j5LiK5oql5oiQ5YqfXCIpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi5Zyo57q/5o6l5Y+j5LiK5oql5aSx6LSlXCIpO1xuXHRcdFx0fTtcblx0XHR9KTtcblx0fVxuXHRcblx0Ly/or7fmsYLmkq3mlL7ov4fnqIvkuK3nmoTplJnor6/mjqXlj6Ncblx0SDVfdmlkZW8ucHJvdG90eXBlLnVwbG9hZF9pbmZvX2V4Y2VwdGlvblx0PVx0ZnVuY3Rpb24oX2V4Y2VwdGlvbil7XG5cdFxuXHRcdHZhciBfdGhhdCA9IHRoaXMsXG5cdFx0XHRfZGF0YVx0PVx0Y2xvbmVfZGF0YS5jbG9uZV9vYmooX3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZSk7XG5cdFx0XHRfZGF0YS5leGNlcHRpb24gPSBfZXhjZXB0aW9uO1xuXHRcdFx0X2RhdGEuc3QgPSAyO1xuXHRcdFx0X2RhdGEudHkgPSBcImFjdGlvblwiO1xuXHRcdFx0X2RhdGEudG1cdD1cdG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0X2RhdGEuclx0PVx0TWF0aC5yYW5kb20oKTtcblx0XHRcdF9kYXRhLmVyID0gX2V4Y2VwdGlvbjtcblx0XHRcdHN3aXRjaCAoX2V4Y2VwdGlvbil7XG5cdFx0XHRcdGNhc2UgMTpcdF9kYXRhLmVtXHQ9XHRcIuesrOS4gOasoeWKoOi9veaXtueUqOaIt+e7iOatolwiO2JyZWFrO1xuXHRcdFx0XHRjYXNlIDI6XHRfZGF0YS5lbVx0PVx0XCLnrKzkuIDmrKHliqDovb3ml7bnvZHnu5zplJnor69cIjticmVhaztcblx0XHRcdFx0Y2FzZSAzOlx0X2RhdGEuZW1cdD1cdFwi56ys5LiA5qyh5Yqg6L295pe26Kej56CB6ZSZ6K+vXCI7YnJlYWs7XG5cdFx0XHRcdGNhc2UgNDpcdF9kYXRhLmVtXHQ9XHRcIuesrOS4gOasoeWKoOi9veaXtlVSTOaXoOaViFwiO2JyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OmJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0YWpheFRvb2xzLmFqYXhHZXQoX3RoYXQuX3VwbG9hZF9pbmZvX3VybCxfZGF0YSxmdW5jdGlvbihkYXRhKXtcblx0XHRcdGlmKGRhdGEpe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIuaSreaUvui/h+eoi+S4reeahOmUmeivr+aOpeWPo+S4iuaKpeaIkOWKn1wiKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIuaSreaUvui/h+eoi+S4reeahOmUmeivr+aOpeWPo+S4iuaKpeWksei0pVwiKTtcblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cblx0XG5cdC8v57yT5Yay5Y6f5ZugIOe8k+WGsuaXtumXtFxuXHRINV92aWRlby5wcm90b3R5cGUudXBsb2FkX2luZm9fYnVmZmVyXHQ9XHRmdW5jdGlvbihfYnIsX3RpbWVyKXtcblx0XHRcblx0XHR2YXIgX3RoYXQgPSB0aGlzLFxuXHRcdFx0X2RhdGFcdD1cdGNsb25lX2RhdGEuY2xvbmVfb2JqKF90aGF0Ll91cGRhdGVfaW5mb19iYXNlX2RhdGUpO1xuXHRcdFx0X2RhdGEuYnIgPSBfYnI7XG5cdFx0XHRfZGF0YS50eSA9IFwiYnVmZmVyXCI7XG5cdFx0XHRfZGF0YS5iYyA9IF90aGF0Ll93YWl0aW5nX251bTtcblx0XHRcdF9kYXRhLnBvID0gX3RoYXQuX3ZpZGVvLmN1cnJlbnRUaW1lO1xuXHRcdFx0X2RhdGEuYnRcdD1cdF90aW1lcjtcblx0XHRcdF9kYXRhLnRtXHQ9XHRuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdF9kYXRhLnJcdD1cdE1hdGgucmFuZG9tKCk7XG5cdFx0XHRzd2l0Y2ggKF9icil7XG5cdFx0XHRcdGNhc2VcdDE6IF9kYXRhLmVtXHQ9XHRcIuesrOS4gOasoeWKoOi9veW8lei1t+eahOe8k+WGsue7k+adn1wiO2JyZWFrO1xuXHRcdFx0XHRjYXNlXHQyOiBfZGF0YS5lbVx0PVx0XCLlm6DkuLpzZWVr5byV6LW35b6X57yT5Yay5byA5aeLXCI7YnJlYWs7XG5cdFx0XHRcdGNhc2VcdDQ6IF9kYXRhLmVtXHQ9XHRcIuWboOS4uuaSreaUvui/h+eoi+S4reWNoeW8lei1t+eahOe8k+WGsuW8gOWni1wiO2JyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OmJyZWFrO1xuXHRcdFx0fTtcblx0XHRhamF4VG9vbHMuYWpheEdldChfdGhhdC5fdXBsb2FkX2luZm9fdXJsLF9kYXRhLGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0aWYoZGF0YSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi57yT5Yay5Y6f5Zug5ZKM5pe26Ze05o6l5Y+j5LiK5oql5oiQ5YqfXCIpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi57yT5Yay5Y6f5Zug5ZKM5pe26Ze05o6l5Y+j5LiK5oql5aSx6LSlXCIpO1xuXHRcdFx0fTtcblx0XHR9KTtcblx0fVxuXHRcblx0Ly/liqDkuIrnvJPlhrLkuIDlhbHoirHljrvnmoTop4LnnIvlvbHniYfnmoTml7bpl7Rcblx0SDVfdmlkZW8ucHJvdG90eXBlLnVwbG9hZF9pbmZvX3N1bW1hcnlcdD1cdGZ1bmN0aW9uKF9vdCxfcHQpe1xuXHRcdFxuXHRcdHZhciBfdGhhdCA9IHRoaXMsXG5cdFx0XHRfZGF0YVx0PVx0Y2xvbmVfZGF0YS5jbG9uZV9vYmooX3RoYXQuX3VwZGF0ZV9pbmZvX2Jhc2VfZGF0ZSk7XG5cdFx0XHRfZGF0YS5vdCA9IF9vdDtcblx0XHRcdF9kYXRhLmJjID0gX3RoYXQuX3dhaXRpbmdfbnVtO1xuXHRcdFx0X2RhdGEucHQgPSBfcHQ7XG5cdFx0XHRfZGF0YS50eSA9IFwic3VtbWFyeVwiO1xuXHRcdFx0X2RhdGEudG1cdD1cdG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0X2RhdGEuclx0PVx0TWF0aC5yYW5kb20oKTtcblx0XHRcdFxuXHRcdGFqYXhUb29scy5hamF4R2V0KF90aGF0Ll91cGxvYWRfaW5mb191cmwsX2RhdGEsZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHRpZihkYXRhKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCLliqDkuIrnvJPlhrLkuIDlhbHoirHljrvnmoTop4LnnIvlvbHniYfnmoTml7bpl7TmjqXlj6PkuIrmiqXmiJDlip9cIik7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCLliqDkuIrnvJPlhrLkuIDlhbHoirHljrvnmoTop4LnnIvlvbHniYfnmoTml7bpl7TmjqXlj6PkuIrmiqXlpLHotKVcIik7XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHR9XG5cdFxufShqUXVlcnksd2luZG93KSk7IiwiLyoqXG5cdCpcdGFkZCBzZGsgZXZlbnRcblx0Klx0bGlqaW5nYW5cblx0Klx0cXE6MjkwNzExODUxXG5cdCpcdDIwMTUuMDguMDRcblx0KiovXG5cdFxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKXtcblxuXHR2YXIgaW5pdFx0PVx0ZnVuY3Rpb24oX3ZpZGVvX29iail7XG5cdFx0dmFyXHR2aWRlb19za2luXHQ9XHRyZXF1aXJlKCcuL1ZpZGVvX3NraW4nKTtcblx0XHR2YXIgX3RoYXRcdD1cdHRoaXM7XG5cdFx0X3RoYXQuX29ialx0PVx0X3ZpZGVvX29iajtcblx0XHRfdGhhdC5fZG9tXHQ9XHRfdmlkZW9fb2JqLl92aWRlbztcblx0XHRcblx0XHRfdGhhdC5hZGRfZXZlbnRcdD1cdGZ1bmN0aW9uKCl7XG5cdFx0XHRfdGhhdC5fZG9tLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2Fkc3RhcnRcIixsb2Fkc3RhcnQsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwicHJvZ3Jlc3NcIixwcm9ncmVzcyxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLmFkZEV2ZW50TGlzdGVuZXIoXCJzdXNwZW5kXCIsc3VzcGVuZCxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLGFib3J0LGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsZXJyb3IsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwic3RhbGxlZFwiLHN0YWxsZWQsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwicGxheVwiLHBsYXksZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwicGF1c2VcIixwYXVzZSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRtZXRhZGF0YVwiLGxvYWRlZG1ldGFkYXRhLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZGRhdGFcIixsb2FkZWRkYXRhLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcIndhaXRpbmdcIix3YWl0aW5nLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcInBsYXlpbmdcIixwbGF5aW5nLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXlcIixjYW5wbGF5LGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXl0aHJvdWdoXCIsY2FucGxheXRocm91Z2gsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwic2Vla2luZ1wiLHNlZWtpbmcsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwic2Vla2VkXCIsc2Vla2VkLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIix0aW1ldXBkYXRlLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20uYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsZW5kZWQsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwicmF0ZWNoYW5nZVwiLHJhdGVjaGFuZ2UsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5hZGRFdmVudExpc3RlbmVyKFwiZHVyYXRpb25jaGFuZ2VcIixkdXJhdGlvbmNoYW5nZSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLmFkZEV2ZW50TGlzdGVuZXIoXCJ2b2x1bWVjaGFuZ2VcIix2b2x1bWVjaGFuZ2UsZmFsc2UpO1xuXHRcdFx0XG5cdFx0XHQkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi5qc19oNV9zZGtfcGxheV9kb21cIixcInRvdWNoZW5kXCIsZnVuY3Rpb24oKXtcblx0XHRcdFx0X3RoYXQuX2RvbS5wbGF5KCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0XG5cdFx0X3RoYXQucmVtb3ZlX2V2ZW50XHQ9XHRmdW5jdGlvbigpe1xuXHRcdFx0X3RoYXQuX2RvbS5yZW1vdmVFdmVudExpc3RlbmVyKFwibG9hZHN0YXJ0XCIsbG9hZHN0YXJ0LGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInByb2dyZXNzXCIscHJvZ3Jlc3MsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5yZW1vdmVFdmVudExpc3RlbmVyKFwic3VzcGVuZFwiLHN1c3BlbmQsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIixhYm9ydCxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLGVycm9yLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInN0YWxsZWRcIixzdGFsbGVkLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBsYXlcIixwbGF5LGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBhdXNlXCIscGF1c2UsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5yZW1vdmVFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIixsb2FkZWRtZXRhZGF0YSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJsb2FkZWRkYXRhXCIsbG9hZGVkZGF0YSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ3YWl0aW5nXCIsd2FpdGluZyxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwbGF5aW5nXCIscGxheWluZyxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjYW5wbGF5XCIsY2FucGxheSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjYW5wbGF5dGhyb3VnaFwiLGNhbnBsYXl0aHJvdWdoLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNlZWtpbmdcIixzZWVraW5nLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNlZWtlZFwiLHNlZWtlZCxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsdGltZXVwZGF0ZSxmYWxzZSk7XG5cdFx0XHRfdGhhdC5fZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLGVuZGVkLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJhdGVjaGFuZ2VcIixyYXRlY2hhbmdlLGZhbHNlKTtcblx0XHRcdF90aGF0Ll9kb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImR1cmF0aW9uY2hhbmdlXCIsZHVyYXRpb25jaGFuZ2UsZmFsc2UpO1xuXHRcdFx0X3RoYXQuX2RvbS5yZW1vdmVFdmVudExpc3RlbmVyKFwidm9sdW1lY2hhbmdlXCIsdm9sdW1lY2hhbmdlLGZhbHNlKTtcblx0XHRcdFxuXHRcdFx0JChcIi5qc19oNV9zZGtfcGxheV9kb21cIikudW5iaW5kKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5a6i5oi356uv5byA5aeL6K+35rGC5pWw5o2uXG5cdFx0ZnVuY3Rpb25cdGxvYWRzdGFydCgpe1xuXHRcdFx0JChfdGhhdC5fb2JqKS50cmlnZ2VyKFwibG9hZHN0YXJ0XCIpO1xuXHRcdFx0aWYoX3RoYXQuX29iai5fc2tpbil7XG5cdFx0XHRcdHZpZGVvX3NraW4uaGlkZV93YWl0aW5nKF90aGF0Ll9kb20pO1x0XG5cdFx0XHRcdHZpZGVvX3NraW4uc2hvd19wbGF5KF90aGF0Ll9kb20pO1x0XG5cdFx0XHR9XG5cdFx0XHQvL+S7juS4i+i9vei1hOa6kOW8gOWni+Wwseeul+WNoe+8jOeUqOadpeeul++8jOavj+asoeS4i+i9vemcgOimgeWkmumVv+aXtumXtFxuXHRcdFx0X3RoYXQuX29iai5faXNfd2FpdGluZ1x0PVx0MTtcblx0XHRcdF90aGF0Ll9vYmouX3dhaXRpbmdfc3RhcnRfdGltZVx0PVx0bmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5a6i5oi356uv5q2j5Zyo6K+35rGC5pWw5o2uXG5cdFx0ZnVuY3Rpb25cdHByb2dyZXNzKCl7XG5cdFx0XG5cdFx0XHQkKF90aGF0Ll9vYmopLnRyaWdnZXIoXCJwcm9ncmVzc1wiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly/lu7bov5/kuIvovb0g77yI5LiL6L295a6M5oiQ5oiW5oyJ5LqG5pqC5YGc5oyJ6ZKu6YO95Y+v6IO96Kem5Y+R77yJXG5cdFx0ZnVuY3Rpb25cdHN1c3BlbmQoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInN1c3BlbmRcIik7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5a6i5oi356uv5Li75Yqo57uI5q2i5LiL6L2977yI5LiN5piv5Zug5Li66ZSZ6K+v5byV6LW3LCDmr5TlpoLor7TnjrDlnKjlnKjmkq3mlL7kuK3vvIzogIzkuJTov5jmsqHlrozlhajkuIvovb3lrozvvIzkvaDngrnkuobph43mlrDmkq3mlL7vvIlcblx0XHRmdW5jdGlvblx0YWJvcnQoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcImFib3J0XCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL+ivt+axguaVsOaNruaXtumBh+WIsOmUmeivr1xuXHRcdC8vMS7nlKjmiLfnu4jmraIgXG5cdFx0Ly8yLue9kee7nOmUmeivryBcblx0XHQvLzMu6Kej56CB6ZSZ6K+vIFxuXHRcdC8vNC5VUkzml6DmlYggXG5cdFx0ZnVuY3Rpb25cdGVycm9yKGUpe1xuXHRcdFxuXHRcdFx0JChfdGhhdC5fb2JqKS50cmlnZ2VyKFwiZXJyb3JcIik7XG5cdFx0XHRpZighX3RoYXQuX29iai5faXNfZmlyc3RfZXJyb3Ipe1xuXHRcdFx0XHRfdGhhdC5fb2JqLnVwbG9hZF9pbmZvX2V4Y2VwdGlvbihfdGhhdC5fZG9tLmVycm9yLmNvZGUpO1xuXHRcdFx0fTtcblx0XHRcdF90aGF0Ll9vYmouX21hcmtfdGltZVx0PVx0X3RoYXQuX2RvbS5jdXJyZW50VGltZTtcblx0XHRcdF90aGF0Ll9vYmoudXNlX2JhY2tfdXJsKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8v6K+l5LiL6L295LiL5p2l55qE5pWw5o2u5rKh5LiL6L295LiL5p2l77yM5oiW6ICF5LiL6L295LiL5p2l55qE5pWw5o2u5LiO6aKE5pyf5LiN56ymXG5cdFx0ZnVuY3Rpb25cdHN0YWxsZWQoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInN0YWxsZWRcIik7XG5cdFx0XHRfdGhhdC5fb2JqLl9tYXJrX3RpbWVcdD1cdF90aGF0Ll9kb20uY3VycmVudFRpbWU7XG5cdFx0XHQvL190aGF0Ll9vYmoudXNlX2JhY2tfdXJsKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8vcGxheSgp5ZKMYXV0b3BsYXnlvIDlp4vmkq3mlL7ml7bop6blj5Fcblx0XHRmdW5jdGlvblx0cGxheSgpe1xuXHRcdFxuXHRcdFx0aWYoX3RoYXQuX29iai5fc2tpbil7XG5cdFx0XHRcdHZpZGVvX3NraW4uaGlkZV93YWl0aW5nKF90aGF0Ll9kb20pO1xuXHRcdFx0XHR2aWRlb19za2luLmhpZGVfcGxheShfdGhhdC5fZG9tKTtcdFxuXHRcdFx0fVxuXHRcdFx0JChfdGhhdC5fb2JqKS50cmlnZ2VyKFwicGxheVwiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly9wYXVzZSgp6Kem5Y+RXG5cdFx0ZnVuY3Rpb25cdHBhdXNlKCl7XG5cdFx0XG5cdFx0XHRpZihfdGhhdC5fb2JqLl9za2luKXtcblx0XHRcdFx0dmlkZW9fc2tpbi5zaG93X3BsYXkoX3RoYXQuX2RvbSk7XG5cdFx0XHRcdHZpZGVvX3NraW4uaGlkZV93YWl0aW5nKF90aGF0Ll9kb20pO1x0XG5cdFx0XHR9XG5cdFx0XHRfdGhhdC5fb2JqLl9pc19wYXVzZVx0PVx0MTtcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInBhdXNlXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL21ldGRhdGHkuIvovb3lrozkuoYg5b2T5pS25Yiw5oC75pe26ZW/77yM5YiG6L6o546H5ZKM5a2X6L2o562JbWV0YWRhdGHml7bkuqfnlJ/or6Xkuovku7Zcblx0XHRmdW5jdGlvblx0bG9hZGVkbWV0YWRhdGEoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcImxvYWRlZG1ldGFkYXRhXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL+esrOS4gOW4p+WKoOi9veWujOaIkFxuXHRcdGZ1bmN0aW9uXHRsb2FkZWRkYXRhKCl7XG5cdFx0XG5cdFx0XHQkKF90aGF0Ll9vYmopLnRyaWdnZXIoXCJsb2FkZWRkYXRhXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL+etieW+heaVsOaNruS4rVxuXHRcdGZ1bmN0aW9uXHR3YWl0aW5nKCl7XG5cdFx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcIndhaXRpbmdcIik7XG5cdFx0XHRpZihfdGhhdC5fb2JqLl93YWl0aW5nX251bSl7XG5cdFx0XHRcdGlmKF90aGF0Ll9vYmouX3NraW4pe1xuXHRcdFx0XHRcdHZpZGVvX3NraW4uc2hvd193YWl0aW5nKF90aGF0Ll9kb20pO1x0XG5cdFx0XHRcdFx0dmlkZW9fc2tpbi5oaWRlX3BsYXkoX3RoYXQuX2RvbSk7XHRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19udW0rKztcblx0XHRcdFxuXHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19zdGFydF90aW1lXHQ9XHRuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdC8vX3RoYXQuX29iai51cGxvYWRfaW5mb19idWZmZXIoKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly/lm57mlL7miJbmmoLlgZzlkI7lho3mrKHlvIDlp4vmkq3mlL4g5oiWIOW9k+WqkuS9k+S7juWboOe8k+WGsuiAjOW8lei1t+eahOaaguWBnOWSjOWBnOatouaBouWkjeWIsOaSreaUvuaXtuS6p+eUn+ivpeS6i+S7tlxuXHRcdGZ1bmN0aW9uXHRwbGF5aW5nKCl7XG5cdFx0XHRpZihfdGhhdC5fb2JqLl9za2luKXtcblx0XHRcdFx0dmlkZW9fc2tpbi5oaWRlX3dhaXRpbmcoX3RoYXQuX2RvbSk7XHRcblx0XHRcdFx0dmlkZW9fc2tpbi5oaWRlX3BsYXkoX3RoYXQuX2RvbSk7XHRcblx0XHRcdH1cblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInBsYXlpbmdcIik7XG5cdFx0XHRfdGhhdC5fb2JqLl93YWl0aW5nX2VuZF90aW1lXHQ9XHRuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdFxuXHRcdFx0Ly/lpoLmnpzmmK/nrYnlvoXkuIvovb3lkI7mgaLlpI3mkq3mlL7lvpfvvIzpnIDopoHlkJHmnI3liqHlmajnq6/kuIrmiqXkuIDkuIvnrYnlvoXml7bpl7TjgIJcblx0XHRcdHZhclx0X3dhaXRpbmdfdGltZVx0PVx0X3RoYXQuX29iai5fd2FpdGluZ19lbmRfdGltZVx0LVx0X3RoYXQuX29iai5fd2FpdGluZ19zdGFydF90aW1lO1xuXHRcdFx0X3RoYXQuX29iai5fdG90YWxfd2FpdGluZ190aW1lXHQ9XHRfdGhhdC5fb2JqLl90b3RhbF93YWl0aW5nX3RpbWVcdCtcdF93YWl0aW5nX3RpbWU7XG5cdFx0XHRpZihfdGhhdC5fb2JqLl9pc19wYXVzZSl7XG5cdFx0XHRcdF90aGF0Ll9vYmouX2lzX3BhdXNlXHQ9XHQwO1xuXHRcdFx0fWVsc2UgaWYoX3RoYXQuX29iai5faXNfc2Vlayl7XG5cdFx0XHRcdC8v5aaC5p6c57yT5Yay5piv5Zug5Li6c2Vla+W8lei1t+W+l+mcgOimgeS4iuaKpVxuXHRcdFx0XHRpZihfdGhhdC5fb2JqLl93YWl0aW5nX3N0YXJ0X3RpbWUhPTApe1xuXHRcdFx0XHRcdF90aGF0Ll9vYmoudXBsb2FkX2luZm9fYnVmZmVyKDIsX3dhaXRpbmdfdGltZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1lbHNle1xuXHRcdFx0XHRpZihfdGhhdC5fb2JqLl93YWl0aW5nX251bVx0PT1cdDApe1xuXHRcdFx0XHRcdF90aGF0Ll9vYmoudXBsb2FkX2luZm9fYnVmZmVyKDEsX3dhaXRpbmdfdGltZSk7XG5cdFx0XHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19udW0rKztcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Ly/lpoLmnpznvJPlhrLmmK/lm6DkuLrmkq3mlL7ov4fnqIvkuK3ljaFcblx0XHRcdFx0XHRpZihfdGhhdC5fb2JqLl93YWl0aW5nX3N0YXJ0X3RpbWUhPTApe1xuXHRcdFx0XHRcdFx0X3RoYXQuX29iai51cGxvYWRfaW5mb19idWZmZXIoNCxfd2FpdGluZ190aW1lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19zdGFydF90aW1lXHQ9XHQwO1xuXHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19lbmRfdGltZVx0PVx0MDtcblx0XHRcdF90aGF0Ll9vYmouX2lzX3NlZWtcdD1cdDA7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5Y+v5Lul5byA5aeL5pKt5pS+5LqGLOWKoOi9veS4i+adpeS4gOS6m+W4p++8jOS9humdnuWFqOmDqFxuXHRcdGZ1bmN0aW9uXHRjYW5wbGF5KCl7XG5cdFx0XG5cdFx0XHQkKF90aGF0Ll9vYmopLnRyaWdnZXIoXCJjYW5wbGF5XCIpO1xuXHRcdFx0aWYoX3RoYXQuX29iai5fbWFya190aW1lKXtcblx0XHRcdFx0X3RoYXQuX2RvbS5jdXJyZW50VGltZSA9IF90aGF0Ll9vYmouX21hcmtfdGltZTtcblx0XHRcdFx0X3RoYXQuX29iai5fbWFya190aW1lID1cdDA7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9XG5cdFx0XG5cdFx0Ly/lj6/ku6XlvIDlp4vmkq3mlL7kuobvvIzliqDovb3kuIvmnaXkuoblhajpg6hcblx0XHRmdW5jdGlvblx0Y2FucGxheXRocm91Z2goKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcImNhbnBsYXl0aHJvdWdoXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL+Wvu+aJvuWFs+mUruW4p+S4rVxuXHRcdGZ1bmN0aW9uXHRzZWVraW5nKCl7XG5cdFx0XG5cdFx0XHRfdGhhdC5fb2JqLl9pc19zZWVrXHQ9XHQxO1xuXHRcdFx0JChfdGhhdC5fb2JqKS50cmlnZ2VyKFwic2Vla2luZ1wiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly/lr7vmib7lrozmr5Vcblx0XHRmdW5jdGlvblx0c2Vla2VkKCl7XG5cdFx0XG5cdFx0XHQkKF90aGF0Ll9vYmopLnRyaWdnZXIoXCJzZWVrZWRcIik7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5pKt5pS+5pe26Ze05pS55Y+YXG5cdFx0ZnVuY3Rpb25cdHRpbWV1cGRhdGUoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInRpbWV1cGRhdGVcIik7XG5cdFx0fVxuXHRcdFxuXHRcdC8v5pKt5pS+57uT5p2fXG5cdFx0ZnVuY3Rpb25cdGVuZGVkKCl7XG5cdFx0XG5cdFx0XHQvL2NvbnNvbGUubG9nKF90aGF0Ll9vYmouX3ZpZGVvLmN1cnJlbnRUaW1lKTtcblx0XHRcdC8vX3RoYXQuX29iai51cGxvYWRfaW5mb19iYyhfdGhhdC5fb2JqLl93YWl0aW5nX251bSk7XG5cdFx0XHQvL+WKoOS4iue8k+WGsuaXtumXtOeahOingueci3ZpZGVv5LiA5YWx55So55qE5pe26Ze0LOacquWKoOS4iue8k+WGsuaXtumXtOeahOingueci3ZpZGVv5LiA5YWx55So55qE5pe26Ze0XG5cdFx0XHRfdGhhdC5fb2JqLnVwbG9hZF9pbmZvX3N1bW1hcnkoX3RoYXQuX29iai5fdG90YWxfd2FpdGluZ190aW1lICsgX3RoYXQuX29iai5fdmlkZW8uY3VycmVudFRpbWUsX3RoYXQuX29iai5fdmlkZW8uY3VycmVudFRpbWUpO1xuXHRcdFx0X3RoYXQuX29iai5fdG90YWxfd2FpdGluZ190aW1lXHQ9XHQwO1xuXHRcdFx0X3RoYXQuX29iai5fd2FpdGluZ19udW1cdD1cdDA7XG5cdFx0XHQvL+a4healmm9ubGluZeS4iuaKpeW+queOr1xuXHRcdFx0Y2xlYXJJbnRlcnZhbChfdGhhdC5fb2JqLl9vbmxpbmVfdGltZXIpO1xuXHRcdFx0X3RoYXQuX29iai5faXNfZmlyc3RfZXJyb3JcdD1cdDE7XG5cdFx0XHRfdGhhdC5fb2JqLl9tYXJrX3RpbWVcdD1cdDA7XG5cdFx0XHQkKF90aGF0Ll9vYmopLnRyaWdnZXIoXCJlbmRlZFwiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly/mkq3mlL7pgJ/njofmlLnlj5hcblx0XHRmdW5jdGlvblx0cmF0ZWNoYW5nZSgpe1xuXHRcdFxuXHRcdFx0JChfdGhhdC5fb2JqKS50cmlnZ2VyKFwicmF0ZWNoYW5nZVwiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly/otYTmupDplb/luqbmlLnlj5hcblx0XHRmdW5jdGlvblx0ZHVyYXRpb25jaGFuZ2UoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcImR1cmF0aW9uY2hhbmdlXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvL+mfs+mHj+aUueWPmFxuXHRcdGZ1bmN0aW9uXHR2b2x1bWVjaGFuZ2UoKXtcblx0XHRcblx0XHRcdCQoX3RoYXQuX29iaikudHJpZ2dlcihcInZvbHVtZWNoYW5nZVwiKTtcblx0XHR9XG5cdH1cblx0XG5cdHJldHVybntcblx0XHRpbml0OmluaXRcblx0fVxufSgpKTsiLCIvKipcblx0Klx0YWRkIHNkayBnZXQgdmlkZW8gYXR0cmlidXRlc1xuXHQqXHRsaWppbmdhblxuXHQqXHRxcToyOTA3MTE4NTFcblx0Klx0MjAxNS4wOC4wNVxuXHQqKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCl7XG5cdFxuXHR2YXIgY3VycmVudF90aW1lX3N0YXR1cyA9IDA7XG5cdHZhciBjdXJyZW50X3RpbWVfYmFzZSA9IDA7XG5cdHZhciBjdXJyZW50VGltZVx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XG5cdFx0dmFyIF9jdXJyZW50X3RpbWUgPSAwO1xuXHRcdGlmKCBjdXJyZW50X3RpbWVfc3RhdHVzIDwgMiApe1xuXHRcdFx0Y3VycmVudF90aW1lX3N0YXR1cyArKztcblx0XHR9ZWxzZSBpZiggY3VycmVudF90aW1lX3N0YXR1cyA9PSAyICl7XG5cdFx0XHRjdXJyZW50X3RpbWVfc3RhdHVzICsrO1xuXHRcdFx0aWYoIF92aWRlby5jdXJyZW50VGltZSA+IDEwMDAgKXtcblx0XHRcdFx0Y3VycmVudF90aW1lX2Jhc2UgPSBfdmlkZW8uY3VycmVudFRpbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCBjdXJyZW50X3RpbWVfYmFzZSApe1xuXHRcdFx0X2N1cnJlbnRUaW1lID0gX3ZpZGVvLmN1cnJlbnRUaW1lIC0gY3VycmVudF90aW1lX2Jhc2U7XG5cdFx0fWVsc2V7XG5cdFx0XHRfY3VycmVudFRpbWUgPSBfdmlkZW8uY3VycmVudFRpbWU7XG5cdFx0fVxuXHRcdHJldHVybiBfY3VycmVudFRpbWU7XG5cdH1cblx0dmFyIGR1cmF0aW9uXHQ9XHRmdW5jdGlvbihfdmlkZW8pe1xuXHRcdHJldHVybiBfdmlkZW8uZHVyYXRpb247XG5cdH1cblx0dmFyIHBhdXNlZFx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLnBhdXNlZDtcblx0fVxuXHR2YXIgZGVmYXVsdFBsYXliYWNrUmF0ZVx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLmRlZmF1bHRQbGF5YmFja1JhdGU7XG5cdH1cblx0dmFyIHBsYXliYWNrUmF0ZVx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLnBsYXliYWNrUmF0ZTtcblx0fVxuXHRcblx0Ly/lt7Lmkq3ojIPlm7TmjIfnmoTmmK/ooqvmkq3mlL7pn7PpopEv6KeG6aKR55qE5pe26Ze06IyD5Zu044CC5aaC5p6c55So5oi35Zyo6Z+z6aKRL+inhumikeS4rei3s+i3g++8jOWImeS8muiOt+W+l+WkmuS4quaSreaUvuiMg+WbtOOAglxuXHQvL+iOt+W+l+afkOS4quW3suaSreiMg+WbtOeahOW8gOWni+S9jee9rlxuXHR2YXIgcGxheWVkX3N0YXJ0XHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby5wbGF5ZWQuc3RhcnQoX251bSk7XG5cdH1cblx0XG5cdC8v6I635b6X5p+Q5Liq5bey5pKt6IyD5Zu055qE57uT5p2f5L2N572uXG5cdHZhciBwbGF5ZWRfZW5kXHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby5wbGF5ZWQuZW5kKF9udW0pO1xuXHR9XG5cdFxuXHQvL+WPr+Wvu+WdgOiMg+WbtOaMh+eahOaYr+eUqOaIt+WcqOmfs+mikS/op4bpopHkuK3lj6/lr7vlnYDvvIjnp7vliqjmkq3mlL7kvY3nva7vvInnmoTml7bpl7TojIPlm7TjgIJcblx0Ly/lr7nkuo7mtYHop4bpopHvvIzpgJrluLjlj6/ku6Xlr7vlnYDliLDop4bpopHkuK3nmoTku7vkvZXkvY3nva7vvIzljbPkvb/lhbblsJrmnKrlrozmiJDnvJPlhrLjgIJcblx0Ly/ojrflvpfmn5DkuKrlt7Lmkq3ojIPlm7TnmoTlvIDlp4vkvY3nva5cblx0dmFyIHNlZWthYmxlX3N0YXJ0XHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby5zZWVrYWJsZS5zdGFydChfbnVtKTtcblx0fVxuXHRcblx0Ly/ojrflvpfmn5DkuKrlt7Lmkq3ojIPlm7TnmoTnu5PmnZ/kvY3nva5cblx0dmFyIHNlZWthYmxlX2VuZFx0PVx0ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdHJldHVybiBfdmlkZW8uc2Vla2FibGUuZW5kKF9udW0pO1xuXHR9XG5cdFxuXHR2YXIgZW5kZWRcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5lbmRlZDtcblx0fVxuXHR2YXIgYXV0b1BsYXlcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5hdXRvcGxheTtcblx0fVxuXHR2YXIgbG9vcFx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLmxvb3A7XG5cdH1cblx0XG5cdC8v57yT5Yay6IyD5Zu05oyH55qE5piv5bey57yT5Yay6Z+z6KeG6aKR55qE5pe26Ze06IyD5Zu044CC5aaC5p6c55So5oi35Zyo6Z+z6KeG6aKR5Lit6Lez6LeD5pKt5pS+77yM5Lya5b6X5Yiw5aSa5Liq57yT5Yay6IyD5Zu044CCXG5cdC8v6I635b6X5p+Q5Liq5bey5pKt6IyD5Zu055qE5byA5aeL5L2N572uXG5cdHZhciBidWZmZXJlZF9zdGFydFx0PVx0ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdHJldHVybiBfdmlkZW8uYnVmZmVyZWQuc3RhcnQoX251bSk7XG5cdH1cblx0XG5cdC8v6I635b6X5p+Q5Liq5bey5pKt6IyD5Zu055qE57uT5p2f5L2N572uXG5cdHZhciBidWZmZXJlZF9lbmRcdD1cdGZ1bmN0aW9uKF92aWRlbyxfbnVtKXtcblx0XHRyZXR1cm4gX3ZpZGVvLmJ1ZmZlcmVkLmVuZChfbnVtKTtcblx0fVxuXHRcblx0Ly/lj6/nlKjpn7PovajnmoTmlbDph49cblx0dmFyIGF1ZGlvVHJhY2tzX2xlbmd0aFx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLmF1ZGlvVHJhY2tzLmxlbmd0aDtcblx0fVxuXHRcblx0Ly/pgJrov4cgaWQg5p2l6I635b6XIEF1ZGlvVHJhY2sg5a+56LGhXG5cdHZhciBhdWRpb1RyYWNrc19nZXRfb2JqZWN0X2J5X2lkXHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby5hdWRpb1RyYWNrcy5nZXRUcmFja0J5SWQoX251bSk7XG5cdH1cblx0XG5cdC8v6YCa6L+HIGluZGV4IOadpeiOt+W+lyBBdWRpb1RyYWNrIOWvueixoVxuXHR2YXIgYXVkaW9UcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleFx0PVx0ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdHJldHVybiBfdmlkZW8uYXVkaW9UcmFja3NbX251bV07XG5cdH1cblx0XG5cdC8v6L+U5Zue5b2T5YmN55qE5aqS5L2T5o6n5Yi25Zmo77yITWVkaWFDb250cm9sbGVy5a+56LGh77yJXG5cdHZhciBjb250cm9sbGVyXHQ9XHRmdW5jdGlvbihfdmlkZW8pe1xuXHRcdHJldHVybiBfdmlkZW8uY29udHJvbGxlcjtcblx0fVxuXHRcblx0Ly/ov5Tlm57lvZPliY3lqpLkvZPnmoRVUkxcblx0dmFyIGN1cnJlbnRTcmNcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5jdXJyZW50U3JjO1xuXHR9XG5cdFxuXHQvL+e8uuecgeaYr+WQpumdmemfs1xuXHR2YXIgZGVmYXVsdE11dGVkXHQ9XHRmdW5jdGlvbihfdmlkZW8pe1xuXHRcdHJldHVybiBfdmlkZW8uZGVmYXVsdE11dGVkO1xuXHR9XG5cdFxuXHQvL+i/lOWbnuW9k+WJjeaSreaUvueahOmUmeivr+eKtuaAgVxuXHQvLzEu55So5oi357uI5q2iIFxuXHQvLzIu572R57uc6ZSZ6K+vIFxuXHQvLzMu6Kej56CB6ZSZ6K+vIFxuXHQvLzQuVVJM5peg5pWIIFxuXHR2YXIgZXJyb3JcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5lcnJvcjtcblx0fVxuXHRcblx0Ly/lvZPliY3pn7Pop4bpopHmiYDlsZ7lqpLkvZPnu4QgKOeUqOadpemTvuaOpeWkmuS4qumfs+inhumikeagh+etvilcblx0dmFyIG1lZGlhR3JvdXBcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5tZWRpYUdyb3VwO1xuXHR9XG5cdFxuXHQvL+aYr+WQpumdmemfs1xuXHR2YXIgbXV0ZWRcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5tdXRlZDtcblx0fVxuXHRcblx0Ly/pn7Pph4/lgLxcblx0dmFyIHZvbHVtZVx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRyZXR1cm4gX3ZpZGVvLnZvbHVtZTtcblx0fVxuXHRcblx0Ly/ov5Tlm57lvZPliY3nvZHnu5znirbmgIFcblx0Ly8wID0gTkVUV09SS19FTVBUWSAtIOmfs+mikS/op4bpopHlsJrmnKrliJ3lp4vljJZcblx0Ly8xID0gTkVUV09SS19JRExFIC0g6Z+z6aKRL+inhumikeaYr+a0u+WKqOeahOS4lOW3sumAieWPlui1hOa6kO+8jOS9huW5tuacquS9v+eUqOe9kee7nFxuXHQvLzIgPSBORVRXT1JLX0xPQURJTkcgLSDmtY/op4jlmajmraPlnKjkuIvovb3mlbDmja5cblx0Ly8zID0gTkVUV09SS19OT19TT1VSQ0UgLSDmnKrmib7liLDpn7PpopEv6KeG6aKR5p2l5rqQXG5cdHZhciBuZXR3b3JrU3RhdGVcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5uZXR3b3JrU3RhdGU7XG5cdH1cblx0XG5cdC8v6L+U5Zue6Z+z6aKRL+inhumikeWFg+e0oOeahOWwsee7queKtuaAgVxuXHQvLzAgPSBIQVZFX05PVEhJTkcgLSDmsqHmnInlhbPkuo7pn7PpopEv6KeG6aKR5piv5ZCm5bCx57uq55qE5L+h5oGvXG5cdC8vMSA9IEhBVkVfTUVUQURBVEEgLSDlhbPkuo7pn7PpopEv6KeG6aKR5bCx57uq55qE5YWD5pWw5o2uXG5cdC8vMiA9IEhBVkVfQ1VSUkVOVF9EQVRBIC0g5YWz5LqO5b2T5YmN5pKt5pS+5L2N572u55qE5pWw5o2u5piv5Y+v55So55qE77yM5L2G5rKh5pyJ6Laz5aSf55qE5pWw5o2u5p2l5pKt5pS+5LiL5LiA5binL+avq+enklxuXHQvLzMgPSBIQVZFX0ZVVFVSRV9EQVRBIC0g5b2T5YmN5Y+K6Iez5bCR5LiL5LiA5bin55qE5pWw5o2u5piv5Y+v55So55qEXG5cdC8vNCA9IEhBVkVfRU5PVUdIX0RBVEEgLSDlj6/nlKjmlbDmja7otrPku6XlvIDlp4vmkq3mlL5cblx0dmFyIHJlYWR5U3RhdGVcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby5yZWFkeVN0YXRlO1xuXHR9XG5cdFxuXHQvL+aWh+acrOi9qOi/uShUZXh0VHJhY2tMaXN05a+56LGhKeW+l+mVv+W6plxuXHR2YXIgdGV4dFRyYWNrc19sZW5ndGhcdD1cdGZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0cmV0dXJuIF92aWRlby50ZXh0VHJhY2tzLmxlbmd0aDtcblx0fVxuXHRcblx0Ly/moLnmja7kuIvmoIfmnaXojrflvpcgVGV4dFRyYWNrIOWvueixoVxuXHR2YXIgdGV4dFRyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4XHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby50ZXh0VHJhY2tzW19udW1dO1xuXHR9XG5cdFxuXHQvL+agueaNrmlk5p2l6I635b6XIFRleHRUcmFjayDlr7nosaFcblx0dmFyIHRleHRUcmFja3NfZ2V0X29iamVjdF9ieV9pZFx0PVx0ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdHJldHVybiBfdmlkZW8udGV4dFRyYWNrcy5nZXRUcmFja0J5SWQoX251bSk7XG5cdH1cblx0XG5cdC8v5qC55o2u5LiL5qCH5p2l6I635b6XIHZpZGVvVHJhY2tzIOWvueixoVxuXHR2YXIgdmlkZW9UcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleFx0PVx0ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdHJldHVybiBfdmlkZW8udmlkZW9UcmFja3NbX251bV07XG5cdH1cblx0XG5cdC8v5qC55o2uaWTmnaXojrflvpcgdmlkZW9UcmFja3Mg5a+56LGhXG5cdHZhciB2aWRlb1RyYWNrc19nZXRfb2JqZWN0X2J5X2lkXHQ9XHRmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0cmV0dXJuIF92aWRlby52aWRlb1RyYWNrcy5nZXRUcmFja0J5SWQoX251bSk7XG5cdH1cblx0XG5cdHJldHVybntcblx0XHRjdXJyZW50VGltZTpmdW5jdGlvbihfdmlkZW8pe1xuXHRcdFx0cmV0dXJuIGN1cnJlbnRUaW1lKF92aWRlbyk7XG5cdFx0fSxcblx0XHRkdXJhdGlvbjpmdW5jdGlvbihfdmlkZW8pe1xuXHRcdFx0cmV0dXJuIGR1cmF0aW9uKF92aWRlbyk7XG5cdFx0fSxcblx0XHRwYXVzZWQ6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBwYXVzZWQoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdGRlZmF1bHRQbGF5YmFja1JhdGU6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBkZWZhdWx0UGxheWJhY2tSYXRlKF92aWRlbyk7XG5cdFx0fSxcblx0XHRwbGF5YmFja1JhdGU6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBwbGF5YmFja1JhdGUoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdHBsYXllZF9zdGFydDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gcGxheWVkX3N0YXJ0KF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdHBsYXllZF9lbmQ6ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdFx0cmV0dXJuIHBsYXllZF9lbmQoX3ZpZGVvLF9udW0pO1xuXHRcdH0sXG5cdFx0c2Vla2FibGVfc3RhcnQ6ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdFx0cmV0dXJuIHNlZWthYmxlX3N0YXJ0KF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdHNlZWthYmxlX2VuZDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gc2Vla2FibGVfZW5kKF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdGVuZGVkOmZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0XHRyZXR1cm4gZW5kZWQoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdGF1dG9QbGF5OmZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0XHRyZXR1cm4gYXV0b1BsYXkoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdGxvb3A6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBsb29wKF92aWRlbyk7XG5cdFx0fSxcblx0XHRidWZmZXJlZF9zdGFydDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gYnVmZmVyZWRfc3RhcnQoX3ZpZGVvLF9udW0pO1xuXHRcdH0sXG5cdFx0YnVmZmVyZWRfZW5kOmZ1bmN0aW9uKF92aWRlbyxfbnVtKXtcblx0XHRcdHJldHVybiBidWZmZXJlZF9lbmQoX3ZpZGVvLF9udW0pO1xuXHRcdH0sXG5cdFx0YXVkaW9UcmFja3NfbGVuZ3RoOmZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0XHRyZXR1cm4gYXVkaW9UcmFja3NfbGVuZ3RoKF92aWRlbyk7XG5cdFx0fSxcblx0XHRhdWRpb1RyYWNrc19nZXRfb2JqZWN0X2J5X2lkOmZ1bmN0aW9uKF92aWRlbyxfbnVtKXtcblx0XHRcdHJldHVybiBhdWRpb1RyYWNrc19nZXRfb2JqZWN0X2J5X2lkKF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdGF1ZGlvVHJhY2tzX2dldF9vYmplY3RfYnlfaW5kZXg6ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdFx0cmV0dXJuIGF1ZGlvVHJhY2tzX2dldF9vYmplY3RfYnlfaW5kZXgoX3ZpZGVvLF9udW0pO1xuXHRcdH0sXG5cdFx0Y29udHJvbGxlcjpmdW5jdGlvbihfdmlkZW8pe1xuXHRcdFx0cmV0dXJuIGNvbnRyb2xsZXIoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdGN1cnJlbnRTcmM6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBjdXJyZW50U3JjKF92aWRlbyk7XG5cdFx0fSxcblx0XHRkZWZhdWx0TXV0ZWQ6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBkZWZhdWx0TXV0ZWQoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdGVycm9yOmZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0XHRyZXR1cm4gZXJyb3IoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdG1lZGlhR3JvdXA6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBtZWRpYUdyb3VwKF92aWRlbyk7XG5cdFx0fSxcblx0XHRtdXRlZDpmdW5jdGlvbihfdmlkZW8pe1xuXHRcdFx0cmV0dXJuIG11dGVkKF92aWRlbyk7XG5cdFx0fSxcblx0XHRuZXR3b3JrU3RhdGU6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiBuZXR3b3JrU3RhdGUoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdHJlYWR5U3RhdGU6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiByZWFkeVN0YXRlKF92aWRlbyk7XG5cdFx0fSxcblx0XHR2b2x1bWU6ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcdHJldHVybiB2b2x1bWUoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdHRleHRUcmFja3NfbGVuZ3RoOmZ1bmN0aW9uKF92aWRlbyl7XG5cdFx0XHRyZXR1cm4gdGV4dFRyYWNrc19sZW5ndGgoX3ZpZGVvKTtcblx0XHR9LFxuXHRcdHRleHRUcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gdGV4dFRyYWNrc19nZXRfb2JqZWN0X2J5X2luZGV4KF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdHRleHRUcmFja3NfZ2V0X29iamVjdF9ieV9pZDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gdGV4dFRyYWNrc19nZXRfb2JqZWN0X2J5X2lkKF92aWRlbyxfbnVtKTtcblx0XHR9LFxuXHRcdHZpZGVvVHJhY2tzX2dldF9vYmplY3RfYnlfaWQ6ZnVuY3Rpb24oX3ZpZGVvLF9udW0pe1xuXHRcdFx0cmV0dXJuIHZpZGVvVHJhY2tzX2dldF9vYmplY3RfYnlfaWQoX3ZpZGVvLF9udW0pO1xuXHRcdH0sXG5cdFx0dmlkZW9UcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleDpmdW5jdGlvbihfdmlkZW8sX251bSl7XG5cdFx0XHRyZXR1cm4gdmlkZW9UcmFja3NfZ2V0X29iamVjdF9ieV9pbmRleChfdmlkZW8sX251bSk7XG5cdFx0fVx0XHRcblx0fVxufSgpKTsiLCIvKipcblx0Klx0YWRkIHNkayBza2luXG5cdCpcdGxpamluZ2FuXG5cdCpcdHFxOjI5MDcxMTg1MVxuXHQqXHQyMDE1LjA5LjE1XG5cdCoqL1xuXHRcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCl7XG5cblx0dmFyIHNob3dfd2FpdGluZ1x0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XG5cdFx0aWYoJChcIi5qc19oNV9zZGtfd2FpdGluZ19kb21cIikubGVuZ3RoKXtcblx0XHRcdCQoXCIuanNfaDVfc2RrX3BsYXlfZG9tXCIpLmhpZGUoKTtcblx0XHRcdCQoXCIuanNfaDVfc2RrX3dhaXRpbmdfZG9tXCIpLnNob3coKTtcblx0XHR9ZWxzZXtcblx0XHRcdHZhciBfZG9tID0gJzxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImpzX2g1X3Nka193YWl0aW5nX2RvbVwiPjwvYT4nO1xuXHRcdFx0JChfdmlkZW8pLmFmdGVyKF9kb20pO1xuXHRcdH1cblx0fVxuXHRcblx0dmFyIGhpZGVfd2FpdGluZ1x0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XHRcblx0XHQkKF92aWRlbykubmV4dChcIi5qc19oNV9zZGtfd2FpdGluZ19kb21cIikuaGlkZSgpO1xuXHR9XG5cdFxuXHR2YXIgc2hvd19wbGF5XHQ9XHRmdW5jdGlvbihfdmlkZW8pe1xuXHRcdFxuXHRcdGlmKCQoXCIuanNfaDVfc2RrX3BsYXlfZG9tXCIpLmxlbmd0aCl7XG5cdFx0XHQkKFwiLmpzX2g1X3Nka193YWl0aW5nX2RvbVwiKS5oaWRlKCk7XG5cdFx0XHQkKFwiLmpzX2g1X3Nka19wbGF5X2RvbVwiKS5zaG93KCk7XG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgX2RvbSA9ICc8YSB0eXBlPVwiYnV0dG9uXCIgc3R5bGU9XCI0cHggc29saWQgZ3JlZW5cIiBjbGFzcz1cImpzX2g1X3Nka19wbGF5X2RvbVwiPjwvYT4nO1xuXHRcdFx0JChfdmlkZW8pLmFmdGVyKF9kb20pO1xuXHRcdH1cblx0fVxuXHRcblx0dmFyIGhpZGVfcGxheVx0PVx0ZnVuY3Rpb24oX3ZpZGVvKXtcblx0XG5cdFx0JChfdmlkZW8pLm5leHQoXCIuanNfaDVfc2RrX3BsYXlfZG9tXCIpLmhpZGUoKTtcblx0fVxuXHRcblx0cmV0dXJue1xuXHRcdHNob3dfd2FpdGluZzpzaG93X3dhaXRpbmcsXG5cdFx0aGlkZV93YWl0aW5nOmhpZGVfd2FpdGluZyxcblx0XHRzaG93X3BsYXk6c2hvd19wbGF5LFxuXHRcdGhpZGVfcGxheTpoaWRlX3BsYXlcblx0fVxufSgpKTsiLCIvKipcbiAqIGF1dGhvciBsaWppbmdhblxuICogUVE6MjkwNzExODUxXG4gKlx05pS55oiQ5qih5Z2X5YS/XG4gKiAyMDE1LjA4LjAzXG4gKiovXG4gXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFqYXhQb3N0ID0gZnVuY3Rpb24gKHVybCwgZGF0YSwgZnVuKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHhockZpZWxkczoge3dpdGhDcmVkZW50aWFsczogdHJ1ZX0sXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGZ1bihkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bihmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYWpheEdldCA9IGZ1bmN0aW9uICh1cmwsIGRhdGEsIGZ1bikge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHhockZpZWxkczoge3dpdGhDcmVkZW50aWFsczogdHJ1ZX0sXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGZ1bihkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bihmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYWpheEpzb25wID0gZnVuY3Rpb24gKHVybCwgZGF0YSwgZnVuKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrZm5cIixcbiAgICAgICAgICAgIGpzb25wQ2FsbGJhY2s6ZGF0YS5fanNvbnAsXG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICB4aHJGaWVsZHM6IHt3aXRoQ3JlZGVudGlhbHM6IHRydWV9LFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGNhbGxiYWNrRGF0YSkge1xuICAgICAgICAgICAgICAgIGZ1bihjYWxsYmFja0RhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnVuKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFqYXhQb3N0OiBhamF4UG9zdCxcbiAgICAgICAgYWpheEdldDogYWpheEdldCxcbiAgICAgICAgYWpheEpzb25wOiBhamF4SnNvbnBcbiAgICB9O1xufSgpKTsiXX0=
