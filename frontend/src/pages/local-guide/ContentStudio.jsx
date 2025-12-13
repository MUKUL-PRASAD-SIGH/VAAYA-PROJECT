import { useState, useEffect, useRef } from 'react'
import { localGuideApi } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import './ContentStudio.css'

function ContentStudio() {
    const { t } = useLanguage()

    // Content types with translations
    const CONTENT_TYPES = [
        { id: 'post', label: t('postType'), icon: '📝' },
        { id: 'story', label: t('storyType'), icon: '📖' },
        { id: 'tip', label: t('localTipType'), icon: '💡' },
        { id: 'event', label: t('eventType'), icon: '🎉' }
    ]

    const [activeTab, setActiveTab] = useState('create')
    const [contentType, setContentType] = useState('post')
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        location: '',
        tags: []
    })
    const [mediaFiles, setMediaFiles] = useState([])
    const [mediaPreviews, setMediaPreviews] = useState([])
    const fileInputRef = useRef(null)

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            const validFiles = files.filter(file => {
                const isImage = file.type.startsWith('image/')
                const isVideo = file.type.startsWith('video/')
                const isValidSize = file.size <= 50 * 1024 * 1024
                return (isImage || isVideo) && isValidSize
            })
            if (validFiles.length > 0) {
                const newPreviews = validFiles.map(file => ({
                    file,
                    url: URL.createObjectURL(file),
                    type: file.type.startsWith('video/') ? 'video' : 'image'
                }))
                setMediaFiles([...mediaFiles, ...validFiles])
                setMediaPreviews([...mediaPreviews, ...newPreviews])
            }
        }
    }

    const removeMedia = (index) => {
        URL.revokeObjectURL(mediaPreviews[index].url)
        setMediaFiles(mediaFiles.filter((_, i) => i !== index))
        setMediaPreviews(mediaPreviews.filter((_, i) => i !== index))
    }

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        try {
            setLoading(true)
            const response = await localGuideApi.getMyContent()
            setPosts(response.data.content || [])
        } catch (error) {
            console.error('Failed to load content:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field, value) => {
        setNewPost({ ...newPost, [field]: value })
    }

    const handlePublish = async () => {
        if (!newPost.title.trim() || !newPost.content.trim()) {
            setMessage({ type: 'error', text: 'Please add a title and content' })
            return
        }
        try {
            setSaving(true)
            setMessage({ type: '', text: '' })

            const mediaUrls = mediaPreviews.map(p => p.url)

            const response = await localGuideApi.createContent({
                type: contentType,
                title: newPost.title,
                content: newPost.content,
                location: { name: newPost.location },
                tags: newPost.tags,
                media: mediaUrls,
                status: 'published'
            })

            setPosts([response.data.content, ...posts])
            setNewPost({ title: '', content: '', location: '', tags: [] })
            setMediaFiles([])
            setMediaPreviews([])
            setMessage({ type: 'success', text: 'Content published successfully!' })
            setActiveTab('posts')
        } catch (error) {
            console.error('Publish error:', error)
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to publish content' })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveDraft = async () => {
        if (!newPost.title.trim()) {
            setMessage({ type: 'error', text: 'Please add a title' })
            return
        }
        try {
            setSaving(true)
            setMessage({ type: '', text: '' })

            const mediaUrls = mediaPreviews.map(p => p.url)

            const response = await localGuideApi.createContent({
                type: contentType,
                title: newPost.title,
                content: newPost.content,
                location: { name: newPost.location },
                tags: newPost.tags,
                media: mediaUrls,
                status: 'draft'
            })

            setPosts([response.data.content, ...posts])
            setNewPost({ title: '', content: '', location: '', tags: [] })
            setMediaFiles([])
            setMediaPreviews([])
            setMessage({ type: 'success', text: 'Draft saved successfully!' })
            setActiveTab('drafts')
        } catch (error) {
            console.error('Draft error:', error)
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save draft' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (contentId) => {
        if (!confirm('Are you sure you want to delete this content?')) return
        try {
            await localGuideApi.deleteContent(contentId)
            setPosts(posts.filter(p => p._id !== contentId))
            setMessage({ type: 'success', text: 'Content deleted' })
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete content' })
        }
    }

    return (
        <div className="content-studio">
            {/* Message Display */}
            {message.text && (
                <div className={`studio-message ${message.type}`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <p>{message.text}</p>
                    <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="studio-tabs">
                <button
                    className={`studio-tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    ✨ {t('createNewContent')}
                </button>
                <button
                    className={`studio-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    📚 {t('myContentTab')}
                </button>
                <button
                    className={`studio-tab ${activeTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drafts')}
                >
                    📝 {t('draftsTab')}
                </button>
            </div>

            {activeTab === 'create' && (
                <div className="create-section">
                    {/* Content Type Selection */}
                    <div className="type-selection">
                        <h3>{t('whatToCreate')}</h3>
                        <div className="type-options">
                            {CONTENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    className={`type-option ${contentType === type.id ? 'active' : ''}`}
                                    onClick={() => setContentType(type.id)}
                                >
                                    <span className="type-icon">{type.icon}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="content-editor">
                        <div className="editor-main">
                            <input
                                type="text"
                                className="title-input"
                                placeholder="Give your content a title..."
                                value={newPost.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                            />

                            <div className="media-upload">
                                {mediaPreviews.length === 0 ? (
                                    <div className="upload-area">
                                        <span className="upload-icon">📷</span>
                                        <p>Drag & drop images or videos</p>
                                        <button
                                            type="button"
                                            className="upload-btn"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                fileInputRef.current?.click()
                                            }}
                                        >
                                            Browse Files
                                        </button>
                                    </div>
                                ) : (
                                    <div className="media-previews">
                                        {mediaPreviews.map((preview, index) => (
                                            <div key={index} className="preview-item">
                                                {preview.type === 'video' ? (
                                                    <video src={preview.url} />
                                                ) : (
                                                    <img src={preview.url} alt="" />
                                                )}
                                                <button
                                                    type="button"
                                                    className="remove-preview"
                                                    onClick={() => removeMedia(index)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="add-more-btn"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                fileInputRef.current?.click()
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <textarea
                                className="content-input"
                                placeholder="Share your local knowledge, tips, or story..."
                                rows={8}
                                value={newPost.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                            />

                            <div className="editor-toolbar">
                                <button className="toolbar-btn" title="Bold">
                                    <strong>B</strong>
                                </button>
                                <button className="toolbar-btn" title="Italic">
                                    <em>I</em>
                                </button>
                                <button className="toolbar-btn" title="Link">🔗</button>
                                <button className="toolbar-btn" title="Emoji">😊</button>
                                <button className="toolbar-btn" title="Location">📍</button>
                            </div>
                        </div>

                        <div className="editor-sidebar">
                            <div className="sidebar-section">
                                <h4>Location</h4>
                                <input
                                    type="text"
                                    placeholder="Add location..."
                                    value={newPost.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                            </div>

                            <div className="sidebar-section">
                                <h4>Tags</h4>
                                <input
                                    type="text"
                                    placeholder="Add tags (comma separated)..."
                                />
                                <div className="suggested-tags">
                                    <span className="tag">Karnataka</span>
                                    <span className="tag">Travel</span>
                                    <span className="tag">HiddenGems</span>
                                    <span className="tag">LocalFood</span>
                                </div>
                            </div>

                            <div className="sidebar-section">
                                <h4>Visibility</h4>
                                <select>
                                    <option value="public">🌍 Public</option>
                                    <option value="followers">👥 Followers Only</option>
                                    <option value="travelers">🎒 My Travelers</option>
                                </select>
                            </div>

                            <div className="action-buttons">
                                <button className="btn-draft" onClick={handleSaveDraft} disabled={saving}>
                                    {saving ? '⏳ Saving...' : '📝 Save as Draft'}
                                </button>
                                <button className="btn-publish" onClick={handlePublish} disabled={saving}>
                                    {saving ? '⏳ Publishing...' : '🚀 Publish'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="posts-section">
                    <div className="posts-header">
                        <h3>Published Content</h3>
                        <div className="posts-stats">
                            <span>📝 {posts.filter(p => p.status === 'published').length} posts</span>
                            <span>❤️ {posts.reduce((acc, p) => acc + p.likes, 0)} total likes</span>
                        </div>
                    </div>

                    <div className="posts-grid">
                        {posts.filter(p => p.status === 'published').map(post => (
                            <div key={post.id} className="post-card">
                                <div className="post-image">
                                    <span>{post.image}</span>
                                </div>
                                <div className="post-content">
                                    <span className="post-type">{CONTENT_TYPES.find(t => t.id === post.type)?.icon} {post.type}</span>
                                    <h4>{post.title}</h4>
                                    <p>{post.content}</p>
                                    <div className="post-stats">
                                        <span>❤️ {post.likes}</span>
                                        <span>💬 {post.comments}</span>
                                        <span>🔄 {post.shares}</span>
                                    </div>
                                    <span className="post-date">{post.published}</span>
                                </div>
                                <div className="post-actions">
                                    <button className="action-icon" title="Edit">✏️</button>
                                    <button className="action-icon" title="Analytics">📊</button>
                                    <button className="action-icon" title="Delete">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'drafts' && (
                <div className="drafts-section">
                    <h3>Draft Content</h3>
                    <div className="drafts-list">
                        {posts.filter(p => p.status === 'draft').map(post => (
                            <div key={post.id} className="draft-card">
                                <div className="draft-icon">{post.image}</div>
                                <div className="draft-info">
                                    <h4>{post.title}</h4>
                                    <p>{post.content}</p>
                                </div>
                                <div className="draft-actions">
                                    <button className="btn-edit">Edit</button>
                                    <button className="btn-delete">Delete</button>
                                </div>
                            </div>
                        ))}
                        {posts.filter(p => p.status === 'draft').length === 0 && (
                            <div className="empty-state">
                                <span>📝</span>
                                <p>No drafts yet. Start creating!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContentStudio
