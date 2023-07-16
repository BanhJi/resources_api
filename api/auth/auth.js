'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const message = require('config/message.js')
const json = require('config/response.js')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const code = require('config/code.js')
// const uuid = require('uuid')
// const jwt = require('../function/jwt.js')
var jwt = require('jsonwebtoken');
const key = "abdfsfdfd*&*9898"

module.exports.create = async (event) => {
  try {
    const table = process.env.item_table
    const timestamp = new Date().toISOString()
    const data = JSON.parse(event.body)
      const sk =  data.email
      const head =  data.email
      const param = {
        TableName: table,
        Item: {
          pk: head,
          sk: sk,
          ...data ,
          type: data.type,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      }
      await dynamoDb.put(param).promise()
      return {
        statusCode: code.httpStatus.Created,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.Created, param.Item, message.msg.ItemCreatedSuccessed, '', 1)
      }

  } catch (error) {
    console.log('ERROR on nbcAddExchangeRate', error)
  }

}

module.exports.login = async (event, context) => {
  const table = process.env.item_table
  const data = JSON.parse(event.body)
  let params = {
    ExpressionAttributeValues: {
      ':sk': data.email,
      ':pk': data.email
    },
    KeyConditionExpression: 'sk = :sk and pk = :pk',
    TableName: table
  }
  try {
    const data = await dynamoDb.query(params).promise()
    const results = data.Items.map(item => {
      let mDate = {
        id: item.pk,
        ...item
      } 
      delete item.pk
      return mDate
    })

    if(results.length > 0 ) {
      var token = await jwt.sign({email: results[0].email }, key);
      results[0]['token'] = token
      return {
        statusCode: code.httpStatus.OK,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1,{}, data.LastEvaluatedKey)
      }
    }
  
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}

module.exports.me = async (event, context) => {
  const table = process.env.item_table
  const query = event.queryStringParameters || {pageSize: 50, pk: '', sk: ''}
  console.log(query);
  var token  = await jwt.verify(query.token, key);
  console.log('verify', token);
  let params = {
    ExpressionAttributeValues: {
      ':sk': token.email,
      ':pk': token.email
    },
    KeyConditionExpression: 'sk = :sk and pk = :pk',
    TableName: table
  }
  try {
    const data = await dynamoDb.query(params).promise()
    const results = data.Items.map(item => {
      let mDate = {
        id: item.pk,
        ...item
      } 
      delete item.pk
      return mDate
    })

    if(results.length > 0 ) {
      return {
        statusCode: code.httpStatus.OK,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1,{}, data.LastEvaluatedKey)
      }
    }
  
  } catch (error) {
    return {
      statusCode: code.httpStatus.Unauthorized,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Unauthorized, [], message.msg.FetchFailed, error, 0)
    }
  }
}


