// Quests JavaScript
const API_BASE_URL = 'http://localhost:5000';

let currentQuestId = null;
let cameraStream = null;

function getAuthToken() {
    return localStorage.getItem('token');
}

// Load quests
async function loadQuests() {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/api/quests`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const questsGrid = document.getElementById('quests-grid');
        const quests = response.data.quests || [];

        if (quests.length === 0) {
            questsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <p>No quests available at the moment</p>
                </div>
            `;
            return;
        }

        questsGrid.innerHTML = quests.map(quest => `
            <div class="quest-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer" onclick="showQuestDetail('${quest.id}')">
                <div class="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-6xl">
                    ${quest.icon || '🎯'}
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${quest.title || 'Quest'}</h3>
                        <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ${quest.points || 0} pts
                        </span>
                    </div>
                    <p class="text-gray-600 mb-4 line-clamp-2">${quest.description || 'No description'}</p>
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>📍 ${quest.location || 'Unknown'}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyClass(quest.difficulty)}">${quest.difficulty || 'Medium'}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading quests:', error);
        const questsGrid = document.getElementById('quests-grid');
        if (questsGrid) {
            questsGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-red-500">
                    <p>Error loading quests. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

// Show quest detail modal
async function showQuestDetail(questId) {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/api/quests/${questId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const quest = response.data.quest || response.data;
        currentQuestId = questId;

        // Populate modal
        document.getElementById('modal-quest-name').textContent = quest.title || quest.name || 'Quest';
        document.getElementById('modal-quest-points').textContent = `${quest.points || 0} Points`;
        document.getElementById('modal-quest-difficulty').textContent = quest.difficulty || 'Medium';
        document.getElementById('modal-quest-description').textContent = quest.description || 'No description available';
        document.getElementById('modal-quest-location').textContent = quest.location || 'Unknown location';

        // Requirements
        const requirements = quest.requirements || ['Visit the location', 'Take a photo'];
        document.getElementById('modal-quest-requirements').innerHTML = requirements.map(req =>
            `<li>${req}</li>`
        ).join('');

        // Show modal
        document.getElementById('quest-modal').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading quest detail:', error);
        alert('Failed to load quest details. Please try again.');
    }
}

// Close quest modal
document.getElementById('close-modal')?.addEventListener('click', () => {
    document.getElementById('quest-modal').classList.add('hidden');
});

// Start quest
document.getElementById('start-quest-btn')?.addEventListener('click', () => {
    document.getElementById('quest-modal').classList.add('hidden');
    openCameraModal();
});

// Open camera modal
function openCameraModal() {
    document.getElementById('camera-modal').classList.remove('hidden');
    startCamera();
}

// Close camera modal
document.getElementById('close-camera-modal')?.addEventListener('click', () => {
    stopCamera();
    document.getElementById('camera-modal').classList.add('hidden');
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');
});

// Start camera
async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });

        const video = document.getElementById('camera-view');
        video.srcObject = cameraStream;

    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please upload a photo instead.');
    }
}

// Stop camera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Capture photo
document.getElementById('capture-photo')?.addEventListener('click', () => {
    const video = document.getElementById('camera-view');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Show preview
    document.getElementById('captured-photo').src = imageData;
    document.getElementById('photo-preview').classList.remove('hidden');
    document.getElementById('upload-section').classList.add('hidden');

    // Stop camera
    stopCamera();
    video.style.display = 'none';
});

// Retake photo
document.getElementById('retake-photo')?.addEventListener('click', () => {
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');
    document.getElementById('camera-view').style.display = 'block';
    startCamera();
});

// Photo upload
document.getElementById('photo-upload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('captured-photo').src = event.target.result;
            document.getElementById('photo-preview').classList.remove('hidden');
            document.getElementById('upload-section').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Submit verification
document.getElementById('submit-verification')?.addEventListener('click', async () => {
    const imageData = document.getElementById('captured-photo').src;

    if (!imageData || !currentQuestId) {
        alert('Please capture or upload a photo first');
        return;
    }

    // Show verification status
    document.getElementById('verification-status').classList.remove('hidden');
    document.getElementById('photo-preview').classList.add('hidden');

    try {
        const token = getAuthToken();

        // Convert base64 to blob
        const blob = await fetch(imageData).then(r => r.blob());

        // Create form data
        const formData = new FormData();
        formData.append('image', blob, 'quest-photo.jpg');
        formData.append('quest_id', currentQuestId);

        // Submit to AI verification endpoint
        const response = await axios.post(`${API_BASE_URL}/ai/verify-quest`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        const result = response.data;

        // Hide status, show result
        document.getElementById('verification-status').classList.add('hidden');

        if (result.verified) {
            alert(`✅ Quest Verified!\n\nYou earned ${result.points_earned || 0} points!\n\nAI Feedback: ${result.analysis || 'Good job!'}`);

            // Close modal and reload quests
            document.getElementById('camera-modal').classList.add('hidden');
            loadQuests();
        } else {
            alert(`❌ Verification Failed\n\n${result.message || 'Photo does not match quest requirements.'}\n\nAI Feedback: ${result.analysis || 'Please try again.'}`);

            // Show photo preview again for retake
            document.getElementById('photo-preview').classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error verifying quest:', error);
        document.getElementById('verification-status').classList.add('hidden');
        alert('Verification failed. Please try again.');
        document.getElementById('photo-preview').classList.remove('hidden');
    }
});

// Filter handlers
document.getElementById('category-filter')?.addEventListener('change', filterQuests);
document.getElementById('difficulty-filter')?.addEventListener('change', filterQuests);
document.getElementById('distance-filter')?.addEventListener('change', filterQuests);
document.getElementById('sort-filter')?.addEventListener('change', filterQuests);

function filterQuests() {
    // Implement filtering logic
    loadQuests(); // For now, just reload
}

// Helper functions
function getDifficultyColor(difficulty) {
    const colors = {
        'easy': 'success',
        'medium': 'warning',
        'hard': 'danger'
    };
    return colors[difficulty?.toLowerCase()] || 'primary';
}

function getDifficultyClass(difficulty) {
    const classes = {
        'easy': 'bg-green-100 text-green-800',
        'medium': 'bg-yellow-100 text-yellow-800',
        'hard': 'bg-red-100 text-red-800'
    };
    return classes[difficulty?.toLowerCase()] || 'bg-blue-100 text-blue-800';
}

// Initialize
document.addEventListener('DOMContentLoaded', loadQuests);
