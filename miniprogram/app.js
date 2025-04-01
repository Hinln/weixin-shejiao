App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: null,
      isAdmin: false,
      vipInfo: null,
      dailyPostCount: 0,
      dailyGreetCount: 0
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  // 检查是否是会员
  checkVipStatus: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getVipInfo',
        success: res => {
          this.globalData.vipInfo = res.result
          resolve(res.result)
        },
        fail: err => {
          reject(err)
        }
      })
    })
  },

  // 检查是否是管理员
  checkAdminStatus: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'checkAdmin',
        success: res => {
          this.globalData.isAdmin = res.result.isAdmin
          resolve(res.result.isAdmin)
        },
        fail: err => {
          reject(err)
        }
      })
    })
  },

  // 更新每日发帖和打招呼次数
  updateDailyCounts: function() {
    const now = new Date()
    const today = now.toDateString()
    const lastUpdate = wx.getStorageSync('lastCountUpdate')
    
    if (lastUpdate !== today) {
      this.globalData.dailyPostCount = 0
      this.globalData.dailyGreetCount = 0
      wx.setStorageSync('lastCountUpdate', today)
    }
  }
})