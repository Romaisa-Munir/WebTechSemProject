pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
    }
    
    stages {
        stage('Cleanup Old Deployment') {
            steps {
                echo 'Taking down existing deployment on Port 8081...'
                sh 'docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml down || true'
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
                # Run tests and save results to file
                /home/ubuntu/venv/bin/python3 test_bookverse.py > test_results.txt 2>&1 || echo "Tests completed"
                cat test_results.txt
                '''
            }
        }

        stage('Deploy to Port 8081') {
            steps {
                echo 'Starting application containers on Port 8081...'
                sh '''
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml up -d --build
                    
                    echo 'Importing database data...'
                    sleep 60  # Wait for MongoDB

                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file /tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file /tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file /tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                    docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file /tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                '''
            }
        }

        stage('Verify Port 8081 Deployment') {
            steps {
                script {
                    def publicIp = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                    echo "Application deployed at http://${publicIp}:8081"
                    sh "docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps"
                }
            }
        }
    }
    
    post {
        always {
            script {
                // 1. Get Dynamic IP
                def publicIp = sh(script: "curl -s http://checkip.amazonaws.com", returnStdout: true).trim()
                
                // 2. Read test results
                def testResultsContent = sh(
                    script: "cat ${WORKSPACE}/tests/test_results.txt 2>/dev/null || echo 'Test results file not found.'",
                    returnStdout: true
                ).trim()
                
                // Get the email of the person who pushed
                def pusherEmail = sh(script: "git log -1 --pretty=format:'%ae'", returnStdout: true).trim()
                
                if (pusherEmail.contains("noreply.github.com")) {
                    echo "Detected private GitHub email. Redirecting to Romaisa."
                    pusherEmail = "romaisa.munir571@gmail.com"
                }

                def emailBody = """
Test Summary (Build #${env.BUILD_NUMBER})
------------------------------------------
Pushed by: ${pusherEmail}

Selenium Test Results (Port 80):
---------------------------------------------------
${testResultsContent}
---------------------------------------------------

Deployment Status:
- Part-I (Port 80): Used for Testing
- Part-II (Port 8081): 
  - URL: http://${publicIp}:8081
"""
                emailext(
                    to: pusherEmail,
                    subject: "BookVerse Build #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
                    body: emailBody
                )
            }
        }
    }
}
