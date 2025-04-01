const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户的会员信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        isVip: false,
        vipLevel: 0,
        expireTime: null
      }
    }

    const user = userResult.data[0]
    const now = new Date().getTime()

    // 检查会员是否过期
    if (!user.vipExpireTime || user.vipExpireTime < now) {
      return {
        isVip: false,
        vipLevel: 0,
        expireTime: null
      }
    }

    return {
      isVip: true,
      vipLevel: user.vipLevel || 1,
      expireTime: user.vipExpireTime
    }
  } catch (err) {
    console.error(err)
    return {
      isVip: false,
      vipLevel: 0,
      expireTime: null,
      errMsg: err.message
    }
  }
}