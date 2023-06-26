'use strict'
/* eslint-disable */
const AWS = require('aws-sdk')
const message = require('config/message.js')
const json = require('config/response.js')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const code = require('config/code.js')
const uuid = require('uuid')
const axios = require('axios')

module.exports.index = async (event) => {
  try {
    const table = process.env.item_table
    const timestamp = new Date().toISOString()
    const data = JSON.parse(event.body)
      let head = 'rse-'
      if (data.id === undefined || data.id === '') {
        head = 'rse-' + data.transaction_id
      } else {
        head = data.id
      }
      const pk =  event.pathParameters.institute_id
      const param = {
        TableName: table,
        Item: {
          pk: pk,
          sk: head,
          ...data ,
          type: data.type,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      }
      await dynamoDb.put(param).promise()
      console.log(' notification' , param.Item)
      await onSendNotification(param.Item);
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
