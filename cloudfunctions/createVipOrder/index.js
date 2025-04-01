const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { vipLevel, months } = event

  try {
    // 获取会员配置信息
    const vipConfigResult = await db.collection('vipConfigs').where({
      level: vipLevel
    }).get()

    if (vipConfigResult.data.length === 0) {
      return {
        success: false,
        errMsg: '无效的会员等级'
      }
    }

    const vipConfig = vipConfigResult.data[0]
    const totalFee = vipConfig.monthlyPrice * months

    // 创建订单
    const order = {
      _openid: openid,
      vipLevel,
      months,
      totalFee,
      status: 'pending',
      createTime: new Date(),
      payTime: null
    }

    const orderResult = await db.collection('orders').add({
      data: order
    })

    // 调用支付接口
    const payment = await cloud.cloudPay.unifiedOrder({
      body: `会员购买-${vipLevel}级-${months}个月`,
      outTradeNo: orderResult._id,
      spbillCreateIp: event.userIp,
      subMchId: 'your_merchant_id',
      totalFee: totalFee * 100,
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'payCallback'
    })

    return {
      success: true,
      orderInfo: {
        ...order,
        _id: orderResult._id
      },
      payment
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}