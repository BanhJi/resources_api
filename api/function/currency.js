const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const currency = async (code, txnDate, type, instituteId) => {
  const table = process.env.item_table
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':pk': 'cur-',
      ':type': type,
      ':code': code,
      ':effectiveDate': txnDate
    },
    ExpressionAttributeNames: {
      '#type': 'type',
      '#effectiveDate': 'effectiveDate',
      '#code': 'code'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    FilterExpression: '#type = :type and #code =:code and #effectiveDate <= :effectiveDate',
    TableName: table
  }
  console.log(params)
  let sortedData = []
  let results = []
  let items = []
  do {
    items = await dynamoDb.query(params).promise()
    items.Items.forEach(item => {
      results.push({
        id: item.pk,
        code: item.code ? item.code : '',
        name: item.name ? item.name : '',
        symbol: item.symbol ? item.symbol : '',
        symbolNative: item.symbolNative ? item.symbolNative : '',
        rate: item.rate ? item.rate : 1,
        source: item.source ? item.source : '',
        method: item.method ? item.method : '',
        createdAt: item.createdAt ? item.createdAt : '',
        used: item.used ? item.used : 0,
        effectiveDate: item.effectiveDate ? item.effectiveDate : ''
      })
    })
    params.ExclusiveStartKey = items.LastEvaluatedKey
  } while (typeof items.LastEvaluatedKey !== 'undefined')
  sortedData = results.sort(function (a, b) {
    return Date.parse(b.effectiveDate) - Date.parse(a.effectiveDate)
  })
  if (sortedData.length > 0) {
    return sortedData[0]
  } else {
    return {}
  }
}
const lastTransactionCurrency = async (instituteId, code, type, effectiveDate = '') => {
  const table = process.env.item_table
  try {
    let keycondition = ''
    const xpressionAttributeValues = {}
    if (effectiveDate !== '') {
      keycondition = ' and gsi2 <=:gsi2 '
      xpressionAttributeValues[':gsi1'] = instituteId + '#' + type + '#' + code
      xpressionAttributeValues[':gsi2'] = effectiveDate + 'T23:59:59.999Z'
    } else {
      xpressionAttributeValues[':gsi1'] = instituteId + '#' + type + '#' + code
    }
    const params = {
      ExpressionAttributeValues: xpressionAttributeValues,
      IndexName: 'index1',
      ScanIndexForward: false,
      Limit: 1,
      KeyConditionExpression: 'gsi1 = :gsi1' + keycondition,
      TableName: table
    }
    console.log(params)
    const results = []
    let items = []
    items = await dynamoDb.query(params).promise()
    items.Items.forEach(item => {
      const objName = item.objName || {}
      const objExtra = item.objExtra || {}
      results.push({
        id: item.pk,
        code: objName.code || '',
        name: objName.name || '',
        symbol: objName.symbol || '',
        symbolNative: objName.native || '',
        rate: item.rate || 1,
        source: objExtra.source || '',
        method: objExtra.method || '',
        effectiveDate: objExtra.date || ''
      })
    })
    if (results.length > 0) {
      return results[0]
    } else {
      return {}
    }
  } catch (error) {
    console.log('ERROR on lastTransactionCurrency ', error)
    return {}
  }
}
const funcCurrency = async (instituteId) => {
  const table = process.env.item_table
  const type = 'fun-c'
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':pk': 'cur-',
      ':type': type
    },
    ExpressionAttributeNames: {
      '#type': 'type'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    FilterExpression: '#type = :type',
    TableName: table
  }
  let items = []
  const results = []
  do {
    items = await dynamoDb.query(params).promise()
    items.Items.forEach(item => {
      results.push({
        id: item.pk,
        code: item.code ? item.code : '',
        name: item.name ? item.name : ''
      })
    })
    params.ExclusiveStartKey = items.LastEvaluatedKey
  } while (typeof items.LastEvaluatedKey !== 'undefined')

  return results
}
module.exports = {
  currency,
  funcCurrency,
  lastTransactionCurrency
}
