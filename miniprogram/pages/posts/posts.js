const app = getApp()

Page({
  data: {
    posts: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false
  },

  onLoad: function() {
    this.loadPosts()
  },

  onPullDownRefresh: function() {
    this.setData({
      posts: [],
      page: 1,
      hasMore: true
    })
    this.loadPosts().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadPosts()
    }
  },

  loadPosts: function() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    return wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'getPosts',
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      const newPosts = res.result.data || []
      
      this.setData({
        posts: [...this.data.posts, ...newPosts],
        page: this.data.page + 1,
        hasMore: newPosts.length === this.data.pageSize,
        isLoading: false
      })
    }).catch(err => {
      console.error('加载动态失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    })
  },

  previewImage: function(e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({
      current,
      urls
    })
  },

  viewPost: function(e) {
    const postId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${postId}`
    })
  },

  navigateToPost: function() {
    // 检查每日发帖限制
    if (app.globalData.dailyPostCount >= (app.globalData.vipInfo?.maxDailyPosts || 3)) {
      wx.showToast({
        title: '今日发帖次数已达上限',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/post-create/post-create'
    })
  }
})