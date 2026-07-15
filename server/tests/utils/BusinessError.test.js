const BusinessError = require('../../src/utils/BusinessError');

describe('BusinessError 类', () => {
  it('应继承 Error 类', () => {
    const err = new BusinessError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('应设置 name 为 BusinessError', () => {
    const err = new BusinessError('test');
    expect(err.name).toBe('BusinessError');
  });

  it('应正确设置 message', () => {
    const err = new BusinessError('自定义错误消息');
    expect(err.message).toBe('自定义错误消息');
  });

  it('应正确设置 status（第二个参数）', () => {
    const err = new BusinessError('资源不存在', 404);
    expect(err.status).toBe(404);
  });

  it('应正确设置 data（第三个参数）', () => {
    const err = new BusinessError('参数错误', 400, { field: 'name' });
    expect(err.data).toEqual({ field: 'name' });
  });

  it('未传 status 时应默认为 400', () => {
    const err = new BusinessError('默认错误');
    expect(err.status).toBe(400);
  });

  it('未传 data 时应默认为 null', () => {
    const err = new BusinessError('默认错误');
    expect(err.data).toBeNull();
  });

  it('无参数构造时 message 应为空字符串', () => {
    const err = new BusinessError();
    expect(err.message).toBe('');
  });

  it('status 和 data 应保持独立实例', () => {
    const err1 = new BusinessError('错误1', 400, { a: 1 });
    const err2 = new BusinessError('错误2', 500, { b: 2 });
    expect(err1.status).toBe(400);
    expect(err1.data).toEqual({ a: 1 });
    expect(err2.status).toBe(500);
    expect(err2.data).toEqual({ b: 2 });
    // 修改 err2 不应影响 err1
    err2.data.b = 999;
    expect(err1.data).toEqual({ a: 1 });
  });
});
