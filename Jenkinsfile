pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        COMPOSE_FILE = "${WORKSPACE}/docker-compose-jenkins.yml"
        TEST_REPO = "https://github.com/Romaisa-Munir/bookverse-selenium-tests.git"
        APP_URL = "http://13.201.96.168:8081"
        API_URL = "http://13.201.96.168:5001"
    }
    
    stages {
        stage('Checkout Application Code') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
                    
                script {
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
                echo 'Stopping any existing Jenkins containers...'
                sh '''
                    cd ${WORKSPACE}
                    docker-compose -f docker-compose-jenkins.yml down || true
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
                    echo "API accessible at ${API_URL}"
                '''
            }
        }
        
        stage('Wait for Application') {
            steps {
                echo 'Waiting for application to be ready...'
                sh '''
                    echo "Waiting 40 seconds for application to start..."
                    sleep 40
                    
                    echo "Testing frontend accessibility..."
                    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL})
                    echo "Frontend status: $FRONTEND_STATUS"
                    
                    echo "Testing API accessibility..."
                    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/health || echo "000")
                    echo "API status: $API_STATUS"
                    
                    if [ "$FRONTEND_STATUS" != "200" ]; then
                        echo "⚠️  Frontend not responding properly"
                        docker logs jenkins-bookverse-web --tail 20
                    fi
                    
                    if [ "$API_STATUS" != "200" ]; then
                        echo "⚠️  API not responding properly"
                        docker logs jenkins-bookverse-api --tail 20
                    fi
                '''
            }
        }
        
        stage('Verify Inter-Container Communication') {
            steps {
                echo 'Testing container network connectivity...'
                sh '''
                    echo "Testing if frontend can reach API..."
                    docker exec jenkins-bookverse-web sh -c "wget -q -O- http://jenkins-bookverse-api:5001/api/health || echo 'Network issue detected'" || true
                    
                    echo "Testing if API can reach MongoDB..."
                    docker exec jenkins-bookverse-api sh -c "curl -s http://mongodb:27017 || echo 'MongoDB connection issue'" || true
                    
                    echo "Checking Docker network..."
                    docker network inspect bookverse-build-pipeline_jenkins-bookverse-network | grep -A 5 "jenkins-bookverse"
                '''
            }
        }
        
        stage('Create Test User') {
            steps {
                echo 'Creating test user for Selenium tests...'
                sh '''
                    echo "=========================================="
                    echo "Creating Fresh Test User"
                    echo "=========================================="
                    
                    # Delete test user if exists
                    echo "1. Removing any existing test user..."
                    docker exec jenkins-bookverse-mongodb mongosh bookverse --quiet --eval \
                        'db.users.deleteOne({email: "testuser@example.com"}); print("Old test user removed");' || true
                    
                    sleep 3
                    
                    # Create fresh test user
                    echo "2. Creating new test user via API..."
                    RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST ${API_URL}/api/user/register \
                        -H "Content-Type: application/json" \
                        -d '{"username":"testuser","email":"testuser@example.com","password":"testpass123"}')
                    
                    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
                    BODY=$(echo "$RESPONSE" | sed '$d')
                    
                    echo "   HTTP Response Code: $HTTP_CODE"
                    echo "   Response Body: $BODY"
                    
                    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
                        echo "   ✅ Test user created successfully"
                    elif [ "$HTTP_CODE" = "400" ]; then
                        echo "   ⚠️  User might already exist (400), continuing..."
                    else
                        echo "   ❌ Unexpected response code: $HTTP_CODE"
                        echo "   Response: $BODY"
                    fi
                    
                    # Verify user exists in database
                    echo "3. Verifying user in database..."
                    USER_EXISTS=$(docker exec jenkins-bookverse-mongodb mongosh bookverse --quiet --eval \
                        'db.users.findOne({email: "testuser@example.com"}) ? "YES" : "NO"')
                    echo "   User exists in DB: $USER_EXISTS"
                    
                    # CRITICAL: Test API login
                    sleep 2
                    echo "4. Testing API login..."
                    LOGIN_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST ${API_URL}/api/user/login \
                        -H "Content-Type: application/json" \
                        -d '{"email":"testuser@example.com","password":"testpass123"}')
                    
                    LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
                    LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
                    
                    echo "   Login HTTP Code: $LOGIN_CODE"
                    echo "   Login Response: $LOGIN_BODY"
                    
                    if echo "$LOGIN_BODY" | grep -q "token"; then
                        echo "   ✅✅✅ API LOGIN SUCCESSFUL! Token received ✅✅✅"
                        TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
                        echo "   Token (first 20 chars): ${TOKEN:0:20}..."
                    else
                        echo "   ❌❌❌ CRITICAL: API LOGIN FAILED! ❌❌❌"
                        echo "   This will cause ALL Selenium tests to fail!"
                        echo "   "
                        echo "   Debugging information:"
                        echo "   - Check API logs:"
                        docker logs jenkins-bookverse-api --tail 30
                        exit 1
                    fi
                    
                    echo "=========================================="
                    echo "Test User Setup Complete"
                    echo "=========================================="
                '''
            }
        }
        
        stage('Verify Frontend Configuration') {
            steps {
                echo 'Checking frontend API configuration...'
                sh '''
                    echo "Checking environment variables in frontend container..."
                    docker exec jenkins-bookverse-web env | grep -i api || echo "No API env vars found"
                    
                    echo "Checking if frontend has correct API configuration..."
                    docker exec jenkins-bookverse-web sh -c "find /usr/share/nginx/html -name '*.js' -exec grep -l 'api' {} \\; | head -5" || true
                '''
            }
        }
        
        stage('Checkout Test Code') {
            steps {
                echo 'Cloning test repository...'
                sh '''
                    # Use Docker to forcefully remove old directory
                    if [ -d "${WORKSPACE}/selenium-tests" ]; then
                        echo "Using Docker to clean old test directory..."
                        docker run --rm -v ${WORKSPACE}:/workspace alpine sh -c "rm -rf /workspace/selenium-tests"
                    fi
                    
                    # Fresh clone
                    git clone ${TEST_REPO} ${WORKSPACE}/selenium-tests
                '''
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests in Docker container...'
                script {
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        # Update config
                        sed -i "s|base.url=.*|base.url=${APP_URL}|g" src/test/resources/config.properties
                        
                        echo "=========================================="
                        echo "Test Configuration"
                        echo "=========================================="
                        cat src/test/resources/config.properties
                        echo "=========================================="
                        
                        # Create screenshots directory
                        mkdir -p target/screenshots
                    '''
                    
                    // Run tests with proper error handling
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        echo "Running Selenium tests..."
                        echo "This may take several minutes..."
                        
                        docker run --rm \
                            -v $(pwd):/tests \
                            -w /tests \
                            --network host \
                            -e MAVEN_OPTS="-Xmx1024m" \
                            markhobson/maven-chrome:latest \
                            mvn clean test -Dmaven.test.failure.ignore=false || {
                                echo "❌ Tests failed! Collecting debug information..."
                                
                                echo "=== Test Results ==="
                                cat target/surefire-reports/*.txt 2>/dev/null || echo "No test result files found"
                                
                                echo "=== Application Logs ==="
                                docker logs jenkins-bookverse-api --tail 50
                                docker logs jenkins-bookverse-web --tail 50
                                
                                exit 1
                            }
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
                def testResultsExist = fileExists 'selenium-tests/target/surefire-reports'
                def totalTests = 10
                def passedTests = 0
                def failedTests = 0
                
                if (testResultsExist) {
                    def testResults = junit allowEmptyResults: true, testResults: 'selenium-tests/target/surefire-reports/*.xml'
                    totalTests = testResults.totalCount ?: 10
                    passedTests = testResults.passCount ?: 0
                    failedTests = testResults.failCount ?: 0
                }
                
                emailext (
                    subject: "Jenkins Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        <html>
                        <body style="font-family: Arial, sans-serif;">
                            <h2 style="color: ${currentBuild.result == 'SUCCESS' ? '#28a745' : '#dc3545'};">
                                BookVerse Jenkins Pipeline Results
                            </h2>
                            
                            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Build Status:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; color: ${currentBuild.result == 'SUCCESS' ? '#28a745' : '#dc3545'};">
                                        <strong>${currentBuild.result}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Project:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${env.JOB_NAME}</td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Build Number:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">#${env.BUILD_NUMBER}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Triggered by:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${env.GIT_COMMITTER_EMAIL}</td>
                                </tr>
                            </table>
                            
                            <h3 style="color: #007bff; margin-top: 20px;">Test Summary</h3>
                            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total Tests:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${totalTests}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Passed:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; color: #28a745;">${passedTests}</td>
                                </tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Failed:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; color: #dc3545;">${failedTests}</td>
                                </tr>
                            </table>
                            
                            <p style="margin-top: 20px;">
                                <a href="${env.BUILD_URL}Selenium_20Test_20Report/" 
                                   style="background-color: #007bff; color: white; padding: 10px 20px; 
                                          text-decoration: none; border-radius: 5px; display: inline-block;">
                                    View Detailed Test Report
                                </a>
                            </p>
                            
                            <h3 style="color: #007bff; margin-top: 20px;">Deployment</h3>
                            <p>
                                <strong>Application URL:</strong> 
                                <a href="${APP_URL}">${APP_URL}</a>
                            </p>
                            <p>
                                <strong>API URL:</strong> 
                                <a href="${API_URL}">${API_URL}</a>
                            </p>
                            
                            <h3 style="color: #007bff; margin-top: 20px;">Links</h3>
                            <ul style="list-style-type: none; padding-left: 0;">
                                <li style="margin: 5px 0;">
                                    📊 <a href="${env.BUILD_URL}">Build Details</a>
                                </li>
                                <li style="margin: 5px 0;">
                                    📝 <a href="${env.BUILD_URL}console">Console Output</a>
                                </li>
                                <li style="margin: 5px 0;">
                                    🧪 <a href="${env.BUILD_URL}testReport">Test Results</a>
                                </li>
                            </ul>
                            
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; font-size: 12px;">
                                <em>Automated notification from Jenkins CI/CD Pipeline</em><br>
                                Build completed at: ${new Date()}
                            </p>
                        </body>
                        </html>
                    """,
                    to: "${env.GIT_COMMITTER_EMAIL}",
                    mimeType: 'text/html',
                    attachLog: currentBuild.result != 'SUCCESS'
                )
            }
        }
        
        success {
            echo '✅✅✅ Pipeline completed successfully! All tests passed! ✅✅✅'
        }
        
        failure {
            echo '❌❌❌ Pipeline failed. Check logs for details. ❌❌❌'
            sh '''
                echo "=== Container Status ==="
                docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                
                echo "=== API Logs ==="
                docker logs jenkins-bookverse-api --tail 100 || true
                
                echo "=== Frontend Logs ==="
                docker logs jenkins-bookverse-web --tail 100 || true
                
                echo "=== MongoDB Logs ==="
                docker logs jenkins-bookverse-mongodb --tail 50 || true
            '''
        }
    }
}
