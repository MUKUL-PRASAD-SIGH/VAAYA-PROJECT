import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ role: '', interests: [], budget: '' });

    const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleComplete = async () => {
        const isLocalGuide = formData.role === 'local';
        localStorage.setItem('userRole', isLocalGuide ? 'local' : 'tourist');
        localStorage.setItem('userPreferences', JSON.stringify({
            ...formData,
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
        }));

        try {
            const { userApi } = await import('../services/api');
            const response = await userApi.onboard({ preference: formData.role, name: '' });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            await userApi.updatePreferences(formData);
        } catch (error) { console.log("Backend save failed:", error); }

        navigate(isLocalGuide ? '/local-guide' : '/dashboard');
    };

    const interests = ['🏛️ Culture & Heritage', '🌊 Beaches', '⛰️ Mountains', '🍜 Food & Cuisine', '🎭 Festivals', '🦁 Wildlife', '🛕 Temples', '🎨 Art & Crafts'];
    const budgets = [
        { id: 'budget', label: 'Budget', desc: '₹5,000 - ₹15,000' },
        { id: 'moderate', label: 'Moderate', desc: '₹15,000 - ₹30,000' },
        { id: 'luxury', label: 'Luxury', desc: '₹30,000+' }
    ];

    return (
        <div className="min-h-screen luxury-bg-aurora flex items-center justify-center p-4">
            <div className="w-full max-w-2xl relative z-10">

                {/* Progress */}
                <div className="flex justify-center mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition
                                ${step >= s ? 'bg-[#c4a35a] text-black' : 'glass-card luxury-text-muted'}`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#c4a35a]' : 'bg-[rgba(255,255,255,0.1)]'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="glass-card p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #1a4a5c, #2d6a7c)' }}>
                            ✨
                        </div>
                        <h1 className="luxury-heading-gold text-4xl mb-4">Welcome to Vaaya</h1>
                        <p className="luxury-text-muted mb-8 max-w-md mx-auto">
                            Discover the beauty of Karnataka through sustainable travel and authentic local experiences.
                        </p>
                        <button onClick={() => setStep(2)} className="gold-button">Get Started</button>
                    </div>
                )}

                {/* Step 2: Role */}
                {step === 2 && (
                    <div className="glass-card p-8 text-center">
                        <p className="luxury-subheading mb-2">STEP 2 OF 4</p>
                        <h2 className="luxury-heading-gold text-3xl mb-2">Choose Your Role</h2>
                        <p className="luxury-text-muted mb-8">How would you like to explore Karnataka?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => updateFormData('role', 'tourist')}
                                className={`p-6 rounded-lg text-left transition ${formData.role === 'tourist' ? 'border-2' : 'glass-card'}`}
                                style={formData.role === 'tourist' ? { borderColor: '#c4a35a', backgroundColor: 'rgba(196, 163, 90, 0.1)' } : {}}
                            >
                                <span className="text-3xl block mb-2">🌍</span>
                                <h3 className="luxury-text font-bold text-lg mb-1">Traveler</h3>
                                <p className="luxury-text-muted text-sm">Explore new places and find hidden gems</p>
                            </button>
                            <button
                                onClick={() => updateFormData('role', 'local')}
                                className={`p-6 rounded-lg text-left transition ${formData.role === 'local' ? 'border-2' : 'glass-card'}`}
                                style={formData.role === 'local' ? { borderColor: '#c4a35a', backgroundColor: 'rgba(196, 163, 90, 0.1)' } : {}}
                            >
                                <span className="text-3xl block mb-2">🏠</span>
                                <h3 className="luxury-text font-bold text-lg mb-1">Local Guide</h3>
                                <p className="luxury-text-muted text-sm">Share knowledge and help tourists</p>
                            </button>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep(1)} className="gold-button-outline">Back</button>
                            <button onClick={() => formData.role && setStep(3)} disabled={!formData.role} className="gold-button disabled:opacity-50">Continue</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Interests */}
                {step === 3 && (
                    <div className="glass-card p-8 text-center">
                        <p className="luxury-subheading mb-2">STEP 3 OF 4</p>
                        <h2 className="luxury-heading-gold text-3xl mb-2">Your Interests</h2>
                        <p className="luxury-text-muted mb-8">Select what excites you</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                            {interests.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`p-3 rounded-lg text-sm transition ${formData.interests.includes(interest) ? 'border-2' : 'glass-card'}`}
                                    style={formData.interests.includes(interest) ? { borderColor: '#c4a35a', backgroundColor: 'rgba(196, 163, 90, 0.1)' } : {}}
                                >
                                    <span className="luxury-text">{interest}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep(2)} className="gold-button-outline">Back</button>
                            <button onClick={() => setStep(4)} className="gold-button">Continue</button>
                        </div>
                    </div>
                )}

                {/* Step 4: Budget */}
                {step === 4 && (
                    <div className="glass-card p-8 text-center">
                        <p className="luxury-subheading mb-2">STEP 4 OF 4</p>
                        <h2 className="luxury-heading-gold text-3xl mb-2">Travel Budget</h2>
                        <p className="luxury-text-muted mb-8">Select your typical travel budget</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {budgets.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => updateFormData('budget', b.id)}
                                    className={`p-6 rounded-lg text-center transition ${formData.budget === b.id ? 'border-2' : 'glass-card'}`}
                                    style={formData.budget === b.id ? { borderColor: '#c4a35a', backgroundColor: 'rgba(196, 163, 90, 0.1)' } : {}}
                                >
                                    <h3 className="luxury-text font-bold text-lg mb-1">{b.label}</h3>
                                    <p className="luxury-text-muted text-sm">{b.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep(3)} className="gold-button-outline">Back</button>
                            <button onClick={handleComplete} className="gold-button">Complete Setup</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
