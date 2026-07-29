/**
 * Title：树模型-查询结果
 * Describe：SessionDataSet 迭代器模式
 */
'use strict';
const { SessionDataSet } = require('../../lib/@iotdb/client/index.js');

describe('SessionDataSet 查询结果集', () => {
  test('SessionDataSet 类型可导入', () => {
    expect(typeof SessionDataSet).toBe('function');
  });
});
