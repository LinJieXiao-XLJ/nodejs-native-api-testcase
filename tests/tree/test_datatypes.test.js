/**
 * Title：树模型-数据类型
 * Describe：验证 @iotdb/client 导出的 TSDataType 枚举
 */
'use strict';
const { TSDataType, getDataTypeName } = require('../../lib/@iotdb/client/index.js');

describe('TSDataType 枚举', () => {
  test('10种类型值正确', () => {
    expect(TSDataType.BOOLEAN).toBe(0);
    expect(TSDataType.INT32).toBe(1);
    expect(TSDataType.INT64).toBe(2);
    expect(TSDataType.FLOAT).toBe(3);
    expect(TSDataType.DOUBLE).toBe(4);
    expect(TSDataType.TEXT).toBe(5);
    expect(TSDataType.TIMESTAMP).toBe(8);
    expect(TSDataType.DATE).toBe(9);
    expect(TSDataType.BLOB).toBe(10);
    expect(TSDataType.STRING).toBe(11);
  });

  test('getDataTypeName 返回类型名', () => {
    expect(getDataTypeName(0)).toBe('BOOLEAN');
    expect(getDataTypeName(2)).toBe('INT64');
    expect(getDataTypeName(5)).toBe('TEXT');
    expect(getDataTypeName(10)).toBe('BLOB');
    expect(getDataTypeName(999)).toBe('UNKNOWN');
  });

  test('INT64 用 bigint', () => {
    expect(typeof BigInt(9223372036854775807n)).toBe('bigint');
  });
});
