
'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const code = require('config/code.js')
const message = require('config/message.js')
const json = require('config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.index = async (event, context) => {
    const table = process.env.item_table
    const pk =  'resource'
    const query = event.queryStringParameters || {pageSize: 50, pk: '', sk: ''}
    console.log(query, 'query===')
    const key = query.key || {}
    const pageSize = query.pageSize || 50
    let params = {
      ExpressionAttributeValues: {
        ':sk': pk,
        ':pk': 'rse-',
        ":status": 1
      },
      ExpressionAttributeNames: {
        '#status': 'status'
    },
      KeyConditionExpression: 'sk = :sk and begins_with(pk , :pk)',
      FilterExpression: '#status =:status',
      TableName: table,
      IndexName: 'GSI1',
      ScanIndexForward: true,
      Limit: pageSize,
    }
    // console.log('key', key)
    // if (Object.keys(key).length > 0) {
    //   params.ExclusiveStartKey = key
    // }

    if (query.pk != '' && query.sk != '') {
      params.ExclusiveStartKey = {
        pk: query.pk,
        sk: query.sk
      }
    }
    try {
      const data = await dynamoDb.query(params).promise()
      const results = data.Items.map(item => {
        // let mDate = {
        //   id: item.pk,
        //   ...item
        // } 
        let mDate = {
          id: item.pk,
          title: item.title,
          type: item.type,
          feature: item.feature,
          image: item.image
        } 
  
        return mDate
      })
      const sortedData = results.sort(function (a, b) {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      })
      return {
        statusCode: code.httpStatus.OK,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.OK, sortedData, message.msg.FetchSuccessed, '', 1,{}, data.LastEvaluatedKey)
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

  module.exports.detail = async (event, context) => {
    const table = process.env.item_table
    const query = event.queryStringParameters 
    let params = {
      ExpressionAttributeValues: {
        ':pk': query.id,
        ':sk': 'resource',
        ":status": 1
      },
      ExpressionAttributeNames: {
        '#status': 'status'
    },
      KeyConditionExpression: 'pk = :pk and sk = :sk',
      FilterExpression: '#status =:status',
      TableName: table,
    }
    try {
      const data = await dynamoDb.query(params).promise()
      const results = data.Items.map(item => {
        let mDate = {
          id: item.pk,
          ...item
        } 
  
        return mDate
      })
      const sortedData = results.sort(function (a, b) {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      })
      return {
        statusCode: code.httpStatus.OK,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.OK, sortedData, message.msg.FetchSuccessed, '', 1,{}, data.LastEvaluatedKey)
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

