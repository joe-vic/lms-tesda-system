class LabValidator {
    constructor() {
        this.currentLabState = null;
        this.validationResults = null;
    }

    startLab(labId) {
        if (labId < 0 || labId >= LAB_SPECIFICATIONS.length) {
            return null;
        }

        const spec = LAB_SPECIFICATIONS[labId];
        this.currentLabState = {
            labId: labId,
            spec: spec,
            code: '',
            submitted: false,
            validationResults: null,
            submissionTime: null
        };

        return spec;
    }

    updateCode(code) {
        if (!this.currentLabState) {
            return false;
        }
        this.currentLabState.code = code;
        return true;
    }

    getCode() {
        return this.currentLabState ? this.currentLabState.code : '';
    }

    validateCode() {
        if (!this.currentLabState || !this.currentLabState.code.trim()) {
            return {
                success: false,
                errors: ['Code editor is empty. Please write Java code.'],
                warnings: [],
                passed: [],
                message: 'COMPILATION FAILED'
            };
        }

        const code = this.currentLabState.code;
        const tests = this.currentLabState.spec.validationTests;
        const results = {
            success: true,
            errors: [],
            warnings: [],
            passed: [],
            message: 'COMPILATION SUCCESSFUL: COMPETENT',
            details: []
        };

        // Run validation tests
        for (const test of tests) {
            try {
                if (test.check(code)) {
                    results.passed.push(test.name);
                    results.details.push({
                        test: test.name,
                        status: 'PASS',
                        message: `✓ ${test.name} validation passed`
                    });
                } else {
                    results.success = false;
                    results.errors.push(`✗ ${test.name} validation failed`);
                    results.details.push({
                        test: test.name,
                        status: 'FAIL',
                        message: `✗ ${test.name} validation failed - Required pattern not found`
                    });
                }
            } catch (error) {
                results.success = false;
                results.errors.push(`Error in ${test.name} validation: ${error.message}`);
            }
        }

        // Perform syntax analysis
        const syntaxAnalysis = this.performSyntaxAnalysis(code);
        if (!syntaxAnalysis.valid) {
            results.success = false;
            results.errors.push(...syntaxAnalysis.errors);
            results.message = 'COMPILATION FAILED';
        }

        if (syntaxAnalysis.warnings.length > 0) {
            results.warnings.push(...syntaxAnalysis.warnings);
        }

        results.details.push(...syntaxAnalysis.details);
        this.validationResults = results;
        return results;
    }

    performSyntaxAnalysis(code) {
        const analysis = {
            valid: true,
            errors: [],
            warnings: [],
            details: []
        };

        // Check for basic syntax issues
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            analysis.valid = false;
            analysis.errors.push(`Brace mismatch: ${openBraces} opening, ${closeBraces} closing`);
            analysis.details.push({
                line: 'syntax',
                type: 'error',
                message: 'Brace mismatch detected'
            });
        }

        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            analysis.valid = false;
            analysis.errors.push(`Parenthesis mismatch: ${openParens} opening, ${closeParens} closing`);
            analysis.details.push({
                line: 'syntax',
                type: 'error',
                message: 'Parenthesis mismatch detected'
            });
        }

        // Check for common issues
        if (code.includes('System.out.println') && !code.includes('public')) {
            analysis.warnings.push('Missing public access modifier on main method');
            analysis.details.push({
                line: 'style',
                type: 'warning',
                message: 'Consider using public access modifiers'
            });
        }

        // Check for required structure
        if (!code.includes('class')) {
            analysis.valid = false;
            analysis.errors.push('No class definition found');
            analysis.details.push({
                line: '1',
                type: 'error',
                message: 'Class definition is required'
            });
        }

        return analysis;
    }

    getValidationResults() {
        return this.validationResults;
    }

    submitLab() {
        if (!this.currentLabState) {
            return null;
        }

        const validationResults = this.validateCode();
        if (!validationResults.success) {
            return {
                submitted: false,
                message: 'Cannot submit: Code validation failed',
                errors: validationResults.errors
            };
        }

        this.currentLabState.submitted = true;
        this.currentLabState.validationResults = validationResults;
        this.currentLabState.submissionTime = new Date().toISOString();

        // Mark lab as complete in state manager
        stateManager.markLabComplete(this.currentLabState.labId);

        return {
            submitted: true,
            labId: this.currentLabState.labId,
            message: 'Lab submitted successfully!',
            score: validationResults.passed.length + '/' + this.currentLabState.spec.validationTests.length,
            results: validationResults
        };
    }

    getConsoleOutput(validationResults) {
        if (!validationResults) {
            return '';
        }

        let output = '';

        if (validationResults.success) {
            output += `[✓ COMPILATION SUCCESSFUL]\n`;
            output += `[INFO] Validating structure...\n\n`;

            validationResults.passed.forEach(test => {
                output += `[✓ PASS] ${test}\n`;
            });

            output += `\n[SUCCESS] All validations passed!\n`;
            output += `[INFO] Lab is ready for submission.\n`;
        } else {
            output += `[✗ COMPILATION FAILED]\n`;
            output += `[ERROR] Validation errors detected:\n\n`;

            validationResults.errors.forEach(error => {
                output += `[✗] ${error}\n`;
            });

            if (validationResults.warnings.length > 0) {
                output += `\n[WARNING] Code quality issues:\n`;
                validationResults.warnings.forEach(warning => {
                    output += `[⚠] ${warning}\n`;
                });
            }
        }

        return output;
    }

    resetLab() {
        if (this.currentLabState) {
            this.currentLabState.code = '';
            this.validationResults = null;
        }
    }

    getLab() {
        return this.currentLabState;
    }

    isLabSubmitted() {
        return this.currentLabState && this.currentLabState.submitted;
    }
}

const labValidator = new LabValidator();
