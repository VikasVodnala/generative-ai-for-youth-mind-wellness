// MindBridge AI - JavaScript functionality
class MindBridgeAI {
    constructor() {
        this.currentMood = null;
        this.moodHistory = this.loadMoodHistory();
        this.moodChart = null;
        this.breathingInterval = null;
        this.breathingActive = false;
        this.currentGroundingStep = 1;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupNavigation();
        this.setupMoodTracking();
        this.setupChat();
        this.setupResourceFilters();
        this.setupModals();
        this.setupCrisisSupport();
        this.initializeMoodChart();
        this.updateMoodStats();
        
        // Set active section based on URL hash or default to home
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            this.showSection(hash);
        } else {
            this.showSection('home');
        }
    }

    // Navigation System - Fixed
    setupNavigation() {
        // Handle all navigation links and buttons with data-section attribute
        const navElements = document.querySelectorAll('[data-section]');
        
        navElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const section = element.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                    // Update URL hash
                    window.history.pushState(null, null, `#${section}`);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.substring(1) || 'home';
            this.showSection(hash);
        });

        // Mobile menu toggle
        const menuToggle = document.querySelector('.nav__toggle');
        const navMenu = document.querySelector('.nav__menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('nav__menu--active');
            });
        }
    }

    showSection(sectionId) {
        console.log(`Switching to section: ${sectionId}`); // Debug log
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('section--active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('section--active');
            
            // Special handling for mood section to update chart
            if (sectionId === 'mood') {
                setTimeout(() => this.updateMoodChart(), 100);
            }
        } else {
            console.error(`Section not found: ${sectionId}`);
            // Fallback to home
            const homeSection = document.getElementById('home');
            if (homeSection) {
                homeSection.classList.add('section--active');
            }
        }
        
        // Update active nav link
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('nav__link--active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('nav__link--active');
            }
        });
    }

    // Mood Tracking System - Enhanced with navigation fix
    setupMoodTracking() {
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                const moodValue = btn.getAttribute('data-mood');
                this.logMood(moodValue);
                
                // Visual feedback
                moodButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Update mood text
                const moodText = document.querySelector('.mood-text');
                if (moodText) {
                    moodText.textContent = `Mood logged: ${this.getMoodLabel(moodValue)} - View your progress!`;
                    moodText.style.color = 'var(--color-success)';
                }
                
                // Show encouraging message
                this.showMoodFeedback(moodValue);
                
                // Optional: Auto-navigate to mood section after a delay
                setTimeout(() => {
                    if (confirm('Would you like to view your mood tracking dashboard?')) {
                        this.showSection('mood');
                        window.history.pushState(null, null, '#mood');
                    }
                }, 1500);
            });
        });
    }

    logMood(moodValue) {
        const today = new Date().toISOString().split('T')[0];
        const moodScore = this.getMoodScore(moodValue);
        
        this.moodHistory[today] = {
            mood: moodValue,
            score: moodScore,
            timestamp: new Date().toISOString()
        };
        
        this.saveMoodHistory();
        this.updateMoodStats();
        
        // Update chart if on mood section
        if (document.getElementById('mood').classList.contains('section--active')) {
            this.updateMoodChart();
        }
        
        // Show success notification
        this.showNotification(`Mood logged successfully: ${this.getMoodLabel(moodValue)}!`, 'success');
    }

    getMoodScore(moodValue) {
        const scores = {
            'very-sad': 1,
            'sad': 2,
            'neutral': 3,
            'happy': 4,
            'very-happy': 5
        };
        return scores[moodValue] || 3;
    }

    getMoodLabel(moodValue) {
        const labels = {
            'very-sad': 'Very Sad',
            'sad': 'Sad',
            'neutral': 'Neutral',
            'happy': 'Happy',
            'very-happy': 'Very Happy'
        };
        return labels[moodValue] || 'Unknown';
    }

    showMoodFeedback(moodValue) {
        const messages = {
            'very-sad': "I'm here for you. Consider reaching out for support if you need it.",
            'sad': "It's okay to have difficult days. You're doing great by tracking your mood.",
            'neutral': "Every day is a step forward. Keep taking care of yourself.",
            'happy': "Great to see you're feeling good today! Keep up the positive momentum.",
            'very-happy': "Wonderful! I'm so glad you're having such a great day!"
        };
        
        // Show as notification
        this.showNotification(messages[moodValue], 'info');
    }

    loadMoodHistory() {
        try {
            return JSON.parse(localStorage.getItem('mindbridge-mood-history')) || {};
        } catch (e) {
            return {};
        }
    }

    saveMoodHistory() {
        try {
            localStorage.setItem('mindbridge-mood-history', JSON.stringify(this.moodHistory));
        } catch (e) {
            console.warn('Could not save mood history to localStorage');
        }
    }

    updateMoodStats() {
        const streakElement = document.getElementById('streakCount');
        const avgMoodElement = document.getElementById('avgMood');
        const totalEntriesElement = document.getElementById('totalEntries');
        
        const streak = this.calculateStreak();
        const avgMood = this.calculateAverageMood();
        const totalEntries = Object.keys(this.moodHistory).length;
        
        if (streakElement) streakElement.textContent = streak;
        if (avgMoodElement) avgMoodElement.textContent = avgMood;
        if (totalEntriesElement) totalEntriesElement.textContent = totalEntries;
    }

    calculateStreak() {
        const dates = Object.keys(this.moodHistory).sort().reverse();
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    calculateAverageMood() {
        const scores = Object.values(this.moodHistory).map(entry => entry.score);
        if (scores.length === 0) return 'No Data';
        
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        if (avg >= 4.5) return 'Very Happy';
        if (avg >= 3.5) return 'Happy';
        if (avg >= 2.5) return 'Neutral';
        if (avg >= 1.5) return 'Sad';
        return 'Very Sad';
    }

    // Chart Initialization and Updates
    initializeMoodChart() {
        const canvas = document.getElementById('moodChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Mood Score',
                    data: [],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1FB8CD',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const labels = ['', 'Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                                return `Mood: ${labels[context.parsed.y]}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0.5,
                        max: 5.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = ['', 'Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                                return labels[value] || '';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
        
        this.updateMoodChart();
    }

    updateMoodChart() {
        if (!this.moodChart) return;
        
        const sortedDates = Object.keys(this.moodHistory).sort();
        const last30Days = sortedDates.slice(-30);
        
        const labels = last30Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const data = last30Days.map(date => this.moodHistory[date].score);
        
        this.moodChart.data.labels = labels;
        this.moodChart.data.datasets[0].data = data;
        this.moodChart.update();
    }

    // Chat System with AI Simulation - Enhanced
    setupChat() {
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (chatForm && chatInput && chatMessages) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message) {
                    this.addMessage(message, 'user');
                    chatInput.value = '';
                    
                    // Check for crisis keywords
                    if (this.detectCrisisKeywords(message)) {
                        this.showCrisisWarning();
                    }
                    
                    // Show typing indicator
                    this.showTypingIndicator();
                    
                    // Simulate AI response after a delay
                    setTimeout(() => {
                        this.hideTypingIndicator();
                        const response = this.generateAIResponse(message);
                        this.addMessage(response, 'bot');
                    }, 1000 + Math.random() * 2000);
                }
            });
            
            // Add welcome message on first visit to chat
            this.addWelcomeChatMessage();
        }
    }

    addWelcomeChatMessage() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && chatMessages.children.length <= 1) {
            setTimeout(() => {
                this.addMessage("Welcome to MindBridge AI! I'm here to provide support and listen to whatever is on your mind. Feel free to share how you're feeling today.", 'bot');
            }, 500);
        }
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <p>MindBridge AI is typing...</p>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    addMessage(content, type) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
            <span class="message-time">${timeString}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    detectCrisisKeywords(message) {
        const crisisKeywords = [
            'suicide', 'kill myself', 'end it all', 'want to die', 'hurt myself',
            'self harm', 'cutting', 'overdose', 'jump', 'bridge', 'pills',
            'worthless', 'hopeless', 'no point', 'give up', 'can\'t go on'
        ];
        
        const lowerMessage = message.toLowerCase();
        return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    showCrisisWarning() {
        const crisisWarning = document.getElementById('crisisWarning');
        if (crisisWarning) {
            crisisWarning.classList.remove('hidden');
            setTimeout(() => {
                crisisWarning.classList.add('hidden');
            }, 15000); // Hide after 15 seconds
        }
    }

    generateAIResponse(userMessage) {
        const responses = {
            greeting: [
                "Hello! I'm here to listen and support you. How are you feeling today?",
                "Hi there! Thanks for reaching out. What's on your mind?",
                "Hello! I'm glad you're here. How can I help you today?"
            ],
            mood: [
                "Thank you for sharing how you're feeling. It takes courage to open up about our emotions.",
                "I appreciate you telling me about your mood. Your feelings are valid and important.",
                "It's really helpful that you're being honest about how you feel. That's a big step."
            ],
            anxiety: [
                "Anxiety can feel overwhelming, but remember that you're stronger than you think. Let's try some grounding techniques.",
                "I understand anxiety can be difficult. Have you tried the 4-7-8 breathing technique? It can be very helpful.",
                "Anxiety is treatable and you don't have to face it alone. Would you like to explore some coping strategies?"
            ],
            depression: [
                "Depression can make everything feel heavy, but you're taking a positive step by talking about it.",
                "I want you to know that what you're experiencing is real and valid. Have you considered speaking with a professional?",
                "Thank you for trusting me with this. Remember, depression is treatable and things can get better."
            ],
            stress: [
                "Stress is a normal part of life, but it's important to manage it healthy ways. What's been causing you the most stress lately?",
                "It sounds like you're dealing with a lot right now. Let's think about some ways to help you cope with stress.",
                "Stress can affect us physically and mentally. Have you tried any relaxation techniques recently?"
            ],
            support: [
                "You're not alone in this. Many people your age face similar challenges, and it's okay to ask for help.",
                "I'm here to support you, and there are many resources available to help you through difficult times.",
                "Reaching out shows real strength. You're taking care of yourself by seeking support."
            ],
            coping: [
                "Developing healthy coping strategies takes time and practice. What has helped you in the past?",
                "There are many effective coping techniques we can explore together. Are you interested in learning some new ones?",
                "It's great that you're thinking about coping strategies. This shows real self-awareness and growth."
            ],
            positive: [
                "I'm so glad to hear you're feeling good! What's been going well for you lately?",
                "That's wonderful! It's important to acknowledge and celebrate positive moments.",
                "I love hearing when people are doing well. What's contributing to these positive feelings?"
            ]
        };

        const message = userMessage.toLowerCase();
        
        // Crisis responses
        if (this.detectCrisisKeywords(message)) {
            return "I'm very concerned about what you've shared. Please know that you matter and help is available. Consider calling 988 (Suicide & Crisis Lifeline) or texting HOME to 741741 for immediate support. Would you like me to help you find local crisis resources?";
        }
        
        // Categorize message and respond
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return this.getRandomResponse(responses.greeting);
        }
        
        if (message.includes('anxious') || message.includes('anxiety') || message.includes('worried') || message.includes('panic')) {
            return this.getRandomResponse(responses.anxiety);
        }
        
        if (message.includes('depressed') || message.includes('depression') || message.includes('sad') || message.includes('down')) {
            return this.getRandomResponse(responses.depression);
        }
        
        if (message.includes('stressed') || message.includes('stress') || message.includes('overwhelmed')) {
            return this.getRandomResponse(responses.stress);
        }
        
        if (message.includes('happy') || message.includes('good') || message.includes('great') || message.includes('better')) {
            return this.getRandomResponse(responses.positive);
        }
        
        if (message.includes('cope') || message.includes('coping') || message.includes('help')) {
            return this.getRandomResponse(responses.coping);
        }
        
        if (message.includes('feel') || message.includes('feeling') || message.includes('mood')) {
            return this.getRandomResponse(responses.mood);
        }
        
        // Default supportive response
        return this.getRandomResponse(responses.support);
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Resource Filtering
    setupResourceFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const resourceCards = document.querySelectorAll('.resource-card');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('filter-btn--active'));
                btn.classList.add('filter-btn--active');
                
                // Filter resources
                resourceCards.forEach(card => {
                    if (category === 'all' || card.getAttribute('data-category') === category) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Modal System
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        const modalTriggers = document.querySelectorAll('[data-modal]');
        const closeButtons = document.querySelectorAll('.modal-close');
        
        // Open modals
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.getAttribute('data-modal');
                this.openModal(modalId);
            });
        });
        
        // Close modals
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Close on backdrop click
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        this.setupBreathingExercise();
        this.setupGroundingExercise();
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
        
        // Stop any active exercises
        if (this.breathingActive) {
            this.stopBreathing();
        }
    }

    // Crisis Support Features
    setupCrisisSupport() {
        const breathingBtn = document.querySelector('.breathing-exercise-btn');
        const groundingBtn = document.querySelector('.grounding-btn');
        
        if (breathingBtn) {
            breathingBtn.addEventListener('click', () => {
                this.openModal('breathingModal');
            });
        }
        
        if (groundingBtn) {
            groundingBtn.addEventListener('click', () => {
                this.openModal('groundingModal');
            });
        }
    }

    // Breathing Exercise
    setupBreathingExercise() {
        const startBtn = document.getElementById('startBreathing');
        const stopBtn = document.getElementById('stopBreathing');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startBreathing());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopBreathing());
        }
    }

    startBreathing() {
        if (this.breathingActive) return;
        
        this.breathingActive = true;
        const circle = document.getElementById('breathingCircle');
        const instructions = document.getElementById('breathingInstructions');
        
        let phase = 'prepare';
        let count = 0;
        
        const breathingCycle = () => {
            if (!this.breathingActive) return;
            
            switch (phase) {
                case 'prepare':
                    instructions.textContent = 'Get ready...';
                    setTimeout(() => {
                        phase = 'inhale';
                        breathingCycle();
                    }, 1000);
                    break;
                    
                case 'inhale':
                    instructions.textContent = 'Breathe in slowly...';
                    circle.classList.add('inhale');
                    circle.classList.remove('exhale');
                    setTimeout(() => {
                        phase = 'hold1';
                        breathingCycle();
                    }, 4000);
                    break;
                    
                case 'hold1':
                    instructions.textContent = 'Hold your breath...';
                    setTimeout(() => {
                        phase = 'exhale';
                        breathingCycle();
                    }, 7000);
                    break;
                    
                case 'exhale':
                    instructions.textContent = 'Breathe out slowly...';
                    circle.classList.add('exhale');
                    circle.classList.remove('inhale');
                    setTimeout(() => {
                        count++;
                        if (count < 5) {
                            phase = 'inhale';
                            breathingCycle();
                        } else {
                            this.completeBreathing();
                        }
                    }, 8000);
                    break;
            }
        };
        
        breathingCycle();
    }

    stopBreathing() {
        this.breathingActive = false;
        const circle = document.getElementById('breathingCircle');
        const instructions = document.getElementById('breathingInstructions');
        
        if (circle) {
            circle.classList.remove('inhale', 'exhale');
        }
        
        if (instructions) {
            instructions.textContent = 'Exercise stopped. You did great!';
        }
    }

    completeBreathing() {
        this.breathingActive = false;
        const instructions = document.getElementById('breathingInstructions');
        
        if (instructions) {
            instructions.textContent = 'Well done! You completed the breathing exercise.';
        }
    }

    // Grounding Exercise
    setupGroundingExercise() {
        const nextBtn = document.getElementById('groundingNext');
        const prevBtn = document.getElementById('groundingPrev');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextGroundingStep());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevGroundingStep());
        }
        
        // Reset to first step when modal opens
        this.currentGroundingStep = 1;
        this.updateGroundingButtons();
    }

    nextGroundingStep() {
        const currentStep = document.querySelector('.grounding-step.active');
        const nextStep = currentStep.nextElementSibling;
        
        if (nextStep && nextStep.classList.contains('grounding-step')) {
            currentStep.classList.remove('active');
            nextStep.classList.add('active');
            this.currentGroundingStep++;
        } else {
            // Complete exercise
            this.showNotification('Great job completing the grounding exercise!', 'success');
            this.closeAllModals();
            this.currentGroundingStep = 1;
        }
        
        this.updateGroundingButtons();
    }

    prevGroundingStep() {
        const currentStep = document.querySelector('.grounding-step.active');
        const prevStep = currentStep.previousElementSibling;
        
        if (prevStep && prevStep.classList.contains('grounding-step')) {
            currentStep.classList.remove('active');
            prevStep.classList.add('active');
            this.currentGroundingStep--;
        }
        
        this.updateGroundingButtons();
    }

    updateGroundingButtons() {
        const nextBtn = document.getElementById('groundingNext');
        const prevBtn = document.getElementById('groundingPrev');
        
        if (prevBtn) {
            prevBtn.style.visibility = this.currentGroundingStep > 1 ? 'visible' : 'hidden';
        }
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            background: type === 'success' ? 'var(--color-success)' : 'var(--color-primary)',
            color: 'white',
            zIndex: '1001',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mindBridgeApp = new MindBridgeAI();
});

// Handle page visibility change to update charts
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.mindBridgeApp && window.mindBridgeApp.moodChart) {
        window.mindBridgeApp.updateMoodChart();
    }
});

// Add some sample data for demo purposes
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.mindBridgeApp && Object.keys(window.mindBridgeApp.moodHistory).length === 0) {
            // Add sample mood data for the last 14 days
            const today = new Date();
            const sampleMoods = ['happy', 'neutral', 'happy', 'very-happy', 'sad', 'neutral', 'happy', 
                                'very-happy', 'happy', 'neutral', 'sad', 'happy', 'very-happy', 'happy'];
            
            for (let i = 13; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                const moodValue = sampleMoods[13 - i];
                const moodScore = window.mindBridgeApp.getMoodScore(moodValue);
                
                window.mindBridgeApp.moodHistory[dateString] = {
                    mood: moodValue,
                    score: moodScore,
                    timestamp: date.toISOString()
                };
            }
            
            window.mindBridgeApp.saveMoodHistory();
            window.mindBridgeApp.updateMoodStats();
            
            // Update chart if visible
            if (document.getElementById('mood').classList.contains('section--active')) {
                window.mindBridgeApp.updateMoodChart();
            }
        }
    }, 1000);
});