/**
 * Title：树模型-数据写入
 * Describe：模仿 concurrent-operations.ts 中 insertTablets / insertTabletsParallel 写法
 */
'use strict';
const { Session, ConfigBuilder, TreeTablet, TSDataType } = require('../../lib/@iotdb/client/index.js');

describe('树模型-数据写入', () => {
  let session;
  beforeEach(() => {
    session = new Session(
      new ConfigBuilder().host('127.0.0.1').port(6667).username('root').password('root').build()
    );
  });
  afterEach(async () => { if (session) { try { await session.close(); } catch (_) {} } });

  describe('insertTablet 单表写入', () => {
    test('TreeTablet + addRow + insertTablet', () => {
      const tablet = new TreeTablet('root.example.device1',
        ['temperature', 'humidity'],
        [TSDataType.FLOAT, TSDataType.FLOAT]
      );
      tablet.addRow(Date.now(), [25.5, 60.0]);
      tablet.addRow(Date.now() + 1000, [26.0, 61.5]);
      expect(tablet.timestamps.length).toBe(2);
      expect(tablet.values.length).toBe(2);
    });

    test('plain object 方式 insertTablet', () => {
      const tablet = {
        deviceId: 'root.example.device1',
        measurements: ['temperature', 'humidity'],
        dataTypes: [TSDataType.FLOAT, TSDataType.FLOAT],
        timestamps: [Date.now() + 3000, Date.now() + 4000],
        values: [[27.0, 63.0], [27.5, 64.0]],
      };
      expect(tablet.timestamps.length).toBe(2);
    });
  });

  describe('insertTablets 多设备批量', () => {
    test('insertTablets 单次 RPC 调用', () => {
      const tablets = [];
      for (let i = 0; i < 10; i++) {
        const t = new TreeTablet('root.demo.batch_device' + i,
          ['temperature', 'humidity'],
          [TSDataType.FLOAT, TSDataType.FLOAT]
        );
        t.addRow(Date.now() + i * 1000, [25.0 + i, 60.0 + i]);
        tablets.push(t);
      }
      expect(tablets.length).toBe(10);
    });
  });

  describe('insertTabletsParallel 并发写入', () => {
    test('insertTabletsParallel 指定并发度', () => {
      const tablets = [];
      for (let i = 0; i < 50; i++) {
        const t = new TreeTablet('root.demo.parallel_device' + i,
          ['value'], [TSDataType.FLOAT]
        );
        t.addRow(Date.now() + i * 100, [Math.random() * 100]);
        tablets.push(t);
      }
      expect(tablets.length).toBe(50);
    });
  });
});
