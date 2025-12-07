pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        GIT_COMMITTER_EMAIL = ''
    }
    
    stages {
        stage('Get Committer Info') {
            steps {
                script {
                    // Get the email of the person who pushed
                    env.GIT_COMMITTER_EMAIL = sh(
                        script: 'git log -1 --pretty=format:"%ae"',
                        returnStdout: true
                    ).trim()
                    echo "Commit pushed by: ${env.GIT_COMMITTER_EMAIL}"
                }
            }
        }
        
        stage('Verify Part-I Deployment') {
            steps {
                echo 'Checking Part-I deployment on port 80...'
                sh '''
                docker ps | grep bookverse-web || echo "Part-I containers not running"
                '''
            }
        }
        
        stage('Checkout Application') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
            }
        }
        
        stage('Checkout Tests') {
            steps {
                echo 'Cloning test repository...'
                dir('tests') {
                    git branch: 'main',
                        url: 'https://github.com/Romaisa-Munir/bookverse-selenium-tests.git'
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests against Part-I deployment (port 80)...'
                sh '''
                cd ${WORKSPACE}/tests
                
                # Keep original BASE_URL (port 80)
                echo "BASE_URL is set to:"
                grep ^BASE_URL test_bookverse.py
                
                # Run tests and save results
                /home/ubuntu/venv/bin/python3 test_bookverse.py > test_results.txt 2>&1 || echo "Tests completed"
                cat test_results.txt
                '''
            }
        }
        
        stage('Test Summary') {
            steps {
                echo 'Tests executed against Part-I deployment on port 80'
                sh '''
                echo "Application accessible at http://13.201.96.168"
                curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://13.201.96.168 || echo "Cannot reach deployment"
                '''
            }
        }
    }
    
    post {
        always {
            script {
                def testResults = sh(
                    script: 'cat ${WORKSPACE}/tests/test_results.txt 2>/dev/null || echo "No test results found"',
                    returnStdout: true
                ).trim()
                
                def committerEmail = env.GIT_COMMITTER_EMAIL ?: 'fa22bcs084@cuilahore.edu.pk'
                
                emailext(
                    subject: "BookVerse Pipeline - Build #${BUILD_NUMBER} - ${currentBuild.currentResult}",
                    body: """
Jenkins Build Report for BookVerse

Build Number: ${BUILD_NUMBER}
Build Status: ${currentBuild.currentResult}
Build URL: ${BUILD_URL}
Triggered by: ${committerEmail}

Selenium Test Results:
${testResults}

Deployment Information:
- Application URL: http://13.201.96.168
- Tests executed against Part-I deployment on port 80

This is an automated message from Jenkins CI/CD Pipeline.
                    """,
                    to: "${committerEmail}",
                    from: 'jenkins@bookverse.com',
                    replyTo: 'jenkins@bookverse.com'
                )
                
                echo "Email notification sent to: ${committerEmail}"
            }
        }
        success {
            echo '✓ Pipeline completed successfully! Email notification sent.'
        }
        failure {
            echo '✗ Pipeline encountered issues. Email notification sent.'
        }
    }
}
