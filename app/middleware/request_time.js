'use strict';

const Redis = require('ioredis');
const debug = require('debug')('requestime');
const utils = require('../utils');
const path = require('path');
const pug = require('pug');

module.exports = options => {

  const redis = new Redis(options.redis);

  return async function requestTimeMiddleware(ctx, next) {
    if (ctx.method === 'HEAD') {
      return next();
    }

    if (ctx.url.startsWith('/m/request_times')) {
      const tpl = path.join(__dirname, '../view/request_time/index.pug');
      const compiler = pug.compileFile(tpl, {});
      const data = await ctx.service.requestTime.data(new Date());
      return ctx.body = compiler({
        title: '请求耗时统计',
        data,
      });
    }

    const time = Date.now();
    await next();
    report(ctx, redis, Date.now() - time);
  };
};

function report(ctx, redis, time) {
  if (!redis) {
    debug('no redis config');
  }

  if (ctx._matchedRoute) {
    const hour = utils.formatDatetimeWithoutMinutesAndSeconds();
    const url = `[${ctx.method}]${ctx._matchedRoute}`;

    debug(url, time);

    const key = `req:urls:${hour}`;
    redis.pipeline()
      .hincrby(key, `${url}:times`, time)
      .hincrby(key, `${url}:count`, 1)
      .expire(key, 86400 * 3)
      .exec();
  }
}
