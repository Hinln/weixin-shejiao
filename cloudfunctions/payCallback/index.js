const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { outTradeNo, transactionId, resultCode } = event

    if (resultCode !== 'SUCCESS') {
      return {
        success: false,
        errMsg: '支付失败'
      }
    }

    // 查询订单信息
    const orderResult = await db.collection('orders').doc(outTradeNo).get()
    const order = orderResult.data

    if (!order) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }

    if (order.status === 'paid') {
      return {
        success: true,
        message: '订单已处理'
      }
    }

    // 更新订单状态
    await db.collection('orders').doc(outTradeNo).update({
      data: {
        status: 'paid',
        payTime: new Date(),
        transactionId
      }
    })

    // 更新用户会员信息
    const userResult = await db.collection('users').where({
      _openid: order._openid
    }).get()

    const user = userResult.data[0]
    const now = new Date().getTime()
    const expireTime = user.vipExpireTime && user.vipExpireTime > now
      ? user.vipExpireTime + (order.months * 30 * 24 * 60 * 60 * 1000)
      : now + (order.months * 30 * 24 * 60 * 60 * 1000)

    await db.collection('users').where({
      _openid: order._openid
    }).update({
      data: {
        vipLevel: order.vipLevel,
        vipExpireTime: expireTime
      }
    })

    return {
      success: true,
      message: '支付成功'
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}