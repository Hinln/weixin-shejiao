const app = getApp()

Page({
  data: {
    post: null,
    comments: [],
    isLiked: false,
    commentContent: '',
    isLoading: true
  },

  onLoad: function(options) {
    this.postId = options.id
    this.loadPostDetail()
    this.loadComments()
  },

  loadPostDetail: function() {
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'getPostDetail',
        postId: this.postId
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          post: res.result.data,
          isLiked: res.result.data.isLiked || false,
          isLoading: false
        })

        // 如果是阅后即焚动态，设置定时删除
        if (res.result.data.burnAfterRead) {
          setTimeout(() => {
            this.deletePost()
          }, 300000) // 5分钟后删除
        }
      }
    }).catch(err => {
      console.error('加载动态详情失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    })
  },

  loadComments: function() {
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'getComments',
        postId: this.postId
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          comments: res.result.data || []
        })
      }
    }).catch(err => {
      console.error('加载评论失败：', err)
    })
  },

  handleLike: function() {
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'toggleLike',
        postId: this.postId
      }
    }).then(res => {
      if (res.result.success) {
        const newPost = { ...this.data.post }
        newPost.likeCount = res.result.data.likeCount
        this.setData({
          post: newPost,
          isLiked: !this.data.isLiked
        })
      }
    }).catch(err => {
      console.error('点赞失败：', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onCommentInput: function(e) {
    this.setData({
      commentContent: e.detail.value
    })
  },

  submitComment: function() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'addComment',
        postId: this.postId,
        content: this.data.commentContent
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          commentContent: '',
          comments: [res.result.data, ...this.data.comments]
        })

        // 更新评论数
        const newPost = { ...this.data.post }
        newPost.commentCount = (newPost.commentCount || 0) + 1
        this.setData({ post: newPost })
      }
    }).catch(err => {
      console.error('提交评论失败：', err)
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      })
    })
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({
      current: url,
      urls: urls
    })
  },

  deletePost: function() {
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'deletePost',
        postId: this.postId
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({
          title: '动态已删除',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(err => {
      console.error('删除动态失败：', err)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    })
  }
})