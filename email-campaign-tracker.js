/**
 * 邮件活动访问追踪：
 * - 优先识别 ?ec=<base64-json> 单参数（绕过中转把 & 拆散的问题）
 * - 也兼容散落的 utm_* 参数
 * - 触发后清理 URL
 */
(function () {
  try {
    if (typeof window === 'undefined') return;

    var EMAIL_TRACK_KEYS = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'campaign_label',
    ];
    var EMAIL_CLEAN_KEYS = EMAIL_TRACK_KEYS.concat(['ec']);

    function decodeCompact(ec) {
      if (!ec) return null;
      try {
        var padded = ec + '==='.slice(0, (4 - (ec.length % 4)) % 4);
        var standard = padded.replace(/-/g, '+').replace(/_/g, '/');
        var obj = JSON.parse(atob(standard));
        return obj && typeof obj === 'object' ? obj : null;
      } catch (_) {
        return null;
      }
    }

    var params = new URLSearchParams(window.location.search);
    var compact = decodeCompact(params.get('ec'));

    function getParam(key) {
      return (compact && compact[key]) || params.get(key) || null;
    }

    var utmMedium = getParam('utm_medium');
    if (utmMedium !== 'email' && utmMedium !== 'edm') return;

    var payload = {};
    EMAIL_TRACK_KEYS.forEach(function (key) {
      var v = getParam(key);
      if (v) payload[key] = v;
    });
    console.log('[email-campaign-tracker] detected, payload:', payload);

    // 标准 Mixpanel SDK 加载片段
    (function (e, c) {
      if (!c.__SV) {
        var l, h;
        window.mixpanel = c;
        c._i = [];
        c.init = function (q, r, f) {
          function t(d, a) {
            var g = a.split('.');
            2 == g.length && ((d = d[g[0]]), (a = g[1]));
            d[a] = function () {
              d.push([a].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          var b = c;
          'undefined' !== typeof f ? (b = c[f] = []) : (f = 'mixpanel');
          b.people = b.people || [];
          b.toString = function (d) {
            var a = 'mixpanel';
            'mixpanel' !== f && (a += '.' + f);
            d || (a += ' (stub)');
            return a;
          };
          b.people.toString = function () {
            return b.toString(1) + '.people (stub)';
          };
          l = 'disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove'.split(' ');
          for (h = 0; h < l.length; h++) t(b, l[h]);
          c._i.push([q, r, f]);
        };
        c.__SV = 1.2;
        var k = e.createElement('script');
        k.type = 'text/javascript';
        k.async = true;
        k.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
        var s = e.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(k, s);
      }
    })(document, window.mixpanel || []);

    window.mixpanel.init('a5d2467fc60284b84678487fb69210ab', { autocapture: false });
    window.mixpanel.track('email_campaign_visit', payload);
    console.log('[email-campaign-tracker] event queued');

    // 1 秒后清理 URL，给 Mintlify 的 pageview 留出读取参数的时间
    setTimeout(function () {
      EMAIL_CLEAN_KEYS.forEach(function (key) {
        params.delete(key);
      });
      var newSearch = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname +
          (newSearch ? '?' + newSearch : '') +
          window.location.hash,
      );
    }, 1000);
  } catch (e) {
    console.log('[email-campaign-tracker] error:', e);
  }
})();
