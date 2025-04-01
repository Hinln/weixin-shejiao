const app = getApp()

Page({
  data: {
    totalUsers: 0,
    activeUsers: 0,
    vipUsers: 0,
    totalPosts: 0,
    pendingReports: 0,
    timeRanges: ['最近7天', '最近30天', '最近90天'],
    currentTimeRange: '最近7天'
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadStatistics()
    this.loadPendingReports()
  },

  async checkAdminPermission() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkAdmin'
      })

      if (!result.isAdmin) {
        wx.showToast({
          title: '无权限访问',
          icon: 'error'
        })
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      }
    } catch (error) {
      console.error('检查管理员权限失败：', error)
    }
  },

  async loadStatistics() {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      const now = new Date()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      // 获取总用户数
      const userCountRes = await db.collection('users').count()
      
      // 获取活跃用户数（30天内有登录记录的用户）
      const activeUserCountRes = await db.collection('users')
        .where({
          lastLoginTime: _.gte(thirtyDaysAgo)
        })
        .count()

      // 获取VIP用户数
      const vipUserCountRes = await db.collection('users')
        .where({
          isVip: true,
          vipExpireTime: _.gte(now)
        })
        .count()

      // 获取动态总数
      const postCountRes = await db.collection('posts').count()

      this.setData({
        totalUsers: userCountRes.total,
        activeUsers: activeUserCountRes.total,
        vipUsers: vipUserCountRes.total,
        totalPosts: postCountRes.total
      })
    } catch (error) {
      console.error('加载统计数据失败：', error)
    }
  },

  async loadPendingReports() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('reports')
        .where({
          status: 'pending'
        })
        .count()

      this.setData({
        pendingReports: res.total
      })
    } catch (error) {
      console.error('加载待处理举报失败：', error)
    }
  },

  onTimeRangeChange(e) {
    const index = e.detail.value
    this.setData({
      currentTimeRange: this.data.timeRanges[index]
    })
    // 根据选择的时间范围重新加载图表数据
    this.loadChartData(this.data.timeRanges[index])
  },

  loadChartData(timeRange) {
    // 这里可以根据选择的时间范围加载相应的图表数据
    console.log('加载图表数据：', timeRange)
  },

  navigateToUsers() {
    wx.navigateTo({
      url: '/pages/admin/users/users'
    })
  },

  navigateToReports() {
    wx.navigateTo({
      url: '/pages/admin/reports/reports'
    })
  },

  navigateToVipSettings() {
    wx.navigateTo({
      url: '/pages/admin/vip-settings/vip-settings'
    })
  }
})