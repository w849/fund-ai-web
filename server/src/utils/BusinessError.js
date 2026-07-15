/**
 * 业务异常类
 */
class BusinessError extends Error {
  constructor(message, status = 400, data = null) {
    super(message);
    this.name = 'BusinessError';
    this.status = status;
    this.data = data;
  }
}

module.exports = BusinessError;
