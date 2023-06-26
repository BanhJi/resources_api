'use strict'

module.exports.responseBody = function (code, data, msg, error, total, result, lastEvaluatedKey = '', consumedCapacity = {}) {
  return JSON.stringify(
    {
      statusCode: code,
      data: data,
      result: result,
      message: msg,
      key: lastEvaluatedKey,
      error: error,
      total: total,
      consumedCapacity: consumedCapacity
    }
  )
}
