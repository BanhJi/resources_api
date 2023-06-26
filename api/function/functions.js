const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()

let saleFormContent = async (instituteId) => {
    const table = process.env.item_table_entity
    const params = {
        ExpressionAttributeValues: {
            ':sk': instituteId,
            ':type': 'sfc-'
        },
        IndexName: 'GSI1',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :type)',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        return data.Items.map(item => {
            return {
                id: item.pk,
                serviceDate: item.serviceDate,
                serviceDateTo: item.serviceDateTo,
                discountItem: item.discountItem,
                specificTax: item.specificTax,
                otherTax: item.otherTax,
                publicLightingTax: item.publicLightingTax,
                saleUnit: item.saleUnit,
                modifier: item.modifier,
                employee: item.employee,
                decimal: item.decimal,
                saleQuote: item.saleQuote,
                saleOrder: item.saleOrder,
                email: item.email
            }
        })
    } catch (error) {
        return {}
    }
}
let supplierSetting = async (instituteId) => {
    const table = process.env.item_table_entity
    const params = {
        ExpressionAttributeValues: {
            ':sk': instituteId,
            ':type': 'pfc-'
        },
        IndexName: 'GSI1',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :type)',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        return data.Items.map(item => {
            return {
                id: item.pk,
                serviceDate: item.serviceDate ? item.serviceDate : false,
                serviceDateTo: item.serviceDateTo ? item.serviceDateTo : false,
                discountItem: item.discountItem ? item.discountItem : false,
                class1: item.class1 ? item.class1 : false,
                class2: item.class2 ? item.class2 : false,
                class3: item.class3 ? item.class3 : false,
                class4: item.class4 ? item.class4 : false,
                class5: item.class5 ? item.class5 : false,
                decimal: item.decimal ? item.decimal : 2
            }
        })
    } catch (error) {
        return []
    }
}
let companyInfo = async (instituteId) => {
    const table = process.env.item_table_entity
    const params = {
        ExpressionAttributeValues: {
            ':sk': instituteId,
            ':pk': instituteId
        },
        IndexName: 'GSI1',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        return data.Items.map(item => {
            return {
                id: item.pk,
                name: item.name ? item.name : '',
                customerFacingEmail: item.customerFacingEmail ? item.customerFacingEmail : '',
                timezone: item.timezone ? item.timezone : '',
                banhjiId: item.banhjiId ? item.banhjiId : '',
                vatNumber: item.vatNumber ? item.vatNumber : '',
                email: item.ownerEmail ? item.ownerEmail : '',
                phone: item.phone ? item.phone : '',
                fiscalDate: item.fiscalDate ? item.fiscalDate : {},
                baseCurrency: item.baseCurrency ? item.baseCurrency : {},
                reportingCurrency: item.reportingCurrency ? item.reportingCurrency : {},
                closingDate: item.closingDate ? item.closingDate : '',
                dateFormat: item.dateFormat ? item.dateFormat : 'dd-MM-yyyy'
            }
        })
    } catch (error) {
        return {}
    }
}
let deleteTransaction = async (txnId, relationsPrefix) => {
    const table = process.env.item_table
    const tableDashboard = process.env.item_table_dashboard
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': txnId,
                ':type': m
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            const timestamp = new Date().toISOString()
            data.Items.map(async item => {
                const updateParams = {
                    TableName: table,
                    Key: {
                        pk: txnId,
                        sk: item.sk
                    },
                    ExpressionAttributeValues: {
                        ':deleted': 1,
                        ':deletedAt': timestamp,
                    },
                    ExpressionAttributeNames: {
                        '#deleted': 'deleted',
                        '#deletedAt': 'deletedAt'
                    },
                    UpdateExpression: 'set #deleted = :deleted , #deletedAt = :deletedAt',
                    ReturnValues: 'UPDATED_NEW'
                }
                await dynamoDb.update(updateParams).promise()
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': txnId,
                ':type': m
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: tableDashboard
        }
        try {
            const data = await dynamoDb.query(params).promise()
            const timestamp = new Date().toISOString()
            data.Items.map(async item => {
                const updateParams = {
                    TableName: tableDashboard,
                    Key: {
                        pk: txnId,
                        sk: item.sk
                    },
                    ExpressionAttributeValues: {
                        ':deleted': 1,
                        ':deletedAt': timestamp,
                    },
                    ExpressionAttributeNames: {
                        '#deleted': 'deleted',
                        '#deletedAt': 'deletedAt'
                    },
                    UpdateExpression: 'set #deleted = :deleted , #deletedAt = :deletedAt',
                    ReturnValues: 'UPDATED_NEW'
                }
                await dynamoDb.update(updateParams).promise()
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
    await voidPublicLinkStatus(txnId)
}
let deleteTransactionSaleDeposit = async (txnId, relationsPrefix) => {
    const table = process.env.item_table
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': txnId,
                ':type': m
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            const timestamp = new Date().toISOString()
            data.Items.map(async item => {
                const updateParams = {
                    TableName: table,
                    Key: {
                        pk: txnId,
                        sk: item.sk
                    },
                    ExpressionAttributeValues: {
                        ':deleted': 1,
                        ':deletedAt': timestamp,
                    },
                    ExpressionAttributeNames: {
                        '#deleted': 'deleted',
                        '#deletedAt': 'deletedAt'
                    },
                    UpdateExpression: 'set #deleted = :deleted , #deletedAt = :deletedAt',
                    ReturnValues: 'UPDATED_NEW'
                }
                await dynamoDb.update(updateParams).promise()
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
}
let voidPaymentSchedule = async (txnId, relationsPrefix) => {
    const table = process.env.item_table
    const tableDashboard = process.env.item_table_dashboard
    const timestamp = new Date().toISOString()
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':sk': txnId,
                ':type': m
            },
            IndexName: 'sk-pk-index',
            KeyConditionExpression: 'sk = :sk and begins_with(pk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            data.Items.map(async item => {
                const updateParams = {
                    TableName: table,
                    Key: {
                        pk: item.pk,
                        sk: txnId
                    },
                    ExpressionAttributeValues: {
                        ':status': 4,
                        ':updatedAt': timestamp
                    },
                    ExpressionAttributeNames: {
                        '#status': 'status',
                        '#updatedAt': 'updatedAt'
                    },
                    UpdateExpression: 'set #status = :status , #updatedAt = :updatedAt',
                    ReturnValues: 'UPDATED_NEW'
                }
                await dynamoDb.update(updateParams).promise()
                await voidPaymentRelation(item.pk) // payment code
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':sk': txnId,
                ':type': m
            },
            IndexName: 'sk-pk-index',
            KeyConditionExpression: 'sk = :sk and begins_with(pk, :type)',
            TableName: tableDashboard
        }
        try {
            const data = await dynamoDb.query(params).promise()
            data.Items.map(async item => {
                const updateParams = {
                    TableName: tableDashboard,
                    Key: {
                        pk: item.pk,
                        sk: txnId
                    },
                    ExpressionAttributeValues: {
                        ':status': 4,
                        ':updatedAt': timestamp
                    },
                    ExpressionAttributeNames: {
                        '#status': 'status',
                        '#updatedAt': 'updatedAt'
                    },
                    UpdateExpression: 'set #status = :status , #updatedAt = :updatedAt',
                    ReturnValues: 'UPDATED_NEW'
                }
                await dynamoDb.update(updateParams).promise()
                await voidPaymentRelation(item.pk) // payment code
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
}
let voidPaymentRelation = async (id) => {
    const table = process.env.item_table
    const tableDashboard = process.env.item_table_dashboard
    const timestamp = new Date().toISOString()
    const params = {
        ExpressionAttributeValues: {
            ':pk': id,
            ':type': 'Invoice'
        },
        ExpressionAttributeNames: {
            '#type': 'type'
        },
        KeyConditionExpression: 'pk = :pk',
        FilterExpression: '#type = :type',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        data.Items.map(async item => {
            const updateParams = {
                TableName: table,
                Key: {
                    pk: item.pk,
                    sk: item.sk
                },
                ExpressionAttributeValues: {
                    ':status': 4,
                    ':updatedAt': timestamp
                },
                ExpressionAttributeNames: {
                    '#status': 'status',
                    '#updatedAt': 'updatedAt'
                },
                UpdateExpression: 'set #status = :status , #updatedAt = :updatedAt',
                ReturnValues: 'UPDATED_NEW'
            }
            await dynamoDb.update(updateParams).promise()
        })
    } catch (error) {
        console.log('error on update data', JSON.stringify(error))
    }

    const paramDashboard = {
        ExpressionAttributeValues: {
            ':pk': id,
            ':type': 'Invoice'
        },
        ExpressionAttributeNames: {
            '#type': 'type'
        },
        KeyConditionExpression: 'pk = :pk',
        FilterExpression: '#type = :type',
        TableName: tableDashboard
    }
    try {
        const data = await dynamoDb.query(paramDashboard).promise()
        data.Items.map(async item => {
            const updateParams = {
                TableName: tableDashboard,
                Key: {
                    pk: item.pk,
                    sk: item.sk
                },
                ExpressionAttributeValues: {
                    ':status': 4,
                    ':updatedAt': timestamp
                },
                ExpressionAttributeNames: {
                    '#status': 'status',
                    '#updatedAt': 'updatedAt'
                },
                UpdateExpression: 'set #status = :status , #updatedAt = :updatedAt',
                ReturnValues: 'UPDATED_NEW'
            }
            await dynamoDb.update(updateParams).promise()
        })
    } catch (error) {
        console.log('error on update data', JSON.stringify(error))
    }
}
let deleteRelationItem = async (txnId, relationsPrefix) => {
    const table = process.env.item_table
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': txnId,
                ':type': m
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            data.Items.map(async item => {
                const deleteParams = {
                    TableName: table,
                    Key: {
                        pk: txnId,
                        sk: item.sk
                    }
                }
                if (m === 'cus-') {
                    await deleteTxnCustomer(item.sk, txnId, ['dit-', 'sui-'])
                }
                // console.log('deleteRelation', deleteParams)
                await dynamoDb.delete(deleteParams).promise()
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
}
let deleteRelationItemSaleDeposit = async (txnId, relationsPrefix) => {
    const table = process.env.item_table
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': txnId,
                ':type': m
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            data.Items.map(async item => {
                const deleteParams = {
                    TableName: table,
                    Key: {
                        pk: txnId,
                        sk: item.sk
                    }
                }
                await dynamoDb.delete(deleteParams).promise()
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
}
let deleteTxnCustomer = async (customerId, txnId, relationsPrefix) => {
    const table = process.env.item_table
    for (const m of relationsPrefix) {
        const params = {
            ExpressionAttributeValues: {
                ':pk': customerId,
                ':type': m //dit , sui
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
            TableName: table
        }
        try {
            const data = await dynamoDb.query(params).promise()
            data.Items.filter(async itm => {
                const item = itm.sk
                if (item.includes('/' + txnId)) {
                    const deleteParams = {
                        TableName: table,
                        Key: {
                            pk: txnId,
                            sk: item
                        }
                    }
                    // console.log('deleteTxnCustomer', deleteParams)
                    await dynamoDb.delete(deleteParams).promise()
                }
            })
        } catch (error) {
            console.log('error on update data', JSON.stringify(error))
        }
    }
}
let voidPublicLinkStatus = async (txnId) => {
    const table = process.env.item_table
    const params = {
        ExpressionAttributeValues: {
            ':pk': txnId,
            ':type': 'pli-' //dit , sui
        },
        KeyConditionExpression: 'pk = :pk and begins_with(sk, :type)',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        const timestamp = new Date().toISOString()
        data.Items.map(async itm => {
            let item = itm.txnData
            item.status = 4
            item.deleted = 1
            item['deletedAt'] = timestamp
            const updateParams = {
                TableName: table,
                Key: {
                    pk: txnId,
                    sk: itm.sk
                },
                ExpressionAttributeValues: {
                    ':txnData': item
                },
                ExpressionAttributeNames: {
                    '#txnData': 'txnData'
                },
                UpdateExpression: 'set #txnData = :txnData ',
                ReturnValues: 'UPDATED_NEW'
            }
            await dynamoDb.update(updateParams).promise()
        })
    } catch (error) {
        console.log('error on update txnData', JSON.stringify(error))
    }
}
let recordPublicLinkOpen = async (txnId) => {
    const uuid = require('uuid')
    const table = process.env.item_table
    const timestamp = new Date().toISOString()
    try {
        const head = 'vli-'
        const viewLink = {
            pk: txnId,
            sk: head + uuid.v1(),
            count: 1,
            createdAt: timestamp,
            updatedAt: timestamp
        }
        const param = {
            TableName: table,
            Item: viewLink
        }
        await dynamoDb.put(param).promise()
    } catch (error) {
        console.log('error on update txnData', JSON.stringify(error))
    }
}
let paymentSchedule = async (txnId) => {
    const table = process.env.item_table
    const params = {
        ExpressionAttributeValues: {
            ':sk': txnId,
            ':pk': 'psc-',
            ':status': 2,
            ':type': 'Invoice',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
            '#type': 'type'
        },
        IndexName: 'sk-pk-index',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
        FilterExpression: '#status <=:status and #type =:type',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        return data.Items.map(item => {
            return {
                id: item.pk,
                amount: item.amount ? item.amount : 0,
                status: item.status ? item.status : 0,
                dueDate: item.dueDate ? item.dueDate : ''
            }
        })
    } catch (error) {
        return {}
    }
}
let nextPayment = async (txnId, status = 2) => {
    const table = process.env.item_table
    const params = {
        ExpressionAttributeValues: {
            ':sk': txnId,
            ':pk': 'psc-',
            ':status': status,
            ':type': 'Invoice',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
            '#type': 'type'
        },
        IndexName: 'sk-pk-index',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
        FilterExpression: '#status <=:status and #type =:type',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        let result = []
        for (const item of data.Items) {
            let paidAmt = 0
            if (item.status === 2) {
                paidAmt = await paidAmountByPaymentCode(item.pk)
            } else if (item.status === 3) {
                paidAmt = parseFloat(item.amount)
            }

            result.push({
                id: item.pk,
                amount: item.status === 1 ? item.amount : (parseFloat(item.amount) - paidAmt),
                status: item.status ? item.status : 0,
                dueDate: item.dueDate ? item.dueDate : ''
            })
        }
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(result)
            }, 1)
        })

    } catch (error) {
        console.log('nextPayment', error)
        return []
    }
}
let paidAmountByPaymentCode = async (paymentCode) => {
    const table = process.env.item_table
    const params = {
        ExpressionAttributeValues: {
            ':pk': paymentCode,
            ':sk': 'txn-',
            ':type': 'Cash Receipt',
            ':typeOffset': 'Offset Invoice',
        },
        ExpressionAttributeNames: {
            '#type': 'type'
        },
        KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        FilterExpression: '#type =:type or #type =:typeOffset',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        let paidAmount = 0, penalty = 0, discount = 0
        if (data) {
            data.Items.forEach(item => {
                paidAmount += parseFloat(item.paidAmount || 0)
                penalty += parseFloat(item.penalty || 0)
                discount += parseFloat(item.discount || 0)
            })
        }
        return paidAmount + discount - penalty
    } catch (error) {
        console.log('paidAmountByPaymentCode', error)
        return 0
    }

}
const numberGenerator = function (digit) {
    return Math.random().toFixed(digit).split('.')[1]
}
const transactionCurrency = async (code, txnDate, instituteId) => {
    const table = process.env.item_table_setting
    const params = {
        ExpressionAttributeValues: {
            ':sk': instituteId,
            ':pk': 'cur-',
            ':type': 'txn-c',
            ':code': code,
            ':effectiveDate': new Date(txnDate).toISOString().substr(0, 10),
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
    try {
        let items = []
        let results = []
        let sortedData = []

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
                    effectiveDate: item.effectiveDate ? item.effectiveDate : '',
                })
            })
            params.ExclusiveStartKey = items.LastEvaluatedKey
        } while (typeof items.LastEvaluatedKey != 'undefined')
        sortedData = results.sort(function (a, b) {
            return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        })
        return sortedData[0]
    } catch (error) {
        return {}
    }
}

let nextPaymentByVendor = async (item, status =2) => {
    try {
        const txnId = item.pk
        const table = process.env.item_table
        const params = {
            ExpressionAttributeValues: {
                ':sk': txnId,
                ':pk': 'ppc-',
                ':status': status,
                ':type': 'Purchase',
                ':type1': 'Expense',
            },
            ExpressionAttributeNames: {
                '#status': 'status',
                '#type': 'type'
            },
            IndexName: 'sk-pk-index',
            KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
            FilterExpression: '#status <=:status and (#type =:type or #type =:type1)',
            TableName: table
        }

        let result = []
        let paidAmt = 0
        const data = await dynamoDb.query(params).promise()
        for (const itm of data.Items) {
            if (itm.status === 2) {
                paidAmt = await paidAmountByCashPayment(itm.pk)
            } else if (itm.status === 3) {
                paidAmt = parseFloat(itm.amount)
            }

            result.push({
                id: itm.pk,
                amount: itm.status === 1 ? itm.amount : (parseFloat(itm.amount) - paidAmt),
                status: itm.status ? itm.status : 0,
                dueDate: itm.dueDate ? itm.dueDate : ''
            })
        }

        return new Promise(resolve => {
            setTimeout(() => {
                resolve(result)
            }, 1)
        })

    } catch (error) {
        console.log('nextPayment', error)
        return []
    }
}
let paidAmountByCashPayment = async (purchaseCode) => {
    const table = process.env.item_table
    const ppc = purchaseCode//item.pk
    const params = {
        ExpressionAttributeValues: {
            ':pk': ppc,
            ':sk': 'txn-',
            ':type': 'Cash Payment',
            ':typeOffset': 'Offset Purchase',
        },
        ExpressionAttributeNames: {
            '#type': 'type'
        },
        KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        FilterExpression: '#type =:type or #type =:typeOffset',
        TableName: table
    }
    try {
        const data = await dynamoDb.query(params).promise()
        let paidAmount = 0, discount = 0
        if (data) {
            data.Items.forEach(item => {
                paidAmount += parseFloat(item.paidAmount)
                discount += parseFloat(item.discount || 0)
            })
        }
        return paidAmount + discount
    } catch (error) {
        console.log('paidAmountByCashPayment', error)
        return 0
    }

}
const getItemLines = async (txnId, type) => {
    const table = process.env.item_table
    try {
        let params = {
            ExpressionAttributeValues: {
                ':sk': 'lin-',
                ':pk': txnId,
                ':deleted': 0,
                ':type': type,
            },
            ExpressionAttributeNames: {
                '#deleted': 'deleted',
                '#type': 'type',
            },
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
            FilterExpression: '#deleted = :deleted  and (#type =:type)',
            TableName: table
        }
        // console.log('params getItemLines', params)
        let items = []
        let results = []
        do {
            items = await dynamoDb.query(params).promise()
            items.Items.forEach(item => {
                let line = item.line || {}
                if (Object.keys(line).length > 0) {
                    line['txnId_'] = line.id || ''
                    line['isEditable'] = false
                    results.push(line)
                }
            })
            params.ExclusiveStartKey = items.LastEvaluatedKey
        } while (typeof items.LastEvaluatedKey != 'undefined')
        return results
    } catch (e) {
        console.log('error', JSON.stringify(e))
        return []
    }

}
const getPrefixType = async (instituteId, type) => {
    const table = process.env.item_table_setting
    const params = {
        ExpressionAttributeValues: {
            ':sk': instituteId,
            ':type': type,
            ':prefix': 'px-',
        },
        IndexName: 'GSI1',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :prefix)',
        FilterExpression: 'function_ = :type',
        TableName: table
    }
    const data = await dynamoDb.query(params).promise()
    return data.Items.map(item => {
        return {
            id: item.pk,
            abbr: item.abbr ? item.abbr : '',
            name: item.name ? item.name : '',
            function_: item.function_ ? item.function_ : '',
            number: item.number ? item.number : 1,
            module_: item.module_ ? item.module_ : '',
            format: item.format ? item.format : '',
            sequence: item.sequence ? item.sequence : 0,
            structure: item.structure ? item.structure : '',
            prefixSeparator: item.prefixSeparator ? item.prefixSeparator : '',
            numberSeparator: item.numberSeparator ? item.numberSeparator : '',
            sequcencing: item.sequcencing ? item.sequcencing : 'Year',
            suffix: item.suffix ? item.suffix : 0,
            type: item.type ? item.type : 0,
        }
    })
}
module.exports = {
    saleFormContent,
    supplierSetting,
    companyInfo,
    deleteTransaction,
    deleteTransactionSaleDeposit,
    voidPaymentSchedule,
    voidPaymentRelation,
    numberGenerator,
    deleteRelationItem,
    recordPublicLinkOpen,
    paymentSchedule,
    nextPayment,
    nextPaymentByVendor,
    transactionCurrency,
    deleteRelationItemSaleDeposit,
    paidAmountByPaymentCode,
    getItemLines,
    getPrefixType
}