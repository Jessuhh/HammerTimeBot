import moment from 'moment-timezone';
import {
  adjustMoment,
  constrain,
  findTimezone,
  formattedResponse,
  gmtTimezoneOptions,
  pad,
  supportedFormats,
} from './time.js';
import { MessageTimestamp, MessageTimestampFormat } from './message-timestamp.js';
import { TimezoneError } from './timezone-error.js';
import { ResponseColumnChoices } from '../types/localization.js';

describe('time utils', () => {
  const nowInSeconds = 1650802953;
  const now = new Date(nowInSeconds * 1e3);
  const ts = new MessageTimestamp(now);

  describe('pad', () => {
    it('should pad to the specified length with zeroes', () => {
      expect(pad(0, 2)).toEqual('00');
      expect(pad(1, 2)).toEqual('01');
      expect(pad(2, 4)).toEqual('0002');
    });

    it('should stringify sufficiently long numbers without padding', () => {
      expect(pad(10, 2)).toEqual('10');
      expect(pad(100, 3)).toEqual('100');
      expect(pad(9999, 4)).toEqual('9999');
    });

    it('should stringify longer numbers', () => {
      expect(pad(10, 1)).toEqual('10');
      expect(pad(100, 2)).toEqual('100');
      expect(pad(9999, 3)).toEqual('9999');
    });
  });

  describe('findTimezone', () => {
    it('should find exact match', () => {
      expect(findTimezone('GMT')).toEqual(gmtTimezoneOptions);
      expect(findTimezone('gmt')).toEqual(gmtTimezoneOptions);
      expect(findTimezone('cet')).toEqual(['CET']);
    });

    it('should find partial match', () => {
      expect(findTimezone('gmt+')).toEqual(['GMT+1', 'GMT+2', 'GMT+3', 'GMT+4', 'GMT+5', 'GMT+6', 'GMT+7', 'GMT+8', 'GMT+9', 'GMT+10', 'GMT+11', 'GMT+12', 'GMT+13', 'GMT+14', 'GMT+15', 'GMT+16']);
      expect(findTimezone('gmt+2')).toEqual(['GMT+2']);
      expect(findTimezone('gmt-1')).toEqual(['GMT-1', 'GMT-10', 'GMT-11', 'GMT-12', 'GMT-13', 'GMT-14', 'GMT-15', 'GMT-16']);
      expect(findTimezone('gmt-12')).toEqual(['GMT-12']);
      expect(findTimezone('budapest')).toEqual(['Europe/Budapest']);
      expect(findTimezone('london')).toEqual(['Europe/London']);
      expect(findTimezone('los angeles')).toEqual(['America/Los_Angeles']);
      expect(findTimezone('buenos aires')).toEqual(['America/Buenos_Aires', 'America/Argentina/Buenos_Aires']);
      expect(findTimezone('madrid')).toEqual(['Europe/Madrid']);
      expect(findTimezone('tokyo')).toEqual(['Asia/Tokyo']);
      expect(findTimezone('warsaw')).toEqual(['Europe/Warsaw']);
    });

    it('should throw on failure', () => {
      const invalidInput = 'neverland';
      expect(() => findTimezone(invalidInput)).toThrow(new TimezoneError(invalidInput));
    });
  });

  describe('formattedResponse', () => {
    it('should return all supported formats', () => {
      const actual = formattedResponse(ts, supportedFormats, ResponseColumnChoices.BOTH);
      expect(actual).toMatchSnapshot();
    });

    it('should return only requested format', () => {
      const actual = formattedResponse(ts, [MessageTimestampFormat.RELATIVE], ResponseColumnChoices.BOTH);
      expect(actual).toMatchSnapshot();
    });

    it('should return only previews', () => {
      const actual = formattedResponse(ts, supportedFormats, ResponseColumnChoices.PREVIEW_ONLY);
      expect(actual).toMatchSnapshot();
    });

    it('should return only syntaxes', () => {
      const actual = formattedResponse(ts, supportedFormats, ResponseColumnChoices.SYNTAX_ONLY);
      expect(actual).toMatchSnapshot();
    });

    it('should return preview only in requested format', () => {
      const actual = formattedResponse(ts, [MessageTimestampFormat.RELATIVE], ResponseColumnChoices.PREVIEW_ONLY);
      expect(actual).toMatchSnapshot();
    });
  });

  describe('adjustMoment', () => {
    it('should add the specified time', () => {
      const actual = adjustMoment({ hour: 10 }, 'add', now);
      const expected = moment(now).add(10, 'hour');
      expect(actual.hours()).toEqual(expected.hours());
    });

    it('should subtract the specified time', () => {
      const actual = adjustMoment({ day: 3 }, 'subtract', now);
      const expected = moment(now).subtract(3, 'day');
      expect(actual.days()).toEqual(expected.days());
    });
  });

  describe('constrain', () => {
    it('should work without upper bound', () => {
      expect(constrain(-1, 0)).toEqual(0);
      expect(constrain(0, 0)).toEqual(0);
      expect(constrain(10, 20)).toEqual(20);
      expect(constrain(20, 20)).toEqual(20);
      expect(constrain(1, 0)).toEqual(1);
      expect(constrain(22, 20)).toEqual(22);
    });

    it('should work with upper bound', () => {
      expect(constrain(-1, 0, 1)).toEqual(0);
      expect(constrain(0, 0, 1)).toEqual(0);
      expect(constrain(10, 20, 30)).toEqual(20);
      expect(constrain(20, 20, 30)).toEqual(20);
      expect(constrain(1, 0, 2)).toEqual(1);
      expect(constrain(22, 20, 25)).toEqual(22);

      expect(constrain(3, 0, 5)).toEqual(3);
      expect(constrain(5, 0, 5)).toEqual(5);
      expect(constrain(10, 0, 5)).toEqual(5);
    });
  });
});
