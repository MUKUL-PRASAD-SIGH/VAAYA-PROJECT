import { useState, useEffect, useRef } from 'react'
import { postsApi } from '../services/api'
import { ChevronLeft, ChevronRight, Plus, Loader } from 'lucide-react'
import './StoriesBar.css'

const API_BASE_URL = 'http://localhost:5000'

function StoriesBar({ userLocation, onCreateStory, onStoryClick }) {
    const [stories, setStories] = useState([])
    const [loading, setLoading] = useState(true)
    const [scrollPosition, setScrollPosition] = useState(0)
    const containerRef = useRef(null)

    useEffect(() => {
        if (userLocation) {
            loadStories()
        }
    }, [userLocation])

    const loadStories = async () => {
        setLoading(true)
        try {
            const response = await postsApi.getNearbyStories(
                userLocation.latitude,
                userLocation.longitude,
                10
            )
            // Group stories by user
            const grouped = groupStoriesByUser(response.data.stories || [])
            setStories(grouped)
        } catch (err) {
            console.error('Failed to load stories:', err)
            // Demo stories for fallback
            setStories(getDemoStories())
        } finally {
            setLoading(false)
        }
    }

    const groupStoriesByUser = (storiesList) => {
        const userMap = new Map()

        storiesList.forEach(story => {
            const userId = story.user_id
            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    user_id: userId,
                    user: story.user,
                    stories: [],
                    unviewed: true // For demo, mark first user's story as unviewed
                })
            }
            userMap.get(userId).stories.push(story)
        })

        return Array.from(userMap.values())
    }

    const getDemoStories = () => [
        {
            user_id: 'demo1',
            user: { name: 'Priya K', profile_image: null },
            stories: [{ _id: 'story1' }],
            unviewed: true
        },
        {
            user_id: 'demo2',
            user: { name: 'Rahul S', profile_image: null },
            stories: [{ _id: 'story2' }],
            unviewed: true
        },
        {
            user_id: 'demo3',
            user: { name: 'Ananya R', profile_image: null },
            stories: [{ _id: 'story3' }],
            unviewed: false
        }
    ]

    const getMediaUrl = (fileId) => `${API_BASE_URL}/api/posts/media/${fileId}`

    const scroll = (direction) => {
        if (!containerRef.current) return

        const scrollAmount = 200
        const newPosition = direction === 'left'
            ? Math.max(0, scrollPosition - scrollAmount)
            : scrollPosition + scrollAmount

        containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
        setScrollPosition(newPosition)
    }

    const handleScroll = (e) => {
        setScrollPosition(e.target.scrollLeft)
    }

    if (loading) {
        return (
            <div className="stories-bar loading">
                <Loader className="spin" size={20} />
            </div>
        )
    }

    return (
        <div className="stories-bar">
            {/* Scroll Left Button */}
            {scrollPosition > 0 && (
                <button className="scroll-btn left" onClick={() => scroll('left')}>
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Stories Container */}
            <div
                className="stories-container"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {/* Create Story Button */}
                <div className="story-item create-story" onClick={onCreateStory}>
                    <div className="story-avatar create">
                        <Plus size={24} />
                    </div>
                    <span className="story-name">Add Story</span>
                </div>

                {/* User Stories */}
                {stories.map((userStories) => (
                    <div
                        key={userStories.user_id}
                        className={`story-item ${userStories.unviewed ? 'unviewed' : 'viewed'}`}
                        onClick={() => onStoryClick?.(userStories)}
                    >
                        <div className={`story-ring ${userStories.unviewed ? 'active' : ''}`}>
                            <div className="story-avatar">
                                {userStories.stories[0]?.media?.[0]?.file_id ? (
                                    <img
                                        src={getMediaUrl(userStories.stories[0].media[0].file_id)}
                                        alt=""
                                    />
                                ) : userStories.user?.profile_image ? (
                                    <img src={userStories.user.profile_image} alt="" />
                                ) : (
                                    <span>{userStories.user?.name?.charAt(0) || 'A'}</span>
                                )}
                            </div>
                        </div>
                        <span className="story-name">
                            {userStories.user?.name?.split(' ')[0] || 'User'}
                        </span>
                        {userStories.stories.length > 1 && (
                            <span className="story-count">+{userStories.stories.length - 1}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Scroll Right Button */}
            {stories.length > 5 && (
                <button className="scroll-btn right" onClick={() => scroll('right')}>
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    )
}

export default StoriesBar
