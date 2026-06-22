class DefenseSimulator {
    constructor() {
        this.currentDefenseState = null;
        this.currentQuestionIndex = 0;
    }

    startDefense() {
        this.currentDefenseState = {
            startTime: Date.now(),
            questions: this.shuffleQuestions(DEFENSE_QUESTIONS),
            currentQuestionIndex: 0,
            answers: {},
            completed: false
        };
        this.currentQuestionIndex = 0;
        return this.currentDefenseState;
    }

    shuffleQuestions(questions) {
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getCurrentQuestion() {
        if (!this.currentDefenseState) {
            return null;
        }

        const question = this.currentDefenseState.questions[this.currentDefenseState.currentQuestionIndex];
        return {
            id: question.id,
            questionNumber: this.currentDefenseState.currentQuestionIndex + 1,
            totalQuestions: this.currentDefenseState.questions.length,
            question: question.question,
            rubric: question.rubric
        };
    }

    recordAnswer(response) {
        if (!this.currentDefenseState) {
            return false;
        }

        const question = this.currentDefenseState.questions[this.currentDefenseState.currentQuestionIndex];
        if (!question) {
            return false;
        }

        this.currentDefenseState.answers[question.id] = {
            questionId: question.id,
            questionText: question.question,
            response: response,
            timestamp: new Date().toISOString(),
            rubric: question.rubric
        };

        // Record in state manager
        stateManager.recordDefenseAnswer(question.id, response);

        return true;
    }

    nextQuestion() {
        if (!this.currentDefenseState) {
            return false;
        }

        if (this.currentDefenseState.currentQuestionIndex < this.currentDefenseState.questions.length - 1) {
            this.currentDefenseState.currentQuestionIndex++;
            return true;
        } else {
            this.currentDefenseState.completed = true;
            return false;
        }
    }

    previousQuestion() {
        if (!this.currentDefenseState || this.currentDefenseState.currentQuestionIndex === 0) {
            return false;
        }

        this.currentDefenseState.currentQuestionIndex--;
        return true;
    }

    isDefenseComplete() {
        return this.currentDefenseState && this.currentDefenseState.completed;
    }

    getProgress() {
        if (!this.currentDefenseState) {
            return { current: 0, total: 0, answered: 0, percentage: 0 };
        }

        const answered = Object.keys(this.currentDefenseState.answers).length;
        const total = this.currentDefenseState.questions.length;
        const percentage = (answered / total) * 100;

        return {
            current: this.currentDefenseState.currentQuestionIndex + 1,
            total: total,
            answered: answered,
            percentage: Math.round(percentage)
        };
    }

    getRubric(questionId) {
        const question = DEFENSE_QUESTIONS.find(q => q.id === questionId);
        return question ? question.rubric : '';
    }

    getAnswerFeedback(questionId) {
        if (!this.currentDefenseState || !this.currentDefenseState.answers[questionId]) {
            return null;
        }

        const answer = this.currentDefenseState.answers[questionId];
        const rubric = this.getRubric(questionId);

        return {
            questionId: questionId,
            response: answer.response,
            rubric: rubric,
            feedback: this.generateFeedback(answer.response, rubric)
        };
    }

    generateFeedback(response, rubric) {
        if (!response || response.trim().length === 0) {
            return {
                message: 'No response provided',
                type: 'error',
                score: 0
            };
        }

        const responseLength = response.split(/\s+/).length;
        let score = 0;
        let message = '';

        if (responseLength < 20) {
            score = 25;
            message = 'Response is too brief. Provide more detailed explanation.';
        } else if (responseLength < 50) {
            score = 50;
            message = 'Response is somewhat detailed but could include more examples or justification.';
        } else if (responseLength < 100) {
            score = 75;
            message = 'Good response with reasonable detail. Consider adding specific code examples or metrics.';
        } else {
            score = 100;
            message = 'Excellent response with comprehensive detail and examples.';
        }

        return {
            score: score,
            message: message,
            type: score >= 75 ? 'success' : score >= 50 ? 'warning' : 'error'
        };
    }

    getDefenseResults() {
        if (!this.currentDefenseState) {
            return null;
        }

        const answers = this.currentDefenseState.answers;
        let totalScore = 0;
        const feedback = [];

        for (const questionId in answers) {
            const feedbackItem = this.getAnswerFeedback(parseInt(questionId));
            if (feedbackItem) {
                feedback.push(feedbackItem);
                totalScore += feedbackItem.feedback.score;
            }
        }

        const averageScore = Object.keys(answers).length > 0 ? totalScore / Object.keys(answers).length : 0;

        return {
            completed: this.currentDefenseState.completed,
            totalQuestions: this.currentDefenseState.questions.length,
            questionsAnswered: Object.keys(answers).length,
            averageScore: Math.round(averageScore),
            isPassing: averageScore >= 75,
            feedback: feedback,
            completionTime: Date.now() - this.currentDefenseState.startTime
        };
    }

    resetDefense() {
        this.currentDefenseState = null;
        this.currentQuestionIndex = 0;
    }

    getAssessorComments(score) {
        if (score >= 90) {
            return 'Outstanding performance. You demonstrated exceptional understanding of advanced OOP concepts and design principles.';
        } else if (score >= 75) {
            return 'Good performance. You showed solid understanding of the concepts. Consider adding more real-world examples in future assessments.';
        } else if (score >= 60) {
            return 'Satisfactory performance. You have basic understanding but need deeper insight into architectural patterns.';
        } else {
            return 'Needs improvement. Review the course materials and focus on understanding OOP fundamentals and design principles.';
        }
    }

    getFullDefenseSummary() {
        const results = this.getDefenseResults();
        if (!results) {
            return null;
        }

        return {
            results: results,
            assessorComments: this.getAssessorComments(results.averageScore),
            recommendations: this.getRecommendations(results.averageScore),
            nextSteps: results.isPassing ? ['Congratulations! You have passed the oral defense.', 'Proceed to graduation ceremony.'] : ['Review feedback on specific questions.', 'Schedule a follow-up session with an assessor.', 'Complete additional practice assessments.']
        };
    }

    getRecommendations(score) {
        const recommendations = [];

        if (score < 60) {
            recommendations.push('Study the SOLID principles in depth');
            recommendations.push('Review design patterns and their applications');
            recommendations.push('Practice explaining code architecture in detail');
        } else if (score < 75) {
            recommendations.push('Deepen understanding of polymorphism and covariance');
            recommendations.push('Study advanced exception handling scenarios');
            recommendations.push('Practice real-world project discussions');
        } else if (score < 90) {
            recommendations.push('Explore edge cases in collections and concurrency');
            recommendations.push('Study performance optimization techniques');
            recommendations.push('Review latest Java features and best practices');
        } else {
            recommendations.push('Mentor junior developers on OOP principles');
            recommendations.push('Contribute to open-source Java projects');
            recommendations.push('Explore advanced topics like reactive programming');
        }

        return recommendations;
    }
}

const defenseSimulator = new DefenseSimulator();
