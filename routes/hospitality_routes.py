import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { localGuideApi } from "../../services/api";
import "./QuestCreator.css";

const QUEST_TYPES = [
  { id: "photo", label: "Photo Quest", description: "Travelers capture specific locations or moments" },
  { id: "visit", label: "Visit Quest", description: "Travelers visit and check-in at locations" },
  { id: "food", label: "Food Quest", description: "Travelers try local cuisine and restaurants" },
  { id: "culture", label: "Culture Quest", description: "Travelers experience local traditions" },
  { id: "adventure", label: "Adventure Quest", description: "Travelers complete outdoor activities" },
];

const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Easy", color: "#4ade80", points: "50-100" },
  { id: "medium", label: "Medium", color: "#fbbf24", points: "100-200" },
  { id: "hard", label: "Hard", color: "#f97316", points: "200-500" },
  { id: "expert", label: "Expert", color: "#ef4444", points: "500+" },
];

function QuestCreator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [quest, setQuest] = useState({
    type: "",
    title: "",
    description: "",
    location: "",
    coordinates: null,
    difficulty: "",
    points: 100,
    timeLimit: "",
    requirements: [],
    tips: "",
    coverImage: null,
  });
  const [myQuests, setMyQuests] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "Please log in to create quests" });
      return;
    }
    loadMyQuests();
  }, []);

  const loadMyQuests = async () => {
    try {
      setLoading(true);
      const response = await localGuideApi.getMyQuests();
      setMyQuests(response.data.quests || []);
      setMessage({ type: "", text: "" });
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        "Failed to load your quests. Please ensure you're logged in.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (typeId) => {
    setQuest({ ...quest, type: typeId });
    setStep(2);
  };

  const handleInputChange = (field, value) => {
    setQuest({ ...quest, [field]: value });
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setMessage({ type: "info", text: "Getting your location..." });

    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolocation not supported." });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setQuest((prev) => ({
          ...prev,
          coordinates: coords,
          location: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        }));
        setMessage({ type: "success", text: "Location captured!" });
        setGettingLocation(false);
      },
      (err) => {
        let msg = "Failed to get location.";
        if (err.code === 1) msg = "Permission denied. Enable location access.";
        if (err.code === 2) msg = "Location unavailable.";
        if (err.code === 3) msg = "Request timed out.";
        setMessage({ type: "error", text: msg });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    try {
      if (!quest.coordinates) {
        setMessage({
          type: "error",
          text: "Please capture location before submitting.",
        });
        return;
      }
      setSaving(true);
      const questData = {
        title: quest.title,
        description: quest.description,
        category: quest.type,
        location: { name: quest.location, coordinates: quest.coordinates },
        reward_points: quest.points,
        difficulty: quest.difficulty || "medium",
        estimated_time: quest.timeLimit === "1h" ? 60 : 120,
        verification_type: "photo",
        verification_instructions: quest.tips,
      };

      const response = await localGuideApi.createQuest(questData);
      setMyQuests([response.data.quest, ...myQuests]);
      setMessage({ type: "success", text: "Quest created successfully!" });
      setStep(1);
      setQuest({
        type: "",
        title: "",
        description: "",
        location: "",
        coordinates: null,
        difficulty: "",
        points: 100,
        timeLimit: "",
        requirements: [],
        tips: "",
        coverImage: null,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create quest",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuest = async (id) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;
    try {
      await localGuideApi.deleteQuest(id);
      setMyQuests(myQuests.filter((q) => q._id !== id));
      setMessage({ type: "success", text: "Quest deleted." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete quest." });
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      await localGuideApi.updateQuest(id, { active: !active });
      setMyQuests((prev) =>
        prev.map((q) => (q._id === id ? { ...q, active: !active } : q))
      );
    } catch {
      setMessage({ type: "error", text: "Failed to update quest." });
    }
  };

  // =================== JSX ===================

  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="quest-creator">
        <div
          className="auth-required"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            border: "2px dashed rgba(255,255,255,0.1)",
          }}
        >
          <h2>🔒 Authentication Required</h2>
          <p style={{ marginBottom: "20px", color: "#aaa" }}>
            You need to be logged in as a Local Guide to create quests.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 32px",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quest-creator">
      {message.text && (
        <div
          className={`message-banner ${message.type}`}
          style={{
            padding: "12px 20px",
            marginBottom: "20px",
            borderRadius: "8px",
            background:
              message.type === "error"
                ? "#fee2e2"
                : message.type === "success"
                ? "#d1fae5"
                : "#dbeafe",
            color:
              message.type === "error"
                ? "#991b1b"
                : message.type === "success"
                ? "#065f46"
                : "#1e40af",
            border: `1px solid ${
              message.type === "error"
                ? "#fca5a5"
                : message.type === "success"
                ? "#6ee7b7"
                : "#93c5fd"
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Stepper */}
      <div className="section-header">
        <h2>Create New Quest</h2>
        <div className="step-indicator">
          <span className={`step ${step >= 1 ? "active" : ""}`}>1. Type</span>
          <span className={`step ${step >= 2 ? "active" : ""}`}>
            2. Details
          </span>
          <span className={`step ${step >= 3 ? "active" : ""}`}>
            3. Review
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="quest-types-grid">
          {QUEST_TYPES.map((type) => (
            <button
              key={type.id}
              className={`quest-type-card ${
                quest.type === type.id ? "selected" : ""
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <h3>{type.label}</h3>
              <p>{type.description}</p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="quest-form">
          <div className="form-group">
            <label>Quest Title</label>
            <input
              type="text"
              placeholder="Enter a title..."
              value={quest.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe the quest..."
              rows={3}
              value={quest.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Location (Name)</label>
            <input
              type="text"
              placeholder="e.g. Mysore Palace"
              value={quest.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Quest Coordinates</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="lat, lng"
                value={
                  quest.coordinates
                    ? `${quest.coordinates.lat.toFixed(6)}, ${quest.coordinates.lng.toFixed(6)}`
                    : ""
                }
                readOnly
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                style={{
                  padding: "8px 16px",
                  background: quest.coordinates ? "#10b981" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                {gettingLocation ? "📍 Getting..." : "📍 Capture Location"}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="btn-primary" onClick={() => setStep(3)}>
              Review →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="quest-review">
          <div className="review-card">
            <h3>{quest.title || "Untitled Quest"}</h3>
            <p>{quest.description}</p>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setStep(2)}>
              ← Edit
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Quest"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestCreator;
