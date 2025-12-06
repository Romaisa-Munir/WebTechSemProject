pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        COMPOSE_FILE = "${WORKSPACE}/docker-compose-jenkins.yml"
        TEST_REPO = "https://github.com/Romaisa-Munir/bookverse-selenium-tests.git"
        APP_URL = "http://13.201.96.168:8081"
    }
    
    stages {
        stage('Checkout Application Code') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
                    
                script {
                    // Get committer email for notifications
                    env.GIT_COMMITTER_EMAIL = sh(
                        script: 'git log -1 --pretty=format:"%ae"',
                        returnStdout: true
                    ).trim()
                    echo "Will send results to: ${env.GIT_COMMITTER_EMAIL}"
                }
            }
        }
        
        stage('Prepare Environment') {
            steps {
                echo 'Copying docker-compose file...'
                sh '''
                    cp /home/ubuntu/jenkins-bookverse/docker-compose-jenkins.yml ${WORKSPACE}/
                '''
            }
        }
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping any existing Jenkins containers and removing volumes...'
                sh '''
                    cd ${WORKSPACE}
                    # Added -v to remove volumes and force a fresh data import
                    docker-compose -f docker-compose-jenkins.yml down -v || true
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh '''
                    cd ${WORKSPACE}
                    docker-compose -f docker-compose-jenkins.yml up -d
                '''
            }
        }
        
        stage('Import Database') {
            steps {
                echo 'Importing database data...'
                sh '''
                    sleep 10
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection books \
                        --file /tmp/db_files/BOOKVERSE.books.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection genres \
                        --file /tmp/db_files/BOOKVERSE.genres.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection users \
                        --file /tmp/db_files/BOOKVERSE.users.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection wishlists \
                        --file /tmp/db_files/BOOKVERSE.wishlists.json \
                        --jsonArray \
                        --drop || true
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                    echo "Application accessible at ${APP_URL}"
                '''
            }
        }
        
        stage('Wait for Application') {
            steps {
                echo 'Waiting for application to be ready...'
                sh '''
                    echo "Waiting 30 seconds for application to start..."
                    sleep 30
                    
                    # Check if application is accessible
                    curl -f ${APP_URL} || echo "Application may still be starting..."
                '''
            }
        }
        
        stage('Checkout Test Code') {
            steps {
                echo 'Cloning test repository...'
                dir('selenium-tests') {
                    git branch: 'main',
                        url: "${TEST_REPO}"
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests in Docker container...'
                script {
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        # Update the base URL in config.properties to point to deployed app
                        sed -i "s|base.url=.*|base.url=${APP_URL}|g" src/test/resources/config.properties
                        
                        echo "Updated config.properties:"
                        cat src/test/resources/config.properties
                    '''
                    
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        # Run tests in Docker
                        docker run --rm \
                            -v $(pwd):/tests \
                            -w /tests \
                            --network host \
                            markhobson/maven-chrome:jdk-17 \
                            mvn clean test
                        
                        # --- FIX START ---
                        # Fix permissions: Change ownership of target folder back to current user
                        # This uses a tiny alpine container to run chown without needing sudo on host
                        docker run --rm \
                            -v $(pwd):/tests \
                            alpine \
                            chown -R 1000:1000 /tests/target
                        # --- FIX END ---
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Archiving test results...'
            junit allowEmptyResults: true, testResults: 'selenium-tests/target/surefire-reports/*.xml'
            
            echo 'Publishing test reports...'
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'selenium-tests/target/surefire-reports',
                reportFiles: '*.html',
                reportName: 'Selenium Test Report'
            ])
            
            script {
                emailext (
                    subject: "Jenkins Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        <html>
                        <body>
                            <h2>BookVerse Jenkins Pipeline Results</h2>
                            <p><strong>Build Status:</strong> ${currentBuild.result}</p>
                            <p><strong>Project:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Triggered by:</strong> ${env.GIT_COMMITTER_EMAIL}</p>
                            
                            <h3>Test Summary</h3>
                            <p>Total Tests: 10 Selenium Test Cases</p>
                            <p><a href="${env.BUILD_URL}Selenium_20Test_20Report/">View Detailed Test Report</a></p>
                            
                            <h3>Deployment</h3>
                            <p>Application: <a href="${APP_URL}">${APP_URL}</a></p>
                            
                            <h3>Links</h3>
                            <ul>
                                <li><a href="${env.BUILD_URL}">Build Details</a></li>
                                <li><a href="${env.BUILD_URL}console">Console Output</a></li>
                            </ul>
                            
                            <hr>
                            <p><em>Automated notification from Jenkins CI/CD Pipeline</em></p>
                        </body>
                        </html>
                    """,
                    to: "${env.GIT_COMMITTER_EMAIL}",
                    mimeType: 'text/html',
                    attachLog: true
                )
            }
        }
        
        success {
            echo '✅ Pipeline completed successfully! All tests passed!'
        }
        
        failure {
            echo '❌ Pipeline failed. Check logs for details.'
            sh 'docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml logs || true'
        }
    }
}
