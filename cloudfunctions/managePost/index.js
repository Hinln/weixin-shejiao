const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, postData } = event

  try {
    switch (action) {
      case 'create':
        // 检查用户发帖权限
        const userResult = await db.collection('users').where({
          _openid: openid
        }).get()

        if (userResult.data.length === 0) {
          return {
            success: false,
            errMsg: '用户不存在'
          }
        }

        const user = userResult.data[0]
        const now = new Date()
        const today = now.toDateString()

        // 非会员用户检查每日发帖限制
        if (!user.isVip && user.dailyPostCount >= 5 && user.lastCountUpdate === today) {
          return {
            success: false,
            errMsg: '今日发帖次数已达上限'
          }
        }

        // 创建动态
        const newPost = {
          _openid: openid,
          ...postData,
          createTime: now,
          status: 'active',
          likeCount: 0,
          commentCount: 0,
          reportCount: 0
        }

        const postResult = await db.collection('posts').add({
          data: newPost
        })

        // 更新用户发帖计数
        if (!user.isVip) {
          await db.collection('users').where({
            _openid: openid
          }).update({
            data: {
              dailyPostCount: db.command.inc(1),
              lastCountUpdate: today
            }
          })
        }

        return {
          success: true,
          data: {
            ...newPost,
            _id: postResult._id
          }
        }

      case 'delete':
        // 删除动态
        const { postId } = postData
        await db.collection('posts').doc(postId).remove()

        // 删除相关的图片
        if (postData.images && postData.images.length > 0) {
          await cloud.deleteFile({
            fileList: postData.images.map(img => img.fileID)
          })
        }

        return {
          success: true
        }

      case 'report':
        // 举报动态
        const { reportReason } = postData
        await db.collection('reports').add({
          data: {
            postId: postData.postId,
            reporterId: openid,
            reason: reportReason,
            createTime: now,
            status: 'pending'
          }
        })

        // 更新动态举报计数
        await db.collection('posts').doc(postData.postId).update({
          data: {
            reportCount: db.command.inc(1)
          }
        })

        return {
          success: true
        }

      case 'getList':
        // 获取动态列表
        const { page = 1, pageSize = 10 } = postData
        const skip = (page - 1) * pageSize

        const posts = await db.collection('posts')
          .where({
            status: 'active'
          })
          .orderBy('createTime', 'desc')
          .skip(skip)
          .limit(pageSize)
          .get()

        return {
          success: true,
          data: posts.data
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