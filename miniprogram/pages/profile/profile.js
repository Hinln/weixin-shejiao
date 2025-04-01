const app = getApp()

Page({
  data: {
    userInfo: {},
    isVip: false,
    isAdmin: false,
    stats: {
      posts: 0,
      friends: 0,
      likes: 0
    }
  },

  onLoad() {
    this.getUserInfo()
    this.getStats()
    this.checkVipStatus()
    this.checkAdminStatus()
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo
      })
    }
  },

  getStats() {
    const db = wx.cloud.database()
    const _ = db.command
    
    // 获取用户统计数据
    Promise.all([
      db.collection('posts').where({
        _openid: app.globalData.openid
      }).count(),
      db.collection('friends').where({
        _openid: app.globalData.openid,
        status: 'accepted'
      }).count(),
      db.collection('likes').where({
        targetOpenid: app.globalData.openid
      }).count()
    ]).then(([posts, friends, likes]) => {
      this.setData({
        'stats.posts': posts.total,
        'stats.friends': friends.total,
        'stats.likes': likes.total
      })
    })
  },

  checkVipStatus() {
    wx.cloud.callFunction({
      name: 'getVipInfo',
      success: res => {
        this.setData({
          isVip: res.result.isVip
        })
      }
    })
  },

  checkAdminStatus() {
    wx.cloud.callFunction({
      name: 'checkAdmin',
      success: res => {
        this.setData({
          isAdmin: res.result.isAdmin
        })
      }
    })
  },

  navigateToMyPosts() {
    wx.navigateTo({
      url: '/pages/posts/posts?type=my'
    })
  },

  navigateToVip() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    })
  },

  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  navigateToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/dashboard/dashboard'
    })
  }
})