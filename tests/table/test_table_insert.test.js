/**
 * Title：表模型 TableTablet 写入
 * Describe：模仿 table-session-pool.ts 中 TableTablet + addRow 流程
 */
'use strict';
const { TableTablet, ColumnCategory, TSDataType } = require('../../lib/@iotdb/client/index.js');

describe('表模型 TableTablet', () => {

  test('TableTablet 构造', () => {
    const tablet = new TableTablet('sensor_data',
      ['region_id', 'device_id', 'model', 'temperature', 'humidity'],
      [TSDataType.TEXT, TSDataType.TEXT, TSDataType.TEXT, TSDataType.FLOAT, TSDataType.DOUBLE],
      [ColumnCategory.TAG, ColumnCategory.TAG, ColumnCategory.ATTRIBUTE, ColumnCategory.FIELD, ColumnCategory.FIELD]
    );
    expect(tablet.tableName).toBe('sensor_data');
    expect(tablet.columnNames.length).toBe(5);
    expect(tablet.columnCategories.length).toBe(5);
  });

  test('TableTablet addRow 添加数据', () => {
    const tablet = new TableTablet('sensor_data',
      ['region_id', 'device_id', 'model', 'temperature', 'humidity'],
      [TSDataType.TEXT, TSDataType.TEXT, TSDataType.TEXT, TSDataType.FLOAT, TSDataType.DOUBLE],
      [ColumnCategory.TAG, ColumnCategory.TAG, ColumnCategory.ATTRIBUTE, ColumnCategory.FIELD, ColumnCategory.FIELD]
    );
    tablet.addRow(Date.now(), ['region1', 'device001', 'ModelA', 25.5, 60.0]);
    tablet.addRow(Date.now() + 1000, ['region1', 'device001', 'ModelA', 26.0, 61.5]);
    expect(tablet.timestamps.length).toBe(2);
    expect(tablet.values.length).toBe(2);
    expect(tablet.values[0]).toEqual(['region1', 'device001', 'ModelA', 25.5, 60.0]);
  });

  test('参数长度不一致抛异常', () => {
    expect(() => new TableTablet('t', ['a', 'b'], [5, 5], [0])).toThrow();
  });
});
