class StateManager {
    constructor() {
        this.STATE_KEY = 'tesda_lms_state';
        this.BADGE_NAMES = {
            'course_1_complete': '📘',
            'course_2_complete': '📗',
            'course_3_complete': '📙',
            'course_4_complete': '📕',
            'course_5_complete': '📓',
            'exam_passed': '🏆',
            'lab_1_complete': '⚙️',
            'lab_2_complete': '🔧',
            'lab_3_complete': '🛠️',
            'lab_4_complete': '⚡',
            'defense_complete': '🎤',
            'graduation_complete': '🎓'
        };

        this.state = this.loadState();
    }

    loadState() {
        const stored = localStorage.getItem(this.STATE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getDefaultState();
    }

    getDefaultState() {
        return {
            userName: '',
            coursesCompleted: [],
            examHistory: [],
            labsCompleted: [],
            defenseQuestionsAnswered: [],
            badgesEarned: [],
            graduationDate: null,
            lastUpdated: new Date().toISOString(),
            theme: 'dark'
        };
    }

    saveState() {
        this.state.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.STATE_KEY, JSON.stringify(this.state));
        this.notifyListeners();
    }

    setUserName(name) {
        this.state.userName = name;
        this.saveState();
    }

    getUserName() {
        return this.state.userName;
    }

    markCourseComplete(courseId) {
        if (!this.state.coursesCompleted.includes(courseId)) {
            this.state.coursesCompleted.push(courseId);
            const badgeKey = `course_${courseId + 1}_complete`;
            this.earnBadge(badgeKey);
            this.saveState();
            return true;
        }
        return false;
    }

    isCourseComplete(courseId) {
        return this.state.coursesCompleted.includes(courseId);
    }

    getCoursesCompleted() {
        return this.state.coursesCompleted.length;
    }

    recordExamAttempt(score, totalQuestions, answers) {
        const attempt = {
            score: score,
            totalQuestions: totalQuestions,
            percentage: (score / totalQuestions) * 100,
            isPassing: (score / totalQuestions) * 100 >= 75,
            date: new Date().toISOString(),
            answers: answers
        };
        this.state.examHistory.push(attempt);
        if (attempt.isPassing) {
            this.earnBadge('exam_passed');
        }
        this.saveState();
        return attempt;
    }

    getExamHistory() {
        return this.state.examHistory;
    }

    hasPassedExam() {
        return this.state.examHistory.some(attempt => attempt.isPassing);
    }

    getLatestExamScore() {
        if (this.state.examHistory.length === 0) return null;
        return this.state.examHistory[this.state.examHistory.length - 1];
    }

    markLabComplete(labId) {
        if (!this.state.labsCompleted.includes(labId)) {
            this.state.labsCompleted.push(labId);
            const badgeKey = `lab_${labId + 1}_complete`;
            this.earnBadge(badgeKey);
            this.saveState();
            return true;
        }
        return false;
    }

    isLabComplete(labId) {
        return this.state.labsCompleted.includes(labId);
    }

    getLabsCompleted() {
        return this.state.labsCompleted.length;
    }

    recordDefenseAnswer(questionId, response) {
        const answer = {
            questionId: questionId,
            response: response,
            date: new Date().toISOString()
        };
        this.state.defenseQuestionsAnswered.push(answer);
        this.saveState();
    }

    getDefenseAnswers() {
        return this.state.defenseQuestionsAnswered;
    }

    earnBadge(badgeKey) {
        if (!this.state.badgesEarned.includes(badgeKey)) {
            this.state.badgesEarned.push(badgeKey);
            this.saveState();
            return true;
        }
        return false;
    }

    getBadges() {
        return this.state.badgesEarned;
    }

    getBadgeEmoji(badgeKey) {
        return this.BADGE_NAMES[badgeKey] || '⭐';
    }

    canGraduate() {
        const coursesComplete = this.state.coursesCompleted.length === 5;
        const examPassed = this.hasPassedExam();
        const labsComplete = this.state.labsCompleted.length === 4;
        return coursesComplete && examPassed && labsComplete;
    }

    markGraduated() {
        if (this.canGraduate()) {
            this.state.graduationDate = new Date().toISOString();
            this.earnBadge('graduation_complete');
            this.saveState();
            return true;
        }
        return false;
    }

    isGraduated() {
        return this.state.graduationDate !== null;
    }

    getGraduationDate() {
        return this.state.graduationDate;
    }

    calculateOverallProgress() {
        const courseProgress = (this.state.coursesCompleted.length / 5) * 100;
        const examProgress = this.hasPassedExam() ? 100 : 0;
        const labProgress = (this.state.labsCompleted.length / 4) * 100;
        return (courseProgress + examProgress + labProgress) / 3;
    }

    resetAllProgress() {
        this.state = this.getDefaultState();
        localStorage.removeItem(this.STATE_KEY);
        this.saveState();
    }

    setTheme(theme) {
        this.state.theme = theme;
        this.saveState();
    }

    getTheme() {
        return this.state.theme;
    }

    listeners = [];

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.state));
    }

    exportState() {
        return JSON.stringify(this.state, null, 2);
    }

    importState(stateJson) {
        try {
            const importedState = JSON.parse(stateJson);
            this.state = { ...this.state, ...importedState };
            this.saveState();
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
}

const stateManager = new StateManager();
