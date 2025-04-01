const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户是否是管理员
    const userResult = await db.collection('users').where({
      _openid: openid,
      isAdmin: true
    }).get()

    return {
      isAdmin: userResult.data.length > 0
    }
  } catch (err) {
    console.error(err)
    return {
      isAdmin: false,
      errMsg: err.message
    }
  }
}