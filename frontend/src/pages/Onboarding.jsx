import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { User, MapPin, Heart, DollarSign } from 'lucide-react';
import Stepper, { Step } from '../components/Stepper';

export default function Onboarding() {
    const navigate = useNavigate();
    const { themeColors } = useTheme();

    // Form State
    const [formData, setFormData] = useState({
        role: '',
        interests: [],
        budget: ''
    });

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleFinalStep = async () => {
        const userPreferences = {
            role: formData.role,
            interests: formData.interests,
            budget: formData.budget,
            onboarding_completed: true
        };

        // Save to localStorage as fallback
        localStorage.setItem('userPreferences', JSON.stringify({
            ...userPreferences,
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
        }));

        // Try to save to backend API
        try {
            const { userApi } = await import('../services/api');
            await userApi.updatePreferences(userPreferences);
            console.log("Preferences saved to backend");
        } catch (error) {
            console.log("Backend save failed, using localStorage fallback:", error);
        }

        navigate('/dashboard');
    };

    // Card styles for dark mode support
    const getCardStyle = (isSelected) => ({
        backgroundColor: isSelected
            ? (themeColors?.accent ? `${themeColors.accent}20` : 'rgba(147, 51, 234, 0.15)')
            : (themeColors?.cardBg || '#1f2937'),
        borderColor: isSelected ? (themeColors?.accent || '#9333ea') : (themeColors?.border || '#374151'),
        borderWidth: '2px',
        borderStyle: 'solid'
    });

    const getTextStyle = () => ({
        color: themeColors?.text || '#f3f4f6'
    });

    const getSubTextStyle = () => ({
        color: themeColors?.textSecondary || '#9ca3af'
    });

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: themeColors?.background || '#111827' }}
        >
            <Stepper
                initialStep={1}
                onStepChange={(step) => console.log("Step changed to:", step)}
                onFinalStepCompleted={handleFinalStep}
                backButtonText="Previous"
                nextButtonText="Next"
                stepCircleContainerClassName="shadow-2xl"
            >
                {/* Step 1: Welcome */}
                <Step>
                    <div className="flex flex-col items-center justify-center text-center py-12 px-8">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                            style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)' }}
                        >
                            <User className="w-10 h-10" style={{ color: '#a855f7' }} />
                        </div>
                        <h2
                            className="text-3xl font-bold mb-4"
                            style={{
                                background: 'linear-gradient(to right, #9333ea, #ec4899)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Welcome to Vaaya!
                        </h2>
                        <p className="text-lg max-w-md" style={getSubTextStyle()}>
                            We're excited to have you on board. Let's personalize your experience to give you the best travel recommendations.
                        </p>
                    </div>
                </Step>

                {/* Step 2: Role Selection */}
                <Step>
                    <div className="flex flex-col items-center py-6 px-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                        >
                            <MapPin className="w-8 h-8" style={{ color: '#60a5fa' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={getTextStyle()}>Choose Your Role</h2>
                        <p className="mb-8" style={getSubTextStyle()}>How would you like to explore Karnataka?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                            {[
                                { name: 'Traveller', desc: 'Explore new places and find hidden gems.' },
                                { name: 'Local Guide', desc: 'Share your knowledge and help tourists.' }
                            ].map((role) => (
                                <button
                                    key={role.name}
                                    onClick={() => updateFormData('role', role.name)}
                                    className="p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
                                    style={getCardStyle(formData.role === role.name)}
                                >
                                    <h3 className="text-lg font-bold mb-1" style={getTextStyle()}>{role.name}</h3>
                                    <p className="text-sm" style={getSubTextStyle()}>{role.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </Step>

                {/* Step 3: Interests */}
                <Step>
                    <div className="flex flex-col items-center py-6 px-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}
                        >
                            <Heart className="w-8 h-8" style={{ color: '#f472b6' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={getTextStyle()}>Your Interests</h2>
                        <p className="mb-8" style={getSubTextStyle()}>Select the experiences you love (pick multiple)</p>

                        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                            {['Nature', 'History', 'Food', 'Adventure', 'Culture', 'Relaxation', 'Photography', 'Shopping'].map((interest) => {
                                const isSelected = formData.interests.includes(interest);
                                return (
                                    <button
                                        key={interest}
                                        onClick={() => {
                                            const newInterests = isSelected
                                                ? formData.interests.filter(i => i !== interest)
                                                : [...formData.interests, interest];
                                            updateFormData('interests', newInterests);
                                        }}
                                        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                                        style={{
                                            backgroundColor: isSelected ? '#9333ea' : (themeColors?.cardBg || '#374151'),
                                            color: isSelected ? '#ffffff' : (themeColors?.text || '#e5e7eb'),
                                            border: `2px solid ${isSelected ? '#9333ea' : (themeColors?.border || '#4b5563')}`
                                        }}
                                    >
                                        {interest}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Step>

                {/* Step 4: Budget */}
                <Step>
                    <div className="flex flex-col items-center py-6 px-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                        >
                            <DollarSign className="w-8 h-8" style={{ color: '#4ade80' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={getTextStyle()}>Budget Range</h2>
                        <p className="mb-8" style={getSubTextStyle()}>What's your typical daily travel budget?</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                            {[
                                { name: 'Budget', range: '< ₹2,000/day' },
                                { name: 'Moderate', range: '₹2,000 - ₹5,000/day' },
                                { name: 'Luxury', range: '> ₹5,000/day' }
                            ].map((budget) => (
                                <button
                                    key={budget.name}
                                    onClick={() => updateFormData('budget', budget.name)}
                                    className="p-4 rounded-xl text-center transition-all hover:scale-[1.02]"
                                    style={getCardStyle(formData.budget === budget.name)}
                                >
                                    <h3 className="text-lg font-bold" style={getTextStyle()}>{budget.name}</h3>
                                    <p className="text-xs mt-1" style={getSubTextStyle()}>{budget.range}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </Step>
            </Stepper>
        </div>
    );
}
