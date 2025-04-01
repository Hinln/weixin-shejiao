const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, userData } = event

  try {
    switch (action) {
      case 'register':
        // 检查用户是否已存在
        const existUser = await db.collection('users').where({
          _openid: openid
        }).get()

        if (existUser.data.length > 0) {
          return {
            success: false,
            errMsg: '用户已存在'
          }
        }

        // 创建新用户
        const newUser = {
          _openid: openid,
          ...userData,
          createTime: new Date(),
          isVip: false,
          vipLevel: 0,
          vipExpireTime: null,
          isAdmin: false,
          status: 'active',
          dailyPostCount: 0,
          dailyGreetCount: 0,
          lastCountUpdate: new Date().toDateString()
        }

        await db.collection('users').add({
          data: newUser
        })

        return {
          success: true,
          data: newUser
        }

      case 'update':
        // 更新用户信息
        await db.collection('users').where({
          _openid: openid
        }).update({
          data: userData
        })

        return {
          success: true
        }

      case 'get':
        // 获取用户信息
        const userResult = await db.collection('users').where({
          _openid: openid
        }).get()

        if (userResult.data.length === 0) {
          return {
            success: false,
            errMsg: '用户不存在'
          }
        }

        return {
          success: true,
          data: userResult.data[0]
        }

      default:
        return {
          success: false,
          errMsg: '无效的操作类型'
        }
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      errMsg: err.message
    }
  }
}