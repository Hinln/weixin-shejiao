const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    postCount: 0,
    friendCount: 0,
    isVip: false
  },

  onLoad: function() {
    // 检查用户是否已登录
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      this.checkVipStatus()
      this.getUserStats()
    }
  },

  getUserProfile: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        // 保存用户信息到数据库
        this.saveUserInfo(res.userInfo)
        // 检查会员状态
        this.checkVipStatus()
        // 获取用户统计数据
        this.getUserStats()
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  saveUserInfo: function(userInfo) {
    wx.cloud.callFunction({
      name: 'manageUser',
      data: {
        action: 'update',
        userData: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          lastLoginTime: new Date()
        }
      },
      success: (res) => {
        console.log('用户信息保存成功')
      },
      fail: (err) => {
        console.error('保存用户信息失败：', err)
      }
    })
  },

  checkVipStatus: function() {
    app.checkVipStatus().then(vipInfo => {
      this.setData({
        isVip: vipInfo.isVip
      })
    }).catch(err => {
      console.error('获取会员信息失败：', err)
    })
  },

  getUserStats: function() {
    wx.cloud.callFunction({
      name: 'manageUser',
      data: {
        action: 'getStats'
      },
      success: (res) => {
        if (res.result.success) {
          this.setData({
            postCount: res.result.data.postCount || 0,
            friendCount: res.result.data.friendCount || 0
          })
        }
      },
      fail: (err) => {
        console.error('获取用户统计数据失败：', err)
      }
    })
  },

  navigateToVip: function() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    })
  }
})