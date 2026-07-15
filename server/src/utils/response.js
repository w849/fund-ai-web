/**
 * 统一响应格式 { code, data, msg }
 */

class Response {
  /**
   * 成功响应
   */
  static success(data = null, msg = '操作成功') {
    return { code: 200, data, msg };
  }

  /**
   * 创建成功（201）
   */
  static created(data = null, msg = '创建成功') {
    return { code: 201, data, msg };
  }

  /**
   * 请求参数错误
   */
  static badRequest(msg = '请求参数错误', data = null) {
    return { code: 400, data, msg };
  }

  /**
   * 未授权
   */
  static unauthorized(msg = '未授权访问') {
    return { code: 401, data: null, msg };
  }

  /**
   * 资源不存在
   */
  static notFound(msg = '请求的资源不存在') {
    return { code: 404, data: null, msg };
  }

  /**
   * 服务器内部错误
   */
  static error(msg = '服务器内部错误', data = null) {
    return { code: 500, data, msg };
  }

  /**
   * 服务不可用
   */
  static serviceUnavailable(msg = '服务暂不可用') {
    return { code: 503, data: null, msg };
  }
}

module.exports = Response;
