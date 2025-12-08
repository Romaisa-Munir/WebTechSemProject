pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        GIT_COMMITTER_EMAIL = ''
    }
    
    stages {
        stage('Cleanup Old Deployment') {
            steps {
                echo 'Taking down existing deployment on Port 8081...'
                // This ensures the app is DOWN while tests are running
                sh 'docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml down || true'
            }
        }

        stage('Get Committer Info') {
            steps {
                script {
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

        stage('Deploy to Port 8081') {
            steps {
                echo 'Starting application containers on Port 8081...'
                sh '''
                    # Bring up the containers for the 8081 deployment
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml up -d --build
                    
                    echo 'Importing database data...'
                    sleep 60  # Wait for MongoDB to be ready

                    # Restore database imports
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file /tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file /tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file /tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file /tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                '''
            }
        }

        stage('Verify Port 8081 Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                    echo "Application should be accessible at http://65.2.129.230:8081"
                '''
            }
        }
    }
    
    post {
        always {
            script {
                sh "git config --global --add safe.directory ${env.WORKSPACE}"
                def committer = sh(
                    script: "git log -1 --pretty=format:'%ae'",
                    returnStdout: true
                ).trim()

                def testResultsContent = sh(
                    script: "cat ${WORKSPACE}/tests/test_results.txt 2>/dev/null || echo 'Test results file not found.'",
                    returnStdout: true
                ).trim()

                def emailBody = """
Test Summary (Build #${env.BUILD_NUMBER})
Triggered by: ${committer}

Selenium Test Results (Port 80):
---------------------------------------------------
${testResultsContent}
---------------------------------------------------

Deployment Status:
- Part-I (Port 80): Used for Testing
- Part-II (Port 8081): 
  - Status: Deployed (if success)
  - URL: http://65.2.129.230:8081
"""
                emailext(
                    to: committer,
                    subject: "BookVerse Build #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
                    body: emailBody
                )
            }
        }
    }
}
