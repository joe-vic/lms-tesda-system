class UIController {
    constructor() {
        this.currentModule = 'hub';
        this.labsInitialized = false;
        this.examInitialized = false;
        this.defenseInitialized = false;
        this.init();
    }

    init() {
        this.setupNavigationListeners();
        this.setupUserInput();
        this.updateProgressTracker();
        this.renderCourseHub();
    }

    setupNavigationListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const module = e.currentTarget.getAttribute('data-module');
                this.switchModule(module);
            });
        });
    }

    setupUserInput() {
        const userNameInput = document.getElementById('userNameInput');
        const resetBtn = document.getElementById('resetBtn');

        if (userNameInput) {
            userNameInput.value = stateManager.getUserName();
            userNameInput.addEventListener('change', (e) => {
                stateManager.setUserName(e.target.value);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
                    stateManager.resetAllProgress();
                    document.getElementById('userNameInput').value = '';
                    this.renderCourseHub();
                    this.updateProgressTracker();
                }
            });
        }
    }

    switchModule(module) {
        // Hide all modules
        document.querySelectorAll('.module-content').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected module
        const moduleElement = document.getElementById(module);
        if (moduleElement) {
            moduleElement.classList.add('active');
        }

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-module="${module}"]`).classList.add('active');

        this.currentModule = module;

        // Initialize module-specific content
        switch (module) {
            case 'hub':
                this.renderCourseHub();
                break;
            case 'exam':
                this.renderExamModule();
                break;
            case 'lab':
                this.renderLabModule();
                break;
            case 'defense':
                this.renderDefenseModule();
                break;
        }
    }

    renderCourseHub() {
        const accordion = document.getElementById('courseAccordion');
        if (!accordion) return;

        accordion.innerHTML = '';

        COURSE_DATA.forEach((course, index) => {
            const isCompleted = stateManager.isCourseComplete(index);
            const item = document.createElement('div');
            item.className = 'accordion-item';

            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
                <div>
                    <div class="accordion-title">${course.title}</div>
                    <div class="accordion-subtitle">${course.subtitle}</div>
                </div>
                <span class="accordion-toggle">▼</span>
            `;

            const content = document.createElement('div');
            content.className = 'accordion-content';

            const docHtml = `
                <div class="course-documentation">
                    <h4>Overview</h4>
                    <p class="documentation-text">${course.description}</p>
                </div>

                <div class="course-documentation">
                    <h4>Technical Documentation</h4>
                    <p class="documentation-text">${course.documentation}</p>
                </div>

                <div class="course-documentation">
                    <h4>Code Example</h4>
                    <div class="code-snippet-container">
                        <button class="copy-code-btn" data-code-index="${index}">Copy Code</button>
                        <pre>${this.escapeHtml(course.codeSnippet)}</pre>
                    </div>
                </div>

                <button class="mark-complete-btn ${isCompleted ? 'completed' : ''}" data-course-id="${index}">
                    ${isCompleted ? '✓ Completed' : 'Mark as Completed'}
                </button>
            `;

            content.innerHTML = docHtml;

            header.addEventListener('click', () => {
                content.classList.toggle('active');
                header.style.backgroundColor = content.classList.contains('active') ? 'var(--primary-color)' : '';
            });

            item.appendChild(header);
            item.appendChild(content);
            accordion.appendChild(item);
        });

        // Setup copy code buttons
        document.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-code-index'));
                const code = COURSE_DATA[index].codeSnippet;
                navigator.clipboard.writeText(code).then(() => {
                    const original = e.currentTarget.textContent;
                    e.currentTarget.textContent = '✓ Copied!';
                    setTimeout(() => {
                        e.currentTarget.textContent = original;
                    }, 2000);
                });
            });
        });

        // Setup complete buttons
        document.querySelectorAll('.mark-complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = parseInt(e.currentTarget.getAttribute('data-course-id'));
                if (stateManager.markCourseComplete(courseId)) {
                    e.currentTarget.classList.add('completed');
                    e.currentTarget.textContent = '✓ Completed';
                    this.updateProgressTracker();
                }
            });
        });
    }

    renderExamModule() {
        const examContainer = document.getElementById('examContainer');
        if (!examContainer) return;

        if (!this.examInitialized && !examEngine.isExamActive()) {
            examContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3 style="color: var(--primary-color); margin-bottom: 20px;">OCA & TESDA Theory Examination</h3>
                    <p style="margin-bottom: 20px; color: var(--text-light);">
                        This comprehensive exam consists of 15 challenging questions covering advanced Java concepts.
                        Duration: 30 minutes | Passing Score: 75%
                    </p>
                    <button class="btn-primary" id="startExamBtn" style="width: 100%; max-width: 300px;">Start Examination</button>
                </div>

                <div style="margin-top: 40px;">
                    <h3 style="color: var(--primary-color); margin-bottom: 20px;">Grade Book</h3>
                    <div id="gradeBookContainer"></div>
                </div>
            `;

            this.renderGradeBook();

            document.getElementById('startExamBtn').addEventListener('click', () => {
                this.startExam();
            });
        } else if (examEngine.isExamActive()) {
            this.renderExamQuestion();
        } else if (examEngine.currentExamState && examEngine.currentExamState.submitted) {
            this.renderExamResults();
        }
    }

    startExam() {
        examEngine.startExam();
        this.examInitialized = true;
        this.renderExamQuestion();

        // Start timer
        examEngine.updateTimer((timeData) => {
            if (timeData.timeExpired) {
                alert('Time expired! Exam submitted automatically.');
                this.renderExamResults();
            } else {
                const timerElement = document.getElementById('examTimer');
                if (timerElement) {
                    timerElement.textContent = timeData.formatted;
                }
            }
        });
    }

    renderExamQuestion() {
        const examContainer = document.getElementById('examContainer');
        if (!examContainer) return;

        const question = examEngine.getCurrentQuestion();
        if (!question) {
            this.renderExamResults();
            return;
        }

        const progress = examEngine.getQuestionProgress();
        const shuffled = examEngine.shuffleOptions(question);

        let html = `
            <div class="exam-header">
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: var(--text-light); margin-bottom: 8px;">Question ${progress.current} of ${progress.total}</div>
                    <div style="width: 200px; height: 4px; background-color: var(--dark-tertiary); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${(progress.current / progress.total) * 100}%; height: 100%; background-color: var(--primary-color);"></div>
                    </div>
                </div>
                <div class="exam-timer" id="examTimer">30:00</div>
            </div>

            <div class="question-container">
                <div class="question-number">Question ${progress.current}</div>
                <div class="question-text">${question.question}</div>

                <div class="options-list" id="optionsList">
        `;

        shuffled.options.forEach((option, index) => {
            const isAnswered = question.id in examEngine.currentExamState.answers;
            const isSelected = isAnswered && examEngine.currentExamState.answers[question.id].selected === index;

            html += `
                <label class="option ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="question_${question.id}" value="${index}" ${isSelected ? 'checked' : ''}>
                    <span class="option-text">${option}</span>
                </label>
            `;
        });

        html += `
                </div>
            </div>

            <div class="exam-controls">
                <button class="btn-secondary" id="prevBtn" ${progress.current === 1 ? 'disabled' : ''}>Previous</button>
                <button class="btn-primary" id="nextBtn">${progress.current === progress.total ? 'Submit Exam' : 'Next Question'}</button>
            </div>
        `;

        examContainer.innerHTML = html;

        // Setup event listeners
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const selectedIndex = parseInt(e.currentTarget.value);
                examEngine.answerQuestion(question.id, selectedIndex);

                // Update visual feedback
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                e.currentTarget.closest('.option').classList.add('selected');
            });
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            if (examEngine.previousQuestion()) {
                this.renderExamQuestion();
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (progress.current === progress.total) {
                const result = examEngine.submitExam();
                if (result) {
                    examEngine.stopTimer();
                    this.renderExamResults();
                }
            } else {
                if (examEngine.nextQuestion()) {
                    this.renderExamQuestion();
                }
            }
        });
    }

    renderExamResults() {
        const examContainer = document.getElementById('examContainer');
        if (!examContainer) return;

        const results = examEngine.getExamResults();
        if (!results) {
            examEngine.resetExam();
            this.renderExamModule();
            return;
        }

        const percentage = results.percentage.toFixed(2);
        const statusColor = results.isPassing ? 'var(--success-color)' : 'var(--error-color)';

        let html = `
            <div style="text-align: center; padding: 40px; background-color: var(--dark-secondary); border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Examination Completed</h2>
                <div style="font-size: 48px; font-weight: 700; color: ${statusColor}; margin-bottom: 10px;">${percentage}%</div>
                <div style="font-size: 24px; color: ${statusColor}; margin-bottom: 20px;">${results.isPassing ? 'PASSED ✓' : 'FAILED ✗'}</div>
                <div style="font-size: 16px; color: var(--text-light);">Score: ${results.score} out of ${results.totalQuestions}</div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="color: var(--primary-color); margin-bottom: 20px;">Question Review</h3>
                <div id="reviewContainer"></div>
            </div>

            <div style="text-align: center;">
                <button class="btn-primary" id="retakeExamBtn">Retake Exam</button>
            </div>
        `;

        examContainer.innerHTML = html;

        // Render review
        const reviewContainer = document.getElementById('reviewContainer');
        for (const questionId in results.answers) {
            const answer = results.answers[questionId];
            const isCorrect = answer.isCorrect;
            const reviewDiv = document.createElement('div');
            reviewDiv.style.marginBottom = '20px';
            reviewDiv.style.padding = '16px';
            reviewDiv.style.backgroundColor = 'var(--dark-secondary)';
            reviewDiv.style.borderRadius = '8px';
            reviewDiv.style.borderLeft = `4px solid ${isCorrect ? 'var(--success-color)' : 'var(--error-color)'}`;

            reviewDiv.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <div style="font-weight: 700; color: ${isCorrect ? 'var(--success-color)' : 'var(--error-color)'};">
                        ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                    <div style="margin-top: 8px; color: var(--text-light);">${answer.question}</div>
                </div>
                <div style="margin-top: 12px; padding: 12px; background-color: var(--dark-tertiary); border-radius: 4px;">
                    <div style="font-size: 12px; text-transform: uppercase; color: var(--text-light); margin-bottom: 4px;">Explanation:</div>
                    <div style="color: var(--text-light); font-size: 13px;">${answer.explanation}</div>
                </div>
            `;

            reviewContainer.appendChild(reviewDiv);
        }

        document.getElementById('retakeExamBtn').addEventListener('click', () => {
            examEngine.resetExam();
            this.examInitialized = false;
            this.renderExamModule();
        });

        this.updateProgressTracker();
    }

    renderGradeBook() {
        const gradeBookContainer = document.getElementById('gradeBookContainer');
        if (!gradeBookContainer) return;

        const history = examEngine.getGradeBook();

        if (history.length === 0) {
            gradeBookContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-light);">
                    No exam attempts yet. Start your first exam to see results here.
                </div>
            `;
            return;
        }

        let html = `
            <table class="grade-table">
                <thead>
                    <tr>
                        <th>Attempt</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        history.forEach(attempt => {
            const statusBadge = attempt.status === 'PASSED' ? 
                `<span class="score-badge passing">${attempt.status}</span>` :
                `<span class="score-badge failing">${attempt.status}</span>`;

            html += `
                <tr>
                    <td>${attempt.attemptNumber}</td>
                    <td>${attempt.date}</td>
                    <td>${attempt.score}</td>
                    <td>${attempt.percentage}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        gradeBookContainer.innerHTML = html;
    }

    renderLabModule() {
        const labContainer = document.getElementById('labSpecification').parentElement.parentElement;
        if (!labContainer) return;

        if (!this.labsInitialized) {
            const specsDiv = document.getElementById('labSpecification');
            specsDiv.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--primary-color); margin-bottom: 12px; text-transform: uppercase;">Select a Lab</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
            `;

            LAB_SPECIFICATIONS.forEach((lab, index) => {
                const isCompleted = stateManager.isLabComplete(index);
                specsDiv.innerHTML += `
                    <button class="btn-secondary" data-lab-id="${index}" style="justify-content: space-between; display: flex; align-items: center;">
                        <span>${lab.title}</span>
                        <span>${isCompleted ? '✓' : ''}</span>
                    </button>
                `;
            });

            specsDiv.innerHTML += `
                    </div>
                </div>
            `;

            document.querySelectorAll('[data-lab-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const labId = parseInt(e.currentTarget.getAttribute('data-lab-id'));
                    this.startLab(labId);
                });
            });

            this.labsInitialized = true;
        }
    }

    startLab(labId) {
        const spec = labValidator.startLab(labId);
        if (!spec) return;

        const specDiv = document.getElementById('labSpecification');
        const codeEditor = document.getElementById('codeEditor');
        const consoleOutput = document.getElementById('consoleOutput');

        specDiv.innerHTML = `
            <h3 style="margin-bottom: 16px; color: var(--primary-color);">${spec.title}</h3>
            <div style="margin-bottom: 16px;">
                <h4 style="font-weight: 700; margin-bottom: 8px; color: var(--text-dark);">Objective</h4>
                <p style="font-size: 13px; color: var(--text-light); line-height: 1.6;">${spec.objective}</p>
            </div>
            <div class="lab-requirements">
                <h4>Requirements</h4>
                <ul>
                    ${spec.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
        `;

        codeEditor.value = '';
        consoleOutput.innerHTML = '';

        document.getElementById('validateBtn').addEventListener('click', () => {
            labValidator.updateCode(codeEditor.value);
            const results = labValidator.validateCode();
            const output = labValidator.getConsoleOutput(results);
            consoleOutput.innerHTML = output;

            if (results.success) {
                consoleOutput.style.borderTopColor = 'var(--success-color)';
            } else {
                consoleOutput.style.borderTopColor = 'var(--error-color)';
            }
        }, { once: false });

        document.getElementById('resetCodeBtn').addEventListener('click', () => {
            codeEditor.value = '';
            consoleOutput.innerHTML = '';
            labValidator.resetLab();
        }, { once: false });
    }

    renderDefenseModule() {
        const defenseContainer = document.getElementById('assessorQuestion').parentElement;
        if (!defenseContainer) return;

        if (!this.defenseInitialized) {
            defenseSimulator.startDefense();
            this.defenseInitialized = true;
        }

        this.renderDefenseQuestion();
    }

    renderDefenseQuestion() {
        const question = defenseSimulator.getCurrentQuestion();
        if (!question) return;

        const assessorDiv = document.getElementById('assessorQuestion');
        const responseTextarea = document.getElementById('defenseResponse');
        const rubricPanel = document.getElementById('rubricPanel');

        assessorDiv.innerHTML = `
            <div class="assessor-icon">🎤</div>
            <div class="assessor-title">Assessor Panel Question ${question.questionNumber}/${question.totalQuestions}</div>
            <div class="assessor-prompt">${question.question}</div>
        `;

        responseTextarea.value = '';
        responseTextarea.focus();
        rubricPanel.classList.remove('active');
        rubricPanel.innerHTML = '';

        document.getElementById('nextDefenseBtn').addEventListener('click', () => {
            const response = responseTextarea.value;
            if (!response.trim()) {
                alert('Please provide a response before proceeding.');
                return;
            }

            defenseSimulator.recordAnswer(response);

            if (!defenseSimulator.nextQuestion()) {
                this.renderDefenseResults();
                return;
            }

            this.renderDefenseQuestion();
        }, { once: true });

        document.getElementById('revealRubricBtn').addEventListener('click', () => {
            if (rubricPanel.classList.contains('active')) {
                rubricPanel.classList.remove('active');
            } else {
                rubricPanel.classList.add('active');
                rubricPanel.innerHTML = `
                    <div class="rubric-title">Assessor Grading Rubric</div>
                    <div style="white-space: pre-wrap; font-size: 12px; color: var(--text-light); line-height: 1.6;">
                        ${question.rubric}
                    </div>
                `;
            }
        }, { once: false });
    }

    renderDefenseResults() {
        const defenseContainer = document.getElementById('assessorQuestion').parentElement;
        if (!defenseContainer) return;

        const summary = defenseSimulator.getFullDefenseSummary();
        if (!summary) return;

        const results = summary.results;

        let html = `
            <div style="text-align: center; padding: 40px; background-color: var(--dark-secondary); border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: var(--primary-color); margin-bottom: 20px;">Oral Defense Completed</h2>
                <div style="font-size: 48px; font-weight: 700; color: ${results.isPassing ? 'var(--success-color)' : 'var(--error-color)'}; margin-bottom: 10px;">${results.averageScore}%</div>
                <div style="font-size: 24px; color: ${results.isPassing ? 'var(--success-color)' : 'var(--error-color)'}; margin-bottom: 20px;">${results.isPassing ? 'PASSED ✓' : 'NEEDS IMPROVEMENT'}</div>
                <div style="font-size: 16px; color: var(--text-light);">Questions Answered: ${results.questionsAnswered} / ${results.totalQuestions}</div>
            </div>

            <div style="margin-bottom: 30px; padding: 20px; background-color: var(--dark-secondary); border-radius: 8px;">
                <h3 style="color: var(--primary-color); margin-bottom: 12px;">Assessor Comments</h3>
                <p style="color: var(--text-light); line-height: 1.6;">${summary.assessorComments}</p>
            </div>

            <div style="margin-bottom: 30px; padding: 20px; background-color: var(--dark-secondary); border-radius: 8px;">
                <h3 style="color: var(--primary-color); margin-bottom: 12px;">Recommendations</h3>
                <ul style="list-style: none; padding: 0;">
                    ${summary.recommendations.map(rec => `<li style="padding: 6px 0; color: var(--text-light);">• ${rec}</li>`).join('')}
                </ul>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: var(--primary-color); margin-bottom: 12px;">Next Steps</h3>
                ${summary.nextSteps.map(step => `<p style="color: var(--text-light); margin-bottom: 8px;">✓ ${step}</p>`).join('')}
            </div>

            <div style="text-align: center;">
                <button class="btn-primary" id="completDefenseBtn">Continue</button>
            </div>
        `;

        defenseContainer.innerHTML = html;

        document.getElementById('completDefenseBtn').addEventListener('click', () => {
            this.defenseInitialized = false;
            if (stateManager.canGraduate()) {
                stateManager.markGraduated();
                this.switchModule('graduation');
            } else {
                this.switchModule('hub');
            }
            this.updateProgressTracker();
        });
    }

    updateProgressTracker() {
        const coursesCompleted = stateManager.getCoursesCompleted();
        const labsCompleted = stateManager.getLabsCompleted();
        const examPassed = stateManager.hasPassedExam();
        const overallProgress = stateManager.calculateOverallProgress();

        document.getElementById('coursesCompleted').textContent = coursesCompleted;
        document.getElementById('labsCompleted').textContent = labsCompleted;
        document.getElementById('examStatus').textContent = examPassed ? 'Passed ✓' : 'Not Started';
        document.getElementById('progressPercentage').textContent = Math.round(overallProgress);
        document.getElementById('overallProgressBar').style.width = overallProgress + '%';

        this.renderBadges();
    }

    renderBadges() {
        const badgesContainer = document.getElementById('badgesContainer');
        if (!badgesContainer) return;

        const badges = stateManager.getBadges();
        badgesContainer.innerHTML = '';

        badges.forEach(badgeKey => {
            const emoji = stateManager.getBadgeEmoji(badgeKey);
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = emoji;
            badge.title = badgeKey.replace(/_/g, ' ').toUpperCase();
            badgesContainer.appendChild(badge);
        });
    }

    renderGraduationCertificate() {
        const graduationContainer = document.getElementById('graduationContainer');
        if (!graduationContainer) return;

        const userName = stateManager.getUserName() || 'Student';
        const graduationDate = new Date(stateManager.getGraduationDate()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const certificateId = this.generateCertificateId();

        const html = `
            <div class="certificate-container">
                <div class="certificate-header">
                    <div class="certificate-logo">📜</div>
                    <div class="certificate-title">Certificate of Completion</div>
                    <div class="certificate-subtitle">TESDA Java NC III & OCA Certification Program</div>
                </div>

                <div class="certificate-body">
                    <div class="certificate-text">This is to certify that</div>
                    <div class="certificate-recipient">${userName}</div>
                    <div class="certificate-achievement">
                        has successfully completed the comprehensive TESDA Java Programming NC III 
                        and Oracle Certified Associate (OCA) curriculum, demonstrating mastery in:
                    </div>
                    <div class="certificate-text" style="font-size: 13px;">
                        • Object-Oriented Programming Fundamentals<br>
                        • Encapsulation & Access Modifiers<br>
                        • Inheritance & Polymorphism<br>
                        • Exception Handling & Debugging<br>
                        • Arrays & Collections Framework<br>
                        • Advanced Practical Implementation<br>
                        • Architectural Defense & Communication
                    </div>
                </div>

                <div class="certificate-details">
                    <div class="certificate-detail">
                        <div class="certificate-detail-label">Date of Completion</div>
                        <div class="certificate-detail-value">${graduationDate}</div>
                    </div>
                    <div class="certificate-detail">
                        <div class="certificate-detail-label">Certificate ID</div>
                        <div class="certificate-detail-value">${certificateId}</div>
                    </div>
                </div>

                <div class="certificate-footer">
                    <div class="certificate-signature">
                        <div class="signature-line"></div>
                        <div class="signature-title">TESDA Assessment Authority</div>
                    </div>
                    <div class="certificate-seal">🎓</div>
                </div>

                <div class="certificate-actions">
                    <button class="btn-primary" id="printCertBtn">Print Certificate</button>
                    <button class="btn-secondary" id="downloadCertBtn">Share Certificate</button>
                </div>
            </div>
        `;

        graduationContainer.innerHTML = html;

        document.getElementById('printCertBtn').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('downloadCertBtn').addEventListener('click', () => {
            alert(`Certificate ID: ${certificateId}\nShare this ID to verify your certification.`);
        });
    }

    generateCertificateId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `TESDA-${timestamp}-${random}`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

const uiController = new UIController();

// Handle graduation display
stateManager.subscribe((state) => {
    if (state.graduationDate && document.getElementById('graduation')) {
        const graduationModule = document.getElementById('graduation');
        if (!graduationModule.classList.contains('active')) {
            uiController.renderGraduationCertificate();
        }
    }
});

// Initial UI setup
document.addEventListener('DOMContentLoaded', () => {
    if (stateManager.isGraduated()) {
        uiController.switchModule('graduation');
        uiController.renderGraduationCertificate();
    }
});
