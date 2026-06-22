// Main Application Entry Point
document.addEventListener('DOMContentLoaded', () => {
    console.log('TESDA LMS Application Initialized');
    console.log('Version: 1.0.0');
    console.log('Platform: Java Programming NC III & OCA Certification');

    // Initialize application
    initializeApplication();
});

function initializeApplication() {
    // Set user theme preference
    const theme = stateManager.getTheme();
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    }

    // Check if user should go directly to graduation
    if (stateManager.isGraduated()) {
        setTimeout(() => {
            uiController.switchModule('graduation');
            uiController.renderGraduationCertificate();
        }, 500);
    }

    // Display user name if available
    if (stateManager.getUserName()) {
        document.getElementById('userNameInput').value = stateManager.getUserName();
    }

    // Add keyboard shortcuts
    setupKeyboardShortcuts();

    // Add theme toggle if needed
    setupThemeToggle();

    // Log application state
    logApplicationState();
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + 1: Learning Hub
        if (e.altKey && e.key === '1') {
            document.querySelector('[data-module="hub"]').click();
        }
        // Alt + 2: Exam Engine
        if (e.altKey && e.key === '2') {
            document.querySelector('[data-module="exam"]').click();
        }
        // Alt + 3: Lab
        if (e.altKey && e.key === '3') {
            document.querySelector('[data-module="lab"]').click();
        }
        // Alt + 4: Defense
        if (e.altKey && e.key === '4') {
            document.querySelector('[data-module="defense"]').click();
        }
    });
}

function setupThemeToggle() {
    // Create theme toggle button in sidebar
    const userSection = document.querySelector('.user-section');
    if (userSection) {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'btn-secondary';
        themeToggle.textContent = '🌓 Toggle Theme';
        themeToggle.style.width = '100%';
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const newTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            stateManager.setTheme(newTheme);
        });
        userSection.insertBefore(themeToggle, userSection.firstChild);
    }
}

function logApplicationState() {
    console.log('=== TESDA LMS Application State ===');
    console.log('User Name:', stateManager.getUserName() || 'Not Set');
    console.log('Courses Completed:', stateManager.getCoursesCompleted() + '/5');
    console.log('Exam Passed:', stateManager.hasPassedExam() ? 'Yes ✓' : 'No');
    console.log('Labs Completed:', stateManager.getLabsCompleted() + '/4');
    console.log('Overall Progress:', Math.round(stateManager.calculateOverallProgress()) + '%');
    console.log('Badges Earned:', stateManager.getBadges().length);
    console.log('Graduated:', stateManager.isGraduated() ? 'Yes ✓' : 'No');
    console.log('=====================================');
}

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    const examActive = examEngine.isExamActive();
    if (examActive) {
        e.preventDefault();
        e.returnValue = 'You have an active exam. Are you sure you want to leave?';
    }
});

// Export state functionality for data portability
window.exportStudentData = () => {
    const data = stateManager.exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tesda-lms-student-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Student data exported successfully');
};

// Import state functionality for data portability
window.importStudentData = (jsonString) => {
    if (stateManager.importState(jsonString)) {
        console.log('Student data imported successfully');
        location.reload();
    } else {
        console.error('Failed to import student data');
        alert('Failed to import data. Please ensure the file is valid.');
    }
};

// Console helper for debugging
window.getStudentProgress = () => {
    return {
        userName: stateManager.getUserName(),
        coursesCompleted: stateManager.getCoursesCompleted(),
        coursesCompletedList: stateManager.state.coursesCompleted,
        examPassed: stateManager.hasPassedExam(),
        examHistory: stateManager.getExamHistory(),
        labsCompleted: stateManager.getLabsCompleted(),
        labsCompletedList: stateManager.state.labsCompleted,
        overallProgress: Math.round(stateManager.calculateOverallProgress()),
        badgesEarned: stateManager.getBadges(),
        graduated: stateManager.isGraduated(),
        graduationDate: stateManager.getGraduationDate(),
        canGraduate: stateManager.canGraduate()
    };
};

// Console helper for testing
window.completeAllForTesting = () => {
    // Set user name
    stateManager.setUserName('Test Student');

    // Complete all courses
    for (let i = 0; i < 5; i++) {
        stateManager.markCourseComplete(i);
    }

    // Simulate exam pass
    stateManager.recordExamAttempt(12, 15, {});

    // Complete all labs
    for (let i = 0; i < 4; i++) {
        stateManager.markLabComplete(i);
    }

    // Mark as graduated
    stateManager.markGraduated();

    console.log('Test data loaded. Page will reload.');
    location.reload();
};

console.log('Welcome to TESDA LMS - Java Programming & OCA Certification');
console.log('Keyboard Shortcuts:');
console.log('  Alt + 1: Learning Hub');
console.log('  Alt + 2: Exam Engine');
console.log('  Alt + 3: Code Lab');
console.log('  Alt + 4: Oral Defense');
console.log('');
console.log('Helper Functions:');
console.log('  getStudentProgress() - Get current progress data');
console.log('  exportStudentData() - Export progress as JSON');
console.log('  importStudentData(jsonString) - Import progress from JSON');
console.log('  completeAllForTesting() - Load test data (development only)');
