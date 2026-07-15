const Response = require('../../src/utils/response');

describe('Response 工具类', () => {
  // ====== success ======
  describe('success', () => {
    it('应返回 { code: 200, data, msg }', () => {
      const res = Response.success({ id: 1 }, '操作成功');
      expect(res).toEqual({ code: 200, data: { id: 1 }, msg: '操作成功' });
    });

    it('默认值应正确', () => {
      const res = Response.success();
      expect(res).toEqual({ code: 200, data: null, msg: '操作成功' });
    });
  });

  // ====== created ======
  describe('created', () => {
    it('应返回 { code: 201, data, msg }', () => {
      const res = Response.created({ id: 1 }, '创建成功');
      expect(res).toEqual({ code: 201, data: { id: 1 }, msg: '创建成功' });
    });

    it('默认值应正确', () => {
      const res = Response.created();
      expect(res).toEqual({ code: 201, data: null, msg: '创建成功' });
    });
  });

  // ====== badRequest ======
  describe('badRequest', () => {
    it('应返回 { code: 400, data, msg }', () => {
      const res = Response.badRequest('参数错误', { field: 'name' });
      expect(res).toEqual({ code: 400, data: { field: 'name' }, msg: '参数错误' });
    });

    it('默认值应正确', () => {
      const res = Response.badRequest();
      expect(res).toEqual({ code: 400, data: null, msg: '请求参数错误' });
    });
  });

  // ====== unauthorized ======
  describe('unauthorized', () => {
    it('应返回 { code: 401, data: null, msg }', () => {
      const res = Response.unauthorized('请先登录');
      expect(res).toEqual({ code: 401, data: null, msg: '请先登录' });
    });

    it('默认值应正确', () => {
      const res = Response.unauthorized();
      expect(res).toEqual({ code: 401, data: null, msg: '未授权访问' });
    });
  });

  // ====== notFound ======
  describe('notFound', () => {
    it('应返回 { code: 404, data: null, msg }', () => {
      const res = Response.notFound('资源不存在');
      expect(res).toEqual({ code: 404, data: null, msg: '资源不存在' });
    });

    it('默认值应正确', () => {
      const res = Response.notFound();
      expect(res).toEqual({ code: 404, data: null, msg: '请求的资源不存在' });
    });
  });

  // ====== error ======
  describe('error', () => {
    it('应返回 { code: 500, data, msg }', () => {
      const res = Response.error('服务器错误', { detail: 'db error' });
      expect(res).toEqual({ code: 500, data: { detail: 'db error' }, msg: '服务器错误' });
    });

    it('默认值应正确', () => {
      const res = Response.error();
      expect(res).toEqual({ code: 500, data: null, msg: '服务器内部错误' });
    });
  });

  // ====== serviceUnavailable ======
  describe('serviceUnavailable', () => {
    it('应返回 { code: 503, data: null, msg }', () => {
      const res = Response.serviceUnavailable('服务维护中');
      expect(res).toEqual({ code: 503, data: null, msg: '服务维护中' });
    });

    it('默认值应正确', () => {
      const res = Response.serviceUnavailable();
      expect(res).toEqual({ code: 503, data: null, msg: '服务暂不可用' });
    });
  });

  // ====== 统一结构验证 ======
  it('所有方法返回的对象应包含 code, data, msg 字段', () => {
    const methods = ['success', 'created', 'badRequest', 'unauthorized', 'notFound', 'error', 'serviceUnavailable'];
    methods.forEach((method) => {
      const res = Response[method]();
      expect(res).toHaveProperty('code');
      expect(res).toHaveProperty('data');
      expect(res).toHaveProperty('msg');
    });
  });
});
