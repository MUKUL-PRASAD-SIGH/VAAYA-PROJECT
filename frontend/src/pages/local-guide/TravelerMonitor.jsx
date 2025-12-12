import { useState, useEffect } from 'react'
import { localGuideApi } from '../../services/api'
import './TravelerMonitor.css'

function TravelerMonitor() {
    const [submissions, setSubmissions] = useState([])
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [filter, setFilter] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        loadSubmissions()
    }, [filter])

    const loadSubmissions = async () => {
        try {
            setLoading(true)
            const response = await localGuideApi.getPendingSubmissions(filter)
            setSubmissions(response.data.submissions || [])
        } catch (error) {
            console.error('Failed to load submissions:', error)
            setMessage({ type: 'error', text: 'Failed to load submissions' })
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (submissionId) => {
        try {
            await localGuideApi.verifySubmission(submissionId, {
                approved: true,
                feedback: feedback || 'Great job! Quest completed successfully.'
            })
            setMessage({ type: 'success', text: 'Submission approved! Points awarded to traveler.' })
            setSelectedSubmission(null)
            setFeedback('')
            loadSubmissions()
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to approve submission' })
        }
    }

    const handleReject = async (submissionId) => {
        if (!feedback.trim()) {
            setMessage({ type: 'error', text: 'Please provide a reason for rejection' })
            return
        }
        try {
            await localGuideApi.verifySubmission(submissionId, {
                approved: false,
                feedback: feedback
            })
            setMessage({ type: 'success', text: 'Submission rejected' })
            setSelectedSubmission(null)
            setFeedback('')
            loadSubmissions()
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reject submission' })
        }
    }

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => !s.verified).length,
        approved: submissions.filter(s => s.verified && s.approved).length
    }

    return (
        <div className="traveler-monitor">
            {/* Message Toast */}
            {message.text && (
                <div className={`message-toast ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Stats Overview */}
            <div className="monitor-stats">
                <div className="stat-item">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total Submissions</span>
                </div>
                <div className="stat-item pending">
                    <span className="stat-number">{stats.pending}</span>
                    <span className="stat-label">Pending Review</span>
                </div>
                <div className="stat-item completed">
                    <span className="stat-number">{stats.approved}</span>
                    <span className="stat-label">Approved</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                </button>
                <button
                    className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Approved
                </button>
                <button className="refresh-btn" onClick={loadSubmissions}>
                    Refresh
                </button>
            </div>

            <div className="monitor-content">
                {/* Submissions List */}
                <div className="travelers-list">
                    {loading ? (
                        <div className="loading-state">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                        <div className="empty-state">
                            <p>No {filter} submissions found</p>
                        </div>
                    ) : (
                        submissions.map(submission => (
                            <div
                                key={submission._id}
                                className={`traveler-card ${selectedSubmission?._id === submission._id ? 'selected' : ''}`}
                                onClick={() => setSelectedSubmission(submission)}
                            >
                                <div className="traveler-avatar">
                                    <span className="avatar-letter">{(submission.traveler_name || 'A')[0]}</span>
                                    <span className={`status-dot ${submission.verified ? 'completed' : 'pending'}`}></span>
                                </div>
                                <div className="traveler-info">
                                    <h4>{submission.traveler_name || 'Anonymous Traveler'}</h4>
                                    <p className="traveler-location">{submission.quest_name || 'Quest'}</p>
                                    <div className="submission-time">
                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="traveler-meta">
                                    <span className={`status-badge ${submission.verified ? (submission.approved ? 'approved' : 'rejected') : 'pending'}`}>
                                        {submission.verified ? (submission.approved ? 'Approved' : 'Rejected') : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Submission Details Panel */}
                {selectedSubmission && (
                    <div className="traveler-details">
                        <div className="details-header">
                            <div className="details-avatar">
                                <span className="avatar-letter">{(selectedSubmission.traveler_name || 'A')[0]}</span>
                            </div>
                            <div className="details-info">
                                <h3>{selectedSubmission.traveler_name || 'Traveler'}</h3>
                                <span className={`status-badge ${selectedSubmission.verified ? 'completed' : 'pending'}`}>
                                    {selectedSubmission.verified ? 'Reviewed' : 'Pending Review'}
                                </span>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="submission-details">
                            <div className="detail-row">
                                <span className="detail-label">Quest:</span>
                                <span className="detail-value">{selectedSubmission.quest_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Submitted:</span>
                                <span className="detail-value">
                                    {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                </span>
                            </div>
                            {selectedSubmission.proof_image && (
                                <div className="proof-image">
                                    <h4>Proof Photo</h4>
                                    <img src={selectedSubmission.proof_image} alt="Quest proof" />
                                </div>
                            )}
                            {selectedSubmission.notes && (
                                <div className="submission-notes">
                                    <h4>Traveler Notes</h4>
                                    <p>{selectedSubmission.notes}</p>
                                </div>
                            )}
                        </div>

                        {!selectedSubmission.verified && (
                            <div className="verification-section">
                                <h4>Verification</h4>
                                <textarea
                                    placeholder="Add feedback for the traveler..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={3}
                                />
                                <div className="action-buttons">
                                    <button
                                        className="action-btn approve"
                                        onClick={() => handleApprove(selectedSubmission._id)}
                                    >
                                        Approve & Award Points
                                    </button>
                                    <button
                                        className="action-btn reject"
                                        onClick={() => handleReject(selectedSubmission._id)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedSubmission.verified && selectedSubmission.feedback && (
                            <div className="feedback-section">
                                <h4>Your Feedback</h4>
                                <p>{selectedSubmission.feedback}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TravelerMonitor

