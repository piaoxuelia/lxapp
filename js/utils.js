/**
 * Utils
 * wangweihua@360.cn
 * 2014-7
 */
(function(g) {
	var utils = {},
		isPlainObject = $.isPlainObject;

	function tryget(o, path, v) {
		var parts = path.split('.'),
			part, len = parts.length;
		for (var t = o, i = 0; i < len; ++i) {
			part = parts[i];
			if (part in t) {
				t = t[parts[i]];
			} else {
				return v;
			}
		}
		return t;
	}

	utils.tryget = tryget;
	/**
	 * ##str.format(formatString, ...)##
	 * @param {String} formatString
	 * @return {String}
	 *
	 * ```javascript
	 * //Simple
	 * str.format('{0}',2014) //Error
	 * str.format('{0}',[2014])
	 * => 2014
	 *
	 * str.format('{2}/{1}/{0}',[2014,6,3])
	 * => "3/6/2014"
	 *
	 * str.format('{2}/{1}/{0}',2014,6,3)
	 * => "3/6/2014"
	 *
	 * str.format("{year}-{month}-{date}",{year:2014,month:6,date:3})
	 * => "2014-6-3"
	 *
	 * //Advanced
	 * str.format('{2,2,0}/{1,2,0}/{0}',[2014,6,3]);
	 * => "03/06/2014"
	 *
	 * str.format('{2,2,!}/{1,2,*}/{0}',[2014,6,3]);
	 * => "!3/*6/2014"
	 *
	 * str.format("{year}-{month,2,0}-{date,2,0}",{year:2014,month:6,date:3})
	 * => "2014-06-03"
	 *
	 * str.format('{0,-5}',222014)
	 * => "22014"
	 *
	 * format('{0,6,-}{1,3,-}','bar','')
	 * => "---bar---"
	 * ```
	 */
	var format = (function() {
		function postprocess(ret, a) {
			var align = parseInt(a.align),
				absAlign = Math.abs(a.align),
				result, retStr;

			if (ret == null) {
				retStr = '';
			} else if (typeof ret == 'number') {
				retStr = '' + ret;
			} else {
				throw new Error('Invalid argument type!');
			}

			if (absAlign === 0) {
				return ret;
			} else if (absAlign < retStr.length) {
				result = align > 0 ? retStr.slice(0, absAlign) : retStr.slice(-absAlign);
			} else {
				result = Array(absAlign - retStr.length + 1).join(a.pad || format.DefaultPaddingChar);
				result = align > 0 ? result + retStr : retStr + result;
			}
			return result;
		}

		function p(all) {
			var ret = {},
				p1, p2, sep = format.DefaultFieldSeperator;
			p1 = all.indexOf(sep);
			if (p1 < 0) {
				ret.index = all;
			} else {
				ret.index = all.substr(0, p1);
				p2 = all.indexOf(sep, p1 + 1);
				if (p2 < 0) {
					ret.align = all.substring(p1 + 1, all.length);
				} else {
					ret.align = all.substring(p1 + 1, p2);
					ret.pad = all.substring(p2 + 1, all.length);
				}
			}
			return ret; //{index,pad,align}
		}

		return function(self, args) {
			var len = arguments.length;
			if (len > 2) {
				args = Array.prototype.slice.call(arguments, 1);
			} else if (len === 2 && !isPlainObject(args)) {
				args = [args];
			} else if (len === 1) {
				return self;
			}
			return self.replace(format.InterpolationPattern, function(all, m) {
				var a = p(m),
					ret = tryget(args, a.index);
				if (ret == null) ret = a.index;
				return a.align == null && a.pad == null ? ret : postprocess(ret, a) || ret;
			});
		};
	})();

	format.DefaultPaddingChar = ' ';
	format.DefaultFieldSeperator = ',';
	format.InterpolationPattern = /\{(.*?)\}/g;
	utils.format = format;

	utils.formatDate = function(ts, opts) {
		opts = opts || {};
		var tmp = String(ts),
			t, eff = tmp.match(/000$/) ? 1 : 1000;

		if (tmp.match(/^[\d]+$/)) {
			t = new Date(parseInt(ts * eff, 10));
		} else /* if (tmp.match(/\d+-\d+-\d+( \d+:\d+:\d+)?/))*/ {
			t = new Date(Date.parse(tmp.replace(/-/g, '/')));
		}
		return format(opts.format || utils.formatDate.DateFormatShort, {
			year: t.getFullYear(),
			month: t.getMonth() + 1,
			date: t.getDate(),
			hour: t.getHours(),
			min: t.getMinutes()
		});
	};
	utils.formatDate.DateFormatShort = "{month,2,0}-{date,2,0} {hour,2,0}:{min,2,0}";

	/**
	 * 根据给定尺寸和URL给出图床自动切图的URL
	 */
	var a = document.createElement('a'),
		ratio = window.devicePixelRatio || 1;

	utils.dmfd = function(url, newWidth, newHeight, useRatio) {
		return utils.optimizeQhimg(url, {
			type: 'dmfd',
			width: newWidth,
			height: newHeight,
			useRatio: !!useRatio
		});
	};
	utils.dmt = function(url, newWidth, newHeight, useRatio) {
		return utils.optimizeQhimg(url, {
			type: 'dmt',
			width: newWidth,
			height: newHeight,
			useRatio: !!useRatio
		});
	};

	utils.optimizeQhimg = function(url,opts) {
		if(!~url.indexOf('qhimg.com')) {
			return url;
		}
		var types = 'dc dr sdr bdr edr edrh dm dmt dmb dml dmr bdm bdmt bdmb bdml bdmr sdmt dmfd dmtfd dmsmty';
		var defaults = {
			width: 200,
			height: 100,
			quality: '',
			type: 'dmfd',
			useRatio: false
		}, options = {};
		var re = types.replace(/[^, ]+/g,function(type){
			return ['\\/',type,'\\/'].join('');
		});
		if(new RegExp('(' + re.split(' ').join('|') + ')').test(url)) {
			if(!opts) {
				return url;
			}
			options.type = RegExp.$1.slice(1,-1);
			url = url.replace(new RegExp(options.type + '\\/(\\d*_\\d*_\\d*)\\/'), function(a,b) {
				var temp = b.split('_');
				options.width = temp[0];
				options.height = temp[1];
				options.quality = temp[2];
				return '';
			});
		}
		if((opts && opts.type && types.indexOf(opts.type) === -1) || (opts && !opts.type)) {
			delete opts.type;
		}
		opts = $.extend({}, defaults, options, opts);
		// 非 wifi 环境 强制使用 1 倍图
		// $netType 客户端注入，1 表示 wifi 网络，0 表示非 wifi 网络
		if(window.$netType == 0) {
			opts.useRatio && (opts.useRatio = false);
		}
		if(opts.useRatio) {
			var ratio = window.devicePixelRatio || 1;
			opts.width && (opts.width *= ratio);
			opts.height && (opts.height *= ratio);
		}

		var zoom_out = utils.getParam('zoom_out', url);

		if(zoom_out) {
			opts.width && (opts.width *= zoom_out / 100);
			opts.height && (opts.height *= zoom_out / 100);
		}

		opts.width = opts.width ? Math.round(opts.width) : opts.width;
		opts.height = opts.height ? Math.round(opts.height) : opts.height;

		var partUrl = [opts.type,[opts.width,opts.height,opts.quality].join('_')].join('/');
		return url.replace(/((?:http:\/\/|https:\/\?)?[A-Za-z0-9\.]+)\/(.*)/,function(a,b,c){
			return [b,partUrl,c].join('/');
		});
	};

	function normalizeDateTime(s) {
		if (!s) return null;
		var d;
		s = s.toString();
		if (s.match(/^\d{10}$/)) {
			d = new Date(parseInt(s, 10) * 1000);
		} else if (s.match(/^\d{10,}$/)) {
			d = new Date(parseInt(s, 10));
		} else if (s.indexOf('-') > 0) {
			d = new Date(Date.parse(s.replace(/-/g, '/')));
		}
		return d;
	}

	/**
	 * 将"2014-01-01 12:12:12"格式化成 "1月1日 12:12" 或 " 2014年1月1日 12:12"
	 */
	function chsdate(s, year) {
		var d = normalizeDateTime(s),
			result;
		if (!d) return null;

		result = format('{month}月{date}日 {hour}:{minute,2,0}', {
			month: d.getMonth() + 1,
			date: d.getDate(),
			hour: d.getHours(),
			minute: d.getMinutes()
		});
		return year ? d.getFullYear() + '年' + result : result;
	}

	utils.chsdate = chsdate;

	utils.elapse = function(s) {
		var d = normalizeDateTime(s);
		if (!d) return null;

		var now = new Date(),
			delta = Math.floor((now - d) / 1000);

		if (delta <= 60) {
			return '刚刚';
		} else if (delta > 60 && delta < 3600) {
			return Math.floor(delta / 60) + '分钟前';
		} else if (delta >= 3600 && delta < 864e2) {
			return Math.floor(delta / 3600) + '小时前'
		} else if (delta >= 864e2 && delta < 864e2 * 3) { // 最多显示 2天前
			return Math.floor(delta / 864e2) + '天前';
		} else if (delta >= 864e2 * 3) {
			var now = new Date(), formatStr = '{month,2,0}月{date,2,0}日';
			if(now.getFullYear() !== d.getFullYear()) { // 如果不是今年
				formatStr = '{year}年{month,2,0}月{date,2,0}日';
			}
			return format(formatStr, {
				year: d.getFullYear(),
				month: d.getMonth() + 1,
				date: d.getDate()
			});
		}
	}

	/**
	 * resizeAmap
	 * resize高德地图静态图
	 * http://restapi.amap.com/v3/staticmap?scale=2&location=121.463884,31.335637&zoom=12&size=400*225&markers=mid,,A:121.463884,31.335637&key=ee95e52bf08006f63fd29bcfbcf21df0
	 */
	utils.resizeAmap = function(url, width, height) {
		return url.replace(/size=(\d+)\*(\d+)/, function(all, w, h) {
			return "size=" + width + "*" + height;
		});
	};

	utils.unescape = function(s) {
		return s
			.replace(/&nbsp;/g, " ")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, "\"")
			.replace(/&#039;/g, "'")
			.replace(/&#39;/g, "'");
	};

	/**
	 * 将数字转换为1k,1w的形式
	 */
	utils.toKw = function(n) {
		if (n < 1000) return n;
		if (n < 10000 && n >= 1000) return (n / 1000).toFixed(0) + 'K';
		return (n / 10000).toFixed(0) + 'W';
	};

	/**
	 * 将1k,1w转化为对应的数字
	 * @param  {[type]} s [description]
	 * @return {[type]}   [description]
	 */
	utils.fromKw = function(s) {
		var units = {
				k: 1000,
				w: 10000
			},
			v = s.toLowerCase().replace(/([\d.]+)(k|w)$/, function(all, n, u) {
				return parseInt(n, 10) * (units[u] || 1);
			});
		return parseInt(v, 10);
	};

	/**
	 * 提取视频url
	 * 数据中的视频链接是视频sdk的地址，url后的参数才是真正地址
	 */
	utils.extractVideoUrl = function(url) {
		a.href = url;
		var query = a.search.toString();
		if (!query || query.indexOf('?url=') < 0) return url;
		query = a.search.split('=');
		if (query.length < 2) return url;
		return decodeURIComponent(query[1]);
	};

	var stripTagDiv = document.createElement('div');
	utils.stripTags = function(strMayContainsHtml){
		stripTagDiv.innerHTML = strMayContainsHtml;
		return stripTagDiv.textContent || stripTagDiv.innerText;
	};

	utils.trunc = function(str, max, suffix, isStripTags) {
		if (!str) return str;
		if(isStripTags) {
			str = utils.stripTags(str);
		}
		var i = 0,
			len = str.length,
			ch, result = '',
			c = 0;
		if (len < max / 2) return str;
		for (; i < len && c < max; ++i) {
			ch = str.charAt(i);
			result += ch;
			c += !!ch.match(/[ 。 ；  ， ： “ ”（ ） 、 ？ 《 》\u4E00-\u9FA5]/) ? 2 : 1
		}
		return result + (suffix || '');
	};

	/**
	 * [getParam 获取url中指定的参数值]
	 * @param  {[type]} name [参数 key]
	 * @param  {[type]} url  [选择提供]
	 * @return {[type]}      [参数 value]
	 */
	utils.getParam = function(name,url) {
		var sUrl = url ? url : window.location.search;
		var r = sUrl.match(new RegExp('[?&]{1}' + name + '=([^&]*)'));
		return (r === null ? null : decodeURIComponent(r[1]));
	};

	utils.getCookie = function(name) {
		if(typeof name !== 'string' || !name || !document.cookie) {
			return;
		}
		// RFC2109 RFC2068 rfc6265
		name = name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
		var re = new RegExp('(?:^|;)\\s?' + name + '=(.*?)(?:;|$)','i'),
			match = document.cookie.match(re);
		return match && decodeURIComponent(match[1]);
	};

	utils.setCookie = function(name, value, options) {
		if(typeof name !== 'string' || !name) {
			return;
		}
		options = options || {};
		var date = options.expires, str = name + '=' + value;
		if(typeof date === 'number') {
			date = new Date();
			date.setTime(date.getTime() + options.expires);
		}
		if(date instanceof Date) {
			str += '; expires=' + date.toUTCString();
		}
		if(options.domain) {
			str += '; domain=' + options.domain;
		}
		if(options.path) {
			str += '; path=' + options.path;
		}
		if(options.secure) {
			str += '; secure'
		}

		document.cookie = str;
		return str;
	};

	g.$utils = utils;
})(this);