'use strict';

const Service = require('egg').Service;
const utils = require('../utils');
const Redis = require('ioredis');

class RequestTimeService extends Service {
  async data(date) {
    const options = this.app.config.requestTime;
    if (!options || !options.redis) return {};

    const redis = new Redis(options.redis);

    const day = typeof date === 'string' ? new Date(date) : date;
    day.setMinutes(0);
    day.setSeconds(0);
    const res = [];

    for (let i = 0; i < 24; i++) {
      day.setHours(i);
      const datetime = utils.formatDatetimeWithoutMinutesAndSeconds(day);
      const key = `req:urls:${datetime}`;
      const urls = await redis.hgetall(key);
      const keys = Object.keys(urls);
      const map = {};

      for (const key of keys) {
        let pre;
        let count = 0;
        let times = 0;

        if (key.endsWith(':times')) {
          pre = key.split(':times')[0];
          times = parseInt(urls[key]) || 0;
        } else if (key.endsWith(':count')) {
          pre = key.split(':count')[0];
          count = parseInt(urls[key]) || 0;
        }

        if (!pre) continue;

        const method = pre.split(']')[0].replace('[', '');
        const url = pre.split(']')[1];

        let val = map[url];
        if (!val) {
          val = { url, method, count: 0, times: 0, avgtimes: 0 };
          map[url] = val;
        }

        val.times += times;
        val.count += count;
      }

      let total = 0;
      let totaltimes = 0;
      const requests = Object.values(map);
      if (requests.length > 0) {
        requests.forEach(o => {
          o.avgtimes = o.times / o.count;
          total += o.count;
          totaltimes += o.times;
        });
      }

      res.push({
        datetime,
        total,
        avg: total > 0 ? totaltimes / total : 0,
        requests,
      });
    }

    return res;
  }
}

module.exports = RequestTimeService;
