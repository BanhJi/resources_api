
'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const code = require('config/code.js')
const message = require('config/message.js')
const json = require('config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.index = async (event, context) => {
    const table = process.env.item_table
    const pk =  event.pathParameters.institute_id
    const query = event.queryStringParameters
    console.log(query)
    let params = {
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'nti-'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk , :sk)',
      TableName: table
    }
    if(query.isReciver == 'true'){
      params = {
        ExpressionAttributeValues: {
          ':receiver': pk,
          ':status': 0
        },
        KeyConditionExpression: 'receiver = :receiver',
        IndexName: 'receiver-index',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        FilterExpression: '#status = :status',
        TableName: table
      }
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
      const sortedData = results.sort(function (a, b) {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      })
      return {
        statusCode: code.httpStatus.OK,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // to allow cross origin access
        },
        body: json.responseBody(code.httpStatus.OK, sortedData, message.msg.FetchSuccessed, '', 1)
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

