import { useState, useEffect, useRef } from 'react'
import { postsApi } from '../services/api'
import {
    X,
    Send,
    Heart,
    Trash2,
    Loader,
    MessageCircle,
    MoreVertical
} from 'lucide-react'
import './CommentsSheet.css'

function CommentsSheet({ postId, onClose, initialCommentsCount = 0 }) {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [sending, setSending] = useState(false)
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
    const inputRef = useRef(null)

    useEffect(() => {
        loadComments()
        // Focus input when sheet opens
        setTimeout(() => inputRef.current?.focus(), 300)
    }, [postId])

    const loadComments = async () => {
        try {
            const response = await postsApi.getComments(postId)
            setComments(response.data.comments || [])
            setCommentsCount(response.data.count || 0)
        } catch (err) {
            console.error('Failed to load comments:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSendComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || sending) return

        setSending(true)
        try {
            const response = await postsApi.addComment(postId, newComment.trim())
            setComments([...comments, response.data.comment])
            setCommentsCount(commentsCount + 1)
            setNewComment('')
        } catch (err) {
            console.error('Failed to add comment:', err)
        } finally {
            setSending(false)
        }
    }

    const handleLikeComment = async (commentId) => {
        try {
            const response = await postsApi.likeComment(postId, commentId)
            setComments(comments.map(c => {
                if (c.comment_id === commentId) {
                    return {
                        ...c,
                        is_liked: response.data.liked,
                        likes_count: response.data.liked
                            ? (c.likes_count || 0) + 1
                            : (c.likes_count || 1) - 1
                    }
                }
                return c
            }))
        } catch (err) {
            console.error('Failed to like comment:', err)
        }
    }

    const handleDeleteComment = async (commentId) => {
        try {
            await postsApi.deleteComment(postId, commentId)
            setComments(comments.filter(c => c.comment_id !== commentId))
            setCommentsCount(commentsCount - 1)
        } catch (err) {
            console.error('Failed to delete comment:', err)
        }
    }

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m`
        if (diffHours < 24) return `${diffHours}h`
        if (diffDays < 7) return `${diffDays}d`
        return date.toLocaleDateString()
    }

    return (
        <div className="comments-sheet-overlay" onClick={onClose}>
            <div className="comments-sheet" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="comments-sheet-header">
                    <div className="header-title">
                        <MessageCircle size={20} />
                        <span>Comments</span>
                        <span className="comments-count">{commentsCount}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="comments-list">
                    {loading ? (
                        <div className="comments-loading">
                            <Loader className="spin" size={32} />
                            <span>Loading comments...</span>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="no-comments">
                            <MessageCircle size={48} strokeWidth={1} />
                            <p>No comments yet</p>
                            <span>Be the first to comment!</span>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.comment_id} className="comment-item">
                                <div className="comment-avatar">
                                    {comment.user?.profile_image ? (
                                        <img src={comment.user.profile_image} alt="" />
                                    ) : (
                                        <span>{comment.user?.name?.charAt(0) || 'A'}</span>
                                    )}
                                </div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author">
                                            {comment.user?.name || 'Anonymous'}
                                        </span>
                                        <span className="comment-time">
                                            {formatTimeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                    <div className="comment-actions">
                                        <button
                                            className={`like-btn ${comment.is_liked ? 'liked' : ''}`}
                                            onClick={() => handleLikeComment(comment.comment_id)}
                                        >
                                            <Heart
                                                size={14}
                                                fill={comment.is_liked ? '#ef4444' : 'none'}
                                            />
                                            {comment.likes_count > 0 && (
                                                <span>{comment.likes_count}</span>
                                            )}
                                        </button>
                                        <button className="reply-btn">Reply</button>
                                    </div>
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteComment(comment.comment_id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input */}
                <form className="comment-input-area" onSubmit={handleSendComment}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || sending}
                        className="send-btn"
                    >
                        {sending ? (
                            <Loader className="spin" size={20} />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CommentsSheet
